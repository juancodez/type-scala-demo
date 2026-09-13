# Type Scala — Session Handoff

**Purpose of this file:** if I open a new Claude session with zero prior context, pasting the "Boot prompt" section below (and pointing Claude at this folder) restores the full picture — architecture, decisions, gotchas, and what's left to do.

---

## 🚀 Boot prompt (paste this into a new Claude session)

```
I'm working on a Figma plugin called "Type Scala" at C:\Users\tn\Type-skala-Demo.
Read HANDOFF.md and CLAUDE.md in that folder — they contain the full project context,
the code architecture, every bug we hit and how we fixed it, and what's still pending.
Also read PUBLISH.md if we're preparing to submit.
Then wait for my next instruction. Do NOT change any code until I ask.
```

That's it. Claude reads the three files and comes back with full context.

---

## What Type Scala is

A Figma plugin that generates a typographic scale from two inputs (base font size + ratio) and creates 8 Figma Text Styles (H1 → Caption). Optionally, it also creates a "showcase" frame on the canvas with sample text at each size, using a typeface the user picks from a Figma-native-style dropdown.

**One-sentence pitch:** two numbers → a full typographic system.

---

## Files (all in `C:\Users\tn\Type-skala-Demo`)

| File | Role | Size |
|------|------|------|
| `manifest.json` | Plugin metadata — id, main script, UI, network access, editor type | ~10 lines |
| `code.js` | Plugin thread. Has Figma API access. Handles font loading, style creation, frame creation. | ~130 lines |
| `ui.html` | UI thread — inputs, preview, custom font picker with search + lazy-load. Communicates with code.js via postMessage. | ~380 lines |
| `CLAUDE.md` | Living dev journal — build log per version, decisions, known ceilings | — |
| `HANDOFF.md` | This file — full context for session restart | — |
| `PUBLISH.md` | Submit-to-Community checklist (icons, listing copy, technical gates) | — |
| `icon-32.png` | ❌ TO BE PROVIDED by user before publish | 32×32 |
| `icon-128.png` | ❌ TO BE PROVIDED by user before publish | 128×128 |

---

## Architecture

Two-thread sandbox — standard Figma pattern:

```
   ┌─────────────────────┐       postMessage      ┌─────────────────────┐
   │  code.js            │  ────────────────────▶ │  ui.html            │
   │  (plugin thread)    │  ◀──────────────────── │  (UI thread)        │
   │                     │                        │                     │
   │  - figma.* API      │                        │  - DOM              │
   │  - createTextStyle  │                        │  - Google Fonts     │
   │  - createFrame      │                        │  - <link> lazy load │
   │  - loadFontAsync    │                        │  - user inputs      │
   │  - clientStorage    │                        │  - preview render   │
   └─────────────────────┘                        └─────────────────────┘
```

### Data flow (user clicks Generate)

1. `ui.html` → `postMessage({ pluginMessage: { type: 'generate', baseSize, ratio, prefix, fontFamily, createFrame } })`
2. `code.js` receives via `figma.ui.onmessage`
3. `loadBestFont(family)` — picks best "regular" style variant, calls `figma.loadFontAsync`
4. Loop through 8 `LEVELS`, upsert `TextStyle` for each (find existing by name or create new)
5. If `createFrame`: create Frame with auto-layout, one Text node per style, `t.textStyleId = style.id`, attach to page
6. `code.js` → `postMessage({ type: 'done', styles })` back to UI
7. UI shows green banner "8 styles created ✓"

### Data flow (font list loading)

1. `code.js` startup: `figma.clientStorage.getAsync('typescala:fontFamilies')` → if cached, post to UI immediately
2. In parallel: `figma.listAvailableFontsAsync()` → full list with all styles per family
3. Extract unique family names, post to UI, re-cache in clientStorage
4. UI receives, populates the custom picker

### Font picker in UI

- Custom combobox (not native `<select>` or `<datalist>`) — needed for the Figma-native look
- Trigger div → click → panel with search + scrollable list
- Each list item's `style.fontFamily` = the font itself → renders in its own typeface
- Lazy-loads Google Fonts stylesheets on scroll — only for items about to be visible
- Search debounced 120ms, scroll rAF-throttled

---

## Scale math

```
size(step) = baseSize × ratio^step
```

Levels (fixed):

| Style | step | With base=16, ratio=1.25 |
|-------|------|--------------------------|
| H1 | +5 | 49px |
| H2 | +4 | 39px |
| H3 | +3 | 31px |
| H4 | +2 | 25px |
| H5 | +1 | 20px |
| Body | 0 | 16px (= base) |
| Small | -1 | 13px |
| Caption | -2 | 10px |

Sizes are `Math.max(1, Math.round(...))` — integers only, minimum 1.

---

## Bugs we hit and why the fix works

This section is critical for future-you. Every fix here is the result of an actual bug that shipped, not premature engineering.

### 1. Placeholder plugin ID rejected by Figma
- **Symptom:** Manifest wouldn't import
- **Cause:** `"id": "REPLACE_WITH_ID_FROM_FIGMA_PLUGIN_CREATE"` — Figma expects numeric string
- **Fix:** Numeric placeholder `"1000000000000000001"` (must still be replaced with real ID before publish)

### 2. Hardcoded `style: 'Regular'` broke ~40% of fonts
- **Symptom:** Silent failure on many typefaces
- **Cause:** Many fonts use `'Book'`, `'Roman'`, `'Text'`, `'Normal'`, `'Medium'` as their upright style — not `'Regular'`
- **Fix:** `loadBestFont(family)` in code.js — prefers `Regular → Book → Roman → Normal → Text → Medium → Light`, falls back to first available style, falls back to brute-force try/catch if `allFonts` not yet loaded

