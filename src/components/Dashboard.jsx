import React from 'react';
import { Inbox, BookOpen, Clock3, Video, TrendingUp, GraduationCap, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCurrentTerm, timeToMinutes, computeGWA, computeTermStats, computeCumulativeStats, formatDate, formatTime, DAYS, isTermEnded, getEffectiveGrade, isPassingGrade } from '../utils';
import { Eyebrow, EmptyState } from './SharedUI';

function Stamp({ currentTerm }) {
  const isBreak = !currentTerm;
  const color = isBreak ? 'var(--c-danger)' : 'var(--c-forest)';
  return (
    <div
      className="gt-stamp"
      style={{ color, display: 'inline-block', padding: '18px 30px', background: 'rgba(255,255,255,0.5)' }}
    >
      <div className="gt-serif" style={{ fontSize: isBreak ? 30 : 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'center' }}>
        {isBreak ? 'Break Mode' : currentTerm.name}
      </div>
      <div className="gt-mono" style={{ fontSize: 11.5, textAlign: 'center', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {isBreak ? 'No active term for today' : `${formatDate(currentTerm.startDate)} — ${formatDate(currentTerm.endDate)}`}
      </div>
    </div>
  );
}

function StatCard({ label, labelIcon: LabelIcon, sub, children }) {
  return (
    <div className="gt-card gt-card--hover gt-stat-card">
      <div className="gt-stat-label">
        {LabelIcon && <LabelIcon size={13} />} {label}
        {sub && <span className="gt-stat-label-sub"> · {sub}</span>}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard({ data }) {
  const currentTerm = getCurrentTerm(data.terms);
  const courseIds = currentTerm ? (data.termCourses[currentTerm.id] || []) : [];
  const termCourses = courseIds.map(id => data.courses.find(c => c.id === id)).filter(Boolean);
  const todayName = DAYS[(new Date().getDay() + 6) % 7];
  const todaysSchedule = currentTerm
    ? data.schedule
        .filter(s => s.termId === currentTerm.id && s.day === todayName)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    : [];
  const lowerIsBetter = (data.account.gradingSystem || 'highest-1') === 'highest-1';

  const gwaHistory = data.terms
    .slice()
    .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
    .map(t => ({ term: t, gwa: computeGWA(t.id, data.grades, data.courses, data.termCourses, data.assessments, data.account) }))
    .filter(row => row.gwa !== null);

  const chartData = gwaHistory.map(row => ({
    name: row.term.name.length > 14 ? row.term.name.slice(0, 13) + '…' : row.term.name,
    fullName: row.term.name,
    gwa: Math.round(row.gwa * 100) / 100,
  }));

  const requiredUnits = parseFloat(data.account.requiredUnits) || 0;
  const passedUnits = Object.keys(data.termCourses).reduce((sum, termId) => {
    const term = data.terms.find(t => t.id === termId);
    if (!term || !isTermEnded(term)) return sum;
    const ids = data.termCourses[termId] || [];
    return sum + ids.reduce((s, courseId) => {
      const course = data.courses.find(c => c.id === courseId);
      if (!course) return s;
      const effective = getEffectiveGrade(termId, courseId, data.grades, data.assessments, data.account, course);
      return isPassingGrade(effective.value, data.account) ? s + (parseFloat(course.units) || 0) : s;
    }, 0);
  }, 0);
  const leftUnits = Math.max(requiredUnits - passedUnits, 0);
  const progressPct = requiredUnits > 0 ? Math.min(100, Math.round((passedUnits / requiredUnits) * 100)) : 0;

  const goalGWA = parseFloat(data.account.goalGWA);
  const hasGoal = !isNaN(goalGWA);
  const cumulative = computeCumulativeStats(data.terms, data.grades, data.courses, data.termCourses, data.assessments, data.account);
  const termStats = currentTerm ? computeTermStats(currentTerm.id, data.grades, data.courses, data.termCourses, data.assessments, data.account) : null;
  const currentTermUnits = currentTerm
    ? (data.termCourses[currentTerm.id] || []).reduce((sum, id) => {
        const course = data.courses.find(c => c.id === id);
        if (!course || course.unitsConsidered === false) return sum;
        return sum + (parseFloat(course.units) || 0);
      }, 0)
    : 0;

  let neededGrade = null;
  let neededStatus = null; // 'unreachable' | 'secured' | null
  if (hasGoal && currentTerm && currentTermUnits > 0) {
    const totalUnits = cumulative.unitsConsidered + currentTermUnits;
    neededGrade = (goalGWA * totalUnits - (cumulative.gwa || 0) * cumulative.unitsConsidered) / currentTermUnits;
    const best = lowerIsBetter ? 1 : 5;
    const worst = lowerIsBetter ? 5 : 1;
    if (lowerIsBetter ? neededGrade < best : neededGrade > best) neededStatus = 'unreachable';
    else if (lowerIsBetter ? neededGrade > worst : neededGrade < worst) neededStatus = 'secured';
  }

  return (
    <div className="gt-section">
      <div>
        <Eyebrow>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Eyebrow>
        <h1 className="gt-serif gt-page-title">Dashboard</h1>
        <Stamp currentTerm={currentTerm} />
      </div>

      <div>
        <Eyebrow>Courses this term</Eyebrow>
        {!currentTerm && (
          <EmptyState icon={Inbox} title="Enjoy the break" subtitle="There's no active term right now, so no courses to show." />
        )}
        {currentTerm && termCourses.length === 0 && (
          <EmptyState icon={BookOpen} title="No courses assigned yet" subtitle="Go to Manage Term to add courses to this term." />
        )}
        {currentTerm && termCourses.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 10 }}>
            {termCourses.map(c => (
              <div key={c.id} className="gt-card gt-card--hover" style={{ padding: 14, borderLeft: `5px solid ${c.color}` }}>
                <div className="gt-mono" style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.code}</div>
                <div className="gt-serif" style={{ fontSize: 16, color: 'var(--c-ink-soft)', margin: '2px 0' }}>{c.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)' }}>{c.units} unit{c.units == 1 ? '' : 's'}{c.instructor ? ` · ${c.instructor}` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentTerm && (
        <div>
          <Eyebrow>Today's Schedule</Eyebrow>
          {todaysSchedule.length === 0 ? (
            <EmptyState icon={Clock3} title="Nothing scheduled today" subtitle="Free day — or add a schedule under Manage Schedule." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {todaysSchedule.map(s => {
                const course = data.courses.find(c => c.id === s.courseId);
                return (
                  <div key={s.id} className="gt-card gt-card--hover" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div className="gt-mono" style={{ fontSize: 12.5, color: 'var(--c-text)', minWidth: 108 }}>
                      {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: course ? course.color : 'var(--c-text-placeholder)', flexShrink: 0 }} />
                    <div style={{ fontSize: 14, color: 'var(--c-ink-soft)', fontWeight: 500 }}>{course ? course.name : 'Unknown course'}</div>
                    {s.meetingLink && (
                      <a
                        href={s.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="gt-mono"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--c-link)', textDecoration: 'none', fontWeight: 600, marginLeft: s.room ? 0 : 'auto' }}
                      >
                        <Video size={13} /> Join
                      </a>
                    )}
                    {s.room && <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)', marginLeft: 'auto' }}>{s.room}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {requiredUnits > 0 && (
        <div>
          <Eyebrow>Progress to Graduation</Eyebrow>
          <div className="gt-card" style={{ padding: 18, marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              <div>
                <div className="gt-stat-label"><GraduationCap size={13} /> Total Units Required</div>
                <div className="gt-stat-value">{requiredUnits}</div>
              </div>
              <div>
                <div className="gt-stat-label">Passed</div>
                <div className="gt-stat-value" style={{ color: 'var(--c-forest)' }}>{passedUnits}</div>
              </div>
              <div>
                <div className="gt-stat-label">Left</div>
                <div className="gt-stat-value" style={{ color: 'var(--c-gold)' }}>{leftUnits}</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 8, borderRadius: 999, background: 'var(--c-divider)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%', width: `${progressPct}%`, borderRadius: 999,
                    background: 'linear-gradient(90deg, var(--c-forest), var(--c-gold))',
                    transition: 'width 400ms var(--ease)',
                  }}
                />
              </div>
              <div className="gt-mono" style={{ fontSize: 11, color: 'var(--c-text-faint)', marginTop: 6 }}>{progressPct}% complete</div>
            </div>
          </div>
        </div>
      )}

      <div>
        <Eyebrow>This Term at a Glance</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 10 }}>
          <StatCard label="Units Considered" sub="this term">
            {!currentTerm ? (
              <div className="gt-stat-empty">No active term right now.</div>
            ) : (
              <>
                <div className="gt-stat-value">{termStats.unitsConsidered}</div>
                <div className="gt-stat-caption">out of {termStats.totalUnits} unit{termStats.totalUnits == 1 ? '' : 's'} in {currentTerm.name}</div>
              </>
            )}
          </StatCard>

          <StatCard label="Grade Needed" labelIcon={Target} sub="this term">
            {!currentTerm ? (
              <div className="gt-stat-empty">No active term right now.</div>
            ) : !hasGoal ? (
              <div className="gt-stat-empty">Set a goal GWA in Account Settings.</div>
            ) : currentTermUnits === 0 ? (
              <div className="gt-stat-empty">No courses assigned yet.</div>
            ) : neededStatus === 'secured' ? (
              <>
                <div className="gt-serif" style={{ fontSize: 22, color: 'var(--c-forest)', marginTop: 4 }}>Secured</div>
                <div className="gt-stat-caption">Already on pace for {goalGWA.toFixed(2)}</div>
              </>
            ) : neededStatus === 'unreachable' ? (
              <>
                <div className="gt-serif" style={{ fontSize: 22, color: 'var(--c-danger)', marginTop: 4 }}>Out of reach</div>
                <div className="gt-stat-caption">{goalGWA.toFixed(2)} isn't reachable this term</div>
              </>
            ) : (
              <>
                <div className="gt-stat-value" style={{ color: 'var(--c-gold)' }}>{neededGrade.toFixed(2)}</div>
                <div className="gt-stat-caption">average across {currentTermUnits} unit{currentTermUnits == 1 ? '' : 's'} to stay at {goalGWA.toFixed(2)}</div>
              </>
            )}
          </StatCard>

          <StatCard label="Average GWA" sub="overall">
            {cumulative.gwa === null ? (
              <div className="gt-stat-empty">No finished terms yet.</div>
            ) : (
              <>
                <div className="gt-stat-value" style={{ color: 'var(--c-gold)' }}>{cumulative.gwa.toFixed(2)}</div>
                <div className="gt-stat-caption">across {cumulative.unitsConsidered} unit{cumulative.unitsConsidered == 1 ? '' : 's'} considered</div>
              </>
            )}
          </StatCard>
        </div>
      </div>

      <div>
        <Eyebrow>GWA History</Eyebrow>
        {gwaHistory.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No grades recorded yet" subtitle="Enter grades per course in Manage Term, or log assessments in Manage Grades." />
        ) : (
          <div className="gt-card" style={{ padding: 18, marginTop: 10 }}>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gwaLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2D5240" />
                      <stop offset="100%" stopColor="#B8860B" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EEE9DB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8A8A7E' }} axisLine={{ stroke: '#DDD6C4' }} tickLine={false} />
                  <YAxis reversed={lowerIsBetter} tick={{ fontSize: 11, fill: '#8A8A7E' }} axisLine={false} tickLine={false} width={36} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#FCFBF7', border: '1.5px solid #E3DCC9', borderRadius: 8, fontSize: 12.5, boxShadow: '0 6px 18px rgba(34,57,45,0.12)' }}
                    labelFormatter={(_, payload) => (payload && payload[0] ? payload[0].payload.fullName : '')}
                  />
                  <Line type="monotone" dataKey="gwa" stroke="url(#gwaLine)" strokeWidth={2.75} dot={{ r: 4, fill: '#B8860B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
              {gwaHistory.map(row => (
                <div key={row.term.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', borderTop: '1px solid var(--c-divider)' }}>
                  <span style={{ fontSize: 13.5, color: 'var(--c-ink-soft)' }}>{row.term.name}</span>
                  <span className="gt-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-gold)' }}>{row.gwa.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}