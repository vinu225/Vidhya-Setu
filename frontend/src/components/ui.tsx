import React from 'react';
import '../apaar.css';
import { UserInfo } from '../services/api';

// Navigation groups aligned with apaar design tokens & role permissions
export interface NavItem {
  id: string;
  label: string;
  roles?: string[]; // Allowed roles (undefined means all authenticated)
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'AICTE Dashboard', roles: ['AICTE_ADMIN', 'AUDITOR'] },
      { id: 'institution', label: 'Institution Portal', roles: ['AICTE_ADMIN', 'INSTITUTION_ADMIN', 'DATA_ENTRY_OFFICER'] }
    ]
  },
  {
    group: 'Student data',
    items: [
      { id: 'registry', label: 'Student Registry', roles: ['AICTE_ADMIN', 'INSTITUTION_ADMIN', 'DATA_ENTRY_OFFICER', 'AUDITOR'] },
      { id: 'upload', label: 'Bulk Upload', roles: ['AICTE_ADMIN', 'INSTITUTION_ADMIN', 'DATA_ENTRY_OFFICER'] }
    ]
  },
  {
    group: 'Surveillance & operations',
    items: [
      { id: 'anomalies', label: 'Anomaly & Fraud', roles: ['AICTE_ADMIN', 'INSTITUTION_ADMIN', 'AUDITOR'] },
      { id: 'intake', label: 'Intake Monitoring', roles: ['AICTE_ADMIN', 'INSTITUTION_ADMIN', 'AUDITOR'] },
      { id: 'graph', label: 'Identity Graph', roles: ['AICTE_ADMIN', 'AUDITOR', 'INSTITUTION_ADMIN'] }
    ]
  },
  {
    group: 'Trust & Governance',
    items: [
      { id: 'verify', label: 'Verification Portal' },
      { id: 'reports', label: 'Reports & Exports', roles: ['AICTE_ADMIN', 'INSTITUTION_ADMIN', 'AUDITOR'] },
      { id: 'audit', label: 'Audit Vault', roles: ['AICTE_ADMIN', 'AUDITOR'] },
      { id: 'health', label: 'Integrations & Health' }
    ]
  }
];

// Helper to normalize tab IDs between router conventions
export const normalizeTabId = (tab: string): string => {
  const map: Record<string, string> = {
    'aicte-hq': 'dashboard',
    'institution-portal': 'institution',
    'student-registry': 'registry',
    'bulk-upload': 'upload',
    'anomaly-center': 'anomalies',
    'intake-monitor': 'intake',
    'identity-graph': 'graph',
    'credential-manager': 'verify',
    'public-verify': 'verify',
    'regulatory-reports': 'reports',
    'dpdp-audit': 'audit',
    'system-health': 'health'
  };
  return map[tab] || tab;
};

export const denormalizeTabId = (tab: string): string => {
  const map: Record<string, string> = {
    'dashboard': 'aicte-hq',
    'institution': 'institution-portal',
    'registry': 'student-registry',
    'upload': 'bulk-upload',
    'anomalies': 'anomaly-center',
    'intake': 'intake-monitor',
    'graph': 'identity-graph',
    'verify': 'public-verify',
    'reports': 'regulatory-reports',
    'audit': 'dpdp-audit',
    'health': 'system-health'
  };
  return map[tab] || tab;
};

