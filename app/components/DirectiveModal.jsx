'use client';
import DirectiveImage from './DirectiveImage';

const RAGBadge = ({ status }) => {
  const cfg = { GREEN: { cls: 'rag-green', label: 'On Track' }, AMBER: { cls: 'rag-amber', label: 'At Risk' }, RED: { cls: 'rag-red', label: 'Critical' } }[status] || { cls: 'rag-grey', label: 'Pending' };
  return <span className={`rag ${cfg.cls}`}><span className="rag-dot" />{cfg.label}</span>;
};

export default function DirectiveModal({ directive: d, onClose }) {
  const totalBudget = d.budget_ugx;
  const spent = Math.round(totalBudget * d.completion / 100);

  const PILLAR_LABELS = { P1: 'Sustainable Production & Productivity', P2: 'Infrastructure & Climate Resilience', P3: 'Human Capital Development', P4: 'Governance & Security', P5: 'Private Sector & Regional Integration' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <DirectiveImage directive={d} height={190} rounded={false} showLabel={false} />
        {/* Header */}
        <div style={{
          background: d.rag === 'GREEN' ? 'linear-gradient(135deg, #064E3B, #065F46)' : d.rag === 'AMBER' ? 'linear-gradient(135deg, #78350F, #92400E)' : 'linear-gradient(135deg, #7F1D1D, #991B1B)',
          padding: '28px 28px 24px', color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4 }}>{d.id}</span>
                <RAGBadge status={d.rag} />
              </div>
              <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{d.title}</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', maxWidth: 520, lineHeight: 1.5 }}>{d.subtitle}</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {/* Progress */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              <span>Implementation Progress</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontWeight: 500 }}>{d.completion}%</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${d.completion}%`, background: 'rgba(255,255,255,0.85)', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Lead MDA', value: d.lead_mda },
              { label: 'Sector', value: d.sector },
              { label: 'Budget (UGX B)', value: totalBudget.toLocaleString() },
              { label: 'Budget Spent', value: `${spent.toLocaleString()} B` },
              { label: 'NDP III Pillar', value: d.ndp_pillar, full: true },
              { label: 'Region / Scope', value: d.region },
              { label: 'Anchor', value: d.anchor },
              { label: 'Last Report', value: d.last_report },
            ].map(item => (
              <div key={item.label} style={{ background: '#F8F9FB', borderRadius: 8, padding: '12px 14px', gridColumn: item.full ? 'span 2' : undefined }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{item.full ? PILLAR_LABELS[item.value] || item.value : item.value}</div>
              </div>
            ))}
          </div>

          {/* Supporting MDAs */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Supporting MDAs</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {d.supporting_mdas.map(m => <span key={m} className="tag tag-slate">{m}</span>)}
            </div>
          </div>

          {/* Narrative */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Implementation Narrative</div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, padding: '14px 16px', background: '#FAFBFC', borderRadius: 8, border: '1px solid #F1F5F9' }}>{d.narrative}</p>
          </div>

          {/* KPIs */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Key Performance Indicators</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {d.kpis.map(kpi => {
                const pct = kpi.unit === '%' || !kpi.unit.includes('K') && typeof kpi.actual === 'number' && typeof kpi.target === 'number'
                  ? Math.round((kpi.actual / (kpi.target || 1)) * 100)
                  : null;
                const clr = kpi.status === 'GREEN' ? '#10B981' : kpi.status === 'AMBER' ? '#F59E0B' : '#EF4444';
                return (
                  <div key={kpi.label} style={{ border: '1px solid #F1F5F9', borderRadius: 10, padding: '14px 16px', background: 'white' }}>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, lineHeight: 1.3 }}>{kpi.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, fontWeight: 500, color: '#1E293B' }}>
                          {typeof kpi.actual === 'number' ? kpi.actual.toLocaleString() : kpi.actual}
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 3 }}>{kpi.unit}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>
                        Target: {typeof kpi.target === 'number' ? kpi.target.toLocaleString() : kpi.target} {kpi.unit}
                      </span>
                    </div>
                    {pct !== null && (
                      <div className="progress-track">
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: clr, borderRadius: 99, transition: 'width 0.6s ease' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>Officer: <strong style={{ color: '#64748B' }}>{d.officer}</strong></span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm">Export Report</button>
            <button onClick={onClose} className="btn btn-primary btn-sm">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
