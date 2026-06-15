'use client';
import { useState } from 'react';
import { DIRECTIVES, QUARTERLY_TREND } from '../data/seed';

const green  = DIRECTIVES.filter(d => d.rag === 'GREEN').length;
const amber  = DIRECTIVES.filter(d => d.rag === 'AMBER').length;
const red    = DIRECTIVES.filter(d => d.rag === 'RED').length;
const critical = DIRECTIVES.filter(d => d.rag === 'RED').map(d => d.title).join(', ');
const ontrack  = DIRECTIVES.filter(d => d.rag === 'GREEN').map(d => d.title).join(', ');

const SYSTEM_PROMPT = `You are the Principal Secretary at Uganda's Directorate for Strategy, Execution Monitoring and Results (DSEMR), Office of the Prime Minister. You write precise, authoritative Presidential Briefings about the implementation status of Uganda's 23 Presidential Directives under the National Development Plan III (NDP III), FY 2025/26.

Your briefings are:
- Written in formal Ugandan government English
- Structured with clear sections: Executive Summary, Key Highlights, Areas Requiring Presidential Attention, Recommendations
- Specific — use real data provided
- Balanced — acknowledge progress while being frank about failures
- Approximately 500-700 words
- Addressed to H.E. the President of Uganda
- Never use bullet points — only formal paragraphs and numbered recommendations`;

function buildUserPrompt() {
  return `Generate a classified Presidential Briefing for H.E. President Yoweri Kaguta Museveni for the Cabinet Meeting scheduled 16 June 2026.

DATA — Q4 FY 2025/26:
- Total Presidential Directives: 23
- On Track (GREEN): ${green} — ${ontrack}
- At Risk (AMBER): ${amber}
- Critical (RED): ${red} — ${critical}
- National Composite Score: 63.7/100 (up from 61.4 in Q3)
- Budget Under Monitoring: UGX 14.6 Trillion across all MDAs

HIGHLIGHTS:
- Tourism revenues exceeded target: USD 2.1B (target USD 1.8B); 1.72M international arrivals
- Coffee exports reached USD 1.1B — record high
- Karuma Hydropower (600MW) now fully commercial
- EACOP pipeline 7% behind schedule due to international litigation
- National Health Insurance Scheme Bill stalled in Parliament
- Youth unemployment at 18.2% against 13.5% target
- Corruption KPIs missed for second consecutive quarter
- Defence procurement: UGX 168B gap identified between reported and verified spending
- UWEP fund disbursement at only 34% of allocation

Write the complete Presidential Briefing now.`;
}

export default function BriefingModal({ onClose, inline = false }) {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [focus, setFocus] = useState('full');

  const generate = async () => {
    setLoading(true);
    setBriefing('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildUserPrompt() }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === 'text')?.text || 'Unable to generate briefing. Please try again.';
      setBriefing(text);
      setGenerated(true);
    } catch {
      setBriefing('Connection error. Please check your network and try again.');
    }
    setLoading(false);
  };

  const content = (
    <div style={{ padding: inline ? 0 : '28px', maxWidth: inline ? '100%' : undefined }}>
      {!inline && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: '#1E293B' }}>AI Presidential Briefing</h2>
          {onClose && <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>}
        </div>
      )}

      {/* AI glow header */}
      <div className="ai-glow" style={{ padding: '20px 24px', marginBottom: 20, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.4)', border: '1px solid rgba(139,92,246,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E0D9FF' }}>Claude AI — Presidential Intelligence</div>
            <div style={{ fontSize: 10, color: 'rgba(196,181,253,0.7)' }}>Powered by Anthropic Claude Sonnet · Classified · Cabinet-Level</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(196,181,253,0.8)', lineHeight: 1.5 }}>
          Generates a classified, data-driven Presidential Briefing synthesising all 23 directive performance metrics, field verifications, and discrepancies — ready for Cabinet review.
        </p>

        {/* Focus selector */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {[{ id: 'full', label: 'Full Briefing' }, { id: 'red', label: 'Critical Issues Only' }, { id: 'economy', label: 'Economic Focus' }].map(f => (
            <button key={f.id} onClick={() => setFocus(f.id)} style={{
              padding: '4px 12px', borderRadius: 20, border: `1px solid ${focus === f.id ? '#8B5CF6' : 'rgba(139,92,246,0.3)'}`,
              background: focus === f.id ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.1)',
              color: focus === f.id ? '#E0D9FF' : 'rgba(196,181,253,0.7)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
            }}>{f.label}</button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={loading}
          style={{
            marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.7)',
            color: 'white', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Generating classified briefing…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {generated ? 'Regenerate Briefing' : 'Generate Presidential Briefing'}
            </>
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Briefing output */}
      {(loading || briefing) && (
        <div style={{ background: 'white', border: '1px solid #E8E4DF', borderRadius: 12, overflow: 'hidden' }}>
          {/* Document header */}
          <div style={{ padding: '20px 28px', borderBottom: '2px solid #0F172A', background: '#F9F7F4' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>⬛ CLASSIFIED — CABINET IN CONFIDENCE ⬛</div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>OFFICE OF THE PRIME MINISTER</div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 13, color: '#334155', marginBottom: 10 }}>Directorate for Strategy, Execution Monitoring and Results</div>
              <div style={{ height: 1, background: '#0F172A', marginBottom: 10 }} />
              <div style={{ fontSize: 12, color: '#64748B' }}>Presidential Briefing — Cabinet Session · 16 June 2026 · State House, Nakasero</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>For the Attention of H.E. the President of the Republic of Uganda</div>
            </div>
          </div>

          <div style={{ padding: '24px 28px', minHeight: loading ? 200 : undefined }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 16 }}>
                <div style={{ width: 40, height: 40, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: 13, color: '#64748B' }}>Synthesising 23 directive metrics and field reports…</div>
              </div>
            ) : (
              <div style={{ fontSize: 13.5, color: '#1E293B', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontFamily: '"Playfair Display", serif' }}>
                {briefing}
              </div>
            )}
          </div>

          {generated && !loading && (
            <div style={{ padding: '14px 28px', borderTop: '1px solid #F1F5F9', background: '#FAFBFC', display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm">⬇ Download PDF</button>
              <button className="btn btn-ghost btn-sm">Share Securely</button>
              <button className="btn btn-ghost btn-sm">Copy Text</button>
            </div>
          )}
        </div>
      )}

      {!briefing && !loading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <div style={{ fontSize: 13 }}>Click "Generate Presidential Briefing" to produce an AI-drafted executive summary</div>
        </div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-box" style={{ maxWidth: 780 }}>
        {content}
      </div>
    </div>
  );
}
