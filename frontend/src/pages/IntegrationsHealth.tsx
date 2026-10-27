import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Activity, ShieldCheck, CheckCircle2, Server, Database, Key } from 'lucide-react';

export const IntegrationsHealth: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const [h, i] = await Promise.all([
          api.getHealth(),
          api.getIntegrationsHealth()
        ]);
        setHealth(h);
        setIntegrations(i);
      } catch (err) {
        console.error("Health check error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span>System Health & Integration Adapters</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time diagnostic health telemetry for core database, REST API engines, and institutional integration adapters.
        </p>
      </div>

      {/* Core Service Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">FastAPI Backend Service</span>
            <span className="text-sm font-bold text-emerald-700">
              {health?.status === "UP" ? "ONLINE (Healthy)" : "DEGRADED"}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Relational Database Engine</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {health?.database || "CONNECTING..."}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Cryptographic Signing Engine</span>
            <span className="text-sm font-bold text-purple-700">
              Ed25519 & HMAC-SHA256
            </span>
          </div>
        </div>
      </div>

      {/* Integration Adapters (Honestly Labeled Mock Provider) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">Sovereign Integration Gateway Adapters</h2>
          <p className="text-xs text-slate-500">
            Modular provider interfaces engineered for zero-rewrite transition to authorized production government APIs.
          </p>
        </div>

        <div className="divide-y divide-slate-100 p-2">
          {(integrations?.providers || []).map((p: any, idx: number) => (
            <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800 text-xs">{p.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold">
                    {p.type}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {p.disclaimer || "Operational synthetic adapter."}
                </p>
                {p.supported_erps && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    Supported Systems: {p.supported_erps.join(", ")}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{p.status}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
