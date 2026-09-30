from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId

from app.core.db import get_database
from app.models.schemas import SchemeModel, serialize_doc

router = APIRouter(prefix="/schemes", tags=["schemes"])

@router.get("", response_model=List[SchemeModel])
async def list_schemes(
    purpose: Optional[str] = Query(None, description="Filter by business purpose e.g. dairy, agriculture"),
    state: Optional[str] = Query(None, description="Filter by state e.g. Odisha, ALL"),
    level: Optional[str] = Query(None, description="Filter by level e.g. central, state, bank, ngo")
):
    db = get_database()
    query = {"is_active": True}

    if purpose:
        query["purpose"] = {"$in": [purpose.lower()]}
    if state and state.upper() != "ALL":
        query["applicable_states"] = {"$in": ["ALL", state]}
    if level:
        query["level"] = level.lower()

    cursor = db.schemes.find(query).sort("name", 1)
    schemes = []
    async for doc in cursor:
        schemes.append(SchemeModel(**serialize_doc(doc)))
    return schemes

@router.get("/{scheme_id}", response_model=SchemeModel)
async def get_scheme(scheme_id: str):
    db = get_database()
    try:
        s_oid = ObjectId(scheme_id)
        scheme = await db.schemes.find_one({"_id": s_oid})
    except Exception:
        scheme = await db.schemes.find_one({"_id": scheme_id})

    if not scheme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan scheme not found")

    return SchemeModel(**serialize_doc(scheme))
