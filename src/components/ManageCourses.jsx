import React, { useState } from 'react';
import { BookOpen, Plus, Check, X, Pencil, Trash2, Tag } from 'lucide-react';
import { COURSE_COLORS, COURSE_TYPES, uid, getCourseStatus } from '../utils';
import { Eyebrow, EmptyState, TextField, CoursePicker, ColorSwatchPicker, PrimaryButton, IconButton } from './SharedUI';

const STATUS_META = {
  taken: { label: 'Taken', color: '#2D5240', bg: 'rgba(45,82,64,0.1)' },
  current: { label: 'In Current Load', color: '#3B5BA9', bg: 'rgba(59,91,169,0.1)' },
  'not-yet': { label: 'Not Yet Taken', color: '#8A8A7E', bg: 'rgba(0,0,0,0.05)' },
};

function CategoryEditor({ categories, onChange }) {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');

  function add() {
    if (!name.trim() || weight === '') return;
    onChange([...categories, { id: uid(), name: name.trim(), weight }]);
    setName('');
    setWeight('');
  }

  function remove(id) {
    onChange(categories.filter(cat => cat.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <span
              key={cat.id}
              className="gt-mono"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#4A5048', background: 'rgba(0,0,0,0.04)', padding: '3px 6px 3px 10px', borderRadius: 20 }}
            >
              {cat.name} · {cat.weight}%
              <button onClick={() => remove(cat.id)} title="Remove category" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#B23A2E', display: 'inline-flex', padding: 2 }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Category name (e.g. Quizzes)"
          className="gt-mono" style={{ padding: '7px 9px', borderRadius: 7, border: '1.5px solid #DDD6C4', fontSize: 12.5, background: '#FCFBF7', color: '#2A2E28', width: 180 }}
        />
        <input
          type="text" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Weight %"
          className="gt-mono" style={{ padding: '7px 9px', borderRadius: 7, border: '1.5px solid #DDD6C4', fontSize: 12.5, background: '#FCFBF7', color: '#2A2E28', width: 90, textAlign: 'center' }}
        />
        <IconButton icon={Plus} onClick={add} title="Add category" />
      </div>
    </div>
  );
}

export default function ManageCourses({ data, addCourse, updateCourse, deleteCourse }) {
  const blank = {
    code: '', name: '', units: '', instructor: '', color: COURSE_COLORS[0].hex, courseType: COURSE_TYPES[0].name,
    prerequisites: [], corequisites: [], useCategoryWeights: false, categories: [], unitsConsidered: true,
  };
  const [form, setForm] = useState(blank);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(blank);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const canSubmit = form.code.trim() && form.name.trim();

  function submit() {
    if (!canSubmit) return;
    addCourse({ ...form, id: uid(), units: form.units || 0 });
    setForm(blank);
    setShowAddForm(false);
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditForm({ prerequisites: [], corequisites: [], courseType: COURSE_TYPES[0].name, useCategoryWeights: false, categories: [], unitsConsidered: true, ...c });
  }

  function saveEdit() {
    updateCourse(editForm.id, editForm);
    setEditingId(null);
  }

  function toggleFormPrereq(id) {
    setForm(f => ({ ...f, prerequisites: f.prerequisites.includes(id) ? f.prerequisites.filter(x => x !== id) : [...f.prerequisites, id] }));
  }
  function toggleFormCoreq(id) {
    setForm(f => ({ ...f, corequisites: f.corequisites.includes(id) ? f.corequisites.filter(x => x !== id) : [...f.corequisites, id] }));
  }
  function toggleEditPrereq(id) {
    setEditForm(f => ({ ...f, prerequisites: f.prerequisites.includes(id) ? f.prerequisites.filter(x => x !== id) : [...f.prerequisites, id] }));
  }
  function toggleEditCoreq(id) {
    setEditForm(f => ({ ...f, corequisites: f.corequisites.includes(id) ? f.corequisites.filter(x => x !== id) : [...f.corequisites, id] }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>Manage Courses</Eyebrow>
        <h1 className="gt-serif gt-page-title" style={{ fontSize: 30, margin: '4px 0 18px', color: '#22392D' }}>Course Catalog</h1>

        {!showAddForm ? (
          <PrimaryButton onClick={() => setShowAddForm(true)} icon={Plus}>Add New Course</PrimaryButton>
        ) : (
        <div className="gt-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Eyebrow>New Course</Eyebrow>
            <IconButton icon={X} onClick={() => { setShowAddForm(false); setForm(blank); }} title="Cancel" />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <TextField label="Code" value={form.code} onChange={v => setForm({ ...form, code: v })} placeholder="CS101" mono />
            <TextField label="Course Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Intro to Programming" />
            <TextField label="Units" value={form.units} onChange={v => setForm({ ...form, units: v.replace(/[^0-9.]/g, '') })} placeholder="3" mono />
            <TextField label="Instructor" value={form.instructor} onChange={v => setForm({ ...form, instructor: v })} placeholder="Optional" />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 160 }}>
              <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600 }}>Course Type</span>
              <select
                value={form.courseType}
                onChange={e => setForm({ ...form, courseType: e.target.value })}
                style={{ padding: '9px 11px', borderRadius: 8, border: '1.5px solid #DDD6C4', fontSize: 14, background: '#FCFBF7', color: '#2A2E28' }}
              >
                {COURSE_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            <CoursePicker label="Prerequisites" options={data.courses} selectedIds={form.prerequisites} onToggle={toggleFormPrereq} />
            <CoursePicker label="Co-requisites" options={data.courses} selectedIds={form.corequisites} onToggle={toggleFormCoreq} />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.unitsConsidered}
                onChange={e => setForm({ ...form, unitsConsidered: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#2D5240', cursor: 'pointer' }}
              />
              <span className="gt-mono" style={{ fontSize: 11.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, color: '#4A5048' }}>
                Units Considered (counts toward GWA)
              </span>
            </label>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.useCategoryWeights}
                onChange={e => setForm({ ...form, useCategoryWeights: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#2D5240', cursor: 'pointer' }}
              />
              <span className="gt-mono" style={{ fontSize: 11.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, color: '#4A5048', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Tag size={12} /> Use category weights
              </span>
            </label>
            {form.useCategoryWeights && (
              <CategoryEditor categories={form.categories} onChange={cats => setForm({ ...form, categories: cats })} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600, marginBottom: 6 }}>Color</div>
              <ColorSwatchPicker value={form.color} onChange={v => setForm({ ...form, color: v })} />
            </div>
            <PrimaryButton onClick={submit} icon={Plus} style={{ opacity: canSubmit ? 1 : 0.5 }}>Add Course</PrimaryButton>
          </div>
        </div>
        )}
      </div>

      <div>
        <Eyebrow>All Courses ({data.courses.length})</Eyebrow>
        {data.courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses yet" subtitle="Add your first course above to get started." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {data.courses.map(c => (
              <div key={c.id} className="gt-card" style={{ padding: 14, borderLeft: `5px solid ${c.color}` }}>
                {editingId === c.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <TextField label="Code" value={editForm.code} onChange={v => setEditForm({ ...editForm, code: v })} mono />
                      <TextField label="Course Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
                      <TextField label="Units" value={editForm.units} onChange={v => setEditForm({ ...editForm, units: v.replace(/[^0-9.]/g, '') })} mono />
                      <TextField label="Instructor" value={editForm.instructor} onChange={v => setEditForm({ ...editForm, instructor: v })} />
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 160 }}>
                        <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600 }}>Course Type</span>
                        <select
                          value={editForm.courseType}
                          onChange={e => setEditForm({ ...editForm, courseType: e.target.value })}
                          style={{ padding: '9px 11px', borderRadius: 8, border: '1.5px solid #DDD6C4', fontSize: 14, background: '#FCFBF7', color: '#2A2E28' }}
                        >
                          {COURSE_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                        </select>
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <CoursePicker label="Prerequisites" options={data.courses.filter(o => o.id !== c.id)} selectedIds={editForm.prerequisites || []} onToggle={toggleEditPrereq} />
                      <CoursePicker label="Co-requisites" options={data.courses.filter(o => o.id !== c.id)} selectedIds={editForm.corequisites || []} onToggle={toggleEditCoreq} />
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editForm.unitsConsidered}
                          onChange={e => setEditForm({ ...editForm, unitsConsidered: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: '#2D5240', cursor: 'pointer' }}
                        />
                        <span className="gt-mono" style={{ fontSize: 11.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, color: '#4A5048' }}>
                          Units Considered (counts toward GWA)
                        </span>
                      </label>
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editForm.useCategoryWeights}
                          onChange={e => setEditForm({ ...editForm, useCategoryWeights: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: '#2D5240', cursor: 'pointer' }}
                        />
                        <span className="gt-mono" style={{ fontSize: 11.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, color: '#4A5048', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Tag size={12} /> Use category weights
                        </span>
                      </label>
                      {editForm.useCategoryWeights && (
                        <CategoryEditor categories={editForm.categories || []} onChange={cats => setEditForm({ ...editForm, categories: cats })} />
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <ColorSwatchPicker value={editForm.color} onChange={v => setEditForm({ ...editForm, color: v })} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <IconButton icon={Check} onClick={saveEdit} title="Save" />
                        <IconButton icon={X} onClick={() => setEditingId(null)} title="Cancel" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 70 }} className="gt-mono">
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: c.color }}>{c.code}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div className="gt-serif" style={{ fontSize: 15.5, color: '#2A2E28', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {c.name}
                          {c.courseType && (
                            <span className="gt-mono" style={{
                              fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700,
                              padding: '2px 8px', borderRadius: 20,
                              color: (COURSE_TYPES.find(t => t.name === c.courseType) || COURSE_TYPES[0]).color,
                              background: 'rgba(0,0,0,0.04)',
                            }}>{c.courseType}</span>
                          )}
                          {(() => {
                            const status = getCourseStatus(c, data.terms, data.termCourses, data.grades, data.assessments, data.account);
                            const meta = status && STATUS_META[status];
                            return meta ? (
                              <span className="gt-mono" style={{
                                fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700,
                                padding: '2px 8px', borderRadius: 20, color: meta.color, background: meta.bg,
                              }}>{meta.label}</span>
                            ) : null;
                          })()}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#8A8A7E' }}>{c.units || 0} unit{c.units == 1 ? '' : 's'}{c.instructor ? ` · ${c.instructor}` : ''}</div>
                        {(c.prerequisites || []).length > 0 && (
                          <div style={{ fontSize: 12, color: '#8A8A7E', marginTop: 3 }}>
                            Prerequisites: {c.prerequisites.map(id => (data.courses.find(x => x.id === id) || {}).code || '?').join(', ')}
                          </div>
                        )}
                        {(c.corequisites || []).length > 0 && (
                          <div style={{ fontSize: 12, color: '#8A8A7E', marginTop: 2 }}>
                            Co-requisites: {c.corequisites.map(id => (data.courses.find(x => x.id === id) || {}).code || '?').join(', ')}
                          </div>
                        )}
                      </div>
                      <label title="When off, this course's units are excluded from GWA calculations regardless of grade" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={c.unitsConsidered !== false}
                          onChange={e => updateCourse(c.id, { unitsConsidered: e.target.checked })}
                          style={{ width: 15, height: 15, accentColor: '#2D5240', cursor: 'pointer' }}
                        />
                        <span className="gt-mono" style={{ fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, color: '#7C8A80' }}>
                          Units Considered
                        </span>
                      </label>
                      <label title="When on, assessments for this course are logged against weighted categories" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!c.useCategoryWeights}
                          onChange={e => updateCourse(c.id, { useCategoryWeights: e.target.checked })}
                          style={{ width: 15, height: 15, accentColor: '#2D5240', cursor: 'pointer' }}
                        />
                        <span className="gt-mono" style={{ fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, color: '#7C8A80', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Tag size={11} /> Categories
                        </span>
                      </label>
                      {confirmDeleteId === c.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12.5, color: '#B23A2E' }}>Delete?</span>
                          <IconButton icon={Check} onClick={() => { deleteCourse(c.id); setConfirmDeleteId(null); }} title="Confirm" danger />
                          <IconButton icon={X} onClick={() => setConfirmDeleteId(null)} title="Cancel" />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <IconButton icon={Pencil} onClick={() => startEdit(c)} title="Edit" />
                          <IconButton icon={Trash2} onClick={() => setConfirmDeleteId(c.id)} title="Delete" danger />
                        </div>
                      )}
                    </div>
                    {c.useCategoryWeights && (
                      <div style={{ paddingLeft: 84 }}>
                        {(c.categories || []).length > 0 ? (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {c.categories.map(cat => (
                              <span key={cat.id} className="gt-mono" style={{ fontSize: 11, fontWeight: 600, color: '#4A5048', background: 'rgba(0,0,0,0.04)', padding: '3px 9px', borderRadius: 20 }}>
                                {cat.name} · {cat.weight}%
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11.5, color: '#B0AA98', fontStyle: 'italic' }}>
                            No categories yet — add one while logging an assessment in Manage Grades, or edit this course.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}