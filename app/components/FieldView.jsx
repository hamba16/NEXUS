'use client';
import { useState } from 'react';
import { FIELD_REPORTS, DIRECTIVES } from '../data/seed';

export default function FieldView({ tab }) {
  const [verifyStep, setVerifyStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    directive: 'PD-003', district: 'Wakiso', location: '', coords: '', status: 'VERIFIED',
    summary: '', recommendation: '', photos: 0,
  });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const simulateGPS = () => setForm({ ...form, coords: `0.${Math.floor(Math.random()*9000+1000)}°N, 32.${Math.floor(Math.random()*9000+1000)}°E` });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setVerifyStep(1); setForm({ directive: 'PD-003', district: 'Wakiso', location: '', coords: '', status: 'VERIFIED', summary: '', recommendation: '', photos: 0 }); }, 4000);
  };

  if (tab === 'dashboard') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Active Field Missions</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Grace Atim — Senior Field Monitor · OPM Field Verification Unit</p>
      </div>

      {/* Active mission card */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F)', borderRadius: 14, padding: '22px 24px', marginBottom: 20, color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(148,163,184,1)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Current Mission</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Northern Uganda HC Survey</div>
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.9)', marginBottom: 14 }}>PD-005 — Health Systems · Pader, Kitgum, Lamwo Districts</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ l: 'Sites Visited', v: '23/40' }, { l: 'Photos Taken', v: 32 }, { l: 'Days Remaining', v: 2 }].map(s => (
                <div key={s.l}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 20, fontWeight: 500 }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.7)', marginTop: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.7)', marginBottom: 4 }}>GPS Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
              <span style={{ fontSize: 12, color: '#10B981' }}>Live</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', marginTop: 6 }}>3.0°N, 33.2°E</div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>Last sync: 14 min ago</div>
          </div>
        </div>
        <div style={{ marginTop: 16, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '57.5%', background: '#3B82F6', borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', marginTop: 5 }}>57.5% mission complete</div>
      </div>

      {/* Filed reports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {FIELD_REPORTS.slice(0, 4).map(r => (
          <div key={r.id} className="card card-hover" style={{ padding: '18px 20px', borderLeft: `3px solid ${r.status === 'FLAGGED' ? '#EF4444' : '#10B981'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#94A3B8' }}>{r.id}</span>
              <span className={`rag ${r.status === 'FLAGGED' ? 'rag-red' : 'rag-green'}`}><span className="rag-dot" />{r.status}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>{r.directive_title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B', marginBottom: 8 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {r.location.split(',')[0]}
            </div>
            <p style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.4, marginBottom: 10 }}>{r.summary.slice(0, 90)}…</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="tag tag-slate">{r.date}</span>
              <span className="tag tag-blue">{r.photos} 📷</span>
              {r.gps_confirmed && <span className="tag tag-green">GPS ✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'verify') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px', maxWidth: 820 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>New Field Verification</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>Submit an on-site verification report with GPS confirmation and photographic evidence</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
        {['Location & Directive', 'Site Findings', 'Evidence & Submit'].map((s, i) => {
          const num = i + 1;
          const active = verifyStep === num;
          const done = verifyStep > num;
          return (
            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#059669' : active ? '#1E40AF' : '#F1F5F9',
                  color: done || active ? 'white' : '#94A3B8',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {done ? '✓' : num}
                </div>
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#1E293B' : '#94A3B8' }}>{s}</span>
                {i < 2 && <div style={{ flex: 1, height: 1, background: done ? '#A7F3D0' : '#E2E8F0', margin: '0 10px' }} />}
              </div>
            </div>
          );
        })}
      </div>

      {submitted && (
        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>✓ Field report submitted — dispatched to DSEMR for review</div>
          <div style={{ fontSize: 11.5, color: '#059669', marginTop: 2 }}>Report ID: FR-2026-{Math.floor(Math.random()*900+100)} · {form.status === 'FLAGGED' ? '⚠️ Flagged for urgent review' : 'Standard processing'}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '22px 24px', marginBottom: 14 }}>
          {verifyStep === 1 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>Step 1 — Location & Directive</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="form-label">Presidential Directive</label>
                  <select name="directive" value={form.directive} onChange={handleChange} className="form-select">
                    {DIRECTIVES.map(d => <option key={d.id} value={d.id}>{d.id} — {d.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">District</label>
                  <select name="district" value={form.district} onChange={handleChange} className="form-select">
                    {['Wakiso','Kampala','Gulu','Lira','Mbale','Mbarara','Jinja','Soroti','Arua','Fort Portal','Kabale','Moroto','Hoima','Masaka','Kitgum','Pader','Lamwo','Butaleja','Kanungu','Mukono','Lwengo'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Specific Location / Site Name</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Gulu Regional Referral Hospital" className="form-input" />
                </div>
                <div>
                  <label className="form-label">GPS Coordinates</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="coords" value={form.coords} onChange={handleChange} placeholder="Lat, Long" className="form-input" style={{ flex: 1 }} />
                    <button type="button" onClick={simulateGPS} className="btn btn-ghost" style={{ flexShrink: 0, fontSize: 12 }}>📍 Capture</button>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setVerifyStep(2)} className="btn btn-primary">Next Step →</button>
            </div>
          )}

          {verifyStep === 2 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>Step 2 — Site Findings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Verification Status</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['VERIFIED', 'FLAGGED', 'INCONCLUSIVE'].map(s => (
                      <button
                        key={s} type="button"
                        onClick={() => setForm({ ...form, status: s })}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${form.status === s ? (s === 'VERIFIED' ? '#10B981' : s === 'FLAGGED' ? '#EF4444' : '#F59E0B') : '#E2E8F0'}`,
                          background: form.status === s ? (s === 'VERIFIED' ? '#ECFDF5' : s === 'FLAGGED' ? '#FEF2F2' : '#FFFBEB') : 'white',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          color: form.status === s ? (s === 'VERIFIED' ? '#065F46' : s === 'FLAGGED' ? '#7F1D1D' : '#78350F') : '#94A3B8',
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label">Site Summary</label>
                  <textarea name="summary" value={form.summary} onChange={handleChange} className="form-textarea" placeholder="Describe what you found on the ground…" style={{ minHeight: 90 }} />
                </div>
                <div>
                  <label className="form-label">Recommendation</label>
                  <textarea name="recommendation" value={form.recommendation} onChange={handleChange} className="form-textarea" placeholder="What action should DSEMR / the MDA take?" style={{ minHeight: 70 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => setVerifyStep(1)} className="btn btn-ghost">← Back</button>
                <button type="button" onClick={() => setVerifyStep(3)} className="btn btn-primary">Next Step →</button>
              </div>
            </div>
          )}

          {verifyStep === 3 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>Step 3 — Evidence & Submit</div>
              {/* Simulated photo upload */}
              <div style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: '32px 24px', textAlign: 'center', marginBottom: 16, cursor: 'pointer', background: '#FAFBFC' }}
                onClick={() => setForm({ ...form, photos: Math.min(form.photos + 1, 12) })}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" style={{ margin: '0 auto 10px', display: 'block' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Click to add photos</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>JPEG, PNG · Max 10MB each · GPS metadata auto-extracted</div>
                {form.photos > 0 && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>{form.photos} photo{form.photos !== 1 ? 's' : ''} added</div>}
              </div>
              <div style={{ padding: '14px 16px', background: '#F8F9FB', borderRadius: 8, border: '1px solid #E8E4DF', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>Submission Summary</div>
                {[
                  ['Directive', DIRECTIVES.find(d => d.id === form.directive)?.title || form.directive],
                  ['Location', form.location || 'Not set'],
                  ['GPS', form.coords || 'Not captured'],
                  ['Status', form.status],
                  ['Photos', form.photos],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#94A3B8', width: 80, flexShrink: 0 }}>{k}:</span>
                    <span style={{ color: '#1E293B', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setVerifyStep(2)} className="btn btn-ghost">← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Verification Report</button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );

  if (tab === 'reports') return (
    <div className="view-enter" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Filed Reports</h3>
        <p style={{ fontSize: 13, color: '#94A3B8' }}>All verification reports submitted by your team</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FIELD_REPORTS.map(r => (
          <div key={r.id} className="card" style={{ padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', borderLeft: `3px solid ${r.status === 'FLAGGED' ? '#EF4444' : '#10B981'}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#94A3B8' }}>{r.id}</span>
                <span className={`rag ${r.status === 'FLAGGED' ? 'rag-red' : 'rag-green'}`}><span className="rag-dot" />{r.status}</span>
                <span className="tag tag-slate">{r.directive}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>{r.directive_title}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>📍 {r.location}</div>
              <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>{r.summary}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{r.date}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{r.photos} photos</div>
              <div style={{ fontSize: 11, color: r.gps_confirmed ? '#059669' : '#94A3B8', marginTop: 4 }}>GPS {r.gps_confirmed ? '✓' : '✗'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return null;
}
