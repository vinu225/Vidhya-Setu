import React, { useState, useEffect } from 'react';
import { Shell, Head, Card, Kpi, Badge } from '../components/ui';
import { api, UserInfo } from '../services/api';

interface ComplaintReviewPortalProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const ComplaintReviewPortal: React.FC<ComplaintReviewPortalProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'FORWARDED' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Forward modal/form state
  const [forwardingTicketId, setForwardingTicketId] = useState<string | null>(null);
  const [targetCollege, setTargetCollege] = useState('Delhi Technological University (DTU-DELHI)');
  const [forwardingNotes, setForwardingNotes] = useState('Forwarded for immediate institutional record review and document re-verification.');
  
  // Resolve modal/form state
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('Academic record verified against DTU council repository. Credential seal valid.');
  
  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = () => {
    const list = api.getStudentComplaints();
    // Ensure all sample complaints have candidate info if missing
    const enriched = list.map((c: any) => ({
      ...c,
      student_name: c.student_name || 'Rahul Sharma',
      student_apaar: c.student_apaar || '9821-4567-8901',
      institution_name: c.institution_name || 'Delhi Technological University (DTU-DELHI)'
    }));
    setComplaints(enriched);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleForwardToInstitute = (ticketId: string) => {
    if (!targetCollege.trim()) {
      alert('Please select or specify the target institution.');
      return;
    }
    const officerName = user?.username === 'verifier' 
      ? 'Corporate Recruiter (Verifier Console)' 
      : (user?.username === 'aicte_admin' ? 'AICTE National Bureau' : 'Review Officer');

    api.forwardComplaintToInstitution(ticketId, targetCollege, forwardingNotes, officerName);
    loadComplaints();
    setForwardingTicketId(null);
    showToast(`✓ Ticket ${ticketId} has been successfully forwarded to ${targetCollege} Registrar Console.`);
  };

  const handleResolveTicket = (ticketId: string) => {
    if (!resolutionRemarks.trim()) {
      alert('Please provide resolution remarks.');
      return;
    }
    const officerName = user?.username === 'verifier' 
      ? 'Authorized Verifier (Corporate Recruiter)' 
      : (user?.username === 'aicte_admin' ? 'AICTE National Bureau' : 'Institutional Admin');

    api.resolveStudentComplaint(ticketId, resolutionRemarks, officerName);
    loadComplaints();
    setResolvingTicketId(null);
    showToast(`✓ Ticket ${ticketId} marked as RESOLVED and cryptographically sealed.`);
  };

  // KPIs
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'FORWARDED_TO_INSTITUTE').length;
  const forwardedCount = complaints.filter(c => c.status === 'FORWARDED_TO_INSTITUTE').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;

  // Filtered List
  const filteredComplaints = complaints.filter(c => {
    if (statusFilter === 'PENDING' && (c.status === 'RESOLVED' || c.status === 'FORWARDED_TO_INSTITUTE')) return false;
    if (statusFilter === 'FORWARDED' && c.status !== 'FORWARDED_TO_INSTITUTE') return false;
    if (statusFilter === 'RESOLVED' && c.status !== 'RESOLVED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = c.id?.toLowerCase().includes(q);
      const matchSub = c.subject?.toLowerCase().includes(q);
      const matchName = c.student_name?.toLowerCase().includes(q);
      const matchApaar = c.student_apaar?.toLowerCase().includes(q);
      const matchCollege = c.institution_name?.toLowerCase().includes(q);
      if (!matchId && !matchSub && !matchName && !matchApaar && !matchCollege) return false;
    }

    return true;
  });

  const isVerifier = user?.role === 'EXTERNAL_VERIFIER';
  const isInstitution = user?.role === 'INSTITUTION_ADMIN';

  const portalEyebrow = isVerifier
    ? 'EMPLOYER DISPUTE REDRESSAL & VERIFICATION DESK'
    : (isInstitution ? 'INSTITUTION STUDENT GRIEVANCE DESK' : 'AICTE NATIONAL GRIEVANCE BUREAU');

  const portalTitle = isVerifier
    ? 'Candidate Disputes & Complaints Review'
    : (isInstitution ? 'Student Grievance Inbox & Inquiries' : 'National Student Grievance Oversight');

  const portalSubtitle = isVerifier
    ? 'Review student verification disputes, inspect credentials, resolve directly with candidate, or forward to the college console for institutional verification.'
    : 'Review complaints lodged by students or forwarded by verifiers and regulators for DTU action.';

  return (
    <Shell
      active="complaints-review"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
      headerTitle={portalTitle}
      headerEyebrow={portalEyebrow}
    >
      <Head
        eyebrow={portalEyebrow}
        title={portalTitle}
        sub={portalSubtitle}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn pri"
            onClick={loadComplaints}
            title="Refresh complaint queue"
          >
            ↻ Refresh Queue
          </button>
        </div>
      </Head>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            color: '#15803D',
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid" style={{ marginBottom: 20 }}>
        <Kpi label="Total Tickets in Queue" value={totalCount} note="Complaints under jurisdiction" />
        <Kpi label="Pending Review" value={pendingCount} note="Action required" />
        <Kpi label="Forwarded to Institute" value={forwardedCount} note="Awaiting college registrar" />
        <Kpi label="Resolved & Sealed" value={resolvedCount} note="100% Ed25519 sealed" />
      </div>

      {/* Filters and Search Bar */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${statusFilter === 'ALL' ? 'pri' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All Complaints ({totalCount})
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'PENDING' ? 'pri' : ''}`}
              onClick={() => setStatusFilter('PENDING')}
            >
              Pending Review ({pendingCount})
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'FORWARDED' ? 'pri' : ''}`}
              onClick={() => setStatusFilter('FORWARDED')}
            >
              Forwarded to Institute ({forwardedCount})
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'RESOLVED' ? 'pri' : ''}`}
              onClick={() => setStatusFilter('RESOLVED')}
            >
              Resolved & Sealed ({resolvedCount})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ minWidth: 260 }}>
            <input
              type="text"
              placeholder="Search by Ticket ID, Student, or APAAR..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '7px 12px', fontSize: 12 }}
            />
          </div>
        </div>
      </Card>

      {/* Complaints List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredComplaints.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No complaints found matching current filters.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>All student inquiries in this category have been processed.</div>
            </div>
          </Card>
        ) : (
          filteredComplaints.map(complaint => {
            const isResolved = complaint.status === 'RESOLVED';
            const isForwarded = complaint.status === 'FORWARDED_TO_INSTITUTE';
            const isForwardModalOpen = forwardingTicketId === complaint.id;
            const isResolveModalOpen = resolvingTicketId === complaint.id;

            return (
              <Card key={complaint.id} style={{ borderLeft: isResolved ? '4px solid #16A34A' : (isForwarded ? '4px solid #0284C7' : '4px solid #D97706') }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
                        {complaint.id}
                      </span>
                      <span style={{ fontSize: 11, background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                        {complaint.category_label || complaint.category}
                      </span>
                      <Badge
                        tone={complaint.priority === 'HIGH' || complaint.priority === 'CRITICAL' ? 'red' : 'sky'}
                      >
                        {complaint.priority} PRIORITY
                      </Badge>
                    </div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                      {complaint.subject}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isResolved && <Badge tone="green">✓ RESOLVED & SEALED</Badge>}
                    {isForwarded && <Badge tone="sky">📤 FORWARDED TO INSTITUTE</Badge>}
                    {!isResolved && !isForwarded && <Badge tone="amber">⏱ PENDING ACTION</Badge>}
                  </div>
                </div>

                {/* Candidate & Institution Meta */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    background: '#F8FAFC',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    marginBottom: 14,
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Candidate / Student</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{complaint.student_name}</span>
                    <span style={{ color: '#0284C7', fontFamily: 'monospace', marginLeft: 6 }}>({complaint.student_apaar})</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Enrolled Institution</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{complaint.institution_name}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Target Redressal Authority</span>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{complaint.target_authority}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Lodged Timestamp</span>
                    <span style={{ color: '#475569' }}>{complaint.submitted_at}</span>
                  </div>
                </div>

                {/* Student's Statement */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                    Student Statement / Discrepancy Query
                  </div>
                  <div style={{ padding: '10px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, color: '#1E293B', lineHeight: 1.5 }}>
                    "{complaint.description}"
                  </div>
                </div>

                {/* Timeline / Audit Progress */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                    Redressal Audit Trail & Timeline
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8, borderLeft: '2px solid #E2E8F0' }}>
                    {complaint.timeline?.map((step: any, i: number) => (
                      <div key={i} style={{ fontSize: 11, display: 'flex', gap: 8, alignItems: 'baseline' }}>
                        <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{step.step}</span>
                        <span style={{ color: '#94A3B8', fontSize: 10 }}>({step.time})</span>
                        <span style={{ color: '#64748B' }}>— {step.note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Official Remarks */}
                {complaint.college_remarks && (
                  <div style={{ padding: '8px 12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 6, fontSize: 12, color: '#0369A1', marginBottom: 14 }}>
                    <strong>Latest Official Note:</strong> {complaint.college_remarks}
                  </div>
                )}

                {/* Interactive Action Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    paddingTop: 12,
                    borderTop: '1px solid #E2E8F0',
                    flexWrap: 'wrap'
                  }}
                >
                  {!isResolved && (
                    <>
                      {/* Button to Open Forward Form */}
                      <button
                        type="button"
                        onClick={() => {
                          setForwardingTicketId(isForwardModalOpen ? null : complaint.id);
                          setResolvingTicketId(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 14px',
                          background: isForwardModalOpen ? '#0284C7' : '#F0F9FF',
                          color: isForwardModalOpen ? '#fff' : '#0369A1',
                          border: '1px solid #BAE6FD',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <span>📤</span>
                        <span>{isForwardModalOpen ? 'Cancel Forward' : 'Forward to Institute Console'}</span>
                      </button>

                      {/* Button to Open Resolve Form */}
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingTicketId(isResolveModalOpen ? null : complaint.id);
                          setForwardingTicketId(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 14px',
                          background: isResolveModalOpen ? '#16A34A' : '#F0FDF4',
                          color: isResolveModalOpen ? '#fff' : '#15803D',
                          border: '1px solid #BBF7D0',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <span>✅</span>
                        <span>{isResolveModalOpen ? 'Cancel Resolve' : 'Resolve & Seal Record'}</span>
                      </button>
                    </>
                  )}

                  {isResolved && (
                    <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🛡️</span>
                      <span>Dispute fully resolved and logged to DPDP Act 2023 Tamper-Proof Audit Vault.</span>
                    </div>
                  )}
                </div>

                {/* Inline Forwarding Form */}
                {isForwardModalOpen && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      background: '#F8FAFC',
                      border: '1.5px solid #0284C7',
                      borderRadius: 8
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                      Forward Complaint {complaint.id} to Institution Console
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Target Institution Console
                        </label>
                        <select
                          value={targetCollege}
                          onChange={e => setTargetCollege(e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: 12, background: '#fff' }}
                        >
                          <option value="Delhi Technological University (DTU-DELHI)">Delhi Technological University (DTU-DELHI)</option>
                          <option value="Kamla Nehru Institute of Technology (KNIT)">Kamla Nehru Institute of Technology (KNIT)</option>
                          <option value="National Institute of Technology Karnataka (NITK)">NIT Karnataka (NITK)</option>
                          <option value="College of Engineering Pune (COEP)">College of Engineering Pune (COEP)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Forwarding Memo & Action Required from College Registrar
                        </label>
                        <input
                          type="text"
                          value={forwardingNotes}
                          onChange={e => setForwardingNotes(e.target.value)}
                          placeholder="Specify requirements from the college registrar desk..."
                          style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setForwardingTicketId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn pri"
                        onClick={() => handleForwardToInstitute(complaint.id)}
                      >
                        📤 Dispatch to College Console
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Resolving Form */}
                {isResolveModalOpen && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      background: '#F0FDF4',
                      border: '1.5px solid #16A34A',
                      borderRadius: 8
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                      Resolve & Cryptographically Seal Complaint {complaint.id}
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Official Resolution Statement (Visible to Student & Audit Vault)
                      </label>
                      <textarea
                        rows={2}
                        value={resolutionRemarks}
                        onChange={e => setResolutionRemarks(e.target.value)}
                        placeholder="Detail how this discrepancy was validated and cleared..."
                        style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #CBD5E1' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setResolvingTicketId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '7px 16px',
                          background: '#16A34A',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleResolveTicket(complaint.id)}
                      >
                        ✅ Seal & Complete Resolution
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </Shell>
  );
};
