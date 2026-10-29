import React, { useState, useEffect, useRef } from 'react';
import { Shell, Head, Card, Kpi, Badge, Table, Skeleton, ErrorState } from '../components/ui';
import { api, UserInfo, Institution, UploadBatch, UploadRowResult } from '../services/api';

interface BulkUploadWizardProps {
  user: UserInfo | null;
  onNavigateTab?: (tab: string) => void;
  onLogout?: () => void;
  onSwitchPersona?: (username: string) => void;
}

export const BulkUploadWizard: React.FC<BulkUploadWizardProps> = ({
  user,
  onNavigateTab,
  onLogout,
  onSwitchPersona
}) => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInst, setSelectedInst] = useState(user?.institution_id || '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [batchResult, setBatchResult] = useState<UploadBatch | null>(null);
  const [rowResults, setRowResults] = useState<UploadRowResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchInsts = async () => {
      try {
        const data = await api.getInstitutions();
        setInstitutions(data);
        if (!selectedInst && data.length > 0) {
          setSelectedInst(user?.institution_id || data[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load institutions list', err);
      }
    };
    fetchInsts();
  }, [user]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      setErrorMsg('Invalid file format. Please upload a .csv or .xlsx spreadsheet.');
      return;
    }
    setFile(selectedFile);
    setErrorMsg('');
    setBatchResult(null);
    setRowResults([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }
    if (!selectedInst) {
      setErrorMsg('Please select target institution.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');
      const res = await api.uploadStudentsFile(selectedInst, file);
      setBatchResult(res);

      // Fetch row-level validation issues
      if (res.id) {
        try {
          const results = await api.getUploadBatchResults(res.id);
          setRowResults(results);
        } catch (fetchErr) {
          console.warn('Could not retrieve row results:', fetchErr);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'File processing failed. Please verify column headers.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'apaar_id,student_id,name,program_code,seat_category,supernumerary_classification,academic_year,admission_date\n' +
      '984210573915,24/CSE/001,Aarav Sharma,CSE-101,REGULAR,NONE,2024-25,2024-08-01\n' +
      '883920194835,24/ECE/042,Isha Verma,ECE-101,REGULAR,TFW,2024-25,2024-08-01\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aicte_student_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadErrorCsv = async () => {
    if (!batchResult) return;
    try {
      await api.downloadErrorCsv(batchResult.id);
    } catch (err: any) {
      alert(`Download error: ${err.message}`);
    }
  };

  const errorRows = rowResults
    .filter(r => r.status === 'ERROR')
    .map(r => [
      <span className="mono">{r.row_number}</span>,
      <span className="mono">APAAR / Intake</span>,
      <span>{r.error_message || 'Verification failure'}</span>,
      <Badge tone="red">Error</Badge>
    ]);

  return (
    <Shell
      active="upload"
      user={user}
      onNavigate={onNavigateTab}
      onLogout={onLogout}
      onSwitchPersona={onSwitchPersona}
    >
      <Head
        eyebrow="Data entry"
        title="Bulk upload"
        sub="Import student enrolment rosters from CSV or Excel with automated Verhoeff and quota cap validation."
      >
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="btn"
        >
          Download template
        </button>
      </Head>

      {errorMsg && <ErrorState error={errorMsg} />}

      <Card>
        {/* Step Indicators */}
        <div className="row" style={{ marginBottom: 20 }}>
          <Badge tone={file ? 'green' : 'sky'}>1 Select file</Badge>
          <Badge tone={uploading ? 'amber' : batchResult ? 'green' : 'sky'}>2 Process batch</Badge>
          <Badge tone={batchResult ? 'green' : 'sky'}>3 Validation report</Badge>
        </div>

        {/* Institution Target Selector */}
        {user?.role === 'AICTE_ADMIN' && institutions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label className="field">
              <span>Target Institution</span>
              <select
                value={selectedInst}
                onChange={e => setSelectedInst(e.target.value)}
                style={{ maxWidth: 360 }}
              >
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.official_code})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          className="drop"
          onDragOver={e => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            borderColor: isDragOver ? 'var(--blue)' : file ? '#047857' : '#94A3B8',
            background: isDragOver ? '#EFF6FF' : file ? '#F0FDF4' : '#fff'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => e.target.files && handleFileSelect(e.target.files[0])}
            accept=".csv,.xlsx"
            style={{ display: 'none' }}
          />

          <h2>{file ? file.name : 'Drag and drop your file here'}</h2>
          <p className="sub">
            {file ? `${(file.size / 1024).toFixed(1)} KB • Ready to submit` : '.csv, .xlsx up to 15 MB'}
          </p>

          <div className="row" style={{ justifyContent: 'center', marginTop: 14, gap: 10 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn"
              disabled={uploading}
            >
              {file ? 'Change file' : 'Choose file'}
            </button>

            {file && (
              <button
                type="button"
                onClick={handleUploadSubmit}
                className="btn pri"
                disabled={uploading}
              >
                {uploading ? 'Validating records...' : 'Submit & Ingest'}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Batch Ingestion Results KPIs */}
      {batchResult && (
        <>
          <div className="grid" style={{ marginTop: 16 }}>
            <Kpi
              label="Valid rows"
              value={batchResult.successful_rows.toLocaleString('en-IN')}
              note={<Badge tone="green">Ingested</Badge>}
            />
            <Kpi
              label="Errors"
              value={batchResult.failed_rows.toLocaleString('en-IN')}
              note={
                batchResult.failed_rows > 0 ? (
                  <Badge tone="red">Rejected</Badge>
                ) : (
                  <Badge tone="green">0 Errors</Badge>
                )
              }
            />
            <Kpi
              label="Total processed"
              value={batchResult.total_rows.toLocaleString('en-IN')}
              note={<span className="sub">Batch ID: {batchResult.id.slice(0, 8)}</span>}
            />
          </div>

          {batchResult.failed_rows > 0 && (
            <Card title="Row-level issues" style={{ marginTop: 16 }}>
              {errorRows.length > 0 ? (
                <Table
                  head={['Row', 'Field', 'Issue', 'Level']}
                  rows={errorRows}
                />
              ) : (
                <p className="sub">
                  Validation issues recorded during processing. Check detailed error log below.
                </p>
              )}

              <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={handleDownloadErrorCsv}
                  className="btn"
                >
                  Download error CSV
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('registry')}
                  className="btn pri"
                >
                  View in Student Registry
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </Shell>
  );
};

export default BulkUploadWizard;
