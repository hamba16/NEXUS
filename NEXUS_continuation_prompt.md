# APEX NEXUS — Continuation Prompt

## Context

This is a Next.js 14 app-router project called APEX NEXUS — a government oversight platform for Uganda's Office of the President tracking 23 Presidential Directives under NDP III. The codebase lives at `d:\PROBOOK\NEXUS` (Windows path). All source is under `app/` — components in `app/components/`, data in `app/data/seed.js`, API route at `app/api/briefing/route.js`.

A previous session completed the following tasks and they are **already done — do not redo them**:

- ✅ Installed `leaflet@1.9.4`, `react-leaflet@4.2.1`, `@anthropic-ai/sdk`
- ✅ `app/components/UgandaMap.jsx` — real Leaflet map with `CircleMarker`, OSM tiles, RAG colours, Tooltip, bounds locked to Uganda
- ✅ `app/components/DirectiveImage.jsx` — resilient sector-themed banner that layers an Unsplash photo on top; never shows a broken-image state
- ✅ `app/components/ConvenerView.jsx` — fully wired with `dynamic(() => import('./UgandaMap'), { ssr: false })`; SVG map removed
- ✅ `app/api/briefing/route.js` — server-side Next.js route; calls Anthropic SDK (`claude-opus-4-8`) when `ANTHROPIC_API_KEY` is set; returns a high-quality deterministic briefing from live directive data when no key is present
- ✅ `app/data/seed.js` — `REGIONS` array updated with real lat/lng coordinates for 11 Ugandan regional hubs
- ✅ `app/components/MDAView.jsx` — `handleSubmit` already wired (`e.preventDefault()` + `setSubmitted(true)` success state)

---

## Remaining Tasks — Complete All of These

Read every file before touching it. Make surgical edits — do not rewrite files wholesale.

---

### Task 1 — Rewire BriefingModal.jsx to call /api/briefing (not the Anthropic API directly)

**File:** `app/components/BriefingModal.jsx`

**Problem:** The `generate` async function currently calls `https://api.anthropic.com/v1/messages` directly from the browser. This always fails — CORS, no API key, missing `anthropic-version` header.

**Fix:** Replace the entire `fetch` call inside `generate` so it calls the server-side route instead:

```js
const res = await fetch('/api/briefing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ focus }),
});
const data = await res.json();
const text = data.briefing || 'Unable to generate briefing. Please try again.';
setBriefing(text);
setGenerated(true);
```

Remove the `SYSTEM_PROMPT` and `buildUserPrompt` constants entirely — they are now dead code (the server route owns them). Keep everything else in the component intact.

---

### Task 2 — Wire the three footer buttons in BriefingModal.jsx

**File:** `app/components/BriefingModal.jsx`

The footer that renders when `generated && !loading` has three buttons with no `onClick` handlers:

1. **"⬇ Download PDF"** — on click, trigger a `.txt` file download of the briefing content:
   ```js
   const blob = new Blob([briefing], { type: 'text/plain' });
   const url  = URL.createObjectURL(blob);
   const a    = document.createElement('a');
   a.href     = url;
   a.download = `Presidential_Briefing_${new Date().toISOString().slice(0,10)}.txt`;
   a.click();
   URL.revokeObjectURL(url);
   ```

2. **"Copy Text"** — copy briefing to clipboard:
   ```js
   navigator.clipboard.writeText(briefing);
   ```

3. **"Share Securely"** — same as Copy Text (clipboard copy). Change the button label to briefly show "Copied!" using a small piece of local state (`const [copied, setCopied] = useState(false)`), then reset after 2 seconds.

---

### Task 3 — Render DirectiveImage in DirectiveModal.jsx

**File:** `app/components/DirectiveModal.jsx`

`DirectiveImage` exists but is never imported or used here.

**Fix:**
1. Add `import DirectiveImage from './DirectiveImage';` at the top.
2. Inside the modal box, **before** the existing coloured gradient header `<div>`, insert:
   ```jsx
   <DirectiveImage directive={d} height={190} rounded={false} showLabel={false} />
   ```
   This gives every directive modal a real thematic photo banner at the top, above the gradient title block. No other changes to the modal structure.

