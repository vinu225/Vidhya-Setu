import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from './ui';

export interface SakshamCase {
  id: string;
  title: string;
  studentName: string;
  apaarId: string;
  rollNo: string;
  institution: string;
  docType: string;
  fileName: string;
  fileSize: string;
  sha256: string;
  status: 'VERIFIED' | 'MISMATCH' | 'DUPLICATE';
  statusLabel: string;
  statusTone: 'green' | 'amber' | 'red';
  ocrApplied: boolean;
  ocrConfidence?: number;
  qrPayload: string;
  metadata: {
    creationDate: string;
    modDate: string;
    producer: string;
    anomaly?: string;
  };
  evidenceChecks: {
    check: string;
    result: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    detail: string;
  }[];
  consistencyComparison: {
    field: string;
    recordValue: string;
    extractedValue: string;
    status: 'MATCH' | 'CONFLICT' | 'CAUTION';
  }[];
}

export const SAKSHAM_DEMO_CASES: SakshamCase[] = [
  {
    id: 'case-1',
    title: 'Case 1: DTU Bonafide B.Tech Admission Letter',
    studentName: 'Aditi Patel',
    apaarId: '•••• •••• 3340',
    rollNo: '24/ECE-/3340',
    institution: 'Delhi Technological University (DTU)',
    docType: 'Institutional Admission Letter (Regular Quota)',
    fileName: 'DTU_Admission_2024_AditiPatel.pdf',
    fileSize: '412 KB',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'VERIFIED',
    statusLabel: 'VERIFIED — All Checks Passed',
    statusTone: 'green',
    ocrApplied: false,
    qrPayload: 'APAAR:249182343340|ROLL:24/ECE-/3340|INST:DTU|PROGRAM:BTECH-ECE|YEAR:2024-25',
    metadata: {
      creationDate: '2024-08-01 10:14:22 UTC',
      modDate: '2024-08-01 10:14:22 UTC',
      producer: 'AICTE Central Document Publisher v4.1'
    },
    evidenceChecks: [
      {
        check: 'SHA-256 Binary Integrity',
        result: 'Verified Unique',
        status: 'PASS',
        detail: 'Binary digest matches institutional cryptographic submission receipt.'
      },
      {
        check: 'Verhoeff Checksum Parity',
        result: 'Parity 0 (Valid)',
        status: 'PASS',
        detail: '12-digit sovereign APAAR sequence passed mathematical check digit.'
      },
      {
        check: 'PDF Digital Text Layer',
        result: 'Native Vector Text (520 chars)',
        status: 'PASS',
        detail: 'Selectable text extracted directly with PyMuPDF without OCR noise.'
      },
      {
        check: 'Embedded QR Code Decoder',
        result: 'Decoded (Payload Match)',
        status: 'PASS',
        detail: 'QR payload cryptographic key matches university registrar stamp.'
      },
      {
        check: 'PDF Metadata Chronology',
        result: 'Consistent Timeline',
        status: 'PASS',
        detail: 'CreationDate matches admission cycle; no post-signing modification.'
      }
    ],
    consistencyComparison: [
      { field: 'Candidate Name', recordValue: 'Aditi Patel', extractedValue: 'Aditi Patel', status: 'MATCH' },
      { field: 'Institutional Roll', recordValue: '24/ECE-/3340', extractedValue: '24/ECE-/3340', status: 'MATCH' },
      { field: 'Admitted Program', recordValue: 'Electronics & Comm. (ECE)', extractedValue: 'Electronics & Comm. (ECE)', status: 'MATCH' },
      { field: 'Sanctioned Seat Category', recordValue: 'REGULAR', extractedValue: 'REGULAR (Merit)', status: 'MATCH' }
    ]
  },
  {
    id: 'case-2',
    title: 'Case 2: EWS Quota Certificate (DOB Discrepancy & OCR Scan)',
    studentName: 'Abhishek Verma',
    apaarId: '•••• •••• 8821',
    rollNo: '24/CSE-/1092',
    institution: 'Delhi Technological University (DTU)',
    docType: 'Economically Weaker Section (EWS) Revenue Certificate',
    fileName: 'Govt_EWS_Cert_AbhishekVerma_Scanned.pdf',
    fileSize: '1.24 MB',
    sha256: '9f83c6046e7f8647ac841b52a466795f7c00684f09d8dcfd0fa687b140cc5365',
    status: 'MISMATCH',
    statusLabel: 'MANUAL REVIEW REQUIRED — DOB Discrepancy Flagged',
    statusTone: 'amber',
    ocrApplied: true,
    ocrConfidence: 84.7,
    qrPayload: 'REV-EWS-2024-DEL-98124|NAME:Abhishek Verma|DOB:12-11-2004',
    metadata: {
      creationDate: '2026-10-25 09:00:00 UTC',
      modDate: '2024-07-15 11:20:00 UTC',
      producer: 'ScanSnap iX1600 / PyMuPDF',
      anomaly: 'CreationDate is 2 years AFTER ModDate (Metadata Chronology Breach)'
    },
    evidenceChecks: [
      {
        check: 'PDF Digital Layer Heuristic',
        result: 'Image-Only Raster Scan (0 chars)',
        status: 'WARNING',
        detail: 'PDF page has no vector text layer; routed to EasyOCR optical engine.'
      },
      {
        check: 'OCR Optical Extraction',
        result: 'Confidence 84.7%',
        status: 'PASS',
        detail: 'Extracted certificate serial: REV/EWS/2024/98124 from revenue seal.'
      },
      {
        check: 'PDF Metadata Timeline',
        result: 'Chronology Anomaly',
        status: 'FAIL',
        detail: 'CreationDate (2026) is newer than ModDate (2024) — possible header tampering.'
      },
      {
        check: 'Cross-Document Date Check',
        result: 'Conflict Detected',
        status: 'FAIL',
        detail: 'Certificate states DOB 12-11-2004, whereas admission portal states 15-01-2005.'
      }
    ],
    consistencyComparison: [
      { field: 'Candidate Name', recordValue: 'Abhishek Verma', extractedValue: 'Abhishek Verma', status: 'MATCH' },
      { field: 'Date of Birth', recordValue: '2005-01-15', extractedValue: '2004-11-12', status: 'CONFLICT' },
      { field: 'Quota Classification', recordValue: 'EWS (10% Supernumerary)', extractedValue: 'EWS Income Slab < 8L', status: 'MATCH' },
      { field: 'Competent Authority', recordValue: 'Sub-Divisional Magistrate', extractedValue: 'Tehsildar / SDM Rohini', status: 'MATCH' }
    ]
  },
  {
    id: 'case-3',
    title: 'Case 3: Inter-State Duplicate Marksheet Collision (Cross-College)',
    studentName: 'Rahul Sharma',
    apaarId: '•••• •••• 9912',
    rollNo: '24/ME-/5519',
    institution: 'Delhi Technological University (DTU) vs RVCE Bangalore',
    docType: '12th Standard CBSE Board Marksheet & Certificate',
    fileName: 'CBSE_Senior_School_Cert_2024.pdf',
    fileSize: '890 KB',
    sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    status: 'DUPLICATE',
    statusLabel: 'CRITICAL ALERT — Inter-University Duplicate Document Collision',
    statusTone: 'red',
    ocrApplied: false,
    qrPayload: 'CBSE|ROLL:11928491|YEAR:2024|NAME:Rahul Sharma|TOTAL:482/500',
    metadata: {
      creationDate: '2024-05-18 14:00:00 UTC',
      modDate: '2024-05-18 14:00:00 UTC',
      producer: 'CBSE Sovereign Results Gateway'
    },
    evidenceChecks: [
      {
        check: 'SHA-256 Collision Radar',
        result: 'Exact Hash Collision (2 Colliding Records)',
        status: 'FAIL',
        detail: 'Identical byte-for-byte PDF submitted at RV College of Engineering (Karnataka).'
      },
      {
        check: 'Multi-College Double Enrolment',
        result: 'Simultaneous Active Enrolment',
        status: 'FAIL',
        detail: 'Candidate actively enrolled at DTU Delhi (Mech) and RVCE Bangalore (CS).'
      },
      {
        check: 'AICTE Sanction Enforcement',
        result: 'Admission Lockout Triggered',
        status: 'FAIL',
        detail: 'Rule APH Sec 4.2: Concurrent regular degree admission prohibited.'
      }
    ],
    consistencyComparison: [
      { field: 'Candidate Identity', recordValue: 'Rahul Sharma', extractedValue: 'Rahul Sharma', status: 'MATCH' },
      { field: 'First Institution', recordValue: 'Delhi Tech. Univ (DTU)', extractedValue: 'Enrolment Date: 01-08-2024', status: 'CAUTION' },
      { field: 'Second Institution', recordValue: 'RVCE Bangalore', extractedValue: 'Enrolment Date: 04-08-2024', status: 'CONFLICT' },
      { field: 'Resolution Action', recordValue: 'Mandate Seat Surrender', extractedValue: 'Provisional Hold Imposed', status: 'CONFLICT' }
    ]
  }
];

