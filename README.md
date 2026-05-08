# HCFM Brand Identity Page — v1 Mockup

A presentation-ready, multi-platform brand identity webpage for Holy Cross Family Ministries. Built around the 2026 brand system. Deployable to WordPress, HubSpot, or as a standalone static page.

**Live preview:** open `index.html` in any modern browser, or run `python3 -m http.server 9876` and visit `http://localhost:9876`.

**Maintained by:** Victoria Hassan + Emmanuel Epau · 2026
**Address:** 508 Washington Street · North Easton, MA 02356

---

## What this is

A single-page brand portal that consolidates the HCFM 2026 brand system into one canonical destination. Replaces the broken SharePoint platform at `hcfmcloud.sharepoint.com/sites/HCFMVisualIdentity` (where the two main download links currently 404).

**18 content sections:**

1. Hero
2. Watch first (two embedded YouTube walkthroughs)
3. Why brand consistency matters
4. The symbol — five layers of meaning
5. Voice & tone (two-track: faithful / vendors)
6. The color system (the visually impressive star)
7. The proof (June 2025 results)
8. Typography (Whitney + Calluna + Playlist Script with interactive playground)
9. Logo system (Mark vs Logo, configurations, color versions, do/don't)
10. Design elements (Thin Border, Color Fade, Curved Shapes, Dark Overlays)
11. Photography (5 approved categories)
12. Brand in use (platform dimensions table)
13. Downloads (public + locked tiers)
14. Videos (full embeds)
15. Pre-flight checklist (interactive)
16. Father Peyton (founder section + brand timeline)
17. 24 ministries directory
18. Transition FAQ for ministry centers
19. Help & contact (Victoria + Emmanuel cards + request and feedback forms)

---

## File structure

```
Brand_Page_Mockup/
├── index.html              The full page, all 18 sections
├── styles.css              Design tokens, full styling, dark mode, responsive
├── scripts.js              Click-to-copy, sticky nav, theme toggle, playground, ministry directory
├── README.md               This file
├── HANDOFF_WORDPRESS.md    Section-by-section conversion to Gutenberg blocks
├── HANDOFF_HUBSPOT.md      Section-by-section conversion to HubSpot HubL modules
├── FONT_LICENSING.md       Production licensing for Whitney, Calluna, Playlist Script
├── assets/
│   ├── fonts/              Whitney (6 weights), Calluna (4), Playlist Script — all .otf
│   ├── logos/              Mark + 4 logotype configurations × 4 color variants (PNG)
│   ├── photography/        Father Peyton, Faith and Family Day, Day 1
│   ├── icons/              (placeholder — currently uses inline SVG)
│   └── sub-ministries/     24 sub-ministry logo packs (kept for locked-tier downloads)
└── downloads/
    └── public/             5 brand PDFs (Brand Guidelines 2026, Color Quick Reference, etc.)
```

---

## Design tokens (in `styles.css` `:root`)

All design decisions are tokenized. To rebrand any element, change the token in one place.

```css
/* Colors — 2026 system */
--hcfm-blue:        #0047BB;   /* Pantone 2728C — primary */
--hcfm-gold:        #FFB500;   /* Pantone 7549C — primary, promoted in 2026 */
--hcfm-marian-blue: #00A9E0;   /* Pantone 2995C — accent, Marian secondary */
--hcfm-muted-gold:  #89764B;   /* Pantone 871C — accent, demoted in 2026 */
--hcfm-black:       #000000;
--hcfm-white:       #FFFFFF;
--hcfm-cream:       #FAF7F2;

/* Topbar inherited from parent WordPress site */
--hcfm-topbar-blue: #3399CC;

/* Type stack — real fonts via @font-face */
--font-display: 'Whitney', sans-serif;
--font-body:    'Calluna', serif;
--font-script:  'Playlist Script', cursive;

/* Layout */
--radius-pill: 200px;     /* Matches parent WordPress site CTAs */
--radius-card: 12px;
--sidebar-width: 260px;
--container-max: 1200px;
--section-pad-y: 120px;
```

---

## Interactions

| Feature | Where | How |
|---|---|---|
| Click-to-copy hex / RGB | Color section swatches | `scripts.js` writes to clipboard via `navigator.clipboard`, shows toast |
| Sticky sidebar with active highlighting | All sections | IntersectionObserver watches each `<section id>` |
| Smooth scroll to anchor | Sidebar links + CTAs | Custom click handler accounts for sticky header offset (88px) |
| Sidebar search | Search box at top of sidebar | Live filters nav items by text content |
| Dark / light mode | Theme toggle in header | `[data-theme="dark"]` on `<html>`, persisted via localStorage |
| Playlist Script playground | Typography section | Live re-render of typed word in cycling brand colors (Gold / White / Marian Blue) |
| Ministry directory | Section 17 | Populated by JS from a 24-item ministry array (with country flags) |
| Toast notifications | Bottom of viewport | Triggered on copy, ministry click, etc. |

---

## Deployment

### Option 1 — WordPress (recommended)

The new HCFM WordPress site is being built right now. Ship this page as a subpage at `hcfm.org/brand` or `hcfm.org/brand-identity`.

See **`HANDOFF_WORDPRESS.md`** for section-by-section conversion to Gutenberg blocks. Use the "Password Protected" plugin for the locked-tier downloads. The existing parent theme (`hcfm` v1.1.4) provides the topbar (#3399CC), header, and footer — ship the brand page content inside the standard page template and the chrome inherits automatically.

### Option 2 — HubSpot

See **`HANDOFF_HUBSPOT.md`** for HubL module conversion. The locked tier uses HubSpot's native CMS Membership feature (included in CMS Hub Pro+). Each section converts to a reusable HubL module, which means the marketing team can rearrange or update sections in the HubSpot editor without code changes.

### Option 3 — Standalone static

This folder is already deployable as-is.

```bash
# From the repo
python3 -m http.server 9876   # quick local preview
# or
npx serve . -l 9876
```

To deploy to GitHub Pages: push this folder to a repo branch, enable Pages on `main`, and the site is live at `https://<username>.github.io/<repo>/`. Use `htpasswd` Basic Auth at the `/locked/` directory level for the locked tier.

---

## Font licensing — important

The page loads **real Whitney, Calluna, and Playlist Script** fonts via `@font-face` from `assets/fonts/`. The OTF files are stored locally in this repo, not served from a CDN.

**Before public launch, verify HCFM has the right to host these fonts on the public web.** OTF files licensed for desktop use are not necessarily licensed for web distribution. See **`FONT_LICENSING.md`** for the production path:

- **Whitney** — Hoefler & Co Cloud.typography subscription (request nonprofit pricing — most foundries offer 50%+ off for verified nonprofits)
- **Calluna** — MyFonts web license (or purchase EOT/WOFF web kit)
- **Playlist Script** — Verify the original source and license

If web licenses are not in place by launch, the page falls back gracefully to system fonts (Calluna → Georgia, Whitney → Helvetica Neue, Playlist Script → Brush Script MT). The visual hierarchy still works; the warmth of the original fonts is just diminished.

---

## Accessibility

- All body copy passes WCAG AAA (HCFM Blue on White at 8.6:1, Black on White at 21:1)
- Yellow Gold text on White (1.9:1) is restricted to display use only — never for body text
- Muted Gold on White (3.4:1) is also restricted to accents
- All images have descriptive `alt` text
- Logical heading order (h1 → h2 → h3, no skips)
- Color is never the only signal (do/don't cards have icons + text labels)
- Visible focus rings on all interactive elements (3px gold outline)
- Reduced-motion preference respected (hero mark animation disabled when `prefers-reduced-motion`)

---

## Outstanding items before public launch

These are flagged in `Plan v6` and need owner sign-off before this page goes external.

1. **Voice & tone copy** drafted by Emmanuel — Victoria reviews before publishing
2. **Proof block metrics** (+219% / +564% / +84%) — Colum approves external publication
3. **Sub-ministry list** (currently dated September 2020 from SharePoint) — Margaret or Allan provides current authoritative list
4. **Yellow Gold logo files** — none exist for the 24 sub-ministries; either commission or document as known gap
5. **Father Peyton imagery** — confirm with Margaret / Father Fred which images are approved for public use
6. **Locked-tier authentication** — implemented at deploy by the WordPress / HubSpot dev (placeholder UI in place now)
7. **Font web licenses** — verify before launch (see `FONT_LICENSING.md`)
8. **Template files for locked tier** (Canva, PowerPoint, email signatures) — phase 2

---

## Phasing summary

**Tomorrow's mockup (this folder):** all 18 sections, real content, real fonts, click-to-copy, sticky nav, theme toggle, ministry directory, Playlist playground, two video embeds.

**Phase 2 (~2 weeks post-approval, before launch):**
- Symbol scrollytelling animation (the planned "wow moment")
- Live contrast checker widget
- Type ladder slider
- Real authentication on the locked tier
- Search across all sections + downloads
- Print-export consolidated PDF
- Phase 2 reviewed by Victoria + Colum + Margaret before launch

**Phase 3 (post-launch, when there's appetite):**
- Yellow Gold logo file commissioning
- Each sub-ministry's own mini-page
- Translations (Spanish, Tagalog)
- Stationery / business card templates
- Brand performance dashboard

---

## Local dev

```bash
# from the repo
cd Brand_Page_Mockup
python3 -m http.server 9876
# or
npx serve . -l 9876

# open http://localhost:9876
```

No build step. Edit, save, refresh.

---

## License

Internal HCFM property. Not for redistribution outside Holy Cross Family Ministries and its approved vendors.
