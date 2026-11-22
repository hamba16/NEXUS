# Phase 0 audit

Date: 22 November 2026. Scope: supplied local source export, not the remote repository or deployed exhibition. Audience: six institutional roles; context floor: keyboard access, 375 px Android-sized viewport, unreliable connectivity. Required bar: WCAG 2.2 AA and the production build brief.

## Verdict

Do not ship as an operational system. Source inspection confirms five blocker groups: no durable workflows, no authorisation enforcement, no evidence integrity/offline capture, misleading provenance and unsupported security assurances. Browser measurements are stored separately under `docs/release/baseline`; automated accessibility checks do not certify WCAG compliance.

## Runtime and routes

The only application route is `/`. Six role objects and all navigation tabs are React state; reload discards role and edits. `POST /api/briefing` accepts arbitrary focus strings, uses the same global demo arrays for every caller, and returns either hard-coded prose or Anthropic output. There is no actor dependency, access boundary, persistence, job queue, snapshot, approval or grounding check. `/data-audit.html` is a static public article. No manifest or service worker exists.

`npm ci` and `npm run build` succeeded on Node 24.13.0. Baseline Next.js 14.2.35 output: `/` 146 kB route JavaScript / 233 kB first-load JavaScript; shared bundle 87.8 kB. The build's type-check message does not imply TypeScript coverage: the source is JavaScript, with no TS configuration or test suite.

## Screen disposition

| Component / tabs | Current behaviour | Decision |
| --- | --- | --- |
| Landing | Six role buttons; unsupported classified/access-logged text; external photograph | Refactor: open-mode warning, synthetic profiles, accessible responsive selection |
| Sidebar / Topbar | Clickable div navigation; six static roles; transient notifications; fixed June-period badges | Refactor: semantic navigation, acting-as selector, real notifications and reporting period |
| Secretariat: dashboard, directives | Charts/filtering and detail modal work over unsourced arrays | Keep composition; replace data and labels |
| Secretariat: briefing | Calls real HTTP endpoint; text export labelled PDF | Replace workflow, retain document presentation |
| Secretariat: field, discrepancies, users | Static tables; no durable review or profile management | Replace behaviours |
| MDA: dashboard, KPIs | Static institution assignment and values; card submit button unwired | Refactor and bind to actor/institution |
| MDA: submit, history | Temporary success with random reference; no persistence; Save Draft/View buttons unwired | Replace with validated report/revision state machine |
| Field: dashboard, reports | Static missions; GPS status claims live | Replace source and honest device status |
| Field: verification wizard | Random coordinates; photo counter; transient submission | Replace with WebCrypto, device enrolment, IndexedDB, real GPS/media and sync |
| Convener: overview, map, NDP, brief | Global arrays; hard-coded briefing; no approval gate | Keep executive layout; restrict data and approved snapshots |
| Oversight: dashboard, discrepancy, audit, MDA risk | Static findings and risk arrays; modal inspection only | Replace with cases and append-only audit |
| Anchor/NPA: dashboard, pillars, mappings, projections | Invented five-pillar model and forecasts; wrong plan end year | Replace with sourced programme hierarchy and explainable calculations |
| DirectiveModal / DirectiveImage | Working inspection; external hotlinks and missing provenance | Refactor accessible modal; local illustrations; citation links |
| UgandaMap | Leaflet, external OSM tiles, approximate regional markers | Refactor configurable local/offline geography and labelled unknowns |

## Data, assets and scripts

`app/data/seed.js` exports ROLES, NDP_PILLARS, DIRECTIVES, QUARTERLY_TREND, PILLAR_PERFORMANCE, SECTOR_BREAKDOWN, DISCREPANCIES, FIELD_REPORTS, NOTIFICATIONS, MDA_DIRECTIVES and REGIONS. Additional arrays live in MDAView (HISTORY), SecretariatView (USERS), OversightView (MDA_RISK), NPAView (PROJECTION_DATA), ConvenerView (briefing prose), and the API. None has per-fact provenance. Demo numbering disagrees with the NPA report (for example, NPA directive 1 concerns Bujagali electricity costs). Existing numbers must never migrate as verified reference data.