interface SakshamScrutinyStudioProps {
  onClose?: () => void;
  initialCaseId?: string;
  role?: string;
}

export const SakshamScrutinyStudio: React.FC<SakshamScrutinyStudioProps> = ({
  onClose,
  initialCaseId = 'case-1',
  role = 'INSTITUTION_ADMIN'
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);
  const [reviewActionMsg, setReviewActionMsg] = useState<string | null>(null);

  const activeCase = SAKSHAM_DEMO_CASES.find(c => c.id === selectedCaseId) || SAKSHAM_DEMO_CASES[0];

  const handleAction = (actionText: string) => {
    setReviewActionMsg(`Review action immutably registered: "${actionText}" by authorized role [${role}]. Timestamp: ${new Date().toLocaleTimeString()} IST.`);
    setTimeout(() => {
      // Keep feedback visible
    }, 4000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 1200,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #E2E8F0'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              background: '#2563EB',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              letterSpacing: 0.5
            }}>
              FORENSIC SCRUTINY ENGINE v2.4
            </span>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#fff' }}>
              Multi-Modal Document Scrutiny & Forensic Verification Studio
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: 22,
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Case Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '8px 16px',
          gap: 10
        }}>
          {SAKSHAM_DEMO_CASES.map(c => {
            const isSelected = c.id === selectedCaseId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCaseId(c.id);
                  setReviewActionMsg(null);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: isSelected ? '1px solid #2563EB' : '1px solid #CBD5E1',
                  background: isSelected ? '#EFF6FF' : '#fff',
                  color: isSelected ? '#1E40AF' : '#475569',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s'
                }}
              >
                <span>{c.title}</span>
                <Badge tone={c.statusTone}>{c.status}</Badge>
              </button>
            );
          })}
        </div>

        {/* Studio Content Area (2-column layout) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '420px 1fr',
          flex: 1,
          overflowY: 'auto',
          background: '#F1F5F9'
        }}>
          {/* Left Column: Document Visual Simulation */}
          <div style={{
            padding: 20,
            borderRight: '1px solid #E2E8F0',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                DOCUMENT VISUAL FIXTURE
              </div>
              <span className="mono" style={{ fontSize: 11, color: '#94A3B8' }}>{activeCase.fileSize}</span>
            </div>

            {/* Simulated Document Sheet */}
            <div style={{
              border: '2px solid #E2E8F0',
              borderRadius: 8,
              padding: 20,
              background: '#FAFAFA',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              position: 'relative'
            }}>
              {/* Sovereign Watermark Header */}
              <div style={{ borderBottom: '1px dashed #CBD5E1', paddingBottom: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                      GOVERNMENT OF INDIA • AICTE FORENSIC HUB
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                      {activeCase.docType}
                    </div>
                  </div>
                  <QRCodeSVG value={activeCase.qrPayload} size={52} level="M" />
                </div>
              </div>

              {/* Document Fields */}
              <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748B' }}>Candidate Name: </span>
                  <strong style={{ color: '#0F172A' }}>{activeCase.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>APAAR ID: </span>
                  <span className="mono" style={{ fontWeight: 600, color: '#2563EB' }}>{activeCase.apaarId}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Roll / Registration: </span>
                  <span className="mono" style={{ color: '#0F172A' }}>{activeCase.rollNo}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Issuing Entity: </span>
                  <span style={{ color: '#0F172A' }}>{activeCase.institution}</span>
                </div>
              </div>

              {/* Extraction Modality Tag */}
              <div style={{
                marginTop: 16,
                padding: '8px 10px',
                borderRadius: 6,
                background: activeCase.ocrApplied ? '#FEF3C7' : '#F0FDF4',
                border: activeCase.ocrApplied ? '1px solid #FDE68A' : '1px solid #BBF7D0',
                fontSize: 11,
                color: activeCase.ocrApplied ? '#92400E' : '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>{activeCase.ocrApplied ? '⚡ Scanned Raster PDF (EasyOCR Applied)' : '✓ Digital Vector PDF (Native Text Layer)'}</span>
                {activeCase.ocrConfidence && <strong>({activeCase.ocrConfidence}% conf)</strong>}
              </div>
            </div>

            {/* Cryptographic SHA-256 Fingerprint */}
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Binary SHA-256 Digest
              </div>
              <div className="mono" style={{ fontSize: 10, wordBreak: 'break-all', color: '#0F172A', background: '#fff', padding: 6, borderRadius: 4, border: '1px solid #CBD5E1' }}>
                {activeCase.sha256}
              </div>
            </div>

            {/* PDF Metadata Header Analysis */}
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11 }}>
              <div style={{ fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Forensic PDF Metadata
              </div>
              <div style={{ display: 'grid', gap: 4, color: '#64748B' }}>
                <div>CreationDate: <span className="mono" style={{ color: '#0F172A' }}>{activeCase.metadata.creationDate}</span></div>
                <div>ModDate: <span className="mono" style={{ color: '#0F172A' }}>{activeCase.metadata.modDate}</span></div>
                <div>Producer: <span className="mono" style={{ color: '#0F172A' }}>{activeCase.metadata.producer}</span></div>
              </div>
              {activeCase.metadata.anomaly && (
                <div style={{ marginTop: 8, padding: 6, background: '#FEE2E2', color: '#991B1B', borderRadius: 4, fontWeight: 600 }}>
                  ⚠️ {activeCase.metadata.anomaly}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: SAKSHAM Multi-Modal Verification Results */}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Banner Status */}
            <div style={{
              padding: 16,
              borderRadius: 8,
              background: activeCase.status === 'VERIFIED' ? '#ECFDF5' : activeCase.status === 'MISMATCH' ? '#FFFBEB' : '#FEF2F2',
              border: activeCase.status === 'VERIFIED' ? '1px solid #A7F3D0' : activeCase.status === 'MISMATCH' ? '1px solid #FDE68A' : '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: activeCase.statusTone === 'green' ? '#047857' : activeCase.statusTone === 'amber' ? '#B45309' : '#B91C1C', textTransform: 'uppercase' }}>
                  DECISION ENGINE AUDIT OUTCOME
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {activeCase.statusLabel}
                </div>
              </div>
              <span style={{ fontSize: 13 }}>
                <Badge tone={activeCase.statusTone}>
                  {activeCase.status}
                </Badge>
              </span>
            </div>

            {/* Evidence Checks List */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                Automated Multi-Modal Verification Checks
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {activeCase.evidenceChecks.map((chk, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 14px',
                      background: '#fff',
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, color: '#0F172A' }}>{chk.check}</strong>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{chk.detail}</div>
                    </div>
                    <Badge tone={chk.status === 'PASS' ? 'green' : chk.status === 'WARNING' ? 'amber' : 'red'}>
                      {chk.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-Document Consistency Matrix */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                Cross-Document Consistency Matrix (Record vs. Extracted Document)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>Data Attribute</th>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>Portal Record</th>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>Extracted Document</th>
                    <th style={{ padding: '10px 12px', color: '#475569' }}>Audit Match</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCase.consistencyComparison.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>{row.field}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{row.recordValue}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{row.extractedValue}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: row.status === 'MATCH' ? '#DCFCE7' : row.status === 'CAUTION' ? '#FEF3C7' : '#FEE2E2',
                          color: row.status === 'MATCH' ? '#166534' : row.status === 'CAUTION' ? '#92400E' : '#991B1B'
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reviewer Action Bar (Demo Interactive) */}
            <div style={{
              marginTop: 'auto',
              padding: 16,
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                Reviewer Scrutiny Actions ({role}):
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleAction('Approved & Verified Bonafide Admission')}
                  className="btn pri"
                  style={{ fontSize: 12, padding: '7px 14px' }}
                >
                  ✓ Approve Document
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('Flagged: Mandate Candidate Re-upload with SDM Revenue Verification')}
                  className="btn"
                  style={{ fontSize: 12, padding: '7px 14px', borderColor: 'var(--amber)', color: 'var(--amber)' }}
                >
                  ⚠ Flag for Scrutiny
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('Admission Frozen: Dispatched Duplicate Inquiry to State Council')}
                  className="btn"
                  style={{ fontSize: 12, padding: '7px 14px', borderColor: 'var(--red)', color: 'var(--red)' }}
                >
                  ✕ Block & Report Collision
                </button>
              </div>

              {reviewActionMsg && (
                <div style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>✓</span>
                  <span>{reviewActionMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
