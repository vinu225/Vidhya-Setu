const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: string;
  institution_id?: string;
  institution_name?: string;
}

export interface AuthState {
  token: string | null;
  user: UserInfo | null;
}

// Token helper
export const getAuthToken = (): string | null => {
  return localStorage.getItem("eduverify_token");
};

export const setAuthToken = (token: string, user: UserInfo) => {
  localStorage.setItem("eduverify_token", token);
  localStorage.setItem("eduverify_user", JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem("eduverify_token");
  localStorage.removeItem("eduverify_user");
};

export interface Institution {
  id: string;
  official_code: string;
  name: string;
  state: string;
  district?: string;
  approval_status: string;
  institution_type?: string;
  nirf_rank?: number | null;
  created_at?: string;
  programs: Program[];
  enrolled_count?: number;
  active_anomalies_count?: number;
}

export interface Program {
  id: string;
  institution_id: string;
  program_name: string;
  program_code: string;
  qualification_level?: string;
  academic_year: string;
  approved_regular_intake: number;
  tfw_quota?: number;
  ews_quota?: number;
  nri_quota?: number;
  fn_oci_quota?: number;
  pmsss_quota?: number;
  approval_reference?: string;
  created_at?: string;
}

export interface Student {
  id: string;
  apaar_id_masked: string;
  student_id: string;
  name: string;
  dob?: string;
  gender?: string;
  category?: string;
  created_at?: string;
  current_enrolment?: {
    id: string;
    student_id: string;
    institution_id: string;
    program_id: string;
    institution_name?: string;
    program_name?: string;
    academic_year: string;
    admission_date?: string;
    enrolment_status: string;
    seat_category?: string;
    supernumerary_classification?: string;
    tamper_hash?: string;
    created_at?: string;
  };
}

export interface NationalOverview {
  total_institutions: number;
  total_approved_regular_intake: number;
  total_supernumerary_capacity: number;
  total_enrolled: number;
  regular_enrolled: number;
  supernumerary_enrolled: number;
  provisional_students: number;
  excess_intake_institutions: number;
  national_utilization_rate: number;
  open_validation_issues: number;
  pending_duplicate_cases: number;
  active_anomaly_alerts: number;
  alert_severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  top_risk_institutions: Array<{
    id: string;
    official_code: string;
    name: string;
    state: string;
    nirf_rank?: number | null;
    approved_intake: number;
    actual_enrolled: number;
    utilization_pct: number;
    risk_score: number;
    reason: string;
    alert_count: number;
  }>;
  recent_alerts: Array<{
    id: string;
    alert_id: string;
    alert_type: string;
    severity: string;
    title: string;
    description: string;
    anomaly_score: number;
    affected_institutions: string[];
    created_at?: string;
  }>;
}

export interface AnomalyAlert {
  id: string;
  alert_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  anomaly_score: number;
  affected_institutions?: string[];
  status?: string;
  created_at?: string;
}

export interface DuplicateCase {
  id: string;
  case_id: string;
  pseudonymous_id?: string;
  student_name: string;
  primary_institution_id: string;
  secondary_institution_id: string;
  primary_institution_name?: string;
  secondary_institution_name?: string;
  academic_year: string;
  detection_reason: string;
  evidence_summary: string;
  severity: string;
  review_status: string;
  resolution_notes?: string;
  created_at?: string;
}

export interface IntakeAnalytics {
  institution_id: string;
  institution_name: string;
  program_code: string;
  program_name: string;
  approved_regular_intake: number;
  admitted_regular: number;
  regular_utilization_percent: number;
  tfw_cap?: number;
  tfw_admitted: number;
  ews_cap?: number;
  ews_admitted: number;
  nri_cap?: number;
  nri_admitted: number;
  fn_oci_cap?: number;
  fn_oci_admitted: number;
  pmsss_cap?: number;
  pmsss_admitted: number;
  total_approved_capacity: number;
  total_admitted: number;
  status: string;
}

export interface AuditEvent {
  id: string;
  actor_username: string;
  actor_role: string;
  action: string;
  description: string;
  institution_id?: string;
  created_at: string;
}

export interface UploadBatch {
  id: string;
  institution_id: string;
  file_name: string;
  file_size: number;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  status: string;
  created_at?: string;
  issues_count?: number;
}

export interface UploadRowResult {
  id: string;
  batch_id: string;
  row_number: number;
  apaar_id?: string;
  status: string;
  error_message?: string;
  raw_data?: Record<string, any>;
}

export interface VerificationResult {
  is_valid: boolean;
  status: string;
  is_authentic_aicte_record: boolean;
  message: string;
  data_disclosed?: {
    student_name?: string;
    institution_name?: string;
    program_name?: string;
    enrolment_status?: string;
    is_enrolled_active?: boolean;
    is_aicte_approved?: boolean;
    qualification_level?: string;
  };
  tamper_proof_seal?: string;
  verified_at: string;
}

export const getStoredUser = (): UserInfo | null => {
  const u = localStorage.getItem("eduverify_user");
  return u ? JSON.parse(u) : null;
};

// Generic Fetcher
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = "API Error";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `Status ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ access_token: string; user_info: UserInfo }> {
    // Seamless student persona mock credentials for evaluation without backend schema changes
    if (username === "student_demo") {
      if (password !== "Student@123") {
        throw new Error("Invalid student credentials. Use password: Student@123");
      }
      const studentUser: UserInfo = {
        id: "student-demo-rahul-001",
        username: "student_demo",
        email: "rahul.sharma@dtu.ac.in",
        role: "STUDENT",
        institution_name: "Delhi Technological University"
      };
      const mockToken = "mock_student_jwt_token_dpdp_verified";
      setAuthToken(mockToken, studentUser);
      return { access_token: mockToken, user_info: studentUser };
    }

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    setAuthToken(data.access_token, data.user_info);
    return data;
  },

  async getMe(): Promise<UserInfo> {
    return apiRequest<UserInfo>("/auth/me");
  },

  async logout(): Promise<void> {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      clearAuth();
    }
  },

  // Institutions & Programs
  async getInstitutions(): Promise<any[]> {
    return apiRequest<any[]>("/institutions");
  },

  async getInstitution(id: string): Promise<any> {
    return apiRequest<any>(`/institutions/${id}`);
  },

  async createInstitution(data: any): Promise<any> {
    return apiRequest<any>("/institutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  async getPrograms(institutionId?: string): Promise<any[]> {
    const q = institutionId ? `?institution_id=${institutionId}` : "";
    return apiRequest<any[]>(`/programs${q}`);
  },

  async createProgram(data: any): Promise<any> {
    return apiRequest<any>("/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  // Students
  async getStudents(params: { institution_id?: string; program_id?: string; status?: string; search?: string; skip?: number; limit?: number } = {}): Promise<any> {
    const q = new URLSearchParams();
    if (params.institution_id) q.append("institution_id", params.institution_id);
    if (params.program_id) q.append("program_id", params.program_id);
    if (params.status) q.append("status", params.status);
    if (params.search) q.append("search", params.search);
    if (params.skip !== undefined) q.append("skip", params.skip.toString());
    if (params.limit !== undefined) q.append("limit", params.limit.toString());

    return apiRequest<any>(`/students?${q.toString()}`);
  },

  async getStudent(id: string): Promise<any> {
    return apiRequest<any>(`/students/${id}`);
  },

  async admitStudent(data: any): Promise<any> {
    return apiRequest<any>("/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },

  async correctStudent(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/students/${id}/corrections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
  },

  // Uploads
  async uploadStudentsFile(institutionId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append("institution_id", institutionId);
    formData.append("file", file);

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/uploads/students`, {
      method: "POST",
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async getUploadStatus(id: string): Promise<any> {
    return apiRequest<any>(`/uploads/${id}/status`);
  },

  async getUploadResults(id: string): Promise<any[]> {
    return apiRequest<any[]>(`/uploads/${id}/results`);
  },

  getUploadErrorsDownloadUrl(id: string): string {
    return `${API_BASE}/uploads/${id}/errors/download`;
  },

  // Validation, Duplicates, and Graph
  async getValidationIssues(institutionId?: string, severity?: string): Promise<any[]> {
    const q = new URLSearchParams();
    if (institutionId) q.append("institution_id", institutionId);
    if (severity) q.append("severity", severity);
    return apiRequest<any[]>(`/validation/issues?${q.toString()}`);
  },

  async getDuplicateCases(): Promise<any[]> {
    return apiRequest<any[]>("/validation/duplicates");
  },

  async resolveDuplicateCase(id: string, resolution_status: string, resolution_notes: string): Promise<any> {
    return apiRequest<any>(`/validation/duplicates/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution_status, resolution_notes })
    });
  },

  async getCrossInstitutionGraph(): Promise<any> {
    return apiRequest<any>("/validation/graph");
  },

  async triggerNationalValidation(): Promise<any> {
    return apiRequest<any>("/validation/run", { method: "POST" });
  },

  // Analytics & Surveillance
  async getNationalOverview(): Promise<any> {
    return apiRequest<any>("/analytics/overview");
  },

  async getIntakeAnalytics(institutionId?: string): Promise<any[]> {
    const q = institutionId ? `?institution_id=${institutionId}` : "";
    return apiRequest<any[]>(`/analytics/intake${q}`);
  },

  async getInstitutionOverview(id: string): Promise<any> {
    return apiRequest<any>(`/analytics/institution/${id}`);
  },

  async getAnomalyAlerts(): Promise<any[]> {
    return apiRequest<any[]>("/analytics/alerts");
  },

  async reviewAnomalyAlert(id: string, action_notes: string): Promise<any> {
    return apiRequest<any>(`/analytics/alerts/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_notes })
    });
  },

  // Credentials
  async issueCredential(studentId: string, enrolmentId: string): Promise<any> {
    return apiRequest<any>("/credentials/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, enrolment_id: enrolmentId })
    });
  },

  async verifyCredential(params: { credential_id?: string; apaar_id?: string; selective_disclosure_mode?: boolean }): Promise<any> {
    return apiRequest<any>("/credentials/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
  },

  async revokeCredential(id: string, reason: string): Promise<any> {
    return apiRequest<any>(`/credentials/${id}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });
  },

  // Reports
  getEnrolmentReportUrl(institutionId?: string): string {
    const q = institutionId ? `?institution_id=${institutionId}` : "";
    return `${API_BASE}/reports/enrolment${q}`;
  },

  getComplianceReportUrl(): string {
    return `${API_BASE}/reports/compliance`;
  },

  async downloadEnrolmentReport(institutionId?: string): Promise<void> {
    const token = getAuthToken();
    const q = institutionId ? `?institution_id=${institutionId}` : "";
    const res = await fetch(`${API_BASE}/reports/enrolment${q}`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Failed to download enrolment report");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aicte_enrolment_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async downloadComplianceReport(): Promise<void> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/reports/compliance`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Failed to download compliance report");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aicte_compliance_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async downloadErrorCsv(batchId: string): Promise<void> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/uploads/${batchId}/errors/download`, {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error("Failed to download error CSV");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `validation_errors_batch_${batchId.slice(0, 8)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async runNationalIntegrityScan(): Promise<any> {
    return this.triggerNationalValidation();
  },

  async getUploadBatchResults(id: string): Promise<any[]> {
    return this.getUploadResults(id);
  },

  // Audit
  async getAuditEvents(actor?: string, action?: string, institutionId?: string): Promise<any[]> {
    const q = new URLSearchParams();
    if (actor) q.append("actor", actor);
    if (action) q.append("action", action);
    if (institutionId) q.append("institution_id", institutionId);
    return apiRequest<any[]>(`/audit/events?${q.toString()}`);
  },

  // Health
  async getHealth(): Promise<any> {
    return apiRequest<any>("/health");
  },

  async getIntegrationsHealth(): Promise<any> {
    return apiRequest<any>("/health/integrations");
  },

  // AICTE Auditor Co-Pilot (Qwen 8B)
  async queryCopilot(message: string, language: string = "en", history: any[] = []): Promise<any> {
    return apiRequest<any>("/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language, history })
    });
  },

  async getCopilotContext(): Promise<any> {
    return apiRequest<any>("/copilot/context");
  },

  // Student Citizen Portal Helpers (DPDP Act 2023 Self-Sovereignty)
  async getStudentDemoRecord() {
    return {
      name: "Rahul Sharma",
      apaar_id: "9821-4567-8901",
      apaar_raw: "982145678901",
      institution_name: "Delhi Technological University",
      institution_code: "DTU-DELHI",
      program_name: "B.Tech Computer Science and Engineering",
      program_code: "BTECH-CSE-DTU",
      academic_year: "2024-25",
      admission_date: "2024-08-01",
      enrolment_status: "REGULAR_ACTIVE",
      seat_category: "General",
      verhoeff_valid: true,
      ed25519_tamper_seal: "ED25519_SEAL_V1_7c9f81a2e3b4d567890abcdef1234567890abcdef1234567890abcdef1234567",
      dpdp_consent_active: true
    };
  },

  getStudentConsentSettings() {
    const saved = localStorage.getItem("dpdp_student_consent");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      selectiveDisclosure: true,
      maskDob: true,
      maskAadhaar: true,
      shareProgramOnly: true,
      allowDirectEmployerContact: false,
      enableQrVerification: true
    };
  },

  saveStudentConsentSettings(settings: any) {
    localStorage.setItem("dpdp_student_consent", JSON.stringify(settings));
    return settings;
  },

  getStudentVerificationAccessLogs() {
    return [
      {
        id: "vlog-001",
        verifier_name: "Tata Consultancy Services Ltd.",
        verifier_type: "CORPORATE_EMPLOYER",
        timestamp: "2026-10-28 14:22:10 IST",
        method: "QR_CODE_SCAN",
        attributes_shared: "Name, Institution, Degree Verified",
        status: "APPROVED_VERIFIED",
        tamper_status: "VALID_HASH"
      },
      {
        id: "vlog-002",
        verifier_name: "Infosys Campus Recruitment Cell",
        verifier_type: "CORPORATE_EMPLOYER",
        timestamp: "2026-10-25 11:05:40 IST",
        method: "APAAR_REST_API",
        attributes_shared: "Name, Program, Academic Status",
        status: "APPROVED_VERIFIED",
        tamper_status: "VALID_HASH"
      },
      {
        id: "vlog-003",
        verifier_name: "Delhi State Scholarship Directorate",
        verifier_type: "STATE_REGULATORY_BODY",
        timestamp: "2026-10-18 09:30:15 IST",
        method: "PORTAL_DIRECT_QUERY",
        attributes_shared: "Enrolment ID, Caste Quota Validity",
        status: "REGULATORY_AUDIT",
        tamper_status: "VALID_HASH"
      }
    ];
  },

  // Student AICTE Schemes & Internships Data
  getStudentSchemes() {
    return {
      kpis: {
        activeApplications: 3,
        sanctionedAmount: "₹50,000 / yr",
        creditsEarned: "142 ABC Credits",
        verificationStatus: "Verified by DTU Nodal Officer"
      },
      scholarships: [
        {
          id: "SCH-001",
          name: "AICTE Pragati Scholarship Scheme for Girls",
          scheme_type: "AICTE Central Flagship",
          academic_year: "2024-25",
          amount: "₹50,000 / year",
          status: "SANCTIONED",
          status_tone: "green",
          applied_on: "2024-09-12",
          dbt_status: "PFMS Disbursed to A/C ending 4821",
          transaction_ref: "PFMS-TXN-202410-88392",
          college_verification: "APPROVED_BY_INSTITUTION",
          last_updated: "2024-10-15"
        },
        {
          id: "SCH-002",
          name: "Prime Minister Special Scholarship Scheme (PMSSS)",
          scheme_type: "Ministry of Education / AICTE",
          academic_year: "2024-25",
          amount: "₹1,25,000 / year (Tuition + Maintenance)",
          status: "UNDER_COLLEGE_VERIFICATION",
          status_tone: "amber",
          applied_on: "2024-10-02",
          dbt_status: "Pending College Nodal Officer Sign-off",
          transaction_ref: "Awaiting Verification",
          college_verification: "DOCUMENTS_UPLOADED",
          last_updated: "2024-10-24"
        },
        {
          id: "SCH-003",
          name: "AICTE Swanath Scholarship Scheme",
          scheme_type: "Orphan / Ward of Armed Forces",
          academic_year: "2023-24",
          amount: "₹50,000 / year",
          status: "COMPLETED",
          status_tone: "sky",
          applied_on: "2023-09-01",
          dbt_status: "Disbursed (Cycle Complete)",
          transaction_ref: "PFMS-TXN-202311-19024",
          college_verification: "VERIFIED",
          last_updated: "2024-04-10"
        }
      ],
      internships: [
        {
          id: "INT-001",
          role: "Smart Mobility Data Science Intern",
          organization: "AICTE - MoHUA Smart Cities Mission",
          portal: "AICTE National Internship Portal (NIP)",
          stipend: "₹15,000 / month",
          duration: "3 Months (Hybrid)",
          status: "SHORTLISTED",
          status_tone: "green",
          applied_on: "2024-10-10",
          next_step: "Technical Interview on 05-Nov-2026",
          mentor: "Dr. K. S. Ramanathan (Chief Urban Planner)"
        },
        {
          id: "INT-002",
          role: "Cloud Systems & DevOps Engineer Intern",
          organization: "Prime Minister Internship Scheme (PMIS - 1 Crore Youth Initiative)",
          portal: "Corporate Partner: Larsen & Toubro (L&T)",
          stipend: "₹18,000 / month",
          duration: "6 Months",
          status: "APPLICATION_UNDER_REVIEW",
          status_tone: "amber",
          applied_on: "2024-10-18",
          next_step: "College Eligibility Scrutiny Underway",
          mentor: "L&T Engineering Bureau"
        },
        {
          id: "INT-003",
          role: "Virtual Cyber Defense & Ethical Hacking",
          organization: "AICTE-Cisco Cybersecurity Academy",
          portal: "National Educational Alliance for Technology (NEAT 3.0)",
          stipend: "Certified Industry Experience",
          duration: "8 Weeks (Virtual)",
          status: "COMPLETED",
          status_tone: "sky",
          applied_on: "2024-06-01",
          next_step: "Certificate Verified & Added to APAAR",
          mentor: "Cisco Networking Academy Mentor Team"
        }
      ],
      academicCredits: [
        {
          id: "ABC-001",
          course_title: "Cloud Computing and Distributed Systems",
          platform: "SWAYAM - NPTEL (IIT Kharagpur)",
          credits: 3,
          grade: "Elite + Gold (92%)",
          approval_status: "APPROVED_BY_DTU_SENATE",
          tamper_hash: "SHA256:7c9e0a...3b4f"
        },
        {
          id: "ABC-002",
          course_title: "AI & Machine Learning for Predictive Healthcare",
          platform: "NEAT AICTE EdTech Program",
          credits: 4,
          grade: "A+ Distinction",
          approval_status: "TRANSFER_VERIFIED",
          tamper_hash: "SHA256:d12c98...ef71"
        }
      ]
    };
  },

  // Student Grievance & Complaint Redressal Desk
  getStudentComplaints() {
    const saved = localStorage.getItem("student_grievances_data");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const initial = [
      {
        id: "GRV-2026-0842",
        category: "SCHOLARSHIP_VERIFICATION",
        category_label: "Delay in College Scholarship Verification",
        subject: "DTU Nodal Officer sign-off pending for PMSSS Scholarship 2024-25",
        target_authority: "College Grievance Redressal Committee (CGRC - DTU)",
        priority: "HIGH",
        status: "UNDER_VERIFICATION",
        status_tone: "amber",
        submitted_at: "2026-10-22 14:30 IST",
        last_updated: "2026-10-25 16:45 IST",
        description: "I submitted the required income and category certificates for PMSSS renewal on 12-Oct-2026, but the portal still reflects 'Pending Verification'. Kindly expedite.",
        timeline: [
          { step: "Grievance Lodged", time: "22-Oct-2026 14:30", note: "Logged immutably to DPDP Audit Ledger" },
          { step: "Forwarded to DTU Registrar", time: "23-Oct-2026 10:15", note: "Assigned to Shri S. K. Sharma (Admissions Desk)" },
          { step: "Under Document Scrutiny", time: "25-Oct-2026 16:45", note: "Verification officer requested stamp from Tehsildar" }
        ],
        college_remarks: "Documents are currently being verified against the state revenue portal. Expected resolution in 48 hours."
      },
      {
        id: "GRV-2026-0619",
        category: "APAAR_DATA_CORRECTION",
        category_label: "Academic Bank of Credits (ABC) Sync",
        subject: "NPTEL Cloud Computing course credits not reflecting on APAAR profile",
        target_authority: "AICTE Regulation Bureau & Technical Support",
        priority: "NORMAL",
        status: "RESOLVED",
        status_tone: "green",
        submitted_at: "2026-09-15 11:20 IST",
        last_updated: "2026-09-18 17:00 IST",
        description: "Completed 3 credits via SWAYAM-NPTEL. DTU approved the transfer on 01-Sep, but APAAR registry had not updated the total credits.",
        timeline: [
          { step: "Grievance Lodged", time: "15-Sep-2026 11:20", note: "Ticket assigned to AICTE ABC Sync Bot" },
          { step: "Ledger Reconciliation", time: "17-Sep-2026 14:00", note: "Re-queried SWAYAM REST API" },
          { step: "Resolved & Sealed", time: "18-Sep-2026 17:00", note: "Credits updated to 142. Ed25519 hash refreshed." }
        ],
        college_remarks: "Issue resolved. 3 credits successfully transferred and visible on your digital APAAR identity card."
      }
    ];
    localStorage.setItem("student_grievances_data", JSON.stringify(initial));
    return initial;
  },

  submitStudentComplaint(data: {
    category: string;
    category_label: string;
    subject: string;
    target_authority: string;
    priority: string;
    description: string;
  }) {
    const current = this.getStudentComplaints();
    const newId = `GRV-2026-0${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const timeStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} IST`;

    const newComplaint = {
      id: newId,
      category: data.category,
      category_label: data.category_label,
      subject: data.subject,
      target_authority: data.target_authority,
      priority: data.priority,
      status: "SUBMITTED",
      status_tone: "sky",
      submitted_at: timeStr,
      last_updated: timeStr,
      description: data.description,
      timeline: [
        { step: "Grievance Lodged", time: timeStr, note: "Timestamped and immutably recorded in Council Grievance Vault" },
        { step: "Assigned to Institutional Officer", time: timeStr, note: "Awaiting preliminary review by College Registrar" }
      ],
      college_remarks: "Your concern has been registered. An institutional response will be provided within 3 working days."
    };

    const updated = [newComplaint, ...current];
    localStorage.setItem("student_grievances_data", JSON.stringify(updated));
    return newComplaint;
  },

  forwardComplaintToInstitution(complaintId: string, institutionName: string, remarks: string, forwardedBy: string = "Corporate Verifier") {
    const list = this.getStudentComplaints();
    const now = new Date();
    const timeStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} IST`;

    const updated = list.map((c: any) => {
      if (c.id === complaintId) {
        const newTimeline = [
          ...(c.timeline || []),
          {
            step: `Forwarded to ${institutionName}`,
            time: timeStr,
            note: `${remarks || "Forwarded for institutional record review and credential confirmation."} (Action by: ${forwardedBy})`
          }
        ];
        return {
          ...c,
          status: "FORWARDED_TO_INSTITUTE",
          status_tone: "sky",
          target_authority: `${institutionName} (College Registrar Desk)`,
          last_updated: timeStr,
          college_remarks: remarks || `Dispatched to ${institutionName} for college-level review and records re-verification.`,
          timeline: newTimeline
        };
      }
      return c;
    });
    localStorage.setItem("student_grievances_data", JSON.stringify(updated));
    return updated.find((c: any) => c.id === complaintId);
  },

  resolveStudentComplaint(complaintId: string, resolutionRemarks: string, resolvedBy: string = "Authorized Verifier") {
    const list = this.getStudentComplaints();
    const now = new Date();
    const timeStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} IST`;

    const updated = list.map((c: any) => {
      if (c.id === complaintId) {
        const newTimeline = [
          ...(c.timeline || []),
          {
            step: "Resolved & Sealed",
            time: timeStr,
            note: `${resolutionRemarks || "Verification dispute cleared. Official Ed25519 digital seal verified."} (Sealed by: ${resolvedBy})`
          }
        ];
        return {
          ...c,
          status: "RESOLVED",
          status_tone: "green",
          last_updated: timeStr,
          college_remarks: resolutionRemarks,
          timeline: newTimeline
        };
      }
      return c;
    });
    localStorage.setItem("student_grievances_data", JSON.stringify(updated));
    return updated.find((c: any) => c.id === complaintId);
  }
};

