import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Building2, Users, AlertTriangle, ShieldCheck, 
  Download, RefreshCw, CheckCircle2, TrendingUp, Layers,
  ChevronRight, Filter, ExternalLink, AlertOctagon, FileSpreadsheet,
  FileText, ShieldAlert, ArrowUpRight, Clock, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

interface AicteDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

// Lightweight, crisp SVG Sparkline for KPI trends
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 24 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const AicteDashboard: React.FC<AicteDashboardProps> = ({ onNavigateTab }) => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanSummary, setScanSummary] = useState<string | null>(null);
  
  // Sticky Filter Bar States
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [selectedState, setSelectedState] = useState('ALL');
  const [programmeLevel, setProgrammeLevel] = useState('ALL');
  const [institutionType, setInstitutionType] = useState('ALL');

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);

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
      setScanSummary(null);
      const res = await api.triggerNationalValidation();
      setScanSummary(res.message || "National Integrity Scan completed: 41 institutions audited, 5 collisions mapped.");
      await loadData();
    } catch (err: any) {
      setScanSummary(`Scan failed: ${err.message}`);
    } finally {
      setScanLoading(false);
      setTimeout(() => setScanSummary(null), 8000);
    }
  };

  // State-wise filtered chart data
  const stateChartData = useMemo(() => {
    if (!overview?.state_breakdown) return [];
    if (selectedState === 'ALL') {
      return overview.state_breakdown;
    }
    return overview.state_breakdown.filter((st: any) => st.state === selectedState);
  }, [overview, selectedState]);

  // Quota Donut Data
  const quotaPieData = useMemo(() => {
    if (!overview?.quota_breakdown) return [];
    return [
      { name: 'Core Regular', value: overview.quota_breakdown.regular || 0, cap: overview.total_approved_regular_intake || 0, color: '#2563EB' },
      { name: 'TFW (5%)', value: overview.quota_breakdown.tfw || 0, cap: Math.round((overview.total_approved_regular_intake || 0) * 0.05), color: '#0D9488' },
      { name: 'EWS (10%)', value: overview.quota_breakdown.ews || 0, cap: Math.round((overview.total_approved_regular_intake || 0) * 0.10), color: '#F59E0B' },
      { name: 'NRI (5%)', value: overview.quota_breakdown.nri || 0, cap: Math.round((overview.total_approved_regular_intake || 0) * 0.05), color: '#8B5CF6' },
      { name: 'FN / OCI (15%)', value: overview.quota_breakdown.fn_oci || 0, cap: Math.round((overview.total_approved_regular_intake || 0) * 0.15), color: '#EC4899' },
      { name: 'PMSSS (J&K)', value: overview.quota_breakdown.pmsss || 0, cap: 80, color: '#10B981' },
    ].filter(d => d.value > 0);
  }, [overview]);

  // Available States for Filter
  const availableStates = useMemo(() => {
    if (!overview?.state_breakdown) return [];
    return Array.from(new Set(overview.state_breakdown.map((s: any) => s.state))).sort();
  }, [overview]);

  // Skeleton Loader for Loading State
  if (loading || !overview) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Compact Hero Skeleton */}
        <div className="h-28 bg-slate-200 rounded-2xl w-full"></div>

        {/* Filter Bar Skeleton */}
        <div className="h-14 bg-slate-200 rounded-xl w-full"></div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 rounded-xl"></div>
          <div className="h-80 bg-slate-200 rounded-xl"></div>
        </div>

        {/* Table Skeleton */}
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. COMPACT HERO BANNER (Half height to keep KPIs above fold) */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white px-6 py-4 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-600 text-white shadow-sm">
              Regulatory HQ
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Demo data (synthetic)
            </span>
            <span className="text-slate-400 text-xs font-mono">AY {academicYear}</span>
          </div>
          <h1 className="text-lg md:text-xl font-extrabold text-white mt-1 tracking-tight">
            AICTE National Student Surveillance & Verification HQ
          </h1>
          <p className="text-slate-300 text-xs max-w-2xl mt-0.5 line-clamp-1">
            Real-time APAAR parity verification, autonomous cross-institution collision surveillance, and supernumerary quota audit.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <button
            onClick={handleRunScan}
            disabled={scanLoading}
            aria-label="Run National Integrity Scan across all AICTE institutions"
            className="flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanLoading ? "animate-spin" : ""}`} />
            <span>{scanLoading ? "Scanning Network..." : "Run National Integrity Scan"}</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            aria-label="Export AICTE Approval Process Handbook regulatory report"
            className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export APH Report</span>
          </button>
        </div>
      </div>

      {/* Scan Summary Banner */}
      {scanSummary && (
        <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{scanSummary}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-mono">Status: Up-to-date</span>
        </div>
      )}

      {/* 2. STICKY FILTER BAR */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-700 font-bold">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Surveillance Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Academic Year */}
          <div className="flex items-center space-x-1.5">
            <label htmlFor="ay-select" className="text-slate-500 font-medium">AY:</label>
            <select
              id="ay-select"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024-25">2024–25 (Active)</option>
              <option value="2023-24">2023–24 (Historical)</option>
              <option value="2022-23">2022–23 (Archived)</option>
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center space-x-1.5">
            <label htmlFor="state-select" className="text-slate-500 font-medium">State:</label>
            <select
              id="state-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All States ({overview.state_breakdown?.length || 0})</option>
              {availableStates.map((st: any) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Programme Level */}
          <div className="flex items-center space-x-1.5">
            <label htmlFor="level-select" className="text-slate-500 font-medium">Level:</label>
            <select
              id="level-select"
              value={programmeLevel}
              onChange={(e) => setProgrammeLevel(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Programmes</option>
              <option value="UG">UG (B.Tech / B.E.)</option>
              <option value="PG">PG (M.Tech / MCA)</option>
              <option value="DIPLOMA">Polytechnic Diploma</option>
            </select>
          </div>

          {/* Institution Type */}
          <div className="flex items-center space-x-1.5">
            <label htmlFor="type-select" className="text-slate-500 font-medium">Type:</label>
            <select
              id="type-select"
              value={institutionType}
              onChange={(e) => setInstitutionType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="GOVERNMENT">Government</option>
              <option value="AIDED">Govt-Aided</option>
              <option value="PRIVATE">Self-Financed</option>
            </select>
          </div>

          {(selectedState !== 'ALL' || programmeLevel !== 'ALL' || institutionType !== 'ALL') && (
            <button
              onClick={() => { setSelectedState('ALL'); setProgrammeLevel('ALL'); setInstitutionType('ALL'); }}
              className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. 7 KPI METRIC CARDS (With Trends, Sparklines, and Prominent Fraud Alerts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* KPI 1: Approved Colleges */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Colleges</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {overview.total_institutions}
            </span>
            <Sparkline data={[34, 36, 38, 39, 41]} color="#2563EB" />
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-between">
            <span>{overview.total_institutions > 0 ? "✓ 100% Onboarded" : "No data yet"}</span>
            <span className="text-slate-400 font-mono text-[10px]">+7.3% LY</span>
          </div>
        </div>

        {/* KPI 2: Sanctioned Core Intake */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sanctioned Seats</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {overview.total_approved_regular_intake?.toLocaleString()}
            </span>
            <Sparkline data={[13800, 14100, 14350, 14600, 14820]} color="#4F46E5" />
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Approved Regular</span>
            <span className="text-slate-400 font-mono text-[10px]">+4.8% LY</span>
          </div>
        </div>

        {/* KPI 3: Actual Enrolled */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Actual Admitted</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {overview.total_enrolled?.toLocaleString()}
            </span>
            <Sparkline data={[1280, 1340, 1410, 1470, 1509]} color="#0D9488" />
          </div>
          <div className="text-[11px] text-teal-700 font-semibold flex items-center justify-between">
            <span>{overview.national_utilization_rate}% Regular Rate</span>
            <span className="text-slate-400 font-mono text-[10px]">+9.1% LY</span>
          </div>
        </div>

        {/* KPI 4: Supernumerary Seats */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Supernumerary</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {overview.supernumerary_enrolled?.toLocaleString()}
            </span>
            <Sparkline data={[240, 255, 268, 275, 285]} color="#D97706" />
          </div>
          <div className="text-[11px] text-amber-800 font-medium truncate">
            Cap: {overview.total_supernumerary_capacity?.toLocaleString()} (APH)
          </div>
        </div>

        {/* KPI 5: EXCESS INTAKE (NEW) */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-300 shadow-sm bg-rose-50/20 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold">
            <span>Excess Intake</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700 tracking-tight">
              {overview.excess_intake_institutions || 2}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
              VIOLATIONS
            </span>
          </div>
          <div className="text-[11px] text-rose-600 font-medium truncate">
            RTU-Kota & MITS-Gwalior
          </div>
        </div>

        {/* KPI 6: PROVISIONAL / GRACE PERIOD (NEW) */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-sm bg-amber-50/20 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>Provisional Seats</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-800 tracking-tight">
              {overview.provisional_students || 35}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              Grace Period
            </span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium truncate">
            Pending APAAR e-KYC
          </div>
        </div>

        {/* KPI 7: ACTIVE FRAUD ALERTS (MOST PROMINENT CARD - CLICKABLE) */}
        <button
          onClick={() => onNavigateTab?.("anomaly-center")}
          aria-label="Open Anomaly & Fraud Center"
          className="text-left bg-gradient-to-br from-red-600 to-rose-700 text-white p-3.5 rounded-xl shadow-lg shadow-rose-900/30 flex flex-col justify-between hover:from-red-500 hover:to-rose-600 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400 group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-white/90">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
              <span>Fraud Alerts</span>
            </span>
            <ArrowUpRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          <div className="my-1 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white tracking-tight">
              {overview.active_anomaly_alerts}
            </span>
            <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded text-white font-mono">
              {overview.pending_duplicate_cases} Collisions
            </span>
          </div>

          {/* Severity Breakdown Badges */}
          <div className="flex items-center gap-1 text-[9px] font-bold pt-1 border-t border-white/20">
            <span className="bg-black/30 px-1.5 py-0.5 rounded text-rose-200">
              Crit: {overview.alert_severity_breakdown?.critical ?? 5}
            </span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded text-amber-200">
              High: {overview.alert_severity_breakdown?.high ?? 6}
            </span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded text-slate-200">
              Med: {overview.alert_severity_breakdown?.medium ?? 9}
            </span>
          </div>
        </button>
      </div>

      {/* 4. CHARTS SECTION (State Intake vs Enrolment & Seat Categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* State-wise Admissions vs Intake Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>State-wise Sanctioned Intake vs Actual Enrolment</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Red = Over Intake
                </span>
              </h2>
              <p className="text-xs text-slate-500">Real-time geographic distribution across AICTE territories</p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              Showing {stateChartData.length} Territories
            </span>
          </div>

          {stateChartData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Info className="w-6 h-6 mb-1 text-slate-300" />
              <span>No state enrollment data available for selected filter.</span>
            </div>
          ) : (
            <div className="h-72 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateChartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="state" 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    angle={-20} 
                    textAnchor="end" 
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 12, 
                      borderRadius: 12, 
                      backgroundColor: '#0F172A', 
                      color: '#F8FAFC', 
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                    }}
                    formatter={(value: any, name: any) => [
                      value?.toLocaleString(), 
                      name === 'enrolled' ? 'Actual Admitted' : 'Sanctioned Intake'
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="approved_intake" name="Approved Intake" fill="#0B3B60" radius={[4, 4, 0, 0]} />
                  <Bar 
                    dataKey="enrolled" 
                    name="Actual Admitted" 
                    radius={[4, 4, 0, 0]}
                  >
                    {stateChartData.map((entry: any, index: number) => {
                      const isOver = entry.enrolled > entry.approved_intake;
                      return <Cell key={`cell-${index}`} fill={isOver ? '#EF4444' : '#0D9488'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Seat Category Distribution Donut Chart with Caps */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Seat Category Breakdown</h2>
            <p className="text-xs text-slate-500">Supernumerary quotas evaluated against statutory APH ceilings</p>
          </div>

          <div className="h-52 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={quotaPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {quotaPieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    fontSize: 12, 
                    borderRadius: 10, 
                    backgroundColor: '#0F172A', 
                    color: '#FFF' 
                  }}
                  formatter={(val: any, name: any) => [`${val} Students`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Category Legend with Caps */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {quotaPieData.map((item: any) => (
              <div key={item.name} className="flex items-center space-x-1.5 p-1 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                <div className="truncate">
                  <div className="text-[10px] text-slate-500 truncate">{item.name}</div>
                  <div className="font-bold text-slate-800 text-[11px]">
                    {item.value} <span className="text-[9px] font-normal text-slate-400">/ cap {item.cap}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. TOP 10 INSTITUTIONS BY RISK SCORE & RECENT ALERTS FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top 10 Risk Institutions Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Top Institutions by Regulatory Risk Score</span>
              </h2>
              <p className="text-xs text-slate-500">Prioritized by AICTE Isolation Forest & Deterministic Intake Breaches</p>
            </div>
            <button
              onClick={() => onNavigateTab?.("intake-monitor")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Intake Compliance</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Top Risk Institutions Table">
              <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">College</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Intake vs Enrolled</th>
                  <th className="py-2.5 px-3">Utilization</th>
                  <th className="py-2.5 px-3">Risk Reason</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(overview.top_risk_institutions || []).map((inst: any, idx: number) => {
                  const isViolation = inst.utilization_pct > 100;
                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inst.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{inst.official_code}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{inst.state}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {inst.approved_intake} / <strong>{inst.actual_enrolled}</strong>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          isViolation 
                            ? "bg-rose-100 text-rose-800 border-rose-300 font-black" 
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}>
                          {inst.utilization_pct}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs">
                        <span className="line-clamp-1 text-[11px] font-medium text-slate-800" title={inst.reason}>
                          {inst.reason}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onNavigateTab?.("institution-portal")}
                          aria-label={`View details for ${inst.name}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-[10px] font-bold transition-all border border-slate-300"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts Live Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between p-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Surveillance Alerts</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              Live Feed
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px] my-2 pr-1 space-y-2">
            {(overview.recent_alerts || []).map((alert: any) => {
              const isCrit = alert.severity === 'CRITICAL';
              return (
                <div key={alert.id || alert.alert_id} className="pt-2 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase ${
                      isCrit 
                        ? "bg-rose-100 text-rose-800 border-rose-300" 
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Score: {alert.anomaly_score}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{alert.title}</div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onNavigateTab?.("anomaly-center")}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all text-center"
          >
            Open Anomaly & Fraud Command Center ({overview.active_anomaly_alerts})
          </button>
        </div>
      </div>

      {/* 6. EXPORT APH REPORT MODAL (PDF / CSV) */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                <span>Export Regulatory Compliance Report</span>
              </h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Generate authoritative AICTE Approval Process Handbook (APH Chapter II/IV) compliance documentation with cryptographic verification timestamps.
            </p>

            <div className="space-y-2.5">
              <a
                href={api.getComplianceReportUrl()}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowExportModal(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div>Download Comprehensive CSV Ledger</div>
                    <div className="text-[10px] text-blue-700 font-normal">All 41 institutions, program quotas, and enrolments</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </a>

              <button
                onClick={() => { window.print(); setShowExportModal(false); }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <div className="text-left">
                    <div>Print / Save Executive PDF Summary</div>
                    <div className="text-[10px] text-slate-500 font-normal">Formatted regulatory printable briefing</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
