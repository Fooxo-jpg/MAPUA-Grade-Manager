import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Check, X, ChevronUp, ChevronDown, Sparkles, CalendarRange, Pencil, Sun, Moon } from 'lucide-react';
import { getCurrentTerm, uid, generateTerms, formatDate, termDurationDays, MAPUA_PROGRAMS, GRADE_LEVELS, SIDEBAR_THEMES } from '../utils';
import { Eyebrow, TextField, SelectField, PrimaryButton, IconButton, EmptyState } from './SharedUI';

// Orders the fixed grade levels so the best grade is always shown first,
// based on which grading system is selected (1.00 highest vs 5.00 highest).
function orderedGradeLevels(gradingSystem) {
  const levels = GRADE_LEVELS.slice();
  return gradingSystem === 'highest-5' ? levels.reverse() : levels;
}

// Shared header used by every card on this page so the section rhythm stays
// consistent: a small eyebrow label, a serif heading, and an optional note.
function SettingsSection({ eyebrow, title, description, children }) {
  return (
    <div className="gt-settings-section">
      <div className="gt-settings-section-head">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="gt-settings-heading">{title}</h2>
        {description && <p className="gt-settings-desc">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ColorModeToggle({ value, onChange }) {
  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
  ];
  return (
    <div className="gt-mode-toggle">
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`gt-mono gt-mode-toggle-btn${active ? ' gt-mode-toggle-btn--active' : ''}`}
          >
            <opt.icon size={14} /> {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SidebarThemePicker({ value, onChange }) {
  const current = SIDEBAR_THEMES.find(t => t.id === value) || SIDEBAR_THEMES[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {SIDEBAR_THEMES.map(t => {
          const selected = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              title={t.name}
              className={`gt-swatch-btn${selected ? ' gt-swatch-btn--selected' : ''}`}
              style={{ background: `linear-gradient(180deg, ${t.from} 0%, ${t.to} 100%)` }}
            >
              <span className="gt-swatch-dot" style={{ background: t.accentBright }} />
            </button>
          );
        })}
      </div>
      <span className="gt-mono" style={{ fontSize: 11.5, color: 'var(--c-text-faint)' }}>{current.name}</span>
    </div>
  );
}

export default function AccountSettings({ data, updateAccount, addTerm, updateTerm, deleteTerm, clearAllTerms, resetAllData }) {
  const currentTerm = getCurrentTerm(data.terms);
  const blankTerm = { name: '', startDate: '', endDate: '' };
  const [termForm, setTermForm] = useState(blankTerm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(blankTerm);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [showPreset, setShowPreset] = useState(false);
  const [preset, setPreset] = useState({ startDate: '', years: 4, termsPerYear: 2 });
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

  const gradingSystem = data.account.gradingSystem || 'highest-1';
  const gradeTable = data.account.gradeTable || [];

  // Keep the grade table permanently populated with 10 rows, one per rank
  // (1st best ... last/worst). Switching the grading system only relabels
  // each row's "Final Grade" according to the new best-to-worst order —
  // the low/high percentage ranges stay put in their row.
  useEffect(() => {
    const order = orderedGradeLevels(gradingSystem);
    const current = data.account.gradeTable || [];
    const synced = order.map((g, i) => {
      const existing = current[i];
      return { id: 'rank-' + i, low: existing ? existing.low : '', high: existing ? existing.high : '', grade: g.toFixed(2) };
    });
    const unchanged = synced.length === current.length &&
      synced.every((r, i) => {
        const cur = current[i];
        return cur && cur.grade === r.grade && cur.low === r.low && cur.high === r.high;
      });
    if (!unchanged) updateAccount({ gradeTable: synced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradingSystem]);

  // Only the percentage range (low/high) is user-editable — the grade values are fixed.
  function updateGradeRow(id, patch) {
    updateAccount({ gradeTable: gradeTable.map(r => r.id === id ? { ...r, ...patch } : r) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      <div>
        <Eyebrow>Settings</Eyebrow>
        <h1 className="gt-serif gt-page-title">Account Settings</h1>
      </div>

      <div className="gt-data-cols">
        <SettingsSection eyebrow="Profile" title="Your Info">
          <div className="gt-card" style={{ padding: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <TextField label="Student ID" value={data.account.studentId} onChange={v => updateAccount({ studentId: v })} placeholder="2023-00123" mono />
            <TextField label="First Name" value={data.account.firstName} onChange={v => updateAccount({ firstName: v })} placeholder="Juan" />
            <TextField label="Middle Name" value={data.account.middleName} onChange={v => updateAccount({ middleName: v })} placeholder="Santos" />
            <TextField label="Last Name" value={data.account.lastName} onChange={v => updateAccount({ lastName: v })} placeholder="Dela Cruz" />
            <SelectField label="Gender" value={data.account.gender || ''} onChange={v => updateAccount({ gender: v })}>
              <option value="">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </SelectField>
            <TextField label="Birthday" type="date" value={data.account.birthday} onChange={v => updateAccount({ birthday: v })} mono />
            <SelectField label="Program" value={data.account.program || ''} onChange={v => updateAccount({ program: v })} style={{ flexBasis: '100%', width: '100%' }}>
              <option value="">None</option>
              {MAPUA_PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
            </SelectField>
          </div>
        </SettingsSection>

        <SettingsSection eyebrow="Ambition" title="GWA & Goals">
          <div className="gt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <TextField
              label={`Target GWA (${gradingSystem === 'highest-1' ? '1.00 best' : '5.00 best'})`}
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
        </SettingsSection>
      </div>

      <SettingsSection eyebrow="Appearance" title="Theme & Sidebar" description="Choose a light or dark reading mode, and pick the color scheme for the side panel.">
        <div className="gt-card" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
            <span className="gt-field-label">Color Mode</span>
            <ColorModeToggle value={data.account.theme || 'light'} onChange={v => updateAccount({ theme: v })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 240 }}>
            <span className="gt-field-label">Sidebar Color</span>
            <SidebarThemePicker value={data.account.sidebarTheme || 'forest'} onChange={v => updateAccount({ sidebarTheme: v })} />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection eyebrow="Grading" title="Grading System">
        <div className="gt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <SelectField
            label="Grading System"
            value={gradingSystem}
            onChange={v => updateAccount({ gradingSystem: v })}
            style={{ maxWidth: 320 }}
          >
            <option value="highest-1">1.00 is the highest grade</option>
            <option value="highest-5">5.00 is the highest grade</option>
          </SelectField>

          <div style={{ borderTop: '1px solid var(--c-divider)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div className="gt-field-label" style={{ marginBottom: 4 }}>Grade Conversion Table</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowX: 'auto' }}>
              <div className="gt-mono" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600, minWidth: 300, padding: '0 2px' }}>
                <span style={{ width: 90, textAlign: 'center' }}>Lowest %</span>
                <span style={{ width: 14 }} />
                <span style={{ width: 90, textAlign: 'center' }}>Highest %</span>
                <span style={{ width: 16 }} />
                <span style={{ width: 90, textAlign: 'center' }}>Final Grade</span>
              </div>
              {gradeTable.map((row, i) => (
                <div
                  key={row.id}
                  style={{
                    display: 'flex', gap: 8, alignItems: 'center', minWidth: 300, padding: '4px 2px', borderRadius: 7,
                    background: i % 2 === 1 ? 'var(--c-bg-alt)' : 'transparent',
                  }}
                >
                  <input
                    type="text" inputMode="decimal" value={row.low} placeholder="80.00"
                    onChange={e => updateGradeRow(row.id, { low: e.target.value.replace(/[^0-9.]/g, '') })}
                    className="gt-mono gt-input" style={{ width: 90, padding: '8px 10px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--c-text-faint)' }}>–</span>
                  <input
                    type="text" inputMode="decimal" value={row.high} placeholder="84.99"
                    onChange={e => updateGradeRow(row.id, { high: e.target.value.replace(/[^0-9.]/g, '') })}
                    className="gt-mono gt-input" style={{ width: 90, padding: '8px 10px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--c-text-faint)' }}>=</span>
                  <div
                    className="gt-mono"
                    style={{ width: 90, padding: '8px 10px', borderRadius: 7, border: '1.5px solid var(--c-border)', fontSize: 13, textAlign: 'center', background: 'var(--c-surface-selected)', color: 'var(--c-forest-dark)', fontWeight: 700 }}
                  >
                    {row.grade}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection eyebrow="Term Management" title="Terms">
        <div className="gt-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField label="Term Name" value={termForm.name} onChange={v => setTermForm({ ...termForm, name: v })} placeholder="1st Semester 2026-2027" />
            <TextField label="Start Date" type="date" value={termForm.startDate} onChange={v => setTermForm({ ...termForm, startDate: v })} mono />
            <TextField label="End Date" type="date" value={termForm.endDate} onChange={v => setTermForm({ ...termForm, endDate: v })} mono />
            <PrimaryButton onClick={submitTerm} icon={Plus} style={{ opacity: canAddTerm ? 1 : 0.5 }}>Add Term</PrimaryButton>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--c-divider)', paddingTop: 14 }}>
            <button
              onClick={() => setShowPreset(s => !s)}
              className={`gt-mono gt-btn gt-btn-outline${showPreset ? ' gt-btn-outline--active' : ''}`}
            >
              <Sparkles size={14} /> Use a Preset {showPreset ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {data.terms.length > 0 && (
              confirmClearTerms ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--c-danger)' }}>Clear all terms?</span>
                  <IconButton icon={Check} onClick={() => { clearAllTerms(); setConfirmClearTerms(false); }} title="Confirm" danger />
                  <IconButton icon={X} onClick={() => setConfirmClearTerms(false)} title="Cancel" />
                </div>
              ) : (
                <button onClick={() => setConfirmClearTerms(true)} className="gt-mono gt-btn gt-btn-outline-danger">
                  <Trash2 size={14} /> Clear All
                </button>
              )
            )}
          </div>

          {showPreset && (
            <div style={{ background: 'var(--c-bg-alt)', border: '1.5px solid var(--c-border)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <TextField label="Start Date" type="date" value={preset.startDate} onChange={v => setPreset({ ...preset, startDate: v })} mono />
                <SelectField label="Years" value={preset.years} onChange={v => setPreset({ ...preset, years: v })} style={{ minWidth: 140 }}>
                  {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>{y} year{y === 1 ? '' : 's'}</option>)}
                </SelectField>
                <SelectField label="Terms per Year" value={preset.termsPerYear} onChange={v => setPreset({ ...preset, termsPerYear: v })} style={{ minWidth: 160 }}>
                  <option value={2}>2 — Semester</option>
                  <option value={3}>3 — Trimester</option>
                  <option value={4}>4 — Quarter</option>
                </SelectField>
                <PrimaryButton onClick={generatePreset} icon={Sparkles} style={{ opacity: canGeneratePreset ? 1 : 0.5 }}>Generate Terms</PrimaryButton>
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-text-faint)' }}>
                This will create {Number(preset.years) * Number(preset.termsPerYear)} term{Number(preset.years) * Number(preset.termsPerYear) === 1 ? '' : 's'} starting from the date above, named automatically (e.g. "1st Semester SY 2026-2027").
              </div>
            </div>
          )}

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
      </SettingsSection>

      <SettingsSection eyebrow="Danger Zone" title="Clear All Data" description="Permanently erases your profile, terms, courses, schedule, grades, and assessments. This cannot be undone.">
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
      </SettingsSection>

      <div className="gt-mono" style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-text-placeholder)', paddingTop: 4, paddingBottom: 8 }}>
        Gradebook v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}
      </div>
    </div>
  );
}
