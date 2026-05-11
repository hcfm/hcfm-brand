# HCFM Brand Portal — Editor's Guide

**For:** Marketing team members (Victoria, Margaret, Colum, and anyone with HubSpot Marketing access) who want to edit content on the brand portal **without writing code**.
**Last updated:** 2026-05-11

If you can find what you want to edit, you can edit it. This guide tells you where everything is.

---

## Before you start

You need: a **HubSpot account login** with access to the Family Rosary, Inc. portal (account ID 275132). Sign in at [app.hubspot.com](https://app.hubspot.com).

If you don't have access yet, ask Emmanuel (eepau@hcfm.org) or Victoria (vhassan@hcfm.org).

You do NOT need: any coding knowledge, the command line, or anything installed on your computer beyond a web browser.

---

## Quick reference — what to edit, where

| You want to change… | Go to | How long it takes |
|---|---|---|
| A chatbot answer | **Content → HubDB → HCFM Chatbot Knowledge Base** | 2 min |
| An FAQ question or answer | **Content → HubDB → HCFM FAQ** | 2 min |
| A ministry center's name, region, or order | **Content → HubDB → HCFM Ministry Centers** | 2 min |
| A color hex code | **Content → Design Manager → `_hcfm-brand-portal/css/hcfm-styles.css`** (top of file) | 5 min |
| An uploaded image | **Content → Files → `_hcfm-brand/assets/`** → upload new with same name | 1 min |
| A downloadable file (PDF, Word doc) | **Content → Files → `_hcfm-brand/downloads/`** → upload | 1 min |
| The page title or URL | **Content → Website Pages** → click HCFM Brand Portal → Edit | 2 min |
| Copy on Symbol / Voice / Design Elements sections | **Page editor** (after module refactor — see below) | 5 min |
| Copy on other sections (most of them) | **Content → Design Manager → templates/hcfm-brand-portal.html** | 10 min, technical |

---

## Editing the chatbot — the most common edit

The chatbot is driven by a HubDB table. **You can change any answer the chatbot gives, add new questions, or remove obsolete entries — all without writing code.**

### Step-by-step

1. Sign in to [app.hubspot.com](https://app.hubspot.com).
2. In the left sidebar, click **Content** (3rd icon down — looks like a stack of pages).
3. From the Content menu, click **HubDB**.
4. You'll see a list of tables. Click **HCFM Chatbot Knowledge Base** (271 rows).
5. You're now looking at the chatbot's entire knowledge. Each row is one possible Q&A.

### The columns explained

| Column | What it does |
|---|---|
| `keywords` | Comma-separated phrases the chatbot looks for in user questions. **Example:** `why yellow gold, why elevated gold, gold change 2026`. The chatbot matches user input against these. |
| `answer` | What the chatbot says back. You can use HTML tags: `<p>`, `<strong>`, `<em>`, `<ul>`, `<li>`. |
| `category` | Topic bucket — used for organizing. Pick from existing values: `colors`, `logos`, `typography`, `voice`, `imagery`, etc. |
| `priority` | Tie-breaker when multiple rows match. Higher wins. Use 1-100 for old entries, 200+ for new entries you want to override old ones. |

### Adding a new chatbot answer

1. Click **"Add row"** (top right).
2. Fill in keywords, answer, category, priority.
3. Click **Save**.
4. **IMPORTANT:** Click **"Publish"** at the top right of the table. Until you publish, your change is just a draft — the live chatbot won't see it.
5. Wait ~1 minute. The chatbot is updated.

### Editing an existing answer

1. Find the row (use the search box at the top — search by keyword or answer text).
2. Click the row to expand.
3. Edit the field(s).
4. Click **Save**.
5. Click **Publish**.

### Tips for good chatbot answers

- Keep answers short and direct. The chatbot UI shows long answers, but readers skim.
- HTML basics: wrap each paragraph in `<p>`...`</p>`. Use `<strong>` for emphasis. `<em>` for italics. `<ul><li>` for bullet lists.
- Test your edit by going to [hcfm.org/brand](https://www.hcfm.org/brand), opening the chatbot (bottom-right), and asking your test question.
- If you want to make sure your answer wins over an older one, set priority to 300+.

---

## Editing the FAQ section

The FAQ section on the brand portal is also driven by HubDB.

### Step-by-step

1. **Content → HubDB → HCFM FAQ**.
2. Each row = one question + answer.
3. Add / edit / delete rows the same way as the chatbot.
4. Click **Publish** when done.

### Columns

| Column | What |
|---|---|
| `question` | The question text shown in the FAQ accordion |
| `answer` | The answer that appears when the question is clicked |
| `category` | Optional grouping |
| `priority` | Order of appearance (lower = first) |

---

## Editing the ministry-center directory

The 24 ministry cards on the Ministry Centers section come from HubDB.

### Step-by-step

1. **Content → HubDB → HCFM Ministry Centers**.
2. Each row = one ministry.

### Columns

| Column | What |
|---|---|
| `code` | Internal code — must match the folder name in File Manager (e.g. `03_FamRosary`). **Don't change this unless you're also updating files.** |
| `name` | Display name (e.g. "Family Rosary") |
| `region` | Region label (e.g. "Easton, MA" or "Manila, Philippines") |
| `priority` | Sort order in the directory grid |

If you add a new ministry, you also need to:
1. Upload its logo files to **Files → `_hcfm-brand/assets/previews/ministries/{NewCode}/`**
2. Update `_hcfm-brand/assets/ministry-manifest.json` to list the files (this is a small JSON file — ask Emmanuel)

For most cases, editing existing rows is what you'll do.

---

## Changing a brand color hex code globally

If a brand color changes (e.g., Yellow Gold gets a slight tweak), update it in one place and it applies everywhere.

### Step-by-step

1. **Content → Design Manager**.
2. In the left sidebar, click **`_hcfm-brand-portal`**.
3. Click **`css`** folder.
4. Click **`hcfm-styles.css`**.
5. Look at the top of the file. You'll see a `:root` block with color variables:
   ```css
   :root {
     --hcfm-blue: #0047BB;
     --hcfm-gold: #FFB500;
     --hcfm-marian-blue: #00A9E0;
     --hcfm-muted-gold: #89764B;
     ...
   }
   ```
6. Change the hex value next to the color name.
7. Click **Save** (top right of the code editor).
8. Wait ~30 seconds for the CDN to refresh.
9. Visit [hcfm.org/brand](https://www.hcfm.org/brand) to verify.

### ⚠️ Caution

- **Don't change variable NAMES** (the `--hcfm-blue:` part). Only the hex value.
- **Don't change semicolons or other punctuation.** CSS is fussy.
- If something breaks, click **"View history"** in the Design Manager and revert to a previous version.

---

## Swapping an image

To replace an image (logo, photo, etc.) with a new version:

### Option 1 — upload with the same filename (page auto-updates)

1. **Content → Files → `_hcfm-brand` → assets → (the relevant subfolder)**.
2. Find the file you want to replace.
3. Click the file → **Replace** (button in the right sidebar).
4. Upload the new file. Same filename, new content.
5. Wait ~1 minute for the CDN cache to refresh.

This works because the URL stays the same — the brand portal still points to it. Just the content of the file changed.

### Option 2 — upload a new file with a different name

If the new image has a different name, you'll also need to update the reference in the template (technical step).

---

## Adding or replacing a downloadable file

To swap out a PDF, Word document, or any download:

### Step-by-step

1. **Content → Files → `_hcfm-brand` → downloads → (the relevant subfolder)**.
2. To replace an existing file with the same name: click the file → **Replace** → upload.
3. To add a new file: click **Upload files** (top right).
4. After upload, click the file → **Copy URL** (right sidebar).

If you added a new file (not replaced an existing one), you'll need to add a link to it in the page. That's a small Design Manager edit — see below.

---

## Adding a link to a new download on the page

After uploading a new file (above), if you want users to be able to click and download it:

### Step-by-step

1. **Content → Design Manager → `_hcfm-brand-portal/templates/hcfm-brand-portal.html`**.
2. Find the right Downloads pane (search for `data-dl-pane="documents"` or `="templates"` etc.).
3. Find the existing `<ul class="download-list">` block.
4. Copy one of the existing `<li>` items.
5. Paste it just below, then change:
   - The `href` URL to your new file's URL
   - The `<strong>...</strong>` to the new file's display name
   - The `<span>...</span>` to a short description (file type, page count, etc.)
6. Click **Save**.

### Example

```html
<li>
  <a href="https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/downloads/public/My_New_File.pdf" download>
    <strong>My New File</strong>
    <span>PDF · 12 pages · Description here</span>
  </a>
</li>
```

---

## Editing the page title, URL, or meta description

For SEO and page-level settings:

### Step-by-step

1. **Content → Website Pages**.
2. Find **HCFM Brand Portal** in the list.
3. Click it.
4. Click **Edit** (top right) or **Settings**.
5. Change page title, URL, meta description, OG image, etc.
6. Click **Update** (saves and publishes).

---

## Editing module-based sections — Symbol, Voice, Design Elements, etc.

The brand portal includes a set of **reusable HubSpot modules** for the most-edited sections. Each module has a small set of fields (heading, body text, image, etc.) that you can edit without touching code. **This is the easiest, safest way to update copy.**

### Available editable modules

| Module name | What it represents | Where it appears |
|---|---|---|
| **HCFM Color Swatch** | One color cube with hex/RGB/Pantone codes | Colors section |
| **HCFM FAQ Item** | One question + answer | FAQ section (also in HubDB) |
| **HCFM Help Card** | One named contact card | Help section |
| **HCFM Symbol Layer** | One of the 5 symbol-meaning layers (10 Beads, Family of Prayer, Floral, Moon, Welcome) | Symbol page |
| **HCFM Voice Rule** | One rule in the Voice section's rule lists | Voice page |
| **HCFM Design Element** | One of the 4 approved design elements (Thin Border, Color Fade, Curved Shapes, Dark Overlays) | Design Elements page |

### How to find and edit a module

Modules can be edited in two places, depending on how the template uses them:

#### Path A — Edit module defaults in Design Manager (technical but works for ALL modules)

1. **Content → Design Manager**.
2. In the left sidebar, expand **`_hcfm-brand-portal`** → **`modules`**.
3. Click the module folder you want to edit (e.g., `hcfm-symbol-layer.module`).
4. You'll see three files: `fields.json`, `meta.json`, `module.html`.
5. To change the **default content** that appears when the module is first inserted: open `fields.json` and edit the `"default"` values. Save.
6. To change the **HTML structure** the module renders: open `module.html` and edit. Save.

This affects every NEW use of the module. Existing instances on the page keep their saved field values.

#### Path B — Edit a specific module instance in the page editor (no code)

1. **Content → Website Pages → HCFM Brand Portal → Edit**.
2. The page opens in a visual editor.
3. Scroll to the section with the module (e.g., Symbol layers, Voice rules, Design Elements cards).
4. Click on the module on the page to select it.
5. A panel on the right opens with the module's editable fields.
6. Edit any field (Eyebrow label, Heading, Body, Image, etc.).
7. Click **Update** at the top right of the page editor.

This is the **non-technical** path. Use this for most edits.

### What each module's fields control

**HCFM Symbol Layer** (5 instances on the Symbol page):

| Field | Effect |
|---|---|
| Eyebrow label | Small caps text above the heading ("Foundation", "Detail 1", etc.) |
| Heading | The layer's title (e.g., "The 10 Beads of the Rosary") |
| Body text | Rich-text paragraph(s) explaining the layer (field name: `body_text`) |
| Visualization image | The visual that illustrates this layer |
| Image position | Left of text / Right of text |
| Image background | Light or Dark (Dark for white-on-transparent symbols) |

**HCFM Voice Rule** (used multiple times in the Voice section):

| Field | Effect |
|---|---|
| Rule title | The short bold title (e.g., "Plain English") |
| Rule explanation | 1-2 sentences explaining the rule with an example |

**HCFM Design Element** (4 instances in the Design Elements section):

| Field | Effect |
|---|---|
| Element title | Name of the design element |
| What this element is | 1-2 paragraphs describing the element and its rules |
| Where to use this (optional callout) | Gold-bordered callout listing specific use cases |

### When to ask Emmanuel instead

The module *definitions* (the HTML and field schema) are technical. Don't edit `module.html` or `fields.json` files unless:
- You're confident with HubL syntax
- You've tested the change in a draft first
- You're prepared to roll back if something breaks

For all routine content edits, **use Path B above** — the page editor's visual interface. It's safe, reversible, and doesn't require any code knowledge.

---

## What you should NOT edit (without Emmanuel)

Some things are technically editable in Design Manager but are easy to break. Don't touch these unless you know what you're doing:

- **JavaScript files** (`js/hcfm-scripts.js`) — chatbot logic, downloads, interactive features
- **HubL `{% module %}` tags** in the template
- **Membership group IDs** in JS files (Tier 1 / Tier 2 unlock logic)
- **The manifest.json file** in File Manager (controls ministry logo galleries)
- **CSS structure** (focus only on color hex changes; layout edits are riskier)

If you need any of these changed, ask Emmanuel.

---

## How to revert a change if you break something

HubSpot keeps revision history on every edit.

### For Design Manager files

1. Open the file in Design Manager.
2. Click **"View history"** (top right of the code editor).
3. Pick an earlier revision.
4. Click **"Restore"**.

### For HubDB rows

1. Open the table.
2. Find the row.
3. The row's edit panel has a small history icon.
4. Pick an earlier version and restore.

### For Files

If you uploaded a bad replacement, re-upload the original (you keep it locally, right?). HubSpot doesn't keep deep file history beyond ~30 days for free accounts.

---

## When in doubt — ask the chatbot

Open [hcfm.org/brand](https://www.hcfm.org/brand), click "Ask the brand" (bottom-right), and ask the chatbot. It can explain rules, point to the right section, and tell you what's allowed.

For things outside the chatbot's scope, use the **Help** section's forms to email Victoria and Emmanuel directly.

---

## Cheat sheet — the URLs you'll bookmark

| Tool | URL |
|---|---|
| HubSpot home | app.hubspot.com |
| HubDB list | app.hubspot.com/hubdb/275132 |
| Chatbot KB table | app.hubspot.com/hubdb/275132/table/282697845 |
| FAQ table | app.hubspot.com/hubdb/275132/table/282697015 |
| Ministry Centers table | app.hubspot.com/hubdb/275132/table/282663491 |
| Design Manager (theme code) | app.hubspot.com/design-manager/275132 |
| File Manager | app.hubspot.com/files/275132 |
| Page editor | app.hubspot.com/pages/275132/editor/212534416190/content |
| Live brand portal | hcfm.org/brand |
| Git history (audit trail) | github.com/EmmanuelEpau/hcfm-brand/commits/main |

---

## One last thing

Changes you make in HubSpot are **live in 30 seconds to 1 minute** in most cases. There's no "preview before publish" step beyond HubDB's draft/publish flow. So:

- For HubDB edits: you have a built-in safety net (the publish button).
- For all other edits: hit Save, then look at the live page to confirm it looks right.

If you're worried about a big change, copy-paste the current value into a Notion doc or sticky note BEFORE you change it. That's your manual rollback.

---

**Questions about anything in this guide?** Ask Emmanuel (eepau@hcfm.org) or the brand portal chatbot itself.
