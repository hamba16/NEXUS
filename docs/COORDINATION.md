# UI/Backend Coordination

| Path / area | Owner | Notes |
|---|---|---|
| `packages/design/**` | UI agent | New `@nexus/design` package. |
| `apps/web/src/ui-v2/**` | UI agent | Presentational v2 screens and typed adapters. |
| `apps/web/app/**/page.tsx`, `layout.tsx` | Shared | Minimal route shell edits only. |
| `services/**`, `seed/**`, `infra/**`, `packages/contracts/**` | Backend agent | UI agent does not edit these areas. |
| `docs/PROGRESS.md`, `docs/DECISIONS.md` | Backend agent | UI agent uses UI-specific progress and decisions files. |

- 22 Nov 2026: added `@nexus/design`, Daylight tokens, comfort provider, Directive Wheel and HomeScreen behind `NEXT_PUBLIC_UI_V2`; existing workspace API/state remain in place.
