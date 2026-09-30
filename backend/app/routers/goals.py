from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.db import get_database
from app.core.security import get_current_user
from app.models.schemas import GoalModel, GoalCreate, GoalUpdate, serialize_doc

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("", response_model=List[GoalModel])
async def list_goals(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["id"]
    cursor = db.goals.find({"user_id": user_id}).sort("created_at", -1)
    goals = []
    async for doc in cursor:
        goals.append(GoalModel(**serialize_doc(doc)))
    return goals

@router.post("", response_model=GoalModel)
async def create_goal(
    goal_in: GoalCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)

    doc = {
        "user_id": user_id,
        "name": goal_in.name,
        "target_amount": round(float(goal_in.target_amount), 2),
        "saved_amount": 0.0,
        "monthly_contribution": round(float(goal_in.monthly_contribution), 2),
        "deadline": goal_in.deadline,
        "status": "active",
        "created_at": now
    }

    res = await db.goals.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return GoalModel(**doc)

@router.patch("/{goal_id}", response_model=GoalModel)
async def update_goal(
    goal_id: str,
    goal_up: GoalUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["id"]

    try:
        g_oid = ObjectId(goal_id)
        query = {"_id": g_oid, "user_id": user_id}
    except Exception:
        query = {"_id": goal_id, "user_id": user_id}

    existing = await db.goals.find_one(query)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    update_fields = {}
    if goal_up.name is not None:
        update_fields["name"] = goal_up.name
    if goal_up.target_amount is not None:
        update_fields["target_amount"] = round(float(goal_up.target_amount), 2)
    if goal_up.monthly_contribution is not None:
        update_fields["monthly_contribution"] = round(float(goal_up.monthly_contribution), 2)
    if goal_up.saved_amount is not None:
        update_fields["saved_amount"] = round(float(goal_up.saved_amount), 2)
    if goal_up.deadline is not None:
        update_fields["deadline"] = goal_up.deadline
    if goal_up.status is not None:
        update_fields["status"] = goal_up.status

    if update_fields:
        await db.goals.update_one(query, {"$set": update_fields})

    updated = await db.goals.find_one(query)
    return GoalModel(**serialize_doc(updated))
