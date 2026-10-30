from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api.v1 import (
    auth, institutions, programs, students, uploads,
    validation, analytics, credentials, reports, audit, health, copilot
)
from app.models.models import User
from app.security.security import get_password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial system users if empty
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "aicte_admin").first()
        if not admin_user:
            default_users = [
                User(
                    username="aicte_admin",
                    email="admin@aicte-india.org",
                    hashed_password=get_password_hash("Admin@123"),
                    role="AICTE_ADMIN"
                ),
                User(
                    username="auditor",
                    email="auditor@aicte-india.org",
                    hashed_password=get_password_hash("Auditor@123"),
                    role="AUDITOR"
                ),
                User(
                    username="verifier",
                    email="verifier@industry.org",
                    hashed_password=get_password_hash("Verifier@123"),
                    role="EXTERNAL_VERIFIER"
                )
            ]
            db.add_all(default_users)
            db.commit()
    finally:
        db.close()

    yield

app = FastAPI(
    title="Vidhya Setu — AICTE APAAR Student Verification Platform",
    description="SIH Problem Statement 26263 | Regulation Bureau | Smart Automation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(institutions.router, prefix=settings.API_V1_STR)
app.include_router(programs.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(uploads.router, prefix=settings.API_V1_STR)
app.include_router(validation.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(credentials.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": "Vidhya Setu — AICTE APAAR Platform",
        "problem_statement": "26263",
        "status": "ONLINE",
        "documentation": "/docs",
        "api_v1": settings.API_V1_STR
    }
