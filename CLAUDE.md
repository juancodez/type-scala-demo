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
├── manifest.json   plugin metadata
├── code.js         plugin thread — Figma API, createTextStyle loop
├── ui.html         UI thread — inputs, live preview, generate button
├── CLAUDE.md       this file
├── icon-32.png
└── icon-128.png
```

## Stack

- Plain JS + single HTML file, no build step, no npm
- Figma Plugin API v1.0.0
- `documentAccess: "dynamic-page"` required to read/write text styles
- `networkAccess` allows `fonts.googleapis.com` + `fonts.gstatic.com` for font preview
- No external CDN in ui.html (lesson from Exlo rejection: inline everything)

## Scale Levels

| Style   | Step  | Example (base=16, ratio=1.25) |
|---------|-------|-------------------------------|
| H1      | +5    | 48.8px                        |
| H2      | +4    | 39.1px                        |
| H3      | +3    | 31.3px                        |
| H4      | +2    | 25px                          |
| H5      | +1    | 20px                          |
| H6      | +0.5  | 17.9px                        |
| Body    |  0    | 16px                          |
| Label   | −0.5  | 14.3px                        |
| Small   | −1    | 12.8px                        |
| Caption | −2    | 10.2px                        |

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
| 2026-09-23 | —        | v13: published to Figma Community — real plugin ID `1684309594972462121` added to manifest |
| 2026-09-23 | —        | v14 fix: `documentAccess: "dynamic-page"` added to manifest; all sync doc APIs replaced with async (see Bug below) |

## Bug: "Cannot call getLocalTextStyles with documentAccess dynamic-page"

**Error:** `Cannot call getLocalTextStyles with documentAccess dynamic-page. Use figma.getLocalTextStylesAsync instead.`

**Cause:** Once `documentAccess: "dynamic-page"` is set in `manifest.json`, Figma forbids all synchronous document APIs. In dynamic-page mode Figma loads pages on demand, so document data isn't guaranteed to be in memory — sync calls assume it is.

**Fix:** Replace every sync document call with its async counterpart:
- `figma.getLocalTextStyles()` → `await figma.getLocalTextStylesAsync()`
- sync `textStyleId` setter → async version

**Rule:** If you add `documentAccess: "dynamic-page"`, audit every Figma API call for a sync version and replace it. The error message tells you exactly which one to fix.

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

- [x] Plugin ID set: `1684309594972462121`
- [x] `icon-32.png` and `icon-128.png` added
- [x] `documentAccess: "dynamic-page"` in manifest
- [x] All sync doc APIs replaced with async versions
- [ ] Verify no CDN/external script tags in ui.html
- [ ] Save ui.html with explicit UTF-8 encoding
- [ ] Test locally: console shows no errors
- [ ] Upsert test: run twice, confirm no duplicate styles
