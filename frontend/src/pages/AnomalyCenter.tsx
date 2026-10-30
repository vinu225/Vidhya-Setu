import React, { useEffect, useState } from 'react';
import { Shell, Head, Card, Kpi, Badge, Table, Skeleton, ErrorState, EmptyState } from '../components/ui';
import { api, UserInfo, AnomalyAlert, DuplicateCase } from '../services/api';

interface AnomalyCenterProps {
  user: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

// Module-level cache for instant tab loading
let memoryCachedAlerts: AnomalyAlert[] = [];
let memoryCachedDuplicates: DuplicateCase[] = [];

export const AnomalyCenter: React.FC<AnomalyCenterProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const hasCached = memoryCachedAlerts.length > 0 || memoryCachedDuplicates.length > 0;
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(memoryCachedAlerts);
  const [duplicateCases, setDuplicateCases] = useState<DuplicateCase[]>(memoryCachedDuplicates);
  const [loading, setLoading] = useState(!hasCached);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [resolving, setResolving] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const loadData = async () => {
    try {
      if (!hasCached) {
        setLoading(true);
      }
      setError(null);
      const [alts, dups] = await Promise.all([
        api.getAnomalyAlerts(),
        api.getDuplicateCases()
      ]);
      memoryCachedAlerts = alts;
      memoryCachedDuplicates = dups;
      setAlerts(alts);
      setDuplicateCases(dups);

      // Select first item by default if available
      if (dups.length > 0) {
        const d = dups[0];
        setSelectedItem({
          id: d.id,
          caseId: d.case_id,
          title: `Dual Enrolment: ${d.student_name}`,
          reason: d.detection_reason,
          score: '98',
          severity: d.severity,
          status: d.review_status,
          itemType: 'duplicate',
          raw: d
        });
      } else if (alts.length > 0) {
        const a = alts[0];
        setSelectedItem({
          id: a.id,
          caseId: a.alert_id,
          title: a.title,
          reason: a.description,
          score: Math.round(a.anomaly_score * 100).toString(),
          severity: a.severity,
          status: a.status,
          itemType: 'alert',
          raw: a
        });
      }
    } catch (err: any) {
      console.error('Failed to load anomalies', err);
      setError(err.message || 'Error loading anomaly center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanMessage('Running national anomaly scan...');
      const res = await api.runNationalIntegrityScan();
      setScanMessage(res.message);
      await loadData();
      setTimeout(() => setScanMessage(''), 4000);
    } catch (err: any) {
      alert(`Scan error: ${err.message}`);
      setScanMessage('');
    }
  };

  const handleMarkReviewed = async () => {
    if (!selectedItem) return;
    try {
      setResolving(true);
      if (selectedItem.itemType === 'duplicate') {
        await api.resolveDuplicateCase(selectedItem.id, 'RESOLVED_VALID', 'Regulatory verification confirmed legitimate transition.');
      } else {
        await api.reviewAnomalyAlert(selectedItem.id, 'Verified institutional quota documentation.');
      }
      await loadData();
    } catch (err: any) {
      alert(`Review error: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedItem) return;
    try {
      setResolving(true);
      if (selectedItem.itemType === 'duplicate') {
        await api.resolveDuplicateCase(selectedItem.id, 'CONFIRMED_DUPLICATE', 'Formal AICTE notice issued for dual enrolment violation.');
      } else {
        await api.reviewAnomalyAlert(selectedItem.id, 'Escalated to AICTE Regional Approval Bureau.');
      }
      await loadData();
    } catch (err: any) {
      alert(`Escalation error: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  // Combine duplicates and alerts for unified surveillance
  const combinedCases = [
    ...duplicateCases.map(d => ({
      id: d.id,
      caseId: d.case_id,
      title: `Dual Enrolment: ${d.student_name}`,
      reason: d.detection_reason,
      score: '98',
      severity: d.severity,
      status: d.review_status,
      itemType: 'duplicate',
      raw: d
    })),
    ...alerts.map(a => ({
      id: a.id,
      caseId: a.alert_id,
      title: a.title,
      reason: a.description,
      score: Math.round(a.anomaly_score * 100).toString(),
      severity: a.severity,
      status: a.status,
      itemType: 'alert',
      raw: a
    }))
  ];

  const filteredCases = combinedCases.filter(
    c =>
      c.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const highRiskCount = combinedCases.filter(
    c => c.severity === 'CRITICAL' || c.severity === 'HIGH'
  ).length;

  const unresolvedCount = combinedCases.filter(
    c => c.status === 'OPEN' || c.status === 'PENDING'
  ).length;

  // Format table rows
  const tableRows = filteredCases.slice(0, 15).map(c => {
    const isSelected = selectedItem?.id === c.id;
    const tone: 'red' | 'amber' | 'green' =
      c.severity === 'CRITICAL' || c.severity === 'HIGH'
        ? 'red'
        : c.severity === 'MEDIUM'
        ? 'amber'
        : 'green';

    return [
      <button
        type="button"
        onClick={() => setSelectedItem(c)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'inherit',
          width: '100%'
        }}
      >
        <span
          className="mono"
          style={{
            fontWeight: isSelected ? 700 : 500,
            color: isSelected ? 'var(--blue)' : 'inherit'
          }}
        >
          {c.caseId}
        </span>
      </button>,
      <span style={{ fontSize: 13, maxWidth: 260, display: 'inline-block' }}>{c.title}</span>,
      <span className="mono">{c.score}</span>,
      <Badge tone={tone}>{c.severity}</Badge>
    ];
  });

  return (
    <Shell
      active="anomalies"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="Risk monitoring"
        title="Anomaly & fraud center"
        sub="Review records flagged for multi-institution duplication or statistical intake outlier patterns."
      >
        {user?.role === 'AICTE_ADMIN' && (
          <button
            type="button"
            onClick={handleRunScan}
            className="btn"
          >
            Run national scan
          </button>
        )}
      </Head>

      {scanMessage && (
        <div className="badge sky" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
          <span aria-hidden>i</span>
          <span>{scanMessage}</span>
        </div>
      )}

      {error && <ErrorState error={error} onRetry={loadData} />}

      {/* 3 KPIs matching design */}
      <div className="grid">
        <Kpi
          label="Flagged cases"
          value={combinedCases.length.toLocaleString('en-IN')}
          note={<span className="sub">Surveillance collisions & anomalies</span>}
        />
        <Kpi
          label="High risk"
          value={highRiskCount.toLocaleString('en-IN')}
          note={<Badge tone="red">Urgent</Badge>}
        />
        <Kpi
          label="Unresolved"
          value={unresolvedCount.toLocaleString('en-IN')}
          note={<Badge tone="amber">Open</Badge>}
        />
      </div>

      {loading && combinedCases.length === 0 ? (
        <div className="split" style={{ marginTop: 16 }}>
          <Skeleton height={320} />
          <Skeleton height={320} />
        </div>
      ) : (
        <div className="split" style={{ marginTop: 16 }}>
          {/* Table List of Cases */}
          <Card>
            <input
              type="text"
              placeholder="Search flagged cases, institutions, IDs"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', marginBottom: 14 }}
            />
            {filteredCases.length > 0 ? (
              <Table
                head={['Case', 'Reason', 'Score', 'Severity']}
                rows={tableRows}
              />
            ) : (
              <EmptyState
                title="No Matching Anomaly Cases"
                message="All verified records are within nominal regulatory thresholds."
              />
            )}
          </Card>

          {/* Selected Case Inspection Card */}
          <Card title={selectedItem ? `Case ${selectedItem.caseId || selectedItem.case_id}` : 'Select a Case'}>
            {selectedItem ? (
              <>
                <ul className="list">
                  {selectedItem.itemType === 'duplicate' ? (
                    <>
                      <li>
                        <span>Student Candidate</span>
                        <strong>{selectedItem.raw?.student_name}</strong>
                      </li>
                      <li>
                        <span>Primary Campus</span>
                        <span className="mono">{selectedItem.raw?.primary_institution_name}</span>
                      </li>
                      <li>
                        <span>Colliding Campus</span>
                        <span className="mono" style={{ color: 'var(--red)' }}>
                          {selectedItem.raw?.secondary_institution_name}
                        </span>
                      </li>
                      <li>
                        <span>Evidence</span>
                        <span style={{ fontSize: 12 }}>{selectedItem.raw?.evidence_summary}</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <span>Alert Title</span>
                        <strong>{selectedItem.raw?.title}</strong>
                      </li>
                      <li>
                        <span>Impacted Institution</span>
                        <span>{selectedItem.raw?.affected_institutions?.join(', ') || 'National'}</span>
                      </li>
                      <li>
                        <span>Isolation Forest Score</span>
                        <b className="mono">{Math.round((selectedItem.raw?.anomaly_score || 0) * 100)} / 100</b>
                      </li>
                      <li>
                        <span>Description</span>
                        <span style={{ fontSize: 12 }}>{selectedItem.raw?.description}</span>
                      </li>
                    </>
                  )}
                  <li>
                    <span>Regulatory Status</span>
                    <Badge tone={selectedItem.status === 'RESOLVED' ? 'green' : 'amber'}>
                      {selectedItem.status || 'OPEN'}
                    </Badge>
                  </li>
                </ul>

                <p className="sub" style={{ marginTop: 14, fontSize: 12 }}>
                  {selectedItem.itemType === 'duplicate'
                    ? 'Same APAAR ID concurrently holds active full-time enrolment in multiple campuses.'
                    : 'Unsupervised ML algorithm detected statistical deviation exceeding peer group norms.'}
                </p>

                {user?.role === 'AICTE_ADMIN' && (
                  <div className="row" style={{ marginTop: 16, gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleMarkReviewed}
                      className="btn pri"
                      disabled={resolving}
                    >
                      {resolving ? 'Updating...' : 'Mark reviewed'}
                    </button>
                    <button
                      type="button"
                      onClick={handleEscalate}
                      className="btn"
                      disabled={resolving}
                      style={{ color: 'var(--red)', borderColor: '#FCA5A5' }}
                    >
                      Escalate Sanction
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No case selected"
                message="Click any row on the left table to inspect regulatory collision evidence."
              />
            )}
          </Card>
        </div>
      )}
    </Shell>
  );
};

export default AnomalyCenter;
