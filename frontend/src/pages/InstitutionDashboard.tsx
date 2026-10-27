import React, { useEffect, useState } from 'react';
import { api, UserInfo } from '../services/api';
import { 
  GraduationCap, Building2, UploadCloud, Users, 
  AlertCircle, CheckCircle2, ChevronRight 
} from 'lucide-react';

interface InstitutionDashboardProps {
  user: UserInfo | null;
  onNavigateTab: (tab: string) => void;
}

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({ user, onNavigateTab }) => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>("");
  const [instData, setInstData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const insts = await api.getInstitutions();
        setInstitutions(insts);
        // Default to user's assigned institution or first one
        const defaultId = user?.institution_id || (insts[0]?.id || "");
        setSelectedInstId(defaultId);
      } catch (err) {
        console.error("Failed to load institutions", err);
      }
    };
    loadInstitutions();
  }, [user]);

  useEffect(() => {
    if (!selectedInstId) return;
    const loadDetails = async () => {
      try {
        setLoading(true);
        const data = await api.getInstitutionOverview(selectedInstId);
        setInstData(data);
      } catch (err) {
        console.error("Failed to load institution details", err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [selectedInstId]);

  const isRestrictedToSingle = user?.role === "INSTITUTION_ADMIN" || user?.role === "DATA_ENTRY_OFFICER";

  return (
    <div className="p-6 space-y-6">
      {/* College Selector Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {instData?.official_code || "COLLEGE"}
              </span>
              <span className="text-xs text-slate-500">{instData?.state}</span>
              {instData?.nirf_rank && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  NIRF #{instData.nirf_rank}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-800 mt-1">
              {instData?.institution_name || "Institution Registrar Portal"}
            </h1>
          </div>
        </div>

        {/* Institution Switcher (AICTE Admin/Auditor only) */}
        {!isRestrictedToSingle && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Select College:</span>
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.official_code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading institution metrics...</div>
      ) : (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Approved Core Intake</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {instData?.total_approved_regular_intake}
              </div>
              <span className="text-[11px] text-slate-500">Sanctioned Seats AY 24-25</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Actual Admitted</span>
              <div className="text-2xl font-bold text-teal-700 mt-1">
                {instData?.total_enrolled}
              </div>
              <span className="text-[11px] text-teal-600 font-medium">
                {instData?.regular_utilization_percent}% Regular Utilization
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Supernumerary Admitted</span>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {instData?.supernumerary_enrolled}
              </div>
              <span className="text-[11px] text-amber-600">TFW, EWS, NRI, FN/OCI, PMSSS</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Open Validation Issues</span>
              <div className="text-2xl font-bold text-rose-700 mt-1">
                {instData?.open_validation_issues}
              </div>
              <span className="text-[11px] text-rose-600">Requires correction/upload review</span>
            </div>
          </div>

          {/* Program-wise Intake vs Enrolment Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Approved Intake & Supernumerary Utilization</h2>
                <p className="text-xs text-slate-500">Approval Process Handbook (APH) Quota Compliance</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigateTab("bulk-upload")}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Bulk Upload</span>
                </button>
                <button
                  onClick={() => onNavigateTab("student-registry")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-300"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Student Registry</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {(instData?.program_breakdown || []).map((prog: any) => {
                const util = prog.regular_utilization_percent || 0;
                const isOver = util > 100;
                return (
                  <div key={prog.program_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 text-sm">{prog.program_name}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {prog.program_code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Approved Regular: <strong>{prog.approved_regular_intake}</strong> | Admitted Regular: <strong>{prog.admitted_regular}</strong> | Total Enrolled: <strong>{prog.total_admitted}</strong>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          isOver
                            ? "bg-rose-100 text-rose-700 border-rose-300"
                            : "bg-emerald-100 text-emerald-700 border-emerald-300"
                        }`}>
                          {util}% Utilization
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? "bg-rose-600" : "bg-teal-600"
                        }`}
                        style={{ width: `${Math.min(util, 100)}%` }}
                      ></div>
                    </div>

                    {/* Supernumerary Badges */}
                    <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        TFW (5%): {prog.tfw_admitted} / {prog.tfw_cap}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        EWS (10%): {prog.ews_admitted} / {prog.ews_cap}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        NRI (5%): {prog.nri_admitted} / {prog.nri_cap}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        FN / OCI (15%): {prog.fn_oci_admitted} / {prog.fn_oci_cap}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        PMSSS: {prog.pmsss_admitted} / {prog.pmsss_cap}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
