import React, { useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEY, defaultData, findCourseTermId, uid, SIDEBAR_THEMES } from './utils';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ManageGrades from './components/ManageGrades';
import ManageCourses from './components/ManageCourses';
import ManageTerm from './components/ManageTerm';
import ManageSchedule from './components/ManageSchedule';
import DataManager from './components/DataManager';
import AccountSettings from './components/AccountSettings';

import './App.css';

export default function App() {
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({ ...defaultData, ...parsed, account: { ...defaultData.account, ...(parsed.account || {}) } });
      }
    } catch (e) {
      // no existing data yet
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = useCallback((next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save', e);
      }
    }, 350);
  }, []);

  const update = useCallback((fn) => {
    setData(prev => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, [persist]);

  const addCourse = (course) => update(d => ({ ...d, courses: [...d.courses, course] }));
  const updateCourse = (id, patch) => update(d => ({ ...d, courses: d.courses.map(c => c.id === id ? { ...c, ...patch } : c) }));
  const deleteCourse = (id) => update(d => {
    const termCourses = {};
    Object.keys(d.termCourses).forEach(tid => { termCourses[tid] = d.termCourses[tid].filter(cid => cid !== id); });
    const grades = {};
    Object.keys(d.grades).forEach(tid => {
      const { [id]: _removed, ...rest } = d.grades[tid] || {};
      grades[tid] = rest;
    });
    const courses = d.courses
      .filter(c => c.id !== id)
      .map(c => ({
        ...c,
        prerequisites: (c.prerequisites || []).filter(pid => pid !== id),
        corequisites: (c.corequisites || []).filter(pid => pid !== id),
      }));
    return { ...d, courses, termCourses, grades, schedule: d.schedule.filter(s => s.courseId !== id) };
  });

  const addTerm = (term) => update(d => ({ ...d, terms: [...d.terms, term] }));
  const updateTerm = (id, patch) => update(d => ({ ...d, terms: d.terms.map(t => t.id === id ? { ...t, ...patch } : t) }));
  const deleteTerm = (id) => update(d => {
    const termCourses = { ...d.termCourses };
    delete termCourses[id];
    const grades = { ...d.grades };
    delete grades[id];
    return { ...d, terms: d.terms.filter(t => t.id !== id), termCourses, grades, schedule: d.schedule.filter(s => s.termId !== id) };
  });
  const clearAllTerms = () => update(d => ({
    ...d, terms: [], termCourses: {}, grades: {}, schedule: [], assessments: {},
  }));
  const resetAllData = () => update(() => defaultData);

  const importData = (parsed) => update(() => ({
    ...defaultData,
    ...parsed,
    account: { ...defaultData.account, ...(parsed.account || {}) },
  }));

  const toggleCourseInTerm = (termId, courseId) => update(d => {
    const current = d.termCourses[termId] || [];
    const alreadyHere = current.includes(courseId);
    if (!alreadyHere && findCourseTermId(d.termCourses, courseId, termId)) {
      return d;
    }
    const next = alreadyHere ? current.filter(id => id !== courseId) : [...current, courseId];
    const grades = { ...d.grades };
    if (alreadyHere) {
      const termGrades = { ...(grades[termId] || {}) };
      delete termGrades[courseId];
      grades[termId] = termGrades;
    }
    return { ...d, termCourses: { ...d.termCourses, [termId]: next }, grades };
  });

  const updateGrade = (termId, courseId, value) => update(d => ({
    ...d,
    grades: { ...d.grades, [termId]: { ...(d.grades[termId] || {}), [courseId]: value } },
  }));

  const addScheduleEntries = (entries) => update(d => ({ ...d, schedule: [...d.schedule, ...entries] }));
  const deleteSchedule = (id) => update(d => ({ ...d, schedule: d.schedule.filter(s => s.id !== id) }));
  const deleteScheduleGroup = (groupId) => update(d => ({ ...d, schedule: d.schedule.filter(s => s.groupId !== groupId) }));

  const updateScheduleGroup = (groupId, entryId, patch) => update(d => {
    if (groupId) {
      const original = d.schedule.find(s => s.groupId === groupId);
      if (!original) return d;
      const rest = d.schedule.filter(s => s.groupId !== groupId);
      const newEntries = patch.days.map(day => ({
        id: uid(), groupId, termId: original.termId, courseId: original.courseId,
        day, startTime: patch.startTime, endTime: patch.endTime, room: patch.room,
        meetingLink: patch.meetingLink, color: patch.color,
      }));
      return { ...d, schedule: [...rest, ...newEntries] };
    }
    const day = patch.days[0];
    return {
      ...d,
      schedule: d.schedule.map(s => (s.id === entryId
        ? { ...s, day, startTime: patch.startTime, endTime: patch.endTime, room: patch.room, meetingLink: patch.meetingLink, color: patch.color }
        : s)),
    };
  });

  const updateAccount = (patch) => update(d => ({ ...d, account: { ...d.account, ...patch } }));

  const addAssessment = (termId, courseId, assessment) => update(d => {
    const termBucket = { ...(d.assessments[termId] || {}) };
    const list = termBucket[courseId] || [];
    termBucket[courseId] = [...list, assessment];
    return { ...d, assessments: { ...d.assessments, [termId]: termBucket } };
  });
  const updateAssessment = (termId, courseId, assessmentId, patch) => update(d => {
    const termBucket = { ...(d.assessments[termId] || {}) };
    const list = termBucket[courseId] || [];
    termBucket[courseId] = list.map(a => a.id === assessmentId ? { ...a, ...patch } : a);
    return { ...d, assessments: { ...d.assessments, [termId]: termBucket } };
  });
  const deleteAssessment = (termId, courseId, assessmentId) => update(d => {
    const termBucket = { ...(d.assessments[termId] || {}) };
    const list = termBucket[courseId] || [];
    termBucket[courseId] = list.filter(a => a.id !== assessmentId);
    return { ...d, assessments: { ...d.assessments, [termId]: termBucket } };
  });

  const studentName = [data.account.firstName, data.account.lastName].filter(Boolean).join(' ');

  const theme = data.account.theme || 'light';
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const sidebarPreset = SIDEBAR_THEMES.find(t => t.id === (data.account.sidebarTheme || 'forest')) || SIDEBAR_THEMES[0];
  const sidebarVars = {
    '--c-sidebar-from': sidebarPreset.from,
    '--c-sidebar-to': sidebarPreset.to,
    '--c-sidebar-accent': sidebarPreset.accent,
    '--c-sidebar-accent-bright': sidebarPreset.accentBright,
  };

  if (!loaded) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        height: '100vh', fontFamily: 'Inter, sans-serif', color: 'var(--c-text-muted)', background: 'var(--c-bg)',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', border: '2.5px solid var(--c-border-strong)',
          borderTopColor: 'var(--c-forest)', animation: 'gt-spin 0.7s linear infinite',
        }} />
        <span className="gt-mono" style={{ fontSize: 12.5, letterSpacing: '0.04em' }}>Loading your gradebook…</span>
        <style>{'@keyframes gt-spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    );
  }

  return (
    <div className="gt-root" style={{ height: '100vh', ...sidebarVars }}>
      <Sidebar active={active} setActive={setActive} studentName={studentName} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="gt-main">
        {active === 'dashboard' && <Dashboard data={data} />}
        {active === 'grades' && <ManageGrades data={data} addAssessment={addAssessment} updateAssessment={updateAssessment} deleteAssessment={deleteAssessment} updateGrade={updateGrade} updateCourse={updateCourse} />}
        {active === 'courses' && <ManageCourses data={data} addCourse={addCourse} updateCourse={updateCourse} deleteCourse={deleteCourse} />}
        {active === 'term' && <ManageTerm data={data} toggleCourseInTerm={toggleCourseInTerm} updateGrade={updateGrade} />}
        {active === 'schedule' && <ManageSchedule data={data} addScheduleEntries={addScheduleEntries} deleteSchedule={deleteSchedule} deleteScheduleGroup={deleteScheduleGroup} updateScheduleGroup={updateScheduleGroup} />}
        {active === 'data' && <DataManager data={data} importData={importData} />}
        {active === 'account' && <AccountSettings data={data} updateAccount={updateAccount} addTerm={addTerm} updateTerm={updateTerm} deleteTerm={deleteTerm} clearAllTerms={clearAllTerms} resetAllData={resetAllData} />}
      </div>
    </div>
  );
}