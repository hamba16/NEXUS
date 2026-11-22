# Architecture decisions

## ADR-001 — Preserve the supplied source export

The working directory has no Git metadata. Initialise a local repository and preserve a baseline commit before structural changes. Do not overwrite it with a remote clone or publish without a request. Repository-only scope includes local build tools and fixtures; no government, hosting or messaging services are provisioned.

## ADR-002 — Open access is a testing mode

Implement only open profile selection. Every request resolves an existing profile, then applies role and institution permissions in the API and transaction-local PostgreSQL RLS. The header is not authentication: anyone can select any profile. Production runtime requires explicit acknowledgement. No passwords or token endpoints.

## ADR-003 — Evidence before completion claims

Phase gates require actual execution. Docker is not currently discoverable on PATH. Compose files and passing unit tests cannot establish container, RLS, MinIO, deployment or fresh-clone acceptance. Keep unmet gates pending and record reproducible commands and failures.

## ADR-004 — Separate reference facts from operational simulations

The inherited 23 demo categories have no per-record sources and must not be treated as the official directive list. Source research is a separate, fail-closed pipeline. Unknown vote codes, coordinates and scorecards stay missing or explicitly unverified. Persist simulated flags and display a banner for operational examples. Do not infer official NPA five-level bands from an application RAG formula without a citation.

## ADR-005 — PostgreSQL-backed jobs and immutable snapshots

Use a PostgreSQL job queue with locked claims rather than an additional Redis service. AI and PDF inputs are immutable snapshots; approval is conditional on validation. RLS uses a non-owner, non-superuser application role. Migrations use a separate owner connection. Audit append operations serialize the chain head and database triggers prevent application UPDATE/DELETE.

## ADR-006 — Preserve design, replace simulated behaviours

Keep navy, ivory, serif headings, directive cards and six role workspaces. Replace transient success messages, random GPS, fake media and text masquerading as PDF with durable workflows. Remove unconditional analytics and external runtime assets. Baseline screenshots retain a record of the original demo, not evidence that its claims are true.

## ADR-007 — Fail closed for published directives

The inherited 23 exhibition categories are not promoted to published facts. `seed/verify_directives.py` requires exactly 23 unique directives with verbatim title/text, source citations and status history. The register remains incomplete until source extraction is verified.
