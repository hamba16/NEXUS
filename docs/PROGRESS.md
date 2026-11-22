# APEX NEXUS build progress

As of 22 November 2026 (FY2026/27 Q2). This is an implementation ledger, not a release certificate.

| Phase | Status | Evidence / remaining gate |
| --- | --- | --- |
| 0 Audit and plan | In progress | Source inventory complete; baseline browser and build measurements pending. |
| 1 Foundations | Pending | Monorepo, strict TypeScript, API, migrations, RLS, Compose and CI. |
| 2 Domain and published seed | Pending | Exactly 23 source-verified directives required; existing demo is not authoritative. |
| 3 Open profiles | Pending | Actor resolution and SQL/API/UI role tests. |
| 4 TRACK | Pending | Durable reporting and review workflow. |
| 5 VERIFY | Pending | Offline signed evidence, durable outbox and sync tests. |
| 6 Discrepancy and AI | Pending | Rule tests, grounding and adversarial evaluation. |
| 7 BRIEF and APEX | Pending | Approval, real PDF, sessions and action register. |
| 8 Simulated data and polish | Pending | Seed, accessibility, Lighthouse and load gates. |
| 9 Hardening and release | Pending | Fresh-clone demo, backups, scans, CI and release evidence. |

## Environment findings

- Supplied directory is a source export: no `.git` directory, no committed `.next` to untrack.
- Node 24.13.0, npm 11.6.2, Python 3.14.2 and GNU Make are available.
- Docker is not on PATH; container runtime acceptance remains unverified.
- Original app has one page, six local-state role views, one Next.js briefing route, no database/service worker/backend.

## Resume procedure

Read this file, `DECISIONS.md` and `AUDIT.md`; inspect Git status and actual test evidence before declaring a gate complete. Preserve failures and unavailable checks explicitly. Never replace missing published facts with invented data.
