# Open-Mode Role Matrix

| Role | Allowed foundation actions |
|---|---|
| CONVENER | Read top-level workspace; no draft/report read in current RLS policy |
| SECRETARIAT | Read/review/accept/return reports and read audit events |
| MDA_OFFICER | Create/edit own-institution drafts; submit and react to returns |
| FIELD_MONITOR | No report access in the foundation policy |
| ANCHOR_ENTITY | Read accepted reports |
| OVERSIGHT | Read audit events |

The Profile Switcher may select any seeded profile in open mode. API route checks and PostgreSQL RLS both enforce role and institution context.
