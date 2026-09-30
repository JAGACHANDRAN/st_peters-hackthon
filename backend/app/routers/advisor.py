from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.db import get_database
from app.core.security import get_current_user
from app.models.schemas import AdvisorChatRequest, ChatMessageModel, serialize_doc
from app.services.ollama_client import chat_with_advisor

router = APIRouter(prefix="/advisor", tags=["advisor"])

@router.post("/chat")
async def chat(
    req: AdvisorChatRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)

    # 1. Fetch user profile for high-level sanitized context
    profile = await db.profiles.find_one({"user_id": user_id}) or {}
    user_context = {
        "gender": profile.get("gender", "female"),
        "state": profile.get("state", "India"),
        "area": profile.get("area", "rural"),
        "monthly_income": profile.get("monthly_income", 0),
        "business_type": profile.get("business", {}).get("type", "enterprise")
    }

    # 2. Fetch past conversation history
    cursor = db.chat_messages.find({"user_id": user_id}).sort("created_at", 1).limit(10)
    history = []
    async for doc in cursor:
        history.append({"role": doc.get("role"), "content": doc.get("content")})

    # 3. Save user's incoming message
    user_msg_doc = {
        "user_id": user_id,
        "role": "user",
        "content": req.message,
        "created_at": now
    }
    await db.chat_messages.insert_one(user_msg_doc)

    # 4. Generate AI Advisor response
    reply_text = await chat_with_advisor(
        user_message=req.message,
        chat_history=history,
        user_context=user_context
    )

    # 5. Save assistant reply
    reply_now = datetime.now(timezone.utc)
    assistant_msg_doc = {
        "user_id": user_id,
        "role": "assistant",
        "content": reply_text,
        "created_at": reply_now
    }
    await db.chat_messages.insert_one(assistant_msg_doc)

    return {
        "reply": reply_text,
        "created_at": reply_now
    }

@router.get("/history", response_model=List[ChatMessageModel])
async def get_history(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = current_user["id"]
    cursor = db.chat_messages.find({"user_id": user_id}).sort("created_at", 1).limit(50)
    messages = []
    async for doc in cursor:
        messages.append(ChatMessageModel(**serialize_doc(doc)))
    return messages
