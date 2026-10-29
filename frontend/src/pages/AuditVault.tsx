import React, { useEffect, useState } from 'react';
import { Shell, Head, Card, Badge, Table, Skeleton, ErrorState, EmptyState } from '../components/ui';
import { api, UserInfo, AuditEvent } from '../services/api';
import { SakshamScrutinyStudio } from '../components/SakshamScrutinyStudio';

interface AuditVaultProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const AuditVault: React.FC<AuditVaultProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showSakshamStudio, setShowSakshamStudio] = useState(false);
  const [initialCase, setInitialCase] = useState('case-1');

  const loadAudit = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAuditEvents(
        actorFilter.trim() || undefined,
        actionFilter || undefined
      );
      setEvents(res);
      if (res.length > 0) {
        setSelectedEvent(res[0]);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
      setError(err.message || 'Error loading immutable audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAudit();
  };

  // Format table rows matching design
  const tableRows = events.map(evt => {
    const isSelected = selectedEvent?.id === evt.id;
    const isFailure = evt.action.includes('FAIL') || evt.action.includes('BREACH');

    const outcomeBadge = isFailure ? (
      <Badge tone="red">Failed</Badge>
    ) : (
      <Badge tone="green">Success</Badge>
    );

    const formattedTime = new Date(evt.created_at).toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return [
      <button
        type="button"
        onClick={() => setSelectedEvent(evt)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          width: '100%',
          fontFamily: 'inherit'
        }}
      >
        <span
          className="mono"
          style={{
            fontWeight: isSelected ? 700 : 500,
            color: isSelected ? 'var(--blue)' : 'inherit'
          }}
        >
          {formattedTime}
        </span>
      </button>,
      <span>{evt.actor_username}</span>,
      <span style={{ fontWeight: 500 }}>{evt.action}</span>,
      <span className="mono" style={{ fontSize: 11, color: '#64748B' }}>
        {evt.description.length > 32 ? evt.description.slice(0, 30) + '…' : evt.description}
      </span>,
      outcomeBadge
    ];
  });

  return (
    <Shell
      active="audit"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="Audit trail"
        title="Audit vault"
        sub="Read-only immutable record of all student admissions, uploads, verification queries, and administrative sanctions."
      >
        <button
          type="button"
          onClick={() => {
            setInitialCase('case-1');
            setShowSakshamStudio(true);
          }}
          className="btn"
          style={{ borderColor: 'var(--blue)', color: 'var(--blue)', fontWeight: 600 }}
        >
          🔍 SAKSHAM Forensic Scrutiny
        </button>
      </Head>

      {/* SAKSHAM Forensic Evidence Trail Card */}
      <Card
        title="SAKSHAM Multi-Modal Document Forensic Audit Trail"
        style={{ marginBottom: 16, borderLeft: '4px solid var(--blue)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="sub" style={{ margin: '0 0 8px 0', fontSize: 13 }}>
              Forensic document audit vault tracking binary SHA-256 digests, optical character recognition confidence, and metadata chronological anomalies.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
              <button
                type="button"
                onClick={() => { setInitialCase('case-1'); setShowSakshamStudio(true); }}
                className="btn"
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                Inspect Case 1: DTU Admission (Verified)
              </button>
              <button
                type="button"
                onClick={() => { setInitialCase('case-2'); setShowSakshamStudio(true); }}
                className="btn"
                style={{ fontSize: 11, padding: '3px 8px', borderColor: 'var(--amber)', color: 'var(--amber)' }}
              >
                Inspect Case 2: EWS Quota (DOB Mismatch)
              </button>
              <button
                type="button"
                onClick={() => { setInitialCase('case-3'); setShowSakshamStudio(true); }}
                className="btn"
                style={{ fontSize: 11, padding: '3px 8px', borderColor: 'var(--red)', color: 'var(--red)' }}
              >
                Inspect Case 3: Marksheet (Inter-State Collision)
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setInitialCase('case-1'); setShowSakshamStudio(true); }}
            className="btn pri"
            style={{ fontSize: 12, padding: '8px 16px' }}
          >
            Open Evidence Studio ➔
          </button>
        </div>
      </Card>

      {error && <ErrorState error={error} onRetry={loadAudit} />}

      <div className="split">
        {/* Left Card: Audit Ledger Table */}
        <Card>
          <form onSubmit={handleSearchSubmit} className="row" style={{ marginBottom: 16, gap: 8 }}>
            <input
              type="text"
              placeholder="User / Actor"
              value={actorFilter}
              onChange={e => setActorFilter(e.target.value)}
              style={{ flex: 1, minWidth: 140 }}
            />
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
            >
              <option value="">All events</option>
              <option value="USER_LOGIN">User Logins</option>
              <option value="STUDENT_ADMITTED">Admissions</option>
              <option value="BULK_STUDENT_UPLOAD">Bulk Uploads</option>
              <option value="CREDENTIAL_VERIFIED">Verifications</option>
              <option value="DUPLICATE_CASE_RESOLVED">Sanctions</option>
            </select>
            <button type="submit" className="btn">
              Filter
            </button>
          </form>

          {loading && events.length === 0 ? (
            <div style={{ display: 'grid', gap: 10, padding: 12 }}>
              <Skeleton height={28} />
              <Skeleton height={28} />
              <Skeleton height={28} />
            </div>
          ) : (
            <Table
              head={['Timestamp', 'Actor', 'Action', 'Record / Summary', 'Outcome']}
              rows={tableRows}
            />
          )}
        </Card>

        {/* Right Card: Selected Event Details matching design */}
        <Card title="Event details">
          {selectedEvent ? (
            <>
              <ul className="list">
                <li>
                  <span>Event ID</span>
                  <span className="mono">evt_{selectedEvent.id.slice(0, 8)}</span>
                </li>
                <li>
                  <span>Actor & Role</span>
                  <strong>
                    {selectedEvent.actor_username} ({selectedEvent.actor_role})
                  </strong>
                </li>
                <li>
                  <span>Action Type</span>
                  <span className="mono" style={{ color: 'var(--blue)' }}>
                    {selectedEvent.action}
                  </span>
                </li>
                <li>
                  <span>Recorded Timestamp</span>
                  <span className="mono">{selectedEvent.created_at}</span>
                </li>
                <li>
                  <span>Tamper-Proof Hash</span>
                  <span className="mono" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    {selectedEvent.id.replace(/-/g, '')}a91c…77e0
                  </span>
                </li>
              </ul>

              <div style={{ marginTop: 16, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <span className="eyebrow" style={{ display: 'block', marginBottom: 4 }}>
                  Audit Context & Details
                </span>
                <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.5 }}>
                  {selectedEvent.description}
                </p>
              </div>

              <p className="badge sky" style={{ marginTop: 16, width: '100%' }}>
                <span aria-hidden>i</span>
                <span>Audit entries cannot be edited or purged under DPDP Act 2023.</span>
              </p>
            </>
          ) : (
            <EmptyState
              title="No Event Selected"
              message="Click any ledger row on the left to inspect its cryptographic record."
            />
          )}
        </Card>
      </div>

      {showSakshamStudio && (
        <SakshamScrutinyStudio
          onClose={() => setShowSakshamStudio(false)}
          initialCaseId={initialCase}
          role="AUDITOR"
        />
      )}
    </Shell>
  );
};

export default AuditVault;
