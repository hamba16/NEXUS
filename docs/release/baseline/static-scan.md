# Static scan results

Files scanned: 1 .css, 13 .jsx
Candidates by suggested severity: S0: 0, S1: 31, S2: 6, S3: 9

> Heuristic candidates only. Confirm each before reporting it as a defect. A clean scan is not a pass: rendered contrast, focus order, screen reader output and performance are not tested here.

## Findings

### input-no-label (S1, 16 found)
form control with no id, aria-label or wrapping <label>
Fix: Associate a visible label (htmlFor/id, wrapping label, or aria-label).
- app\components\FieldView.jsx:134 [low]
- app\components\FieldView.jsx:140 [low]
- app\components\FieldView.jsx:146 [low]
- app\components\FieldView.jsx:151 [low]
- app\components\FieldView.jsx:183 [low]
- ... and 11 more

### click-on-noninteractive (S1, 12 found)
e.g. click handler on <div> with no role, tabIndex or key handler
Fix: Use <button> or <a>/<Link>. Otherwise add role, tabIndex=0 and Enter/Space handling.
- app\components\BriefingModal.jsx:158 [medium]
- app\components\DirectiveModal.jsx:16 [medium]
- app\components\FieldView.jsx:201 [medium]
- app\components\NPAView.jsx:36 [medium]
- app\components\NPAView.jsx:96 [medium]
- ... and 7 more

### no-accessible-name (S1, 2 found)
icon-only <button> with no aria-label or hidden text
Fix: Add `aria-label="Close"` (or similar) and mark the icon `aria-hidden="true"`.
- app\components\BriefingModal.jsx:51 [medium]
- app\components\DirectiveModal.jsx:33 [medium]

### img-no-alt (S1, 1 found)
<img> without alt
Fix: Add meaningful alt, or `alt=""` if decorative.
- app\components\DirectiveImage.jsx:14 [high]

### tiny-font (S2, 3 found)
font-size 11px is below 12px
Fix: Use at least 12px for supporting text and 16px for body; prefer rem so user text size applies.
- app\globals.css:122 [medium]
- app\globals.css:197 [medium]
- app\globals.css:265 [medium]

### hover-only (S2, 2 found)
hover handler without a focus equivalent
Fix: Mirror hover behavior on focus and provide a tap path on touch.
- app\components\ConvenerView.jsx:128 [low]
- app\components\Sidebar.jsx:160 [low]

### no-reduced-motion (S2, 1 found)
animations or transitions found but no `prefers-reduced-motion` handling anywhere
Fix: Wrap non-essential motion in `@media (prefers-reduced-motion: no-preference)` or disable under `reduce`; use Tailwind `motion-safe:`.
- (project) [medium]

### 100vh (S3, 3 found)
`100vh` can clip content under mobile browser chrome
Fix: Use `100dvh` (or `svh`/`lvh`) with a `vh` fallback.
- app\globals.css:58 [medium]
- app\globals.css:63 [medium]
- app\globals.css:78 [medium]

### transition-all (S3, 3 found)
`transition: all` animates every property, including layout ones
Fix: List the properties you mean (e.g. `transition: opacity .2s, transform .2s`).
- app\globals.css:94 [high]
- app\globals.css:112 [high]
- app\globals.css:178 [high]

### user-select-none (S3, 2 found)
`user-select: none` found; confirm it is not applied to readable content
Fix: Limit it to controls and drag handles. Users need to select and copy text.
- app\globals.css:96 [low]
- app\globals.css:180 [low]

### no-color-scheme (S3, 1 found)
no dark mode, `color-scheme` or `light-dark()` handling detected
Fix: Decide on theme support deliberately; if added, redesign semantic tokens and re-check contrast in both themes.
- (project) [low]

## Symmetry report (token drift)

- Distinct literal colors in declarations: 44 (plus 26 defined as custom-property tokens)
- Distinct font sizes: 6; font weights: 3
- Distinct border radii: 8
- Distinct z-index values: 3 (max 100)
- `!important` declarations: 0
- Most used colors: #e2e8f0 (4), #ef4444 (4), #94a3b8 (3), #f1f5f9 (3), #10b981 (3)
- Drift: 44 distinct literal colors used directly in declarations; a healthy system uses roughly 8 to 16 via tokens.
- Drift: 8 distinct border radii; typically 3 to 5.

