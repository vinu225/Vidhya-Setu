import React from 'react';
import '../apaar.css';
import { UserInfo } from '../services/api';

// Navigation items and groups aligned with APAAR design tokens & role permissions
export interface NavItem {
  id: string;
  label: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export interface RolePortalConfig {
  portalTitle: string;
  portalSubtitle: string;
  badgeText: string;
  badgeTone: 'sky' | 'green' | 'amber' | 'red';
  icon: string;
  groups: NavGroup[];
}

export const ROLE_CONFIGS: Record<string, RolePortalConfig> = {
  AICTE_ADMIN: {
    portalTitle: 'AICTE National HQ',
    portalSubtitle: 'Central Repository & Surveillance',
    badgeText: 'National Authority',
    badgeTone: 'sky',
    icon: '🏛️',
    groups: [
      {
        group: 'Surveillance & Policy',
        items: [
          { id: 'dashboard', label: 'National Analytics' },
          { id: 'intake', label: 'Intake Surveillance' },
          { id: 'anomalies', label: 'Anomaly & Duplicate Center' },
          { id: 'graph', label: 'Identity Collision Graph' }
        ]
      },
      {
        group: 'Trust & Governance',
        items: [
          { id: 'reports', label: 'Regulatory Reports' },
          { id: 'audit', label: 'DPDP Audit Vault' },
          { id: 'health', label: 'Infrastructure Probes' }
        ]
      },
      {
        group: 'Verification Tool',
        items: [
          { id: 'verify', label: 'Credential Verifier' }
        ]
      }
    ]
  },
  INSTITUTION_ADMIN: {
    portalTitle: 'Institution Portal',
    portalSubtitle: 'College Admissions & Quotas',
    badgeText: 'Campus Node',
    badgeTone: 'green',
    icon: '🎓',
    groups: [
      {
        group: 'Campus Operations',
        items: [
          { id: 'institution', label: 'College Overview' },
          { id: 'registry', label: 'Student Registry' },
          { id: 'upload', label: 'Bulk CSV Ingestion' },
          { id: 'intake', label: 'Program Intake Status' }
        ]
      },
      {
        group: 'Compliance & Verification',
        items: [
          { id: 'reports', label: 'Enrolment Reports' },
          { id: 'verify', label: 'Credential Verifier' }
        ]
      }
    ]
  },
  DATA_ENTRY_OFFICER: {
    portalTitle: 'Admissions Desk',
    portalSubtitle: 'Student Ingestion & Registration',
    badgeText: 'DEO Officer',
    badgeTone: 'green',
    icon: '📝',
    groups: [
      {
        group: 'Admissions Desk',
        items: [
          { id: 'institution', label: 'College Overview' },
          { id: 'registry', label: 'Student Registry' },
          { id: 'upload', label: 'Bulk CSV Ingestion' }
        ]
      },
      {
        group: 'Tools',
        items: [
          { id: 'verify', label: 'Credential Verifier' }
        ]
      }
    ]
  },
  EXTERNAL_VERIFIER: {
    portalTitle: 'Employer Trust Gateway',
    portalSubtitle: 'Authorized Credential Verification',
    badgeText: 'Authorized Verifier',
    badgeTone: 'sky',
    icon: '🔍',
    groups: [
      {
        group: 'Verification Services',
        items: [
          { id: 'verify', label: 'Verify Student Credential' },
          { id: 'health', label: 'Verification Node Health' }
        ]
      }
    ]
  },
  AUDITOR: {
    portalTitle: 'Regulatory Oversight',
    portalSubtitle: 'Audit & Compliance Directorate',
    badgeText: 'Audit Access',
    badgeTone: 'amber',
    icon: '⚖️',
    groups: [
      {
        group: 'Accreditation & Oversight',
        items: [
          { id: 'dashboard', label: 'National Overview' },
          { id: 'intake', label: 'Accredited Intake Monitor' },
          { id: 'anomalies', label: 'Forensic Anomaly Review' },
          { id: 'reports', label: 'Regulatory Compliance Reports' },
          { id: 'audit', label: 'DPDP Immutable Audit Vault' }
        ]
      },
      {
        group: 'Tools',
        items: [
          { id: 'verify', label: 'Credential Verifier' }
        ]
      }
    ]
  },
  STUDENT: {
    portalTitle: 'APAAR Citizen Wallet',
    portalSubtitle: 'Student Privacy & Credential Manager',
    badgeText: 'Verified Citizen',
    badgeTone: 'green',
    icon: '🪪',
    groups: [
      {
        group: 'My Credentials',
        items: [
          { id: 'student-portal', label: 'My Digital APAAR Card' },
          { id: 'verify', label: 'Public Verifier Preview' }
        ]
      }
    ]
  }
};

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
    'system-health': 'health',
    'consent-manager': 'student-portal',
    'share-credentials': 'student-portal',
    'access-log': 'student-portal'
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
    'health': 'system-health',
    'student-portal': 'student-portal'
  };
  return map[tab] || tab;
};

// ------------------------------------------------------------------------------
// Shell Component (Role-Scoped Sidebar + Main Layout)
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
  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.AICTE_ADMIN;

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
          {/* Brand Header Scoped to Role */}
          <div className="brand" style={{ borderBottom: '1px solid #1e3a5f', paddingBottom: 14, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>{roleConfig.icon}</span>
            <div style={{ marginLeft: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'block', lineHeight: 1.2 }}>
                {roleConfig.portalTitle}
              </span>
              <span style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginTop: 2 }}>
                {user?.institution_name || roleConfig.portalSubtitle}
              </span>
            </div>
          </div>

          {/* Role Badge Indicator */}
          <div style={{ padding: '0 8px 14px' }}>
            <Badge tone={roleConfig.badgeTone}>
              {roleConfig.badgeText}
            </Badge>
          </div>

          {/* Navigation Items Filtered Strictly by Dedicated Role Configuration */}
          {roleConfig.groups.map(({ group, items }) => (
            <div key={group} style={{ marginBottom: 14 }}>
              <div className="eyebrow">{group}</div>
              {items.map(item => {
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
          ))}

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
                    style={{ width: '100%', padding: '6px 8px', fontSize: 11, background: '#071A31', color: '#CBD5E1', border: '1px solid #1e3a5f', borderRadius: 6 }}
                    value={user.username}
                    onChange={e => onSwitchPersona(e.target.value)}
                  >
                    <option value="aicte_admin">AICTE National Admin</option>
                    <option value="dtu_admin">DTU Registrar (Institution)</option>
                    <option value="knit_deo">KNIT Data Entry Officer</option>
                    <option value="verifier">Corporate Verifier (Employer)</option>
                    <option value="auditor">Regulatory Officer / Auditor</option>
                    <option value="student_demo">Student (Rahul Sharma)</option>
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
