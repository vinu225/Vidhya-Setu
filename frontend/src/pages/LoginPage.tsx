import React, { useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (userInfo: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("aicte_admin");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.login(username, password);
      onLoginSuccess(res.user_info);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-aicte-blue border border-cyan-400/40 mx-auto flex items-center justify-center shadow-xl shadow-cyan-900/30">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-800">
            SIH Problem Statement #26263
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            EduVerify AI
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            AICTE APAAR ID-Based Student Data Management & Autonomous Verification Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-300">Authorized Access Portal</span>
            <span className="text-[10px] text-emerald-400 font-medium">● System Operational</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Username / Official Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. aicte_admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In with Sovereign Access"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Persona Shortcuts */}
          <div className="pt-3 border-t border-slate-700/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Quick Judge & Evaluator Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoCredentials("aicte_admin", "Admin@123")}
                className="p-2 bg-slate-900/80 hover:bg-slate-700 text-slate-300 rounded-lg text-left border border-slate-700 transition-all"
              >
                <div className="font-semibold text-white">AICTE Regulator</div>
                <div className="text-[10px] text-purple-400 font-mono">aicte_admin</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("dtu_admin", "College@123")}
                className="p-2 bg-slate-900/80 hover:bg-slate-700 text-slate-300 rounded-lg text-left border border-slate-700 transition-all"
              >
                <div className="font-semibold text-white">DTU Registrar</div>
                <div className="text-[10px] text-blue-400 font-mono">dtu_admin</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("knit_deo", "College@123")}
                className="p-2 bg-slate-900/80 hover:bg-slate-700 text-slate-300 rounded-lg text-left border border-slate-700 transition-all"
              >
                <div className="font-semibold text-white">KNIT DEO</div>
                <div className="text-[10px] text-emerald-400 font-mono">knit_deo</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("auditor", "Auditor@123")}
                className="p-2 bg-slate-900/80 hover:bg-slate-700 text-slate-300 rounded-lg text-left border border-slate-700 transition-all"
              >
                <div className="font-semibold text-white">Auditor</div>
                <div className="text-[10px] text-amber-400 font-mono">auditor</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 font-mono">
          Ministry of Education • Government of India • NEP 2020 Sovereign APAAR
        </div>
      </div>
    </div>
  );
};
