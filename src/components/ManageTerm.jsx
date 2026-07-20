import React, { useState, useEffect } from 'react';
import { CalendarRange, BookOpen, Lock } from 'lucide-react';
import { getCurrentTerm, isTermEnded, findCourseTermId, computeTermStats, getUnitLimit, sumAssignedUnits, formatDate, COURSE_TYPES, COURSE_TYPE_ORDER } from '../utils';
import { Eyebrow, EmptyState } from './SharedUI';

export default function ManageTerm({ data, toggleCourseInTerm }) {
  const currentTerm = getCurrentTerm(data.terms);
  const [selectedId, setSelectedId] = useState(currentTerm ? currentTerm.id : (data.terms[0] ? data.terms[0].id : null));
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!selectedId && data.terms.length > 0) setSelectedId(data.terms[0].id);
  }, [data.terms, selectedId]);

  const selectedTerm = data.terms.find(t => t.id === selectedId);
  const assignedIds = selectedTerm ? (data.termCourses[selectedTerm.id] || []) : [];
  const selectedStats = selectedTerm ? computeTermStats(selectedTerm.id, data.grades, data.courses, data.termCourses, data.assessments, data.account) : null;
  const unitLimit = selectedTerm ? getUnitLimit(selectedTerm) : null;
  const assignedUnits = selectedTerm ? sumAssignedUnits(selectedTerm.id, data.courses, data.termCourses) : 0;
  const atOrOverLimit = unitLimit !== null && assignedUnits >= unitLimit;
  const locked = isTermEnded(selectedTerm);

  const availableCourses = selectedTerm
    ? data.courses.filter(c => assignedIds.includes(c.id) || !findCourseTermId(data.termCourses, c.id, selectedTerm.id))
    : [];
  const visibleCourses = typeFilter === 'all'
    ? availableCourses
    : availableCourses.filter(c => c.courseType === typeFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>Manage Term</Eyebrow>
        <h1 className="gt-serif gt-page-title" style={{ fontSize: 30, margin: '4px 0 18px' }}>Assign Courses to Terms</h1>
      </div>

      {data.terms.length === 0 ? (
        <EmptyState icon={CalendarRange} title="No terms yet" subtitle="Create a term in Account Settings first, then come back here to add courses to it." />
      ) : (
        <div className="gt-term-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) 1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.terms.map(t => {
              const isCurrent = currentTerm && currentTerm.id === t.id;
              const isSelected = selectedId === t.id;
              const ended = isTermEnded(t);
              const tLimit = getUnitLimit(t);
              const tUnits = sumAssignedUnits(t.id, data.courses, data.termCourses);
              const tOverLimit = tLimit !== null && tUnits > tLimit;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
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
                  <div className="gt-mono" style={{ fontSize: 10.5, color: tOverLimit ? 'var(--c-danger)' : 'var(--c-accent-dark)', marginTop: 4, fontWeight: tOverLimit ? 700 : 600 }}>
                    {tUnits}{tLimit !== null ? ` / ${tLimit}` : ''} unit{tUnits == 1 ? '' : 's'}
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            {!selectedTerm ? (
              <EmptyState icon={CalendarRange} title="Select a term" />
            ) : data.courses.length === 0 ? (
              <EmptyState icon={BookOpen} title="No courses to assign" subtitle="Add courses first in Manage Courses." />
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600 }}>Sort</span>
                      <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="gt-mono"
                        style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--c-border-strong)', fontSize: 12.5, background: 'var(--c-surface)', color: 'var(--c-ink-soft)' }}
                      >
                        <option value="all">All Types</option>
                        {COURSE_TYPE_ORDER.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                    {locked && (
                      <span className="gt-mono" style={{ fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--c-accent-dark)', background: 'var(--c-accent-tint)', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
                        <Lock size={12} /> Term ended — locked
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      className="gt-mono"
                      title={unitLimit !== null ? `This term is capped at ${unitLimit} units` : ''}
                      style={{
                        fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                        color: atOrOverLimit ? 'var(--c-danger)' : 'var(--c-accent-dark)',
                        background: atOrOverLimit ? 'color-mix(in srgb, var(--c-danger) 10%, transparent)' : 'var(--c-accent-tint)',
                      }}
                    >
                      {assignedUnits}{unitLimit !== null ? ` / ${unitLimit}` : ''} unit{assignedUnits == 1 ? '' : 's'}
                    </span>
                    {selectedStats && selectedStats.gwa !== null && (
                      <span className="gt-mono" style={{ fontSize: 12, color: 'var(--c-text-faint)' }}>
                        {selectedStats.unitsConsidered} unit{selectedStats.unitsConsidered == 1 ? '' : 's'} considered · Term GWA: <strong style={{ color: 'var(--c-accent)', fontSize: 14 }}>{selectedStats.gwa.toFixed(2)}</strong>
                      </span>
                    )}
                  </div>
                </div>
                {visibleCourses.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No available courses"
                    subtitle={typeFilter === 'all' ? 'All your courses are already assigned to other terms.' : `No available ${typeFilter} courses right now.`}
                  />
                ) : (
                  <div className="gt-card" style={{ padding: 6, opacity: locked ? 0.7 : 1 }}>
                    {visibleCourses.map((c, i) => {
                      const checked = assignedIds.includes(c.id);
                      const courseUnits = parseFloat(c.units) || 0;
                      const wouldExceed = !checked && unitLimit !== null && (assignedUnits + courseUnits > unitLimit);
                      const rowDisabled = locked || wouldExceed;
                      const typeMeta = COURSE_TYPES.find(t => t.name === c.courseType);
                      return (
                        <div
                          key={c.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', flexWrap: 'wrap',
                            borderBottom: i < visibleCourses.length - 1 ? '1px solid var(--c-divider)' : 'none',
                            opacity: wouldExceed ? 0.55 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={rowDisabled}
                            title={wouldExceed ? `Would exceed the ${unitLimit}-unit cap for this term` : ''}
                            onChange={() => !rowDisabled && toggleCourseInTerm(selectedTerm.id, c.id)}
                            style={{ width: 17, height: 17, accentColor: 'var(--c-accent)', cursor: rowDisabled ? 'not-allowed' : 'pointer' }}
                          />
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                          <div className="gt-mono" style={{ fontSize: 12, fontWeight: 700, color: c.color, minWidth: 60 }}>{c.code}</div>
                          <div style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, color: 'var(--c-ink-soft)' }}>{c.name}</span>
                            {c.courseType && (
                              <span className="gt-mono" style={{
                                fontSize: 9.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700,
                                padding: '2px 7px', borderRadius: 20,
                                color: typeMeta ? typeMeta.color : 'var(--c-text-muted)',
                                background: 'var(--c-overlay-4)',
                              }}>{c.courseType}</span>
                            )}
                            {wouldExceed && (
                              <span className="gt-mono" style={{ fontSize: 9.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--c-danger)', background: 'color-mix(in srgb, var(--c-danger) 10%, transparent)', padding: '2px 7px', borderRadius: 20 }}>
                                Exceeds cap
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}