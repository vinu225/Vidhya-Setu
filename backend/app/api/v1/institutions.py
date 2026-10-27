from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import Institution, Program, Enrolment, ValidationIssue, DuplicateCase, User
from app.schemas.schemas import InstitutionResponse, InstitutionCreate, ProgramResponse
from app.security.security import get_current_user, require_roles, verify_institution_access
from app.services.audit_service import AuditService

router = APIRouter(prefix="/institutions", tags=["Institutions"])

@router.get("", response_model=List[InstitutionResponse])
def get_institutions(db: Session = Depends(get_db)):
    institutions = db.query(Institution).all()
    results = []
    for inst in institutions:
        enrolled_count = db.query(Enrolment).filter(
            Enrolment.institution_id == inst.id,
            Enrolment.enrolment_status == "ACTIVE"
        ).count()

        issues_count = db.query(ValidationIssue).filter(
            ValidationIssue.institution_id == inst.id,
            ValidationIssue.status == "OPEN"
        ).count()

        dup_count = db.query(DuplicateCase).filter(
            (DuplicateCase.primary_institution_id == inst.id) | (DuplicateCase.secondary_institution_id == inst.id),
            DuplicateCase.review_status == "PENDING"
        ).count()

        results.append(InstitutionResponse(
            id=inst.id,
            official_code=inst.official_code,
            name=inst.name,
            state=inst.state,
            district=inst.district,
            approval_status=inst.approval_status,
            institution_type=inst.institution_type,
            nirf_rank=inst.nirf_rank,
            created_at=inst.created_at,
            programs=[ProgramResponse.model_validate(p) for p in inst.programs],
            enrolled_count=enrolled_count,
            active_anomalies_count=issues_count + dup_count
        ))
    return results

@router.get("/{id}", response_model=InstitutionResponse)
def get_institution(id: str, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    enrolled_count = db.query(Enrolment).filter(
        Enrolment.institution_id == inst.id,
        Enrolment.enrolment_status == "ACTIVE"
    ).count()

    issues_count = db.query(ValidationIssue).filter(
        ValidationIssue.institution_id == inst.id,
        ValidationIssue.status == "OPEN"
    ).count()

    return InstitutionResponse(
        id=inst.id,
        official_code=inst.official_code,
        name=inst.name,
        state=inst.state,
        district=inst.district,
        approval_status=inst.approval_status,
        institution_type=inst.institution_type,
        nirf_rank=inst.nirf_rank,
        created_at=inst.created_at,
        programs=[ProgramResponse.model_validate(p) for p in inst.programs],
        enrolled_count=enrolled_count,
        active_anomalies_count=issues_count
    )

@router.post("", response_model=InstitutionResponse)
def create_institution(
    data: InstitutionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN"]))
):
    existing = db.query(Institution).filter(Institution.official_code == data.official_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Institution with this official code already exists")

    inst = Institution(
        official_code=data.official_code,
        name=data.name,
        state=data.state,
        district=data.district,
        approval_status=data.approval_status,
        institution_type=data.institution_type,
        nirf_rank=data.nirf_rank
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)

    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="INSTITUTION_ONBOARDED",
        description=f"New institution {inst.name} ({inst.official_code}) approved and onboarded",
        institution_id=inst.id
    )

    return InstitutionResponse(
        id=inst.id,
        official_code=inst.official_code,
        name=inst.name,
        state=inst.state,
        district=inst.district,
        approval_status=inst.approval_status,
        institution_type=inst.institution_type,
        nirf_rank=inst.nirf_rank,
        created_at=inst.created_at,
        programs=[],
        enrolled_count=0,
        active_anomalies_count=0
    )
