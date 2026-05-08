# WordPress / Gutenberg Handoff

How to ship this page as a subpage of the new HCFM WordPress site (built on the `hcfm` theme v1.1.4 on WP 6.9.4 with Gutenberg).

**Recommended URL:** `hcfm.org/brand` or `hcfm.org/brand-identity`

The parent theme already provides the topbar (#3399CC), black site header, and Marian Blue footer. You only need to recreate the **content sections** (between header and footer) inside a standard WP page.

---

## Setup

1. **Create a new Page** in WP admin → Pages → Add New. Title: "Brand Identity". Slug: `brand` or `brand-identity`.
2. **Set the page template** to a full-width template (no sidebar) so the brand page's own sticky sidebar can render. If the theme doesn't expose a full-width template, ask the developer to add one or use a Page Builder block.
3. **Enqueue `styles.css` and `scripts.js`** via the theme's `functions.php`:

```php
function hcfm_brand_page_assets() {
    if ( is_page( 'brand-identity' ) ) {  // adjust slug
        wp_enqueue_style(
            'hcfm-brand-page',
            get_stylesheet_directory_uri() . '/brand-page/styles.css',
            array(),
            '1.0.0'
        );
        wp_enqueue_script(
            'hcfm-brand-page',
            get_stylesheet_directory_uri() . '/brand-page/scripts.js',
            array(),
            '1.0.0',
            true
        );
    }
}
add_action( 'wp_enqueue_scripts', 'hcfm_brand_page_assets' );
```

4. **Upload fonts** to `wp-content/themes/<theme>/brand-page/assets/fonts/` and adjust `@font-face` paths in `styles.css` if needed. Verify font web-licensing first (see `FONT_LICENSING.md`).
5. **Upload logo PNGs and photography** to `wp-content/uploads/2026/05/brand/` and update `<img src="...">` paths in the HTML.
6. **Upload PDF downloads** to `wp-content/uploads/2026/05/brand-downloads/`.

---

## Block-by-block conversion

The simplest path: paste the `<main>` content directly into a **Custom HTML block** that fills the page. Gutenberg renders raw HTML faithfully, the CSS classes work, and the JS runs as long as the script is enqueued.

The richer path: convert each section to native Gutenberg blocks so the marketing team can edit copy without touching code. Recommended only for sections where copy will change frequently.

| Section | Recommended Gutenberg approach |
|---|---|
| Hero | Custom HTML block (preserves the rotating mark animation and grid layout) |
| Watch first | Group block with two YouTube embed blocks side by side |
| Why consistency | Paragraph blocks inside a Group block, max-width constrained via inline style |
| The symbol | Group block with 5 nested Image+Text blocks |
| Voice & tone | Two-column Columns block with rich text |
| **Color system** | **Custom HTML block — keep as-is.** The click-to-copy and swatch grid are JS-driven and not worth converting to blocks. |
| The proof | Custom HTML block (4 metric tiles) or convert to a "Stats" pattern if the theme has one |
| Typography | Custom HTML block (the Playlist Script playground requires JS bindings) |
| Logo system | Image gallery blocks for the variants; Group block for the do/don't cards |
| Design elements | Custom HTML block (the demo blocks use CSS gradients) |
| Photography | Image gallery block |
| Brand in use | Table block (Gutenberg table block) |
| Downloads | Custom HTML block (link list with download attributes) |
| Videos | Two YouTube embed blocks |
| Pre-flight checklist | Custom HTML block (the checkboxes are decorative) |
| Father Peyton | Custom HTML block (the timeline uses a CSS pseudo-element line) |
| 24 ministries | Custom HTML block (populated by `scripts.js`) |
| Transition FAQ | Custom HTML block (uses native `<details>` accordion) or convert to Accordion block if the theme has one |
| Help & contact | Group block with Columns for the contact cards + Form blocks for request and feedback |

**Rule of thumb:** if a section has interactive JS (click-to-copy, playground, ministry directory, theme toggle) keep it as Custom HTML. If it's only text and images, consider converting for editor friendliness.

---

## Locked-tier authentication

Use the **Password Protected** plugin (free, well-maintained). 

1. Install: Plugins → Add New → search "Password Protected" by Ben Huson
2. Configure: Settings → Password Protected → set a password for the brand-page-locked downloads
3. The plugin protects the entire page or specific category. For per-file gating, use a folder-level `htaccess` Basic Auth instead

Alternative: **Restrict Content Pro** if you want member tiers, expirations, or per-user passwords. Costs ~$99/year.

---

## Forms (Request / Feedback)

The mockup uses simple HTML forms with `onsubmit="alert(...)"`. For real submission, replace with **Gravity Forms** or **WPForms** (already standard on WordPress). Configure to email both `vhassan@hcfm.org` and `eepau@hcfm.org`.

```html
<!-- Replace this in HTML -->
<form class="contact-form" id="requestForm" onsubmit="event.preventDefault(); alert(...);">

<!-- With this Gravity Form shortcode -->
[gravityform id="1" title="false" description="false"]
```

---

## SEO

Add to the page's SEO plugin (Yoast / Rank Math):

- **Title:** Holy Cross Family Ministries · Brand Identity
- **Description:** The visual expression of a global family at prayer. Everything you need to apply the HCFM brand correctly across cultures, channels, and ministry centers.
- **Canonical URL:** `https://hcfm.org/brand`
- **OG image:** the HCFM mark in gold on a black background (1200×630)
- **No-index the locked-tier sub-URLs** if you create them as separate pages

---

## Multi-language (phase 2)

The HTML is structured so WPML or Polylang can wrap content blocks without restructuring. Priority languages:

1. Spanish (Father Joe in Chile, Latin America centers)
2. Tagalog or Filipino-friendly English (Family Rosary FB audience is 59.4% Filipino)

---

## Analytics

Add Google Analytics 4 page-view tracking (likely already site-wide). Add custom events:

- Download click — every PDF in `/downloads/public/`
- Video play — both YouTube embeds
- CTA click — "Explore the system", "Send request", "Send feedback"
- Color swatch copy — every `.copy` button click

```js
// Example: in scripts.js, after the copy succeeds
if (window.gtag) {
  gtag('event', 'color_copy', {
    event_category: 'brand_page',
    event_label: value
  });
}
```

---

## Open developer questions

1. **Sticky sidebar** — does the parent theme have a sticky sidebar template, or should I add one? If not, ship the sidebar as part of the brand page content, not a theme-level sidebar.
2. **Topbar / header / footer height** — `styles.css` assumes 32px topbar + 76px header (108px total sticky offset). Verify this matches the parent theme; adjust the `--header-offset` token if not.
3. **Font hosting** — verify Whitney, Calluna, and Playlist Script have web licenses for `hcfm.org` before deploy. If not, swap `var(--font-display)` to use Google Fonts as a temporary fallback.

For questions: Emmanuel Epau · `eepau@hcfm.org`
