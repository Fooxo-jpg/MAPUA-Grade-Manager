export const STORAGE_KEY = 'grade-tracker-data-v1';
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const COURSE_COLORS = [
  { name: 'Ledger',      hex: '#2D5240' },
  { name: 'Pen Red',     hex: '#B23A2E' },
  { name: 'Highlighter', hex: '#B8860B' },
  { name: 'Ink Blue',    hex: '#3B5BA9' },
  { name: 'Plum',        hex: '#7A4FA3' },
  { name: 'Manila',      hex: '#C97B3D' },
];

// Preset color schemes for the sidebar (side panel). Each defines the
// top-to-bottom gradient and the accent used for the active nav item / logo.
export const SIDEBAR_THEMES = [
  { id: 'forest',   name: 'Forest',   from: '#22392D', to: '#1c3225', accent: '#4EBC86', accentBright: '#85D6AF' },
  { id: 'navy',     name: 'Navy',     from: '#16213A', to: '#0F1830', accent: '#4E6FBC', accentBright: '#859ED6' },
  { id: 'plum',     name: 'Plum',     from: '#2E1F3A', to: '#20142B', accent: '#8B4EBC', accentBright: '#B285D6' },
  { id: 'slate',    name: 'Slate',    from: '#1E2A2C', to: '#141D1E', accent: '#4EACBC', accentBright: '#85CBD6' },
  { id: 'burgundy', name: 'Burgundy', from: '#3A1A1E', to: '#270F12', accent: '#BC4E5B', accentBright: '#D6858F' },
  { id: 'charcoal', name: 'Charcoal', from: '#20221F', to: '#141613', accent: '#72BC4E', accentBright: '#A0D685' },
];

// Fixed MAPUA-style grade scale — permanent, never added to or removed from.
export const GRADE_LEVELS = [1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 5.00];

// For accounts using the "5.00 is highest" convention, each grade level mirrors
// around the 3.00 passing threshold (1.00->5.00, 1.25->4.75, ... 3.00->3.00),
// and the failing mark mirrors too (5.00->1.00). This keeps the same
// best-to-worst order and the same "gap" shape as the 1.00-highest scale,
// just flipped to the other end, instead of jumping straight from 5.00 to 3.00.
export function mirrorGrade(g) {
  return Number((6 - g).toFixed(2));
}

// Returns the fixed grade scale in best-to-worst order for the given grading system.
export function gradeLevelsFor(gradingSystem) {
  return gradingSystem === 'highest-5' ? GRADE_LEVELS.map(mirrorGrade) : GRADE_LEVELS.slice();
}

function defaultGradeTable() {
  return GRADE_LEVELS.map((g, i) => ({ id: 'rank-' + i, low: '', high: '', grade: g.toFixed(2) }));
}

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now();
}

export function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function getCurrentTerm(terms) {
  const t = todayStr();
  return (terms || []).find(term => term.startDate && term.endDate && term.startDate <= t && t <= term.endDate) || null;
}

export function isTermEnded(term) {
  if (!term || !term.endDate) return false;
  return term.endDate < todayStr();
}

export function hasTermStarted(term) {
  if (!term || !term.startDate) return false;
  return term.startDate <= todayStr();
}

// A grade counts as "passing" for unit-tracking purposes: 1.00–3.00 (or P) on the
// standard scale, or 3.00–5.00 (or P) when the account uses the reversed "5.00 is highest" scale.
export function isPassingGrade(value, account) {
  if (value === undefined || value === null || value === '') return false;
  if (isSpecialGrade(value)) return String(value).trim().toUpperCase() === 'P';
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  const highestIsOne = !account || account.gradingSystem !== 'highest-5';
  return highestIsOne ? (num >= 1 && num <= 3) : (num >= 3 && num <= 5);
}

// Resolves a course's lifecycle status relative to the term(s) it's assigned to:
// 'taken' (an ended term + passing grade), 'current' (a term is ongoing), 'not-yet' (only future terms), or null.
// Scans every term the course appears in (not just the first match) so a course reused across
// multiple terms — common for generic "Elective"/"Specialization" slots — still resolves correctly.
export function getCourseStatus(course, terms, termCourses, grades, assessments, account) {
  const termIds = Object.keys(termCourses || {}).filter(tid => ((termCourses || {})[tid] || []).includes(course.id));
  const matchingTerms = termIds.map(tid => (terms || []).find(t => t.id === tid)).filter(Boolean);
  if (matchingTerms.length === 0) return null;
  const today = todayStr();

  if (matchingTerms.some(term => term.startDate && term.startDate <= today && (!term.endDate || today <= term.endDate))) {
    return 'current';
  }
  const takenSomewhere = matchingTerms.some(term => {
    if (!term.endDate || term.endDate >= today) return false;
    const effective = getEffectiveGrade(term.id, course.id, grades, assessments, account, course);
    return isPassingGrade(effective.value, account);
  });
  if (takenSomewhere) return 'taken';
  if (matchingTerms.some(term => term.startDate && term.startDate > today)) return 'not-yet';
  return null;
}

