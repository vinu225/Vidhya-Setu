import React, { useState } from 'react';
import { Shell, Head, Card, Kpi, Badge, Table } from '../components/ui';
import { api, UserInfo } from '../services/api';

interface StudentSchemesProps {
  user?: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const StudentSchemes: React.FC<StudentSchemesProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [activeTab, setActiveTab] = useState<'scholarships' | 'internships' | 'credits'>('scholarships');
  const data = api.getStudentSchemes();

  return (
    <Shell
      active="student-schemes"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="Government of India & AICTE Portals"
        title="Scholarships, Internships & Flagship Schemes"
        sub="Track your verified central scholarships, national internship applications, and Academic Bank of Credits (ABC) mobility."
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`btn ${activeTab === 'scholarships' ? 'pri' : ''}`}
            onClick={() => setActiveTab('scholarships')}
          >
            Scholarships & Aid ({data.scholarships.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'internships' ? 'pri' : ''}`}
            onClick={() => setActiveTab('internships')}
          >
            Govt Internships ({data.internships.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'credits' ? 'pri' : ''}`}
            onClick={() => setActiveTab('credits')}
          >
            ABC Credit Bank ({data.academicCredits.length})
          </button>
        </div>
      </Head>

      {/* KPI Overview Grid */}
      <div className="grid">
        <Kpi
          label="Active Applications"
          value={data.kpis.activeApplications}
          note={<span style={{ color: '#1D4ED8' }}>Ongoing Evaluations</span>}
        />
        <Kpi
          label="Sanctioned Financial Aid"
          value={data.kpis.sanctionedAmount}
          note="Direct Benefit Transfer (DBT)"
        />
        <Kpi
          label="Academic Bank of Credits"
          value={data.kpis.creditsEarned}
          note="Verified under NEP 2020"
        />
        <Kpi
          label="College Endorsement"
          value="DTU Verified ✓"
          note={<span style={{ color: '#0F766E' }}>Nodal Officer Sign-off</span>}
        />
      </div>

