import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BarChart3, AlertTriangle, CheckCircle2, Building2, Filter } from 'lucide-react';

export const IntakeMonitoring: React.FC = () => {
  const [intakeData, setIntakeData] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedInst, setSelectedInst] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const insts = await api.getInstitutions();
        setInstitutions(insts);
      } catch (err) {
        console.error("Failed to load institutions", err);
      }
    };
    fetchInstitutions();
  }, []);

  const loadIntake = async () => {
    try {
      setLoading(true);
      const data = await api.getIntakeAnalytics(selectedInst || undefined);
      setIntakeData(data);
    } catch (err) {
      console.error("Failed to load intake analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntake();
  }, [selectedInst]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Intake Compliance & Quota Watchdog</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforces AICTE Approval Process Handbook (APH) ceilings for Core Regular Intake, TFW (5%), EWS (10%), NRI (5%), and FN/OCI (15%).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedInst}
            onChange={(e) => setSelectedInst(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg text-xs px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Approved Institutions</option>
            {institutions.map(i => (
              <option key={i.id} value={i.id}>{i.name} ({i.official_code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Program Compliance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Approved Core</th>
                <th className="py-3 px-4">Admitted Core</th>
                <th className="py-3 px-4">Core Utilization %</th>
                <th className="py-3 px-4">TFW (5%)</th>
                <th className="py-3 px-4">EWS (10%)</th>
                <th className="py-3 px-4">NRI (5%)</th>
                <th className="py-3 px-4">FN/OCI (15%)</th>
                <th className="py-3 px-4">Total Admitted</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    Loading intake compliance data...
                  </td>
                </tr>
              ) : intakeData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No matching program intake records found.
                  </td>
                </tr>
              ) : (
                intakeData.map((row) => {
                  const isViolation = row.status === "OVER_INTAKE_VIOLATION";
                  const isHigh = row.status === "WARNING_HIGH_UTILIZATION";
                  return (
                    <tr key={`${row.institution_id}_${row.program_code}`} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {row.institution_name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{row.program_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{row.program_code}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {row.approved_regular_intake}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {row.admitted_regular}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isViolation
                            ? "bg-rose-100 text-rose-700"
                            : isHigh
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {row.regular_utilization_percent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {row.tfw_admitted} / {row.tfw_cap}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {row.ews_admitted} / {row.ews_cap}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {row.nri_admitted} / {row.nri_cap}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {row.fn_oci_admitted} / {row.fn_oci_cap}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {row.total_admitted} / {row.total_approved_capacity}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isViolation
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : isHigh
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300"
                        }`}>
                          {isViolation ? "OVER-INTAKE" : isHigh ? "NEAR CAP" : "COMPLIANT"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
