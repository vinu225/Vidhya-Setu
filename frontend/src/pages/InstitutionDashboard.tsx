import React, { useEffect, useState } from 'react';
import { Shell, Head, Card, Kpi, Badge, Table, Skeleton, ErrorState, EmptyState } from '../components/ui';
import { api, UserInfo, Institution } from '../services/api';
import { SakshamScrutinyStudio } from '../components/SakshamScrutinyStudio';

interface InstitutionDashboardProps {
  user: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [instData, setInstData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSakshamStudio, setShowSakshamStudio] = useState(false);

  useEffect(() => {
    if (user?.institution_id) {
      setSelectedInstId(user.institution_id);
      loadDetails(user.institution_id);
    } else {
      const loadInstitutions = async () => {
        try {
          const insts = await api.getInstitutions();
          setInstitutions(insts);
          if (insts.length > 0) {
            setSelectedInstId(insts[0].id);
          }
        } catch (err: any) {
          console.error('Failed to load institutions list', err);
          setError(err.message || 'Failed to load institutions list.');
        }
      };
      loadInstitutions();
    }
  }, [user]);

  const loadDetails = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInstitutionOverview(id);
      setInstData(data);
    } catch (err: any) {
      console.error('Failed to load institution details', err);
      setError(err.message || 'Could not retrieve institution metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInstId) {
      loadDetails(selectedInstId);
    }
  }, [selectedInstId]);

  const isMultiInstitutionUser = user?.role === 'AICTE_ADMIN' || user?.role === 'AUDITOR';

  // Format program rows for the program intake table
  const programRows = (instData?.program_breakdown || []).map((prog: any) => {
    const isOver = prog.admitted_regular > prog.approved_regular_intake;
    const isNear = !isOver && prog.admitted_regular >= prog.approved_regular_intake * 0.9;

    const statusBadge = isOver ? (
      <Badge tone="red">Over intake (+{prog.admitted_regular - prog.approved_regular_intake})</Badge>
    ) : isNear ? (
      <Badge tone="amber">Near cap ({prog.regular_utilization_percent}%)</Badge>
    ) : (
      <Badge tone="green">Compliant</Badge>
    );

    return [
      <span>
        <strong>{prog.program_name}</strong>
        <span className="mono" style={{ display: 'block', fontSize: 11, color: '#64748B' }}>
          {prog.program_code}
        </span>
      </span>,
      <span className="mono">{prog.approved_regular_intake}</span>,
      <span className="mono">{prog.admitted_regular}</span>,
      <span className="mono">{prog.tfw_admitted + prog.ews_admitted + prog.nri_admitted + prog.fn_oci_admitted}</span>,
      statusBadge
    ];
  });

  return (
    <Shell
      active="institution"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="Institution portal"
        title={instData?.institution_name || 'Institution Portal'}
        sub={
          instData
            ? `AICTE Code: ${instData.official_code} • State: ${instData.state} • Cycle 2024-25`
            : 'Institutional admission intake compliance and verified student rosters.'
        }
      >
        {isMultiInstitutionUser && institutions.length > 0 && (
          <select
            value={selectedInstId}
            onChange={e => setSelectedInstId(e.target.value)}
            style={{ maxWidth: 280, fontWeight: 500 }}
          >
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.official_code})
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => setShowSakshamStudio(true)}
          className="btn"
          style={{ borderColor: 'var(--blue)', color: 'var(--blue)', fontWeight: 600 }}
        >
          🔍 SAKSHAM Doc Scrutiny
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('upload')}
          className="btn pri"
        >
          Bulk upload
        </button>
      </Head>

      {error && <ErrorState error={error} onRetry={() => loadDetails(selectedInstId)} />}

      {loading && !instData ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="grid">
            <Skeleton height={96} />
            <Skeleton height={96} />
            <Skeleton height={96} />
            <Skeleton height={96} />
          </div>
          <div className="split">
            <Skeleton height={200} />
            <Skeleton height={200} />
          </div>
        </div>
      ) : instData ? (
        <>
          {/* 4 KPIs matching design */}
          <div className="grid">
            <Kpi
              label="Student records"
              value={instData.total_enrolled.toLocaleString('en-IN')}
              note={<span className="sub">Total registered enrolments</span>}
            />
            <Kpi
              label="Regular admissions"
              value={instData.regular_enrolled.toLocaleString('en-IN')}
              note={
                <Badge tone={instData.regular_utilization_percent > 100 ? 'red' : 'green'}>
                  {instData.regular_utilization_percent}% capacity
                </Badge>
              }
            />
            <Kpi
              label="Supernumerary"
              value={instData.supernumerary_enrolled.toLocaleString('en-IN')}
              note={<Badge tone="sky">TFW / EWS / NRI / FN</Badge>}
            />
            <Kpi
              label="Flagged issues"
              value={instData.open_validation_issues.toLocaleString('en-IN')}
              note={
                instData.open_validation_issues > 0 ? (
                  <Badge tone="red">Action needed</Badge>
                ) : (
                  <Badge tone="green">Clean record</Badge>
                )
              }
            />
          </div>

          {/* Split Section: Submission progress & Profile */}
          <div className="split">
            <Card title="Capacity utilization progress">
              <p className="sub" style={{ marginBottom: 12 }}>
                Regular intake: {instData.regular_enrolled} / {instData.total_approved_regular_intake} seats (
                {instData.regular_utilization_percent}%)
              </p>
              <div className="track">
                <i
                  style={{
                    width: `${Math.min(100, instData.regular_utilization_percent)}%`,
                    background: instData.regular_utilization_percent > 100 ? 'var(--red)' : 'var(--blue)'
                  }}
                />
              </div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--slate)' }}>
                <span>0%</span>
                <span>Sanctioned Cap: {instData.total_approved_regular_intake}</span>
                <span>{instData.regular_utilization_percent}%</span>
              </div>
            </Card>

            <Card title="Institution profile">
              <ul className="list">
                <li>
                  <span>Official AICTE Code</span>
                  <span className="mono">{instData.official_code}</span>
                </li>
                <li>
                  <span>Regulatory Approval</span>
                  <Badge tone={instData.approval_status === 'APPROVED' ? 'green' : 'amber'}>
                    {instData.approval_status}
                  </Badge>
                </li>
                <li>
                  <span>Approved Programs</span>
                  <span className="mono">{instData.total_programs} Active</span>
                </li>
                <li>
                  <span>State / Region</span>
                  <span>{instData.state}</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* SAKSHAM Document Scrutiny Desk Card */}
          <Card
            title="SAKSHAM Multi-Modal Document Scrutiny Desk"
            style={{ marginTop: 16, borderLeft: '4px solid var(--blue)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p className="sub" style={{ margin: '0 0 6px 0', fontSize: 13 }}>
                  AICTE SAKSHAM forensic engine inspecting PDF text layers, OCR scans, QR codes, and SHA-256 duplicate collision signatures.
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                  <Badge tone="green">18 Bonafide Verified</Badge>
                  <Badge tone="amber">1 Under Scrutiny (DOB Mismatch)</Badge>
                  <Badge tone="red">1 Inter-State Collision Flag</Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSakshamStudio(true)}
                className="btn pri"
                style={{ fontSize: 12, padding: '8px 16px' }}
              >
                Launch Verification Studio ➔
              </button>
            </div>
          </Card>

          {/* Program Breakdown Table */}
          <Card title="Approved programs & intake compliance" style={{ marginTop: 16 }}>
            {programRows.length > 0 ? (
              <Table
                head={['Program', 'Sanctioned Intake', 'Regular Admitted', 'Supernumerary', 'Status']}
                rows={programRows}
              />
            ) : (
              <EmptyState
                title="No programs found"
                message="No academic programs are currently recorded for this institution."
              />
            )}
          </Card>
        </>
      ) : null}

      {showSakshamStudio && (
        <SakshamScrutinyStudio
          onClose={() => setShowSakshamStudio(false)}
          role={user?.role || 'INSTITUTION_ADMIN'}
        />
      )}
    </Shell>
  );
};

export default InstitutionDashboard;
