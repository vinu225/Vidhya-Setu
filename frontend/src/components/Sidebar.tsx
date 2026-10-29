import React from 'react';
import { 
  Building2, GraduationCap, ShieldCheck, Users, UploadCloud, 
  AlertTriangle, Network, Award, Search, FileText, Lock, Activity,
  BarChart3
} from 'lucide-react';
import { UserInfo } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserInfo | null;
}

interface NavItemDef {
  id: string;
  label: string;
  transKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, user }) => {
  const { t } = useLanguage();
  const isAicteAdmin = user?.role === "AICTE_ADMIN" || user?.role === "AUDITOR";
  const isInstitution = user?.role === "INSTITUTION_ADMIN" || user?.role === "DATA_ENTRY_OFFICER";

  const navItems: NavItemDef[] = [
    { id: "aicte-hq", label: "AICTE Regulatory HQ", transKey: "nav_aicte_hq", icon: Building2, show: isAicteAdmin },
    { id: "institution-portal", label: "Institution Portal", transKey: "nav_institution", icon: GraduationCap, show: true },
    { id: "student-registry", label: "Student Registry", transKey: "nav_students", icon: Users, show: true },
    { id: "bulk-upload", label: "Bulk Upload Hub", transKey: "nav_bulk_upload", icon: UploadCloud, show: isInstitution || isAicteAdmin },
    { id: "anomaly-center", label: "Anomaly & Fraud Center", transKey: "nav_anomaly_center", icon: AlertTriangle, show: true },
    { id: "intake-monitor", label: "Intake Compliance", transKey: "nav_intake_monitor", icon: BarChart3, show: true },
    { id: "identity-graph", label: "Identity Graph (NetworkX)", transKey: "nav_identity_graph", icon: Network, show: true },
    { id: "credential-manager", label: "Credentials & Badges", transKey: "nav_credentials", icon: Award, show: isAicteAdmin || isInstitution },
    { id: "public-verify", label: "Public & Employer Verify", transKey: "nav_verify", icon: Search, show: true },
    { id: "regulatory-reports", label: "Reports & Exports", transKey: "nav_reports", icon: FileText, show: true },
    { id: "dpdp-audit", label: "DPDP Audit Vault", transKey: "nav_audit_vault", icon: Lock, show: isAicteAdmin },
    { id: "system-health", label: "Integrations & Health", transKey: "nav_health", icon: Activity, show: true },
  ];

  return (
    <aside className="w-64 bg-navy-900 text-slate-200 flex flex-col border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-navy-900">
        <div className="w-10 h-10 rounded-xl bg-blue-700 border border-blue-400/40 flex items-center justify-center shadow-md">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
            APAAR-Verify
            <span className="text-[10px] font-bold uppercase bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-700/60">
              HQ
            </span>
          </div>
          <div className="text-[11px] text-slate-300 font-medium">AICTE Regulatory Surveillance</div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5" aria-label="Main Navigation">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
          Surveillance & Operations
        </div>
        {navItems.filter(item => item.show).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const translatedLabel = t(item.transKey) || item.label;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold"
                  : "text-slate-200 hover:bg-slate-800 hover:text-white font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-300"}`} />
              <span className="truncate">{translatedLabel}</span>
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
