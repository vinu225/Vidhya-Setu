const API_BASE = "http://localhost:8000/api/v1";

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
  }
};
