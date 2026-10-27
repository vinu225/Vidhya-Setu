import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import IssuedCredential, Student, Enrolment, Institution, Program
from app.security.security import sign_credential_payload, verify_credential_signature, mask_apaar_id

class CredentialService:
    @staticmethod
    def issue_credential(
        db: Session,
        student_id: str,
        enrolment_id: str
    ) -> IssuedCredential:
        student = db.query(Student).filter(Student.id == student_id).first()
        enrolment = db.query(Enrolment).filter(Enrolment.id == enrolment_id).first()
        if not student or not enrolment:
            raise ValueError("Student or Enrolment record not found.")

        institution = db.query(Institution).filter(Institution.id == enrolment.institution_id).first()
        program = db.query(Program).filter(Program.id == enrolment.program_id).first()

        # Check if already issued
        existing = db.query(IssuedCredential).filter(IssuedCredential.enrolment_id == enrolment_id).first()
        if existing and existing.status == "VALID":
            return existing

        credential_id = f"AICTE-VC-{uuid.uuid4().hex[:12].upper()}"
        issued_at = datetime.now(timezone.utc)
        expires_at = issued_at + timedelta(days=365 * 4)  # 4 years validity

        # Canonical claims payload to sign
        claims = {
            "credential_id": credential_id,
            "student_id": student.id,
            "roll_no": student.student_id,
            "institution_code": institution.official_code,
            "program_code": program.program_code,
            "academic_period": f"{enrolment.academic_year}-2028",
            "issued_at": issued_at.isoformat(),
            "expires_at": expires_at.isoformat()
        }
        canonical_str = json.dumps(claims, sort_keys=True)
        digital_signature = sign_credential_payload(canonical_str)

        cred = IssuedCredential(
            credential_id=credential_id,
            student_id=student.id,
            enrolment_id=enrolment.id,
            institution_id=institution.id,
            program_name=program.program_name,
            qualification=program.qualification_level,
            academic_period=f"{enrolment.academic_year}-2028",
            digital_signature=digital_signature,
            public_key_ref="AICTE-PUBKEY-ED25519-2024",
            issued_at=issued_at,
            expires_at=expires_at,
            status="VALID"
        )
        db.add(cred)
        db.commit()
        db.refresh(cred)
        return cred

    @staticmethod
    def verify_credential(
        db: Session,
        credential_id: Optional[str] = None,
        apaar_id: Optional[str] = None,
        selective_disclosure_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Cryptographic and status verification of demonstration credentials.
        Implements DPDP Act 2023 Selective Disclosure Mode.
        """
        now = datetime.now(timezone.utc)

        # Lookup by credential_id or apaar_id
        cred = None
        if credential_id:
            cred = db.query(IssuedCredential).filter(IssuedCredential.credential_id == credential_id).first()
        elif apaar_id:
            clean = apaar_id.replace(" ", "").strip()
            student = db.query(Student).filter(Student.apaar_id == clean).first()
            if student:
                cred = db.query(IssuedCredential).filter(IssuedCredential.student_id == student.id).first()

        if not cred:
            return {
                "is_valid": False,
                "status": "NOT_FOUND",
                "is_authentic_aicte_record": False,
                "message": "Credential reference not found in national AICTE registry.",
                "data_disclosed": {},
                "verified_at": now
            }

        # 1. Check Revocation
        if cred.status == "REVOKED":
            return {
                "is_valid": False,
                "status": "REVOKED",
                "is_authentic_aicte_record": False,
                "message": f"Credential was revoked on {cred.revoked_at}. Reason: {cred.revocation_reason or 'Regulatory sanction'}",
                "data_disclosed": {"credential_id": cred.credential_id},
                "verified_at": now
            }

        # 2. Check Expiry
        if cred.expires_at and cred.expires_at.replace(tzinfo=timezone.utc) < now:
            return {
                "is_valid": False,
                "status": "EXPIRED",
                "is_authentic_aicte_record": False,
                "message": "Credential has expired.",
                "data_disclosed": {"credential_id": cred.credential_id},
                "verified_at": now
            }

        # 3. Cryptographic Signature Validation
        student = db.query(Student).filter(Student.id == cred.student_id).first()
        enrolment = db.query(Enrolment).filter(Enrolment.id == cred.enrolment_id).first()
        institution = db.query(Institution).filter(Institution.id == cred.institution_id).first()
        program = db.query(Program).filter(Program.id == enrolment.program_id).first() if enrolment else None

        claims = {
            "credential_id": cred.credential_id,
            "student_id": cred.student_id,
            "roll_no": student.student_id if student else "",
            "institution_code": institution.official_code if institution else "",
            "program_code": program.program_code if program else "",
            "academic_period": cred.academic_period,
            "issued_at": cred.issued_at.isoformat(),
            "expires_at": cred.expires_at.isoformat() if cred.expires_at else ""
        }
        canonical_str = json.dumps(claims, sort_keys=True)
        is_signature_valid = verify_credential_signature(canonical_str, cred.digital_signature)

        if not is_signature_valid:
            return {
                "is_valid": False,
                "status": "INVALID_SIGNATURE",
                "is_authentic_aicte_record": False,
                "message": "Cryptographic signature check failed! Payload has been altered or tampered.",
                "data_disclosed": {},
                "verified_at": now
            }

        # 4. Prepare Response Data respecting DPDP Act 2023 Minimum Disclosure
        if selective_disclosure_mode:
            # Privacy-Preserving Mode (Zero-Knowledge style verifiable assertion)
            data_disclosed = {
                "credential_id": cred.credential_id,
                "is_active_enrolment": enrolment.enrolment_status == "ACTIVE" if enrolment else False,
                "institution_approved_by_aicte": institution.approval_status == "APPROVED" if institution else False,
                "qualification_level": cred.qualification,
                "academic_period": cred.academic_period,
                "public_key_ref": cred.public_key_ref,
                "privacy_standard": "DPDP_ACT_2023_MINIMUM_DISCLOSURE_PRESERVED"
            }
        else:
            # Full Authorized Institutional / Employer Verification Mode
            data_disclosed = {
                "credential_id": cred.credential_id,
                "student_name": student.name if student else "N/A",
                "masked_apaar": mask_apaar_id(student.apaar_id) if student else "N/A",
                "institutional_roll_no": student.student_id if student else "N/A",
                "institution_name": institution.name if institution else "N/A",
                "institution_code": institution.official_code if institution else "N/A",
                "program_name": cred.program_name,
                "qualification": cred.qualification,
                "academic_period": cred.academic_period,
                "enrolment_status": enrolment.enrolment_status if enrolment else "ACTIVE",
                "seat_category": enrolment.seat_category if enrolment else "REGULAR",
                "tamper_proof_seal": enrolment.tamper_hash if enrolment else None,
                "public_key_ref": cred.public_key_ref
            }

        return {
            "is_valid": True,
            "status": "VALID",
            "is_authentic_aicte_record": True,
            "message": "Authentic AICTE credential verified with cryptographic digital signature.",
            "data_disclosed": data_disclosed,
            "tamper_proof_seal": enrolment.tamper_hash if enrolment else "SEAL-AICTE-REG-VALID",
            "verified_at": now
        }
