import React, { useState } from 'react';
import { Trash2, Plus, Check, X, ChevronUp, ChevronDown, Sparkles, CalendarRange, Pencil } from 'lucide-react';
import { getCurrentTerm, uid, generateTerms, formatDate, termDurationDays, MAPUA_PROGRAMS } from '../utils';
import { Eyebrow, TextField, PrimaryButton, IconButton, EmptyState } from './SharedUI';

export default function AccountSettings({ data, updateAccount, addTerm, updateTerm, deleteTerm, clearAllTerms, resetAllData }) {
  const currentTerm = getCurrentTerm(data.terms);
  const blankTerm = { name: '', startDate: '', endDate: '' };
  const [termForm, setTermForm] = useState(blankTerm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(blankTerm);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [showPreset, setShowPreset] = useState(false);
  const [preset, setPreset] = useState({ startDate: '', years: 4, termsPerYear: 2 });
  const [confirmClearGrades, setConfirmClearGrades] = useState(false);
  const [confirmClearTerms, setConfirmClearTerms] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const canAddTerm = termForm.name.trim() && termForm.startDate && termForm.endDate;
  const canGeneratePreset = !!preset.startDate;

  function submitTerm() {
    if (!canAddTerm) return;
    addTerm({ ...termForm, id: uid() });
    setTermForm(blankTerm);
  }

  function generatePreset() {
    if (!canGeneratePreset) return;
    const generated = generateTerms({ startDate: preset.startDate, years: Number(preset.years), termsPerYear: Number(preset.termsPerYear) });
    generated.forEach(t => addTerm(t));
    setShowPreset(false);
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({ ...t });
  }

  function saveEdit() {
    updateTerm(editForm.id, editForm);
    setEditingId(null);
  }

  const gradeTable = data.account.gradeTable || [];
  function addGradeRow() {
    updateAccount({ gradeTable: [...gradeTable, { id: uid(), low: '', high: '', grade: '' }] });
  }
  function updateGradeRow(id, patch) {
    updateAccount({ gradeTable: gradeTable.map(r => r.id === id ? { ...r, ...patch } : r) });
  }
  function deleteGradeRow(id) {
    updateAccount({ gradeTable: gradeTable.filter(r => r.id !== id) });
  }
  function clearGradeTable() {
    updateAccount({ gradeTable: [] });
    setConfirmClearGrades(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div style={{ flex: 2, minWidth: 320, display: 'flex', flexDirection: 'column' }}>
          <Eyebrow>Account Settings</Eyebrow>
          <h1 className="gt-serif gt-page-title" style={{ fontSize: 30, margin: '4px 0 18px', color: 'var(--c-forest-dark)' }}>Your Info</h1>
          <div className="gt-card" style={{ padding: 18, display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
            <TextField label="Student ID" value={data.account.studentId} onChange={v => updateAccount({ studentId: v })} placeholder="2023-00123" mono />
            <TextField label="First Name" value={data.account.firstName} onChange={v => updateAccount({ firstName: v })} placeholder="Juan" />
            <TextField label="Middle Name" value={data.account.middleName} onChange={v => updateAccount({ middleName: v })} placeholder="Santos" />
            <TextField label="Last Name" value={data.account.lastName} onChange={v => updateAccount({ lastName: v })} placeholder="Dela Cruz" />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 140 }}>
              <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600 }}>Gender</span>
              <select
                value={data.account.gender || ''}
                onChange={e => updateAccount({ gender: e.target.value })}
                style={{ padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--c-border-strong)', fontSize: 14, background: 'var(--c-surface)', color: 'var(--c-ink-soft)' }}
              >
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <TextField label="Birthday" type="date" value={data.account.birthday} onChange={v => updateAccount({ birthday: v })} mono />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flexBasis: '100%', width: '100%' }}>
              <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600 }}>Program</span>
              <select
                value={data.account.program || ''}
                onChange={e => updateAccount({ program: e.target.value })}
                style={{ padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--c-border-strong)', fontSize: 14, background: 'var(--c-surface)', color: 'var(--c-ink-soft)' }}
              >
                <option value="">None</option>
                {MAPUA_PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column' }}>
          <Eyebrow>Ambition</Eyebrow>
          <h1 className="gt-serif gt-page-title" style={{ fontSize: 30, margin: '4px 0 18px', color: 'var(--c-forest-dark)' }}>GWA</h1>
          <div className="gt-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            <TextField
              label={`Target GWA (${(data.account.gradingSystem || 'highest-1') === 'highest-1' ? '1.00 best' : '5.00 best'})`}
              value={data.account.goalGWA || ''}
              onChange={v => updateAccount({ goalGWA: v.replace(/[^0-9.]/g, '') })}
              placeholder="1.75"
              mono
            />
            <TextField
              label="Total Units Required to Graduate"
              value={data.account.requiredUnits || ''}
              onChange={v => updateAccount({ requiredUnits: v.replace(/[^0-9.]/g, '') })}
              placeholder="e.g. 144"
              mono
            />
          </div>
        </div>
      </div>

      <div>
        <Eyebrow>Grading</Eyebrow>
        <div className="gt-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 320 }}>
            <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600 }}>Grading System</span>
            <select
              value={data.account.gradingSystem || 'highest-1'}
              onChange={e => updateAccount({ gradingSystem: e.target.value })}
              style={{ padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--c-border-strong)', fontSize: 14, background: 'var(--c-surface)', color: 'var(--c-ink-soft)' }}
            >
              <option value="highest-1">1.00 is the highest grade</option>
              <option value="highest-5">5.00 is the highest grade</option>
            </select>
          </label>

          <div>
            <div className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600, marginBottom: 8 }}>
              Grade Conversion Table
            </div>
            {gradeTable.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--c-text-placeholder)', marginBottom: 10 }}>No conversion rows yet — add one below (e.g. 80.00–84.99% → 1.75).</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
                <div className="gt-mono" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600, minWidth: 366 }}>
                  <span style={{ width: 90, textAlign: 'center' }}>Lowest %</span>
                  <span style={{ width: 14 }} />
                  <span style={{ width: 90, textAlign: 'center' }}>Highest %</span>
                  <span style={{ width: 16 }} />
                  <span style={{ width: 90, textAlign: 'center' }}>Final Grade</span>
                </div>
                {gradeTable.map(row => (
                  <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 366 }}>
                    <input
                      type="text" inputMode="decimal" value={row.low} placeholder="80.00"
                      onChange={e => updateGradeRow(row.id, { low: e.target.value.replace(/[^0-9.]/g, '') })}
                      className="gt-mono" style={{ width: 90, padding: '8px 10px', borderRadius: 7, border: '1.5px solid var(--c-border-strong)', fontSize: 13, textAlign: 'center', background: 'var(--c-surface)', color: 'var(--c-ink-soft)' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--c-text-faint)' }}>–</span>
                    <input
                      type="text" inputMode="decimal" value={row.high} placeholder="84.99"
                      onChange={e => updateGradeRow(row.id, { high: e.target.value.replace(/[^0-9.]/g, '') })}
                      className="gt-mono" style={{ width: 90, padding: '8px 10px', borderRadius: 7, border: '1.5px solid var(--c-border-strong)', fontSize: 13, textAlign: 'center', background: 'var(--c-surface)', color: 'var(--c-ink-soft)' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--c-text-faint)' }}>=</span>
                    <input
                      type="text" inputMode="decimal" value={row.grade} placeholder="1.75"
                      onChange={e => updateGradeRow(row.id, { grade: e.target.value.replace(/[^0-9.]/g, '') })}
                      className="gt-mono" style={{ width: 90, padding: '8px 10px', borderRadius: 7, border: '1.5px solid var(--c-border-strong)', fontSize: 13, textAlign: 'center', background: 'var(--c-surface)', color: 'var(--c-ink-soft)' }}
                    />
                    <IconButton icon={Trash2} onClick={() => deleteGradeRow(row.id)} title="Remove row" danger />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <PrimaryButton onClick={addGradeRow} icon={Plus} style={{ background: 'transparent', border: '1.5px dashed var(--c-text-disabled)', color: 'var(--c-text)' }}>Add Row</PrimaryButton>
              {gradeTable.length > 0 && (
                confirmClearGrades ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--c-danger)' }}>Clear all rows?</span>
                    <IconButton icon={Check} onClick={clearGradeTable} title="Confirm" danger />
                    <IconButton icon={X} onClick={() => setConfirmClearGrades(false)} title="Cancel" />
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearGrades(true)}
                    className="gt-mono"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                      borderRadius: 8, border: '1.5px solid var(--c-border)', background: 'transparent',
                      color: 'var(--c-danger)', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> Clear All
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Eyebrow>Term Management</Eyebrow>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
          {data.terms.length > 0 && (
            confirmClearTerms ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: 'var(--c-danger)' }}>Clear all terms?</span>
                <IconButton icon={Check} onClick={() => { clearAllTerms(); setConfirmClearTerms(false); }} title="Confirm" danger />
                <IconButton icon={X} onClick={() => setConfirmClearTerms(false)} title="Cancel" />
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearTerms(true)}
                className="gt-mono"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 8, border: '1.5px solid var(--c-border)', background: 'transparent',
                  color: 'var(--c-danger)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Clear All
              </button>
            )
          )}
          <button
            onClick={() => setShowPreset(s => !s)}
            className="gt-mono"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8, border: '1.5px solid var(--c-border-strong)', background: showPreset ? 'var(--c-surface-selected)' : 'var(--c-surface)',
              color: 'var(--c-forest)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            <Sparkles size={14} /> Use a Preset {showPreset ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showPreset && (
          <div className="gt-card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <TextField label="Start Date" type="date" value={preset.startDate} onChange={v => setPreset({ ...preset, startDate: v })} mono />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600 }}>Years</span>
                <select
                  value={preset.years}
                  onChange={e => setPreset({ ...preset, years: e.target.value })}
                  style={{ padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--c-border-strong)', fontSize: 14, background: 'var(--c-surface)', color: 'var(--c-ink-soft)' }}
                >
                  {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>{y} year{y === 1 ? '' : 's'}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600 }}>Terms per Year</span>
                <select
                  value={preset.termsPerYear}
                  onChange={e => setPreset({ ...preset, termsPerYear: e.target.value })}
                  style={{ padding: '9px 11px', borderRadius: 8, border: '1.5px solid var(--c-border-strong)', fontSize: 14, background: 'var(--c-surface)', color: 'var(--c-ink-soft)' }}
                >
                  <option value={2}>2 — Semester</option>
                  <option value={3}>3 — Trimester</option>
                  <option value={4}>4 — Quarter</option>
                </select>
              </label>
              <PrimaryButton onClick={generatePreset} icon={Sparkles} style={{ opacity: canGeneratePreset ? 1 : 0.5 }}>Generate Terms</PrimaryButton>
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-text-faint)', marginTop: 10 }}>
              This will create {Number(preset.years) * Number(preset.termsPerYear)} term{Number(preset.years) * Number(preset.termsPerYear) === 1 ? '' : 's'} starting from the date above, named automatically (e.g. "1st Semester SY 2026-2027").
            </div>
          </div>
        )}

        <div className="gt-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField label="Term Name" value={termForm.name} onChange={v => setTermForm({ ...termForm, name: v })} placeholder="1st Semester 2026-2027" />
            <TextField label="Start Date" type="date" value={termForm.startDate} onChange={v => setTermForm({ ...termForm, startDate: v })} mono />
            <TextField label="End Date" type="date" value={termForm.endDate} onChange={v => setTermForm({ ...termForm, endDate: v })} mono />
            <PrimaryButton onClick={submitTerm} icon={Plus} style={{ opacity: canAddTerm ? 1 : 0.5 }}>Add Term</PrimaryButton>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {data.terms.length === 0 ? (
            <EmptyState icon={CalendarRange} title="No terms yet" subtitle="Add your first term above." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.terms
                .slice()
                .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
                .map(t => {
                  const isCurrent = currentTerm && currentTerm.id === t.id;
                  return (
                    <div key={t.id} className="gt-card" style={{ padding: 14, borderLeft: isCurrent ? '5px solid var(--c-gold)' : '5px solid transparent' }}>
                      {editingId === t.id ? (
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <TextField label="Term Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
                          <TextField label="Start Date" type="date" value={editForm.startDate} onChange={v => setEditForm({ ...editForm, startDate: v })} mono />
                          <TextField label="End Date" type="date" value={editForm.endDate} onChange={v => setEditForm({ ...editForm, endDate: v })} mono />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <IconButton icon={Check} onClick={saveEdit} title="Save" />
                            <IconButton icon={X} onClick={() => setEditingId(null)} title="Cancel" />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 140 }}>
                            <div className="gt-serif" style={{ fontSize: 16, color: 'var(--c-ink-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              {t.name}
                              {isCurrent && (
                                <span className="gt-mono" style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--c-gold-tint)', color: 'var(--c-gold-dark)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Current</span>
                              )}
                            </div>
                            <div className="gt-mono" style={{ fontSize: 12, color: 'var(--c-text-faint)', marginTop: 2 }}>{formatDate(t.startDate)} – {formatDate(t.endDate)}</div>
                          </div>
                          {confirmDeleteId === t.id ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontSize: 12.5, color: 'var(--c-danger)' }}>Delete?</span>
                              <IconButton icon={Check} onClick={() => { deleteTerm(t.id); setConfirmDeleteId(null); }} title="Confirm" danger />
                              <IconButton icon={X} onClick={() => setConfirmDeleteId(null)} title="Cancel" />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {termDurationDays(t) !== null && (
                                <span className="gt-mono" style={{ fontSize: 11, color: 'var(--c-text-muted)', background: 'rgba(0,0,0,0.04)', padding: '3px 9px', borderRadius: 20, fontWeight: 600 }}>
                                  {termDurationDays(t)} day{termDurationDays(t) === 1 ? '' : 's'}
                                </span>
                              )}
                              <div style={{ display: 'flex', gap: 8 }}>
                                <IconButton icon={Pencil} onClick={() => startEdit(t)} title="Edit" />
                                <IconButton icon={Trash2} onClick={() => setConfirmDeleteId(t.id)} title="Delete" danger />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <div>
        <Eyebrow>Danger Zone</Eyebrow>
        <div className="gt-card" style={{ padding: 18, border: '1.5px solid var(--c-danger-tint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="gt-serif" style={{ fontSize: 16, color: 'var(--c-ink-soft)' }}>Clear All Data</div>
            <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)', marginTop: 2 }}>
              Permanently erases your profile, terms, courses, schedule, grades, and assessments. This cannot be undone.
            </div>
          </div>
          {confirmResetAll ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: 'var(--c-danger)', fontWeight: 600 }}>Are you sure?</span>
              <IconButton icon={Check} onClick={() => { resetAllData(); setConfirmResetAll(false); }} title="Confirm" danger />
              <IconButton icon={X} onClick={() => setConfirmResetAll(false)} title="Cancel" />
            </div>
          ) : (
            <button
              onClick={() => setConfirmResetAll(true)}
              className="gt-mono"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                borderRadius: 8, border: 'none', background: 'var(--c-danger)', color: 'var(--c-surface)',
                fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              <Trash2 size={14} /> Clear All Data
            </button>
          )}
        </div>
      </div>

      <div className="gt-mono" style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-text-placeholder)', paddingTop: 4, paddingBottom: 8 }}>
        Gradebook v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}
      </div>
    </div>
  );
}