export function findCourseTermId(termCourses, courseId, excludeTermId) {
  const tid = Object.keys(termCourses || {}).find(id => id !== excludeTermId && (termCourses[id] || []).includes(courseId));
  return tid || null;
}

export function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function termDurationDays(term) {
  if (!term || !term.startDate || !term.endDate) return null;
  const start = new Date(term.startDate + 'T00:00:00');
  const end = new Date(term.endDate + 'T00:00:00');
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : null;
}

// Course-type colors are shades of the current accent (the sidebar color chosen
// in Account Settings) rather than fixed hex values, so they automatically
// follow whichever accent the user picks instead of needing a manual color choice.
export const COURSE_TYPES = [
  { name: 'Core', color: 'var(--c-accent)' },
  { name: 'Specialization', color: 'color-mix(in srgb, var(--c-accent) 65%, black)' },
  { name: 'Elective', color: 'color-mix(in srgb, var(--c-accent) 55%, white)' },
];

// Resolves a course type name to its accent-derived shade.
export function courseTypeColor(typeName) {
  return (COURSE_TYPES.find(t => t.name === typeName) || COURSE_TYPES[0]).color;
}

export const COURSE_TYPE_ORDER = ['Core', 'Elective', 'Specialization'];

export const MAPUA_PROGRAMS = [
  'Bachelor of Arts in Broadcast Media',
  'Bachelor of Arts in Digital Film',
  'Bachelor of Arts in Digital Journalism',
  'Bachelor of Arts in Multimedia Arts and Broadcast Media (Double Degree)',
  'Bachelor of Arts in Multimedia Arts and Digital Journalism (Double Degree)',
  'Bachelor of Arts in Psychology',
  'Bachelor in Physical Education major in Sports and Wellness Management',
  'Bachelor of Multimedia Arts',
  'Bachelor of Science in Accountancy',
  'Bachelor of Science in Advertising Design',
  'Bachelor of Science in Architecture',
  'Bachelor of Science in Artificial Intelligence Engineering',
  'Bachelor of Science in Biological Engineering',
  'Bachelor of Science in Biology',
  'Bachelor of Science in Business Administration',
  'Bachelor of Science in Business Intelligence and Analytics',
  'Bachelor of Science in Chemical Engineering',
  'Bachelor of Science in Chemical Engineering and Chemistry (Double Degree)',
  'Bachelor of Science in Chemistry',
  'Bachelor of Science in Civil Engineering',
  'Bachelor of Science in Civil Engineering and Environmental and Sanitary Engineering (Double Degree)',
  'Bachelor of Science in Civil Engineering and Materials Science and Engineering (Double Degree)',
  'Bachelor of Science in Computer Engineering',
  'Bachelor of Science in Computer Science',
  'Bachelor of Science in Construction Engineering and Management',
  'Bachelor of Science in Data Science',
  'Bachelor of Science in Electrical Engineering',
  'Bachelor of Science in Electronics Engineering',
  'Bachelor of Science in Energy Engineering',
  'Bachelor of Science in Entertainment and Multimedia Computing',
  'Bachelor of Science in Entrepreneurship',
  'Bachelor of Science in Environmental and Sanitary Engineering',
  'Bachelor of Science in Environmental Planning',
  'Bachelor of Science in Financial Management and Technology',
  'Bachelor of Science in Geological Science and Engineering',
  'Bachelor of Science in Geology',
  'Bachelor of Science in Hospitality Management',
  'Bachelor of Science in Industrial Design',
  'Bachelor of Science in Industrial Engineering',
  'Bachelor of Science in Information Systems',
  'Bachelor of Science in Information Technology',
  'Bachelor of Science in Interior Design',
  'Bachelor of Science in International Business',
  'Bachelor of Science in Management Engineering',
  'Bachelor of Science in Manufacturing Engineering',
  'Bachelor of Science in Marketing',
  'Bachelor of Science in Materials Science and Engineering',
  'Bachelor of Science in Mechanical Engineering',
  'Bachelor of Science in Mechanical Engineering and Biological Engineering (Double Degree)',
  'Bachelor of Science in Mechanical Engineering and Materials Science and Engineering (Double Degree)',
  'Bachelor of Science in Medical Technology',
  'Bachelor of Science in Nursing',
  'Bachelor of Science in Pharmacy',
  'Bachelor of Science in Physical Therapy',
  'Bachelor of Science in Physics',
  'Bachelor of Science in Physics - Bachelor of Science in Electrical Engineering (Double Degree)',
  'Bachelor of Science in Physics - Bachelor of Science in Electronics Engineering (Double Degree)',
  'Bachelor of Science in Physics - Bachelor of Science in Materials Science and Engineering (Double Degree)',
  'Bachelor of Science in Psychology',
  'Bachelor of Science in Radiologic Technology',
  'Bachelor of Science in Real Estate Management',
  'Bachelor of Science in Technical Communication',
  'Bachelor of Science in Tourism Management',
  'Bachelor of Science in Urban Planning',
];

