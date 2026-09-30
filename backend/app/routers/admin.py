from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.core.db import get_database
from app.core.security import get_current_admin
from app.models.schemas import SchemeModel, serialize_doc

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])

@router.get("/schemes", response_model=List[SchemeModel])
async def list_admin_schemes():
    db = get_database()
    cursor = db.schemes.find().sort("name", 1)
    schemes = []
    async for doc in cursor:
        schemes.append(SchemeModel(**serialize_doc(doc)))
    return schemes

@router.post("/schemes", response_model=SchemeModel)
async def create_scheme(scheme_in: SchemeModel):
    db = get_database()
    doc = scheme_in.model_dump(exclude={"id"})
    
    res = await db.schemes.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return SchemeModel(**doc)

@router.put("/schemes/{scheme_id}", response_model=SchemeModel)
async def update_scheme(scheme_id: str, scheme_up: SchemeModel):
    db = get_database()
    try:
        s_oid = ObjectId(scheme_id)
        query = {"_id": s_oid}
    except Exception:
        query = {"_id": scheme_id}

    existing = await db.schemes.find_one(query)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")

    update_doc = scheme_up.model_dump(exclude={"id"})
    await db.schemes.update_one(query, {"$set": update_doc})

    saved = await db.schemes.find_one(query)
    return SchemeModel(**serialize_doc(saved))

@router.delete("/schemes/{scheme_id}")
async def delete_scheme(scheme_id: str):
    db = get_database()
    try:
        s_oid = ObjectId(scheme_id)
        query = {"_id": s_oid}
    except Exception:
        query = {"_id": scheme_id}

    res = await db.schemes.delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found")

    return {"message": "Scheme deleted successfully"}
