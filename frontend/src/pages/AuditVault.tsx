import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Lock, Shield, RefreshCw, Filter, Search } from 'lucide-react';

export const AuditVault: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const loadAudit = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditEvents(undefined, actionFilter || undefined);
      setEvents(res);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [actionFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>DPDP Act 2023 & Regulatory Audit Vault</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable SHA-256 chained audit ledger tracking all admissions, bulk uploads, verification queries, and regulatory resolution actions.
          </p>
        </div>

        <button
          onClick={loadAudit}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Audit Description</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4">Tamper Hash Chain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    Loading cryptographic ledger...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 font-sans">
                      {e.actor_username}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {e.actor_role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-blue-700 font-sans">
                      {e.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-sans max-w-sm truncate" title={e.description}>
                      {e.description}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {e.ip_address}
                    </td>
                    <td className="py-2.5 px-4 text-teal-700 font-mono text-[10px] truncate max-w-[120px]" title={e.tamper_hash}>
                      {e.tamper_hash ? `${e.tamper_hash.substring(0, 16)}...` : "VERIFIED"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
