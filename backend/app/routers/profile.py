from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.db import get_database
from app.core.security import get_current_user
from app.models.schemas import ProfileModel, serialize_doc

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("", response_model=ProfileModel)
async def get_profile(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["id"]
    profile = await db.profiles.find_one({"user_id": user_id})
    if not profile:
        # Return sensible defaults
        default_profile = ProfileModel(user_id=user_id)
        return default_profile
    return ProfileModel(**serialize_doc(profile))

@router.put("", response_model=ProfileModel)
async def update_profile(
    profile_data: ProfileModel,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)

    doc_data = profile_data.model_dump()
    doc_data["user_id"] = user_id
    doc_data["updated_at"] = now

    await db.profiles.update_one(
        {"user_id": user_id},
        {"$set": doc_data},
        upsert=True
    )

    # Mark user onboarding as complete
    try:
        user_oid = ObjectId(user_id)
        await db.users.update_one({"_id": user_oid}, {"$set": {"onboarding_complete": True}})
    except Exception:
        await db.users.update_one({"_id": user_id}, {"$set": {"onboarding_complete": True}})

    saved_profile = await db.profiles.find_one({"user_id": user_id})
    return ProfileModel(**serialize_doc(saved_profile))
