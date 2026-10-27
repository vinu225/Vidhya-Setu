from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.models import Program, Institution, User
from app.schemas.schemas import ProgramResponse, ProgramCreate
from app.security.security import get_current_user, require_roles, verify_institution_access
from app.services.audit_service import AuditService

router = APIRouter(prefix="/programs", tags=["Programs"])

@router.get("", response_model=List[ProgramResponse])
def get_programs(institution_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Program)
    if institution_id:
        query = query.filter(Program.institution_id == institution_id)
    return query.all()

@router.get("/{id}", response_model=ProgramResponse)
def get_program(id: str, db: Session = Depends(get_db)):
    prog = db.query(Program).filter(Program.id == id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    return prog

@router.post("", response_model=ProgramResponse)
def create_program(
    data: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_institution_access(data.institution_id, current_user)
    inst = db.query(Institution).filter(Institution.id == data.institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Target institution not found")

    prog = Program(
        institution_id=data.institution_id,
        program_name=data.program_name,
        program_code=data.program_code,
        qualification_level=data.qualification_level,
        academic_year=data.academic_year,
        approved_regular_intake=data.approved_regular_intake,
        tfw_quota=data.tfw_quota,
        ews_quota=data.ews_quota,
        nri_quota=data.nri_quota,
        fn_oci_quota=data.fn_oci_quota,
        pmsss_quota=data.pmsss_quota,
        approval_reference=data.approval_reference
    )
    db.add(prog)
    db.commit()
    db.refresh(prog)

    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="PROGRAM_APPROVED",
        description=f"Approved program {prog.program_name} ({prog.program_code}) with regular intake {prog.approved_regular_intake}",
        institution_id=data.institution_id
    )

    return prog
