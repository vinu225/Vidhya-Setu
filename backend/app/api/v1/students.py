from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models.models import Student, Enrolment, Program, Institution, User, ValidationIssue
from app.schemas.schemas import StudentResponse, StudentCreate, EnrolmentResponse
from app.security.security import (
    get_current_user, require_roles, verify_institution_access,
    compute_apaar_lookup_hash, mask_apaar_id, compute_record_tamper_hash
)
from app.services.validation_service import ValidationService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("")
def get_students(
    institution_id: Optional[str] = None,
    program_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce institution isolation if institution-scoped user
    if current_user.role in ["INSTITUTION_ADMIN", "DATA_ENTRY_OFFICER"]:
        institution_id = current_user.institution_id

    query = db.query(Student).join(Enrolment, Enrolment.student_id == Student.id)

    if institution_id:
        query = query.filter(Enrolment.institution_id == institution_id)
    if program_id:
        query = query.filter(Enrolment.program_id == program_id)
    if status:
        query = query.filter(Enrolment.enrolment_status == status)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_term)) |
            (Student.student_id.ilike(search_term)) |
            (Student.apaar_id.ilike(search_term))
        )

    total_count = query.distinct().count()
    students = query.distinct().offset(skip).limit(limit).all()

    results = []
    for s in students:
        current_enr = db.query(Enrolment).filter(
            Enrolment.student_id == s.id
        ).order_by(Enrolment.created_at.desc()).first()

        enr_resp = None
        if current_enr:
            inst = db.query(Institution).filter(Institution.id == current_enr.institution_id).first()
            prog = db.query(Program).filter(Program.id == current_enr.program_id).first()
            enr_resp = EnrolmentResponse(
                id=current_enr.id,
                student_id=current_enr.student_id,
                institution_id=current_enr.institution_id,
                program_id=current_enr.program_id,
                academic_year=current_enr.academic_year,
                admission_date=current_enr.admission_date,
                enrolment_status=current_enr.enrolment_status,
                seat_category=current_enr.seat_category,
                is_nri=current_enr.is_nri,
                is_oci=current_enr.is_oci,
                is_fn=current_enr.is_fn,
                supernumerary_classification=current_enr.supernumerary_classification,
                tamper_hash=current_enr.tamper_hash,
                created_at=current_enr.created_at,
                institution_name=inst.name if inst else current_enr.institution_id,
                program_name=prog.program_name if prog else current_enr.program_id
            )

        results.append(StudentResponse(
            id=s.id,
            apaar_id_masked=mask_apaar_id(s.apaar_id),
            student_id=s.student_id,
            name=s.name,
            dob=s.dob,
            gender=s.gender,
            category=s.category,
            created_at=s.created_at,
            current_enrolment=enr_resp
        ))

    return {
        "total": total_count,
        "page": (skip // limit) + 1,
        "limit": limit,
        "items": results
    }

@router.get("/{id}")
def get_student(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    enrolments = db.query(Enrolment).filter(Enrolment.student_id == student.id).all()
    # Check authorization on institution
    if current_user.role in ["INSTITUTION_ADMIN", "DATA_ENTRY_OFFICER"]:
        user_inst_enrs = [e for e in enrolments if e.institution_id == current_user.institution_id]
        if not user_inst_enrs:
            raise HTTPException(status_code=403, detail="Access denied to student records outside your institution.")

    enrolment_history = []
    for e in enrolments:
        inst = db.query(Institution).filter(Institution.id == e.institution_id).first()
        prog = db.query(Program).filter(Program.id == e.program_id).first()
        enrolment_history.append({
            "id": e.id,
            "institution_name": inst.name if inst else e.institution_id,
            "program_name": prog.program_name if prog else e.program_id,
            "academic_year": e.academic_year,
            "admission_date": e.admission_date,
            "enrolment_status": e.enrolment_status,
            "seat_category": e.seat_category,
            "supernumerary_classification": e.supernumerary_classification,
            "tamper_hash": e.tamper_hash,
            "created_at": e.created_at
        })

    return {
        "id": student.id,
        "apaar_id_masked": mask_apaar_id(student.apaar_id),
        "student_id": student.student_id,
        "name": student.name,
        "dob": student.dob,
        "gender": student.gender,
        "category": student.category,
        "created_at": student.created_at,
        "enrolments": enrolment_history
    }

@router.post("", response_model=StudentResponse)
def admit_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "INSTITUTION_ADMIN", "DATA_ENTRY_OFFICER"]))
):
    verify_institution_access(data.institution_id, current_user)

    # 1. Run Validation Engine
    clean_apaar = str(data.apaar_id).replace(" ", "").strip()
    row_dict = {
        "apaar_id": clean_apaar,
        "student_id": data.student_id,
        "program_code": data.program_id,
        "name": data.name,
        "seat_category": data.seat_category,
        "supernumerary_classification": data.supernumerary_classification,
        "academic_year": "2024-25"
    }
    is_valid, issues = ValidationService.validate_student_record(db, row_dict, data.institution_id)

    # Store any non-critical issues
    for issue in issues:
        vi = ValidationIssue(
            institution_id=data.institution_id,
            program_id=data.program_id,
            rule_code=issue["rule_code"],
            severity=issue["severity"],
            explanation=issue["explanation"],
            recommended_action=issue["action"]
        )
        db.add(vi)

    if not is_valid:
        critical_issues = [i["explanation"] for i in issues if i["severity"] == "CRITICAL"]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation Failed: {'; '.join(critical_issues)}"
        )

    # 2. Check if student already exists
    lookup_hash = compute_apaar_lookup_hash(clean_apaar)
    student = db.query(Student).filter(Student.apaar_lookup_hash == lookup_hash).first()

    if not student:
        student = Student(
            apaar_id=clean_apaar,
            apaar_lookup_hash=lookup_hash,
            student_id=data.student_id,
            name=data.name,
            dob=data.dob,
            gender=data.gender,
            category=data.category
        )
        db.add(student)
        db.flush()

    # 3. Create Enrolment
    tamper_hash = compute_record_tamper_hash(student.id, data.institution_id, data.program_id, data.student_id)
    enrolment = Enrolment(
        student_id=student.id,
        institution_id=data.institution_id,
        program_id=data.program_id,
        academic_year="2024-25",
        admission_date=data.admission_date,
        enrolment_status="ACTIVE",
        seat_category=data.seat_category,
        supernumerary_classification=data.supernumerary_classification,
        tamper_hash=tamper_hash,
        submission_source="SINGLE_STUDENT_FORM"
    )
    db.add(enrolment)
    db.commit()
    db.refresh(student)
    db.refresh(enrolment)

    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="STUDENT_ADMITTED",
        description=f"Admitted student {student.name} (Roll: {student.student_id}) into program {data.program_id}",
        institution_id=data.institution_id
    )

    inst = db.query(Institution).filter(Institution.id == data.institution_id).first()
    prog = db.query(Program).filter(Program.id == data.program_id).first()

    enr_resp = EnrolmentResponse(
        id=enrolment.id,
        student_id=enrolment.student_id,
        institution_id=enrolment.institution_id,
        program_id=enrolment.program_id,
        academic_year=enrolment.academic_year,
        admission_date=enrolment.admission_date,
        enrolment_status=enrolment.enrolment_status,
        seat_category=enrolment.seat_category,
        is_nri=enrolment.is_nri,
        is_oci=enrolment.is_oci,
        is_fn=enrolment.is_fn,
        supernumerary_classification=enrolment.supernumerary_classification,
        tamper_hash=enrolment.tamper_hash,
        created_at=enrolment.created_at,
        institution_name=inst.name if inst else data.institution_id,
        program_name=prog.program_name if prog else data.program_id
    )

    return StudentResponse(
        id=student.id,
        apaar_id_masked=mask_apaar_id(student.apaar_id),
        student_id=student.student_id,
        name=student.name,
        dob=student.dob,
        gender=student.gender,
        category=student.category,
        created_at=student.created_at,
        current_enrolment=enr_resp
    )

@router.patch("/{id}/corrections")
def correct_student(
    id: str,
    updates: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "INSTITUTION_ADMIN"]))
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if "name" in updates:
        student.name = updates["name"]
    if "dob" in updates:
        student.dob = updates["dob"]
    if "category" in updates:
        student.category = updates["category"]

    db.commit()
    db.refresh(student)

    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="STUDENT_RECORD_CORRECTED",
        description=f"Updated student record {student.name} (ID: {student.id})",
        institution_id=current_user.institution_id
    )

    return {"message": "Student record updated successfully", "student_id": student.id}
