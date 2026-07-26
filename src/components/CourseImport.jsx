import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, Download, AlertTriangle, X, Check } from 'lucide-react';
import { uid, COURSE_TYPES, courseTypeColor } from '../utils';
import { PrimaryButton, SecondaryButton, IconButton } from './SharedUI';

// Recognizes a handful of common header spellings so real-world exports from
// the registrar, Excel, or Google Sheets "just work" without the student
// having to rename columns first.
const HEADER_ALIASES = {
  code: ['code', 'course code', 'coursecode', 'subject code', 'subjectcode', 'course no', 'course number'],
  name: ['name', 'course name', 'coursename', 'title', 'subject', 'description', 'course title'],
  units: ['units', 'unit', 'credit', 'credits', 'credit units', 'creditunits'],
  instructor: ['instructor', 'professor', 'faculty', 'teacher'],
  type: ['type', 'course type', 'coursetype', 'category', 'classification'],
};

function normalizeHeader(h) {
  return String(h || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildFieldMap(headers) {
  const map = {};
  const normalized = headers.map(normalizeHeader);
  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const idx = normalized.findIndex(h => aliases.includes(h));
    if (idx !== -1) map[field] = headers[idx];
  });
  return map;
}

function matchCourseType(raw) {
  if (!raw) return COURSE_TYPES[0].name;
  const norm = String(raw).trim().toLowerCase();
  const found = COURSE_TYPES.find(t => t.name.toLowerCase() === norm || t.name.toLowerCase().startsWith(norm));
  return found ? found.name : COURSE_TYPES[0].name;
}

function rowsFromCSV(text) {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return { headers: parsed.meta.fields || [], rows: parsed.data };
}

function rowsFromWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headers = json.length > 0 ? Object.keys(json[0]) : [];
  return { headers, rows: json };
}

