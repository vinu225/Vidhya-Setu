import React, { useState } from 'react';
import { Shell, Head, Card, Badge, Skeleton, ErrorState, EmptyState, Table } from '../components/ui';
import { api, UserInfo, VerificationResult } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

interface VerificationPortalProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [apaarInput, setApaarInput] = useState('984210573915');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasQueried, setHasQueried] = useState(false);
  const [history, setHistory] = useState<Array<{
    id: string;
    apaar: string;
    name: string;
    institution: string;
    time: string;
    valid: boolean;
  }>>([
    {
      id: 'REC-001',
      apaar: '9821-4567-8901',
      name: 'Rahul Sharma',
      institution: 'Delhi Technological University',
      time: '18:40 IST',
      valid: true
    }
  ]);

  const handleVerify = async (queryId?: string) => {
    const idToSearch = (queryId || apaarInput).trim().replace(/\s+/g, '');

    if (!idToSearch) {
      setErrorMsg('Please enter a 12-digit APAAR ID or Credential ID.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setHasQueried(true);

      const isCredId = idToSearch.startsWith('AICTE-VC-');
      const res = await api.verifyCredential({
        credential_id: isCredId ? idToSearch : undefined,
        apaar_id: !isCredId ? idToSearch : undefined
      });
      setResult(res);

      if (res && res.tamper_status) {
        setHistory(prev => [
          {
            id: `REC-${Date.now().toString().slice(-4)}`,
            apaar: idToSearch,
            name: res.data_disclosed?.name || 'Verified Candidate',
            institution: res.data_disclosed?.institution_name || 'Accredited Institution',
            time: new Date().toLocaleTimeString(),
            valid: res.tamper_status === 'VALID' || res.tamper_status === 'UNALTERED'
          },
          ...prev.slice(0, 4)
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification service error.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (sampleId: string) => {
    setApaarInput(sampleId);
    handleVerify(sampleId);
  };

  return (
    <Shell
      active="verify"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="External verification"
        title="Verification portal"
        sub="Check student authenticity, active enrolment status, and tamper-proof credential seals with APAAR ID."
      />

      {errorMsg && <ErrorState error={errorMsg} />}

      <div className="split">
        {/* Left Card: Input & Verification Query */}
        <Card title="Verify a student">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleVerify();
            }}
          >
            <label className="field">
              <span>APAAR ID or Credential Key</span>
              <input
                className="mono"
                type="text"
                placeholder="Enter 12-digit APAAR ID"
                value={apaarInput}
                onChange={e => setApaarInput(e.target.value)}
                required
              />
            </label>

            {/* Quick Demo Test Pills */}
            <div style={{ margin: '12px 0' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>
                Benchmark Candidates:
              </span>
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('984210573915')}
                  className="btn"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  ✓ Valid Student (DTU Delhi)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('883920194835')}
                  className="btn"
                  style={{ fontSize: 11, padding: '4px 8px', color: 'var(--red)', borderColor: '#FCA5A5' }}
                >
                  ✕ Collision Candidate
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn pri"
              disabled={loading}
              style={{ width: '100%', padding: 10, marginTop: 16 }}
            >
              {loading ? 'Verifying with Sovereign Gateway...' : 'Verify student'}
            </button>
          </form>
        </Card>

        {/* Right Card: Result matching design */}
        <Card title="Verification Result">
          {loading ? (
            <div style={{ display: 'grid', gap: 12, padding: 12 }}>
              <Skeleton height={28} width={120} />
              <Skeleton height={18} />
              <Skeleton height={18} />
              <Skeleton height={18} />
            </div>
          ) : result ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge tone={result.is_valid && result.is_authentic_aicte_record ? 'green' : 'red'}>
                  {result.is_valid && result.is_authentic_aicte_record ? 'Verified Authentic' : 'Flagged / Unverified'}
                </Badge>
                {result.tamper_proof_seal && (
                  <span className="mono" style={{ fontSize: 10, color: 'var(--slate)' }}>
                    Seal: {result.tamper_proof_seal.slice(0, 12)}…
                  </span>
                )}
              </div>

              <ul className="list" style={{ marginTop: 16 }}>
                <li>
                  <span>Student Name</span>
                  <strong>{result.data_disclosed?.student_name || 'Protected Candidate'}</strong>
                </li>
                <li>
                  <span>Institution</span>
                  <span>{result.data_disclosed?.institution_name || '—'}</span>
                </li>
                <li>
                  <span>Program</span>
                  <span>{result.data_disclosed?.program_name || '—'}</span>
                </li>
                <li>
                  <span>Enrolment Status</span>
                  <Badge tone={result.data_disclosed?.enrolment_status === 'ACTIVE' ? 'green' : 'amber'}>
                    {result.data_disclosed?.enrolment_status || 'ACTIVE'}
                  </Badge>
                </li>
                <li>
                  <span>Audit Reference</span>
                  <span className="mono" style={{ fontSize: 12 }}>
                    VR-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-{(result.tamper_proof_seal || '0042').slice(0, 4)}
                  </span>
                </li>
              </ul>

              {/* QR Code Verification Preview */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ background: '#fff', padding: 4, borderRadius: 6, border: '1px solid var(--mist)' }}>
                  <QRCodeSVG
                    value={`https://aicte.gov.in/verify?key=${apaarInput}`}
                    size={64}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--slate)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Cryptographic Sovereign Seal</div>
                  <div>Scannable by authorized government verification apps under NEP 2020.</div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="Awaiting verification query"
              message="Enter a 12-digit APAAR ID or choose a benchmark candidate to inspect credentials."
            />
          )}
        </Card>
      </div>

      {/* Employer Verification Audit Receipt History */}
      <Card title="Active Session Verification Receipts" style={{ marginTop: 20 }}>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 14 }}>
          Tamper-evident verification receipts generated during your active employer session. Suitable for HR audit compliance.
        </p>
        <Table
          head={['Receipt ID', 'Candidate APAAR', 'Candidate Name', 'Accredited Institution', 'Verified At', 'Cryptographic Proof']}
          rows={history.map(h => [
            <span key="id" className="mono" style={{ fontWeight: 600 }}>{h.id}</span>,
            <span key="apaar" className="mono">{h.apaar}</span>,
            <span key="name">{h.name}</span>,
            <span key="inst" style={{ fontSize: 12 }}>{h.institution}</span>,
            <span key="time" className="mono" style={{ fontSize: 11 }}>{h.time}</span>,
            <Badge key="status" tone={h.valid ? 'green' : 'amber'}>
              {h.valid ? 'SEAL VALID ✓' : 'VERIFIED'}
            </Badge>
          ])}
        />
      </Card>
    </Shell>
  );
};

export default VerificationPortal;
