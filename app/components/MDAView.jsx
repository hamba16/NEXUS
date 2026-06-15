'use client';
import { useState } from 'react';
import { MDA_DIRECTIVES } from '../data/seed';
import DirectiveModal from './DirectiveModal';

const RAGBadge = ({ status }) => {
  const cfg = { GREEN: { cls: 'rag-green', label: 'On Track' }, AMBER: { cls: 'rag-amber', label: 'At Risk' }, RED: { cls: 'rag-red', label: 'Critical' } }[status] || { cls: 'rag-grey', label: 'Pending' };
  return <span className={`rag ${cfg.cls}`}><span className="rag-dot" />{cfg.label}</span>;
};

const HISTORY = [
  { id: 'RPT-2026-034', directive: 'PD-003', title: 'Transport Infrastructure', period: 'Q4 FY2026', submitted: '2026-06-03', status: 'ACCEPTED', score: 82 },
  { id: 'RPT-2026-021', directive: 'PD-003', title: 'Transport Infrastructure', period: 'Q3 FY2026', submitted: '2026-03-05', status: 'ACCEPTED', score: 78 },
  { id: 'RPT-2026-019', directive: 'PD-006', title: 'Oil & Gas Revenue', period: 'Q3 FY2026', submitted: '2026-03-04', status: 'RETURNED', score: 60 },
  { id: 'RPT-2026-007', directive: 'PD-008', title: 'Digital Economy', period: 'Q2 FY2026', submitted: '2025-12-10', status: 'ACCEPTED', score: 74 },
  { id: 'RPT-2025-058', directive: 'PD-003', title: 'Transport Infrastructure', period: 'Q2 FY2026', submitted: '2025-12-08', status: 'ACCEPTED', score: 71 },
];

