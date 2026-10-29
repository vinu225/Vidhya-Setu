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
import { AuditorCopilot } from './components/AuditorCopilot';
import './apaar.css';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(getStoredUser());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Default initial tab based on role
  useEffect(() => {
    if (user?.role === 'INSTITUTION_ADMIN' || user?.role === 'DATA_ENTRY_OFFICER') {
      setCurrentTab('institution');
    } else {
      setCurrentTab('dashboard');
    }
  }, [user]);

  const handleLoginSuccess = (userInfo: UserInfo) => {
    setUser(userInfo);
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
      verifier: 'Verifier@123'
    };
    try {
      const pwd = passwords[username] || 'Admin@123';
      const res = await api.login(username, pwd);
      setUser(res.user_info);
    } catch (err: any) {
      alert(`Persona switch error: ${err.message}`);
    }
  };

  const handleNavigate = (tab: string) => {
    setCurrentTab(normalizeTabId(tab));
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

      {/* Floating AICTE Auditor Co-Pilot (Qwen 8B) */}
      <AuditorCopilot />
    </>
  );
};

export default App;
