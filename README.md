# 🏛️ EduVerify AI — AICTE APAAR Sovereign Gateway
### Smart India Hackathon (SIH) • Problem Statement ID: 26263
**Organization**: All India Council for Technical Education (AICTE), Ministry of Education, Govt. of India  
**Department**: Regulation Bureau  
**Theme**: Smart Automation • **Category**: Software  

---

## 🌟 Executive Overview
Currently, AICTE receives student information primarily through fragmented, aggregate annual headcounts. This lack of individual student tracking linked to a sovereign academic identity creates acute vulnerabilities: **ghost students**, **dual/multi-institution duplicate enrolments**, **unapproved admissions exceeding sanctioned intake caps**, and **unverifiable credentials**.

**EduVerify AI** is an integrated, production-minded platform that establishes **APAAR ID ("One Nation, One Student ID")** as the sovereign academic key for all students across AICTE-approved institutions. The platform delivers end-to-end bulk data ingestion, mathematical Verhoeff checksum parity validation, real-time supernumerary quota compliance auditing (TFW 5%, EWS 10%, NRI 5%, FN/OCI 15%), cross-institution collision surveillance via NetworkX identity graphs, unsupervised Isolation Forest anomaly scoring, and cryptographic Ed25519/HMAC-SHA256 verifiable credential verification under DPDP Act 2023 Zero-Knowledge Proof (ZKP) selective disclosure standards.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Python 3.13, FastAPI (High-performance async REST API, OpenAPI 3.0 docs)
- **Database**: SQLite (Zero-config standalone evaluation) / PostgreSQL (via SQLAlchemy 2.x & Alembic)
- **Validation Engine**: Verhoeff $D_5$ Dihedral Decimal Checksum Algorithm
- **Surveillance & AI**:
  - `NetworkX`: Graph topological bipartite analysis of Student $\leftrightarrow$ Institution $\leftrightarrow$ Program collisions
  - `scikit-learn` & `numpy`: Isolation Forest unsupervised outlier detection on institutional intake & quota deviation features
  - `pandas` & `openpyxl`: Ingestion pipeline for CSV and Excel files with formula injection prevention
- **Security & Cryptography**: Native `bcrypt` password hashing, JWT session management, HMAC-SHA256 & Ed25519 digital credential signing, DPDP Act 2023 PII masking

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Custom Regulatory Navy Design System
- **Visualization**: Recharts (Intake vs Enrolment bar charts, Quota distribution pie charts), SVG NetworkX Topology Canvas
- **Icons & QR**: Lucide React, `qrcode.react` (cryptographic verifiable credential QR rendering)

---

## 📂 Repository Structure

```
SIH_/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API endpoints (auth, institutions, programs, students, uploads, validation, analytics, credentials, reports, audit, health)
│   │   ├── models/          # SQLAlchemy relational entities (Institution, Program, Student, Enrolment, User, UploadBatch, DuplicateCase, AnomalyAlert, IssuedCredential, AuditEvent)
│   │   ├── schemas/         # Pydantic v2 validation and response models
│   │   ├── services/        # Core business engines (validation, intake, graph, anomaly, credential, audit)
│   │   ├── security/        # Cryptographic signing, bcrypt hashing, JWT, RBAC, PII masking
│   │   ├── integrations/    # Synthetic mock adapters (APAAR, AICTE, ERP)
│   │   ├── config.py        # Centralized settings
│   │   ├── database.py      # Database engine and session manager
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Automated pytest suite
│   ├── requirements.txt     # Python backend dependencies
│   └── Dockerfile           # Backend container specification
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, Badges
│   │   ├── pages/           # 12 specialized viewports (AicteDashboard, InstitutionDashboard, StudentRegistry, BulkUploadWizard, AnomalyCenter, IntakeMonitoring, IdentityGraphView, VerificationPortal, ReportsPage, AuditVault, IntegrationsHealth, LoginPage)
│   │   ├── services/api.ts  # Typed API client
│   │   ├── App.tsx          # Main view routing and persona switcher
│   │   └── index.css        # Tailwind v4 theme directives
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── scripts/
│   └── seed_data.py         # Deterministic benchmark seeder (8 colleges, 17 programs, 1,050+ students)
├── docker-compose.yml       # Production container orchestration
├── .env.example             # Environment variable template
├── plan.md                  # Hackathon strategy and architecture blueprint
└── README.md
```

## 🐳 Docker Deployment (Hackathon Quick Launch)

The entire platform is fully containerized with production-grade multi-stage Docker builds:
- **FastAPI Backend**: Python 3.11 with SQLAlchemy, scikit-learn, and container healthchecks.
- **Frontend SPA**: High-performance Nginx Alpine container (~25MB) with automatic client-side routing & gzip compression.
- **Cloud Database Ready**: Connects automatically to Cloud Supabase PostgreSQL or falls back to internal storage.

### One-Command Deployment

```bash
# Windows
.\docker-start.bat

# Linux / macOS
chmod +x docker-start.sh && ./docker-start.sh

# Or directly using Docker Compose:
docker compose up --build -d
```

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **AICTE Central Dashboard** | `http://localhost:5173` or `http://localhost:80` | Production React + Vite Nginx SPA |
| **FastAPI Swagger Docs** | `http://localhost:8000/docs` | Interactive OpenAPI Specifications |
| **Backend Health Probe** | `http://localhost:8000/api/v1/health` | Container Liveness & DB Status Check |

