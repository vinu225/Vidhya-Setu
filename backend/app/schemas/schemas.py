from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_info: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: str
    institution_id: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Institution & Program Schemas ---
class ProgramBase(BaseModel):
    program_name: str
    program_code: str
    qualification_level: str = "UG"
    academic_year: str = "2024-25"
    approved_regular_intake: int
    tfw_quota: int = 3
    ews_quota: int = 6
    nri_quota: int = 3
    fn_oci_quota: int = 9
    pmsss_quota: int = 2
    approval_reference: Optional[str] = "AICTE/AB/2024-25/REG"

class ProgramCreate(ProgramBase):
    institution_id: str

class ProgramResponse(ProgramBase):
    id: str
    institution_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class InstitutionBase(BaseModel):
    official_code: str
    name: str
    state: str
    district: Optional[str] = None
    approval_status: str = "APPROVED"
    institution_type: str = "GOVERNMENT"
    nirf_rank: Optional[int] = None

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionResponse(InstitutionBase):
    id: str
    created_at: datetime
    programs: List[ProgramResponse] = []
    enrolled_count: Optional[int] = 0
    active_anomalies_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Student & Enrolment Schemas ---
class EnrolmentBase(BaseModel):
    academic_year: str = "2024-25"
    admission_date: str
    enrolment_status: str = "ACTIVE"
    seat_category: str = "REGULAR"
    is_nri: bool = False
    is_oci: bool = False
    is_fn: bool = False
    supernumerary_classification: str = "NONE"

class EnrolmentResponse(EnrolmentBase):
    id: str
    student_id: str
    institution_id: str
    program_id: str
    tamper_hash: Optional[str] = None
    created_at: datetime
    institution_name: Optional[str] = None
    program_name: Optional[str] = None

    class Config:
        from_attributes = True

class StudentCreate(BaseModel):
    apaar_id: str
    student_id: str  # Roll Number
    name: str
    dob: Optional[str] = "2004-01-01"
    gender: str = "Other"
    category: str = "General"
    institution_id: str
    program_id: str
    admission_date: str = "2024-08-01"
    seat_category: str = "REGULAR"
    supernumerary_classification: str = "NONE"

class StudentResponse(BaseModel):
    id: str
    apaar_id_masked: str
    student_id: str
    name: str
    dob: Optional[str]
    gender: str
    category: str
    created_at: datetime
    current_enrolment: Optional[EnrolmentResponse] = None

    class Config:
        from_attributes = True

# --- Validation & Upload Schemas ---
class ValidationIssueResponse(BaseModel):
    id: str
    batch_id: Optional[str]
    institution_id: Optional[str]
    program_id: Optional[str]
    rule_code: str
    severity: str
    explanation: str
    supporting_evidence: Optional[str]
    recommended_action: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class UploadBatchResponse(BaseModel):
    id: str
    institution_id: str
    file_name: str
    file_size: int
    total_rows: int
    processed_rows: int
    successful_rows: int
    failed_rows: int
    status: str
    created_at: datetime
    issues_count: Optional[int] = 0

    class Config:
        from_attributes = True

class UploadRowResultResponse(BaseModel):
    id: str
    row_number: int
    apaar_id: Optional[str]
    status: str
    error_message: Optional[str]
    raw_data: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True

# --- Duplicate Cases & Anomaly Alerts ---
class DuplicateCaseResponse(BaseModel):
    id: str
    case_id: str
    pseudonymous_id: str
    student_name: Optional[str]
    primary_institution_id: str
    secondary_institution_id: str
    primary_institution_name: Optional[str] = None
    secondary_institution_name: Optional[str] = None
    academic_year: str
    detection_reason: str
    evidence_summary: str
    severity: str
    review_status: str
    resolution_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DuplicateCaseResolve(BaseModel):
    resolution_status: str  # CONFIRMED_DUPLICATE, LEGITIMATE_TRANSFER, RESOLVED
    resolution_notes: str

class AnomalyAlertResponse(BaseModel):
    id: str
    alert_id: str
    alert_type: str
    severity: str
    title: str
    description: str
    anomaly_score: float
    triggering_features: Optional[Dict[str, Any]] = None
    affected_institutions: Optional[List[str]] = None
    status: str
    resolved_by: Optional[str]
    action_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AnomalyAlertResolve(BaseModel):
    action_notes: str

# --- Credentials & Verification ---
class CredentialIssueRequest(BaseModel):
    student_id: str
    enrolment_id: str

class CredentialResponse(BaseModel):
    credential_id: str
    student_name: str
    masked_apaar: str
    roll_no: str
    institution_name: str
    program_name: str
    qualification: str
    academic_period: str
    digital_signature: str
    public_key_ref: str
    issued_at: datetime
    status: str
    verification_url: str

class CredentialVerifyRequest(BaseModel):
    credential_id: Optional[str] = None
    apaar_id: Optional[str] = None
    selective_disclosure_mode: bool = False

class VerificationResultResponse(BaseModel):
    is_valid: bool
    status: str  # VALID, INVALID_SIGNATURE, REVOKED, EXPIRED, NOT_FOUND
    is_authentic_aicte_record: bool
    message: str
    data_disclosed: Dict[str, Any]
    tamper_proof_seal: Optional[str] = None
    verified_at: datetime

# --- Audit & Analytics ---
class AuditEventResponse(BaseModel):
    id: str
    actor_username: str
    actor_role: str
    action: str
    description: str
    institution_id: Optional[str]
    ip_address: str
    tamper_hash: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class IntakeAnalyticsResponse(BaseModel):
    institution_id: str
    institution_name: str
    program_code: str
    program_name: str
    approved_regular_intake: int
    admitted_regular: int
    regular_utilization_percent: float
    tfw_cap: int
    tfw_admitted: int
    ews_cap: int
    ews_admitted: int
    nri_cap: int
    nri_admitted: int
    fn_oci_cap: int
    fn_oci_admitted: int
    pmsss_cap: int
    pmsss_admitted: int
    total_approved_capacity: int
    total_admitted: int
    status: str  # NORMAL, WARNING_HIGH_UTILIZATION, OVER_INTAKE_VIOLATION
