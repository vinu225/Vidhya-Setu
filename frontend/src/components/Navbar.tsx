import React from 'react';
import { UserInfo, api } from '../services/api';
import { Shield, Eye, EyeOff, LogOut, UserCheck } from 'lucide-react';

interface NavbarProps {
  user: UserInfo | null;
  onLogout: () => void;
  piiMasked: boolean;
  setPiiMasked: (val: boolean) => void;
  onSwitchPersona: (username: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  piiMasked,
  setPiiMasked,
  onSwitchPersona
}) => {
  const roleBadges: Record<string, { label: string; color: string }> = {
    AICTE_ADMIN: { label: "AICTE Central Regulator", color: "bg-purple-900/40 text-purple-300 border-purple-700/50" },
    INSTITUTION_ADMIN: { label: "College Registrar", color: "bg-blue-900/40 text-blue-300 border-blue-700/50" },
    DATA_ENTRY_OFFICER: { label: "Admissions DEO", color: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50" },
    AUDITOR: { label: "Independent Auditor", color: "bg-amber-900/40 text-amber-300 border-amber-700/50" },
    EXTERNAL_VERIFIER: { label: "Employer Verifier", color: "bg-cyan-900/40 text-cyan-300 border-cyan-700/50" }
  };

  const badge = roleBadges[user?.role || ""] || { label: user?.role || "User", color: "bg-slate-800 text-slate-300 border-slate-700" };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm no-print">
      {/* Left: Organization Context */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-800 text-sm">
            All India Council for Technical Education
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-medium">
            Regulation Bureau — APAAR Gateway
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* DPDP Act 2023 PII Masking Toggle */}
        <button
          onClick={() => setPiiMasked(!piiMasked)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            piiMasked
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          }`}
          title="Digital Personal Data Protection Act 2023 Masking Switch"
        >
          {piiMasked ? <EyeOff className="w-3.5 h-3.5 text-emerald-600" /> : <Eye className="w-3.5 h-3.5 text-amber-600" />}
          <span>DPDP PII Masking: {piiMasked ? "ACTIVE" : "OFF"}</span>
        </button>

        {/* Quick Demo Persona Switcher */}
        <div className="relative group">
          <button className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Switch Persona</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">Demo Accounts</div>
            <button
              onClick={() => onSwitchPersona("aicte_admin")}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>AICTE Central Regulator</span>
              <span className="text-[10px] text-purple-600 font-mono">HQ</span>
            </button>
            <button
              onClick={() => onSwitchPersona("dtu_admin")}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>DTU Registrar</span>
              <span className="text-[10px] text-blue-600 font-mono">College</span>
            </button>
            <button
              onClick={() => onSwitchPersona("knit_deo")}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>KNIT Admissions DEO</span>
              <span className="text-[10px] text-emerald-600 font-mono">Entry</span>
            </button>
            <button
              onClick={() => onSwitchPersona("auditor")}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Independent Auditor</span>
              <span className="text-[10px] text-amber-600 font-mono">Audit</span>
            </button>
            <button
              onClick={() => onSwitchPersona("verifier")}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>Employer Verifier</span>
              <span className="text-[10px] text-cyan-600 font-mono">Public</span>
            </button>
          </div>
        </div>

        {/* Current User Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-800">{user?.username}</div>
            <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
              {user?.institution_name || badge.label}
            </div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
            {user?.role}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
