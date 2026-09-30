import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import connect_to_mongo, close_mongo_connection
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.budget import router as budget_router
from app.routers.goals import router as goals_router
from app.routers.schemes import router as schemes_router
from app.routers.eligibility import router as eligibility_router
from app.routers.advisor import router as advisor_router
from app.routers.payments import router as payments_router
from app.routers.learn import router as learn_router
from app.routers.admin import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("finance-platform")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connected to MongoDB Atlas Cloud Cluster
    logger.info("Initializing Finance Empowerment Platform Backend...")
    await connect_to_mongo()
    yield
    logger.info("Shutting down Finance Empowerment Platform Backend...")
    await close_mongo_connection()

app = FastAPI(
    title="Finance Empowerment Platform API",
    description="Accessible financial empowerment backend for rural women entrepreneurs in India",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "app": "Finance Empowerment Platform",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/debug/db-status", tags=["debug"])
async def debug_db_status():
    from app.core.db import db_manager
    client_name = db_manager.client.__class__.__name__ if db_manager.client else "None"
    is_mock = "mock" in client_name.lower()
    return {
        "client_type": client_name,
        "is_mock": is_mock,
        "mongodb_uri": settings.MONGODB_URI[:30] + "..." if settings.MONGODB_URI else None,
        "db_name": settings.DB_NAME
    }

# Register all API routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(budget_router, prefix="/api")
app.include_router(goals_router, prefix="/api")
app.include_router(schemes_router, prefix="/api")
app.include_router(eligibility_router, prefix="/api")
app.include_router(advisor_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(learn_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
