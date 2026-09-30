from datetime import datetime, timezone
from typing import Dict, Any, Optional
from bson import ObjectId
from app.services.finance.simulated_provider import SimulatedPaymentProvider


async def process_transaction_state_machine(
    db,
    user_id: str,
    goal_id: Optional[str],
    amount: float,
    txn_type: str,
    destination: str,
    idempotency_key: str,
    simulate_failure: bool = False
) -> Dict[str, Any]:
    """
    Executes transaction state machine:
    INITIATED -> PENDING -> SUCCESS | FAILED
    Guarantees idempotency and verifies provider confirmation before crediting goals.
    """
    # 1. Idempotency Check
    existing = await db.transactions.find_one({"idempotency_key": idempotency_key})
    if existing:
        existing["id"] = str(existing["_id"])
        return existing

    now = datetime.now(timezone.utc)
    # 2. State INITIATED
    txn_doc = {
        "user_id": user_id,
        "goal_id": goal_id,
        "type": txn_type,
        "amount": round(float(amount), 2),
        "destination": destination,
        "status": "INITIATED",
        "provider_ref": None,
        "idempotency_key": idempotency_key,
        "failure_reason": None,
        "created_at": now,
        "verified_at": None
    }
    insert_res = await db.transactions.insert_one(txn_doc)
    txn_id = insert_res.inserted_id

    # 3. State PENDING
    await db.transactions.update_one(
        {"_id": txn_id},
        {"$set": {"status": "PENDING"}}
    )

    # 4. Gateway simulation
    provider_res = SimulatedPaymentProvider.process_payment(
        amount=amount,
        destination=destination,
        simulate_failure=simulate_failure
    )

    # 5. Verification step
    verified_time = datetime.now(timezone.utc)
    if provider_res.get("status") == "SUCCESS":
        provider_ref = provider_res.get("provider_ref")
        await db.transactions.update_one(
            {"_id": txn_id},
            {"$set": {
                "status": "SUCCESS",
                "provider_ref": provider_ref,
                "verified_at": verified_time
            }}
        )

        # Increment goal saved amount only upon successful verification
        if goal_id:
            try:
                g_oid = ObjectId(goal_id)
                await db.goals.update_one(
                    {"_id": g_oid, "user_id": user_id},
                    {"$inc": {"saved_amount": round(float(amount), 2)}}
                )
            except Exception:
                await db.goals.update_one(
                    {"_id": goal_id, "user_id": user_id},
                    {"$inc": {"saved_amount": round(float(amount), 2)}}
                )

        final_doc = await db.transactions.find_one({"_id": txn_id})
        final_doc["id"] = str(final_doc["_id"])
        return final_doc
    else:
        failure_reason = provider_res.get("reason", "Payment failed during provider verification.")
        await db.transactions.update_one(
            {"_id": txn_id},
            {"$set": {
                "status": "FAILED",
                "failure_reason": failure_reason,
                "verified_at": verified_time
            }}
        )
        final_doc = await db.transactions.find_one({"_id": txn_id})
        final_doc["id"] = str(final_doc["_id"])
        return final_doc
