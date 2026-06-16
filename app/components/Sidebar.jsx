'use client';
import { DIRECTIVES } from '../data/seed';

const NAV_CONFIGS = {
  secretariat: [
    { id: 'dashboard', label: 'Executive Dashboard', icon: 'grid' },
    { id: 'directives', label: 'All 23 Directives', icon: 'list' },
    { id: 'briefing', label: 'AI Presidential Brief', icon: 'cpu' },
    { id: 'field', label: 'Field Verifications', icon: 'map-pin' },
    { id: 'discrepancies', label: 'Discrepancy Register', icon: 'alert-triangle' },
    { id: 'users', label: 'System Users', icon: 'users' },
  ],
  mda: [
    { id: 'dashboard', label: 'My Directives', icon: 'grid' },
    { id: 'submit', label: 'Submit Report', icon: 'send' },
    { id: 'history', label: 'Submission History', icon: 'clock' },
    { id: 'kpis', label: 'My KPIs', icon: 'bar-chart' },
  ],
  field: [
    { id: 'dashboard', label: 'Active Missions', icon: 'grid' },
    { id: 'verify', label: 'New Verification', icon: 'check-circle' },
    { id: 'reports', label: 'Filed Reports', icon: 'file-text' },
  ],
  convener: [
    { id: 'dashboard', label: 'National Overview', icon: 'globe' },
    { id: 'map', label: 'Uganda Map View', icon: 'map' },
    { id: 'brief', label: 'Executive Summary', icon: 'star' },
    { id: 'ndp', label: 'NDP III Alignment', icon: 'bar-chart' },
  ],
  oversight: [
    { id: 'dashboard', label: 'Oversight Summary', icon: 'shield' },
    { id: 'discrepancies', label: 'Discrepancy Register', icon: 'alert-triangle' },
    { id: 'audit', label: 'Audit Trail', icon: 'file-text' },
    { id: 'mdas', label: 'MDA Risk Ratings', icon: 'activity' },
  ],
  npa: [
    { id: 'dashboard', label: 'NDP III Dashboard', icon: 'grid' },
    { id: 'pillars', label: 'Pillar Performance', icon: 'bar-chart' },
    { id: 'directives', label: 'Directive Mapping', icon: 'list' },
    { id: 'projections', label: 'Outcome Projections', icon: 'trending-up' },
  ],
};

const ICON = ({ name, size = 15 }) => {
  const s = { width: size, height: size };
  const icons = {
    grid: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    list: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    cpu: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    'map-pin': <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    'alert-triangle': <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    users: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    send: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    clock: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    'bar-chart': <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    'check-circle': <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    'file-text': <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    globe: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    map: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    star: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    shield: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    activity: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    'trending-up': <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    'log-out': <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  };
  return icons[name] || null;
};

export default function Sidebar({ role, activeTab, onTabChange, onLogout }) {
  if (!role) return null;
  const navItems = NAV_CONFIGS[role.id] || [];
  const green  = DIRECTIVES.filter(d => d.rag === 'GREEN').length;
  const amber  = DIRECTIVES.filter(d => d.rag === 'AMBER').length;
  const red    = DIRECTIVES.filter(d => d.rag === 'RED').length;

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <img
            src="/apex-nexus-logo.png"
            alt="APEX NEXUS"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              flexShrink: 0,
              objectFit: 'cover',
            }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', letterSpacing: 0.8, fontFamily: '"Playfair Display", serif' }}>APEX NEXUS</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>Directive Intelligence</div>
          </div>
        </div>

        {/* RAG summary pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: green, c: '#10B981', l: 'G' }, { v: amber, c: '#F59E0B', l: 'A' }, { v: red, c: '#EF4444', l: 'R' }].map(item => (
            <div key={item.l} style={{
              flex: 1, background: `${item.c}18`, border: `1px solid ${item.c}35`,
              borderRadius: 6, padding: '5px 0', textAlign: 'center',
            }}>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 16, fontWeight: 500, color: item.c, lineHeight: 1 }}>{item.v}</div>
              <div style={{ fontSize: 9, color: item.c + 'aa', marginTop: 2, fontWeight: 600 }}>{item.l === 'G' ? 'ON TRACK' : item.l === 'A' ? 'AT RISK' : 'CRITICAL'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 0', flex: 1 }}>
        <div style={{ padding: '0 10px 6px 14px', fontSize: 10, fontWeight: 600, color: '#334155', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
          {role.abbr}
        </div>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="nav-icon"><ICON name={item.icon} /></span>
            {item.label}
          </div>
        ))}
      </div>

      {/* Role card */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: role.color + '28',
            border: `1.5px solid ${role.color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: role.color,
          }}>{role.avatar}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{role.name}</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{role.label}</div>
          </div>
        </div>
        <div style={{
          fontSize: 10,
          color: '#1E293B',
          marginBottom: 10,
          lineHeight: 1.5,
        }}>
          Seed data.{' '}
          <a
            href="/data-audit.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#334155', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Data audit
          </a>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            color: '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <ICON name="log-out" size={13} />
          Change Role
        </button>
      </div>
    </div>
  );
}
