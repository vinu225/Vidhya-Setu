import React, { useState, useEffect } from 'react';
import { api, UserInfo, getStoredUser } from './services/api';
import { normalizeTabId } from './components/ui';
import { LoginPage } from './pages/LoginPage';
import { AicteDashboard } from './pages/AicteDashboard';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { StudentRegistry } from './pages/StudentRegistry';
import { BulkUploadWizard } from './pages/BulkUploadWizard';
import { AnomalyCenter } from './pages/AnomalyCenter';
import { IntakeMonitoring } from './pages/IntakeMonitoring';
import { IdentityGraphView } from './pages/IdentityGraphView';
import { VerificationPortal } from './pages/VerificationPortal';
import { ReportsPage } from './pages/ReportsPage';
import { AuditVault } from './pages/AuditVault';
import { IntegrationsHealth } from './pages/IntegrationsHealth';
import { StudentPortal } from './pages/StudentPortal';
import { AuditorCopilot } from './components/AuditorCopilot';
import './apaar.css';

// Strict tab permission whitelist per stakeholder role
const ROLE_ALLOWED_TABS: Record<string, string[]> = {
  AICTE_ADMIN: ['dashboard', 'intake', 'anomalies', 'graph', 'reports', 'audit', 'health', 'verify'],
  INSTITUTION_ADMIN: ['institution', 'registry', 'upload', 'intake', 'reports', 'verify'],
  DATA_ENTRY_OFFICER: ['institution', 'registry', 'upload', 'verify'],
  EXTERNAL_VERIFIER: ['verify', 'health'],
  AUDITOR: ['dashboard', 'intake', 'anomalies', 'reports', 'audit', 'verify'],
  STUDENT: ['student-portal', 'verify']
};

const DEFAULT_ROLE_TABS: Record<string, string> = {
  AICTE_ADMIN: 'dashboard',
  INSTITUTION_ADMIN: 'institution',
  DATA_ENTRY_OFFICER: 'institution',
  EXTERNAL_VERIFIER: 'verify',
  AUDITOR: 'audit',
  STUDENT: 'student-portal'
};

export const App: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(getStoredUser());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Set default initial tab based on role upon user change
  useEffect(() => {
    if (user) {
      const defaultTab = DEFAULT_ROLE_TABS[user.role] || 'dashboard';
      setCurrentTab(defaultTab);
    }
  }, [user]);

  const handleLoginSuccess = (userInfo: UserInfo) => {
    setUser(userInfo);
    const defaultTab = DEFAULT_ROLE_TABS[userInfo.role] || 'dashboard';
    setCurrentTab(defaultTab);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  const handleSwitchPersona = async (username: string) => {
    const passwords: Record<string, string> = {
      aicte_admin: 'Admin@123',
      dtu_admin: 'College@123',
      knit_deo: 'College@123',
      auditor: 'Auditor@123',
      verifier: 'Verifier@123',
      student_demo: 'Student@123'
    };
    try {
      const pwd = passwords[username] || 'Admin@123';
      const res = await api.login(username, pwd);
      setUser(res.user_info);
      const targetDefaultTab = DEFAULT_ROLE_TABS[res.user_info.role] || 'dashboard';
      setCurrentTab(targetDefaultTab);
    } catch (err: any) {
      alert(`Persona switch error: ${err.message}`);
    }
  };

  const handleNavigate = (tab: string) => {
    const normalized = normalizeTabId(tab);
    const userRole = user?.role || 'AICTE_ADMIN';
    const allowed = ROLE_ALLOWED_TABS[userRole] || ROLE_ALLOWED_TABS.AICTE_ADMIN;

    if (!allowed.includes(normalized)) {
      alert(`Access Scoped: Your current role (${userRole}) is not permitted to access this module.`);
      return;
    }
    setCurrentTab(normalized);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const activeTabNorm = normalizeTabId(currentTab);

  return (
    <>
      {activeTabNorm === 'dashboard' && (
        <AicteDashboard
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'institution' && (
        <InstitutionDashboard
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'registry' && (
        <StudentRegistry
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'upload' && (
        <BulkUploadWizard
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'anomalies' && (
        <AnomalyCenter
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'intake' && (
        <IntakeMonitoring
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'graph' && (
        <IdentityGraphView
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'verify' && (
        <VerificationPortal
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'reports' && (
        <ReportsPage
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'audit' && (
        <AuditVault
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'health' && (
        <IntegrationsHealth
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}
      {activeTabNorm === 'student-portal' && (
        <StudentPortal
          user={user}
          onNavigateTab={handleNavigate}
          onLogout={handleLogout}
          onSwitchPersona={handleSwitchPersona}
        />
      )}

      {/* Floating AICTE Auditor Co-Pilot (Qwen 8B) - Scoped to Regulatory Authorities */}
      {(user.role === 'AICTE_ADMIN' || user.role === 'AUDITOR') && (
        <AuditorCopilot />
      )}
    </>
  );
};

export default App;
