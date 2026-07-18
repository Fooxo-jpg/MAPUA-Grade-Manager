import React, { useState, useEffect } from 'react';
import { Clock3, BookOpen, Settings, X, Video, Plus, Check, Trash2, Pencil, AlertCircle } from 'lucide-react';
import { getCurrentTerm, timeToMinutes, formatTime, uid, DAYS, COURSE_COLORS } from '../utils';
import { Eyebrow, EmptyState, PrimaryButton, IconButton, TextField, ColorSwatchPicker } from './SharedUI';

function ScheduleGrid({ entries, courses }) {
  const startHour = 7, endHour = 21;
  const totalMin = (endHour - startHour) * 60;
  const pxPerMin = 0.9;
  const height = totalMin * pxPerMin;
  const hours = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);

  const [selectedId, setSelectedId] = useState(null);
  const selected = entries.find(e => e.id === selectedId) || null;
  const selectedCourse = selected ? courses.find(c => c.id === selected.courseId) : null;
  const selectedOnline = selected ? isOnlineRoom(selected.room) : false;

  return (
    <div style={{ position: 'relative' }}>
      <div className="gt-card" style={{ padding: 16, overflowX: 'auto' }}>
        <div className="gt-sched-grid" style={{ display: 'grid', gridTemplateColumns: '54px repeat(7, minmax(110px, 1fr))', minWidth: 820 }}>
          <div />
          {DAYS.map(d => (
            <div key={d} className="gt-mono" style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600, paddingBottom: 8 }}>
              {d.slice(0, 3)}
            </div>
          ))}

          <div style={{ position: 'relative', height }}>
            {hours.map(h => (
              <div key={h} className="gt-mono" style={{ position: 'absolute', top: (h - startHour) * 60 * pxPerMin - 6, fontSize: 10.5, color: '#B0AA98' }}>
                {h % 12 === 0 ? 12 : h % 12}{h >= 12 ? 'p' : 'a'}
              </div>
            ))}
          </div>

          {DAYS.map(day => (
            <div key={day} style={{ position: 'relative', height, borderLeft: '1px solid #EEE9DB' }}>
              {hours.map(h => (
                <div key={h} style={{ position: 'absolute', top: (h - startHour) * 60 * pxPerMin, width: '100%', borderTop: '1px solid #F4F1E6' }} />
              ))}
              {entries.filter(e => e.day === day).map(e => {
                const course = courses.find(c => c.id === e.courseId);
                const entryColor = e.color || (course ? course.color : '#999');
                const top = (timeToMinutes(e.startTime) - startHour * 60) * pxPerMin;
                const h = Math.max((timeToMinutes(e.endTime) - timeToMinutes(e.startTime)) * pxPerMin, 20);
                const isSelected = e.id === selectedId;
                return (
                  <div
                    key={e.id}
                    onClick={() => setSelectedId(sel => sel === e.id ? null : e.id)}
                    style={{
                      position: 'absolute', top, height: h, left: 2, right: 2, borderRadius: 6,
                      background: entryColor, color: '#fff', padding: '3px 6px',
                      fontSize: 10.5, overflow: 'hidden', lineHeight: 1.25, cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 0 2px #22392D' : 'none',
                    }}
                  >
                    <div className="gt-mono" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {course ? course.code : '?'}
                      {e.meetingLink && (
                        <a
                          href={e.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          title="Join meeting"
                          onClick={ev => ev.stopPropagation()}
                          style={{ color: 'inherit', display: 'inline-flex', opacity: 0.9 }}
                        >
                          <Video size={10} />
                        </a>
                      )}
                    </div>
                    <div style={{ opacity: 0.9 }}>{formatTime(e.startTime)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="gt-sched-popover">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: selected.color || (selectedCourse ? selectedCourse.color : '#999'), flexShrink: 0, marginTop: 5 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#22392D', overflowWrap: 'break-word' }}>{selectedCourse ? selectedCourse.name : 'Unknown Course'}</div>
              <div className="gt-mono" style={{ fontSize: 11.5, color: '#8A8A7E' }}>{selectedCourse ? selectedCourse.code : ''}</div>
            </div>
            <IconButton icon={X} onClick={() => setSelectedId(null)} title="Close" />
          </div>
          <div className="gt-mono" style={{ fontSize: 12.5, color: '#4A5048' }}>{selected.day} · {formatTime(selected.startTime)} – {formatTime(selected.endTime)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#4A5048' }}>
            {selectedOnline ? <Video size={13} /> : <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#B0AA98' }} />}
            {selected.room ? selected.room : selectedOnline ? 'Online' : 'No room set'}
          </div>
          {selectedOnline && selected.meetingLink && (
            <a
              href={selected.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="gt-mono"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#3B5BA9', textDecoration: 'none', fontWeight: 600 }}
            >
              <Video size={13} /> Join meeting
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function DayChips({ selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {DAYS.map(d => {
        const isOn = selected.includes(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => onToggle(d)}
            className="gt-mono"
            style={{
              padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              border: isOn ? '1.5px solid #2D5240' : '1.5px solid #DDD6C4',
              background: isOn ? '#2D5240' : '#FCFBF7',
              color: isOn ? '#F5F7F3' : '#4A5048',
            }}
          >
            {d.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}

function isOnlineRoom(room) {
  return (room || '').trim().toLowerCase().includes('online');
}

// Shifts a "HH:MM" time forward by a number of minutes, clamped to the same day (00:00–23:59).
function addMinutesToTime(hhmm, mins) {
  const total = Math.min(Math.max(timeToMinutes(hhmm) + mins, 0), 23 * 60 + 59);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Returns an error message if the time range is invalid (end at/before start), or null if it's fine.
function timeRangeError(startTime, endTime) {
  if (!startTime || !endTime) return null;
  return timeToMinutes(endTime) <= timeToMinutes(startTime) ? 'End time must be after start time.' : null;
}

// When the start time changes, keep the block's duration and push the end time later so the
// range stays valid instead of silently producing an end-before-start block.
function applyStartTimeChange(block, newStart) {
  const oldDuration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
  const duration = oldDuration > 0 ? oldDuration : 60;
  let endTime = block.endTime;
  if (timeToMinutes(endTime) <= timeToMinutes(newStart)) {
    endTime = addMinutesToTime(newStart, duration);
  }
  return { ...block, startTime: newStart, endTime };
}

export default function ManageSchedule({ data, addScheduleEntries, deleteSchedule, deleteScheduleGroup, updateScheduleGroup }) {
  const currentTerm = getCurrentTerm(data.terms);
  const courseIds = currentTerm ? (data.termCourses[currentTerm.id] || []) : [];
  const termCourses = courseIds.map(id => data.courses.find(c => c.id === id)).filter(Boolean);
  const entries = currentTerm ? data.schedule.filter(s => s.termId === currentTerm.id) : [];

  const [courseId, setCourseId] = useState(termCourses[0] ? termCourses[0].id : '');
  const courseColor = (termCourses.find(c => c.id === courseId) || {}).color || COURSE_COLORS[0].hex;

  const blockBlank = (color) => ({
    key: uid(),
    days: [], startTime: '09:00', endTime: '10:00', room: '', meetingLink: '', color: color || courseColor,
  });
  const [blocks, setBlocks] = useState([blockBlank(courseColor)]);
  const [showForm, setShowForm] = useState(false);

  const [editingKey, setEditingKey] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  function startEdit(g) {
    setEditingKey(g.key);
    setEditDraft({
      days: g.members.map(m => m.day),
      startTime: g.startTime,
      endTime: g.endTime,
      room: g.room,
      meetingLink: g.meetingLink,
      color: g.color,
    });
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditDraft(null);
  }

  function updateEditDraft(patch) {
    setEditDraft(d => (patch.startTime !== undefined ? applyStartTimeChange(d, patch.startTime) : { ...d, ...patch }));
  }

  function toggleEditDay(day) {
    setEditDraft(d => ({
      ...d,
      days: d.days.includes(day) ? d.days.filter(x => x !== day) : [...d.days, day],
    }));
  }

  function saveEdit(g) {
    if (!editDraft || editDraft.days.length === 0 || timeRangeError(editDraft.startTime, editDraft.endTime)) return;
    const meetingLink = isOnlineRoom(editDraft.room) ? (editDraft.meetingLink || '').trim() : '';
    updateScheduleGroup(g.groupId, g.members[0].id, { ...editDraft, meetingLink });
    setEditingKey(null);
    setEditDraft(null);
  }

  useEffect(() => {
    setCourseId(cid => termCourses.find(c => c.id === cid) ? cid : (termCourses[0] ? termCourses[0].id : ''));
  }, [currentTerm, termCourses]);

  function updateBlock(key, patch) {
    setBlocks(bs => bs.map(b => {
      if (b.key !== key) return b;
      return patch.startTime !== undefined ? applyStartTimeChange(b, patch.startTime) : { ...b, ...patch };
    }));
  }

  function toggleDay(key, day) {
    setBlocks(bs => bs.map(b => (b.key === key
      ? { ...b, days: b.days.includes(day) ? b.days.filter(d => d !== day) : [...b.days, day] }
      : b)));
  }

  function addBlock() {
    setBlocks(bs => [...bs, blockBlank(courseColor)]);
  }

  function removeBlock(key) {
    setBlocks(bs => (bs.length > 1 ? bs.filter(b => b.key !== key) : bs));
  }

  const blocksWithDays = blocks.filter(b => b.days.length > 0);
  const invalidBlocks = blocksWithDays.filter(b => timeRangeError(b.startTime, b.endTime));
  const validBlocks = blocksWithDays.filter(b => !timeRangeError(b.startTime, b.endTime));
  const canSubmit = !!courseId && validBlocks.length > 0 && invalidBlocks.length === 0 && !!currentTerm;

  function submit() {
    if (!canSubmit) return;
    const newEntries = [];
    validBlocks.forEach(b => {
      const groupId = uid();
      const meetingLink = isOnlineRoom(b.room) ? b.meetingLink.trim() : '';
      b.days.forEach(day => {
        newEntries.push({
          id: uid(), groupId, termId: currentTerm.id, courseId,
          day, startTime: b.startTime, endTime: b.endTime, room: b.room, meetingLink, color: b.color,
        });
      });
    });
    addScheduleEntries(newEntries);
    setBlocks([blockBlank(courseColor)]);
  }

  const groups = [];
  const seenGroups = new Set();
  entries.forEach(e => {
    const key = e.groupId || e.id;
    if (seenGroups.has(key)) return;
    seenGroups.add(key);
    const members = e.groupId ? entries.filter(x => x.groupId === e.groupId) : [e];
    const course = data.courses.find(c => c.id === e.courseId);
    groups.push({
      key,
      groupId: e.groupId || null,
      courseId: e.courseId,
      startTime: e.startTime,
      endTime: e.endTime,
      room: e.room,
      meetingLink: e.meetingLink,
      color: e.color || (course ? course.color : '#999'),
      members: members.slice().sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)),
    });
  });
  groups.sort((a, b) =>
    DAYS.indexOf(a.members[0].day) - DAYS.indexOf(b.members[0].day) ||
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  function deleteGroup(g) {
    if (g.groupId) deleteScheduleGroup(g.groupId);
    else deleteSchedule(g.members[0].id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>Manage Schedule</Eyebrow>
        <h1 className="gt-serif gt-page-title" style={{ fontSize: 30, margin: '4px 0 18px', color: '#22392D' }}>
          {currentTerm ? currentTerm.name : 'No Active Term'}
        </h1>
      </div>

      {!currentTerm ? (
        <EmptyState icon={Clock3} title="Break Mode" subtitle="Scheduling is only available while a term is active." />
      ) : termCourses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses in this term" subtitle="Assign courses to this term in Manage Term first." />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <Eyebrow>Time Blocks</Eyebrow>
            <PrimaryButton onClick={() => setShowForm(s => !s)} icon={showForm ? X : Settings}>
              {showForm ? 'Close' : 'Manage'}
            </PrimaryButton>
          </div>

          {showForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="gt-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Eyebrow>Course</Eyebrow>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 160 }}>
                  <select
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    style={{ padding: '9px 11px', borderRadius: 8, border: '1.5px solid #DDD6C4', fontSize: 14, background: '#FCFBF7', color: '#2A2E28' }}
                  >
                    {termCourses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                  </select>
                </label>
                <div style={{ fontSize: 12, color: '#8A8A7E' }}>
                  All time blocks below are for this course. Add another time to give it a different day/time, room, or color.
                </div>
              </div>

              {blocks.map((b, i) => {
                const online = isOnlineRoom(b.room);
                const timeError = timeRangeError(b.startTime, b.endTime);
                return (
                  <div key={b.key} className="gt-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Eyebrow>Time {i + 1}</Eyebrow>
                      {blocks.length > 1 && (
                        <IconButton icon={X} onClick={() => removeBlock(b.key)} title="Remove this time" danger />
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <TextField label="Start" type="time" value={b.startTime} onChange={v => updateBlock(b.key, { startTime: v })} mono />
                      <TextField label="End" type="time" value={b.endTime} onChange={v => updateBlock(b.key, { endTime: v })} mono />
                      <TextField label="Room" value={b.room} onChange={v => updateBlock(b.key, { room: v })} placeholder='e.g. Rm 204 or "Online"' />
                    </div>
                    {timeError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#B23A2E' }}>
                        <AlertCircle size={14} /> {timeError}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600 }}>
                        Days {b.days.length > 0 && `(${b.days.length} selected)`}
                      </span>
                      <DayChips selected={b.days} onToggle={day => toggleDay(b.key, day)} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600 }}>Color</span>
                      <ColorSwatchPicker value={b.color} onChange={v => updateBlock(b.key, { color: v })} />
                    </div>

                    {online && (
                      <TextField
                        label="Meeting Link"
                        type="url"
                        value={b.meetingLink}
                        onChange={v => updateBlock(b.key, { meetingLink: v })}
                        placeholder="https://zoom.us/j/…"
                      />
                    )}
                  </div>
                );
              })}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <PrimaryButton onClick={addBlock} icon={Plus} style={{ background: '#FCFBF7', color: '#2D5240', border: '1.5px solid #DDD6C4' }}>
                  Add Another Time
                </PrimaryButton>
                <PrimaryButton onClick={submit} icon={Check} style={!canSubmit ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
                  Add to Schedule
                </PrimaryButton>
                {invalidBlocks.length > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#B23A2E' }}>
                    <AlertCircle size={14} /> Fix the invalid time range above before adding.
                  </span>
                )}
              </div>
            </div>
          )}

          <ScheduleGrid entries={entries} courses={data.courses} />

          <div>
            <Eyebrow>All entries</Eyebrow>
            {groups.length === 0 ? (
              <EmptyState icon={Clock3} title="No schedule yet" subtitle="Add a time block above." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {groups.map(g => {
                  const course = data.courses.find(c => c.id === g.courseId);
                  const dayLabel = g.members.map(m => m.day.slice(0, 3)).join(', ');

                  if (editingKey === g.key && editDraft) {
                    const editOnline = isOnlineRoom(editDraft.room);
                    const editTimeError = timeRangeError(editDraft.startTime, editDraft.endTime);
                    return (
                      <div key={g.key} className="gt-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Eyebrow>Editing · {course ? course.code : 'Unknown'}</Eyebrow>
                          <IconButton icon={X} onClick={cancelEdit} title="Cancel" />
                        </div>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <TextField label="Start" type="time" value={editDraft.startTime} onChange={v => updateEditDraft({ startTime: v })} mono />
                          <TextField label="End" type="time" value={editDraft.endTime} onChange={v => updateEditDraft({ endTime: v })} mono />
                          <TextField label="Room" value={editDraft.room} onChange={v => updateEditDraft({ room: v })} placeholder='e.g. Rm 204 or "Online"' />
                        </div>
                        {editTimeError && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#B23A2E' }}>
                            <AlertCircle size={14} /> {editTimeError}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600 }}>
                            Days {editDraft.days.length > 0 && `(${editDraft.days.length} selected)`}
                          </span>
                          <DayChips selected={editDraft.days} onToggle={toggleEditDay} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600 }}>Color</span>
                          <ColorSwatchPicker value={editDraft.color} onChange={v => updateEditDraft({ color: v })} />
                        </div>

                        {editOnline && (
                          <TextField
                            label="Meeting Link"
                            type="url"
                            value={editDraft.meetingLink}
                            onChange={v => updateEditDraft({ meetingLink: v })}
                            placeholder="https://zoom.us/j/…"
                          />
                        )}

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <PrimaryButton
                            onClick={() => saveEdit(g)}
                            icon={Check}
                            style={(editDraft.days.length === 0 || editTimeError) ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                          >
                            Save Changes
                          </PrimaryButton>
                          <PrimaryButton onClick={cancelEdit} style={{ background: '#FCFBF7', color: '#4A5048', border: '1.5px solid #DDD6C4' }}>
                            Cancel
                          </PrimaryButton>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={g.key} className="gt-card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div className="gt-mono" style={{ fontSize: 12, minWidth: 110, color: '#4A5048', fontWeight: 600 }}>{dayLabel}</div>
                      <div className="gt-mono" style={{ fontSize: 12.5, minWidth: 140, color: '#4A5048' }}>{formatTime(g.startTime)} – {formatTime(g.endTime)}</div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                      <div style={{ fontSize: 14, color: '#2A2E28', flex: 1, minWidth: 120 }}>{course ? course.name : 'Unknown'}</div>
                      {g.room && <div style={{ fontSize: 12.5, color: '#8A8A7E' }}>{g.room}</div>}
                      {g.meetingLink && (
                        <a
                          href={g.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="gt-mono"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#3B5BA9', textDecoration: 'none', fontWeight: 600 }}
                        >
                          <Video size={13} /> Join
                        </a>
                      )}
                      <IconButton icon={Pencil} onClick={() => startEdit(g)} title="Edit" />
                      <IconButton icon={Trash2} onClick={() => deleteGroup(g)} title="Delete" danger />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}