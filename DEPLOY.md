# HCFM Brand Identity — Deployment

Plain-English notes for whoever ships the production version.

## Where it runs today

**GitHub Pages**, free tier, served from this repo's `main` branch.

- **Live URL:** https://emmanuelepau.github.io/hcfm-brand/
- **Source:** https://github.com/EmmanuelEpau/hcfm-brand
- **Heavy assets (ZIPs):** Hosted via [GitHub Releases](https://github.com/EmmanuelEpau/hcfm-brand/releases/tag/v1.0-assets), not in the repo
- **Deploy trigger:** Every `git push` to `main` rebuilds the site within ~60 seconds

That's the entire stack. There is no server, database, build step, or CI pipeline. The HTML, CSS, and JS are static files. Click anywhere in this repo, edit, push, and the live site updates.

## Updating the live site after launch

Three options, in order of "no tools needed":

| Method | Tools | Right when |
|---|---|---|
| **Edit on github.com** | Just a browser. Click any file → pencil icon → edit → "Commit" | Quick text fixes, adding bot answers, fixing typos |
| **GitHub Desktop** | Free Mac app, no command line | Editing multiple files at once |
| **Local + `git push`** | Terminal | Bigger structural changes |

The site rebuilds automatically. No "deploy button" anywhere.

## What's demo-grade and needs a production swap

These three items are wired for the showcase but should be rebuilt before public launch:

### 1. Password gate (`scripts.js`, top of the IIFE)

```js
const MINISTRY_PASSWORDS = ['hcfm2026', 'eastoncreatives', 'familyrosary'];
const ADMIN_PASSWORDS    = ['emmyvictoria', 'brandowners', 'eastonadmin'];
```

These are **client-side checks** — anyone reading the JS source can see them. Fine for the showcase, NOT for ministry-center distribution.

**Production swap options:**
- WordPress: install [Password Protected](https://wordpress.org/plugins/password-protected/) plugin
- HubSpot: enable native Memberships on the Downloads page
- Standalone: put `htpasswd` Basic Auth on a `/locked/` subfolder

### 2. Forms (Help page)

Both forms use `mailto:` handoff — clicking submit opens the user's email client with the body pre-filled.

```html
<form action="mailto:vhassan@hcfm.org,eepau@hcfm.org">
```

**Production swap options:**

| Platform | Form solution | Effort |
|---|---|---|
| WordPress | Gravity Forms or WPForms | 1 hour |
| HubSpot | Native HubSpot Forms (feeds CRM) | 30 minutes |
| Standalone | Formspree or Basin | 15 minutes |

The HTML structure stays the same — only the `action=` URL changes.

### 3. Brand chat helper

Currently a hand-built keyword matcher in `scripts.js` — 75 question patterns mapped to pre-approved answers.

**To add a new Q&A:** open `scripts.js`, find the `knowledge` array, add an entry:

```js
{ q: ['keyword 1', 'keyword 2'], a: 'The exact answer text.' },
```

Push the change. Live in ~60 seconds.

**To upgrade to real AI later:** plug into Claude API or OpenAI with the brand book PDFs as context. Costs $0.003–$0.03/query, introduces hallucination risk. Not necessary unless usage volume justifies it.

---

## Migration paths

### Path A — Move to WordPress (hcfm.org/brand)

1. Install plugins: **Custom HTML block** (built-in) + **Password Protected** (free) + **Gravity Forms** or WPForms
2. Create a new page in WP, full-width template, slug `brand-identity`
3. Paste `<main class="content">…</main>` from `index.html` into a Custom HTML block
4. Upload `assets/` and `downloads/` to `wp-content/uploads/brand/` via FTP
5. Update asset paths in HTML/CSS/JS from `assets/...` → `/wp-content/uploads/brand/...`
6. Enqueue `styles.css` and `scripts.js` only on this page via `functions.php`:
   ```php
   add_action('wp_enqueue_scripts', function() {
     if (is_page('brand-identity')) {
       wp_enqueue_style('hcfm-brand', get_template_directory_uri() . '/brand-page/styles.css');
       wp_enqueue_script('hcfm-brand', get_template_directory_uri() . '/brand-page/scripts.js', [], false, true);
     }
   });
   ```
7. Replace `mailto:` form actions with Gravity Form shortcodes
8. Replace JS password gate with Password Protected plugin scope on the Downloads section

The site lives at `hcfm.org/brand-identity` and inherits the parent site's topbar, header, and footer.

**Estimated effort:** 1–2 hours.

### Path B — Move to HubSpot CMS Hub

1. Pages → Create page → Use blank template
2. Edit Source → paste the full HTML
3. Upload assets to HubSpot File Manager. Replace asset paths with `{{ get_asset_url('/brand/...') }}` Jinja syntax
4. Enqueue CSS and JS via HubSpot's site-level head HTML or per-page module
5. For the locked tier, use HubSpot's native **Memberships** feature instead of the JS password gate. Memberships gives per-user logins and a full audit trail in the CRM
6. Replace `mailto:` form actions with HubSpot Form embed codes — submissions feed CRM directly

The brand helper, ministry detail pages, color cubes, and other interactive bits work identically inside HubSpot CMS — they are vanilla JS with no framework dependency.

**Estimated effort:** 2–3 hours.

### Path C — Stay on GitHub Pages (recommended for now)

The current setup works for ministry centers, vendors, and partners worldwide. Nothing to migrate. When the WordPress production site is ready, point `hcfm.org/brand` (or `brand.hcfm.org`) at this URL via DNS.

---

## Custom domain (optional, anytime)

To serve at `brand.hcfm.org` instead of `emmanuelepau.github.io/hcfm-brand`:

1. In your DNS provider, add a CNAME record: `brand` → `emmanuelepau.github.io`
2. In the repo: `Settings → Pages → Custom domain` → enter `brand.hcfm.org`
3. Wait 10–30 minutes for SSL to provision

GitHub Pages handles HTTPS automatically.

---

## What changed in the showcase build

- Sixteen routed pages (Symbol, Logos, Colors, Typography, Voice, Imagery, Design Elements, Stationery, Platform Dimensions, Ministry Centers, Downloads, Videos, Pre-flight Checklist, FAQ, Help, Home)
- Real Whitney + Calluna + Playlist Script fonts loaded via `@font-face`
- Click-to-copy on every color swatch
- Two-tier password gate on Downloads (`hcfm2026` ministry tier, `emmyvictoria` source-files tier)
- Image lightbox for photography
- 75-entry hand-built brand chat helper
- 17-question searchable FAQ
- Heavy ZIPs (logo packs + 24 ministry source files) hosted on GitHub Releases

---

## Contacts

- **Brand owners:** Victoria Hassan · `vhassan@hcfm.org` · Emmanuel Epau · `eepau@hcfm.org`
- **Repo owner:** [@EmmanuelEpau](https://github.com/EmmanuelEpau)