      {/* SUBTAB 1: SCHOLARSHIPS */}
      {activeTab === 'scholarships' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {data.scholarships.map(sch => (
              <Card key={sch.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="mono" style={{ fontSize: 11, background: '#E2E8F0', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                        {sch.id}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                        {sch.scheme_type} • Academic Year {sch.academic_year}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B2545', margin: '6px 0 2px' }}>
                      {sch.name}
                    </h3>
                    <div style={{ fontSize: 13, color: '#0F766E', fontWeight: 600 }}>
                      Financial Grant: {sch.amount}
                    </div>
                  </div>

                  <Badge tone={sch.status_tone as any}>
                    {sch.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 16,
                    padding: 12,
                    background: '#F8FAFC',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    fontSize: 12
                  }}
                >
                  <div>
                    <span style={{ color: '#64748B', display: 'block' }}>Application Submitted</span>
                    <span className="mono" style={{ fontWeight: 600, color: '#1E293B' }}>{sch.applied_on}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block' }}>Direct Benefit Transfer (DBT)</span>
                    <span style={{ fontWeight: 600, color: '#0B2545' }}>{sch.dbt_status}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block' }}>PFMS Transaction Ref</span>
                    <span className="mono" style={{ fontSize: 11, color: '#475569' }}>{sch.transaction_ref}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block' }}>College Nodal Status</span>
                    <span style={{ fontWeight: 600, color: '#0F766E' }}>{sch.college_verification.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Access Card for External Portals */}
          <Card title="AICTE Central Scholarship Direct Gateways" style={{ marginTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, background: '#fff' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0B2545' }}>National Scholarship Portal (NSP)</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Apply for fresh central merit-cum-means and minority quotas with APAAR.</div>
                <a href="https://scholarships.gov.in" target="_blank" rel="noreferrer" className="btn" style={{ display: 'inline-block', marginTop: 10, fontSize: 11 }}>
                  Open NSP Portal ↗
                </a>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, background: '#fff' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0B2545' }}>AICTE Pragati & Saksham Bureau</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Special grant for female students and differently-abled engineering scholars.</div>
                <a href="https://www.aicte-india.org/schemes/students-development-schemes" target="_blank" rel="noreferrer" className="btn" style={{ display: 'inline-block', marginTop: 10, fontSize: 11 }}>
                  AICTE Schemes Guidelines ↗
                </a>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* SUBTAB 2: INTERNSHIPS */}
      {activeTab === 'internships' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          {data.internships.map(intern => (
            <Card key={intern.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono" style={{ fontSize: 11, background: '#E2E8F0', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                      {intern.id}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                      {intern.portal} • {intern.duration}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B2545', margin: '6px 0 2px' }}>
                    {intern.role}
                  </h3>
                  <div style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 600 }}>
                    {intern.organization}
                  </div>
                </div>

                <Badge tone={intern.status_tone as any}>
                  {intern.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  marginTop: 16,
                  padding: 12,
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  fontSize: 12
                }}
              >
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Monthly Stipend</span>
                  <span style={{ fontWeight: 600, color: '#0B2545' }}>{intern.stipend}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Date Applied</span>
                  <span className="mono" style={{ fontWeight: 600, color: '#1E293B' }}>{intern.applied_on}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Status & Next Milestone</span>
                  <span style={{ fontWeight: 600, color: '#0F766E' }}>{intern.next_step}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Authorized Mentor / Bureau</span>
                  <span style={{ color: '#334155' }}>{intern.mentor}</span>
                </div>
              </div>
            </Card>
          ))}

          <Card title="Official Government Internship Gateways">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, background: '#fff' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0B2545' }}>AICTE National Internship Portal</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Access verified opportunities across Urban Local Bodies, Ministries, and Fortune 500s.</div>
                <a href="https://internship.aicte-india.org" target="_blank" rel="noreferrer" className="btn" style={{ display: 'inline-block', marginTop: 10, fontSize: 11 }}>
                  Explore Opportunities ↗
                </a>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, background: '#fff' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0B2545' }}>PM Internship Scheme (PMIS)</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>National 1-Crore Youth corporate internship initiative with monthly government stipend.</div>
                <a href="https://pminternship.mca.gov.in" target="_blank" rel="noreferrer" className="btn" style={{ display: 'inline-block', marginTop: 10, fontSize: 11 }}>
                  PMIS Portal ↗
                </a>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SUBTAB 3: ACADEMIC CREDITS */}
      {activeTab === 'credits' && (
        <Card title="Academic Bank of Credits (ABC) Mobility Ledger" style={{ marginTop: 20 }}>
          <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>
            Under the <b>National Education Policy (NEP 2020)</b>, online courses completed via approved platforms (SWAYAM, NPTEL, NEAT) are seamlessly credited to your APAAR record.
          </p>

          <Table
            head={['Course Title', 'Platform / Faculty', 'Credits', 'Grade Achieved', 'Institution Endorsement', 'Tamper Proof Hash']}
            rows={data.academicCredits.map(c => [
              <span key="title" style={{ fontWeight: 600, color: '#0B2545' }}>{c.course_title}</span>,
              <span key="plat" style={{ fontSize: 12, color: '#475569' }}>{c.platform}</span>,
              <Badge key="cred" tone="sky">{c.credits} Credits</Badge>,
              <span key="grade" style={{ fontWeight: 600, color: '#0F766E' }}>{c.grade}</span>,
              <Badge key="status" tone="green">{c.approval_status.replace(/_/g, ' ')}</Badge>,
              <span key="hash" className="mono" style={{ fontSize: 11, color: '#64748B' }}>{c.tamper_hash}</span>
            ])}
          />
        </Card>
      )}
    </Shell>
  );
};

export default StudentSchemes;
