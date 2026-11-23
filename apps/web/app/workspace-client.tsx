'use client';

import { useEffect, useState } from 'react';
import type { components } from '../../../packages/contracts/schema';
import { UiSwitch } from '../src/ui-v2/UiSwitch';
import { HomeScreen } from '../src/ui-v2/screens/HomeScreen';
import { directiveWheelItems } from '../src/ui-v2/adapters/directiveWheel';

type Profile = components['schemas']['ProfileOut'];
type Report = components['schemas']['ReportOut'];
type ReportInput = components['schemas']['ReportCreate'];
type Action = components['schemas']['Transition']['action'];

const emptyReport: ReportInput = { title: '', period: 'FY2026/27 Q2', narrative: '' };
const roleLabels: Record<Profile['role'], string> = {
  CONVENER: 'Convener', SECRETARIAT: 'Secretariat', MDA_OFFICER: 'MDA officer',
  FIELD_MONITOR: 'Field monitor', ANCHOR_ENTITY: 'Anchor entity', OVERSIGHT: 'Oversight',
};

async function api<T>(path: string, actor?: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/backend${path}`, {
    ...init, headers: { 'Content-Type': 'application/json', ...(actor ? { 'X-Actor-Id': actor } : {}), ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : `Request failed (${response.status}). Check your entries and retry.`);
  }
  return response.json() as Promise<T>;
}

function ReportCard({ report, profile, busy, act, edit }: {
  report: Report; profile: Profile; busy: boolean;
  act: (report: Report, action: Action, comment: string) => void;
  edit: (report: Report) => void;
}) {
  const [comment, setComment] = useState('');
  return <article className="workspace-card">
    <div className="workspace-row"><h3>{report.title}</h3><span className="workspace-status">{report.state.replaceAll('_', ' ')}</span></div>
    <p className="workspace-meta">{report.period} · Revision {report.version} · Simulated</p>
    <p className="workspace-narrative">{report.narrative}</p>
    {report.review_comment && <blockquote>Review: {report.review_comment}</blockquote>}
    {profile.role === 'MDA_OFFICER' && ['DRAFT','RETURNED'].includes(report.state) && <div className="workspace-actions">
      <button disabled={busy} onClick={() => edit(report)}>Edit draft</button>
      <button disabled={busy} onClick={() => act(report, 'submit', '')}>Submit for review</button>
    </div>}
    {profile.role === 'SECRETARIAT' && ['SUBMITTED','AI_SUMMARISED'].includes(report.state) && <button disabled={busy} onClick={() => act(report, 'review', '')}>Begin review</button>}
    {profile.role === 'SECRETARIAT' && report.state === 'UNDER_REVIEW' && <div>
      <label htmlFor={`comment-${report.id}`}>Review comment (required to return)</label>
      <textarea id={`comment-${report.id}`} value={comment} onChange={e => setComment(e.target.value)} maxLength={4000} />
      <div className="workspace-actions"><button disabled={busy} onClick={() => act(report, 'accept', comment)}>Accept report</button><button disabled={busy || !comment.trim()} onClick={() => act(report, 'return', comment)}>Return for changes</button></div>
    </div>}
  </article>;
}

export default function Workspace() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [form, setForm] = useState<ReportInput>(emptyReport);
  const [editing, setEditing] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const profile = profiles.find(p => p.id === selected);

  useEffect(() => {
    const controller = new AbortController();
    api<Profile[]>('/profiles', undefined, { signal: controller.signal }).then(data => {
      setProfiles(data);
      const saved = localStorage.getItem('nexus.actor');
      if (data.some(p => p.id === saved)) setSelected(saved!);
    }).catch(e => { if (!controller.signal.aborted) setError(`The API is unavailable. Start the foundation services, then retry. ${e.message}`); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    const controller = new AbortController();
    setReports([]); setForm(emptyReport); setEditing(null); setError(''); setNotice('');
    if (profile) {
      localStorage.setItem('nexus.actor', profile.id);
      if (['MDA_OFFICER','SECRETARIAT','ANCHOR_ENTITY'].includes(profile.role)) {
        setLoading(true);
        api<Report[]>('/reports', profile.id, { signal: controller.signal }).then(setReports).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
      } else setLoading(false);
    }
    return () => controller.abort();
  }, [profile]);

  async function save() {
    if (!profile) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api<Report>(editing ? `/reports/${editing.id}` : '/reports', profile.id, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(editing ? { ...form, version: editing.version } : form) });
      setReports(previous => [result, ...previous.filter(r => r.id !== result.id)]);
      setForm(emptyReport); setEditing(null); setNotice('Draft saved to the database. You can reload this page.');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function act(report: Report, action: Action, comment: string) {
    if (!profile) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api<Report>(`/reports/${report.id}/transition`, profile.id, { method: 'POST', body: JSON.stringify({ action, comment, version: report.version }) });
      setReports(previous => previous.map(r => r.id === result.id ? result : r));
      setNotice(`Report is now ${result.state.toLowerCase().replaceAll('_',' ')}. Revision ${result.version} saved.`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return <UiSwitch v1={<div className="workspace">
    <a className="workspace-skip" href="#workspace-main">Skip to workspace</a>
    <header className="workspace-header">
      <a href="/" className="workspace-brand"><img src="/apex-nexus-logo.png" width={40} height={40} alt="" /><span>APEX NEXUS<small>Executive Oversight Intelligence</small></span></a>
      <nav aria-label="Workspace tools" className="flex flex-wrap gap-4"><a href="/context">Uganda context register</a><a href="/showcase">Exhibition reference</a></nav>
    </header>
    <main id="workspace-main">
      <div className="workspace-intro"><p className="workspace-eyebrow">Office of the President · Product development workspace</p><h1>Accountability begins with a clear record.</h1><p>Choose a synthetic profile to exercise persisted reporting and review. Published directive research and the remaining production modules are still in progress.</p></div>
      {error && <div role="alert" className="workspace-error">{error}<button disabled={busy} onClick={() => setReload(n => n + 1)}>Retry connection</button></div>}
      {notice && <p role="status" className="workspace-success">{notice}</p>}
      {loading && <p role="status">Loading workspace…</p>}
      {profiles.length > 0 && <section className="workspace-card" aria-label="Profile switcher">
        <div className="workspace-columns"><div><label htmlFor="profile-search">Find a profile or institution</label><input id="profile-search" value={search} onChange={e => setSearch(e.target.value)} type="search" /></div><div><label htmlFor="profile">Acting as</label><select id="profile" value={selected} disabled={busy || loading} onChange={e => setSelected(e.target.value)}><option value="">Choose a profile</option>{Object.entries(roleLabels).map(([role,label]) => <optgroup key={role} label={label}>{profiles.filter(p => p.role === role && `${p.name} ${p.institution_name}`.toLowerCase().includes(search.toLowerCase())).map(p => <option key={p.id} value={p.id}>{p.name} · {p.institution_name}</option>)}</optgroup>)}</select></div></div>
        {!selected && <div className="workspace-role-grid">{Object.entries(roleLabels).map(([role,label]) => <button disabled={busy || loading} key={role} onClick={() => setSelected(profiles.find(p => p.role === role)?.id || '')}>{label}</button>)}</div>}
        {profile && <p className="workspace-acting">Acting as {profile.name} · {roleLabels[profile.role]} · {profile.institution_name}</p>}
      </section>}
      {profile?.role === 'MDA_OFFICER' && <section aria-labelledby="draft-title" className="workspace-card">
        <h2 id="draft-title">{editing ? 'Edit report' : 'Prepare a quarterly report'}</h2>
        <p className="workspace-meta">Drafts are visible to your institution and the Secretariat. All entries in this workspace are simulated.</p>
        <form onSubmit={e => { e.preventDefault(); void save(); }}>
          <div className="workspace-columns"><div><label htmlFor="report-title">Report title</label><input id="report-title" required minLength={5} maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div><div><label htmlFor="period">Reporting period</label><select id="period" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}><option>FY2026/27 Q2</option><option>FY2026/27 Q1</option><option>FY2025/26 Q4</option></select></div></div>
          <label htmlFor="narrative">Progress, challenges and requested action</label><textarea id="narrative" required minLength={20} maxLength={20000} rows={5} value={form.narrative} onChange={e => setForm({ ...form, narrative: e.target.value })} />
          <div className="workspace-actions"><button disabled={busy} type="submit">{busy ? 'Saving…' : 'Save draft'}</button>{editing && <button type="button" disabled={busy} onClick={() => { setEditing(null); setForm(emptyReport); }}>Cancel edit</button>}</div>
        </form>
      </section>}
      {profile && ['MDA_OFFICER','SECRETARIAT','ANCHOR_ENTITY'].includes(profile.role) && <section aria-labelledby="reports-title"><h2 id="reports-title">{profile.role === 'SECRETARIAT' ? 'Review queue' : profile.role === 'ANCHOR_ENTITY' ? 'Accepted reports' : 'Your institution’s reports'}</h2>{!loading && reports.length === 0 && <p className="workspace-card">No reports available for this profile.</p>}{reports.map(r => <ReportCard key={r.id} report={r} profile={profile} busy={busy} act={(r,a,c) => void act(r,a,c)} edit={r => { setEditing(r); setForm({ title:r.title, period:r.period, narrative:r.narrative }); document.getElementById('report-title')?.focus(); }} />)}<p className="workspace-meta">Showing up to 50 recent reports. Full pagination is a later TRACK gate.</p></section>}
      {profile && !['MDA_OFFICER','SECRETARIAT','ANCHOR_ENTITY'].includes(profile.role) && <section className="workspace-card"><h2>{roleLabels[profile.role]} workspace</h2><p>{profile.role === 'CONVENER' ? 'No approved briefing is available. This profile cannot read MDA drafts or review reports.' : profile.role === 'FIELD_MONITOR' ? 'Device enrolment and offline evidence capture are pending the VERIFY phase. This profile cannot read MDA reports.' : 'Case management is pending the discrepancy phase. Audit entries can be inspected through the authorised API.'}</p></section>}
    </main>
    <footer>Development foundation · Synthetic institutions and personas · Open profile selection provides no identity assurance.</footer>
  </div>} v2={<HomeScreen
    profiles={profiles}
    selected={selected}
    onSelect={setSelected}
    reports={reports}
    loading={loading}
    error={error}
    notice={notice}
    onRetry={() => setReload(n => n + 1)}
    onEdit={report => { setEditing(report as Report); setForm({ title: report.title, period: report.period, narrative: report.narrative }); }}
    onAct={(report, action, comment) => void act(report as Report, action as Action, comment)}
    wheelItems={directiveWheelItems()}
  />} />;
}