Three backup files duplicate old seed/landing code. `swap_images.py` rewrites hotlinked images and creates backups; retire after preserving it in baseline Git history. Public assets: logo PNG, parliament JPEG of unverified licence, static audit HTML. Runtime uses Google Fonts, external photographs, OpenStreetMap and unconditional Vercel Analytics. Remove outbound defaults; licence verification is required before reusing third-party imagery.

The only application environment variable read is `ANTHROPIC_API_KEY`; the model is hard-coded to `claude-opus-4-8`, contradicting README. No `.env` was supplied or read. Current model source: [Anthropic model overview](https://platform.claude.com/docs/en/models/overview), retrieved 2026-11-22, lists `claude-sonnet-5-5`; make the choice configurable and test it only with authorised credentials.

The machine-readable inventory includes every source, asset and config path, imports, external URLs, environment names, byte sizes and hashes. No `.next` directory existed in the supplied export. Git was initialised locally; no remote source was overwritten.

## Findings by lens

| Severity | Finding | Evidence | Required verification |
| --- | --- | --- | --- |
| S0 | Submitted reports and evidence are lost | handlers only call setState/setTimeout | Reload and server read-back; cross-role end-to-end story |
| S0 | Role selection does not enforce data permissions | every role imports global arrays; API ignores actors | SQL/API/UI negative permission tests |
| S0 | Capture claims GPS/photo/signature integrity without implementing it | random GPS, integer photo counter, no crypto/PWA | Offline reload, tamper rejection and idempotent sync |
| S0 | Unsourced simulations and real-person personas look official | seeded allegations, named public figures, LIVE/classified text | Published provenance verifier; simulation flag/UI tests |
| S0 | README claims controls not present | JWT/RLS/immutable audit/TLS assertions | Accurate docs and executed security gates |
| S1 | Sidebar navigation is keyboard-inaccessible | click handlers on divs with no keyboard handlers | Keyboard navigation in each role |
| S1 | Form labels are not programmatically associated | labels without htmlFor; controls without id | axe plus keyboard/screen-reader inspection |
| S1 | Small low-contrast text and fixed desktop grids | 9–13 px text, light grey on ivory, fixed sidebar | Rendered contrast and 320/375 px reflow |
| S1 | PDF/share controls overpromise | .txt download, clipboard labelled secure sharing | PDF MIME/magic bytes, approval and download tests |
| S1 | Network privacy/offline posture contradicts the brief | fonts, photo hotlinks, tiles, analytics | Browser request allowlist and offline tests |

Static scanner: 44 distinct literal CSS colours plus 26 tokens, 6 CSS font sizes, 8 radii, 3 z-index values. Its 31 S1 candidates require contextual confirmation; its image-alt candidate is a false positive (DirectiveImage supplies alt), and modal backdrop clicks are not themselves accessibility defects. Counts above are grouped findings, not a sum of scanner nodes.

## Executed baseline measurements

Playwright captured landing, all 25 role tabs and a 375 px landing screen: **27 screenshots**, **54 axe rule violations summed across screens**, zero JavaScript page errors. This is 54 repeated rule/screen pairs, not 54 independent root causes. The mobile screenshot shows clipped content and a narrow selector despite the overflow heuristic returning false; visual evidence takes precedence over that heuristic. External requests observed: Wikimedia and three OSM tile subdomains.

Lighthouse mobile landing run: performance **71**, accessibility **94**, best practices **73**, SEO **100**; FCP **0.8 s**, LCP **45.0 s**, TBT **210 ms**, CLS **0**. This is one local lab run with external assets, not field p75 data or a role-dashboard measurement. The installed Lighthouse version does not expose the historical PWA category. No PWA score is claimed. Raw JSON records the version and run settings.

Phase-0 remediation removes unconditional analytics, Google font CSS and remote image defaults; makes optional map tiles opt-in; adds persistent simulated/open-mode labels; replaces known real-person personas; labels the existing text export honestly; retires backup files and the image hotlink rewrite script. The historical logo is retained; no claim about its ownership is made. The legacy behaviours remain explicitly exhibition-only until replaced by later phases.

What to retain: coherent navy/ivory palette; serif executive headings; clear TRACK/VERIFY/BRIEF information architecture; role-specific entry points; directive filtering; chart and map composition. Manual screen-reader, 400% zoom and field-device hardware checks remain unperformed.
