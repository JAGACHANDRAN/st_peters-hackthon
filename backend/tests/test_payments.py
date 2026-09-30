import pytest
from mongomock_motor import AsyncMongoMockClient
from app.services.finance.payments import process_transaction_state_machine


@pytest.mark.asyncio
async def test_payment_success_credits_goal():
    client = AsyncMongoMockClient()
    db = client["test_finance"]

    # Create dummy goal
    g_res = await db.goals.insert_one({
        "user_id": "user123",
        "name": "Dairy Buffalo Savings",
        "target_amount": 20000.0,
        "saved_amount": 1000.0
    })
    goal_id = str(g_res.inserted_id)

    # Process successful payment
    txn = await process_transaction_state_machine(
        db=db,
        user_id="user123",
        goal_id=goal_id,
        amount=1500.0,
        txn_type="SAVINGS_TRANSFER",
        destination="Dairy Savings Account",
        idempotency_key="idemp-key-001",
        simulate_failure=False
    )

    assert txn["status"] == "SUCCESS"
    assert txn["provider_ref"] is not None
    assert txn["verified_at"] is not None

    # Check goal is updated
    updated_goal = await db.goals.find_one({"_id": g_res.inserted_id})
    assert updated_goal["saved_amount"] == 2500.0


@pytest.mark.asyncio
async def test_payment_failure_does_not_credit_goal():
    client = AsyncMongoMockClient()
    db = client["test_finance"]

    g_res = await db.goals.insert_one({
        "user_id": "user123",
        "name": "Dairy Buffalo Savings",
        "target_amount": 20000.0,
        "saved_amount": 1000.0
    })
    goal_id = str(g_res.inserted_id)

    txn = await process_transaction_state_machine(
        db=db,
        user_id="user123",
        goal_id=goal_id,
        amount=1500.0,
        txn_type="SAVINGS_TRANSFER",
        destination="Dairy Savings Account",
        idempotency_key="idemp-key-failed",
        simulate_failure=True
    )

    assert txn["status"] == "FAILED"
    assert txn["failure_reason"] is not None

    # Goal remains unchanged
    updated_goal = await db.goals.find_one({"_id": g_res.inserted_id})
    assert updated_goal["saved_amount"] == 1000.0


@pytest.mark.asyncio
async def test_idempotent_duplicate_request():
    client = AsyncMongoMockClient()
    db = client["test_finance"]

    g_res = await db.goals.insert_one({
        "user_id": "user123",
        "name": "Dairy Buffalo Savings",
        "target_amount": 20000.0,
        "saved_amount": 0.0
    })
    goal_id = str(g_res.inserted_id)

    # First request
    txn1 = await process_transaction_state_machine(
        db=db,
        user_id="user123",
        goal_id=goal_id,
        amount=500.0,
        txn_type="SAVINGS_TRANSFER",
        destination="Dairy Savings Account",
        idempotency_key="unique-idemp-999",
        simulate_failure=False
    )
    assert txn1["status"] == "SUCCESS"

    # Second duplicate request with identical key
    txn2 = await process_transaction_state_machine(
        db=db,
        user_id="user123",
        goal_id=goal_id,
        amount=500.0,
        txn_type="SAVINGS_TRANSFER",
        destination="Dairy Savings Account",
        idempotency_key="unique-idemp-999",
        simulate_failure=False
    )
    assert txn2["id"] == txn1["id"]

    # Goal balance was only credited once!
    updated_goal = await db.goals.find_one({"_id": g_res.inserted_id})
    assert updated_goal["saved_amount"] == 500.0
