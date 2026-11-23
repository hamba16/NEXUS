'use client';

import { useEffect, useState } from 'react';

type Summary = { loaded: boolean; meta: Record<string, unknown>; counts: Record<string, number>; sources: Array<Record<string, unknown>> };
type RecordRow = { id: string; section: string; slug: string; payload: Record<string, unknown>; provenance: string; source_ids: string[]; as_of: string | null; reverify: boolean };

export default function ContextPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [section, setSection] = useState('reported_directives');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/backend/context').then(r => r.ok ? r.json() : Promise.reject(new Error('Context pack unavailable'))).then(setSummary).catch(e => setError((e as Error).message));
  }, []);

  useEffect(() => {
    fetch(`/backend/context/${section}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Could not load ${section}`))).then(setRecords).catch(e => setError((e as Error).message));
  }, [section]);

  const sections = [
    'reported_directives', 'ministers', 'senior_officials', 'directive_themes', 'public_indicators',
    'legal_instruments', 'appointment_events', 'oversight_architecture', 'sources', 'unverified_roles', 'unresolved_legal_instruments',
  ];

  return (
    <main id="main" className="bark min-h-[100dvh] bg-paper px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold-ink">Public-record context</p>
        <h1>Uganda context register</h1>
        <p className="mt-2 max-w-[70ch] text-lg text-ink-2">Sources, office holders, reported directives and indicators as of 23 November 2026. The 23 official directive texts remain unverified.</p>
        {error && <p role="alert" className="mt-4 rounded-m border-2 border-bad bg-bad-bg p-4 text-bad">{error}</p>}

        <section className="mt-6 rounded-l border border-hairline bg-surface p-5">
          <h2>Import a context pack</h2>
          <p className="mt-2 text-ink-3">Choose the complete Uganda context JSON. It will be stored as public-record or reported data only.</p>
          <input aria-label="Uganda context pack JSON" type="file" accept="application/json,.json" onChange={async event => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            try {
              const payload = JSON.parse(await file.text());
              const response = await fetch('/backend/context/import', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Actor-Id': localStorage.getItem('nexus.actor') || '' }, body: JSON.stringify(payload) });
              if (!response.ok) throw new Error(await response.text());
              await response.json();
              setError('');
              setSummary({ loaded: true, meta: payload.meta || {}, counts: {}, sources: payload.sources || [] });
              setSection('reported_directives');
              setRecords([]);
              window.location.reload();
            } catch (e) {
              setError((e as Error).message);
            }
          }} className="mt-3 min-h-hit w-full rounded-m border-2 border-hairline-strong bg-surface px-3 py-2" />
        </section>

        {summary && (
          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-l border border-hairline bg-surface p-4"><p className="text-sm text-ink-3">As of</p><p className="mt-1 text-xl font-semibold">{String(summary.meta.as_of || 'Not loaded')}</p></article>
            <article className="rounded-l border border-hairline bg-surface p-4"><p className="text-sm text-ink-3">Records loaded</p><p className="mt-1 text-xl font-semibold">{Object.values(summary.counts).reduce((sum, count) => sum + count, 0)}</p></article>
            <article className="rounded-l border border-hairline bg-surface p-4"><p className="text-sm text-ink-3">Sources</p><p className="mt-1 text-xl font-semibold">{summary.sources.length}</p></article>
          </section>
        )}

        <nav aria-label="Context sections" className="mt-6 flex flex-wrap gap-2">
          {sections.map(name => <button key={name} type="button" aria-pressed={section === name} onClick={() => setSection(name)} className="min-h-hit rounded-m border-2 border-hairline-strong bg-surface px-4 font-semibold text-nile hover:bg-nile-tint">{name.replaceAll('_', ' ')}</button>)}
        </nav>

        <section className="mt-6 space-y-3" aria-live="polite">
          {records.map(record => (
            <article key={record.id} className="rounded-l border border-hairline bg-surface p-5 shadow-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl">{String(record.payload.name || record.payload.title || record.payload.theme || record.payload.indicator || record.payload.citation || record.payload.short || record.payload.subject || record.payload.role || record.payload.instrument || record.slug)}</h2>
                <div className="flex flex-wrap gap-2 text-sm"><span className="rounded-full border border-hairline-strong px-3 py-1">{record.provenance}</span>{record.reverify && <span className="rounded-full border-2 border-warn bg-warn-bg px-3 py-1 text-warn">Reverify</span>}</div>
              </div>
              {typeof record.payload.office === 'string' && <p className="mt-2 font-semibold">{record.payload.office}</p>}
              {typeof record.payload.role === 'string' && <p className="mt-2">{record.payload.role}</p>}
              {typeof record.payload.outcome_to_date === 'string' && <p className="mt-3 max-w-[70ch] text-ink-2">{record.payload.outcome_to_date}</p>}
              {typeof record.payload.value === 'string' && <p className="mt-3 font-semibold">{record.payload.value}</p>}
              {typeof record.payload.relevance === 'string' && <p className="mt-3">{record.payload.relevance}</p>}
              {typeof record.payload.note === 'string' && <p className="mt-3 text-ink-3">{record.payload.note}</p>}
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {record.as_of && <div><dt className="font-semibold text-ink-3">As of</dt><dd>{record.as_of}</dd></div>}
                {record.source_ids.length > 0 && <div><dt className="font-semibold text-ink-3">Sources</dt><dd>{record.source_ids.join(', ')}</dd></div>}
              </dl>
            </article>
          ))}
          {records.length === 0 && !error && <p className="rounded-l border border-hairline bg-surface p-5 text-ink-3">No records loaded for this section.</p>}
        </section>
      </div>
    </main>
  );
}
