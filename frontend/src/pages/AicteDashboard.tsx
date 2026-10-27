import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Building2, Users, AlertTriangle, ShieldCheck, 
  Download, RefreshCw, CheckCircle2, TrendingUp, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

export const AicteDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getNationalOverview();
      setOverview(data);
    } catch (err: any) {
      console.error("Failed to load national overview", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanLoading(true);
      const res = await api.triggerNationalValidation();
      setScanMsg(res.message);
      await loadData();
    } catch (err: any) {
      setScanMsg(`Scan failed: ${err.message}`);
    } finally {
      setScanLoading(false);
      setTimeout(() => setScanMsg(""), 5000);
    }
  };

  if (loading || !overview) {
    return (
      <div className="p-8 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span>Loading AICTE National Surveillance Dashboard...</span>
      </div>
    );
  }

  const COLORS = ['#2563EB', '#0D9488', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981'];

  const quotaPieData = [
    { name: 'Regular Core', value: overview.quota_breakdown?.regular || 0 },
    { name: 'TFW (5%)', value: overview.quota_breakdown?.tfw || 0 },
    { name: 'EWS (10%)', value: overview.quota_breakdown?.ews || 0 },
    { name: 'NRI (5%)', value: overview.quota_breakdown?.nri || 0 },
    { name: 'FN / OCI (15%)', value: overview.quota_breakdown?.fn_oci || 0 },
    { name: 'PMSSS', value: overview.quota_breakdown?.pmsss || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy-900 to-navy-800 text-white p-6 rounded-2xl shadow-lg border border-slate-700">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
              Regulatory Command Center
            </span>
            <span className="text-slate-400 text-xs">AY 2024–25</span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white">
            AICTE National Student Surveillance & Verification HQ
          </h1>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Autonomous fraud surveillance, real-time supernumerary quota monitoring, and sovereign APAAR credential verification across all AICTE-approved institutions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunScan}
            disabled={scanLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanLoading ? "animate-spin" : ""}`} />
            <span>{scanLoading ? "Scanning Network..." : "Run National Integrity Scan"}</span>
          </button>
          <a
            href={api.getComplianceReportUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export APH Report</span>
          </a>
        </div>
      </div>

      {scanMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{scanMsg}</span>
        </div>
      )}

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Approved Colleges</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {overview.total_institutions}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <span>✓ 100% Onboarded</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Core Approved Intake</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {overview.total_approved_regular_intake?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Sanctioned Seats (2024–25)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Actual Admitted</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {overview.total_enrolled?.toLocaleString()}
          </div>
          <div className="text-[11px] text-teal-600 mt-1 font-medium">
            {overview.national_utilization_rate}% Core Utilization
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Supernumerary Seats</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {overview.supernumerary_enrolled?.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            Cap: {overview.total_supernumerary_capacity} (APH Norms)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>Active Fraud Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">
            {overview.active_anomaly_alerts}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">
            {overview.pending_duplicate_cases} Multi-College Collisions
          </div>
        </div>
      </div>

      {/* Real Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State-wise Admissions vs Intake Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">State-wise Sanctioned Intake vs Enrolment</h2>
              <p className="text-xs text-slate-500">Real-time geographic distribution across AICTE territories</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.state_breakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="approved_intake" name="Approved Intake" fill="#0B3B60" radius={[4, 4, 0, 0]} />
                <Bar dataKey="enrolled" name="Actual Enrolled" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supernumerary Category Breakdown Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Seat Category Distribution</h2>
          <p className="text-xs text-slate-500 mb-2">Core intake vs APH supernumerary ceilings</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={quotaPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {quotaPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            {quotaPieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-slate-600 text-[11px] truncate">{entry.name}: <strong>{entry.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* State-wise Breakdown Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">State-wise Regulatory Overview Table</h2>
          <span className="text-xs text-slate-500 font-mono">APH 2024–27 Chapter II/IV Norms</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">Institutions</th>
                <th className="py-2.5 px-4">Approved Intake</th>
                <th className="py-2.5 px-4">Actual Enrolled</th>
                <th className="py-2.5 px-4">Utilization</th>
                <th className="py-2.5 px-4">Active Anomalies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(overview.state_breakdown || []).map((st: any) => {
                const util = Math.round((st.enrolled / Math.max(st.approved_intake, 1)) * 100);
                return (
                  <tr key={st.state} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{st.state}</td>
                    <td className="py-3 px-4">{st.institutions}</td>
                    <td className="py-3 px-4 font-mono">{st.approved_intake}</td>
                    <td className="py-3 px-4 font-mono">{st.enrolled}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        util > 100 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {util}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {st.anomalies > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">
                          {st.anomalies} Alert(s)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