// ------------------------------------------------------------------------------
// Shell Component (Persistent Sidebar + Main Layout with Role Filtering)
// ------------------------------------------------------------------------------
interface ShellProps {
  active: string;
  user?: UserInfo | null;
  onNavigate?: (tabId: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  active,
  user,
  onNavigate,
  onLogout,
  onSwitchPersona,
  children
}) => {
  const currentNorm = normalizeTabId(active);
  const userRole = user?.role || 'AICTE_ADMIN';

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(id);
    }
  };

  return (
    <div className="ap">
      <div className="shell">
        <aside className="side">
          {/* Brand */}
          <div className="brand">
            <i>✓</i>
            <span>APAAR-Verify</span>
          </div>

          {/* Navigation Items Filtered by Role */}
          {NAV_GROUPS.map(({ group, items }) => {
            const visibleItems = items.filter(
              item => !item.roles || item.roles.includes(userRole)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group} style={{ marginBottom: 12 }}>
                <div className="eyebrow">{group}</div>
                {visibleItems.map(item => {
                  const isActive = currentNorm === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`/${item.id}`}
                      onClick={e => handleNavClick(e, item.id)}
                      className={isActive ? 'on' : ''}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </a>
                  );
                })}
              </div>
            );
          })}

          {/* User Status / Persona Switcher */}
          {user && (
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #1e3a5f' }}>
              <div style={{ padding: '0 12px 8px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.username}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{user.role}</div>
                {user.institution_name && (
                  <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2 }}>{user.institution_name}</div>
                )}
              </div>

              {onSwitchPersona && (
                <div style={{ padding: '4px 12px 10px' }}>
                  <label style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                    Switch Persona
                  </label>
                  <select
                    style={{ width: '100%', padding: '4px 8px', fontSize: 11, background: '#071A31', color: '#CBD5E1', border: '1px solid #1e3a5f' }}
                    value={user.username}
                    onChange={e => onSwitchPersona(e.target.value)}
                  >
                    <option value="aicte_admin">AICTE Admin</option>
                    <option value="dtu_admin">DTU Registrar</option>
                    <option value="knit_deo">KNIT Data Entry</option>
                    <option value="auditor">Auditor</option>
                    <option value="verifier">External Verifier</option>
                  </select>
                </div>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="btn"
                  style={{ width: 'calc(100% - 24px)', margin: '0 12px', padding: '6px 12px', fontSize: 12, background: 'transparent', color: '#CBD5E1', borderColor: '#1e3a5f' }}
                >
                  Sign out
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="main">{children}</main>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------
// Head Component
// ------------------------------------------------------------------------------
export const Head = ({
  eyebrow,
  title,
  sub,
  children
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) => (
  <header className="head">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {sub && <p className="sub">{sub}</p>}
    </div>
    <div className="row">{children}</div>
  </header>
);

// ------------------------------------------------------------------------------
// Card Component
// ------------------------------------------------------------------------------
export const Card = ({
  title,
  children,
  style
}: {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <section className="card" style={style}>
    {title && <h2>{title}</h2>}
    {children}
  </section>
);

// ------------------------------------------------------------------------------
// KPI Metric Card
// ------------------------------------------------------------------------------
export const Kpi = ({
  label,
  value,
  note
}: {
  label: string;
  value: string | number;
  note?: React.ReactNode;
}) => (
  <div className="card kpi">
    <span>{label}</span>
    <b>{value}</b>
    {note && <small style={{ marginTop: 4, display: 'inline-block' }}>{note}</small>}
  </div>
);

// ------------------------------------------------------------------------------
// Status Badge Component (Colour-Blind Safe with Mandatory Symbols)
// ------------------------------------------------------------------------------
const ICON: Record<'red' | 'amber' | 'green' | 'sky', string> = {
  red: '✕',
  amber: '!',
  green: '✓',
  sky: 'i'
};

export const Badge = ({
  tone,
  children
}: {
  tone: 'red' | 'amber' | 'green' | 'sky';
  children: React.ReactNode;
}) => (
  <span className={`badge ${tone}`}>
    <span aria-hidden style={{ fontWeight: 'bold' }}>{ICON[tone]}</span>
    {children}
  </span>
);

// ------------------------------------------------------------------------------
// Data Table Component
// ------------------------------------------------------------------------------
export const Table = ({
  head,
  rows
}: {
  head: string[];
  rows: React.ReactNode[][];
}) => (
  <table>
    <thead>
      <tr>
        {head.map(h => (
          <th key={h}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={head.length} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
            No records found.
          </td>
        </tr>
      ) : (
        rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))
      )}
    </tbody>
  </table>
);

// ------------------------------------------------------------------------------
// Intake vs Enrolment Capacity Bars
// ------------------------------------------------------------------------------
export const Bars = ({
  rows
}: {
  rows: [string, number, number][];
}) => {
  if (!rows || rows.length === 0) {
    return <div style={{ color: '#64748B', fontSize: 13 }}>No capacity data available.</div>;
  }
  const max = Math.max(...rows.map(r => Math.max(r[1] || 0, r[2] || 0, 1)));
  return (
    <>
      <div className="legend">
        <span><i style={{ background: '#94A3B8' }} />Approved intake</span>
        <span><i style={{ background: '#1D4ED8' }} />Enrolment</span>
        <span><i style={{ background: '#DC2626' }} />Over intake</span>
      </div>
      <div className="bars">
        {rows.map(([name, approved, enrolled]) => (
          <div className="b" key={name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ fontWeight: 500 }}>{name}</span>
              <span className="mono" style={{ color: enrolled > approved ? '#DC2626' : '#64748B' }}>
                {enrolled} / {approved}
              </span>
            </div>
            <div className="t" style={{ width: `${Math.min(100, (approved / max) * 100)}%` }} />
            <div
              className={`t ${enrolled > approved ? 'o' : 'e'}`}
              style={{ width: `${Math.min(100, (enrolled / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

// ------------------------------------------------------------------------------
// State & Safety: Skeleton, EmptyState, ErrorState
// ------------------------------------------------------------------------------
export const Skeleton = ({
  height = 24,
  width = '100%',
  style
}: {
  height?: number | string;
  width?: number | string;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      height,
      width,
      background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
      backgroundSize: '200% 100%',
      borderRadius: 6,
      animation: 'pulse 1.5s infinite',
      ...style
    }}
  />
);

export const EmptyState = ({
  title,
  message,
  actionText,
  onAction
}: {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}) => (
  <div style={{ textAlign: 'center', padding: '36px 16px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0B2545', margin: '0 0 6px' }}>{title}</h3>
    <p style={{ fontSize: 13, color: '#64748B', maxWidth: 420, margin: '0 auto 16px' }}>{message}</p>
    {actionText && onAction && (
      <button type="button" onClick={onAction} className="btn pri">
        {actionText}
      </button>
    )}
  </div>
);

export const ErrorState = ({
  error,
  onRetry
}: {
  error: string;
  onRetry?: () => void;
}) => (
  <div style={{ padding: '20px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 12, color: '#B91C1C', marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 4 }}>
      <span>✕</span>
      <span>Something went wrong while retrieving data</span>
    </div>
    <div style={{ fontSize: 13, marginBottom: onRetry ? 12 : 0 }}>{error}</div>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn" style={{ background: '#fff', color: '#B91C1C', borderColor: '#FCA5A5' }}>
        Retry request
      </button>
    )}
  </div>
);
