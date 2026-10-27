import React, { useState, useEffect } from 'react';
import { api, UserInfo } from '../services/api';
import { 
  UploadCloud, FileSpreadsheet, Download, CheckCircle2, 
  AlertTriangle, RefreshCw, X, ArrowRight, FileText 
} from 'lucide-react';

interface BulkUploadWizardProps {
  user: UserInfo | null;
  onNavigateTab: (tab: string) => void;
}

export const BulkUploadWizard: React.FC<BulkUploadWizardProps> = ({ user, onNavigateTab }) => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedInst, setSelectedInst] = useState(user?.institution_id || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchInsts = async () => {
      try {
        const data = await api.getInstitutions();
        setInstitutions(data);
        if (!selectedInst && data.length > 0) {
          setSelectedInst(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load institutions", err);
      }
    };
    fetchInsts();
  }, [selectedInst]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg("");
      setUploadResult(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a valid .csv or .xlsx file.");
      return;
    }
    if (!selectedInst) {
      setErrorMsg("Please select a valid institution.");
      return;
    }

    try {
      setUploading(true);
      setErrorMsg("");
      const res = await api.uploadStudentsFile(selectedInst, file);
      setUploadResult(res);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Helper to trigger sample CSV downloads
  const downloadSampleCsv = (withAnomalies: boolean = false) => {
    let csvContent = "apaar_id,student_id,name,program_code,seat_category,supernumerary_classification,academic_year,admission_date\n";
    if (withAnomalies) {
      // Row 1: Valid
      csvContent += "984210573915,24/CSE/901,Karan Johar,CSE-BTECH,REGULAR,NONE,2024-25,2024-08-01\n";
      // Row 2: Invalid Checksum
      csvContent += "111222333444,24/CSE/902,Bad Checksum Student,CSE-BTECH,REGULAR,NONE,2024-25,2024-08-01\n";
      // Row 3: Missing APAAR
      csvContent += ",24/CSE/903,Missing APAAR Student,CSE-BTECH,REGULAR,NONE,2024-25,2024-08-01\n";
      // Row 4: Duplicate collision candidate
      csvContent += "883920194835,24/CSE/904,Sameer Verma Duplicate,CSE-BTECH,REGULAR,NONE,2024-25,2024-08-01\n";
    } else {
      csvContent += "984210573915,24/CSE/701,Rohan Kulkarni,CSE-BTECH,REGULAR,NONE,2024-25,2024-08-01\n";
      csvContent += "384910293847,24/CSE/702,Tanvi Deshmukh,CSE-BTECH,TFW,TFW,2024-25,2024-08-01\n";
      csvContent += "748392019284,24/CSE/703,Ananya Pillai,CSE-BTECH,EWS,EWS,2024-25,2024-08-01\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", withAnomalies ? "sample_with_anomalies.csv" : "sample_students_valid.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <span>Bulk Student Data Ingestion Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated batch ingestion pipeline with Verhoeff parity mathematical audit, schema integrity checks, and immediate duplicate detection.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => downloadSampleCsv(false)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-300"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Valid Sample CSV</span>
          </button>
          <button
            onClick={() => downloadSampleCsv(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-amber-300"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Anomaly Test CSV</span>
          </button>
        </div>
      </div>

      {/* Main Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Institution
              </label>
              <select
                value={selectedInst}
                onChange={(e) => setSelectedInst(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {institutions.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.official_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700 mb-1">
                Choose CSV or Excel Spreadsheet (.csv, .xlsx)
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Maximum file size: 15MB. Formatted with mandatory headers: apaar_id, student_id, name, program_code.
              </p>
              <input
                type="file"
                accept=".csv, .xlsx"
                onChange={handleFileChange}
                className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
              {file && (
                <div className="mt-3 text-xs font-medium text-blue-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || !file}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-2 disabled:opacity-50 transition-all"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing & Validating Batch...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Ingest Into AICTE Gateway</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Upload Instruction Guide */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm">Mandatory Schema Norms</h3>
          <ul className="space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li><strong className="text-slate-800">apaar_id</strong>: 12 digits, validated against national Verhoeff parity algorithm.</li>
            <li><strong className="text-slate-800">student_id</strong>: Institutional roll number (e.g. 24/CSE/001).</li>
            <li><strong className="text-slate-800">name</strong>: Full legal name matching DigiLocker / ABC account.</li>
            <li><strong className="text-slate-800">program_code</strong>: Valid approved AICTE program code under this institution.</li>
            <li><strong className="text-slate-800">supernumerary_classification</strong>: NONE, TFW, EWS, NRI, FN_OCI, PMSSS.</li>
          </ul>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-800 text-[11px] leading-relaxed">
            💡 <strong>Smart Fraud Check:</strong> The gateway performs immediate cross-institution lookup. If any student is already actively admitted in another college, a critical collision alert will be generated automatically.
          </div>
        </div>
      </div>

      {/* Upload Results Summary Card */}
      {uploadResult && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-800">
                Batch Processing Completed: {uploadResult.file_name}
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">ID: {uploadResult.id}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500">Total Rows</span>
              <div className="text-xl font-bold text-slate-800 mt-1">{uploadResult.total_rows}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-700">Successfully Ingested</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{uploadResult.successful_rows}</div>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
              <span className="text-xs text-rose-700">Validation Failures</span>
              <div className="text-xl font-bold text-rose-700 mt-1">{uploadResult.failed_rows}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col justify-center items-start">
              {uploadResult.failed_rows > 0 ? (
                <a
                  href={api.getUploadErrorsDownloadUrl(uploadResult.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error CSV</span>
                </a>
              ) : (
                <span className="text-xs text-emerald-700 font-semibold">✓ 100% Clean Ingestion</span>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              onClick={() => onNavigateTab("student-registry")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <span>View Admitted Students in Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
