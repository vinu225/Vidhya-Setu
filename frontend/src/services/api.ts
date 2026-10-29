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
  async login(username: string, password: string):Promise<{ access_token: string; user_info: UserInfo }> {
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
  }
};

