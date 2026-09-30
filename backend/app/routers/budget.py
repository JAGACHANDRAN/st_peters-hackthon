from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.db import get_database
from app.core.security import get_current_user
from app.models.schemas import BudgetModel, BudgetCalculateRequest, serialize_doc
from app.services.finance.budget import calculate_budget_analysis

router = APIRouter(prefix="/budget", tags=["budget"])

@router.get("", response_model=Optional[BudgetModel])
async def get_latest_budget(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["id"]
    budget = await db.budgets.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not budget:
        return None
    return BudgetModel(**serialize_doc(budget))

@router.post("", response_model=BudgetModel)
async def save_budget(
    req: BudgetModel,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)

    # Compute suggested savings deterministically
    expenses_dict = [e.model_dump() for e in req.expenses]
    analysis = calculate_budget_analysis(req.income, expenses_dict)

    month = req.month or now.strftime("%Y-%m")

    doc = {
        "user_id": user_id,
        "month": month,
        "income": req.income,
        "expenses": expenses_dict,
        "suggested_savings": analysis["suggested_savings"],
        "created_at": now
    }

    # Upsert by user_id and month
    await db.budgets.update_one(
        {"user_id": user_id, "month": month},
        {"$set": doc},
        upsert=True
    )

    saved = await db.budgets.find_one({"user_id": user_id, "month": month})
    return BudgetModel(**serialize_doc(saved))

@router.post("/calculate")
async def calculate_budget(req: BudgetCalculateRequest):
    expenses_dict = [e.model_dump() for e in req.expenses]
    analysis = calculate_budget_analysis(req.income, expenses_dict)
    return analysis
