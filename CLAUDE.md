# Type Scala — Dev Journal

## Overview

Figma plugin: typography scale generator.
Enter a base size + ratio → auto-creates Figma Text Styles for H1–H5, Body, Small, Caption.
Optional group prefix organises styles under a folder (e.g. `Typography/H1`).

**Scale formula:** `size = base × ratio^step`
Body = step 0 (= base). Headings scale up, Small/Caption scale down.

## File Structure

```
Type-skala-Demo/
├── manifest.json   plugin metadata (no documentAccess needed)
├── code.js         plugin thread — Figma API, createTextStyle loop
├── ui.html         UI thread — inputs, live preview, generate button
├── CLAUDE.md       this file
├── icon-32.png     (user will supply)
└── icon-128.png    (user will supply)
```

## Stack

- Plain JS + single HTML file, no build step, no npm
- Figma Plugin API v1.0.0
- No `documentAccess: "dynamic-page"` (not reading nodes by ID — just creating styles)
- No external CDN (lesson from Exlo rejection: inline everything)

## Scale Levels

| Style   | Step | Example (base=16, ratio=1.25) |
|---------|------|-------------------------------|
| H1      | +5   | 48.8px                        |
| H2      | +4   | 39.1px                        |
| H3      | +3   | 31.3px                        |
| H4      | +2   | 25px                          |
| H5      | +1   | 20px                          |
| Body    |  0   | 16px                          |
| Small   | -1   | 12.8px                        |
| Caption | -2   | 10.2px                        |

## Build Log

| Date       | Duration | What happened |
|------------|----------|---------------|
| 2026-09-11 | ~20 min  | Initial scaffold: manifest + code.js + ui.html + CLAUDE.md |
| 2026-09-11 | ~15 min  | v2: fixed manifest ID (numeric), added font input, showcase frame on canvas, font error handling |
| 2026-09-11 | ~10 min  | v3: font input → searchable datalist fed by figma.listAvailableFontsAsync() |
| 2026-09-11 | ~15 min  | v4: datalist replaced with custom combobox — search bar + scrollable list + checkmark, matches Figma font picker UX |
| 2026-09-11 | ~10 min  | v5: font names render in their own typeface — lazy-load via Google Fonts + IntersectionObserver; manifest updated to allow fonts.googleapis.com |
| 2026-09-11 | ~10 min  | v6: fix silent failure — hardcoded 'Regular' style broke fonts with Book/Roman/Text variants; replaced IntersectionObserver with scroll-based loader (more reliable in Figma iframe) |
| 2026-09-11 | ~15 min  | v7: full rewrite — top-level try/catch so errors surface instead of failing silently; loadBestFont() brute-forces style names when allFonts not yet loaded; ui.html clean split: font picker code never touches generate path |
| 2026-09-11 | ~15 min  | v8: root-cause fixes — integer sizes; fontName set BEFORE characters on text nodes (required by API); fontName BEFORE fontSize on styles; explicit page attach + selection + zoom; console logs at every step for diagnosis |
| 2026-09-11 | ~10 min  | v9: perf — loadVisible() was firing on closed panel (clientHeight=0) and loading ALL fonts at once; now guarded + rAF-throttled + search debounced 120ms + waits for layout before first load |
| 2026-09-11 | ~5 min   | v10: instant typeface menu — cache families in figma.clientStorage; 2nd+ opens paint the list immediately, fresh list overwrites in background |
| 2026-09-11 | ~15 min  | v11: HANDOFF.md + PUBLISH.md written — session restart context + Community submission checklist |
| 2026-09-11 | ~10 min  | v12: COOK.md — per-phase time breakdown, activity split, lessons for next plugin |

## Decisions

- No TypeScript — overkill for ~100 lines
- Single `ui.html` — inline all CSS/JS (no CDN rejection risk)
- Round to 1 decimal — avoids 20.48828px noise, keeps clean values
- Upsert pattern — if style already exists by name, update it (no duplicates)
- Preset dropdown for common ratios — UX win, zero extra code

## Known Ceilings (deliberate ponytail simplifications)

- No font-family / font-weight control → add when users ask
- No line-height / letter-spacing → add when users ask
- No delete/cleanup of old styles → add if users complain about stale styles

## Pre-publish Checklist

- [ ] Replace `manifest.json` plugin ID (get from figma.com/plugin/create)
- [ ] Add `icon-32.png` and `icon-128.png`
- [ ] Verify no CDN/external script tags in ui.html
- [ ] Save ui.html with explicit UTF-8 encoding
- [ ] Test locally: console shows no errors
- [ ] Upsert test: run twice, confirm no duplicate styles
- [ ] Publish via Figma Community + add description + screenshots
