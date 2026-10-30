import React, { useState, useEffect } from 'react';
import { Shell, Head, Badge, Card, Kpi } from '../components/ui';
import { api, UserInfo } from '../services/api';
import '../apaar.css';

interface DemoCase {
  case_id: string;
  institution_a: { name: string; code: string; state: string };
  institution_b: { name: string; code: string; state: string };
  student_a: { name: string; dob: string; father: string; apaar: string; bigrams: string[]; bit_preview: string; popcount: number };
  student_b: { name: string; dob: string; father: string; apaar: string; bigrams: string[]; bit_preview: string; popcount: number };
  intersection: { shared_bigrams: string[]; bit_preview: string; popcount: number };
  similarity_score: number;
  verdict: string;
  dpdp_guarantee: string;
  note: string;
}

interface BlindMatchExplorerProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const BlindMatchExplorer: React.FC<BlindMatchExplorerProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [cases, setCases] = useState<DemoCase[]>([]);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(0.85);
  const [freezeNoticeSent, setFreezeNoticeSent] = useState<boolean>(false);

  // Live sandbox inputs
  const [nameA, setNameA] = useState<string>('Priya Venkatesh');
  const [dobA, setDobA] = useState<string>('2004-08-12');
  const [fatherA, setFatherA] = useState<string>('Venkatesh R');
  const [nameB, setNameB] = useState<string>('Priya V');
  const [dobB, setDobB] = useState<string>('2004-08-12');
  const [fatherB, setFatherB] = useState<string>('Venkatesh');
  const [liveResult, setLiveResult] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchDemoCases();
  }, []);

  const fetchDemoCases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/engine/blind-match/demo-cases');
      setCases(res);
    } catch (err) {
      console.error('Failed to load demo cases', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLiveLoading(true);
      const res = await api.post('/engine/blind-match/compare', {
        name_a: nameA,
        dob_a: dobA,
        father_a: fatherA,
        name_b: nameB,
        dob_b: dobB,
        father_b: fatherB
      });
      setLiveResult(res);
    } catch (err) {
      console.error('Live compare failed', err);
    } finally {
      setLiveLoading(false);
    }
  };

  const activeCase = cases[selectedCaseIdx];

  return (
    <Shell
      active="blindmatch"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="NEP 2020 & DPDP ACT 2023 COMPLIANT • CRYPTOGRAPHIC LINKAGE"
        title="Blind Match Privacy-Preserving Linkage Explorer"
        sub="Detect cross-institutional duplicate admissions and ghost enrolments using 1024-bit HMAC-SHA256 Bloom filters and Dice similarity coefficients without centralizing student PII."
      >
        <span className="badge sky" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
          🔒 Zero Plaintext Storage
        </span>
      </Head>

      {/* DPDP Architectural Guarantee Banner */}
      <div className="apaar-card mb-4" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(16, 185, 129, 0.04))', borderColor: 'rgba(37, 99, 235, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ fontSize: '2rem' }}>🛡️</div>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              How Blind Match Preserves Student Privacy
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              1. Identity tokens are normalized into 2-character shingles (bigrams) and salted with the student's hashed birth cohort.
              <br />
              2. Tokens are hashed into a <strong>1024-bit Bloom filter bit-array</strong> using double hashing (<code style={{ background: 'var(--bg-card)', padding: '2px 4px', borderRadius: '4px' }}>position = (h1 + i * h2) % 1024</code>).
              <br />
              3. Only cryptographic bit-vectors are transmitted across state borders—raw Aadhaar numbers, parents' names, and addresses are <strong>mathematically irreversible</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Case Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {cases.map((c, idx) => (
          <button
            key={c.case_id}
            onClick={() => { setSelectedCaseIdx(idx); setFreezeNoticeSent(false); }}
            className={`apaar-btn ${selectedCaseIdx === idx ? 'primary' : 'outline'}`}
            style={{ fontSize: '0.85rem' }}
          >
            Case {idx + 1}: {c.case_id} ({c.verdict === 'DUPLICATE_COLLISION' ? '🚨 Collision' : '✅ Clear'})
          </button>
        ))}
      </div>

      {/* Active Case Inspection */}
      {loading ? (
        <div className="apaar-card p-5 text-center">Loading cryptographic records...</div>
      ) : activeCase ? (
        <div className="apaar-grid-2 mb-4">
          {/* Left Column: Side-by-Side Identity Comparison */}
          <div className="apaar-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Cross-Institution Pair Comparison</h3>
              <span className={`apaar-badge ${activeCase.similarity_score >= threshold ? 'red' : 'green'}`}>
                Dice Similarity: {(activeCase.similarity_score * 100).toFixed(1)}%
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              <strong>Audit Scenario:</strong> {activeCase.note}
            </p>

            {/* Institution A Record */}
            <div style={{ background: 'var(--bg-subtle, rgba(0,0,0,0.02))', padding: '14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>
                  Primary Institution: {activeCase.institution_a.name}
                </span>
                <span className="apaar-badge outline" style={{ fontSize: '0.75rem' }}>{activeCase.institution_a.state}</span>
              </div>
              <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>Student Name: <strong>{activeCase.student_a.name}</strong></div>
                <div>APAAR ID: <code>{activeCase.student_a.apaar}</code></div>
                <div>DOB: {activeCase.student_a.dob}</div>
                <div>Guardian: {activeCase.student_a.father}</div>
              </div>
              {/* Bigrams */}
              <div style={{ marginTop: '8px', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Normalized Shingles: </span>
                {activeCase.student_a.bigrams.map((b, i) => (
                  <span key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1px 5px', borderRadius: '4px', marginRight: '4px', fontFamily: 'monospace' }}>
                    {b}
                  </span>
                ))}
              </div>
              {/* Bit Vector Preview */}
              <div style={{ marginTop: '8px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                64-Bit Signature: <span style={{ color: 'var(--primary)' }}>{activeCase.student_a.bit_preview}</span> (Popcount: {activeCase.student_a.popcount})
              </div>
            </div>

            {/* Institution B Record */}
            <div style={{ background: 'var(--bg-subtle, rgba(0,0,0,0.02))', padding: '14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ea580c' }}>
                  Disputed Institution: {activeCase.institution_b.name}
                </span>
                <span className="apaar-badge outline" style={{ fontSize: '0.75rem' }}>{activeCase.institution_b.state}</span>
              </div>
              <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>Student Name: <strong>{activeCase.student_b.name}</strong></div>
                <div>APAAR ID: <code>{activeCase.student_b.apaar}</code></div>
                <div>DOB: {activeCase.student_b.dob}</div>
                <div>Guardian: {activeCase.student_b.father}</div>
              </div>
              {/* Bigrams */}
              <div style={{ marginTop: '8px', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Normalized Shingles: </span>
                {activeCase.student_b.bigrams.map((b, i) => (
                  <span key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1px 5px', borderRadius: '4px', marginRight: '4px', fontFamily: 'monospace' }}>
                    {b}
                  </span>
                ))}
              </div>
              {/* Bit Vector Preview */}
              <div style={{ marginTop: '8px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                64-Bit Signature: <span style={{ color: '#ea580c' }}>{activeCase.student_b.bit_preview}</span> (Popcount: {activeCase.student_b.popcount})
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                className={`apaar-btn ${freezeNoticeSent ? 'outline' : 'danger'}`}
                onClick={() => setFreezeNoticeSent(true)}
                disabled={freezeNoticeSent || activeCase.similarity_score < threshold}
              >
                {freezeNoticeSent ? '✅ Statutory Freeze Notice Dispatched' : '🚨 Issue Provisional Admission Freeze'}
              </button>
            </div>
          </div>

          {/* Right Column: Bitwise Overlap & Dice Similarity Math */}
          <div className="apaar-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600 }}>
              Cryptographic Linkage Analysis
            </h3>

            {/* Dice Overlap Gauge */}
            <div style={{ background: 'var(--bg-subtle, rgba(0,0,0,0.02))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Dice Coefficient Formula:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>2 × |A ∩ B| / (|A| + |B|)</span>
              </div>
              <div style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                = 2 × {activeCase.intersection.popcount} / ({activeCase.student_a.popcount} + {activeCase.student_b.popcount})
                = <strong>{(activeCase.similarity_score * 100).toFixed(2)}%</strong>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(activeCase.similarity_score * 100, 100)}%`,
                    background: activeCase.similarity_score >= threshold ? '#ef4444' : '#10b981',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>0.0 (Distinct)</span>
                <span style={{ color: '#ef4444' }}>Threshold: {(threshold * 100).toFixed(0)}% (Violation Flag)</span>
                <span>1.0 (Exact)</span>
              </div>
            </div>

            {/* Threshold Slider */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                <span>Dice Threshold Sensitivity Slider:</span>
                <strong>{(threshold * 100).toFixed(0)}%</strong>
              </label>
              <input
                type="range"
                min="0.60"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Intersection Bit Preview */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                Bitwise Intersect Preview (|A ∩ B|):
              </div>
              <div style={{ background: '#0f172a', color: '#38bdf8', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {activeCase.intersection.bit_preview}
              </div>
            </div>

            {/* Shared Shingles */}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                Matching Substring Shingles ({activeCase.intersection.shared_bigrams.length}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {activeCase.intersection.shared_bigrams.map((b, i) => (
                  <span key={i} style={{ background: '#10b98115', border: '1px solid #10b98140', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Live Interactive Sandbox */}
      <div className="apaar-card">
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 600 }}>
          🧪 Live Cryptographic Identity Linkage Sandbox
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Test any two student profiles in real-time. The engine will normalize the names, compute HMAC-SHA256 Bloom filters, and calculate the Dice coefficient.
        </p>

        <form onSubmit={handleLiveCompare}>
          <div className="apaar-grid-2 mb-3">
            {/* Student A Input */}
            <div style={{ background: 'var(--bg-subtle, rgba(0,0,0,0.02))', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--primary)' }}>Profile A (College 1)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Full Student Name"
                  className="apaar-input"
                  value={nameA}
                  onChange={(e) => setNameA(e.target.value)}
                  required
                />
                <input
                  type="date"
                  placeholder="DOB"
                  className="apaar-input"
                  value={dobA}
                  onChange={(e) => setDobA(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Guardian / Father Name (Optional)"
                  className="apaar-input"
                  value={fatherA}
                  onChange={(e) => setFatherA(e.target.value)}
                />
              </div>
            </div>

            {/* Student B Input */}
            <div style={{ background: 'var(--bg-subtle, rgba(0,0,0,0.02))', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#ea580c' }}>Profile B (College 2)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Full Student Name"
                  className="apaar-input"
                  value={nameB}
                  onChange={(e) => setNameB(e.target.value)}
                  required
                />
                <input
                  type="date"
                  placeholder="DOB"
                  className="apaar-input"
                  value={dobB}
                  onChange={(e) => setDobB(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Guardian / Father Name (Optional)"
                  className="apaar-input"
                  value={fatherB}
                  onChange={(e) => setFatherB(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="apaar-btn primary" disabled={liveLoading}>
            {liveLoading ? 'Computing Cryptographic Bitmasks...' : '⚡ Execute Live Blind Match Linkage'}
          </button>
        </form>

        {/* Live Result Display */}
        {liveResult && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                Linkage Result: <span style={{ color: liveResult.similarity_score >= 0.85 ? '#ef4444' : '#10b981' }}>{liveResult.verdict}</span>
              </span>
              <span className={`apaar-badge ${liveResult.similarity_score >= 0.85 ? 'red' : 'green'}`} style={{ fontSize: '0.9rem' }}>
                Dice Score: {(liveResult.similarity_score * 100).toFixed(2)}%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <strong>Profile A Popcount:</strong> {liveResult.student_a.popcount} set bits
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{liveResult.student_a.bit_preview}</div>
              </div>
              <div>
                <strong>Profile B Popcount:</strong> {liveResult.student_b.popcount} set bits
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{liveResult.student_b.bit_preview}</div>
              </div>
              <div>
                <strong>Overlap Bit Popcount:</strong> {liveResult.intersection.popcount} set bits
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{liveResult.intersection.bit_preview}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};
