import React, { useRef, useState } from 'react';
import { DownloadCloud, UploadCloud, FileText, AlertTriangle, Check, X, RefreshCw, LogOut, CloudOff, Trash2, Cloud, FileSpreadsheet } from 'lucide-react';
import { todayStr } from '../utils';
import { Eyebrow, PrimaryButton, SecondaryButton, IconButton, SelectField } from './SharedUI';
import AuthForm, { SupabaseNotConfiguredNotice } from './Auth';
import { supabase } from '../supabaseClient';
import CourseImport from './CourseImport';

const AUTO_SAVE_OPTIONS = [
  { value: 0, label: 'No auto-save (manual only)' },
  { value: 5, label: 'Every 5 minutes' },
  { value: 10, label: 'Every 10 minutes' },
  { value: 20, label: 'Every 20 minutes' },
];

function timeAgo(date) {
  if (!date) return 'never';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(date).toLocaleDateString();
}

export default function DataManager({
  data, importData, importCourses, updateAccount, resetAllData,
  session, onSignedIn, userEmail, cloudStatus, cloudError, lastSyncedAt, syncNow, signOut,
}) {
  const [confirmResetAll, setConfirmResetAll] = useState(false);
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
        <div className="gt-serif" style={{ fontSize: 22, color: 'var(--c-ink-soft)' }}>Import &amp; Export</div>
        <div style={{ fontSize: 13, color: 'var(--c-text-faint)', marginTop: 4, maxWidth: 560 }}>
          Your gradebook lives in a single JSON file. Export it to back it up or move it to another device, or import a file to restore it.
        </div>
      </div>

      <div className="gt-card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '18px 10px', borderRadius: 10, background: 'var(--c-overlay-3)' }}>
              <div className="gt-mono" style={{ fontSize: 26, fontWeight: 700, color: 'var(--c-accent)' }}>{s.value}</div>
              <div className="gt-mono" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--c-text-faint)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="gt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: cloudStatus === 'error'
                ? 'color-mix(in srgb, var(--c-danger) 12%, transparent)'
                : 'color-mix(in srgb, var(--c-accent) 12%, transparent)',
            }}>
              {cloudStatus === 'error'
                ? <CloudOff size={19} color="var(--c-danger)" />
                : <Cloud size={19} color="var(--c-accent-dark)" />}
            </div>
            <div>
              <div className="gt-serif" style={{ fontSize: 17, color: 'var(--c-ink-soft)' }}>Cloud Save</div>
              <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)', marginTop: 3, maxWidth: 520 }}>
                {session
                  ? <>Signed in as <strong>{userEmail}</strong>. Changes always save instantly on this device; the setting below controls how often they're also backed up to your account.</>
                  : 'Totally optional — the gradebook works fully offline with just on-device saving. Sign in if you also want a cloud backup and to sync across devices.'}
              </div>
            </div>
          </div>
          {session && <SecondaryButton onClick={signOut} icon={LogOut}>Sign Out</SecondaryButton>}
        </div>

        {!supabase ? (
          <SupabaseNotConfiguredNotice />
        ) : !session ? (
          <AuthForm onSignedIn={onSignedIn} />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <SelectField
                label="Auto-save to cloud"
                value={data.account.autoSaveMinutes ?? 5}
                onChange={v => updateAccount({ autoSaveMinutes: Number(v) })}
                mono
                style={{ minWidth: 220 }}
              >
                {AUTO_SAVE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </SelectField>

              <PrimaryButton onClick={syncNow} icon={RefreshCw} disabled={cloudStatus === 'syncing'}>
                {cloudStatus === 'syncing' ? 'Syncing…' : 'Sync Now'}
              </PrimaryButton>

              <div className="gt-mono" style={{ fontSize: 11.5, color: 'var(--c-text-faint)', paddingBottom: 10 }}>
                Last synced: {timeAgo(lastSyncedAt)}
              </div>
            </div>

            {cloudStatus === 'error' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--c-danger) 8%, transparent)', color: 'var(--c-danger)', fontSize: 12.5 }}>
                <AlertTriangle size={15} /> {cloudError || 'Could not sync to Supabase.'}
              </div>
            )}
          </>
        )}
      </div>

      <div className="gt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'color-mix(in srgb, var(--c-accent) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileSpreadsheet size={19} color="var(--c-accent-dark)" />
          </div>
          <div>
            <div className="gt-serif" style={{ fontSize: 17, color: 'var(--c-ink-soft)' }}>Import Courses from CSV / Excel</div>
            <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)', marginTop: 3 }}>
              Bulk-add your course catalog from a spreadsheet instead of entering each one by hand.
            </div>
          </div>
        </div>
        <CourseImport importCourses={importCourses} />
      </div>

      <div className="gt-data-cols">
        <div className="gt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'color-mix(in srgb, var(--c-accent) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DownloadCloud size={19} color="var(--c-accent-dark)" />
            </div>
            <div>
              <div className="gt-serif" style={{ fontSize: 17, color: 'var(--c-ink-soft)' }}>Export All Data</div>
              <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)', marginTop: 3 }}>
                Downloads a JSON file with your account, terms, courses, schedule, grades, and assessments.
              </div>
            </div>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <PrimaryButton onClick={handleExport} icon={DownloadCloud}>Export JSON</PrimaryButton>
          </div>
        </div>

        <div className="gt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'color-mix(in srgb, var(--c-accent) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UploadCloud size={19} color="var(--c-accent-dark)" />
            </div>
            <div>
              <div className="gt-serif" style={{ fontSize: 17, color: 'var(--c-ink-soft)' }}>Import Data</div>
              <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)', marginTop: 3 }}>
                Restores from a previously exported JSON file. This replaces everything currently in your gradebook.
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
                borderRadius: 8, border: '1.5px solid var(--c-accent)', background: 'transparent', color: 'var(--c-accent-dark)',
                fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <FileText size={14}/> Choose File
            </button>
          </div>

          {importError && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--c-danger) 8%, transparent)', color: 'var(--c-danger)', fontSize: 12.5 }}>
              <AlertTriangle size={15} /> {importError}
            </div>
          )}

          {importedOk && !pendingImport && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--c-forest) 8%, transparent)', color: 'var(--c-forest)', fontSize: 12.5 }}>
              <Check size={15} /> Import complete — your gradebook has been restored.
            </div>
          )}

          {pendingImport && (
            <div style={{ padding: 14, borderRadius: 10, background: 'color-mix(in srgb, var(--c-danger) 6%, transparent)', border: '1.5px solid var(--c-danger-tint)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--c-danger)', fontWeight: 600, fontSize: 13 }}>
                <AlertTriangle size={15} /> Replace all current data?
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)', marginTop: 4 }}>
                This file has {(pendingImport.terms || []).length} term(s) and {(pendingImport.courses || []).length} course(s). Importing will overwrite everything you currently have — this cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={confirmImport}
                  className="gt-mono"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                    borderRadius: 8, border: 'none', background: 'var(--c-danger)', color: 'var(--c-surface)',
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

      <div>
        <Eyebrow>Danger Zone</Eyebrow>
        <div className="gt-serif" style={{ fontSize: 17, color: 'var(--c-ink-soft)', marginTop: 2 }}>Clear All Data</div>
        <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)', marginTop: 3, maxWidth: 560 }}>
          Permanently erases your profile, terms, courses, schedule, grades, and assessments on this device. This cannot be undone.
        </div>
      </div>
      <div className="gt-card" style={{ padding: 20, border: '1.5px solid var(--c-danger-tint)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        {confirmResetAll ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--c-danger)', fontWeight: 600 }}>Are you sure?</span>
            <IconButton icon={Check} onClick={() => { resetAllData(); setConfirmResetAll(false); }} title="Confirm" danger />
            <IconButton icon={X} onClick={() => setConfirmResetAll(false)} title="Cancel" />
          </div>
        ) : (
          <button onClick={() => setConfirmResetAll(true)} className="gt-mono gt-btn gt-btn-danger">
            <Trash2 size={14} /> Clear All Data
          </button>
        )}
      </div>
    </div>
  );
}