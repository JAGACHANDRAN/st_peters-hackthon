from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.db import get_database
from app.core.security import get_current_user
from app.models.schemas import (
    EligibilityCheckRequest,
    EligibilityCheckResponse,
    SchemeEligibilityItem,
    serialize_doc
)
from app.services.finance.eligibility import evaluate_scheme_eligibility
from app.services.ollama_client import explain_scheme_eligibility

router = APIRouter(prefix="/eligibility", tags=["eligibility"])

@router.post("/check", response_model=EligibilityCheckResponse)
async def check_eligibility(
    req: EligibilityCheckRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["id"]

    # 1. Fetch user's financial profile
    profile = await db.profiles.find_one({"user_id": user_id})
    if not profile:
        profile = {"user_id": user_id, "monthly_income": 0.0}

    # 2. Fetch target scheme(s)
    schemes_to_check = []
    if req.scheme_id:
        try:
            s_oid = ObjectId(req.scheme_id)
            scheme = await db.schemes.find_one({"_id": s_oid})
        except Exception:
            scheme = await db.schemes.find_one({"_id": req.scheme_id})
        if not scheme:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")
        schemes_to_check.append(scheme)
    else:
        cursor = db.schemes.find({"is_active": True})
        async for doc in cursor:
            schemes_to_check.append(doc)

    if not schemes_to_check:
        return EligibilityCheckResponse(results=[])

    results: List[SchemeEligibilityItem] = []
    now = datetime.now(timezone.utc)

    for scheme in schemes_to_check:
        eval_res = evaluate_scheme_eligibility(
            profile=profile,
            scheme=scheme,
            requested_amount=req.requested_amount,
            tenure_months=req.tenure_months
        )

        # AI plain-language explanation (with automatic deterministic fallback)
        ai_exp = await explain_scheme_eligibility(
            scheme_data=eval_res,
            repayment_data=eval_res["repayment"]
        )

        item = SchemeEligibilityItem(
            scheme_id=eval_res["scheme_id"],
            scheme_name=eval_res["scheme_name"],
            short_name=eval_res["short_name"],
            provider=eval_res["provider"],
            verdict=eval_res["verdict"],
            matched_rules=eval_res["matched_rules"],
            failed_rules=eval_res["failed_rules"],
            missing_info=eval_res["missing_info"],
            suggested_amount=eval_res.get("suggested_amount"),
            interest_rate_used=eval_res["interest_rate_used"],
            emi=eval_res["emi"],
            repayment=eval_res["repayment"],
            ai_explanation=ai_exp
        )
        results.append(item)

        # Record in eligibility_results history collection
        history_doc = {
            "user_id": user_id,
            "scheme_id": eval_res["scheme_id"],
            "verdict": eval_res["verdict"],
            "matched_rules": eval_res["matched_rules"],
            "failed_rules": eval_res["failed_rules"],
            "missing_info": eval_res["missing_info"],
            "requested_amount": req.requested_amount,
            "tenure_months": req.tenure_months,
            "interest_rate_used": eval_res["interest_rate_used"],
            "emi": eval_res["emi"],
            "repayment": eval_res["repayment"],
            "ai_explanation": ai_exp.model_dump(),
            "created_at": now
        }
        await db.eligibility_results.insert_one(history_doc)

    return EligibilityCheckResponse(results=results)

@router.get("/history")
async def get_eligibility_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 10
):
    db = get_database()
    user_id = current_user["id"]
    cursor = db.eligibility_results.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    items = []
    async for doc in cursor:
        items.append(serialize_doc(doc))
    return items
