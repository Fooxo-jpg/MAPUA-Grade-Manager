import React from 'react';
import { LayoutDashboard, BookOpen, CalendarRange, Clock3, Settings, Database, GraduationCap, ChevronsLeft, ChevronsRight, ClipboardList } from 'lucide-react';

export default function Sidebar({ active, setActive, studentName, collapsed, setCollapsed }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'grades', label: 'Manage Grades', icon: ClipboardList },
    { id: 'courses', label: 'Manage Courses', icon: BookOpen },
    { id: 'term', label: 'Manage Term', icon: CalendarRange },
    { id: 'schedule', label: 'Manage Schedule', icon: Clock3 },
    { id: 'data', label: 'Data Manager', icon: Database },
    { id: 'account', label: 'Account Settings', icon: Settings },
  ];
  return (
    <div className={`gt-sidebar${collapsed ? ' gt-sidebar-collapsed' : ''}`}>
      <button
        type="button"
        className="gt-logo-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="gt-logo-icon-wrap">
          <GraduationCap size={19} className="gt-logo-icon" />
          <span className="gt-logo-chevron">
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </span>
        </span>
        <span className="gt-logo-text">
          <span className="gt-serif gt-logo-title">Gradebook</span>
          <span className="gt-mono gt-logo-sub">{studentName || 'Student'}</span>
        </span>
      </button>
      <nav className="gt-nav">
        {items.map(it => {
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setActive(it.id)}
              className={`gt-nav-btn${isActive ? ' gt-nav-btn-active' : ''}`}
              title={collapsed ? it.label : undefined}
            >
              <it.icon size={16} />
              <span className="gt-nav-label">{it.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}