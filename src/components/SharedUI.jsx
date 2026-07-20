import React, { useState } from 'react';
import { Search, Pipette, Check } from 'lucide-react';
import { COURSE_COLORS, gradeScaleFor, SPECIAL_GRADES } from '../utils';

export function Eyebrow({ children }) {
  return <div className="gt-eyebrow">{children}</div>;
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="gt-card gt-empty-state">
      <Icon size={28} className="gt-empty-state-icon" />
      <div className="gt-serif gt-empty-state-title">{title}</div>
      {subtitle && <div className="gt-empty-state-subtitle">{subtitle}</div>}
    </div>
  );
}

export function ColorSwatchPicker({ value, onChange }) {
  const isPreset = COURSE_COLORS.some(c => c.hex.toLowerCase() === (value || '').toLowerCase());
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {COURSE_COLORS.map(c => {
        const selected = value === c.hex;
        return (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChange(c.hex)}
            title={c.name}
            style={{
              width: 28, height: 28, borderRadius: 8, backgroundColor: c.hex, cursor: 'pointer',
              border: selected ? '3px solid var(--c-ink-soft)' : '3px solid transparent',
              boxShadow: selected ? '0 0 0 1px rgba(0,0,0,0.08), var(--shadow-sm)' : '0 0 0 1px rgba(0,0,0,0.08)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {selected && <Check size={14} color="#fff" style={{ filter: 'drop-shadow(0 0 1.5px rgba(0,0,0,0.6))' }} />}
          </button>
        );
      })}
      <label
        title="Custom color"
        style={{
          position: 'relative', width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          border: !isPreset ? '3px solid var(--c-ink-soft)' : '3px solid transparent',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
          background: !isPreset && value
            ? value
            : 'conic-gradient(from 0deg, #E23A3A, #E2A23A, #DCE23A, #3AE25E, #3AA2E2, #7A3AE2, #E23AA2, #E23A3A)',
        }}
      >
        <Pipette size={13} color="#fff" style={{ filter: 'drop-shadow(0 0 1.5px rgba(0,0,0,0.7))', pointerEvents: 'none' }} />
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value || '') ? value : 'var(--c-forest)'}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', border: 'none', padding: 0 }}
        />
      </label>
    </div>
  );
}

export function GradeSelect({ value, onChange, disabled, title, width = 90, gradingSystem }) {
  const scale = gradeScaleFor(gradingSystem);
  return (
    <select
      value={value || ''}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      title={title}
      className="gt-mono gt-grade-select"
      style={{ width }}
    >
      <option value="">—</option>
      {scale.map(g => <option key={g} value={g}>{g}</option>)}
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
      <div className="gt-field-label" style={{ marginBottom: 6 }}>{label}</div>
      {options.length === 0 ? (
        <div className="gt-card" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--c-text-placeholder)' }}>No other courses yet</div>
      ) : (
        <>
          {options.length > 6 && (
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-placeholder)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or code…"
                className="gt-mono gt-input"
                style={{ padding: '7px 10px 7px 28px', fontSize: 12.5 }}
              />
            </div>
          )}
          <div className="gt-card" style={{ maxHeight: 140, overflowY: 'auto', padding: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 8px', fontSize: 12.5, color: 'var(--c-text-placeholder)' }}>No courses match "{query}"</div>
            ) : filtered.map(c => {
              const checked = selectedIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', borderRadius: 6,
                    background: checked ? 'var(--c-surface-selected)' : 'transparent',
                    transition: 'background var(--t-fast) var(--ease)',
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'var(--c-bg-alt)'; }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                >
                  <input type="checkbox" checked={checked} onChange={() => onToggle(c.id)} style={{ width: 15, height: 15, accentColor: 'var(--c-accent)' }} />
                  <span className="gt-mono" style={{ fontSize: 11.5, fontWeight: 700, color: c.color, minWidth: 54 }}>{c.code}</span>
                  <span style={{ fontSize: 13, color: 'var(--c-ink-soft)' }}>{c.name}</span>
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
    <label className="gt-field">
      <span className="gt-field-label">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`gt-input${mono ? ' gt-mono' : ''}`}
        list={list}
        title={title}
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, children, mono = false, style }) {
  return (
    <label className="gt-field" style={style}>
      <span className="gt-field-label">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`gt-select${mono ? ' gt-mono' : ''}`}
      >
        {children}
      </select>
    </label>
  );
}

export function PrimaryButton({ onClick, children, icon: Icon, style, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="gt-mono gt-btn gt-btn-primary"
      style={style}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

export function SecondaryButton({ onClick, children, icon: Icon, style, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="gt-mono gt-btn gt-btn-secondary"
      style={style}
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
      className={`gt-icon-btn${danger ? ' gt-icon-btn--danger' : ''}`}
    >
      <Icon size={14} />
    </button>
  );
}