# Type Scala — Publishing Checklist

Everything needed to submit Type Scala to the Figma Community, based on the `figma-plugin-publisher` skill and standard Figma Community requirements.

---

## 1. Assets to prepare

| Asset | Spec | Where it goes | Status |
|-------|------|---------------|--------|
| **Plugin icon (small)** | `icon-32.png` — 32×32 px, PNG, transparent bg OK | Root folder, in manifest already? No — add `"iconPath": "icon-32.png"` to manifest OR just keep files in folder for now | ❌ user will supply |
| **Plugin icon (large)** | `icon-128.png` — 128×128 px, PNG | Root folder | ❌ user will supply |
| **Cover art** | 1920×960 px, PNG or JPG. This is the big banner shown on the Community listing | Uploaded during publish flow (not in repo) | ❌ user will supply |
| **Screenshots** | Up to 12, 1920×1080 recommended. Show the plugin in action: UI panel + generated styles panel + showcase frame | Uploaded during publish flow | ❌ record from actual usage |
| **Optional GIF** | Short screen recording (≤10s) of the generate flow — massively helps conversion | Upload as one of the screenshots | ⚠️ recommended |
| **Playground file** | A public Figma file where users can try the plugin. Not mandatory, but boosts installs | Create + make public + copy link | ⚠️ recommended |

**Screenshot recipe (what to capture):**
1. Plugin panel open, showing all inputs filled (base 16, ratio 1.25, prefix "Typography")
2. Preview list showing the 8-step scale
3. Figma canvas showing the generated showcase frame with all 8 styles
4. Text Styles panel in Figma showing the created styles

---

## 2. Plugin ID

Current `manifest.json` uses a placeholder ID: `"1000000000000000001"`.
Before publishing:

1. Open Figma → Plugins → Development → **New plugin…**
2. Choose "Existing plugin" and pick the current folder — OR create a new plugin, which returns a numeric ID
3. Copy the real ID → replace the placeholder in `manifest.json`

---

## 3. Listing copy (fill these in before submitting)

Figma's publish form asks for:

### Name
`Type Scala`

### Tagline (max ~65 chars)
Draft: `Generate a full typography scale in one click.`

### Description (Markdown supported, ~500-1000 chars sweet spot)
Draft — edit freely:

```
Type Scala turns two numbers into a full typographic system.

Pick a base size (e.g. 16px) and a ratio (Major Third, Golden, etc.),
choose your typeface, and Type Scala creates 8 Figma Text Styles
— H1 through Caption — with mathematically consistent sizing.

**Features**
- 5 preset ratios (Minor Third → Golden)
- Live scale preview
- Any typeface installed in your Figma
- Optional showcase frame with sample text
- Group prefix to organise styles under a folder

**Why**
Consistent typography is math, not taste. Skip the calculator,
skip the copy-paste, and ship a real type system in seconds.
```

### Category
Suggested: **Design tools** (secondary: Utilities)

### Tags (up to ~6)
`typography` · `text styles` · `design system` · `scale` · `type scale` · `modular`

### Support contact
Email or URL where users can report bugs. Add before submitting.

---

## 4. Pre-submission technical checklist

From the `figma-plugin-publisher` skill (real rejection patterns):

- [ ] **manifest.json ID replaced** with real Figma-issued numeric ID
- [ ] **All shipping files listed in manifest** — Figma ONLY packages files referenced in `manifest.json`. Files in the folder that aren't referenced are invisible to reviewers. (We're fine — no external deps.)
- [ ] **No external CDN scripts in ui.html** — we DO fetch Google Fonts. This is allowed because we added `fonts.googleapis.com` + `fonts.gstatic.com` to `networkAccess.allowedDomains`. Reviewers may still ask about it — be ready to explain: fonts are only used to render the picker items in their own typeface, no user data leaves the plugin.
- [ ] **UTF-8 encoding on ui.html** — no BOM, no mangled special chars (× — ✓ etc.). Windows users: save with `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`.
- [ ] **No `require()` in code.js** — Figma's sandbox doesn't support CommonJS. We're fine (no imports).
- [ ] **`figma.showUI(__html__, ...)` called correctly** — we do.
- [ ] **Try/catch around everything user-triggered** — we do.

---

## 5. Local test before submit

1. Import plugin fresh: Plugins → Development → Import plugin from manifest
2. Run Type Scala
3. Test cases:
   - [ ] Base=16, ratio=1.25, prefix=Typography → 8 styles appear in Text Styles panel, frame appears with sample text
   - [ ] Change typeface to non-Inter (e.g. Roboto, Playfair Display) → styles use that font, showcase frame renders in that font
   - [ ] Run twice with same settings → styles update, no duplicates created
   - [ ] Preset dropdown swap → ratio updates, preview updates
   - [ ] Search fonts by name → results filter correctly, font names render in their own typeface
4. Check Figma dev console (Plugins → Development → Open console) — must show:
   - `[TypeScala] cache hit` or `[TypeScala] fresh: N families`
   - `[TypeScala] loaded {family} {style}`
   - `[TypeScala] done`
   - No red errors

---

## 6. Submission steps

1. In Figma: Plugins → Development → right-click your plugin → **Publish new release**
2. Fill in all fields from section 3 above
3. Upload icons, cover, screenshots
4. Submit for review
5. Review typically takes 1-5 business days
6. If rejected: read the rejection email carefully, update the skill's Lessons log with the pattern, fix, resubmit

---

## 7. Post-publish

- Bump version + document changes in `CLAUDE.md` before each release
- Track installs / feedback from Community page
- Keep the plugin ID stable — never change it after publishing

---

## Skill reference

Full patterns and rejection recovery live in:
`C:\Users\tn\.claude\skills\figma-plugin-publisher\SKILL.md`

Invoke with `/figma-plugin-publisher` if the plugin is rejected — I'll walk through the specific rejection and update this checklist with what we learned.
