'use client';
import { useState } from 'react';
import { DIRECTIVES, QUARTERLY_TREND, SECTOR_BREAKDOWN, NOTIFICATIONS } from '../data/seed';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DirectiveModal from './DirectiveModal';
import BriefingModal from './BriefingModal';
import { DISCREPANCIES, FIELD_REPORTS } from '../data/seed';

const RAGBadge = ({ status }) => {
  const cfg = {
    GREEN: { cls: 'rag-green', label: 'On Track' },
    AMBER: { cls: 'rag-amber', label: 'At Risk' },
    RED:   { cls: 'rag-red',   label: 'Critical' },
  }[status] || { cls: 'rag-grey', label: 'Pending' };
  return (
    <span className={`rag ${cfg.cls}`}>
      <span className="rag-dot" />
      {cfg.label}
    </span>
  );
};

function KPICard({ value, label, sub, trend, color = '#1E40AF' }) {
  const isUp = trend === 'up', isDown = trend === 'down';
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
        <span className="kpi-value" style={{ color }}>{value}</span>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 600, color: isUp ? '#059669' : isDown ? '#DC2626' : '#94A3B8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            {isUp ? '↑' : isDown ? '↓' : '→'} {sub}
          </span>
        )}
      </div>
      {!trend && sub && <div style={{ fontSize: 12, color: '#94A3B8' }}>{sub}</div>}
    </div>
  );
}

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#1E293B' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#64748B' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill || p.color, display: 'inline-block' }} />
          {p.name}: <strong style={{ color: '#1E293B' }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const USERS = [
  { name: 'Sarah Kakande',  role: 'Secretariat (DSEMR)', mda: 'OPM', last: '5 min ago', status: 'Online' },
  { name: 'Robert Okello',  role: 'MDA Officer', mda: 'MoWT', last: '12 min ago', status: 'Online' },
  { name: 'Grace Atim',     role: 'Field Monitor', mda: 'OPM', last: '2 hrs ago', status: 'Active' },
  { name: 'Moses Kato', role: 'MDA Officer', mda: 'MTIC', last: '3 hrs ago', status: 'Active' },
  { name: 'Lydia Auma', role: 'MDA Officer', mda: 'MoH', last: '1 day ago', status: 'Away' },
  { name: 'Daniel Ocen',role: 'NPA Lead', mda: 'NPA', last: '1 day ago', status: 'Away' },
  { name: 'Esther Namuli',role: 'IGG/Oversight', mda: 'IGG', last: '2 days ago', status: 'Away' },
  { name: 'Peter Waiswa',    role: 'MDA Officer', mda: 'NITA-U', last: '3 days ago', status: 'Offline' },
];

const QUICK_ACTIONS = [
  { label: 'View All Directives',   color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', tab: 'directives' },
  { label: 'Discrepancy Register',  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', tab: 'discrepancies' },
  { label: 'Field Reports',         color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', tab: 'field' },
  { label: 'Export Briefing PDF',   color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', tab: null },
];

export default function SecretariatView({ tab, onTabChange }) {
  const [selectedDirective, setSelectedDirective] = useState(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [search, setSearch] = useState('');
  const [ragFilter, setRagFilter] = useState('ALL');

  const filtered = DIRECTIVES.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()) || d.lead_mda.toLowerCase().includes(search.toLowerCase());
    const matchRag = ragFilter === 'ALL' || d.rag === ragFilter;
    return matchSearch && matchRag;
  });

  // ── DASHBOARD ──────────────────────────────────────────────
  if (tab === 'dashboard') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
          Executive Dashboard
        </h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Uganda Presidential Directives — Consolidated Performance View, Q4 FY 2025/26</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        <KPICard value="23" label="Total Directives" sub="Active NDP III" color="#1E40AF" />
        <KPICard value="9" label="On Track" sub="+1 from Q3" trend="up" color="#059669" />
        <KPICard value="10" label="At Risk" sub="Monitoring" color="#D97706" />
        <KPICard value="4" label="Critical" sub="Intervention req." trend="down" color="#DC2626" />
        <KPICard value="63.7" label="National Score" sub="+2.3 from Q3" trend="up" color="#7C3AED" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Trend chart */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>Quarterly RAG Trend — FY 2025/26</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 16 }}>Directive status distribution across all four quarters</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={QUARTERLY_TREND} barSize={18} barGap={4}>
              <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Bar dataKey="green" name="On Track" fill="#10B981" radius={[3,3,0,0]} />
              <Bar dataKey="amber" name="At Risk"  fill="#F59E0B" radius={[3,3,0,0]} />
              <Bar dataKey="red"   name="Critical" fill="#EF4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sector pie */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>By Sector</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>23 directives across 6 sectors</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={SECTOR_BREAKDOWN} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" paddingAngle={2}>
                {SECTOR_BREAKDOWN.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CUSTOM_TOOLTIP />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
            {SECTOR_BREAKDOWN.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#64748B' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        {/* Score trend */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>Score Trend</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 16 }}>National composite score /100</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={QUARTERLY_TREND}>
              <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[45, 70]} tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: '#7C3AED', r: 4 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent alerts & top directives */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent notifications */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 14 }}>Recent Alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {NOTIFICATIONS.slice(0, 5).map(n => {
              const c = { RED: '#EF4444', AMBER: '#F59E0B', BLUE: '#3B82F6' }[n.type];
              return (
                <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid #F8FAFC', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>{n.title}</div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setShowBriefing(true)} className="btn btn-violet" style={{ justifyContent: 'flex-start', gap: 10, padding: '12px 16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>
              Generate AI Presidential Briefing
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.label}
                  onClick={() => a.tab ? onTabChange?.(a.tab) : window.print()}
                  style={{
                  padding: '10px 12px', borderRadius: 8, background: a.bg,
                  border: `1px solid ${a.border}`, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: a.color,
                  textAlign: 'left', width: '100%',
                }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#F8F9FB', borderRadius: 8, border: '1px solid #E8E4DF' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>Next Cabinet Briefing</div>
            <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 700 }}>Monday, 16 June 2026</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>State House, Nakasero • 09:00 EAT</div>
          </div>
        </div>
      </div>

      {showBriefing && <BriefingModal onClose={() => setShowBriefing(false)} />}
    </div>
  );

  // ── ALL DIRECTIVES ──────────────────────────────────────────
  if (tab === 'directives') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 2 }}>All 23 Presidential Directives</h3>
          <p style={{ fontSize: 13, color: '#94A3B8' }}>NDP III — FY 2025/26 Implementation Register</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search directives, MDA…"
            className="form-input"
            style={{ width: 220 }}
          />
          {['ALL','GREEN','AMBER','RED'].map(f => (
            <button
              key={f}
              onClick={() => setRagFilter(f)}
              className="btn btn-ghost btn-sm"
              style={{
                background: ragFilter === f ? '#1E40AF' : undefined,
                color: ragFilter === f ? 'white' : undefined,
                borderColor: ragFilter === f ? '#1E40AF' : undefined,
              }}
            >
              {f === 'ALL' ? 'All' : f === 'GREEN' ? '● On Track' : f === 'AMBER' ? '● At Risk' : '● Critical'}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Directive Title</th>
              <th>Lead MDA</th>
              <th>NDP Pillar</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 120 }}>Completion</th>
              <th style={{ width: 100 }}>Budget (UGX B)</th>
              <th style={{ width: 80 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, fontWeight: 500, color: '#64748B' }}>{d.id}</span>
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{d.sector}</div>
                </td>
                <td>
                  <span className="tag tag-blue">{d.lead_mda}</span>
                </td>
                <td>
                  <span className="tag tag-slate">{d.ndp_pillar}</span>
                </td>
                <td><RAGBadge status={d.rag} /></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-track" style={{ flex: 1 }}>
                      <div
                        className={`progress-fill progress-${d.rag === 'GREEN' ? 'green' : d.rag === 'AMBER' ? 'amber' : 'red'}`}
                        style={{ width: `${d.completion}%` }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: '"DM Mono", monospace', color: '#64748B', width: 30 }}>{d.completion}%</span>
                  </div>
                </td>
                <td>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#334155' }}>{d.budget_ugx.toLocaleString()}</span>
                </td>
                <td>
                  <button
                    onClick={() => setSelectedDirective(d)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11 }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No directives match your filters</div>
        )}
      </div>

      {selectedDirective && <DirectiveModal directive={selectedDirective} onClose={() => setSelectedDirective(null)} />}
    </div>
  );

  // ── AI BRIEFING ──────────────────────────────────────────────
  if (tab === 'briefing') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>AI Presidential Briefing</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Generate an intelligent, data-driven executive brief for the President using Claude AI</p>
      </div>
      <BriefingModal inline />
    </div>
  );

  // ── FIELD VERIFICATIONS ──────────────────────────────────────
  if (tab === 'field') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Field Verification Reports</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>On-the-ground verification of directive implementation status across Uganda</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {FIELD_REPORTS.map(r => (
          <div key={r.id} className="card card-hover" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#94A3B8' }}>{r.id}</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{r.directive_title}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{r.directive}</div>
              </div>
              <span className={`rag ${r.status === 'FLAGGED' ? 'rag-red' : r.status === 'VERIFIED' ? 'rag-green' : 'rag-amber'}`}>
                <span className="rag-dot" />
                {r.status}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 11.5, color: '#64748B' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {r.location}
            </div>
            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 12 }}>{r.summary}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tag tag-slate">{r.monitor}</span>
              <span className="tag tag-slate">{r.date}</span>
              <span className="tag tag-blue">{r.photos} photos</span>
              {r.gps_confirmed && <span className="tag tag-green">GPS ✓</span>}
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: '#FAFBFC', borderRadius: 8, border: '1px solid #F1F5F9', fontSize: 11.5, color: '#475569', lineHeight: 1.5 }}>
              <strong style={{ color: '#1E293B' }}>Recommendation: </strong>{r.recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── DISCREPANCIES ────────────────────────────────────────────
  if (tab === 'discrepancies') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Discrepancy Register</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Variance flags between reported data and field-verified implementation across all MDAs</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DISCREPANCIES.map(d => {
          const sev = { HIGH: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' }, MEDIUM: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' }, LOW: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' } }[d.severity];
          const st = { OPEN: 'rag-red', UNDER_REVIEW: 'rag-amber', ESCALATED: 'rag-red', RESOLVED: 'rag-green' }[d.status] || 'rag-grey';
          return (
            <div key={d.id} className="card" style={{ padding: '20px 24px', borderLeft: `3px solid ${sev.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 10.5, color: '#94A3B8' }}>{d.id}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, padding: '1px 7px', borderRadius: 4 }}>{d.severity}</span>
                    <span className={`rag ${st}`}><span className="rag-dot" />{d.status.replace('_',' ')}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>{d.title}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{d.mda} · {d.directive} · {d.type}</div>
                </div>
                {d.variance !== 0 && (
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 20, fontWeight: 500, color: '#DC2626' }}>
                      {d.variance > 0 ? '+' : ''}{d.variance < 0 ? '' : ''}{d.variance}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>Variance (UGX B)</div>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, marginBottom: 12 }}>{d.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748B' }}>Assigned: <strong style={{ color: '#1E293B' }}>{d.assigned_to}</strong></span>
                <span style={{ color: '#E2E8F0' }}>·</span>
                <span style={{ fontSize: 11, color: '#64748B' }}>Detected: {d.detected}</span>
                {d.evidence.map(e => <span key={e} className="tag tag-slate">{e}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── USERS ────────────────────────────────────────────────────
  if (tab === 'users') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>System Users</h3>
          <p style={{ fontSize: 13, color: '#94A3B8' }}>All authorised APEX NEXUS users across roles and MDAs</p>
        </div>
        <button className="btn btn-primary">+ Add User</button>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Role</th><th>MDA / Department</th><th>Last Active</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {USERS.map(u => {
              const st = { Online: '#10B981', Active: '#3B82F6', Away: '#F59E0B', Offline: '#94A3B8' }[u.status];
              return (
                <tr key={u.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#1D4ED8', flexShrink: 0 }}>
                        {u.name.split(' ').slice(0,2).map(w=>w[0]).join('')}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{u.name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 12, color: '#64748B' }}>{u.role}</span></td>
                  <td><span className="tag tag-blue">{u.mda}</span></td>
                  <td><span style={{ fontSize: 12, color: '#94A3B8' }}>{u.last}</span></td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: st }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st }} />{u.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: '#DC2626' }}>Revoke</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return null;
}
