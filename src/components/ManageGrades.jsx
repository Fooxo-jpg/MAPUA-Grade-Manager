import React, { useState, useEffect } from 'react';
import { Lock, ClipboardList, Trash2, Check, Plus, CalendarRange, BookOpen, ChevronUp, Clock3 } from 'lucide-react';
import { percentToGradePoint, computeAssessmentStats, computeTermStats, getEffectiveGrade, getCurrentTerm, isTermEnded, hasTermStarted, uid, formatDate } from '../utils';
import { Eyebrow, EmptyState, TextField, PrimaryButton, IconButton, GradeSelect } from './SharedUI';

function FinalGradeField({ termId, course, percent, account, grades, updateGrade, locked }) {
  const gradePoint = percentToGradePoint(account.gradeTable, percent);
  const override = (grades[termId] && grades[termId][course.id]) || '';
  const hasOverride = override !== '';
  const isAuto = !hasOverride && gradePoint !== null;
  const displayVal = hasOverride ? override : (isAuto ? gradePoint.toFixed(2) : '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600 }}>
          Possible Grade
        </span>
        {percent === null ? (
          <span style={{ fontSize: 13, color: 'var(--c-text-placeholder)' }}>No scored assessments yet</span>
        ) : (
          <>
            <span className="gt-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-forest)' }}>{percent.toFixed(2)}%</span>
            {gradePoint !== null ? (
              <span className="gt-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-accent)', background: 'var(--c-accent-tint)', padding: '2px 10px', borderRadius: 20 }}>
                {gradePoint.toFixed(2)}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--c-text-placeholder)' }}>Add a grade conversion table in Account Settings to see the grade point</span>
            )}
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600 }}>
          Final Grade
        </span>
        <GradeSelect
          value={displayVal}
          onChange={v => !locked && updateGrade(termId, course.id, v)}
          disabled={locked}
          title={isAuto ? 'Computed from the assessment log above — choose to override' : ''}
          gradingSystem={account.gradingSystem}
        />
        {isAuto && (
          <span className="gt-mono" title="Computed from the assessment log" style={{ fontSize: 9.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--c-text-muted)', background: 'var(--c-overlay-4)', padding: '2px 6px', borderRadius: 20 }}>
            Auto from log
          </span>
        )}
        {hasOverride && !locked && (
          <button
            onClick={() => updateGrade(termId, course.id, '')}
            className="gt-mono"
            title="Clear override and go back to the computed possible grade"
            style={{ fontSize: 10.5, color: 'var(--c-link)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Reset to computed
          </button>
        )}
      </div>
    </div>
  );
}

function AssessmentPanel({ termId, course, list, account, grades, updateGrade, addAssessment, updateAssessment, deleteAssessment, updateCourse, locked }) {
  const useCat = !!course.useCategoryWeights;
  const categories = course.categories || [];
  const blank = { name: '', raw: '', total: '', weight: '', category: '', newCatWeight: '' };
  const [form, setForm] = useState(blank);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { percent } = computeAssessmentStats(list, categories);

  const catTrim = form.category.trim();
  const matchedCategory = useCat ? categories.find(cat => cat.name.trim().toLowerCase() === catTrim.toLowerCase()) : null;

  const canAdd = !locked && form.name.trim() && form.raw !== '' && form.total !== '' && (
    useCat ? (catTrim !== '' && (matchedCategory || form.newCatWeight !== '')) : form.weight !== ''
  );

  function submit() {
    if (!canAdd) return;
    if (useCat) {
      let categoryId, weight;
      if (matchedCategory) {
        categoryId = matchedCategory.id;
        weight = matchedCategory.weight;
      } else {
        categoryId = uid();
        weight = form.newCatWeight;
        updateCourse(course.id, { categories: [...categories, { id: categoryId, name: catTrim, weight }] });
      }
      addAssessment(termId, course.id, { name: form.name, raw: form.raw, total: form.total, weight, category: catTrim, categoryId, id: uid() });
    } else {
      addAssessment(termId, course.id, { name: form.name, raw: form.raw, total: form.total, weight: form.weight, id: uid() });
    }
    setForm(blank);
  }

  const cols = locked ? '1fr 90px 90px 90px' : '1fr 90px 90px 90px 36px';

  return (
    <div style={{ padding: '16px 18px', background: 'var(--c-bg)', borderTop: '1.5px solid var(--c-border)' }}>
      {locked && (
        <div className="gt-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--c-accent-dark)', background: 'var(--c-accent-tint)', padding: '4px 10px', borderRadius: 20, fontWeight: 700, marginBottom: 14 }}>
          <Lock size={12} /> Term ended — read only
        </div>
      )}
      <div style={{ marginBottom: 14 }}>
        <FinalGradeField termId={termId} course={course} account={account} percent={percent} grades={grades} updateGrade={updateGrade} locked={locked} />
      </div>

      {list.length > 0 && (
        <div className="gt-card" style={{ marginBottom: 14, overflowX: 'auto', overflowY: 'hidden', opacity: locked ? 0.75 : 1 }}>
          <div className="gt-mono" style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, padding: '8px 12px', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600, background: 'var(--c-overlay-2)', minWidth: 420 }}>
            <span>Assessment</span>
            <span>Score</span>
            <span>Total</span>
            <span>{useCat ? 'Category' : 'Weight'}</span>
            {!locked && <span />}
          </div>
          {list.map((a, i) => {
            const pct = (parseFloat(a.raw) / parseFloat(a.total)) * 100;
            return (
              <div
                key={a.id}
                style={{
                  display: 'grid', gridTemplateColumns: cols, gap: 8, alignItems: 'center', minWidth: 420,
                  padding: '9px 12px', borderTop: i > 0 ? '1px solid var(--c-divider)' : 'none',
                }}
              >
                <span style={{ fontSize: 13.5, color: 'var(--c-ink-soft)' }}>
                  {a.name}
                  {!isNaN(pct) && <span className="gt-mono" style={{ fontSize: 11, color: 'var(--c-text-placeholder)', marginLeft: 8 }}>{pct.toFixed(1)}%</span>}
                </span>
                <input
                  type="text" inputMode="decimal" value={a.raw} disabled={locked}
                  onChange={e => !locked && updateAssessment(termId, course.id, a.id, { raw: e.target.value.replace(/[^0-9.]/g, '') })}
                  className="gt-mono" style={{ width: '100%', padding: '6px 8px', borderRadius: 7, border: '1.5px solid var(--c-border-strong)', fontSize: 13, textAlign: 'center', background: locked ? 'var(--c-surface-disabled)' : 'var(--c-surface)', color: 'var(--c-ink-soft)', cursor: locked ? 'not-allowed' : 'text' }}
                />
                <input
                  type="text" inputMode="decimal" value={a.total} disabled={locked}
                  onChange={e => !locked && updateAssessment(termId, course.id, a.id, { total: e.target.value.replace(/[^0-9.]/g, '') })}
                  className="gt-mono" style={{ width: '100%', padding: '6px 8px', borderRadius: 7, border: '1.5px solid var(--c-border-strong)', fontSize: 13, textAlign: 'center', background: locked ? 'var(--c-surface-disabled)' : 'var(--c-surface)', color: 'var(--c-ink-soft)', cursor: locked ? 'not-allowed' : 'text' }}
                />
                {useCat ? (() => {
                  const liveCat = categories.find(cat => cat.id === a.categoryId);
                  return (
                    <span className="gt-mono" title="Weight follows the category — edit categories in Manage Courses" style={{ fontSize: 11.5, color: 'var(--c-text)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {liveCat ? liveCat.name : (a.category || '—')} · {liveCat ? liveCat.weight : a.weight}%
                    </span>
                  );
                })() : (
                  <input
                    type="text" inputMode="decimal" value={a.weight} disabled={locked}
                    onChange={e => !locked && updateAssessment(termId, course.id, a.id, { weight: e.target.value.replace(/[^0-9.]/g, '') })}
                    className="gt-mono" style={{ width: '100%', padding: '6px 8px', borderRadius: 7, border: '1.5px solid var(--c-border-strong)', fontSize: 13, textAlign: 'center', background: locked ? 'var(--c-surface-disabled)' : 'var(--c-surface)', color: 'var(--c-ink-soft)', cursor: locked ? 'not-allowed' : 'text' }}
                  />
                )}
                {!locked && (
                  confirmDeleteId === a.id ? (
                    <IconButton icon={Check} onClick={() => { deleteAssessment(termId, course.id, a.id); setConfirmDeleteId(null); }} title="Confirm delete" danger />
                  ) : (
                    <IconButton icon={Trash2} onClick={() => setConfirmDeleteId(a.id)} title="Delete" danger />
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {!locked && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <TextField label="Assessment" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Quiz 1" />
          <TextField label="Score" value={form.raw} onChange={v => setForm({ ...form, raw: v.replace(/[^0-9.]/g, '') })} placeholder="18" mono />
          <TextField label="Total" value={form.total} onChange={v => setForm({ ...form, total: v.replace(/[^0-9.]/g, '') })} placeholder="20" mono />
          {useCat ? (
            <>
              <TextField
                label="Category"
                value={form.category}
                onChange={v => setForm({ ...form, category: v })}
                placeholder="Quizzes"
                list={`cat-list-${course.id}`}
                title={matchedCategory ? `Weight: ${matchedCategory.weight}%` : ''}
              />
              <datalist id={`cat-list-${course.id}`}>
                {categories.map(cat => <option key={cat.id} value={cat.name} />)}
              </datalist>
              {matchedCategory ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 90 }}>
                  <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600 }}>Weight</span>
                  <span className="gt-mono" style={{ fontSize: 13, padding: '9px 0', textAlign: 'center', color: 'var(--c-text-faint)' }}>{matchedCategory.weight}%</span>
                </div>
              ) : (
                catTrim !== '' && (
                  <TextField
                    label="New Category Weight"
                    value={form.newCatWeight}
                    onChange={v => setForm({ ...form, newCatWeight: v.replace(/[^0-9.]/g, '') })}
                    placeholder="20"
                    mono
                  />
                )
              )}
            </>
          ) : (
            <TextField label="Weight" value={form.weight} onChange={v => setForm({ ...form, weight: v.replace(/[^0-9.]/g, '') })} placeholder="10" mono />
          )}
          <PrimaryButton onClick={submit} icon={Plus} style={{ opacity: canAdd ? 1 : 0.5 }}>Add</PrimaryButton>
        </div>
      )}
    </div>
  );
}

export default function ManageGrades({ data, addAssessment, updateAssessment, deleteAssessment, updateGrade, updateCourse }) {
  const currentTerm = getCurrentTerm(data.terms);
  const [selectedId, setSelectedId] = useState(currentTerm ? currentTerm.id : (data.terms[0] ? data.terms[0].id : null));
  const [openCourseId, setOpenCourseId] = useState(null);

  useEffect(() => {
    if (!selectedId && data.terms.length > 0) setSelectedId(data.terms[0].id);
  }, [data.terms, selectedId]);

  const selectedTerm = data.terms.find(t => t.id === selectedId);
  const courseIds = selectedTerm ? (data.termCourses[selectedTerm.id] || []) : [];
  const termCourses = courseIds.map(id => data.courses.find(c => c.id === id)).filter(Boolean);
  const locked = isTermEnded(selectedTerm);
  const notStarted = !!selectedTerm && !hasTermStarted(selectedTerm);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>Manage Grades</Eyebrow>
        <h1 className="gt-serif gt-page-title" style={{ fontSize: 30, margin: '4px 0 18px' }}>Log Assessment Scores</h1>
      </div>

      {data.terms.length === 0 ? (
        <EmptyState icon={CalendarRange} title="No terms yet" subtitle="Create a term in Account Settings first." />
      ) : (
        <div className="gt-term-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) 1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.terms.map(t => {
              const isCurrent = currentTerm && currentTerm.id === t.id;
              const isSelected = selectedId === t.id;
              const ended = isTermEnded(t);
              const stats = computeTermStats(t.id, data.grades, data.courses, data.termCourses, data.assessments, data.account);
              return (
                <button
                  key={t.id}
                  onClick={() => { setSelectedId(t.id); setOpenCourseId(null); }}
                  className="gt-card"
                  style={{
                    textAlign: 'left', padding: 12, cursor: 'pointer',
                    border: isSelected ? '2px solid var(--c-accent)' : '1.5px solid var(--c-border)',
                    background: isSelected ? 'var(--c-surface-selected)' : 'var(--c-surface)',
                    opacity: ended ? 0.75 : 1,
                  }}
                >
                  <div className="gt-serif" style={{ fontSize: 15, color: 'var(--c-ink-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t.name}
                    {isCurrent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-accent)', display: 'inline-block' }} />}
                    {ended && <Lock size={11} style={{ color: 'var(--c-text-placeholder)' }} />}
                  </div>
                  <div className="gt-mono" style={{ fontSize: 11, color: 'var(--c-text-faint)', marginTop: 2 }}>{formatDate(t.startDate)} – {formatDate(t.endDate)}</div>
                  {stats.gwa !== null && (
                    <div className="gt-mono" style={{ fontSize: 10.5, color: 'var(--c-text-faint)', marginTop: 4 }}>
                      {stats.unitsConsidered} unit{stats.unitsConsidered == 1 ? '' : 's'} considered · <strong style={{ color: 'var(--c-accent)' }}>{stats.gwa.toFixed(2)}</strong> avg
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div>
            {!selectedTerm ? (
              <EmptyState icon={CalendarRange} title="Select a term" />
            ) : termCourses.length === 0 ? (
              <EmptyState icon={BookOpen} title="No courses in this term" subtitle="Assign courses to this term in Manage Term first." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notStarted && (
                  <div className="gt-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--c-text)', background: 'var(--c-surface-disabled)', padding: '7px 12px', borderRadius: 8, fontWeight: 600, alignSelf: 'flex-start' }}>
                    <Clock3 size={13} /> This term starts {formatDate(selectedTerm.startDate)} — grades can't be logged until then.
                  </div>
                )}
                {termCourses.map(c => {
                  const isOpen = openCourseId === c.id && !notStarted;
                  const list = (data.assessments[selectedTerm.id] && data.assessments[selectedTerm.id][c.id]) || [];
                  const effective = getEffectiveGrade(selectedTerm.id, c.id, data.grades, data.assessments, data.account, c);
                  return (
                    <div key={c.id} className="gt-card" style={{ borderLeft: `5px solid ${c.color}`, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, flexWrap: 'wrap' }}>
                        <div className="gt-mono" style={{ fontSize: 12, fontWeight: 700, color: c.color, minWidth: 60 }}>{c.code}</div>
                        <div style={{ flex: 1 }}>
                          <div className="gt-serif" style={{ fontSize: 15.5, color: 'var(--c-ink-soft)' }}>{c.name}</div>
                          <div className="gt-mono" style={{ fontSize: 11.5, color: 'var(--c-text-faint)' }}>{list.length} assessment{list.length === 1 ? '' : 's'} logged</div>
                        </div>
                        {effective.value !== undefined && effective.value !== '' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              className="gt-mono"
                              title={effective.isComputed ? 'Computed from assessment log' : (effective.isOverride ? 'Manually set' : '')}
                              style={{
                                fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                color: effective.isComputed ? 'var(--c-text-faint)' : 'var(--c-accent)',
                                background: effective.isComputed ? 'var(--c-overlay-4)' : 'var(--c-accent-tint)',
                                fontStyle: effective.isComputed ? 'italic' : 'normal',
                              }}
                            >
                              {typeof effective.value === 'number' ? effective.value.toFixed(2) : effective.value}
                            </span>
                          </div>
                        )}
                        <PrimaryButton
                          onClick={() => !notStarted && setOpenCourseId(isOpen ? null : c.id)}
                          icon={isOpen ? ChevronUp : (locked ? Lock : (notStarted ? Clock3 : ClipboardList))}
                          disabled={notStarted}
                          title={notStarted ? `Unlocks ${formatDate(selectedTerm.startDate)}` : ''}
                        >
                          {isOpen ? 'Close' : (locked ? 'View Grades' : (notStarted ? 'Not started yet' : 'Log Grades'))}
                        </PrimaryButton>
                      </div>
                      {isOpen && (
                        <AssessmentPanel
                          termId={selectedTerm.id}
                          course={c}
                          list={list}
                          account={data.account}
                          grades={data.grades}
                          updateGrade={updateGrade}
                          addAssessment={addAssessment}
                          updateAssessment={updateAssessment}
                          deleteAssessment={deleteAssessment}
                          updateCourse={updateCourse}
                          locked={locked}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}