---

### Task 4 — Fix the Landing.jsx hero image

**File:** `app/components/Landing.jsx`

**Problem:** The hero uses a Wikipedia URL (`https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Parliament_of_Uganda.jpg/1440px-Parliament_of_Uganda.jpg`) that is frequently blocked by Wikipedia's hotlink policy and returns a 403 in production.

**Fix:** Replace `UGANDA_PARLIAMENT_IMG` with this stable Unsplash URL:

```js
const UGANDA_PARLIAMENT_IMG = 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=1440&q=80';
```

Keep the `onError` handler on the `<img>` tag. No other changes.

---

### Task 5 — Fix "Mark all as read" in Topbar.jsx

**File:** `app/components/Topbar.jsx`

**Problem:** The "Mark all as read" button only calls `setShowNotifs(false)`. The `unread` count is derived from `NOTIFICATIONS` (imported static array), so clicking the button never clears the badge.

**Fix:**
1. Change the import line from `import { NOTIFICATIONS } from '../data/seed';` — keep the import but use it only as initial state.
2. Add local state: `const [notifs, setNotifs] = useState(NOTIFICATIONS);`
3. Recompute unread from local state: `const unread = notifs.filter(n => !n.read).length;`
4. Replace any reference to `NOTIFICATIONS.map(...)` / `NOTIFICATIONS.filter(...)` in the render with `notifs`.
5. Wire the button:
   ```js
   onClick={() => {
     setNotifs(prev => prev.map(n => ({ ...n, read: true })));
     setShowNotifs(false);
   }}
   ```

---

### Task 6 — Wire Quick Actions navigation in SecretariatView.jsx + page.js

**Files:** `app/components/SecretariatView.jsx`, `app/page.js`

**Problem:** The four Quick Action tiles ("View All Directives", "Discrepancy Register", "Field Reports", "Export Briefing PDF") are `<div>` elements with `cursor: pointer` but no `onClick`. They don't navigate anywhere.

**Fix — part A: page.js**
Pass `onTabChange` to SecretariatView:
```jsx
case 'secretariat': return <SecretariatView tab={tab} onTabChange={setTab} />;
```

**Fix — part B: SecretariatView.jsx**
1. Accept `onTabChange` in the function signature: `export default function SecretariatView({ tab, onTabChange }) {`
2. Convert the four Quick Action `<div>` tiles to `<button>` elements with appropriate `onClick` handlers. Map them to the correct tab keys:

| Label | Tab key |
|---|---|
| View All Directives | `'directives'` |
| Discrepancy Register | `'discrepancies'` |
| Field Reports | `'field'` |
| Export Briefing PDF | trigger a `window.print()` call (no tab navigation) |

```jsx
const QUICK_ACTIONS = [
  { label: 'View All Directives',   color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', tab: 'directives' },
  { label: 'Discrepancy Register',  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', tab: 'discrepancies' },
  { label: 'Field Reports',         color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', tab: 'field' },
  { label: 'Export Briefing PDF',   color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', tab: null },
];

// In the render:
{QUICK_ACTIONS.map(a => (
  <button
    key={a.label}
    onClick={() => a.tab ? onTabChange?.(a.tab) : window.print()}
    style={{
      padding: '10px 12px', borderRadius: 8, background: a.bg,
      border: `1px solid ${a.border}`, cursor: 'pointer',
      fontSize: 12, fontWeight: 600, color: a.color,
      textAlign: 'left', width: '100%',
    }}
  >
    {a.label}
  </button>
))}
```

---

### Task 7 — Final build verification

After all edits, run:
```bash
npm run build
```

Fix any TypeScript/ESLint errors that surface. The build must complete cleanly with no errors before you are done. Report the final build output.

---

## Constraints

- Read each file in full before editing it.
- Make the minimum diff required for each task. Do not reformat, reorganise, or rewrite sections unrelated to the fix.
- Do not install any new npm packages.
- Do not touch `seed.js`, `UgandaMap.jsx`, `DirectiveImage.jsx`, `ConvenerView.jsx`, or `app/api/briefing/route.js` — they are complete.
- Confirm each task as done before moving to the next.
