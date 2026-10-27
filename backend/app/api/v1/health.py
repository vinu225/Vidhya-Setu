from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("")
def health_check(db: Session = Depends(get_db)):
    db_status = "HEALTHY"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"UNHEALTHY: {str(e)}"

    return {
        "status": "UP",
        "service": "EduVerify AI Backend API",
        "database": db_status,
        "api_version": "v1.0.0-sih-26263"
    }

@router.get("/integrations")
def get_integration_health():
    return {
        "providers": [
            {
                "name": "APAAR Authority Verification Adapter",
                "type": "SYNTHETIC_MOCK_ADAPTER",
                "status": "OPERATIONAL",
                "disclaimer": "Ready for authorized production Ministry of Education OAuth2 keys."
            },
            {
                "name": "AICTE Approval Handbook Sync Adapter",
                "type": "SYNTHETIC_MOCK_ADAPTER",
                "status": "OPERATIONAL",
                "disclaimer": "Ready for AICTE Central Regulatory Gateway integration."
            },
            {
                "name": "Institution ERP Webhook Gateway",
                "type": "SYNTHETIC_MOCK_ADAPTER",
                "status": "OPERATIONAL",
                "supported_erps": ["SAP SLCM", "CollPoll", "ERPNext"]
            }
        ]
    }