export const SPECIAL_GRADES = ['P', 'INC'];

// The only grade points that can be entered as a final grade — matches the standard
// 1.00 (highest) – 5.00 (fail) scale. P/INC are handled separately as special grades.
export const GRADE_SCALE = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '5.00'];

// Same options, but mirrored to 5.00-highest order when the account uses that convention.
export function gradeScaleFor(gradingSystem) {
  return gradeLevelsFor(gradingSystem).map(g => g.toFixed(2));
}

export function isSpecialGrade(raw) {
  if (raw === undefined || raw === null) return false;
  const v = String(raw).trim().toUpperCase();
  return SPECIAL_GRADES.includes(v);
}

// Resolves the grade that actually counts for a course in a term:
// 1. A manually entered/overridden value in `grades` always wins (numeric or P/INC).
// 2. Otherwise, if an assessment log exists and yields a computed grade point, use that.
// 3. Otherwise there is no effective grade yet.
export function getEffectiveGrade(termId, courseId, grades, assessments, account, course) {
  const override = grades[termId] && grades[termId][courseId];
  if (override !== undefined && override !== '') {
    return { value: override, isOverride: true, isComputed: false };
  }
  const list = assessments && assessments[termId] && assessments[termId][courseId];
  if (list && list.length > 0) {
    const { percent } = computeAssessmentStats(list, course && course.categories);
    const gradePoint = percentToGradePoint(account && account.gradeTable, percent);
    if (gradePoint !== null) {
      return { value: gradePoint, isOverride: false, isComputed: true, percent };
    }
    return { value: undefined, isOverride: false, isComputed: false, percent };
  }
  return { value: undefined, isOverride: false, isComputed: false };
}

export function computeTermStats(termId, grades, courses, termCourses, assessments = {}, account = {}) {
  const ids = termCourses[termId] || [];
  let sumWeighted = 0, sumUnits = 0, totalUnits = 0;
  ids.forEach(id => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    const units = parseFloat(course.units) || 0;
    totalUnits += units;
    const effective = getEffectiveGrade(termId, id, grades, assessments, account, course);
    if (effective.value === undefined || effective.value === '') return;
    if (course.unitsConsidered === false) return; // explicitly excluded via the Manage Courses checkbox
    const gradeNum = parseFloat(effective.value);
    if (!isNaN(gradeNum) && units > 0) {
      sumWeighted += gradeNum * units;
      sumUnits += units;
    }
  });
  return {
    gwa: sumUnits > 0 ? sumWeighted / sumUnits : null,
    unitsConsidered: sumUnits,
    totalUnits,
  };
}

// Some term naming conventions carry a hard cap on total units that can be assigned to them.
export const UNIT_LIMIT_RULES = [
  { match: 'trisem', limit: 21 },
  { match: 'quarterm', limit: 18 },
];

export function getUnitLimit(term) {
  if (!term || !term.name) return null;
  const name = term.name.toLowerCase();
  const rule = UNIT_LIMIT_RULES.find(r => name.includes(r.match));
  return rule ? rule.limit : null;
}

export function sumAssignedUnits(termId, courses, termCourses) {
  const ids = (termCourses && termCourses[termId]) || [];
  return ids.reduce((sum, id) => {
    const course = courses.find(c => c.id === id);
    return sum + (course ? (parseFloat(course.units) || 0) : 0);
  }, 0);
}

