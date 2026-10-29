from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.copilot_service import query_copilot, get_live_audit_context

router = APIRouter(prefix="/copilot", tags=["AICTE Auditor Co-Pilot"])

class CopilotQueryRequest(BaseModel):
    message: str = Field(..., description="Auditor natural language query")
    language: Optional[str] = Field("en", description="Selected UI regional language code")
    history: Optional[List[Dict[str, str]]] = Field(default=[], description="Previous conversation turns")

@router.post("/chat")
async def chat_with_copilot(req: CopilotQueryRequest, db: Session = Depends(get_db)):
    """Natural language audit & compliance query with Qwen 8B / live context fallback."""
    result = await query_copilot(
        query=req.message,
        language=req.language or "en",
        history=req.history or [],
        db=db
    )
    return result

@router.get("/context")
def get_copilot_context(db: Session = Depends(get_db)):
    """Get active compliance indicators used by the Co-Pilot."""
    ctx = get_live_audit_context(db)
    return {
        "status": "READY",
        "supported_models": ["qwen2.5:8b", "regulatory_ai_engine"],
        "context": ctx
    }
