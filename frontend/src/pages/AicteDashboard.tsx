import React, { useState, useEffect } from 'react';
import { Shell, Head, Card, Kpi, Badge, Table, Bars, Skeleton, ErrorState, EmptyState } from '../components/ui';
import { api, NationalOverview, Institution, UserInfo } from '../services/api';
import { SakshamScrutinyStudio } from '../components/SakshamScrutinyStudio';
import { IndiaSurveillanceMap } from '../components/IndiaSurveillanceMap';

interface AicteDashboardProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

// Module-level cache so tab switching renders instantly (0ms) without skeletons
let memoryCachedOverview: NationalOverview | null = null;

export const AicteDashboard: React.FC<AicteDashboardProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [overview, setOverview] = useState<NationalOverview | null>(memoryCachedOverview);
  const [loading, setLoading] = useState<boolean>(!memoryCachedOverview);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [showSakshamStudio, setShowSakshamStudio] = useState<boolean>(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (!memoryCachedOverview) {
        setLoading(true);
      }
      setError(null);
      const overviewData = await api.getNationalOverview();
      memoryCachedOverview = overviewData;
      setOverview(overviewData);
    } catch (err: any) {
      console.error('Failed to load AICTE Dashboard metrics:', err);
      if (!memoryCachedOverview) {
        setError(err.message || 'Could not connect to AICTE regulatory overview API.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportSummary = async () => {
    try {
      setExporting(true);
      await api.downloadEnrolmentReport();
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Filtered institutions if a state is selected on the Map
  const filteredRiskInstitutions = (overview?.top_risk_institutions || []).filter(inst => {
    if (!selectedState) return true;
    return inst.state?.toLowerCase().includes(selectedState.toLowerCase()) ||
           selectedState.toLowerCase().includes(inst.state?.toLowerCase());
  });

  // Prepare Bars data from top risk institutions
  const barRows: [string, number, number][] = (filteredRiskInstitutions.length > 0)
    ? filteredRiskInstitutions.slice(0, 6).map(inst => [
        inst.name.length > 20 ? inst.name.slice(0, 18) + '…' : inst.name,
        inst.approved_intake,
        inst.actual_enrolled
      ])
    : [];

  // Institution Compliance summary table rows
  const complianceRows = filteredRiskInstitutions.slice(0, 8).map(inst => {
    const isOver = inst.actual_enrolled > inst.approved_intake;
    const isNear = inst.actual_enrolled >= inst.approved_intake * 0.9 && !isOver;

    const statusBadge = isOver ? (
      <Badge tone="red">Over intake (+{inst.actual_enrolled - inst.approved_intake})</Badge>
    ) : isNear ? (
      <Badge tone="amber">Near cap ({Math.round((inst.actual_enrolled / (inst.approved_intake || 1)) * 100)}%)</Badge>
    ) : (
      <Badge tone="green">Within intake</Badge>
    );

    return [
      <span>
        <strong>{inst.name}</strong>
        <span className="mono" style={{ display: 'block', fontSize: 11, color: '#64748B' }}>
          {inst.official_code} • {inst.state}
        </span>
      </span>,
      <span className="mono">{inst.actual_enrolled.toLocaleString('en-IN')} / {inst.approved_intake.toLocaleString('en-IN')}</span>,
      statusBadge
    ];
  });

  return (
    <Shell
      active="dashboard"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="Vidhya Setu • Regulatory HQ"
        title="Vidhya Setu — AICTE Dashboard"
        sub="National student data and intake compliance surveillance across approved technical institutions."
      >
        <span className="badge sky" style={{ marginRight: 8 }}>
          <span aria-hidden>i</span>Live Supabase Cloud DB
        </span>
        <button
          type="button"
          onClick={() => setShowSakshamStudio(true)}
          className="btn"
          style={{ borderColor: 'var(--blue)', color: 'var(--blue)', fontWeight: 600 }}
        >
          🔍 Document Scrutiny Studio
        </button>
        <button
          type="button"
          onClick={handleExportSummary}
          className="btn"
          disabled={exporting || loading}
        >
          {exporting ? 'Generating CSV...' : 'Export summary'}
        </button>
      </Head>

      {error && <ErrorState error={error} onRetry={fetchData} />}

      {loading && !overview ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="grid">
            <Skeleton height={96} />
            <Skeleton height={96} />
            <Skeleton height={96} />
            <Skeleton height={96} />
            <Skeleton height={96} />
          </div>
          <div className="split">
            <Skeleton height={280} />
            <Skeleton height={280} />
          </div>
        </div>
      ) : overview ? (
        <>
          {/* Top KPI Metric Cards */}
          <div className="grid">
            <Kpi
              label="Institutions"
              value={overview.total_institutions.toLocaleString('en-IN')}
              note={<span className="sub">Approved AICTE technical campuses</span>}
            />
            <Kpi
              label="Registered students"
              value={overview.total_enrolled.toLocaleString('en-IN')}
              note={<span className="sub">Active sovereign APAAR IDs</span>}
            />
            <Kpi
              label="Verified records"
              value={(overview.total_enrolled - overview.provisional_students).toLocaleString('en-IN')}
              note={
                <Badge tone="green">
                  {Math.round(((overview.total_enrolled - overview.provisional_students) / Math.max(overview.total_enrolled, 1)) * 100)}% verified
                </Badge>
              }
            />
            <Kpi
              label="Pending records"
              value={overview.open_validation_issues.toLocaleString('en-IN')}
              note={<Badge tone="amber">Needs review</Badge>}
            />
            <Kpi
              label="Flagged anomalies"
              value={overview.active_anomaly_alerts.toLocaleString('en-IN')}
              note={
                <Badge tone="red">
                  {overview.alert_severity_breakdown.critical + overview.alert_severity_breakdown.high} high risk
                </Badge>
              }
            />
          </div>

          {/* Interactive Geo-Spatial India Surveillance Map */}
          <div style={{ marginTop: 16 }}>
            <IndiaSurveillanceMap
              stateMetrics={overview.state_breakdown}
              selectedState={selectedState}
              onSelectState={setSelectedState}
            />
          </div>

          {/* Split Charts & Alerts */}
          <div className="split">
            <Card title="Approved intake vs enrolment">
              {barRows.length > 0 ? (
                <Bars rows={barRows} />
              ) : (
                <EmptyState title="No institution records" message="Approved intake data will appear here once institutions are synced." />
              )}
            </Card>

            <Card title="Recent alerts">
              {overview.recent_alerts && overview.recent_alerts.length > 0 ? (
                <ul className="list">
                  {overview.recent_alerts.slice(0, 5).map(alert => {
                    const tone: 'red' | 'amber' | 'green' =
                      alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                        ? 'red'
                        : alert.severity === 'MEDIUM'
                        ? 'amber'
                        : 'green';
                    return (
                      <li key={alert.id || alert.alert_id}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{alert.title}</div>
                          <div className="mono" style={{ fontSize: 11, color: '#64748B' }}>
                            {alert.affected_institutions?.join(', ') || alert.alert_type}
                          </div>
                        </div>
                        <Badge tone={tone}>{alert.severity}</Badge>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  title="Zero Active Alerts"
                  message="No critical regulatory breaches detected across monitored programs."
                />
              )}
            </Card>
          </div>

          {/* Document Verification & Forensic Hub Card */}
          <Card
            title="Document Verification & Forensic Scrutiny Hub"
            style={{ marginTop: 16, borderLeft: '4px solid var(--blue)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p className="sub" style={{ margin: '0 0 6px 0', fontSize: 13 }}>
                  National automated scrutiny engine: OCR raster scan analysis, PDF metadata chronology inspection, Verhoeff checksum parity, and cross-university collision detection.
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                  <Badge tone="green">4,892 Documents Ingested</Badge>
                  <Badge tone="sky">98.6% Verification Rate</Badge>
                  <Badge tone="red">12 Inter-State Collisions Flagged</Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSakshamStudio(true)}
                className="btn pri"
                style={{ fontSize: 12, padding: '8px 16px' }}
              >
                Open Forensic Studio ➔
              </button>
            </div>
          </Card>

          {/* Institution Compliance Summary Table */}
          <Card title="Institution compliance summary" style={{ marginTop: 16 }}>
            <Table
              head={['Institution', 'Enrolled / Approved', 'Compliance Status']}
              rows={complianceRows}
            />
          </Card>
        </>
      ) : null}

      {showSakshamStudio && (
        <SakshamScrutinyStudio
          onClose={() => setShowSakshamStudio(false)}
          role="AICTE_ADMIN"
        />
      )}
    </Shell>
  );
};

export default AicteDashboard;
