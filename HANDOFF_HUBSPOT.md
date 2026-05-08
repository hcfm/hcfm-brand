# HubSpot CMS Handoff

How to ship this page on HubSpot CMS Hub. Recommended for HCFM if the marketing team wants editor-driven section reordering, per-page analytics, A/B testing, and personalization without dev cycles.

**Recommended URL:** `hcfm.org/brand` (use HubSpot site mapping) or `brand.hcfm.org` subdomain.

---

## Setup

1. **Create a HubSpot Page** in CMS Hub → Website → Pages → Create page → Use blank template
2. **Set the template** to a full-width single-column layout
3. **Upload the assets** to HubSpot's File Manager:
   - `assets/fonts/` → File Manager → `/brand/fonts/`
   - `assets/logos/` → File Manager → `/brand/logos/`
   - `assets/photography/` → File Manager → `/brand/photography/`
   - `downloads/public/*.pdf` → File Manager → `/brand/downloads/`

4. **Add the CSS** as a Custom Module: Design Manager → Custom Modules → Create → CSS → paste `styles.css` and adjust font/image paths to HubSpot file URLs (use `{{ get_asset_url('/brand/fonts/Whitney-Book.otf') }}` Jinja syntax).

5. **Add the JS** the same way: Custom Modules → JS → paste `scripts.js`.

---

## Module-by-module strategy

HubSpot's strength is reusable modules. Each section converts to a HubL module the marketing team can drag into any HubSpot page.

### Recommended module structure

| Module | Type | Editor fields exposed |
|---|---|---|
| `hcfm_hero` | Rich-text + image | Eyebrow, H1 (with rich text), subhead, primary CTA, secondary CTA |
| `hcfm_watch_band` | Rich-text + 2 video URLs | Header, lede, video 1 URL, video 1 caption, video 2 URL, video 2 caption |
| `hcfm_text_section` | Rich-text | Eyebrow, H2, lede, body |
| `hcfm_symbol_layers` | Rich-text + 5 numbered fields | Hero image, hero caption, 5× (heading, body) |
| `hcfm_voice_columns` | 2-column rich-text | Each column: eyebrow, H3, list of (strong, paragraph, italic example) |
| `hcfm_color_system` | Custom (no editor fields — rendered from JSON) | Internal-only — colors hard-coded since they rarely change |
| `hcfm_proof_block` | Custom rich-text | 4× metric (label, before, after, delta) + closing quote |
| `hcfm_typography` | Custom (rendered from JSON) | Internal-only |
| `hcfm_logo_system` | Image + rich-text | Mark image, logo image, do/don't list |
| `hcfm_design_elements` | 4× rich-text + image | Each: image, name, description |
| `hcfm_photography` | Image gallery | 5 images with captions |
| `hcfm_dim_table` | Table | Platform / Type / Dimensions rows |
| `hcfm_downloads` | Custom (file picker for each item) | Public list, locked list |
| `hcfm_videos` | 2 video URLs | URL 1, URL 2 |
| `hcfm_checklist` | Custom | 4 columns × 3 items |
| `hcfm_peyton` | Image + rich-text + timeline | Image, caption, body, timeline (4 events) |
| `hcfm_ministries` | Custom (renders from data file) | Internal-only — 24-item array |
| `hcfm_faq` | Repeater | List of (question, answer) pairs |
| `hcfm_contact` | Repeater + form | Contact cards + 2 forms |

---

## Locked tier (HubSpot Membership)

HubSpot CMS Hub Pro+ includes **Memberships** natively — no plugin needed.

1. Set up a Members access list in CMS Hub → Settings → Memberships
2. On the Page settings → Audience access → require login
3. Create a `/brand/locked-downloads` private subpage that contains the locked file list
4. Add a "Members can register here" link in the help section

For a simpler approach: use a **password-protected page** instead of memberships. Settings → Page settings → Password protection → set a single password.

---

## Forms (Request / Feedback)

Replace the mockup's static forms with **HubSpot Forms** modules. They auto-handle:

- Email notification to Victoria + Emmanuel
- Spam protection (reCAPTCHA)
- Submission storage in HubSpot CRM
- Workflow triggers (e.g., "ministry-center request" tag → notify Easton creatives Slack channel)

```hubl
{% module "request_form"
  path="@hubspot/form"
  form={form_id: '<form-uuid-from-hubspot>', response_type: 'inline'} %}
```

Forms feed directly into HubSpot CRM, making it easy to track ministry-center requests over time and respond systematically.

---

## Theme toggle and dark mode

HubSpot pages don't have a built-in dark mode. The `data-theme="dark"` attribute on `<html>` works the same way as in static deployment. The `localStorage` persistence works on HubSpot CMS-hosted pages too.

One adjustment: HubSpot may inject system styles after our CSS. Add `!important` to the `[data-theme="dark"]` overrides if styles get overridden, or scope the dark mode rules higher.

---

## SEO and meta

In HubSpot CMS:

1. **SEO panel:** Title, meta description, canonical URL
2. **Open Graph:** custom OG image (HCFM mark in gold on black, 1200×630)
3. **Schema markup:** add JSON-LD for `Organization` (HCFM details) and `WebSite` to improve search-result presentation

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Holy Cross Family Ministries",
  "url": "https://hcfm.org",
  "logo": "https://hcfm.org/logo.png",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "508 Washington Street",
    "addressLocality": "North Easton",
    "addressRegion": "MA",
    "postalCode": "02356",
    "addressCountry": "US"
  }
}
</script>
```

---

## Analytics

HubSpot CMS includes built-in page analytics (views, scroll depth, time on page, bounce rate). For deeper events:

- **Download click** — track via HubSpot Tracking Code Custom Events
- **Video play** — HubSpot's YouTube embed module tracks plays automatically
- **Color swatch copy** — fire a custom event:

```js
// In scripts.js after copy succeeds
if (window._hsq) {
  _hsq.push(['trackEvent', { id: 'color_copy', value: value }]);
}
```

---

## Personalization (advanced — phase 2)

HubSpot Smart Content lets you personalize sections by visitor attributes:

- **Region detection** — show the Latin America regional note prominently if the visitor is from Mexico/Chile/Brazil/Peru
- **Returning visitor** — if the visitor previously downloaded the brand book, surface the locked-tier prompt
- **Vendor vs internal** — if the visitor's email domain is not @hcfm.org, default to the public download tier

---

## Phase 2 enhancements

Once the page is live and approved:

- A/B test the Watch first band placement (above vs below "Why consistency")
- Heatmap track which sections get the most engagement
- Add HubSpot Live Chat for vendor / ministry-center questions
- Build a HubSpot Workflow that auto-emails new ministry-center contacts a 7-day onboarding sequence pointing them to specific brand-page sections

---

## Open dev questions

1. **HubSpot subdomain or path?** `hcfm.org/brand` (path on existing hcfm.org HubSpot mapping) is preferred. Confirm with marketing.
2. **Membership tier vs password?** Membership is the cleaner UX (per-user logins, audit trail) but requires more setup. Password is faster to ship.
3. **Form integration** — confirm Gravity Forms isn't needed since we're on HubSpot. HubSpot Forms cover everything.
4. **Custom domain SSL** — verify HubSpot has an SSL cert for `hcfm.org/brand` before launch.

For questions: Emmanuel Epau · `eepau@hcfm.org`
