from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.models import AuditEvent, User
from app.schemas.schemas import AuditEventResponse
from app.security.security import require_roles

router = APIRouter(prefix="/audit", tags=["Audit Ledger"])

@router.get("/events", response_model=List[AuditEventResponse])
def get_audit_events(
    actor: Optional[str] = None,
    action: Optional[str] = None,
    institution_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "AUDITOR"]))
):
    query = db.query(AuditEvent)
    if actor:
        query = query.filter(AuditEvent.actor_username.ilike(f"%{actor}%"))
    if action:
        query = query.filter(AuditEvent.action.ilike(f"%{action}%"))
    if institution_id:
        query = query.filter(AuditEvent.institution_id == institution_id)

    return query.order_by(AuditEvent.created_at.desc()).limit(limit).all()