export function computeGWA(termId, grades, courses, termCourses, assessments = {}, account = {}) {
  return computeTermStats(termId, grades, courses, termCourses, assessments, account).gwa;
}

// Aggregates weighted grade points across every term that has ended, giving a single
// cumulative GWA + units-considered figure (used to project the grade needed going forward).
export function computeCumulativeStats(terms, grades, courses, termCourses, assessments = {}, account = {}) {
  let sumWeighted = 0, sumUnits = 0;
  (terms || []).forEach(term => {
    if (!isTermEnded(term)) return;
    const stats = computeTermStats(term.id, grades, courses, termCourses, assessments, account);
    if (stats.unitsConsidered > 0) {
      sumWeighted += stats.gwa * stats.unitsConsidered;
      sumUnits += stats.unitsConsidered;
    }
  });
  return { gwa: sumUnits > 0 ? sumWeighted / sumUnits : null, unitsConsidered: sumUnits };
}

export function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export const defaultData = {
  account: {
    studentId: '', firstName: '', middleName: '', lastName: '', gender: '', birthday: '',
    gradingSystem: 'highest-1',
    gradeTable: defaultGradeTable(),
    requiredUnits: '',
    goalGWA: '',
    theme: 'light',
    sidebarTheme: 'forest',
  },
  terms: [],
  courses: [],
  termCourses: {},
  schedule: [],
  grades: {},
  assessments: {},
};

export const TERM_LABELS = { 2: 'Semester', 3: 'Trimester', 4: 'Quarter' };

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function toISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function generateTerms({ startDate, years, termsPerYear }) {
  const label = TERM_LABELS[termsPerYear] || 'Term';
  const monthsPerTerm = 12 / termsPerYear;
  const totalTerms = years * termsPerYear;
  const start = new Date(startDate + 'T00:00:00');
  const startYear = start.getFullYear();
  const terms = [];
  for (let i = 0; i < totalTerms; i++) {
    const termStart = addMonths(start, i * monthsPerTerm);
    const termEnd = addMonths(start, (i + 1) * monthsPerTerm);
    termEnd.setDate(termEnd.getDate() - 1);
    const yearIndex = Math.floor(i / termsPerYear);
    const termInYear = (i % termsPerYear) + 1;
    const name = `${ordinal(termInYear)} ${label} SY ${startYear + yearIndex}-${startYear + yearIndex + 1}`;
    terms.push({ id: uid(), name, startDate: toISODate(termStart), endDate: toISODate(termEnd) });
  }
  return terms;
}

export function percentToGradePoint(gradeTable, percent) {
  if (percent === null || percent === undefined || isNaN(percent) || !gradeTable || gradeTable.length === 0) return null;
  const rows = gradeTable
    .filter(r => r.low !== '' && r.high !== '' && r.grade !== '' && r.low !== undefined && r.high !== undefined && r.grade !== undefined)
    .map(r => ({ low: parseFloat(r.low), high: parseFloat(r.high), grade: parseFloat(r.grade) }))
    .filter(r => !isNaN(r.low) && !isNaN(r.high) && !isNaN(r.grade));
  if (rows.length === 0) return null;
  const match = rows.find(r => percent >= Math.min(r.low, r.high) && percent <= Math.max(r.low, r.high));
  if (match) return match.grade;
  const sorted = rows.slice().sort((a, b) => Math.min(a.low, a.high) - Math.min(b.low, b.high));
  if (percent > Math.max(sorted[sorted.length - 1].low, sorted[sorted.length - 1].high)) return sorted[sorted.length - 1].grade;
  if (percent < Math.min(sorted[0].low, sorted[0].high)) return sorted[0].grade;
  return null;
}

export function computeAssessmentStats(list, categories) {
  let weightedSum = 0, weightSum = 0;
  (list || []).forEach(a => {
    const raw = parseFloat(a.raw), total = parseFloat(a.total);
    let weight = parseFloat(a.weight);
    if (categories && a.categoryId) {
      const cat = categories.find(c => c.id === a.categoryId);
      if (cat) weight = parseFloat(cat.weight);
    }
    if (!isNaN(raw) && !isNaN(total) && total > 0 && !isNaN(weight) && weight > 0) {
      const pct = (raw / total) * 100;
      weightedSum += pct * weight;
      weightSum += weight;
    }
  });
  return { percent: weightSum > 0 ? weightedSum / weightSum : null, weightSum };
}