import React, { useState, useRef, useEffect } from 'react';
import { UserInfo } from '../services/api';
import { Eye, EyeOff, LogOut, UserCheck, Globe, ChevronDown, Check } from 'lucide-react';
import { ClerkUserSection } from './ClerkUserSection';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { language, setLanguage, currentLanguage, languages, t } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [searchLang, setSearchLang] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = languages.filter(l => 
    l.name.toLowerCase().includes(searchLang.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(searchLang.toLowerCase()) ||
    l.code.toLowerCase().includes(searchLang.toLowerCase())
  );

  const roleBadges: Record<string, { label: string; color: string }> = {
    AICTE_ADMIN: { label: "AICTE Central Regulator", color: "bg-purple-100 text-purple-900 border-purple-300 font-bold" },
    INSTITUTION_ADMIN: { label: "College Registrar", color: "bg-blue-100 text-blue-900 border-blue-300 font-bold" },
    DATA_ENTRY_OFFICER: { label: "Admissions DEO", color: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold" },
    AUDITOR: { label: "Independent Auditor", color: "bg-amber-100 text-amber-900 border-amber-300 font-bold" },
    EXTERNAL_VERIFIER: { label: "Employer Verifier", color: "bg-cyan-100 text-cyan-900 border-cyan-300 font-bold" }
  };

  const badge = roleBadges[user?.role || ""] || { label: user?.role || "User", color: "bg-slate-100 text-slate-800 border-slate-300 font-bold" };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm no-print relative z-40">
      {/* Left: Organization Context */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-900 text-sm">
            All India Council for Technical Education
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-blue-700 font-bold tracking-wide flex items-center gap-1.5">
            <span>APAAR-Verify</span>
            <span className="text-[10px] font-semibold text-slate-500 font-normal">Surveillance Gateway</span>
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* 22 Indian Regional Languages Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-xs"
            title="Select from 22 Indian Regional Languages (8th Schedule)"
            aria-label="Language Selector"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-medium text-indigo-900">{currentLanguage.nativeName}</span>
            <span className="text-[10px] text-indigo-500 font-mono">({currentLanguage.code.toUpperCase()})</span>
            <ChevronDown className={`w-3 h-3 text-indigo-500 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 pb-2 border-b border-slate-100">
                <div className="text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Indian Scheduled Languages</span>
                  <span className="text-[10px] text-indigo-600 font-normal bg-indigo-50 px-1.5 py-0.5 rounded">22 + English</span>
                </div>
                <input
                  type="text"
                  placeholder="Search language / भाषा खोजें..."
                  value={searchLang}
                  onChange={(e) => setSearchLang(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
                {filteredLanguages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                      setSearchLang("");
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/70 transition-colors ${
                      language === l.code ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                        {l.nativeName}
                        {language === l.code && <Check className="w-3 h-3 text-indigo-600" />}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {l.name} • <span className="font-mono text-[9px]">{l.script}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                      {l.code}
                    </span>
                  </button>
                ))}
                {filteredLanguages.length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No matching language found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

        {/* Clerk Profile Avatar */}
        {Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) && (
          <ClerkUserSection />
        )}

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
