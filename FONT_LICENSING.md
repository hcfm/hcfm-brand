# Font Licensing — Production Path

The brand page loads three fonts from `assets/fonts/`. **Before public launch, verify HCFM has web licenses for each.** OTF files licensed for desktop installation are not always licensed for `@font-face` web hosting.

---

## Whitney (Display / Headlines)

**Designer:** Hoefler & Frere-Jones (originally), now Hoefler & Co
**Used in:** all H1, H2, H3, navigation, eyebrow labels, buttons
**Files in repo:** Whitney-Light, Book, Medium, Semibold, Bold, Black

### License path

1. **Hoefler & Co Cloud.typography subscription** — the official web-license route
   - Pricing starts around $99/year for a single project
   - **Request nonprofit pricing.** Most foundries offer 50%+ off for verified 501(c)(3) organizations like HCFM
   - Contact: `licensing@typography.com`
   - Once subscribed, swap the local `@font-face` URLs for Hoefler's CDN URL

```css
/* Before (current) */
@font-face {
  font-family: 'Whitney';
  src: url('assets/fonts/Whitney-Book.otf') format('opentype');
}

/* After (Cloud.typography) */
@import url('https://cloud.typography.com/<your-account-id>/<project-id>/css/fonts.css');
```

2. **Verify desktop OTF redistribution rights** — if the OTFs in `assets/fonts/` are from a desktop license, redistributing them via web is technically a license violation. The web subscription is what makes hosting them legal.

3. **Fallback ready:** if Whitney web license is delayed, the CSS already falls back to Helvetica Neue, Arial, sans-serif. Visual hierarchy is preserved; the warmth of Whitney is what's lost.

### Whitney alternates (free, if Hoefler license isn't pursued)

- **Söhne** (Klim Type Foundry) — closest match to Whitney's humanist DNA, available on Adobe Fonts via Creative Cloud subscription
- **Inter** (Rasmus Andersson) — free, open-source, good workhorse alternative

To swap: change `--font-display` in `styles.css` `:root`.

---

## Calluna (Body Text)

**Designer:** Jos Buivenga (exljbris)
**Used in:** body paragraphs, prose, lede, photo captions, italic quotes
**Files in repo:** Calluna-Regular, Italic, Semibold, Bold

### License path

1. **MyFonts web license** — Calluna is licensed by MyFonts. Purchase a "web license" for the four weights used (Regular, Italic, Semibold, Bold)
   - Pricing: ~$60–120 per font per pageview tier
   - Page URL: https://www.myfonts.com/collections/calluna-font-exljbris

2. **Adobe Fonts** — Calluna is also available via Adobe Fonts (free with Creative Cloud subscription)
   - If HCFM has Creative Cloud, this is the easiest route
   - Add Calluna to your Adobe Fonts kit, get the kit ID, swap the `@font-face` for Adobe's CDN script

```html
<!-- In <head> when using Adobe Fonts -->
<link rel="stylesheet" href="https://use.typekit.net/<kit-id>.css">
```

Then remove the local `@font-face` for Calluna in `styles.css`.

3. **Fallback ready:** Georgia, Times New Roman, serif. Less warm than Calluna but readable.

---

## Playlist Script (Decorative)

**Designer:** Hanken Design Co
**Used in:** decorative single-word accents (e.g. "global" in hero, "The family that prays together stays together." quote)
**Files in repo:** PlaylistScript.otf

### License path

1. **Verify the source.** Playlist Script may have been downloaded as a free font from Behance or Dafont. Free downloads typically only allow personal use; commercial / web use requires a separate license.

2. **Hanken Design Co official license** — purchase via the foundry directly or MyFonts:
   - Pricing: $30–50 for a single font web license
   - Search "Playlist Script" on MyFonts or Hanken's site

3. **Adobe Fonts alternative** — Playlist Script may not be on Adobe Fonts directly, but similar scripts are. Search Adobe Fonts for "playlist", "calligraphy script", "brush script" and pick a comparable face.

4. **Fallback ready:** Brush Script MT, cursive (system font). The visual hierarchy still distinguishes the script as decorative, just less elegantly.

---

## Loading strategy

The `@font-face` declarations all use `font-display: swap` which means:

1. Page renders immediately with system fallback fonts
2. Custom fonts swap in once loaded
3. No FOIT (flash of invisible text)

This is critical for the page's Lighthouse Performance score (target ≥90).

---

## Font payload budget

Current `assets/fonts/` total weight (from this repo):

| Font | Weight | Size |
|---|---|---|
| Whitney-Light.otf | 300 | ~115 KB |
| Whitney-Book.otf | 400 | ~118 KB |
| Whitney-Medium.otf | 500 | ~116 KB |
| Whitney-Semibold.otf | 600 | ~119 KB |
| Whitney-Bold.otf | 700 | ~120 KB |
| Whitney-Black.otf | 900 | ~116 KB |
| Calluna-Regular.otf | 400 | ~99 KB |
| Calluna-Italic.otf | 400 italic | ~104 KB |
| Calluna-Semibold.otf | 600 | ~102 KB |
| Calluna-Bold.otf | 700 | ~101 KB |
| PlaylistScript.otf | 400 | ~52 KB |
| **Total** | | **~1,162 KB** |

That's too heavy for first paint. **For production:**

1. **Convert OTF to WOFF2.** WOFF2 is ~30% smaller than OTF and is the modern web standard.
   ```bash
   # Use Google's woff2_compress tool
   for f in assets/fonts/*.otf; do woff2_compress "$f"; done
   ```
2. **Subset to Latin.** If you don't need extended Greek / Cyrillic / symbols, subset to basic Latin to cut another 30–50%. Use `pyftsubset` from the FontTools package.
3. **Only load the weights you actually use.** Audit which Whitney weights the page uses. Probably Book (400) and Bold (700) are enough — the others can be dropped.

After WOFF2 conversion + Latin subset + weight-pruning, target font payload is **<200 KB total**.

---

## Production checklist

- [ ] Confirm HCFM has Creative Cloud subscription (verify with Margaret or IT before launch)
- [ ] If yes: add Calluna and similar-script fonts to Adobe Fonts kit
- [ ] If no: purchase MyFonts web licenses for Calluna + Playlist Script
- [ ] Either way: get Whitney via Cloud.typography (request nonprofit pricing from Hoefler & Co)
- [ ] Convert all OTF to WOFF2 + subset to Latin + drop unused weights
- [ ] Update `@font-face` URLs to point to the production CDN (Adobe Fonts or Cloud.typography or local WOFF2)
- [ ] Verify Lighthouse Performance score ≥90 with the production fonts loaded

---

## What this looks like in the page when fonts are missing

If any of the three fonts fail to load (license issue, network error, etc.) the page degrades gracefully:

| Font | Fallback | Visual impact |
|---|---|---|
| Whitney → Helvetica Neue | minor — slightly colder, less warm |
| Calluna → Georgia | minor — slightly less elegant serif |
| Playlist Script → Brush Script MT | major — Brush Script MT is much less refined |

The page will still be presentable. The brand will not feel as crafted. Worth getting the licenses right before public launch.

---

## Contacts

- **Hoefler & Co (Whitney):** `licensing@typography.com`
- **MyFonts (Calluna, Playlist Script):** support@myfonts.com
- **Adobe Fonts:** included with Creative Cloud — no separate contact

For questions: Emmanuel Epau · `eepau@hcfm.org`
