import React, { useEffect, useState } from 'react';
import { Shell, Head, Card, Kpi, Badge, Table, Bars, Skeleton, ErrorState, EmptyState } from '../components/ui';
import { api, UserInfo, Institution, IntakeAnalytics } from '../services/api';

interface IntakeMonitoringProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

// Module-level cache for instant tab loading
const memoryCachedIntake: Record<string, IntakeAnalytics[]> = {};
let memoryCachedInstitutions: Institution[] = [];

export const IntakeMonitoring: React.FC<IntakeMonitoringProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const currentKey = user?.institution_id || '';
  const cachedForCurrent = memoryCachedIntake[currentKey || 'all'];
  const [intakeData, setIntakeData] = useState<IntakeAnalytics[]>(cachedForCurrent || []);
  const [institutions, setInstitutions] = useState<Institution[]>(memoryCachedInstitutions);
  const [selectedInst, setSelectedInst] = useState<string>(user?.institution_id || '');
  const [loading, setLoading] = useState(!cachedForCurrent);
  const [error, setError] = useState<string | null>(null);

  // Sync selectedInst when user or institution_id becomes available
  useEffect(() => {
    if (user?.institution_id) {
      setSelectedInst(user.institution_id);
    }
  }, [user?.institution_id]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        if (memoryCachedInstitutions.length > 0) return;
        const insts = await api.getInstitutions();
        memoryCachedInstitutions = insts;
        setInstitutions(insts);
      } catch (err: any) {
        console.error('Failed to load institutions', err);
      }
    };
    fetchInstitutions();
  }, []);

  const loadIntake = async () => {
    const targetInst = user?.institution_id || selectedInst;
    const cacheKey = targetInst || 'all';
    try {
      if (!memoryCachedIntake[cacheKey]) {
        setLoading(true);
      }
      setError(null);
      const data = await api.getIntakeAnalytics(targetInst || undefined);
      memoryCachedIntake[cacheKey] = data;
      setIntakeData(data);
    } catch (err: any) {
      console.error('Failed to load intake analytics', err);
      if (!memoryCachedIntake[cacheKey]) {
        setError(err.message || 'Error loading intake compliance data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntake();
  }, [selectedInst, user?.institution_id]);

  // Aggregate KPIs
  const totalApproved = intakeData.reduce((sum, item) => sum + item.approved_regular_intake, 0);
  const totalReported = intakeData.reduce((sum, item) => sum + item.admitted_regular, 0);
  const overIntakeItems = intakeData.filter(item => item.admitted_regular > item.approved_regular_intake);
  const overIntakeSeats = overIntakeItems.reduce(
    (sum, item) => sum + (item.admitted_regular - item.approved_regular_intake),
    0
  );

  // Bars data for top programs / colleges
  const barRows: [string, number, number][] = intakeData.slice(0, 8).map(item => [
    `${item.program_name.slice(0, 16)} (${item.institution_name.slice(0, 12)})`,
    item.approved_regular_intake,
    item.admitted_regular
  ]);

  // Table rows matching design
  const tableRows = intakeData.slice(0, 15).map(item => {
    const isOver = item.admitted_regular > item.approved_regular_intake;
    const isNear = !isOver && item.admitted_regular >= item.approved_regular_intake * 0.9;

    const statusBadge = isOver ? (
      <Badge tone="red">Over limit (+{item.admitted_regular - item.approved_regular_intake})</Badge>
    ) : isNear ? (
      <Badge tone="amber">Approaching ({item.regular_utilization_percent}%)</Badge>
    ) : (
      <Badge tone="green">Within limit</Badge>
    );

    return [
      <span>
        <strong>{item.institution_name}</strong>
        <span className="mono" style={{ display: 'block', fontSize: 11, color: '#64748B' }}>
          {item.program_name} ({item.program_code})
        </span>
      </span>,
      <span className="mono">{item.approved_regular_intake.toLocaleString('en-IN')}</span>,
      <span className="mono">{item.admitted_regular.toLocaleString('en-IN')}</span>,
      statusBadge
    ];
  });

  return (
    <Shell
      active="intake"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="Intake compliance"
        title="Intake monitoring"
        sub="Approved intake quotas against reported student enrolment records."
      >
        <select
          value={selectedInst}
          onChange={e => setSelectedInst(e.target.value)}
          style={{ maxWidth: 260 }}
          disabled={user?.role === 'INSTITUTION_ADMIN' || user?.role === 'DATA_ENTRY_OFFICER'}
        >
          {(!user?.institution_id || user.role === 'AICTE_ADMIN' || user.role === 'AUDITOR') && (
            <option value="">All institutions</option>
          )}
          {user?.institution_id && !institutions.some(i => i.id === user.institution_id) && (
            <option value={user.institution_id}>Delhi Technological University (DTU)</option>
          )}
          {institutions.map(inst => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </select>
        <select style={{ maxWidth: 120 }}>
          <option>2024-25</option>
        </select>
      </Head>

      {error && <ErrorState error={error} onRetry={loadIntake} />}

      {/* 3 KPIs matching design */}
      <div className="grid">
        <Kpi
          label="Approved intake"
          value={totalApproved.toLocaleString('en-IN')}
          note={<span className="sub">Core sanctioned regular seats</span>}
        />
        <Kpi
          label="Reported enrolment"
          value={totalReported.toLocaleString('en-IN')}
          note={<span className="sub">Admitted candidates</span>}
        />
        <Kpi
          label="Over intake"
          value={overIntakeSeats > 0 ? `+${overIntakeSeats.toLocaleString('en-IN')}` : '0'}
          note={
            overIntakeItems.length > 0 ? (
              <Badge tone="red">{overIntakeItems.length} programs breached</Badge>
            ) : (
              <Badge tone="green">All compliant</Badge>
            )
          }
        />
      </div>

      {loading && intakeData.length === 0 ? (
        <div className="split" style={{ marginTop: 16 }}>
          <Skeleton height={260} />
          <Skeleton height={260} />
        </div>
      ) : (
        <>
          <div className="split" style={{ marginTop: 16 }}>
            {/* Bars chart */}
            <Card title="Capacity vs enrolment">
              {barRows.length > 0 ? (
                <Bars rows={barRows} />
              ) : (
                <EmptyState
                  title="No Intake Data Available"
                  message="Select an institution to inspect sanctioned capacity metrics."
                />
              )}
            </Card>

            {/* Status Key Card matching design */}
            <Card title="Status key">
              <ul className="list">
                <li>
                  <Badge tone="green">Within limit</Badge>
                  <span style={{ fontSize: 13, color: 'var(--slate)' }}>under 90% capacity</span>
                </li>
                <li>
                  <Badge tone="amber">Approaching</Badge>
                  <span style={{ fontSize: 13, color: 'var(--slate)' }}>90–100% capacity</span>
                </li>
                <li>
                  <Badge tone="red">Over limit</Badge>
                  <span style={{ fontSize: 13, color: 'var(--slate)' }}>above 100% (quota breach)</span>
                </li>
              </ul>
              <div style={{ marginTop: 20, padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: 'var(--slate)' }}>
                <strong>AICTE Rule APH 2024:</strong> Supernumerary categories (TFW 5%, EWS 10%, NRI 5%, FN/OCI 15%) are monitored on top of regular caps.
              </div>
            </Card>
          </div>

          {/* Compliance Table */}
          <Card title="Institution compliance" style={{ marginTop: 16 }}>
            {tableRows.length > 0 ? (
              <Table
                head={['Institution & Program', 'Approved Regular', 'Reported Enrolment', 'Status']}
                rows={tableRows}
              />
            ) : (
              <EmptyState
                title="No Records Found"
                message="No program intake data available for the selected filters."
              />
            )}
          </Card>
        </>
      )}
    </Shell>
  );
};

export default IntakeMonitoring;
