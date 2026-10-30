from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.models import ValidationIssue, DuplicateCase, Institution, User
from app.schemas.schemas import ValidationIssueResponse, DuplicateCaseResponse, DuplicateCaseResolve
from app.security.security import get_current_user, require_roles
from app.services.graph_service import IdentityGraphService
from app.services.anomaly_service import AnomalyService
from app.services.audit_service import AuditService
from app.services.cache_service import cache

router = APIRouter(prefix="/validation", tags=["Validation & Fraud Detection"])

@router.get("/issues", response_model=List[ValidationIssueResponse])
def get_validation_issues(
    institution_id: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ValidationIssue)
    if institution_id:
        query = query.filter(ValidationIssue.institution_id == institution_id)
    if severity:
        query = query.filter(ValidationIssue.severity == severity)
    return query.order_by(ValidationIssue.created_at.desc()).limit(100).all()

@router.get("/duplicates", response_model=List[DuplicateCaseResponse])
def get_duplicate_cases(db: Session = Depends(get_db)):
    cached = cache.get("duplicate_cases")
    if cached is not None:
        return cached

    cases = db.query(DuplicateCase).order_by(DuplicateCase.created_at.desc()).all()
    # Batch load institutions instead of N+1 queries
    inst_ids = set()
    for c in cases:
        inst_ids.add(c.primary_institution_id)
        inst_ids.add(c.secondary_institution_id)
    institutions = {i.id: i.name for i in db.query(Institution).filter(Institution.id.in_(list(inst_ids))).all()}

    results = []
    for c in cases:
        p_name = institutions.get(c.primary_institution_id, c.primary_institution_id)
        s_name = institutions.get(c.secondary_institution_id, c.secondary_institution_id)
        results.append(DuplicateCaseResponse(
            id=c.id,
            case_id=c.case_id,
            pseudonymous_id=c.pseudonymous_id,
            student_name=c.student_name,
            primary_institution_id=c.primary_institution_id,
            secondary_institution_id=c.secondary_institution_id,
            primary_institution_name=p_name,
            secondary_institution_name=s_name,
            academic_year=c.academic_year,
            detection_reason=c.detection_reason,
            evidence_summary=c.evidence_summary,
            severity=c.severity,
            review_status=c.review_status,
            resolution_notes=c.resolution_notes,
            created_at=c.created_at
        ))
    cache.set("duplicate_cases", results, ttl=60)
    return results

@router.post("/duplicates/{id}/resolve", response_model=DuplicateCaseResponse)
def resolve_duplicate_case(
    id: str,
    data: DuplicateCaseResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN"]))
):
    case = db.query(DuplicateCase).filter(DuplicateCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Duplicate case not found")

    case.review_status = data.resolution_status
    case.resolution_notes = data.resolution_notes
    db.commit()
    db.refresh(case)

    # Invalidate caches
    cache.clear("duplicate")
    cache.clear("identity_graph")
    cache.clear("national_overview")

    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="DUPLICATE_CASE_RESOLVED",
        description=f"Resolved case {case.case_id} as {data.resolution_status}: {data.resolution_notes}",
        institution_id=case.primary_institution_id
    )

    p_inst = db.query(Institution).filter(Institution.id == case.primary_institution_id).first()
    s_inst = db.query(Institution).filter(Institution.id == case.secondary_institution_id).first()

    return DuplicateCaseResponse(
        id=case.id,
        case_id=case.case_id,
        pseudonymous_id=case.pseudonymous_id,
        student_name=case.student_name,
        primary_institution_id=case.primary_institution_id,
        secondary_institution_id=case.secondary_institution_id,
        primary_institution_name=p_inst.name if p_inst else case.primary_institution_id,
        secondary_institution_name=s_inst.name if s_inst else case.secondary_institution_id,
        academic_year=case.academic_year,
        detection_reason=case.detection_reason,
        evidence_summary=case.evidence_summary,
        severity=case.severity,
        review_status=case.review_status,
        resolution_notes=case.resolution_notes,
        created_at=case.created_at
    )

@router.get("/graph")
def get_cross_institution_identity_graph(db: Session = Depends(get_db)):
    """Returns the NetworkX cross-institution identity graph for visual analytics with sub-10ms cache"""
    cached = cache.get("identity_graph")
    if cached is not None:
        return cached

    data = IdentityGraphService.build_cross_institution_graph(db)
    cache.set("identity_graph", data, ttl=60)
    return data

@router.post("/run")
def trigger_validation_run(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN"]))
):
    """Triggers end-to-end national anomaly detection and integrity checks"""
    alerts = AnomalyService.run_explainable_anomaly_detection(db)
    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="NATIONAL_INTEGRITY_SCAN",
        description=f"Executed national surveillance scan. Active anomaly alerts: {len(alerts)}"
    )
    return {
        "success": True,
        "message": f"National integrity scan completed. {len(alerts)} active alerts recorded.",
        "active_alerts_count": len(alerts)
    }
