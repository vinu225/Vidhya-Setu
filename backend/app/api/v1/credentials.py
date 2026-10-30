from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
import io

from app.database import get_db
from app.models.models import IssuedCredential, Student, Enrolment, Institution, Program, User
from app.schemas.schemas import CredentialIssueRequest, CredentialVerifyRequest, VerificationResultResponse
from app.security.security import get_current_user, require_roles, mask_apaar_id
from app.services.credential_service import CredentialService
from app.services.audit_service import AuditService
from app.services.pdf_service import generate_enrolment_certificate_pdf

router = APIRouter(prefix="/credentials", tags=["Verifiable Credentials & QR Verification"])

@router.post("/issue")
def issue_student_credential(
    data: CredentialIssueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "INSTITUTION_ADMIN"]))
):
    try:
        cred = CredentialService.issue_credential(db, data.student_id, data.enrolment_id)
        student = db.query(Student).filter(Student.id == data.student_id).first()

        AuditService.record_event(
            db,
            actor_username=current_user.username,
            actor_role=current_user.role,
            action="CREDENTIAL_ISSUED",
            description=f"Issued cryptographically signed credential {cred.credential_id} for {student.name}",
            institution_id=cred.institution_id
        )

        return {
            "success": True,
            "message": "Credential issued and cryptographically signed successfully",
            "credential_id": cred.credential_id,
            "digital_signature": cred.digital_signature,
            "public_key_ref": cred.public_key_ref,
            "issued_at": cred.issued_at,
            "status": cred.status,
            "verification_url": f"/verify/{cred.credential_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify", response_model=VerificationResultResponse)
def verify_credential(
    data: CredentialVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Public or restricted verification endpoint.
    Performs asymmetric signature verification, expiration check, and revocation check.
    Supports DPDP Act 2023 Selective Disclosure Mode.
    """
    result = CredentialService.verify_credential(
        db,
        credential_id=data.credential_id,
        apaar_id=data.apaar_id,
        selective_disclosure_mode=data.selective_disclosure_mode
    )

    # Log public verification event without leaking raw credentials
    AuditService.record_event(
        db,
        actor_username="PUBLIC_OR_EMPLOYER_VERIFIER",
        actor_role="EXTERNAL_VERIFIER",
        action="CREDENTIAL_VERIFIED",
        description=f"Verification query: id={data.credential_id or 'APAAR_LOOKUP'}, Valid={result['is_valid']}, Mode={'ZKP_SELECTIVE' if data.selective_disclosure_mode else 'FULL'}"
    )

    return VerificationResultResponse(
        is_valid=result["is_valid"],
        status=result["status"],
        is_authentic_aicte_record=result["is_authentic_aicte_record"],
        message=result["message"],
        data_disclosed=result["data_disclosed"],
        tamper_proof_seal=result.get("tamper_proof_seal"),
        verified_at=result["verified_at"]
    )

@router.post("/{id}/revoke")
def revoke_credential(
    id: str,
    reason: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN"]))
):
    cred = db.query(IssuedCredential).filter(IssuedCredential.credential_id == id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")

    cred.status = "REVOKED"
    cred.revocation_reason = reason.get("reason", "Regulatory Sanction")
    db.commit()

    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="CREDENTIAL_REVOKED",
        description=f"Revoked credential {cred.credential_id}. Reason: {cred.revocation_reason}",
        institution_id=cred.institution_id
    )

    return {"message": "Credential revoked successfully", "credential_id": cred.credential_id}

@router.get("/certificate/{student_id}")
def download_enrolment_certificate(
    student_id: str,
    db: Session = Depends(get_db)
):
    """Generates an official, AICTE-stamped verifiable enrolment PDF certificate with embedded QR seal."""
    # Find student by ID or roll number
    student = db.query(Student).filter(
        (Student.id == student_id) | (Student.student_id == student_id)
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    enrolment = db.query(Enrolment).filter(
        Enrolment.student_id == student.id,
        Enrolment.enrolment_status == "ACTIVE"
    ).first()
    if not enrolment:
        # Fallback to any enrolment if no active
        enrolment = db.query(Enrolment).filter(Enrolment.student_id == student.id).first()
    if not enrolment:
        raise HTTPException(status_code=404, detail="No enrolment record found for this student")

    institution = db.query(Institution).filter(Institution.id == enrolment.institution_id).first()
    program = db.query(Program).filter(Program.id == enrolment.program_id).first()

    # Find or auto-issue credential
    cred = db.query(IssuedCredential).filter(IssuedCredential.enrolment_id == enrolment.id).first()
    if not cred:
        cred = CredentialService.issue_credential(db, student.id, enrolment.id)

    pdf_bytes = generate_enrolment_certificate_pdf(
        student_name=student.name,
        masked_apaar=mask_apaar_id(student.apaar_id),
        roll_number=student.student_id,
        institution_name=institution.name if institution else "Affiliated Technical University",
        institution_code=institution.official_code if institution else "AICTE-INST",
        program_name=program.program_name if program else "Bachelor of Technology",
        program_code=program.program_code if program else "BTECH",
        academic_year=enrolment.academic_year or "2024-25",
        seat_category=enrolment.seat_category or "REGULAR",
        credential_id=cred.credential_id,
        digital_signature=cred.digital_signature,
        public_key_ref=cred.public_key_ref,
        issued_at=cred.issued_at.strftime("%d %B %Y, %H:%M UTC") if cred.issued_at else None
    )

    filename = f"aicte_enrolment_certificate_{student.student_id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

