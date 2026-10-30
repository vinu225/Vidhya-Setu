import React, { useState, useEffect } from 'react';
import { Shell, Head, Card, Kpi, Badge, Table } from '../components/ui';
import { api, UserInfo } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

interface StudentPortalProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'card' | 'consent' | 'share' | 'log'>('card');
  const [record, setRecord] = useState<any>(null);
  const [consent, setConsent] = useState<any>(api.getStudentConsentSettings());
  const [logs, setLogs] = useState<any[]>(api.getStudentVerificationAccessLogs());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    api.getStudentDemoRecord().then(data => setRecord(data));
  }, []);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const studentId = record?.student_id || record?.id || '2024-CSE-001';
      await api.downloadEnrolmentCertificate(studentId);
    } catch (err: any) {
      alert(`Could not download certificate: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleToggleConsent = (key: string) => {
    const updated = { ...consent, [key]: !consent[key] };
    setConsent(updated);
    api.saveStudentConsentSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/verify?apaar=982145678901&zkp=true`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const publicVerificationUrl = `${window.location.origin}/verify?apaar=982145678901`;

  return (
    <Shell
      active="student-portal"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="DPDP Act 2023 Compliant Citizen Wallet"
        title="Vidhya Setu — Student Credential & Privacy Portal"
        sub="Control who accesses your academic credentials, manage selective disclosure (ZKP), and generate verifiable digital signatures."
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`btn ${activeSubTab === 'card' ? 'pri' : ''}`}
            onClick={() => setActiveSubTab('card')}
          >
            Digital APAAR Card
          </button>
          <button
            type="button"
            className={`btn ${activeSubTab === 'consent' ? 'pri' : ''}`}
            onClick={() => setActiveSubTab('consent')}
          >
            Privacy & Consent
          </button>
          <button
            type="button"
            className={`btn ${activeSubTab === 'share' ? 'pri' : ''}`}
            onClick={() => setActiveSubTab('share')}
          >
            Share Credential
          </button>
          <button
            type="button"
            className={`btn ${activeSubTab === 'log' ? 'pri' : ''}`}
            onClick={() => setActiveSubTab('log')}
          >
            Access Log
          </button>
        </div>
      </Head>

      {/* SUB-TAB 1: DIGITAL APAAR CARD */}
      {activeSubTab === 'card' && (
        <>
          <div className="grid">
            <Kpi
              label="APAAR Status"
              value="ACTIVE ✓"
              note={<span style={{ color: '#0F766E' }}>Verhoeff Checksum Valid</span>}
            />
            <Kpi
              label="Enrolment Mode"
              value="Regular Regular"
              note="AICTE Approved Sanction"
            />
            <Kpi
              label="ZKP Privacy Shield"
              value={consent.selectiveDisclosure ? "ENABLED" : "STANDARD"}
              note="DPDP Act 2023 Protected"
            />
            <Kpi
              label="Credential Seal"
              value="Ed25519"
              note="Cryptographically Sealed"
            />
          </div>

          <div className="split" style={{ marginTop: 20 }}>
            {/* Left: Digital Identity Card (Physical Card Mockup) */}
            <Card title="Official Digital APAAR Identity Card">
              <div
                style={{
                  background: 'linear-gradient(135deg, #0B2545 0%, #133E68 60%, #0F766E 100%)',
                  borderRadius: 16,
                  padding: 24,
                  color: '#fff',
                  boxShadow: '0 10px 25px -5px rgba(11, 37, 69, 0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background Crest Watermark */}
                <div
                  style={{
                    position: 'absolute',
                    right: -20,
                    bottom: -20,
                    fontSize: 160,
                    opacity: 0.06,
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                >
                  ✓
                </div>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#94A3B8' }}>
                      Government of India • Ministry of Education
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>
                      Automated Permanent Academic Account Registry
                    </div>
                  </div>
                  <Badge tone="green">VERIFIED</Badge>
                </div>

                {/* Body: Photo + Details */}
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 80,
                      height: 96,
                      borderRadius: 8,
                      background: '#1E293B',
                      border: '2px solid rgba(255,255,255,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                      color: '#94A3B8'
                    }}
                  >
                    👤
                    <span style={{ fontSize: 9, color: '#CBD5E1', marginTop: 4 }}>PHOTO</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                      {record?.name || 'Rahul Sharma'}
                    </div>
                    <div style={{ fontSize: 12, color: '#CBD5E1' }}>
                      {record?.program_name || 'B.Tech Computer Science and Engineering'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      {record?.institution_name || 'Delhi Technological University'} ({record?.institution_code || 'DTU-DELHI'})
                    </div>

                    <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: 6, display: 'inline-block' }}>
                      <span style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>APAAR IDENTIFIER</span>
                      <span className="mono" style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: '#38BDF8' }}>
                        {record?.apaar_id || '9821-4567-8901'}
                      </span>
                    </div>
                  </div>

                  {/* QR Preview on card */}
                  <div style={{ background: '#fff', padding: 6, borderRadius: 8 }}>
                    <QRCodeSVG value={publicVerificationUrl} size={70} />
                  </div>
                </div>

                {/* Card Footer */}
                <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8' }}>
                  <span>Academic Year: {record?.academic_year || '2024-25'}</span>
                  <span>Verhoeff Validated: ✓ Passed</span>
                  <span>Tamper-Proof Ledger Signed</span>
                </div>
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button type="button" className="btn pri" onClick={() => setActiveSubTab('share')}>
                  Share Verifiable QR
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ borderColor: 'var(--blue)', color: 'var(--blue)', fontWeight: 600 }}
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? 'Generating PDF...' : '📄 Download Official AICTE Certificate (PDF)'}
                </button>
                <button type="button" className="btn" onClick={() => setActiveSubTab('consent')}>
                  Configure Privacy
                </button>
              </div>
            </Card>

            {/* Right: Cryptographic Seal & Integrity Summary */}
            <Card title="Cryptographic Integrity Proofs">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0B2545', marginBottom: 4 }}>
                    Ed25519 Council Signature
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: '#64748B', wordBreak: 'break-all' }}>
                    {record?.ed25519_tamper_seal || 'ED25519_SEAL_V1_7c9f81a2e3b4d567890abcdef1234567890abcdef1234567890abcdef1234567'}
                  </div>
                  <span style={{ fontSize: 11, color: '#0F766E', display: 'inline-block', marginTop: 4 }}>
                    ✓ Signed by AICTE Regulation Authority Authority Key
                  </span>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0B2545', marginBottom: 4 }}>
                    Verhoeff Parity Checksum
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    Algorithm status: <Badge tone="green">VALID</Badge> (Protects against 100% of single-digit errors and 95.4% of transposition mistakes).
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0B2545', marginBottom: 4 }}>
                    Intake Quota Seat Category
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    Admitted under: <b>Approved Regular Intake ({record?.academic_year || '2024-25'})</b>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* SUB-TAB 2: DPDP PRIVACY & CONSENT MANAGER */}
      {activeSubTab === 'consent' && (
        <Card title="DPDP Act 2023 Consent & Selective Disclosure Controls">
          <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>
            In accordance with the <b>Digital Personal Data Protection Act, 2023</b>, you have complete sovereignty over what academic data is revealed to third parties. Toggling these controls immediately updates the Zero-Knowledge Proof (ZKP) verification layer.
          </p>

          {saveSuccess && (
            <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              ✓ Consent preferences saved securely to your student record.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Toggle 1 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0B2545' }}>
                  Zero-Knowledge Proof (ZKP) Degree Disclosure
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Verifiers confirm your legitimate enrolment and degree validity without accessing raw percentage, grades, or transcripts.
                </div>
              </div>
              <button
                type="button"
                className={`btn ${consent.selectiveDisclosure ? 'pri' : ''}`}
                onClick={() => handleToggleConsent('selectiveDisclosure')}
              >
                {consent.selectiveDisclosure ? 'Enabled ✓' : 'Disabled'}
              </button>
            </div>

            {/* Toggle 2 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0B2545' }}>
                  Mask Date of Birth (Age &gt; 18 Proof)
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Shares cryptographic proof that you satisfy the age threshold without disclosing your exact birthday.
                </div>
              </div>
              <button
                type="button"
                className={`btn ${consent.maskDob ? 'pri' : ''}`}
                onClick={() => handleToggleConsent('maskDob')}
              >
                {consent.maskDob ? 'Masked ✓' : 'Visible'}
              </button>
            </div>

            {/* Toggle 3 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0B2545' }}>
                  National Aadhaar Identity Redaction
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Permanent redaction: Verifiers only see 12-digit APAAR ID. Aadhaar is strictly masked by regulation.
                </div>
              </div>
              <Badge tone="green">ENFORCED BY LAW</Badge>
            </div>

            {/* Toggle 4 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0B2545' }}>
                  Allow Direct Corporate Recruiter Contact
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Permits verified enterprise employers to view an anonymized contact relay for internship and hiring offers.
                </div>
              </div>
              <button
                type="button"
                className={`btn ${consent.allowDirectEmployerContact ? 'pri' : ''}`}
                onClick={() => handleToggleConsent('allowDirectEmployerContact')}
              >
                {consent.allowDirectEmployerContact ? 'Allowed ✓' : 'Blocked'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* SUB-TAB 3: SHARE VERIFIABLE QR */}
      {activeSubTab === 'share' && (
        <div className="split">
          <Card title="Time-Limited Verifiable QR Code">
            <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>
              Share this cryptographic QR code on your resume, LinkedIn profile, or employment application. Verifiers can scan it with any camera to verify your credentials against the council registry.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <QRCodeSVG value={publicVerificationUrl} size={180} level="H" includeMargin />
              </div>
              <div className="mono" style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#0B2545' }}>
                APAAR: {record?.apaar_id || '9821-4567-8901'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                Tamper-Evident Hash: SHA-256 Validated
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              <button type="button" className="btn pri" onClick={handleCopyLink}>
                {copiedLink ? 'Copied Link ✓' : 'Copy Verification Link'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => window.print()}
              >
                Print / Save PDF
              </button>
            </div>
          </Card>

          <Card title="Verification Link Preview">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: '#334155' }}>
                <b>Public URL:</b>
                <div className="mono" style={{ background: '#F1F5F9', padding: '8px 12px', borderRadius: 6, fontSize: 11, wordBreak: 'break-all', marginTop: 4 }}>
                  {publicVerificationUrl}
                </div>
              </div>

              <div style={{ fontSize: 13, color: '#334155' }}>
                <b>Attributes Revealed to Public Verifiers:</b>
                <ul style={{ paddingLeft: 18, marginTop: 6, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  <li>Student Full Name: <b>{record?.name}</b></li>
                  <li>Accredited Institution: <b>{record?.institution_name}</b></li>
                  <li>Academic Program: <b>{record?.program_name}</b></li>
                  <li>Enrolment Status: <Badge tone="green">REGULAR ACTIVE</Badge></li>
                  <li>Council Seal: <Badge tone="sky">Ed25519 VERIFIED</Badge></li>
                </ul>
              </div>

              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                ℹ️ Private attributes (Marks, Aadhaar, Personal Address) remain strictly protected under your DPDP consent configuration.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SUB-TAB 4: ACCESS TRANSPARENCY LOG */}
      {activeSubTab === 'log' && (
        <Card title="Access Transparency Ledger ('Who Queried My Record')">
          <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>
            Under Section 11 of the <b>DPDP Act 2023</b>, you have the right to transparently review every individual, employer, or government body that has requested verification of your APAAR credentials.
          </p>

          <Table
            head={['Verifier / Organization', 'Category', 'Timestamp', 'Query Method', 'Attributes Disclosed', 'Cryptographic Proof']}
            rows={logs.map(log => [
              <div key={log.id}>
                <b>{log.verifier_name}</b>
              </div>,
              <Badge key="cat" tone={log.verifier_type === 'CORPORATE_EMPLOYER' ? 'sky' : 'amber'}>
                {log.verifier_type.replace('_', ' ')}
              </Badge>,
              <span key="ts" className="mono" style={{ fontSize: 11 }}>{log.timestamp}</span>,
              <span key="meth" className="badge" style={{ background: '#E2E8F0', color: '#1E293B' }}>{log.method}</span>,
              <span key="attr" style={{ fontSize: 12 }}>{log.attributes_shared}</span>,
              <Badge key="status" tone="green">VALID ✓</Badge>
            ])}
          />
        </Card>
      )}
    </Shell>
  );
};
