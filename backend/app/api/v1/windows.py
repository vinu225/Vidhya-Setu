from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.security.security import require_roles, get_current_user
from app.services.audit_service import AuditService

router = APIRouter(prefix="/windows", tags=["Statutory Admission Windows & Cutoffs"])

# In-memory / persistent statutory window state
_WINDOW_STATE = {
    "academic_year": "2024-25",
    "status": "OPEN",  # "OPEN" or "LOCKED"
    "regular_cutoff": "2024-08-15T23:59:59Z",
    "supernumerary_cutoff": "2024-08-30T23:59:59Z",
    "lock_reason": "Statutory admission deadline pursuant to AICTE Approval Process Handbook (APH 2024-27) Clause 7.1.",
    "exceptions_allowed": True
}

_EXCEPTION_REQUESTS = [
    {
        "id": "REQ-EX-2024-001",
        "institution_id": "inst-dtu-001",
        "institution_name": "Delhi Technological University",
        "reason": "Special spot-round counselling regularization under state quota",
        "requested_seats": 12,
        "status": "APPROVED",
        "granted_by": "aicte_admin",
        "submitted_at": "2024-08-18T10:30:00Z"
    }
]

class ExceptionRequestPayload(BaseModel):
    institution_id: str
    institution_name: str
    reason: str = Field(..., description="Justification for post-lock regularization")
    requested_seats: int = Field(default=1, ge=1)

class WindowTogglePayload(BaseModel):
    status: str = Field(..., description="'OPEN' or 'LOCKED'")
    reason: Optional[str] = None

@router.get("/status")
def get_submission_window_status():
    """Returns statutory admission window state, deadline cutoffs, and regulatory citations."""
    return {
        **_WINDOW_STATE,
        "active_exceptions_count": len([r for r in _EXCEPTION_REQUESTS if r["status"] == "PENDING"]),
        "server_time": datetime.now(timezone.utc).isoformat()
    }

@router.post("/toggle")
def toggle_submission_window(
    payload: WindowTogglePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN"]))
):
    """Allows AICTE Administrators to lock or unlock national admission ingestion windows."""
    if payload.status not in ("OPEN", "LOCKED"):
        raise HTTPException(status_code=400, detail="Status must be 'OPEN' or 'LOCKED'")

    _WINDOW_STATE["status"] = payload.status
    if payload.reason:
        _WINDOW_STATE["lock_reason"] = payload.reason

    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="SUBMISSION_WINDOW_TOGGLE",
        description=f"AICTE Administrator set national admissions window to {payload.status}. Reason: {_WINDOW_STATE['lock_reason']}"
    )

    return {
        "success": True,
        "message": f"National admissions window successfully updated to {payload.status}.",
        "window": _WINDOW_STATE
    }

@router.get("/exceptions")
def get_exception_requests(
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "INSTITUTION_ADMIN"]))
):
    """Retrieves all pending and approved post-lock exception requests."""
    return _EXCEPTION_REQUESTS

@router.post("/request-exception")
def submit_post_lock_exception(
    req: ExceptionRequestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["INSTITUTION_ADMIN", "DATA_ENTRY_OFFICER"]))
):
    """Campus Administrators submit a formal regularization request after statutory cutoff."""
    new_req = {
        "id": f"REQ-EX-2024-{len(_EXCEPTION_REQUESTS)+1:03d}",
        "institution_id": req.institution_id,
        "institution_name": req.institution_name,
        "reason": req.reason,
        "requested_seats": req.requested_seats,
        "status": "PENDING",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    _EXCEPTION_REQUESTS.append(new_req)

    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="POST_LOCK_EXCEPTION_SUBMITTED",
        description=f"Post-lock exception requested for {req.requested_seats} seat(s). Justification: {req.reason}",
        institution_id=req.institution_id
    )

    return {
        "success": True,
        "message": "Statutory exception request lodged with AICTE Regulation Bureau.",
        "request": new_req
    }

def is_window_locked() -> bool:
    """Helper used by upload services to enforce admission cutoff."""
    return _WINDOW_STATE["status"] == "LOCKED"

