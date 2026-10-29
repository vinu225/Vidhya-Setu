import React, { useState, useEffect } from 'react';
import { api, UserInfo, getStoredUser } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
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

export const App: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(getStoredUser());
  const [currentTab, setCurrentTab] = useState<string>("aicte-hq");
  const [piiMasked, setPiiMasked] = useState<boolean>(true);

  // If user role is institution admin or DEO, default to institution-portal
  useEffect(() => {
    if (user?.role === "INSTITUTION_ADMIN" || user?.role === "DATA_ENTRY_OFFICER") {
      setCurrentTab("institution-portal");
    } else {
      setCurrentTab("aicte-hq");
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
      aicte_admin: "Admin@123",
      dtu_admin: "College@123",
      knit_deo: "College@123",
      auditor: "Auditor@123",
      verifier: "Verifier@123"
    };
    try {
      const pwd = passwords[username] || "Admin@123";
      const res = await api.login(username, pwd);
      setUser(res.user_info);
    } catch (err: any) {
      alert(`Persona switch error: ${err.message}`);
    }
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Persistent Top Navbar */}
        <Navbar
          user={user}
          onLogout={handleLogout}
          piiMasked={piiMasked}
          setPiiMasked={setPiiMasked}
          onSwitchPersona={handleSwitchPersona}
        />

        {/* Viewport Router */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {currentTab === "aicte-hq" && (
            <AicteDashboard onNavigateTab={setCurrentTab} />
          )}
          {currentTab === "institution-portal" && (
            <InstitutionDashboard user={user} onNavigateTab={setCurrentTab} />
          )}
          {currentTab === "student-registry" && (
            <StudentRegistry user={user} piiMasked={piiMasked} />
          )}
          {currentTab === "bulk-upload" && (
            <BulkUploadWizard user={user} onNavigateTab={setCurrentTab} />
          )}
          {currentTab === "anomaly-center" && <AnomalyCenter user={user} />}
          {currentTab === "intake-monitor" && <IntakeMonitoring />}
          {currentTab === "identity-graph" && <IdentityGraphView />}
          {currentTab === "credential-manager" && <VerificationPortal />}
          {currentTab === "public-verify" && <VerificationPortal />}
          {currentTab === "regulatory-reports" && <ReportsPage />}
          {currentTab === "dpdp-audit" && <AuditVault />}
          {currentTab === "system-health" && <IntegrationsHealth />}
        </main>
      </div>
    </div>
  );
};

export default App;
