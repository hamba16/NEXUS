# APEX NEXUS

Executive Oversight Platform.

## Review record

The accepted inventory is recorded in commit `88c85b6`. The complete input ledger and live browser evidence are stored under `artifacts/review/batch-0/`. The first removal gate passes locally: production build, typecheck, 18 public-route checks and two API boundary tests. This checkpoint is not a release acceptance claim.

## Local web checks

Use Node 22 or later. Run `npm ci`, `npm run build`, then `npm run start`. With the production server running, run `npm run hygiene`. Python API dependencies are listed in `services/api/requirements.txt`.

Private configuration remains in ignored environment files. Do not commit or print database credentials. Migrations use a direct owner connection; application traffic must use the restricted `nexus_app` account.

## Documentation

- [Inventory and batch ownership](docs/cleanup-inventory.md)
- [Architecture](docs/architecture.md)
- [Operator data loading](docs/reference-data-loading.md)
- [Work ledger](docs/work-ledger.md)
