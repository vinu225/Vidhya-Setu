import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models.models import Enrolment, Student, Institution, Program, User
from app.security.security import require_roles, mask_apaar_id

router = APIRouter(prefix="/reports", tags=["Regulatory Reports"])

def sanitize_csv_cell(val: str) -> str:
    """Prevent CSV Formula Injection"""
    s = str(val or "").strip()
    if s.startswith(('=', '+', '-', '@', '\t', '\r')):
        s = "'" + s
    return s.replace('"', '""')

@router.get("/enrolment")
def export_enrolment_report(
    institution_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "INSTITUTION_ADMIN", "AUDITOR"]))
):
    query = db.query(Enrolment).join(Student, Student.id == Enrolment.student_id)
    if institution_id:
        query = query.filter(Enrolment.institution_id == institution_id)

    enrolments = query.all()

    output = io.StringIO()
    output.write("Student ID,Masked APAAR,Student Name,Institution,Program,Academic Year,Seat Category,Supernumerary,Status,Tamper Hash\n")

    for e in enrolments:
        student = e.student
        inst = e.institution
        prog = e.program

        row = [
            sanitize_csv_cell(student.student_id),
            sanitize_csv_cell(mask_apaar_id(student.apaar_id)),
            sanitize_csv_cell(student.name),
            sanitize_csv_cell(inst.name if inst else ""),
            sanitize_csv_cell(prog.program_name if prog else ""),
            sanitize_csv_cell(e.academic_year),
            sanitize_csv_cell(e.seat_category),
            sanitize_csv_cell(e.supernumerary_classification),
            sanitize_csv_cell(e.enrolment_status),
            sanitize_csv_cell(e.tamper_hash or "")
        ]
        output.write(f'"{'","'.join(row)}"\n')

    output.seek(0)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=aicte_enrolment_report_{timestamp}.csv"}
    )

@router.get("/compliance")
def export_compliance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "AUDITOR"]))
):
    programs = db.query(Program).all()

    output = io.StringIO()
    output.write("Institution Code,Institution Name,State,Program Code,Program Name,Approved Intake,Admitted Regular,Regular Utilization %,TFW Admitted/Cap,EWS Admitted/Cap,NRI Admitted/Cap,Compliance Status\n")

    for p in programs:
        inst = p.institution
        enrs = db.query(Enrolment).filter(
            Enrolment.program_id == p.id,
            Enrolment.academic_year == p.academic_year,
            Enrolment.enrolment_status == "ACTIVE"
        ).all()

        regular_adm = sum(1 for e in enrs if e.seat_category == "REGULAR" or e.supernumerary_classification == "NONE")
        tfw_adm = sum(1 for e in enrs if e.supernumerary_classification == "TFW")
        ews_adm = sum(1 for e in enrs if e.supernumerary_classification == "EWS")
        nri_adm = sum(1 for e in enrs if e.supernumerary_classification == "NRI")

        util = round((regular_adm / max(p.approved_regular_intake, 1)) * 100, 1)
        status = "COMPLIANT"
        if regular_adm > p.approved_regular_intake:
            status = "NON_COMPLIANT_OVER_INTAKE"

        row = [
            sanitize_csv_cell(inst.official_code if inst else ""),
            sanitize_csv_cell(inst.name if inst else ""),
            sanitize_csv_cell(inst.state if inst else ""),
            sanitize_csv_cell(p.program_code),
            sanitize_csv_cell(p.program_name),
            str(p.approved_regular_intake),
            str(regular_adm),
            f"{util}%",
            f"{tfw_adm}/{p.tfw_quota or 0}",
            f"{ews_adm}/{p.ews_quota or 0}",
            f"{nri_adm}/{p.nri_quota or 0}",
            status
        ]
        output.write(f'"{'","'.join(row)}"\n')

    output.seek(0)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=aicte_regulatory_compliance_report_{timestamp}.csv"}
    )
