# Type Scala — Cook Time

Every phase, honest time. Estimates from my per-version notes in `CLAUDE.md` — think "recipe log", not stopwatch precision.

**Total cook time: ~2h 20min** (140 minutes across 11 iterations)

---

## Timeline

| # | Phase | What happened | Time | Cumulative |
|---|-------|---------------|------|-----------|
| v1 | 🍳 **Initial scaffold** | Wrote manifest.json + code.js + ui.html + CLAUDE.md. Basic scale generator, text input for font. | **20 min** | 20 min |
| v2 | 🔧 **First round of fixes** | Fixed manifest ID (numeric), added font input, added showcase frame on canvas, font error handling. | **15 min** | 35 min |
| v3 | ✨ **UX #1 — searchable fonts** | Replaced text input with native `<datalist>` — searchable dropdown. Failed UX-wise (Figma-style variants like "Inter 18pt" confused user). | **10 min** | 45 min |
| v4 | ✨ **UX #2 — custom combobox** | Datalist ripped out. Built custom Figma-style font picker: search bar + scrollable list + checkmark. Matches Figma's native font panel. | **15 min** | 1h 00min |
| v5 | ✨ **UX #3 — own-typeface rendering** | Added Google Fonts lazy loading + IntersectionObserver so each font name renders in its own typeface. Updated manifest to allow `fonts.googleapis.com`. | **10 min** | 1h 10min |
| v6 | 🐛 **Bug — silent failure** | Discovered hardcoded `'Regular'` style broke ~40% of fonts (Book/Roman/Text variants). Added `pickStyle()` fallback. Replaced IntersectionObserver with scroll listener (unreliable in Figma iframe). | **10 min** | 1h 20min |
| v7 | 🐛 **Bug — errors disappearing** | Wrapped generate flow in top-level try/catch. Added `loadBestFont()` with brute-force fallback. Isolated font picker code so its errors can't kill the Generate button. | **15 min** | 1h 35min |
| v8 | 🐛 **Bug — nothing was creating** | Root cause: `.characters` set before `.fontName` on text nodes (Figma API silently throws). Fixed property order. Integer sizes. Explicit page attach + selection + zoom. Console logs at every step. | **15 min** | 1h 50min |
| v9 | ⚡ **Perf — the "loading problem"** | Nailed the real perf bug: `loadVisible()` fired on closed panel (`clientHeight = 0`) → tried to load ALL fonts at once. Guarded + rAF-throttled scroll + 120ms search debounce. | **10 min** | 2h 00min |
| v10 | ⚡ **Perf — instant menu** | Cached font families in `figma.clientStorage`. 2nd+ opens paint the picker instantly. Fresh list refreshes in background. | **5 min** | 2h 05min |
| v11 | 📄 **Docs — handoff** | Wrote HANDOFF.md (full session-restart context) and PUBLISH.md (Community submission checklist). | **15 min** | 2h 20min |

---

## Breakdown by activity type

| Activity | Time | % of total |
|----------|------|-----------|
| 🍳 Initial build | 20 min | 14% |
| ✨ UX improvements | 35 min | 25% |
| 🐛 Bug fixes | 40 min | 29% |
| ⚡ Perf work | 15 min | 11% |
| 📄 Documentation | 15 min | 11% |
| 🔧 Wiring/config | 15 min | 11% |

**Insight:** bug fixes ≈ initial build time. Typical of iterative dev — the first version is scaffolding, real value is in the fixes that surface once you actually use the thing.

---

## Time-per-line-of-code

Final code footprint: ~510 lines (code.js + ui.html + manifest.json).
That's ~3.6 lines/minute of end-to-end effective throughput.

The math is misleading though — most of the code was written in v1/v4/v7/v8. Perf and UX rounds mostly deleted or reshaped existing code.

---

## What if I had known upfront

- **Skipped:** the `<datalist>` attempt (v3 → v4 rewrite cost 25 min). If I'd started with the custom combobox from v4, saved 10-15 min.
- **Skipped:** the IntersectionObserver in v5. Scroll listener is simpler and always worked (v6 replaced it after 10 min lost).
- **Would still spend:** the property-order fix (v8), the `loadVisible` bug (v9), the clientStorage cache (v10). These weren't foreseeable without hitting the actual behaviour.

**Realistic minimum:** ~1h 45min if I'd chosen the right primitives from the start. The 35-minute delta is the cost of learning Figma's plugin sandbox quirks.

---

## Notes for next plugin

1. Font operations: **always** set `fontName` first. Every time. On both text nodes and text styles.
2. `figma.listAvailableFontsAsync()` is slow — cache in `clientStorage` on day one.
3. Figma's iframe: don't trust `IntersectionObserver` with a `root` element. Scroll listeners are reliable.
4. Any hidden container has `clientHeight === 0`. Any code that measures visibility must guard against this.
5. Wrap async handlers in try/catch — the plugin sandbox eats unhandled errors instead of showing them.

Each rule = one hour of my life. Now they're yours too.
