from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.db import get_database
from app.core.security import get_current_user
from app.models.schemas import (
    TransactionInitiateRequest,
    TransactionModel,
    serialize_doc
)
from app.services.finance.payments import process_transaction_state_machine

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/initiate", response_model=TransactionModel)
async def initiate_payment(
    req: TransactionInitiateRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["id"]

    if req.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deposit amount must be greater than zero."
        )

    txn = await process_transaction_state_machine(
        db=db,
        user_id=user_id,
        goal_id=req.goal_id,
        amount=req.amount,
        txn_type=req.type,
        destination=req.destination,
        idempotency_key=req.idempotency_key,
        simulate_failure=req.simulate_failure
    )
    return TransactionModel(**txn)

@router.get("", response_model=List[TransactionModel])
async def list_payments(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["id"]
    cursor = db.transactions.find({"user_id": user_id}).sort("created_at", -1)
    txns = []
    async for doc in cursor:
        txns.append(TransactionModel(**serialize_doc(doc)))
    return txns

@router.get("/{payment_id}", response_model=TransactionModel)
async def get_payment(payment_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["id"]
    try:
        p_oid = ObjectId(payment_id)
        txn = await db.transactions.find_one({"_id": p_oid, "user_id": user_id})
    except Exception:
        txn = await db.transactions.find_one({"_id": payment_id, "user_id": user_id})

    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")

    return TransactionModel(**serialize_doc(txn))
