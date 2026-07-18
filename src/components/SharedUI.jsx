import React, { useState } from 'react';
import { Search, Pipette } from 'lucide-react';
import { COURSE_COLORS, GRADE_SCALE, SPECIAL_GRADES } from '../utils';

export function Eyebrow({ children }) {
  return <div className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600 }}>{children}</div>;
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="gt-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
      <Icon size={28} style={{ margin: '0 auto 12px', color: '#B7AE9C' }} />
      <div className="gt-serif" style={{ fontSize: 18, color: '#2A2E28', marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13.5, color: '#8A8A7E' }}>{subtitle}</div>}
    </div>
  );
}

export function ColorSwatchPicker({ value, onChange }) {
  const isPreset = COURSE_COLORS.some(c => c.hex.toLowerCase() === (value || '').toLowerCase());
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {COURSE_COLORS.map(c => (
        <button
          key={c.hex}
          type="button"
          onClick={() => onChange(c.hex)}
          title={c.name}
          style={{
            width: 28, height: 28, borderRadius: 8, backgroundColor: c.hex, cursor: 'pointer',
            border: value === c.hex ? '3px solid #2A2E28' : '3px solid transparent',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
          }}
        />
      ))}
      <label
        title="Custom color"
        style={{
          position: 'relative', width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          border: !isPreset ? '3px solid #2A2E28' : '3px solid transparent',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
          background: !isPreset && value
            ? value
            : 'conic-gradient(from 0deg, #E23A3A, #E2A23A, #DCE23A, #3AE25E, #3AA2E2, #7A3AE2, #E23AA2, #E23A3A)',
        }}
      >
        <Pipette size={13} color="#fff" style={{ filter: 'drop-shadow(0 0 1.5px rgba(0,0,0,0.7))', pointerEvents: 'none' }} />
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#2D5240'}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', border: 'none', padding: 0 }}
        />
      </label>
    </div>
  );
}

export function GradeSelect({ value, onChange, disabled, title, width = 90 }) {
  return (
    <select
      value={value || ''}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      title={title}
      className="gt-mono"
      style={{
        width, padding: '6px 4px', borderRadius: 7, border: '1.5px solid #DDD6C4', fontSize: 13, textAlign: 'center',
        textAlignLast: 'center', background: disabled ? '#EFECDF' : '#FCFBF7', color: '#2A2E28',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <option value="">—</option>
      {GRADE_SCALE.map(g => <option key={g} value={g}>{g}</option>)}
      {SPECIAL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
    </select>
  );
}

export function CoursePicker({ label, options, selectedIds, onToggle }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(c => (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q))
    : options;

  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {options.length === 0 ? (
        <div className="gt-card" style={{ padding: '12px 14px', fontSize: 13, color: '#B0AA98' }}>No other courses yet</div>
      ) : (
        <>
          {options.length > 6 && (
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#B0AA98', pointerEvents: 'none' }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or code…"
                className="gt-mono"
                style={{
                  width: '100%', padding: '7px 10px 7px 28px', borderRadius: 8, border: '1.5px solid #DDD6C4',
                  fontSize: 12.5, background: '#FCFBF7', color: '#2A2E28', boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>
          )}
          <div className="gt-card" style={{ maxHeight: 140, overflowY: 'auto', padding: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 8px', fontSize: 12.5, color: '#B0AA98' }}>No courses match "{query}"</div>
            ) : filtered.map(c => {
              const checked = selectedIds.includes(c.id);
              return (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderRadius: 6, background: checked ? '#EFF3EC' : 'transparent' }}>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(c.id)} style={{ width: 15, height: 15, accentColor: '#2D5240' }} />
                  <span className="gt-mono" style={{ fontSize: 11.5, fontWeight: 700, color: c.color, minWidth: 54 }}>{c.code}</span>
                  <span style={{ fontSize: 13, color: '#2A2E28' }}>{c.name}</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, type = 'text', mono = false, list, title }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 140 }}>
      <span className="gt-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8A80', fontWeight: 600 }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={mono ? 'gt-mono' : ''}
        list={list}
        title={title}
        style={{
          padding: '9px 11px', borderRadius: 8, border: '1.5px solid #DDD6C4',
          fontSize: 14, background: '#FCFBF7', color: '#2A2E28', outline: 'none',
        }}
      />
    </label>
  );
}

export function PrimaryButton({ onClick, children, icon: Icon, style, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="gt-mono"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px',
        borderRadius: 8, border: 'none', background: disabled ? '#B0AA98' : '#2D5240', color: '#F5F7F3',
        fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer', ...style,
      }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

export function IconButton({ onClick, icon: Icon, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 7, border: '1.5px solid #E3DCC9',
        background: '#FCFBF7', color: danger ? '#B23A2E' : '#4A5048', cursor: 'pointer',
      }}
    >
      <Icon size={14} />
    </button>
  );
}