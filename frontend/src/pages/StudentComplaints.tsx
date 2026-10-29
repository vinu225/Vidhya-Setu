import React, { useState } from 'react';
import { Shell, Head, Card, Kpi, Badge, Table } from '../components/ui';
import { api, UserInfo } from '../services/api';

interface StudentComplaintsProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const StudentComplaints: React.FC<StudentComplaintsProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [view, setView] = useState<'list' | 'new'>('list');
  const [complaints, setComplaints] = useState<any[]>(api.getStudentComplaints());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState('SCHOLARSHIP_VERIFICATION');
  const [targetAuthority, setTargetAuthority] = useState('College Grievance Redressal Committee (CGRC - DTU)');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  const categories = [
    { value: 'SCHOLARSHIP_VERIFICATION', label: 'Delay in College Scholarship Verification' },
    { value: 'APAAR_DATA_CORRECTION', label: 'APAAR ID / Verhoeff Checksum Discrepancy' },
    { value: 'QUOTA_CORRECTION', label: 'Incorrect Enrolment Quota (TFW / EWS / Supernumerary)' },
    { value: 'CERTIFICATE_WITHHOLDING', label: 'Withholding of Marksheets / Migration Certificates' },
    { value: 'DUPLICATE_COLLISION', label: 'Cross-Institution Duplicate Misidentification' },
    { value: 'GENERAL_INQUIRY', label: 'Other College Admission Inquiry' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    if (!consentChecked) {
      alert('Please confirm the DPDP verification declaration.');
      return;
    }

    const selectedCat = categories.find(c => c.value === category)?.label || category;
    const newTicket = api.submitStudentComplaint({
      category,
      category_label: selectedCat,
      subject,
      target_authority: targetAuthority,
      priority,
      description
    });

    setComplaints([newTicket, ...complaints]);
    setSuccessMessage(`Grievance lodged successfully! Your Tracking ID is ${newTicket.id}. It has been forwarded to ${targetAuthority}.`);
    
    // Reset Form
    setSubject('');
    setDescription('');
    setFileName('');
    setConsentChecked(false);
    setView('list');

    setTimeout(() => setSuccessMessage(null), 6000);
  };

  return (
    <Shell
      active="student-complaints"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="College & Council Redressal Desk"
        title="Student Grievance & Complaint Portal"
        sub="Lodge inquiries or dispute discrepancies with your college administration and track resolution timelines."
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`btn ${view === 'list' ? 'pri' : ''}`}
            onClick={() => setView('list')}
          >
            My Complaints ({complaints.length})
          </button>
          <button
            type="button"
            className={`btn ${view === 'new' ? 'pri' : ''}`}
            onClick={() => setView('new')}
          >
            + Raise New Concern
          </button>
        </div>
      </Head>

      {successMessage && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '14px 18px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
          ✓ {successMessage}
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid">
        <Kpi
          label="Total Concerns Raised"
          value={complaints.length}
          note="Official Council Tickets"
        />
        <Kpi
          label="Under Review by DTU"
          value={complaints.filter(c => c.status === 'UNDER_VERIFICATION' || c.status === 'SUBMITTED').length}
          note={<span style={{ color: '#D97706' }}>In Progress</span>}
        />
        <Kpi
          label="Resolved & Verified"
          value={complaints.filter(c => c.status === 'RESOLVED').length}
          note={<span style={{ color: '#0F766E' }}>Closed with Remarks</span>}
        />
        <Kpi
          label="Average Resolution SLA"
          value="48 Hours"
          note="College Redressal Standard"
        />
      </div>

      {/* VIEW 1: MY COMPLAINTS LIST */}
      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          {complaints.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                <h3>No Grievances Lodged</h3>
                <p style={{ fontSize: 13, maxWidth: 400, margin: '8px auto 16px' }}>
                  If you notice discrepancies in your APAAR enrollment, scholarship verification, or seat quota, raise a concern below.
                </p>
                <button type="button" className="btn pri" onClick={() => setView('new')}>
                  Raise New Concern
                </button>
              </div>
            </Card>
          ) : (
            complaints.map(item => (
              <Card key={item.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: '#0B2545', background: '#E2E8F0', padding: '2px 8px', borderRadius: 4 }}>
                        {item.id}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                        {item.category_label || item.category}
                      </span>
                      <Badge tone={item.priority === 'HIGH' ? 'red' : item.priority === 'URGENT' ? 'amber' : 'sky'}>
                        {item.priority} PRIORITY
                      </Badge>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B2545', margin: '8px 0 4px' }}>
                      {item.subject}
                    </h3>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      Target Authority: <b>{item.target_authority}</b> • Submitted: <span className="mono">{item.submitted_at}</span>
                    </div>
                  </div>

                  <Badge tone={item.status_tone || (item.status === 'RESOLVED' ? 'green' : 'amber')}>
                    {item.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Complaint Description */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 8, marginTop: 14, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                  {item.description}
                </div>

                {/* Interactive Status Timeline */}
                <div style={{ marginTop: 16, borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>Investigation & Audit Progress:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {item.timeline?.map((step: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}>
                        <span style={{ color: '#0F766E', fontWeight: 'bold' }}>✓</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, color: '#0B2545' }}>{step.step}</span>
                          <span className="mono" style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>({step.time})</span>
                          <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{step.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* College Response Box */}
                {item.college_remarks && (
                  <div style={{ marginTop: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: '#1D4ED8', display: 'block', marginBottom: 2 }}>Official Institutional Action Note:</span>
                    <span style={{ color: '#1E3A8A' }}>{item.college_remarks}</span>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: RAISE NEW COMPLAINT FORM */}
      {view === 'new' && (
        <Card title="Lodge an Official Concern / Inquiry" style={{ marginTop: 20 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="split">
              <label className="field">
                <span>Concern Category</span>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Target Authority</span>
                <select
                  value={targetAuthority}
                  onChange={e => setTargetAuthority(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                >
                  <option value="College Grievance Redressal Committee (CGRC - DTU)">
                    College Grievance Redressal Committee (CGRC - DTU)
                  </option>
                  <option value="DTU Registrar Admissions Desk">
                    DTU Registrar Admissions Desk
                  </option>
                  <option value="AICTE Regulation Bureau & HQ Support">
                    AICTE Regulation Bureau & HQ Support (Escalation)
                  </option>
                  <option value="State Directorate of Technical Education">
                    State Directorate of Technical Education
                  </option>
                </select>
              </label>
            </div>

            <div className="split">
              <label className="field">
                <span>Subject / Short Summary</span>
                <input
                  type="text"
                  placeholder="e.g. Scholarship verification delayed by college desk"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                />
              </label>

              <label className="field">
                <span>Priority Level</span>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                >
                  <option value="NORMAL">Normal (48hr SLA)</option>
                  <option value="HIGH">High (Urgent College Admission / Scholarship deadline)</option>
                  <option value="URGENT">Critical (Legal / Council Document Withholding)</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Detailed Description of Concern</span>
              <textarea
                rows={4}
                placeholder="Provide specific details including course code, application number, or discrepancy observed..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}
              />
            </label>

            {/* Document Uploader */}
            <div style={{ border: '1px dashed #CBD5E1', borderRadius: 8, padding: 16, background: '#F8FAFC' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0B2545' }}>Supporting Documentation (Optional)</div>
              <div style={{ fontSize: 12, color: '#64748B', margin: '4px 0 10px' }}>
                Attach fee receipts, admission letters, or marks certificates (PDF, PNG up to 5MB).
              </div>
              <input
                type="file"
                onChange={e => setFileName(e.target.files?.[0]?.name || '')}
                style={{ fontSize: 12 }}
              />
              {fileName && (
                <div style={{ fontSize: 12, color: '#0F766E', marginTop: 6 }}>
                  ✓ Selected file: <b>{fileName}</b>
                </div>
              )}
            </div>

            {/* Declaration */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                required
              />
              <span>
                I confirm that the facts submitted are true, and I consent to the institutional review of my APAAR credentials for resolving this complaint.
              </span>
            </label>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn pri" style={{ padding: '8px 24px' }}>
                Submit Concern to Authority
              </button>
              <button type="button" className="btn" onClick={() => setView('list')}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}
    </Shell>
  );
};

export default StudentComplaints;
