# Clean-up inventory

The full input inventory was committed as `88c85b6` before application edits. It enumerates 229 tracked files and 3,817 file, route, endpoint, component, table and literal-copy entries. Every entry has a Keep, Finish or Remove decision and an owner batch. The precise source ledger remains in `artifacts/review/batch-0/inventory.json`; its quoted input text is audit evidence, not product copy.

## Current ownership

| Area | Decision | Owner batch | Acceptance requirement |
| --- | --- | --- | --- |
| Retired public routes and files listed in the input ledger | Remove | 1 | 404/410, no remaining navigation links |
| Public entrance, metadata and information pages | Finish | 1 | Server-rendered content and vocabulary/link checks |
| Provider probes and remote service clients | Remove | 1 | No executable imports or endpoints |
| Internal accounts and restricted database role | Finish | 2 | Session, MFA, CSRF and scope tests |
| Applied migration history | Keep | 2 | Forward migrations preserve records and enforce scope |
| Reporting and review | Finish | 3 | Complete workflow and permission tests |
| Directive register, decisions, milestones, evidence and notifications | Finish | 3 | Complete workflows before navigation exposure |
| Government Directory and Legal and Policy Framework | Finish | 3 | Read-only sourced records with dates |
| Operator reference-data loader | Finish | 4 | Input validation, citation checks and controlled writes |
| Reusable design components | Finish | 5 | Responsive and accessible controls with working actions |
| Operator and user documentation | Finish | 6 | Linked guides and executable walkthrough |
| Automated checks and deployment | Finish | 7 | Captured command output and live verification |

File-level removals are recorded in `artifacts/review/batch-1/removed.json`. The input review is retained in version history so that decisions remain traceable without reproducing retired product copy in the current documentation.