export default function MDAView({ tab }) {
  const [selectedDirective, setSelectedDirective] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    directive: 'PD-003',
    period: 'Q4 FY2026',
    milestone: '',
    kpi1: '', kpi2: '', kpi3: '', kpi4: '',
    rag: 'GREEN',
    budget_used: '',
    challenges: '',
    narrative: '',
    next_steps: '',
  });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  // ── MY DIRECTIVES ────────────────────────────────────────
  if (tab === 'dashboard') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>My Directives — MoWT</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Ministry of Works & Transport — 3 assigned Presidential Directives</p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Assigned', value: 3, color: '#1E40AF' },
          { label: 'Reports Due', value: 1, color: '#DC2626' },
          { label: 'Avg. Completion', value: '52%', color: '#D97706' },
          { label: 'Budget Released', value: '64%', color: '#059669' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>{s.label}</div>
            <div className="kpi-value" style={{ color: s.color, fontSize: 28 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Directive cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {MDA_DIRECTIVES.map(d => (
          <div key={d.id} className="card card-hover" style={{ overflow: 'hidden', borderTop: `3px solid ${d.rag === 'GREEN' ? '#10B981' : d.rag === 'AMBER' ? '#F59E0B' : '#EF4444'}` }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 10.5, color: '#94A3B8' }}>{d.id}</span>
                <RAGBadge status={d.rag} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 4, lineHeight: 1.3 }}>{d.title}</div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 14, lineHeight: 1.4 }}>{d.subtitle}</div>

              {/* Completion bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>Progress</span>
                  <span style={{ fontSize: 11, fontFamily: '"DM Mono", monospace', color: '#64748B' }}>{d.completion}%</span>
                </div>
                <div className="progress-track">
                  <div className={`progress-fill progress-${d.rag === 'GREEN' ? 'green' : d.rag === 'AMBER' ? 'amber' : 'red'}`} style={{ width: `${d.completion}%` }} />
                </div>
              </div>

              {/* KPI mini list */}
              {d.kpis.slice(0, 2).map(kpi => (
                <div key={kpi.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11.5 }}>
                  <span style={{ color: '#64748B' }}>{kpi.label}</span>
                  <span style={{ fontFamily: '"DM Mono", monospace', color: '#1E293B', fontWeight: 500 }}>
                    {typeof kpi.actual === 'number' ? kpi.actual.toLocaleString() : kpi.actual} <span style={{ color: '#94A3B8' }}>/ {typeof kpi.target === 'number' ? kpi.target.toLocaleString() : kpi.target} {kpi.unit}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #F1F5F9', padding: '12px 20px', display: 'flex', gap: 8 }}>
              <button onClick={() => setSelectedDirective(d)} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>View Details</button>
              <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Submit Report</button>
            </div>
          </div>
        ))}
      </div>

      {selectedDirective && <DirectiveModal directive={selectedDirective} onClose={() => setSelectedDirective(null)} />}
    </div>
  );

  // ── SUBMIT REPORT ────────────────────────────────────────
  if (tab === 'submit') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px', maxWidth: 860 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Submit Progress Report</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>All submissions are timestamped, digitally signed, and dispatched to DSEMR for verification</p>
      </div>

      {submitted && (
        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>Report submitted successfully</div>
            <div style={{ fontSize: 11.5, color: '#059669', marginTop: 1 }}>Reference: RPT-2026-{Math.floor(Math.random()*900)+100} · Dispatched to DSEMR for review</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '24px 28px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
            Section A — Directive & Period
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label">Presidential Directive</label>
              <select name="directive" value={form.directive} onChange={handleChange} className="form-select">
                {MDA_DIRECTIVES.map(d => <option key={d.id} value={d.id}>{d.id} — {d.title}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Reporting Period</label>
              <select name="period" value={form.period} onChange={handleChange} className="form-select">
                <option>Q4 FY2026</option><option>Q3 FY2026</option><option>Q2 FY2026</option>
              </select>
            </div>
            <div>
              <label className="form-label">Self-Assessed RAG</label>
              <select name="rag" value={form.rag} onChange={handleChange} className="form-select">
                <option value="GREEN">GREEN — On Track</option>
                <option value="AMBER">AMBER — At Risk</option>
                <option value="RED">RED — Critical</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px 28px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
            Section B — KPI Actuals (Q4 FY2025/26)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {(MDA_DIRECTIVES.find(d => d.id === form.directive)?.kpis || []).map((kpi, i) => (
              <div key={kpi.label}>
                <label className="form-label">{kpi.label} <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Target: {typeof kpi.target === 'number' ? kpi.target.toLocaleString() : kpi.target} {kpi.unit})</span></label>
                <input
                  name={`kpi${i + 1}`}
                  value={form[`kpi${i + 1}`]}
                  onChange={handleChange}
                  placeholder={`Actual ${kpi.unit}`}
                  className="form-input"
                  type={typeof kpi.target === 'number' ? 'number' : 'text'}
                />
              </div>
            ))}
            <div>
              <label className="form-label">Budget Utilised (UGX Billions)</label>
              <input name="budget_used" value={form.budget_used} onChange={handleChange} placeholder="e.g. 420" className="form-input" type="number" />
            </div>
            <div>
              <label className="form-label">Key Milestone Achieved</label>
              <input name="milestone" value={form.milestone} onChange={handleChange} placeholder="Describe primary milestone" className="form-input" />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px 28px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
            Section C — Narrative & Challenges
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Implementation Narrative</label>
              <textarea name="narrative" value={form.narrative} onChange={handleChange} className="form-textarea" placeholder="Describe implementation progress this quarter in detail…" style={{ minHeight: 100 }} />
            </div>
            <div>
              <label className="form-label">Challenges & Bottlenecks</label>
              <textarea name="challenges" value={form.challenges} onChange={handleChange} className="form-textarea" placeholder="Describe key challenges, bottlenecks, or risks to implementation…" style={{ minHeight: 80 }} />
            </div>
            <div>
              <label className="form-label">Planned Next Steps (Q1 FY2027)</label>
              <textarea name="next_steps" value={form.next_steps} onChange={handleChange} className="form-textarea" placeholder="Actions planned for the next quarter…" style={{ minHeight: 70 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
            This report will be signed and dated automatically on submission · Ref. Officer: Robert Okello, MoWT
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost">Save Draft</button>
            <button type="submit" className="btn btn-primary">
              Submit Report →
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  // ── HISTORY ──────────────────────────────────────────────
  if (tab === 'history') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Submission History</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>All directive progress reports submitted by MoWT</p>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Reference</th><th>Directive</th><th>Period</th><th>Submitted</th><th>Status</th><th>Score</th><th>Action</th></tr></thead>
          <tbody>
            {HISTORY.map(r => {
              const st = { ACCEPTED: { cls: 'rag-green', label: 'Accepted' }, RETURNED: { cls: 'rag-red', label: 'Returned' }, PENDING: { cls: 'rag-amber', label: 'Pending' } }[r.status];
              return (
                <tr key={r.id}>
                  <td><span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#64748B' }}>{r.id}</span></td>
                  <td>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{r.title}</div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{r.directive}</div>
                  </td>
                  <td><span style={{ fontSize: 12, color: '#64748B' }}>{r.period}</span></td>
                  <td><span style={{ fontSize: 12, color: '#94A3B8' }}>{r.submitted}</span></td>
                  <td><span className={`rag ${st?.cls}`}><span className="rag-dot" />{st?.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-track" style={{ width: 60 }}>
                        <div className="progress-fill progress-blue" style={{ width: `${r.score}%` }} />
                      </div>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#64748B' }}>{r.score}</span>
                    </div>
                  </td>
                  <td><button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>View</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── KPIS ────────────────────────────────────────────────────
  if (tab === 'kpis') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>My KPIs</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Performance against all KPI targets assigned to MoWT</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {MDA_DIRECTIVES.flatMap(d => d.kpis.map(kpi => ({ ...kpi, directive: d.title, did: d.id }))).map((kpi, i) => {
          const pct = typeof kpi.actual === 'number' && typeof kpi.target === 'number'
            ? Math.min(Math.round((kpi.actual / kpi.target) * 100), 120) : 50;
          const clr = kpi.status === 'GREEN' ? '#10B981' : kpi.status === 'AMBER' ? '#F59E0B' : '#EF4444';
          return (
            <div key={i} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>{kpi.did} — {kpi.directive}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', lineHeight: 1.3 }}>{kpi.label}</div>
                </div>
                <span className={`rag rag-${kpi.status.toLowerCase()}`}><span className="rag-dot" />{kpi.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                <div>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 22, fontWeight: 500, color: '#1E293B' }}>
                    {typeof kpi.actual === 'number' ? kpi.actual.toLocaleString() : kpi.actual}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 3 }}>{kpi.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Target: {typeof kpi.target === 'number' ? kpi.target.toLocaleString() : kpi.target} {kpi.unit}</div>
              </div>
              <div className="progress-track">
                <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: clr, borderRadius: 99 }} />
              </div>
              <div style={{ marginTop: 5, textAlign: 'right', fontSize: 10, color: '#94A3B8' }}>{pct}% of target</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return null;
}
