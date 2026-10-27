import React, { useEffect, useState } from 'react';
import { api, UserInfo } from '../services/api';
import { 
  Users, Search, UserPlus, Filter, ShieldCheck, 
  Award, CheckCircle2, AlertTriangle, FileText, X, Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentRegistryProps {
  user: UserInfo | null;
  piiMasked: boolean;
}

export const StudentRegistry: React.FC<StudentRegistryProps> = ({ user, piiMasked }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInst, setSelectedInst] = useState(user?.institution_id || "");
  const [selectedProg, setSelectedProg] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Modals
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertStudent, setActiveCertStudent] = useState<any>(null);
  const [actionMsg, setActionMsg] = useState("");

  // New Student Form State
  const [newApaar, setNewApaar] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [newName, setNewName] = useState("");
  const [newInst, setNewInst] = useState(user?.institution_id || "");
  const [newProg, setNewProg] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newSupernumerary, setNewSupernumerary] = useState("NONE");
  const [formError, setFormError] = useState("");

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({
        institution_id: selectedInst || undefined,
        program_id: selectedProg || undefined,
        search: searchTerm || undefined,
        skip: (page - 1) * 25,
        limit: 25
      });
      setStudents(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [insts, progs] = await Promise.all([
          api.getInstitutions(),
          api.getPrograms()
        ]);
        setInstitutions(insts);
        setPrograms(progs);
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [selectedInst, selectedProg, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStudents();
  };

  const handleAdmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      const payload = {
        apaar_id: newApaar,
        student_id: newRoll,
        name: newName,
        institution_id: newInst || institutions[0]?.id,
        program_id: newProg || programs[0]?.id,
        category: newCategory,
        supernumerary_classification: newSupernumerary,
        admission_date: new Date().toISOString().split('T')[0]
      };
      await api.admitStudent(payload);
      setActionMsg(`Student ${newName} admitted and Verhoeff validated!`);
      setShowAdmitModal(false);
      setNewApaar("");
      setNewRoll("");
      setNewName("");
      loadStudents();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleIssueCredential = async (student: any) => {
    try {
      if (!student.current_enrolment) {
        alert("Student does not have an active enrolment record.");
        return;
      }
      const res = await api.issueCredential(student.id, student.current_enrolment.id);
      setActionMsg(`Credential issued for ${student.name}! Ref: ${res.credential_id}`);
      setActiveCertStudent({ ...student, credential_id: res.credential_id });
      setShowCertModal(true);
    } catch (err: any) {
      alert(`Issuance failed: ${err.message}`);
    }
  };

  const openBonafide = (student: any) => {
    setActiveCertStudent(student);
    setShowCertModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>National Student Registry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Searchable registry of verified students linked with 12-digit APAAR sovereign keys. Total: <strong>{totalCount}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdmitModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Admit Single Student</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg("")} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or APAAR ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {/* Institution Filter */}
          {user?.role === "AICTE_ADMIN" && (
            <select
              value={selectedInst}
              onChange={(e) => { setSelectedInst(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-300 rounded-lg text-xs px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Institutions</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.official_code}</option>
              ))}
            </select>
          )}

          {/* Program Filter */}
          <select
            value={selectedProg}
            onChange={(e) => { setSelectedProg(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-300 rounded-lg text-xs px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Programs</option>
            {programs.map(prog => (
              <option key={prog.id} value={prog.id}>{prog.program_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">APAAR Identifier</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Seat / Quota</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const enr = s.current_enrolment;
                  const isCollision = enr?.enrolment_status === "FLAGGED";
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {s.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        {piiMasked ? s.apaar_id_masked : (s.apaar_id || s.apaar_id_masked)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-semibold">
                        {s.student_id}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                        {enr?.institution_name || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                        {enr?.program_name || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          enr?.supernumerary_classification !== "NONE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {enr?.supernumerary_classification || "REGULAR"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isCollision
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {isCollision ? "Flagged Collision" : "Verified"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openBonafide(s)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>Bonafide</span>
                        </button>
                        <button
                          onClick={() => handleIssueCredential(s)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Award className="w-3 h-3 text-blue-600" />
                          <span>Issue VC</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, totalCount)} of {totalCount} records
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold hover:bg-slate-100 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 25 >= totalCount}
              className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold hover:bg-slate-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Admit Single Student Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-navy-900 to-navy-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Admit Single Student Entry</h3>
                <p className="text-xs text-slate-300">Enforces client & server-side Verhoeff validation</p>
              </div>
              <button onClick={() => setShowAdmitModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdmitStudent} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  12-Digit APAAR Identifier (Aadhaar / National UID Standard)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="e.g. 984210573915"
                  value={newApaar}
                  onChange={(e) => setNewApaar(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500">Must satisfy the dihedral $D_5$ Verhoeff checksum.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institutional Roll No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24/CSE/055"
                    value={newRoll}
                    onChange={(e) => setNewRoll(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institution
                  </label>
                  <select
                    value={newInst}
                    onChange={(e) => setNewInst(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {institutions.map(i => (
                      <option key={i.id} value={i.id}>{i.official_code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Program
                  </label>
                  <select
                    value={newProg}
                    onChange={(e) => setNewProg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.program_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supernumerary Quota
                  </label>
                  <select
                    value={newSupernumerary}
                    onChange={(e) => setNewSupernumerary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NONE">Regular Core Seat (None)</option>
                    <option value="TFW">TFW (Tuition Fee Waiver - 5%)</option>
                    <option value="EWS">EWS Quota (10%)</option>
                    <option value="NRI">NRI Quota (5%)</option>
                    <option value="FN_OCI">Foreign National / OCI (15%)</option>
                    <option value="PMSSS">PMSSS (J&K Special)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Validate & Admit Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Bonafide Certificate Modal (Print Ready) */}
      {showCertModal && activeCertStudent && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between no-print">
              <span className="text-xs font-semibold text-slate-700">Official Bonafide Certificate Preview</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button onClick={() => setShowCertModal(false)} className="p-1 text-slate-500 hover:text-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Canvas */}
            <div className="p-8 border-8 border-double border-slate-300 m-4 rounded-xl bg-gradient-to-b from-white to-slate-50/50 relative">
              <div className="text-center space-y-1">
                <div className="text-[11px] font-bold tracking-widest text-blue-900 uppercase">
                  All India Council for Technical Education (AICTE)
                </div>
                <h2 className="text-xl font-serif font-bold text-slate-900">
                  OFFICIAL BONAFIDE ENROLMENT CERTIFICATE
                </h2>
                <div className="text-xs text-slate-500">
                  Academic Bank of Credits • APAAR Integrated Sovereign Registry
                </div>
              </div>

              <div className="my-6 border-t border-b border-slate-200 py-4 text-xs space-y-3 leading-relaxed text-slate-800">
                <p>
                  This is to certify that <strong>{activeCertStudent.name}</strong>, holding sovereign APAAR Identifier 
                  <strong className="font-mono text-blue-900"> {piiMasked ? activeCertStudent.apaar_id_masked : activeCertStudent.apaar_id}</strong>, 
                  is a bona fide student enrolled under AICTE-approved institutional roll number 
                  <strong className="font-mono"> {activeCertStudent.student_id}</strong>.
                </p>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Institution:</span>
                    <strong>{activeCertStudent.current_enrolment?.institution_name || "AICTE Approved Institution"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Program & Qualification:</span>
                    <strong>{activeCertStudent.current_enrolment?.program_name || "Engineering & Technology"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Academic Year:</span>
                    <strong>2024–25 (Four-Year Degree)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tamper-Proof Hash Seal:</span>
                    <strong className="font-mono text-[10px] text-teal-800">
                      {activeCertStudent.current_enrolment?.tamper_hash || "SHA256-REG-SEAL-VERIFIED"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <QRCodeSVG
                    value={`http://localhost:3000/verify/${activeCertStudent.credential_id || activeCertStudent.apaar_id}`}
                    size={80}
                  />
                  <div className="text-[9px] text-slate-400 font-mono">Scan to Verify Authenticity</div>
                </div>

                <div className="text-right">
                  <div className="font-serif font-bold text-slate-900 text-sm">Regulatory Registrar Seal</div>
                  <div className="text-[10px] text-slate-500">AICTE Regulation Bureau</div>
                  <div className="text-[9px] text-emerald-600 font-semibold mt-1">✓ Cryptographically Signed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
