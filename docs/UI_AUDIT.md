# UI Audit

Date: 22 November 2026.

| Route | Role | Existing data | Replaced component |
|---|---|---|---|
| `/` | All six open profiles | `/profiles`, `/reports`, report transitions | Profile chooser and `Workspace` shell; v2 is feature-switched |
| `/showcase` | Exhibition | Static showcase content | Not replaced in the first UI slice |

Existing profile and report types come from `packages/contracts/schema.d.ts` and remain fetched by `Workspace`. The v2 home adapter derives only visual wheel values from the demo seed and marks them as simulated in UI copy.
