import React, { useRef, useState } from 'react';
import { DownloadCloud, UploadCloud, FileText, AlertTriangle, Check, X } from 'lucide-react';
import { todayStr } from '../utils';
import { Eyebrow, PrimaryButton, IconButton } from './SharedUI';

export default function DataManager({ data, importData }) {
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState('');
  const [pendingImport, setPendingImport] = useState(null);
  const [importedOk, setImportedOk] = useState(false);

  const gradeEntryCount = Object.values(data.grades || {}).reduce(
    (sum, byCourse) => sum + Object.keys(byCourse || {}).length, 0
  );
  const assessmentCount = Object.values(data.assessments || {}).reduce(
    (sum, byCourse) => sum + Object.values(byCourse || {}).reduce((s, list) => s + (list || []).length, 0), 0
  );

  const stats = [
    { label: 'Terms', value: data.terms.length },
    { label: 'Courses', value: data.courses.length },
    { label: 'Schedule Entries', value: data.schedule.length },
    { label: 'Grade Entries', value: gradeEntryCount },
    { label: 'Assessments', value: assessmentCount },
  ];

  function handleExport() {
    const payload = { exportedAt: new Date().toISOString(), appVersion: 1, data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const namePart = [data.account.firstName, data.account.lastName]
      .filter(Boolean).join('-').toLowerCase().replace(/\s+/g, '-');
    a.href = url;
    a.download = `gradebook-backup${namePart ? '-' + namePart : ''}-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImportError('');
    setImportedOk(false);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const payload = parsed && typeof parsed === 'object' && parsed.data ? parsed.data : parsed;
        if (!payload || typeof payload !== 'object' || !('account' in payload) || !('terms' in payload) || !('courses' in payload)) {
          throw new Error('This file does not look like a Gradebook backup.');
        }
        setPendingImport(payload);
      } catch (err) {
        setImportError(err.message || 'Could not read that file. Make sure it is a valid Gradebook JSON export.');
        setPendingImport(null);
      }
    };
    reader.onerror = () => setImportError('Could not read that file.');
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    if (!pendingImport) return;
    importData(pendingImport);
    setPendingImport(null);
    setImportedOk(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      <div>
        <Eyebrow>Data Manager</Eyebrow>
        <div className="gt-serif" style={{ fontSize: 22, color: '#2A2E28' }}>Import &amp; Export</div>
        <div style={{ fontSize: 13, color: '#8A8A7E', marginTop: 4, maxWidth: 560 }}>
          Your gradebook lives in a single JSON file. Export it to back it up or move it to another device, or import a file to restore it.
        </div>
      </div>

      <div className="gt-card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '18px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.03)' }}>
              <div className="gt-mono" style={{ fontSize: 26, fontWeight: 700, color: '#2D5240' }}>{s.value}</div>
              <div className="gt-mono" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A8A7E', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="gt-data-cols">
        <div className="gt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(45,82,64,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DownloadCloud size={19} color="#2D5240" />
            </div>
            <div>
              <div className="gt-serif" style={{ fontSize: 17, color: '#2A2E28' }}>Export All Data</div>
              <div style={{ fontSize: 12.5, color: '#8A8A7E', marginTop: 3 }}>
                Downloads a JSON file with your account, terms, courses, schedule, grades, and assessments.
              </div>
            </div>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <PrimaryButton onClick={handleExport} icon={DownloadCloud}>Export JSON</PrimaryButton>
          </div>
        </div>

        <div className="gt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(59,91,169,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UploadCloud size={19} color="#3B5BA9" />
              </div>
              <div>
                <div className="gt-serif" style={{ fontSize: 17, color: '#2A2E28' }}>Import Data</div>
                <div style={{ fontSize: 12.5, color: '#8A8A7E', marginTop: 3 }}>
                  Restores from a previously exported JSON file. This replaces everything currently in your gradebook.
                </div>
              </div>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFileChange} style={{ display: 'none' }} />
          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="gt-mono"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                borderRadius: 8, border: '1.5px solid #3B5BA9', background: 'transparent', color: '#3B5BA9',
                fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <FileText size={14} /> Choose File
            </button>
          </div>

          {importError && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'rgba(178,58,46,0.08)', color: '#B23A2E', fontSize: 12.5 }}>
              <AlertTriangle size={15} /> {importError}
            </div>
          )}

          {importedOk && !pendingImport && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'rgba(45,82,64,0.08)', color: '#2D5240', fontSize: 12.5 }}>
              <Check size={15} /> Import complete — your gradebook has been restored.
            </div>
          )}

          {pendingImport && (
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(178,58,46,0.06)', border: '1.5px solid #E3B8B0' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#B23A2E', fontWeight: 600, fontSize: 13 }}>
                <AlertTriangle size={15} /> Replace all current data?
              </div>
              <div style={{ fontSize: 12.5, color: '#8A8A7E', marginTop: 4 }}>
                This file has {(pendingImport.terms || []).length} term(s) and {(pendingImport.courses || []).length} course(s). Importing will overwrite everything you currently have — this cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={confirmImport}
                  className="gt-mono"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                    borderRadius: 8, border: 'none', background: '#B23A2E', color: '#FCFBF7',
                    fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
                  }}
                >
                  <Check size={13} /> Replace Data
                </button>
                <IconButton icon={X} onClick={() => setPendingImport(null)} title="Cancel" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}