> **Air-Gapped / Offline Evaluation Mode:**  
> If evaluating in a secure venue without internet, activate the standalone PostgreSQL 16 container:  
> `docker compose --profile offline up --build -d`

---

## 🏃 Quick Start & Local Execution (Non-Docker)

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ (Tested on Node.js v22)
- Git & npm

### 2. Backend Setup
```bash
# 1. Open terminal in project root
cd SIH_

# 2. Virtual environment is already created at backend/venv
# To run migrations and seed 1,050+ records:
.\backend\venv\Scripts\python .\scripts\seed_data.py

# 3. Start the FastAPI server (Port 8000)
.\backend\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```
API Documentation is live at: 👉 **`http://127.0.0.1:8000/docs`**

### 3. Frontend Setup
In a new terminal:
```bash
cd SIH_\frontend
npm install
npm run dev
```
Open your browser at: 👉 **`http://127.0.0.1:5173/`**

---

## 👥 Demo Logins & Persona Matrix

| Persona | Username | Password | Role & Scope |
|---|---|---|---|
| **AICTE Central Regulator** | `aicte_admin` | `Admin@123` | National AICTE HQ, Full surveillance, Anomaly resolution, Reports |
| **DTU Delhi Registrar** | `dtu_admin` | `College@123` | Institution Admin, Intake tracking, Credential issuance |
| **KNIT Admissions Officer** | `knit_deo` | `College@123` | Data Entry Officer, Bulk upload, Single admission |
| **Independent Auditor** | `auditor` | `Auditor@123` | Read-only compliance auditor, Audit ledger inspection |
| **Employer / Recruiter** | `verifier` | `Verifier@123` | Public/ZKP Credential verification |

> *Tip: You can switch between any of these personas directly inside the web UI using the **"Switch Persona"** menu in the top navigation bar!*

---

## 🧪 Live Evaluation Demo Scenarios

### Scenario 1: Sovereign Credential Verification (Public & Employer Portal)
1. Navigate to **"Public & Employer Verify"**.
2. Click **"✅ Valid Student (DTU Delhi)"** (APAAR: `984210573915`).
3. Click **"Verify Authenticity"**:
   - Observe: Green **"✓ AUTHENTIC AICTE RECORD VERIFIED"** badge.
   - Candidate: Aarav Sharma, DTU Delhi, CSE (B.Tech), Roll: `24/CSE/001`.
   - Cryptographic Ed25519 verifiable seal and scannable QR code.
4. **DPDP Act 2023 Innovation**: Toggle **"DPDP Act 2023 Selective Disclosure (ZKP)"** to **ENABLED**.
   - Observe: Student name, Aadhaar, DOB, and caste are masked! Only cryptographic boolean assertions (*Active Enrolment = True*, *AICTE Approved = True*, *Qualification = B.Tech*) are shared with third-party recruiters!

### Scenario 2: Cross-College Ghost Student / Duplicate Collision Bust
1. On the verification page, click **"🚨 Ghost / Collision Student"** (APAAR: `883920194835`).
2. Navigate to **"Anomaly & Fraud Center"**:
   - Observe the critical flag: Candidate **Sameer Verma** is simultaneously holding full-time admissions in **DTU Delhi** and **KNIT Sultanpur**!
   - Click **"Review & Resolve"** to record formal AICTE sanction audit notes.
3. Switch to **"Identity Graph (NetworkX)"**:
   - View the topological bipartite graph showing the collision link between DTU Delhi and KNIT Sultanpur.

### Scenario 3: Bulk Student Upload & Immediate Validation
1. Switch persona to **"DTU Registrar (`dtu_admin`)"** and click **"Bulk Upload Hub"**.
2. Click **"Anomaly Test CSV"** to download the test benchmark.
3. Drag and drop the file into the upload zone and click **"Upload & Ingest"**.
4. Observe the batch report: 1 row accepted, 4 rows rejected with exact row numbers and downloadable error CSV!

### Scenario 4: Official Printable Bonafide Certificate
1. Navigate to **"Student Registry"**.
2. Click **"Bonafide"** on any student.
3. A print-ready official certificate opens with watermarks, institutional roll number, APAAR key, and cryptographic QR code. Click **"Print Certificate"** to export as PDF.

---

## 🔒 Security & DPDP Act 2023 Compliance
- **Identifier Protection at Rest**: Full APAAR IDs are protected with keyed HMAC-SHA256 lookup indexes. Raw identifiers are never logged or exposed in unauthenticated API endpoints.
- **Role-Based Access Control (RBAC)**: Backend endpoints strictly enforce institution isolation; college staff can never view or modify another institution's records.
- **CSV Formula Injection Defense**: All exported cells sanitize malicious execution characters (`=`, `+`, `-`, `@`).

---

## 🔌 Integration Points & Mock Providers
Per Hackathon guidelines, real production APAAR and AICTE API credentials cannot be exposed. The platform implements clean adapter interfaces:
- `APAARVerificationProvider` (`backend/app/integrations/apaar_provider.py`)
- `AICTEInstitutionProvider` (`backend/app/integrations/aicte_provider.py`)
- `InstitutionERPProvider` (`backend/app/integrations/erp_provider.py`)

All adapters return realistic synthetic responses and are ready for zero-rewrite production migration once official government OAuth2 credentials are supplied.

---

*EduVerify AI • Developed for Smart India Hackathon 2024–25 • AICTE Regulation Bureau PS #26263*
