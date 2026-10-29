import React, { useState } from 'react';
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
    badgeText: '',
    badgeTone: 'green',
    icon: '🪪',
    groups: [
      {
        group: 'My Credentials',
        items: [
          { id: 'student-portal', label: 'My Digital APAAR Card' },
          { id: 'student-schemes', label: 'Scholarships & Internships' },
          { id: 'student-complaints', label: 'Grievance & Inquiries' }
        ]
      },
      {
        group: 'Tools',
        items: [
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
    'access-log': 'student-portal',
    'scholarships': 'student-schemes',
    'internships': 'student-schemes',
    'grievances': 'student-complaints',
    'complaints': 'student-complaints'
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
    'student-portal': 'student-portal',
    'student-schemes': 'student-schemes',
    'student-complaints': 'student-complaints'
  };
  return map[tab] || tab;
};

export const getPageHeader = (active: string, role?: string) => {
  const norm = normalizeTabId(active);
  const titles: Record<string, { title: string; eyebrow: string }> = {
    'student-portal': {
      title: 'Student Credential & Privacy Portal',
      eyebrow: 'DPDP Act 2023 Compliant Citizen Wallet'
    },
    'student-schemes': {
      title: 'AICTE Scholarships & Internships',
      eyebrow: 'AICTE National Schemes & Programs'
    },
    'student-complaints': {
      title: 'Student Grievance & Inquiries Portal',
      eyebrow: 'Time-Bound Institutional Grievance Redressal'
    },
    'dashboard': {
      title: 'National Academic Repository & Oversight',
      eyebrow: 'AICTE Central Headquarters'
    },
    'institution': {
      title: 'Institution Academic Repository & Intake',
      eyebrow: 'Authorized Technical Institution'
    },
    'registry': {
      title: 'Institution Student Registry',
      eyebrow: 'Live Enrolment Records'
    },
    'upload': {
      title: 'Bulk Batch CSV Ingestion',
      eyebrow: 'Secure Data Ingestion'
    },
    'anomalies': {
      title: 'Intake Anomaly & Fraud Detection Engine',
      eyebrow: 'Automated AI Risk Screening'
    },
    'intake': {
      title: 'Accredited Intake Monitoring',
      eyebrow: 'Sanction Cap Enforcement'
    },
    'reports': {
      title: 'Regulatory Compliance Reports',
      eyebrow: 'Council Audit & Statistics'
    },
    'verify': {
      title: 'Digital Credential Verification Portal',
      eyebrow: 'Cryptographic APAAR Verification'
    },
    'audit': {
      title: 'DPDP Act 2023 Immutable Audit Vault',
      eyebrow: 'Cryptographic Tamper-Proof Audit Trail'
    },
    'system-health': {
      title: 'Verification Node Health & Infrastructure',
      eyebrow: 'System Telemetry & Status'
    }
  };

  if (titles[norm]) {
    return titles[norm];
  }

  const roleConfig = ROLE_CONFIGS[role || 'AICTE_ADMIN'] || ROLE_CONFIGS.AICTE_ADMIN;
  return {
    title: roleConfig.portalTitle || 'Academic Portal',
    eyebrow: roleConfig.portalSubtitle || 'AICTE Verified'
  };
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
  headerTitle?: string;
  headerEyebrow?: string;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  active,
  user,
  onNavigate,
  onLogout,
  onSwitchPersona,
  headerTitle,
  headerEyebrow,
  children
}) => {
  const currentNorm = normalizeTabId(active);
  const userRole = user?.role || 'AICTE_ADMIN';
  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.AICTE_ADMIN;
  const pageDefault = getPageHeader(active, userRole);
  const resolvedTitle = headerTitle || pageDefault.title;
  const resolvedEyebrow = headerEyebrow !== undefined ? headerEyebrow : pageDefault.eyebrow;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(id);
    }
  };

  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]}, ${now.getFullYear()}`;

  const getConsoleInfo = () => {
    switch (userRole) {
      case 'STUDENT':
        return {
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
          ),
          label: 'Student Console',
          displayName: 'Rahul Sharma',
          subRole: 'Student'
        };
      case 'AICTE_ADMIN':
        return {
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="M10 4v4"></path>
              <path d="M2 8h20"></path>
              <path d="M6 4v4"></path>
            </svg>
          ),
          label: 'Administration Console',
          displayName: 'Admin S. Sengupta',
          subRole: 'Administrator'
        };
      case 'INSTITUTION_ADMIN':
        return {
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          ),
          label: 'Institution Console',
          displayName: 'DTU Registrar',
          subRole: 'Institutional Admin'
        };
      case 'DATA_ENTRY_OFFICER':
        return {
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          ),
          label: 'Admissions Console',
          displayName: 'KNIT Admissions Officer',
          subRole: 'Data Entry Officer'
        };
      case 'EXTERNAL_VERIFIER':
        return {
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          ),
          label: 'Verifier Console',
          displayName: 'Corporate Recruiter',
          subRole: 'Authorized Verifier'
        };
      case 'AUDITOR':
        return {
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          ),
          label: 'Regulatory Console',
          displayName: 'State Audit Officer',
          subRole: 'Regulatory Auditor'
        };
      default:
        return {
          icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
          ),
          label: 'Student Console',
          displayName: user?.username || 'User',
          subRole: userRole
        };
    }
  };

  const consoleInfo = getConsoleInfo();

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
          {roleConfig.badgeText ? (
            <div style={{ padding: '0 8px 14px' }}>
              <Badge tone={roleConfig.badgeTone}>
                {roleConfig.badgeText}
              </Badge>
            </div>
          ) : null}

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

        </aside>

        {/* Main Content Area */}
        <main
          className="main"
          onClick={() => {
            if (showUserMenu) setShowUserMenu(false);
            if (showNotifications) setShowNotifications(false);
          }}
        >
          {/* Top Header Bar matching reference: Left Bold Heading + Right Console Tools */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #E2E8F0',
              position: 'relative',
              flexWrap: 'wrap'
            }}
          >
            {/* Left side: Bold Heading inline with Student Console, Date & Notification */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 240 }}>
              {resolvedEyebrow && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#2563EB',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8
                  }}
                >
                  {resolvedEyebrow}
                </div>
              )}
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: -0.4,
                  lineHeight: 1.2
                }}
              >
                {resolvedTitle}
              </h1>
            </div>

            {/* Right side: Tools inline with heading (Console, Date, Bell, User) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* 1. Console Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: '#FAF9F6',
                  border: '1px solid #E2E8F0',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1E293B',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{consoleInfo.icon}</span>
                <span>{consoleInfo.label}</span>
              </div>

              {/* 2. Date */}
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, letterSpacing: 0.1 }}>
                {formattedDate}
              </div>

              {/* 3. Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    position: 'relative',
                    color: '#475569',
                    transition: 'background 0.2s'
                  }}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {/* Red unread indicator dot */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#EF4444',
                      border: '1.5px solid #fff'
                    }}
                  />
                </button>

                {/* Notification Dropdown Popover */}
                {showNotifications && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 38,
                      width: 320,
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
                      zIndex: 100,
                      padding: 12
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0B2545' }}>Notifications</span>
                      <span style={{ fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>2 New</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: 6, fontSize: 11, border: '1px solid #F1F5F9' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>PMSSS Scholarship Renewal Verified</div>
                        <div style={{ color: '#64748B', marginTop: 2 }}>DTU Admissions Desk validated income and category certificates.</div>
                      </div>
                      <div style={{ padding: '8px', background: '#F8FAFC', borderRadius: 6, fontSize: 11, border: '1px solid #F1F5F9' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>Grievance Ticket Assigned</div>
                        <div style={{ color: '#64748B', marginTop: 2 }}>Ticket GRV-2026-0224 forwarded to CGRC for institutional action.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Circular Avatar & User Info with Dropdown (Login/Sign out option in circle) */}
              <div style={{ position: 'relative' }}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '3px 8px',
                    borderRadius: 24,
                    border: '1px solid transparent',
                    transition: 'background 0.2s',
                    userSelect: 'none'
                  }}
                  title="Account menu: Login & Sign out"
                >
                  {/* Circular Avatar (in circle) */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#334155'
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="10" r="3.2"></circle>
                      <path d="M6.5 19.5c1.2-2.5 3.3-3.5 5.5-3.5s4.3 1 5.5 3.5"></path>
                    </svg>
                  </div>

                  {/* Name & Sub-Role text with chevron */}
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{consoleInfo.displayName}</span>
                      <span style={{ fontSize: 10, color: '#64748B' }}>▾</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>
                      {consoleInfo.subRole}
                    </div>
                  </div>
                </div>

                {/* User Dropdown Menu with Details, Login Switcher and Sign Out */}
                {showUserMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 44,
                      width: 250,
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      boxShadow: '0 12px 28px -4px rgba(0,0,0,0.15)',
                      zIndex: 100,
                      padding: 10
                    }}
                  >
                    {/* User Profile Header */}
                    <div style={{ padding: '6px 8px', borderBottom: '1px solid #E2E8F0', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0B2545' }}>{consoleInfo.displayName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{user?.email || 'student@dtu.ac.in'}</div>
                      {user?.institution_name && (
                        <div style={{ fontSize: 10, color: '#0F766E', marginTop: 3, fontWeight: 500 }}>{user.institution_name}</div>
                      )}
                    </div>

                    {/* Switch Persona / Login Option */}
                    {onSwitchPersona && (
                      <div style={{ padding: '6px 8px', borderBottom: '1px solid #E2E8F0', marginBottom: 8 }}>
                        <label style={{ fontSize: 10, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                          Switch Persona / Login As
                        </label>
                        <select
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: 11,
                            background: '#F8FAFC',
                            color: '#0F172A',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                          value={user?.username || 'student_demo'}
                          onChange={(e) => {
                            setShowUserMenu(false);
                            onSwitchPersona(e.target.value);
                          }}
                        >
                          <option value="student_demo">Student (Rahul Sharma)</option>
                          <option value="aicte_admin">AICTE National Admin</option>
                          <option value="dtu_admin">DTU Registrar (Institution)</option>
                          <option value="knit_deo">KNIT Data Entry Officer</option>
                          <option value="verifier">Corporate Verifier (Employer)</option>
                          <option value="auditor">Regulatory Officer / Auditor</option>
                        </select>
                      </div>
                    )}

                    {/* Sign Out Button */}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          background: '#FEF2F2',
                          border: '1px solid #FCA5A5',
                          borderRadius: 6,
                          color: '#B91C1C',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Sign out</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {children}
        </main>
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
  children,
  showTitle = false
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
  children?: React.ReactNode;
  showTitle?: boolean;
}) => (
  <header className="head" style={{ marginBottom: 20 }}>
    <div style={{ flex: 1, minWidth: 260 }}>
      {showTitle && (
        <>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {title && <h1>{title}</h1>}
        </>
      )}
      {sub && <p className="sub" style={{ margin: 0, color: '#64748B', fontSize: 13, lineHeight: 1.5 }}>{sub}</p>}
    </div>
    {children && <div className="row">{children}</div>}
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
