from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId

from app.core.db import get_database
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.models.schemas import UserRegister, UserLogin, TokenResponse, UserOut, serialize_doc

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
async def register(req: UserRegister):
    db = get_database()
    
    # Check if email or phone already registered
    if req.email:
        existing = await db.users.find_one({"email": req.email})
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")
    if req.phone:
        existing = await db.users.find_one({"phone": req.phone})
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number is already registered")

    now = datetime.now(timezone.utc)
    hashed_pwd = get_password_hash(req.password)
    user_doc = {
        "name": req.name,
        "email": req.email,
        "phone": req.phone,
        "password_hash": hashed_pwd,
        "role": "user",
        "language": req.language or "en",
        "onboarding_complete": False,
        "created_at": now
    }
    
    res = await db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    # Initialize empty profile placeholder
    await db.profiles.update_one(
        {"user_id": user_id},
        {"$setOnInsert": {
            "user_id": user_id,
            "monthly_income": 0.0,
            "monthly_household_expense": 0.0,
            "monthly_other_expense": 0.0,
            "existing_loans": [],
            "business": {
                "type": "dairy",
                "stage": "idea",
                "is_new_business": True,
                "is_micro_enterprise": True,
                "required_amount": 0.0,
                "own_contribution": 0.0,
                "expected_monthly_revenue": 0.0,
                "expected_monthly_cost": 0.0
            },
            "updated_at": now
        }},
        upsert=True
    )

    access_token = create_access_token(data={"sub": user_id, "role": "user"})
    user_doc["id"] = user_id

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut(**user_doc)
    )

@router.post("/login", response_model=TokenResponse)
async def login(req: UserLogin):
    db = get_database()
    identifier = req.identifier.strip()
    
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"phone": identifier}
        ]
    })
    
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone/email or password")

    user_id = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id, "role": user.get("role", "user")})
    user["id"] = user_id

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut(**user)
    )

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(**current_user)
