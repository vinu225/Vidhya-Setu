import React from 'react';
import { 
  Building2, GraduationCap, ShieldCheck, Users, UploadCloud, 
  AlertTriangle, Network, Award, Search, FileText, Lock, Activity,
  BarChart3
} from 'lucide-react';
import { UserInfo } from '../services/api';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserInfo | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, user }) => {
  const isAicteAdmin = user?.role === "AICTE_ADMIN" || user?.role === "AUDITOR";
  const isInstitution = user?.role === "INSTITUTION_ADMIN" || user?.role === "DATA_ENTRY_OFFICER";

  const navItems = [
    { id: "aicte-hq", label: "AICTE Regulatory HQ", icon: Building2, show: isAicteAdmin },
    { id: "institution-portal", label: "Institution Portal", icon: GraduationCap, show: true },
    { id: "student-registry", label: "Student Registry", icon: Users, show: true },
    { id: "bulk-upload", label: "Bulk Upload Hub", icon: UploadCloud, show: isInstitution || isAicteAdmin },
    { id: "anomaly-center", label: "Anomaly & Fraud Center", icon: AlertTriangle, show: true },
    { id: "intake-monitor", label: "Intake Compliance", icon: BarChart3, show: true },
    { id: "identity-graph", label: "Identity Graph (NetworkX)", icon: Network, show: true },
    { id: "credential-manager", label: "Credentials & Badges", icon: Award, show: isAicteAdmin || isInstitution },
    { id: "public-verify", label: "Public & Employer Verify", icon: Search, show: true },
    { id: "regulatory-reports", label: "Reports & Exports", icon: FileText, show: true },
    { id: "dpdp-audit", label: "DPDP Audit Vault", icon: Lock, show: isAicteAdmin },
    { id: "system-health", label: "Integrations & Health", icon: Activity, show: true },
  ];

  return (
    <aside className="w-64 bg-navy-900 text-slate-200 flex flex-col border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3 bg-navy-900/50">
        <div className="w-10 h-10 rounded-lg bg-aicte-blue border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-900/20">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
            EduVerify AI
            <span className="text-[10px] font-semibold uppercase bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700/50">
              SIH 26263
            </span>
          </div>
          <div className="text-[11px] text-slate-400">AICTE APAAR Gateway</div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Surveillance & Operations
        </div>
        {navItems.filter(item => item.show).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer System Meta */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-navy-900/60">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-500">Regulation Bureau</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">v1.0.0 • NEP 2020 Aligned</div>
      </div>
    </aside>
  );
};
