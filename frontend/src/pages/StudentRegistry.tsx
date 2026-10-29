import React, { useEffect, useState } from 'react';
import { Shell, Head, Card, Badge, Table, Skeleton, ErrorState, EmptyState } from '../components/ui';
import { api, UserInfo, Student, Institution, Program } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

interface StudentRegistryProps {
  user?: UserInfo | null;
  piiMasked?: boolean;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const StudentRegistry: React.FC<StudentRegistryProps> = ({
  user,
  piiMasked = true,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInst, setSelectedInst] = useState(user?.institution_id || '');
  const [selectedProg, setSelectedProg] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // View / Credential Modal
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Add Record Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApaar, setNewApaar] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newName, setNewName] = useState('');
  const [newInst, setNewInst] = useState(user?.institution_id || '');
  const [newProg, setNewProg] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newSupernumerary, setNewSupernumerary] = useState('NONE');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initial load: institutions & programs
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [insts, progs] = await Promise.all([
          api.getInstitutions(),
          api.getPrograms(user?.institution_id || undefined)
        ]);
        setInstitutions(insts);
        setPrograms(progs);
        if (user?.institution_id) {
          setSelectedInst(user.institution_id);
          setNewInst(user.institution_id);
        }
      } catch (err: any) {
        console.error('Failed to load institutions metadata', err);
      }
    };
    loadMetadata();
  }, [user]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getStudents({
        institution_id: selectedInst || undefined,
        program_id: selectedProg || undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchTerm.trim() || undefined,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE
      });
      setStudents(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      console.error('Failed to load students', err);
      setError(err.message || 'Error loading student registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedInst, selectedProg, selectedStatus, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStudents();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!newApaar || !newRoll || !newName || !newInst || !newProg) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      await api.admitStudent({
        institution_id: newInst,
        program_id: newProg,
        apaar_id: newApaar.replace(/\s+/g, ''),
        student_id: newRoll,
        name: newName,
        category: newCategory,
        seat_category: newSupernumerary === 'NONE' ? 'REGULAR' : newSupernumerary,
        supernumerary_classification: newSupernumerary,
        admission_date: new Date().toISOString().split('T')[0]
      });

      setSuccessMsg('Student admitted and registered successfully!');
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
        setNewApaar('');
        setNewRoll('');
        setNewName('');
        loadStudents();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Validation failed. Check Verhoeff checksum or program cap.');
    } finally {
      setSubmitting(false);
    }
  };

  const canAddRecord =
    user?.role === 'AICTE_ADMIN' ||
    user?.role === 'INSTITUTION_ADMIN' ||
    user?.role === 'DATA_ENTRY_OFFICER';

  // Format table rows matching design
  const tableRows = students.map(s => {
    const enr = s.current_enrolment;
    const isProvisional = enr?.enrolment_status === 'PROVISIONAL';
    const isSuspended = enr?.enrolment_status === 'SUSPENDED';

    const statusBadge = isSuspended ? (
      <Badge tone="red">Flagged</Badge>
    ) : isProvisional ? (
      <Badge tone="amber">Pending</Badge>
    ) : (
      <Badge tone="green">Verified</Badge>
    );

    return [
      <span>
        <strong>{s.name}</strong>
        <span className="mono" style={{ display: 'block', fontSize: 11, color: '#64748B' }}>
          Roll: {s.student_id}
        </span>
      </span>,
      <span className="mono">{s.apaar_id_masked}</span>,
      <span>{enr?.institution_name || '—'}</span>,
      <span>
        {enr?.program_name || '—'}
        {enr?.supernumerary_classification && enr.supernumerary_classification !== 'NONE' && (
          <span className="badge sky" style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px' }}>
            {enr.supernumerary_classification}
          </span>
        )}
      </span>,
      statusBadge,
      <button
        type="button"
        onClick={() => setActiveStudent(s)}
        className="btn"
        style={{ padding: '4px 10px', fontSize: 12 }}
      >
        View
      </button>
    ];
  });

  const startRecord = (page - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(page * PAGE_SIZE, totalCount);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <Shell
      active="registry"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="Student data"
        title="Student registry"
        sub="Search and review verified student records with cryptographic audit hashes."
      >
        {canAddRecord && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn pri"
          >
            Add record
          </button>
        )}
      </Head>

      {error && <ErrorState error={error} onRetry={loadStudents} />}

      <Card>
        {/* Search & Filter Controls */}
        <form onSubmit={handleSearchSubmit} className="row" style={{ marginBottom: 16, gap: 10 }}>
          <input
            type="text"
            placeholder="Search name, APAAR ID, roll number"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 240 }}
          />

          {user?.role !== 'INSTITUTION_ADMIN' && user?.role !== 'DATA_ENTRY_OFFICER' && (
            <select
              value={selectedInst}
              onChange={e => {
                setSelectedInst(e.target.value);
                setPage(1);
              }}
              style={{ maxWidth: 220 }}
            >
              <option value="">All institutions</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Any status</option>
            <option value="ACTIVE">Verified (Active)</option>
            <option value="PROVISIONAL">Pending (Provisional)</option>
            <option value="SUSPENDED">Flagged (Suspended)</option>
          </select>

          <button type="submit" className="btn">
            Filter
          </button>
        </form>

        {/* Data Table */}
        {loading && students.length === 0 ? (
          <div style={{ display: 'grid', gap: 8, padding: 16 }}>
            <Skeleton height={36} />
            <Skeleton height={36} />
            <Skeleton height={36} />
            <Skeleton height={36} />
          </div>
        ) : (
          <Table
            head={['Student', 'APAAR ID', 'Institution', 'Course', 'Status', '']}
            rows={tableRows}
          />
        )}

        {/* Pagination Controls */}
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 16, borderTop: '1px solid var(--mist)', paddingTop: 12 }}>
          <span className="sub">
            Showing {totalCount > 0 ? `${startRecord}–${endRecord}` : '0'} of {totalCount.toLocaleString('en-IN')}
          </span>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: 13, alignSelf: 'center', color: 'var(--slate)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* Inspect Student Modal */}
      {activeStudent && (
        <div style={{ position: 'fixed', inset: 0, background: '#0f172a80', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 20px 25px -5px #00000040' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2>{activeStudent.name}</h2>
                <div className="mono" style={{ fontSize: 13, color: 'var(--slate)' }}>
                  APAAR: {activeStudent.apaar_id_masked}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStudent(null)}
                className="btn"
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            <ul className="list" style={{ borderTop: '1px solid var(--mist)', borderBottom: '1px solid var(--mist)', padding: '16px 0', marginBottom: 16 }}>
              <li>
                <span>Institution</span>
                <strong>{activeStudent.current_enrolment?.institution_name || '—'}</strong>
              </li>
              <li>
                <span>Program</span>
                <span>{activeStudent.current_enrolment?.program_name || '—'}</span>
              </li>
              <li>
                <span>Roll / Student ID</span>
                <span className="mono">{activeStudent.student_id}</span>
              </li>
              <li>
                <span>Seat Category</span>
                <span>{activeStudent.current_enrolment?.seat_category || 'REGULAR'}</span>
              </li>
              <li>
                <span>Tamper Hash</span>
                <span className="mono" style={{ fontSize: 11 }}>
                  {activeStudent.current_enrolment?.tamper_hash?.slice(0, 16)}…
                </span>
              </li>
              <li>
                <span>Regulatory Status</span>
                <Badge tone={activeStudent.current_enrolment?.enrolment_status === 'ACTIVE' ? 'green' : 'amber'}>
                  {activeStudent.current_enrolment?.enrolment_status || 'ACTIVE'}
                </Badge>
              </li>
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setActiveStudent(null)}
                className="btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Record Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#0f172a80', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 20px 25px -5px #00000040' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Add Student Admission</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn"
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="badge red" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
                ✕ {formError}
              </div>
            )}
            {successMsg && (
              <div className="badge green" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gap: 12 }}>
              <label className="field">
                <span>12-Digit APAAR ID</span>
                <input
                  type="text"
                  placeholder="e.g. 984210573915"
                  className="mono"
                  value={newApaar}
                  onChange={e => setNewApaar(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Student Full Name</span>
                <input
                  type="text"
                  placeholder="Official Aadhaar matched name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Institutional Roll Number</span>
                <input
                  type="text"
                  placeholder="e.g. 24/CSE/089"
                  className="mono"
                  value={newRoll}
                  onChange={e => setNewRoll(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Institution</span>
                <select
                  value={newInst}
                  onChange={e => {
                    setNewInst(e.target.value);
                    api.getPrograms(e.target.value).then(setPrograms);
                  }}
                  disabled={user?.role === 'INSTITUTION_ADMIN' || user?.role === 'DATA_ENTRY_OFFICER'}
                  required
                >
                  <option value="">Select Institution</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Academic Program</span>
                <select
                  value={newProg}
                  onChange={e => setNewProg(e.target.value)}
                  required
                >
                  <option value="">Select Approved Program</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.program_name} ({p.program_code})
                    </option>
                  ))}
                </select>
              </label>

              <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn pri"
                  disabled={submitting}
                >
                  {submitting ? 'Validating...' : 'Validate & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
};

export default StudentRegistry;
