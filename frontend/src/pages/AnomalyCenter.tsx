import React, { useEffect, useState } from 'react';
import { api, UserInfo } from '../services/api';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, 
  X, RefreshCw, Eye, MessageSquare 
} from 'lucide-react';

interface AnomalyCenterProps {
  user: UserInfo | null;
}

export const AnomalyCenter: React.FC<AnomalyCenterProps> = ({ user }) => {
  const [duplicateCases, setDuplicateCases] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolution Dialog State
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [resolutionStatus, setResolutionStatus] = useState("CONFIRMED_DUPLICATE");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [dups, alts, iss] = await Promise.all([
        api.getDuplicateCases(),
        api.getAnomalyAlerts(),
        api.getValidationIssues()
      ]);
      setDuplicateCases(dups);
      setAlerts(alts);
      setIssues(iss);
    } catch (err) {
      console.error("Failed to load anomalies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      setIsSubmitting(true);
      await api.resolveDuplicateCase(selectedCase.id, resolutionStatus, resolutionNotes);
      setSuccessMsg(`Duplicate case ${selectedCase.case_id} resolved!`);
      setSelectedCase(null);
      setResolutionNotes("");
      loadData();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    const note = prompt("Enter resolution/action notes for this regulatory alert:");
    if (!note) return;
    try {
      await api.reviewAnomalyAlert(alertId, note);
      setSuccessMsg("Alert marked as resolved!");
      loadData();
    } catch (err: any) {
      alert(`Failed to resolve alert: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Fraud & Identity Collision Investigation Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time algorithmic detection of ghost students, cross-institution dual enrolments, and supernumerary intake breaches.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Cross-Institution Collisions (Ghost Students) */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-rose-50/50 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-rose-900">
              Cross-Institution Identity Collisions (Dual Enrolments)
            </h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
            {duplicateCases.filter(c => c.review_status === "PENDING").length} Action Required
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Case ID</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4">Protected APAAR</th>
                <th className="py-2.5 px-4">Institution 1</th>
                <th className="py-2.5 px-4">Institution 2</th>
                <th className="py-2.5 px-4">Evidence & Collision Details</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {duplicateCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No active identity collisions detected.
                  </td>
                </tr>
              ) : (
                duplicateCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.case_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.student_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.pseudonymous_id}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{c.primary_institution_name}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{c.secondary_institution_name}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={c.evidence_summary}>
                      {c.evidence_summary}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.review_status === "PENDING"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}>
                        {c.review_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.review_status === "PENDING" && (
                        <button
                          onClick={() => setSelectedCase(c)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition-all shadow-sm"
                        >
                          Review & Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Explainable Anomaly Alerts (Rules + Isolation Forest) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Explainable Anomaly Feed (Rules + Isolation Forest ML)
            </h2>
            <p className="text-xs text-slate-500">Autonomous pattern recognition with feature importance breakdown</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
            {alerts.length} Total Alerts
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">No active anomaly alerts.</div>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      a.severity === "CRITICAL"
                        ? "bg-rose-100 text-rose-800"
                        : a.severity === "HIGH"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {a.severity}
                    </span>
                    <span className="font-bold text-slate-800 text-xs">{a.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">Score: {a.anomaly_score}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {a.description}
                  </p>
                  {a.triggering_features && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                      <span>Trigger Signals:</span>
                      {Object.entries(a.triggering_features).map(([k, v]) => (
                        <span key={k} className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    a.status === "OPEN" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {a.status}
                  </span>
                  {a.status === "OPEN" && user?.role === "AICTE_ADMIN" && (
                    <button
                      onClick={() => handleResolveAlert(a.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resolve Duplicate Case Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Review & Resolve Identity Collision</h3>
              <button onClick={() => setSelectedCase(null)} className="text-slate-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveCase} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>Case: <strong>{selectedCase.case_id}</strong></div>
                <div>Candidate: <strong>{selectedCase.student_name}</strong> ({selectedCase.pseudonymous_id})</div>
                <div>Involved: <strong>{selectedCase.primary_institution_name}</strong> vs <strong>{selectedCase.secondary_institution_name}</strong></div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Regulatory Decision</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CONFIRMED_DUPLICATE">Confirmed Duplicate Enrolment (Sanction Required)</option>
                  <option value="LEGITIMATE_TRANSFER">Legitimate Institution Transfer (Exited College 1)</option>
                  <option value="RESOLVED">Resolved (Seat cancelled in Secondary College)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Resolution Audit Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record formal AICTE sanction notes or admission cancellation order..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold shadow-sm"
                >
                  {isSubmitting ? "Submitting..." : "Confirm Regulatory Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
