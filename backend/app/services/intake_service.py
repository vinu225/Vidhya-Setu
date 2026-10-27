from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Program, Enrolment, Institution

class IntakeService:
    @staticmethod
    def calculate_program_intake(db: Session, program_id: str) -> Dict[str, Any]:
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            return {}

        enrolments = db.query(Enrolment).filter(
            Enrolment.program_id == program_id,
            Enrolment.academic_year == program.academic_year,
            Enrolment.enrolment_status == "ACTIVE"
        ).all()

        regular_admitted = sum(1 for e in enrolments if e.seat_category == "REGULAR" or e.supernumerary_classification == "NONE")
        tfw_admitted = sum(1 for e in enrolments if e.supernumerary_classification == "TFW")
        ews_admitted = sum(1 for e in enrolments if e.supernumerary_classification == "EWS")
        nri_admitted = sum(1 for e in enrolments if e.supernumerary_classification == "NRI")
        fn_oci_admitted = sum(1 for e in enrolments if e.supernumerary_classification == "FN_OCI")
        pmsss_admitted = sum(1 for e in enrolments if e.supernumerary_classification == "PMSSS")

        # Standard AICTE formula:
        # Regular-seat utilization = regular admitted students / approved regular intake * 100
        approved_intake = max(program.approved_regular_intake, 1)
        utilization = round((regular_admitted / approved_intake) * 100, 2)

        # Total applicable approved capacity
        total_capacity = (
            program.approved_regular_intake +
            (program.tfw_quota or 0) +
            (program.ews_quota or 0) +
            (program.nri_quota or 0) +
            (program.fn_oci_quota or 0) +
            (program.pmsss_quota or 0)
        )
        total_admitted = len(enrolments)

        status = "NORMAL"
        if regular_admitted > program.approved_regular_intake:
            status = "OVER_INTAKE_VIOLATION"
        elif utilization >= 95.0:
            status = "WARNING_HIGH_UTILIZATION"

        return {
            "program_id": program.id,
            "program_name": program.program_name,
            "program_code": program.program_code,
            "academic_year": program.academic_year,
            "approved_regular_intake": program.approved_regular_intake,
            "admitted_regular": regular_admitted,
            "regular_utilization_percent": utilization,
            "tfw_cap": program.tfw_quota or 0,
            "tfw_admitted": tfw_admitted,
            "ews_cap": program.ews_quota or 0,
            "ews_admitted": ews_admitted,
            "nri_cap": program.nri_quota or 0,
            "nri_admitted": nri_admitted,
            "fn_oci_cap": program.fn_oci_quota or 0,
            "fn_oci_admitted": fn_oci_admitted,
            "pmsss_cap": program.pmsss_quota or 0,
            "pmsss_admitted": pmsss_admitted,
            "total_approved_capacity": total_capacity,
            "total_admitted": total_admitted,
            "status": status
        }

    @staticmethod
    def get_institution_intake_overview(db: Session, institution_id: str) -> List[Dict[str, Any]]:
        programs = db.query(Program).filter(Program.institution_id == institution_id).all()
        return [IntakeService.calculate_program_intake(db, p.id) for p in programs]
