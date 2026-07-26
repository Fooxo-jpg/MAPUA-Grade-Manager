import React, { useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEY, defaultData, findCourseTermId, uid, SIDEBAR_THEMES } from './utils';
import { supabase, GRADEBOOK_TABLE } from './supabaseClient';
import { getNewItemHandler } from './shortcutRegistry';

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

  // ---- Auth / cloud sync state ----
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out
  const [cloudStatus, setCloudStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [cloudError, setCloudError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const dirtyRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Load the locally-cached copy immediately so the UI is instant & works
  // offline, then reconcile with Supabase once we know who's signed in.
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

  // Track the Supabase auth session.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Pushes the given (or current) data up to Supabase. Safe to call manually
  // (the "Sync Now" button) or from the auto-save interval.
  const syncNow = useCallback(async (explicitData) => {
    if (!supabase || !session) return;
    const payload = explicitData || dataRef.current;
    setCloudStatus('syncing');
    try {
      const { error } = await supabase
        .from(GRADEBOOK_TABLE)
        .upsert({ user_id: session.user.id, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      dirtyRef.current = false;
      setLastSyncedAt(new Date());
      setCloudStatus('synced');
      setCloudError('');
    } catch (err) {
      setCloudStatus('error');
      setCloudError(err.message || 'Sync failed.');
    }
  }, [session]);

  // On sign-in, pull the cloud copy (if any) and reconcile with local storage
  // by keeping whichever was updated most recently.
  useEffect(() => {
    if (!supabase || !session) return;
    let cancelled = false;
    (async () => {
      setCloudStatus('syncing');
      try {
        const { data: row, error } = await supabase
          .from(GRADEBOOK_TABLE)
          .select('data, updated_at')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;

        const localRaw = localStorage.getItem(STORAGE_KEY);
        const localParsed = localRaw ? JSON.parse(localRaw) : null;
        const localUpdatedAt = localParsed && localParsed.__updatedAt ? new Date(localParsed.__updatedAt) : null;
        const cloudUpdatedAt = row ? new Date(row.updated_at) : null;

        const cloudIsNewer = cloudUpdatedAt && (!localUpdatedAt || cloudUpdatedAt > localUpdatedAt);
        if (row && cloudIsNewer) {
          const merged = { ...defaultData, ...row.data, account: { ...defaultData.account, ...(row.data.account || {}) } };
          setData(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...merged, __updatedAt: row.updated_at }));
          setLastSyncedAt(new Date(row.updated_at));
        } else {
          // Local copy is newer (or nothing exists in the cloud yet) — push it up.
          await syncNow(dataRef.current);
        }
        setCloudStatus('synced');
        setCloudError('');
      } catch (err) {
        if (!cancelled) {
          setCloudStatus('error');
          setCloudError(err.message || 'Could not reach Supabase.');
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, syncNow]);

  // Auto-save to the cloud on the interval the user picked in Data Manager.
  // "No auto-save" (0) means the user has to hit "Sync Now" themselves.
  useEffect(() => {
    const minutes = Number(data.account.autoSaveMinutes || 0);
    if (!supabase || !session || !minutes) return;
    const id = setInterval(() => {
      if (dirtyRef.current) syncNow();
    }, minutes * 60 * 1000);
    return () => clearInterval(id);
  }, [data.account.autoSaveMinutes, session, syncNow]);

  // Best-effort: try to flush any unsynced changes right before the window closes.
  useEffect(() => {
    const handler = () => { if (dirtyRef.current) syncNow(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [syncNow]);

  // Global "create new" shortcut. Ctrl+N (Cmd+N on Mac) opens the relevant
  // add form for whichever page is currently active — new course on Manage
  // Courses, new assessment on Manage Grades, new time block on Manage
  // Schedule, etc. Each page registers its own handler (see shortcutRegistry.js).
  useEffect(() => {
    function onKeyDown(e) {
      const isNewShortcut = (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'n' || e.key === 'N');
      if (!isNewShortcut) return;
      const handler = getNewItemHandler(active);
      if (handler) {
        e.preventDefault();
        handler();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  const signOut = useCallback(async () => {
    if (dirtyRef.current) await syncNow();
    if (supabase) await supabase.auth.signOut();
  }, [syncNow]);

  // Local save stays instant & debounced (this is the "every change" save —
  // it keeps working offline and is what makes the UI feel snappy). Cloud
  // sync is separate and follows the auto-save interval above.
  const persist = useCallback((next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, __updatedAt: new Date().toISOString() }));
      } catch (e) {
        console.error('Failed to save', e);
      }
    }, 350);
    dirtyRef.current = true;
  }, []);

  const update = useCallback((fn) => {
    setData(prev => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, [persist]);

  const addCourse = (course) => update(d => ({ ...d, courses: [...d.courses, course] }));
  // Appends many courses at once (CSV/Excel bulk import) rather than one at a time.
  const importCourses = (courses) => update(d => ({ ...d, courses: [...d.courses, ...courses] }));
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
    // Same preset also drives the app-wide accent used for highlights on
    // every page (GWA figures, "current" badges, chart lines, etc.), so
    // changing the color scheme updates more than just the side panel.
    '--c-accent': sidebarPreset.accent,
    '--c-accent-bright': sidebarPreset.accentBright,
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
        {active === 'data' && (
          <DataManager
            data={data}
            importData={importData}
            importCourses={importCourses}
            updateAccount={updateAccount}
            resetAllData={resetAllData}
            session={session}
            onSignedIn={setSession}
            userEmail={session ? session.user.email : null}
            cloudStatus={cloudStatus}
            cloudError={cloudError}
            lastSyncedAt={lastSyncedAt}
            syncNow={() => syncNow()}
            signOut={signOut}
          />
        )}
        {active === 'account' && <AccountSettings data={data} updateAccount={updateAccount} addTerm={addTerm} updateTerm={updateTerm} deleteTerm={deleteTerm} clearAllTerms={clearAllTerms} />}
      </div>
    </div>
  );
}