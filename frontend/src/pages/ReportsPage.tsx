import React from 'react';
import { api } from '../services/api';
import { FileText, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Regulatory Reports & Accreditation Export Hub</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Export tamper-evident, structured CSV compliance audit reports formatted for NIRF, NBA, and AICTE Approval Process Handbook (APH) audits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Report 1: National Regulatory Compliance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">
            APH 2024–27 Regulatory Compliance & Intake Audit Report
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Detailed breakdown of approved regular intake, actual admissions, utilization percentage, and supernumerary caps (TFW 5%, EWS 10%, NRI 5%, FN/OCI 15%) across all technical institutions.
          </p>
          <a
            href={api.getComplianceReportUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Compliance CSV</span>
          </a>
        </div>

        {/* Report 2: Complete Enrolment Roster */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">
            National Student Enrolment Master Roster
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Exhaustive student-level verified admissions audit log with masked APAAR identifiers, cryptographic SHA-256 tamper seals, and admission timestamps for NIRF verification.
          </p>
          <a
            href={api.getEnrolmentReportUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Master Enrolment CSV</span>
          </a>
        </div>
      </div>
    </div>
  );
};
