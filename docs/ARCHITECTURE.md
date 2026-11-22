# Architecture

## Runtime

- `apps/web`: Next.js 14 App Router, feature-switched Daylight UI and open-profile workspace.
- `services/api`: FastAPI, async SQLAlchemy, Pydantic contracts, PostgreSQL RLS.
- `packages/contracts`: generated OpenAPI and TypeScript schema artifacts.
- `packages/design`: Daylight Atlas design package.
- `seed`: provenance-first published seed plus synthetic operational fixtures.
- `infra`: Docker Compose foundation with PostgreSQL and MinIO.

## Authorization

An actor is resolved from `X-Actor-Id` in open mode, then transaction-scoped settings are applied before database work. RLS is forced on operational tables. No authentication claim is treated as identity.

## Data classes

Published reference data requires citations. Simulated operational records require `is_simulated=true`. The directive verifier fails closed until exactly 23 fully cited directives are available.
