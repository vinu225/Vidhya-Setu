import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    official_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=True)
    approval_status = Column(String(50), default="APPROVED")  # APPROVED, UNDER_REVIEW, SUSPENDED
    institution_type = Column(String(50), default="GOVERNMENT")  # GOVERNMENT, PRIVATE, AIDED
    nirf_rank = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    programs = relationship("Program", back_populates="institution", cascade="all, delete-orphan")
    enrolments = relationship("Enrolment", back_populates="institution")
    users = relationship("User", back_populates="institution")

class Program(Base):
    __tablename__ = "programs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    program_name = Column(String(255), nullable=False)
    program_code = Column(String(50), nullable=False, index=True)
    qualification_level = Column(String(50), default="UG")  # UG, PG, DIPLOMA
    academic_year = Column(String(20), default="2024-25", index=True)
    approved_regular_intake = Column(Integer, nullable=False, default=60)
    
    # Supernumerary Quotas (Ceilings per AICTE APH Chapter II/IV)
    tfw_quota = Column(Integer, default=3)      # 5% of intake
    ews_quota = Column(Integer, default=6)      # 10% of intake
    nri_quota = Column(Integer, default=3)      # 5% of intake
    fn_oci_quota = Column(Integer, default=9)   # 15% of intake
    pmsss_quota = Column(Integer, default=2)    # J&K PMSSS special
    
    approval_reference = Column(String(100), default="AICTE/AB/2024-25/REG")
    effective_period = Column(String(50), default="2024-2027")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institution = relationship("Institution", back_populates="programs")
    enrolments = relationship("Enrolment", back_populates="program")

class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    # Protected 12-digit APAAR identifier and indexed lookup hash
    apaar_id = Column(String(20), nullable=False)
    apaar_lookup_hash = Column(String(64), index=True, nullable=False)
    student_id = Column(String(50), nullable=False, index=True)  # Institutional Roll Number
    name = Column(String(255), nullable=False)
    dob = Column(String(20), nullable=True)
    gender = Column(String(20), default="Other")
    category = Column(String(50), default="General")  # General, OBC, SC, ST, EWS
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    enrolments = relationship("Enrolment", back_populates="student", cascade="all, delete-orphan")
    issued_credentials = relationship("IssuedCredential", back_populates="student")

class Enrolment(Base):
    __tablename__ = "enrolments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    program_id = Column(String(36), ForeignKey("programs.id"), nullable=False, index=True)
    academic_year = Column(String(20), nullable=False, default="2024-25", index=True)
    admission_date = Column(String(20), nullable=False)
    enrolment_status = Column(String(50), default="ACTIVE")  # ACTIVE, EXITED, SUSPENDED, FLAGGED
    seat_category = Column(String(50), default="REGULAR")    # REGULAR, TFW, EWS, NRI, FN_OCI, PMSSS
    is_nri = Column(Boolean, default=False)
    is_oci = Column(Boolean, default=False)
    is_fn = Column(Boolean, default=False)
    supernumerary_classification = Column(String(50), default="NONE")  # NONE, TFW, EWS, NRI, FN_OCI, PMSSS
    submission_source = Column(String(50), default="PORTAL_UPLOAD")
    tamper_hash = Column(String(64), nullable=True)  # SHA-256 seal
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="enrolments")
    institution = relationship("Institution", back_populates="enrolments")
    program = relationship("Program", back_populates="enrolments")
    credential = relationship("IssuedCredential", uselist=False, back_populates="enrolment")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="DATA_ENTRY_OFFICER")
    # Roles: AICTE_ADMIN, INSTITUTION_ADMIN, DATA_ENTRY_OFFICER, AUDITOR, EXTERNAL_VERIFIER
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    institution = relationship("Institution", back_populates="users")

class UploadBatch(Base):
    __tablename__ = "upload_batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    uploaded_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)
    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    successful_rows = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    status = Column(String(50), default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    row_results = relationship("UploadRowResult", back_populates="batch", cascade="all, delete-orphan")
    validation_issues = relationship("ValidationIssue", back_populates="batch", cascade="all, delete-orphan")

class UploadRowResult(Base):
    __tablename__ = "upload_row_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("upload_batches.id"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    apaar_id = Column(String(20), nullable=True)
    status = Column(String(50), default="SUCCESS")  # SUCCESS, WARNING, ERROR
    error_message = Column(Text, nullable=True)
    raw_data = Column(JSON, nullable=True)

    batch = relationship("UploadBatch", back_populates="row_results")

class ValidationIssue(Base):
    __tablename__ = "validation_issues"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    batch_id = Column(String(36), ForeignKey("upload_batches.id"), nullable=True, index=True)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=True)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    program_id = Column(String(36), ForeignKey("programs.id"), nullable=True)
    rule_code = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW
    explanation = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    status = Column(String(20), default="OPEN")  # OPEN, RESOLVED, IGNORED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    batch = relationship("UploadBatch", back_populates="validation_issues")

class DuplicateCase(Base):
    __tablename__ = "duplicate_cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(50), unique=True, index=True, nullable=False)
    pseudonymous_id = Column(String(64), nullable=False, index=True)  # Masked APAAR or HMAC
    student_name = Column(String(255), nullable=True)
    primary_institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    secondary_institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    academic_year = Column(String(20), default="2024-25")
    detection_reason = Column(String(100), default="MULTI_INSTITUTION_ACTIVE_ENROLMENT")
    evidence_summary = Column(Text, nullable=False)
    severity = Column(String(20), default="CRITICAL")
    review_status = Column(String(50), default="PENDING")  # PENDING, CONFIRMED_DUPLICATE, LEGITIMATE_TRANSFER, RESOLVED
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    alert_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    anomaly_score = Column(Float, default=0.0)
    triggering_features = Column(JSON, nullable=True)
    affected_institutions = Column(JSON, nullable=True)
    status = Column(String(20), default="OPEN")  # OPEN, RESOLVED
    resolved_by = Column(String(100), nullable=True)
    action_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class IssuedCredential(Base):
    __tablename__ = "issued_credentials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    credential_id = Column(String(64), unique=True, index=True, nullable=False)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    enrolment_id = Column(String(36), ForeignKey("enrolments.id"), nullable=False)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    program_name = Column(String(255), nullable=False)
    qualification = Column(String(50), default="B.Tech")
    academic_period = Column(String(50), default="2024-2028")
    digital_signature = Column(Text, nullable=False)
    public_key_ref = Column(String(100), default="AICTE-PUBKEY-ED25519-2024")
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="VALID")  # VALID, REVOKED, EXPIRED
    revocation_reason = Column(Text, nullable=True)
    revoked_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="issued_credentials")
    enrolment = relationship("Enrolment", back_populates="credential")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_username = Column(String(100), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    institution_id = Column(String(36), nullable=True, index=True)
    ip_address = Column(String(45), default="127.0.0.1")
    tamper_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class IntegrationJob(Base):
    __tablename__ = "integration_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_name = Column(String(50), nullable=False)  # APAAR, AICTE, ERP
    job_type = Column(String(50), nullable=False)
    status = Column(String(20), default="SUCCESS")  # SUCCESS, FAILED, PENDING
    request_summary = Column(Text, nullable=True)
    response_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