### 3. Text nodes appeared empty in the showcase frame
- **Symptom:** Frame created but text boxes were blank
- **Cause:** Setting `.characters` BEFORE `.fontName` on a text node throws silently. Same for setting `.fontSize` before `.fontName` on a style
- **Fix:** Strict property order — `fontName` FIRST, then `characters` on text nodes; `fontName` FIRST, then `fontSize` on styles

### 4. IntersectionObserver with `root` element unreliable in Figma iframe
- **Symptom:** Font lazy-loading either didn't fire or fired for wrong items
- **Cause:** Figma's sandboxed iframe treats IntersectionObserver `root` inconsistently
- **Fix:** Replaced with plain scroll listener + `offsetTop < visibleBottom` check + rAF throttle

### 5. Every Google Font loaded on plugin startup
- **Symptom:** UI hung on open, network flooded with hundreds of `<link>` fetches
- **Cause:** `renderList()` called `loadVisible()` while panel was `display:none`. In that state `clientHeight = 0` and `offsetTop = 0` for all items, so `offsetTop < scrollTop + 0 + 160 = 160` was true for EVERY item
- **Fix:** `loadVisible()` guards: `if (!$fpPanel.classList.contains('open') || !$fpList.clientHeight) return;`

### 6. Font list took 500ms-2s to load every open
- **Symptom:** "Typeface" showed "loading…" every time plugin opened, user waited
- **Cause:** `figma.listAvailableFontsAsync()` enumerates system fonts, inherently slow
- **Fix:** Cache families in `figma.clientStorage`. Post cache immediately on open, fetch fresh in background, overwrite silently

### 7. Errors failed silently
- **Symptom:** User clicked Generate, button stuck on "Generating…" forever
- **Cause:** Errors inside `figma.ui.onmessage` handler weren't caught
- **Fix:** Top-level try/catch, error posts `{type:'error', message}` back to UI, red banner surfaces the message

---

## Ponytail principles applied

The whole plugin was built in "ponytail" mode — lazy senior dev, minimum code, native features first. Specifically:

- **No build step** — plain JS + single HTML file. No TypeScript, no npm, no bundler.
- **No frameworks** — vanilla DOM. No React, no Vue, no Svelte.
- **Native `<select>` + custom combobox** — the font picker uses a custom panel only because Figma's native look demands it. The preset dropdown uses native `<select>`.
- **`figma.clientStorage`** for cache — not IndexedDB directly, not a wrapper library.
- **Google Fonts CSS API** — no custom font loader, no webfont loader library.
- **Ponytail comments** — three `// ponytail:` lines mark deliberate simplifications (integer rounding, cache strategy, brute-force font-style fallback).

---

## Known ceilings (deliberate — add only when asked)

Marked with `// ponytail:` intent in code where relevant. Do NOT add these unless the user explicitly asks:

- No font-weight control (all styles use the same weight)
- No line-height / letter-spacing config
- No cleanup of old styles (upsert only)
- No auto-generation of icons — user supplies
- No export/import of scale settings
- Fonts not on Google Fonts show in fallback font in the picker (system fonts, Adobe Fonts, proprietary)

---

## What's done vs. pending

### Done (v1 → v10)
- ✅ Core scale math + 8 levels
- ✅ Text Style creation (upsert)
- ✅ Showcase frame with auto-layout
- ✅ Custom Figma-native font picker (search + scroll + checkmark + own-typeface rendering)
- ✅ Font list cache in clientStorage (instant on 2nd+ opens)
- ✅ Robust font style picking (Regular/Book/Roman/…)
- ✅ Error surfacing in UI
- ✅ All performance issues resolved
- ✅ CLAUDE.md build log
- ✅ PUBLISH.md submission checklist

### Pending
- ❌ Real plugin ID from Figma (user must get it from Plugins → Development → New plugin…)
- ❌ Icons: `icon-32.png`, `icon-128.png` (user will provide)
- ❌ Cover art 1920×960 for Community page
- ❌ Screenshots (up to 12)
- ❌ Support contact URL/email
- ❌ Community listing final copy (draft in PUBLISH.md)

---

## Manifest reference

```json
{
  "name": "Type Scala",
  "id": "1000000000000000001",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": ["https://fonts.googleapis.com", "https://fonts.gstatic.com"]
  }
}
```

Note: no `documentAccess: "dynamic-page"` — we don't traverse the page tree, just create styles.

---

## Testing recipe (paste this into a new session too)

```
Test Type Scala in Figma:
1. Plugins → Development → Import plugin from manifest → C:\Users\tn\Type-skala-Demo\manifest.json
2. Run plugin, check:
   a. Font picker shows "N fonts" label within ~2s (or instantly if cached)
   b. Click Typeface → panel opens, list renders with each font name in its own typeface
   c. Type "rob" → results filter to Roboto etc.
   d. Pick Roboto, click Generate
   e. Text Styles panel shows 8 new styles named H1, H2, ..., Caption
   f. Canvas shows white frame with 8 text boxes at scaled sizes in Roboto
   g. Run again → styles updated, no duplicates
3. Open Figma dev console (Plugins → Development → Open console)
   → must see [TypeScala] log lines, no red errors
```

---

## Related tools / skills

- **`/figma-plugin-publisher`** — invoke if plugin gets rejected during Community review. Skill logs the rejection pattern + fix. Path: `~/.claude/skills/figma-plugin-publisher/SKILL.md`
- **Reference plugins in this repo:** `C:\Users\tn\exlo`, `C:\Users\tn\EXLE` — same architecture, different scope. Good for cross-checking manifest patterns and message-passing.