export default function CourseImport({ importCourses }) {
  const [rows, setRows] = useState(null); // parsed + normalized preview rows, or null before a file is chosen
  const [skippedCount, setSkippedCount] = useState(0);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [imported, setImported] = useState(0);
  const fileInputRef = useRef(null);

  function reset() {
    setRows(null);
    setSkippedCount(0);
    setError('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError('');
    setImported(0);
    setFileName(file.name);
    const isCSV = /\.csv$/i.test(file.name);
    const reader = new FileReader();
    reader.onerror = () => setError('Could not read that file.');
    reader.onload = () => {
      try {
        const { headers, rows: rawRows } = isCSV
          ? rowsFromCSV(reader.result)
          : rowsFromWorkbook(reader.result);

        if (headers.length === 0 || rawRows.length === 0) {
          setError('No rows found in that file.');
          setRows(null);
          return;
        }

        const fieldMap = buildFieldMap(headers);
        if (!fieldMap.code || !fieldMap.name) {
          setError(`Couldn't find "Code" and "Name" columns. Found columns: ${headers.join(', ')}`);
          setRows(null);
          return;
        }

        let skipped = 0;
        const preview = rawRows
          .map(r => {
            const code = String(r[fieldMap.code] || '').trim();
            const name = String(r[fieldMap.name] || '').trim();
            if (!code || !name) return null;
            const units = fieldMap.units ? String(r[fieldMap.units] || '').replace(/[^0-9.]/g, '') : '';
            const instructor = fieldMap.instructor ? String(r[fieldMap.instructor] || '').trim() : '';
            const courseType = matchCourseType(fieldMap.type ? r[fieldMap.type] : '');
            return { code, name, units, instructor, courseType, include: true, key: uid() };
          })
          .filter(r => {
            if (!r) { skipped++; return false; }
            return true;
          });

        setSkippedCount(skipped);
        setRows(preview);
      } catch {
        setError('Could not parse that file — make sure it\'s a valid CSV or Excel file.');
        setRows(null);
      }
    };
    if (isCSV) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  }

  function toggleRow(key) {
    setRows(rs => rs.map(r => r.key === key ? { ...r, include: !r.include } : r));
  }

  function removeRow(key) {
    setRows(rs => rs.filter(r => r.key !== key));
  }

  function confirmImport() {
    const toImport = (rows || []).filter(r => r.include);
    if (toImport.length === 0) return;
    importCourses(toImport.map(r => ({
      id: uid(),
      code: r.code,
      name: r.name,
      units: r.units || 0,
      instructor: r.instructor,
      courseType: r.courseType,
      color: courseTypeColor(r.courseType),
      prerequisites: [],
      corequisites: [],
      useCategoryWeights: false,
      categories: [],
      unitsConsidered: true,
    })));
    setImported(toImport.length);
    setRows(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function downloadTemplate() {
    const csv = 'Code,Name,Units,Instructor,Type\nCS101,Intro to Programming,3,Dr. Santos,Core\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const includedCount = rows ? rows.filter(r => r.include).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <PrimaryButton onClick={() => fileInputRef.current && fileInputRef.current.click()} icon={Upload}>
          Choose CSV / Excel File
        </PrimaryButton>
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
        <SecondaryButton onClick={downloadTemplate} icon={Download}>Download Template</SecondaryButton>
        {fileName && <span className="gt-mono" style={{ fontSize: 12, color: 'var(--c-text-faint)' }}>{fileName}</span>}
      </div>

      <div style={{ fontSize: 12, color: 'var(--c-text-faint)' }}>
        Expects a <strong>Code</strong> and <strong>Name</strong> column (required), plus optional <strong>Units</strong>,{' '}
        <strong>Instructor</strong>, and <strong>Type</strong> (Core / Specialization / Elective) columns. Column names
        are matched loosely, so "Subject Code" or "Course Title" work too.
      </div>

      {error && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--c-danger) 8%, transparent)', color: 'var(--c-danger)', fontSize: 12.5 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {imported > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--c-forest) 8%, transparent)', color: 'var(--c-forest)', fontSize: 12.5 }}>
          <Check size={15} /> Imported {imported} course{imported === 1 ? '' : 's'}. Head to Manage Courses to see them.
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div style={{ fontSize: 12.5, color: 'var(--c-text-faint)' }}>
            Found {rows.length} valid row{rows.length === 1 ? '' : 's'}
            {skippedCount > 0 && ` (skipped ${skippedCount} missing a code or name)`}. Uncheck any you don't want to import.
          </div>
          <div className="gt-card" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <div className="gt-mono" style={{ display: 'grid', gridTemplateColumns: '28px 70px 1fr 60px 1fr 110px 32px', gap: 8, padding: '8px 12px', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--c-text-muted)', fontWeight: 600, background: 'var(--c-overlay-2)', position: 'sticky', top: 0 }}>
              <span />
              <span>Code</span>
              <span>Name</span>
              <span>Units</span>
              <span>Instructor</span>
              <span>Type</span>
              <span />
            </div>
            {rows.map((r, i) => (
              <div
                key={r.key}
                style={{
                  display: 'grid', gridTemplateColumns: '28px 70px 1fr 60px 1fr 110px 32px', gap: 8, alignItems: 'center',
                  padding: '8px 12px', borderTop: i > 0 ? '1px solid var(--c-divider)' : 'none', opacity: r.include ? 1 : 0.45,
                }}
              >
                <input type="checkbox" checked={r.include} onChange={() => toggleRow(r.key)} style={{ width: 15, height: 15, accentColor: 'var(--c-accent)', cursor: 'pointer' }} />
                <span className="gt-mono" style={{ fontSize: 12, fontWeight: 700 }}>{r.code}</span>
                <span style={{ fontSize: 13 }}>{r.name}</span>
                <span className="gt-mono" style={{ fontSize: 12 }}>{r.units || '—'}</span>
                <span style={{ fontSize: 12.5, color: 'var(--c-text-faint)' }}>{r.instructor || '—'}</span>
                <span className="gt-mono" style={{ fontSize: 11 }}>{r.courseType}</span>
                <IconButton icon={X} onClick={() => removeRow(r.key)} title="Remove row" />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton onClick={confirmImport} icon={FileSpreadsheet} disabled={includedCount === 0}>
              Import {includedCount} Course{includedCount === 1 ? '' : 's'}
            </PrimaryButton>
            <SecondaryButton onClick={reset} icon={X}>Cancel</SecondaryButton>
          </div>
        </>
      )}
    </div>
  );
}
