import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.models import UploadBatch, UploadRowResult, ValidationIssue, Student, Enrolment, Program, User
from app.schemas.schemas import UploadBatchResponse, UploadRowResultResponse
from app.security.security import (
    get_current_user, require_roles, verify_institution_access,
    compute_apaar_lookup_hash, mask_apaar_id, compute_record_tamper_hash
)
from app.services.validation_service import ValidationService
from app.services.audit_service import AuditService
from app.services.cache_service import cache

router = APIRouter(prefix="/uploads", tags=["Bulk Uploads"])

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB limit

@router.post("/students", response_model=UploadBatchResponse)
async def upload_students_file(
    institution_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["AICTE_ADMIN", "INSTITUTION_ADMIN", "DATA_ENTRY_OFFICER"]))
):
    verify_institution_access(institution_id, current_user)

    filename = file.filename or ""
    if not (filename.endswith('.csv') or filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv or .xlsx file.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum permitted 15MB limit.")

    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content), dtype=str)
        else:
            df = pd.read_excel(io.BytesIO(content), dtype=str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    df = df.fillna("")

    # Standardize column headers
    column_mapping = {col.strip().lower().replace(" ", "_"): col for col in df.columns}
    required_fields = ["apaar_id", "student_id", "name", "program_code"]

    for req in required_fields:
        if req not in column_mapping:
            raise HTTPException(
                status_code=400,
                detail=f"Missing mandatory column: '{req}'. Required headers: apaar_id, student_id, name, program_code, seat_category, supernumerary_classification."
            )

    batch = UploadBatch(
        institution_id=institution_id,
        uploaded_by_user_id=current_user.id,
        file_name=filename,
        file_size=len(content),
        total_rows=len(df),
        processed_rows=0,
        successful_rows=0,
        failed_rows=0,
        status="PROCESSING"
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    successful = 0
    failed = 0

    for idx, row in df.iterrows():
        row_num = idx + 1
        row_dict = {k: str(row[orig_col]).strip() for k, orig_col in column_mapping.items()}

        clean_apaar = row_dict.get("apaar_id", "").replace(" ", "").strip()
        student_id_val = row_dict.get("student_id", "").strip()
        program_code_val = row_dict.get("program_code", "").strip()
        name_val = row_dict.get("name", "").strip()
        seat_cat = row_dict.get("seat_category", "REGULAR").strip().upper() or "REGULAR"
        supernumerary = row_dict.get("supernumerary_classification", "NONE").strip().upper() or "NONE"
        acad_year = row_dict.get("academic_year", "2024-25").strip() or "2024-25"
        admission_dt = row_dict.get("admission_date", "2024-08-01").strip() or "2024-08-01"

        # Validate Row
        is_valid, issues = ValidationService.validate_student_record(
            db,
            row_dict,
            institution_id,
            batch_id=batch.id
        )

        for issue in issues:
            vi = ValidationIssue(
                batch_id=batch.id,
                institution_id=institution_id,
                rule_code=issue["rule_code"],
                severity=issue["severity"],
                explanation=issue["explanation"],
                supporting_evidence=f"Row {row_num}: APAAR={mask_apaar_id(clean_apaar)}, Roll={student_id_val}",
                recommended_action=issue["action"]
            )
            db.add(vi)

        if not is_valid:
            failed += 1
            err_msg = "; ".join([i["explanation"] for i in issues if i["severity"] == "CRITICAL"])
            db.add(UploadRowResult(
                batch_id=batch.id,
                row_number=row_num,
                apaar_id=clean_apaar,
                status="ERROR",
                error_message=err_msg,
                raw_data=row_dict
            ))
        else:
            # Commit valid student record
            lookup_hash = compute_apaar_lookup_hash(clean_apaar)
            student = db.query(Student).filter(Student.apaar_lookup_hash == lookup_hash).first()

            if not student:
                student = Student(
                    apaar_id=clean_apaar,
                    apaar_lookup_hash=lookup_hash,
                    student_id=student_id_val,
                    name=name_val,
                    dob=row_dict.get("dob", "2004-01-01") or "2004-01-01",
                    gender=row_dict.get("gender", "Other") or "Other",
                    category=row_dict.get("category", "General") or "General"
                )
                db.add(student)
                db.flush()

            program = db.query(Program).filter(
                Program.institution_id == institution_id,
                (Program.program_code == program_code_val) | (Program.id == program_code_val)
            ).first()

            program_id = program.id if program else program_code_val

            tamper_hash = compute_record_tamper_hash(student.id, institution_id, program_id, student_id_val)
            enrolment = Enrolment(
                student_id=student.id,
                institution_id=institution_id,
                program_id=program_id,
                academic_year=acad_year,
                admission_date=admission_dt,
                enrolment_status="ACTIVE",
                seat_category=seat_cat,
                supernumerary_classification=supernumerary,
                tamper_hash=tamper_hash,
                submission_source=f"BATCH_UPLOAD_{batch.id[:8]}"
            )
            db.add(enrolment)

            db.add(UploadRowResult(
                batch_id=batch.id,
                row_number=row_num,
                apaar_id=clean_apaar,
                status="SUCCESS",
                error_message=None,
                raw_data=row_dict
            ))
            successful += 1

    batch.processed_rows = len(df)
    batch.successful_rows = successful
    batch.failed_rows = failed
    batch.status = "COMPLETED"
    db.commit()
    db.refresh(batch)

    AuditService.record_event(
        db,
        actor_username=current_user.username,
        actor_role=current_user.role,
        action="BULK_STUDENT_UPLOAD",
        description=f"Batch {batch.id} processed: {successful} successful, {failed} failed from {filename}",
        institution_id=institution_id
    )

    # Invalidate cached analytics and institutions
    cache.clear()

    return UploadBatchResponse(
        id=batch.id,
        institution_id=batch.institution_id,
        file_name=batch.file_name,
        file_size=batch.file_size,
        total_rows=batch.total_rows,
        processed_rows=batch.processed_rows,
        successful_rows=batch.successful_rows,
        failed_rows=batch.failed_rows,
        status=batch.status,
        created_at=batch.created_at,
        issues_count=failed
    )

@router.get("/{id}/status", response_model=UploadBatchResponse)
def get_upload_status(id: str, db: Session = Depends(get_db)):
    batch = db.query(UploadBatch).filter(UploadBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Upload batch not found")
    return batch

@router.get("/{id}/results", response_model=List[UploadRowResultResponse])
def get_upload_results(id: str, db: Session = Depends(get_db)):
    return db.query(UploadRowResult).filter(UploadRowResult.batch_id == id).all()

@router.get("/{id}/errors/download")
def download_errors_csv(id: str, db: Session = Depends(get_db)):
    batch = db.query(UploadBatch).filter(UploadBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Upload batch not found")

    failed_rows = db.query(UploadRowResult).filter(
        UploadRowResult.batch_id == id,
        UploadRowResult.status == "ERROR"
    ).all()

    output = io.StringIO()
    output.write("Row Number,APAAR ID,Status,Error Reason\n")
    for r in failed_rows:
        clean_apaar = mask_apaar_id(r.apaar_id or "")
        clean_err = (r.error_message or "").replace(",", ";")
        output.write(f"{r.row_number},{clean_apaar},{r.status},{clean_err}\n")

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=validation_errors_batch_{batch.id[:8]}.csv"}
    )
