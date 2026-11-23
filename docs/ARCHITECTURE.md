# Architecture

The web application is Next.js in `apps/web`. The HTTP API is FastAPI in `services/api`. Alembic manages PostgreSQL schema changes. Runtime database access uses `nexus_app`, which must not own application tables or have bypass privileges. Request permissions are enforced on the server and through transaction-scoped row-level policies.

Operational routes are closed during the account transition. `/healthz` returns only service availability. No public diagnostic endpoint invokes remote services. Data loading is an operator command, separate from the request process.

External government, identity and AI integrations are outside the product scope. A future project may assess such connections under separate authorisation, architecture and data-protection review; this build contains no provider implementation for them.

The web host and PostgreSQL service remain deployment infrastructure. Their locations and access controls must be recorded by the operator before processing personal information.
