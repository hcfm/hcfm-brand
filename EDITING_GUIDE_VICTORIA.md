# Brand Portal — Editing Guide

For Victoria Hassan and anyone authorized to update brand portal content. No coding required.

---

## What you can edit yourself

After Phase 3 (HubDB migration), three categories of brand-portal content are now editable as data tables in HubSpot — no developer needed, no code changes, no waiting for Emmanuel:

| Content | Where it lives | Table ID |
|---|---|---|
| **Chatbot answers** (the "Ask the brand" bot's 169 KB entries) | HubDB → `hcfm_chatbot_kb` | 282697845 |
| **FAQ items** (questions ministry centers ask) | HubDB → `hcfm_faq` | 282697015 |
| **Ministry directory** (the 24 sub-ministries shown on the Ministry Centers page) | HubDB → `hcfm_ministries` | 282663491 |

When you change a row in any of these tables and click **Publish**, the live page at **https://www.hcfm.org/brand-preview** updates within seconds. No re-deploy. No git. No Emmanuel.

---

## How to get to HubDB

1. Log into HubSpot at https://app.hubspot.com
2. In the top-left navigation, hover over the **Content** icon (looks like a stack of squares)
3. Click **HubDB**
4. You'll see a list of tables. Look for the three tables prefixed `hcfm_`:
   - `hcfm_chatbot_kb`
   - `hcfm_faq`
   - `hcfm_ministries`

---

## Editing the FAQ

**Use case:** A ministry center asks a new question that should be added. Or you want to refine an existing answer.

1. Open `hcfm_faq` table
2. Click **Add row** (top-right) for new questions, or click an existing row to edit
3. Fill in:
   - **Question** — phrase as the ministry center would actually ask it. Plain English.
   - **Answer** — rich text. Keep it conversational. You can include links, bold, and basic formatting.
   - **Category** — optional. Examples: "Logos," "Colors," "Workflow"
   - **Pin to top** — toggle this on for questions you want shown first
   - **Display order** — number that controls order (1 = first, 2 = second, etc.)
4. Click **Save** to save as draft
5. Click **Publish** (the orange button at top-right) to push live

The change appears at `https://www.hcfm.org/brand-preview#faq` within seconds.

---

## Editing the chatbot

**Use case:** You notice the bot gives a wrong answer to a common question. Or you want to add a new fact about the brand the bot should know.

1. Open `hcfm_chatbot_kb` table
2. Search the **Keywords** column for relevant terms (e.g., "yellow gold")
3. Click the matching row to edit, or click **Add row** for a new entry
4. Fill in:
   - **Keywords** — comma-separated phrases users might type. The bot matches the user's question against these. Example: `yellow gold, gold hex, ffb500, primary color`
   - **Answer (HTML)** — what the bot replies with. Can include `<strong>`, `<em>`, `<a href>`, etc.
   - **Category** — optional grouping label
   - **Priority** — number for ordering when multiple entries match
5. Click **Save**, then **Publish**

**Tips:**
- Add 4-8 keywords per entry to maximize match rate
- Keep answers under 200 words — bots that ramble lose users
- Use HTML sparingly. `<strong>` for emphasis is fine; avoid complex markup

---

## Adding or editing a ministry

**Use case:** A new ministry center is launching. Or HCFM Bangladesh changes its name. Or the order of cards needs to change.

1. Open `hcfm_ministries` table
2. Click **Add row** (or edit existing)
3. Fill in:
   - **Code** — the folder name in HubSpot Files. Example: `25_HCFM_Vietnam`. This is the ID, used to look up logo files.
   - **Display name** — what shows on the card. Example: "HCFM Vietnam"
   - **Region / location** — what shows below the name. Example: "Hanoi, Vietnam" or just "Vietnam"
   - **Display order** — controls position in the grid (1 = first)
   - **Use parent HCFM logo** — toggle ON only for HCFM Foundation (which uses parent logo, not its own)
4. Click **Save**, then **Publish**

**Note:** Adding a ministry to the table doesn't automatically make logo files appear. The ministry's logo files (the parent_logotype1, parent_logotype2, etc.) need to be uploaded to `_hcfm-brand/assets/previews/ministries/{code}/` in HubSpot Files. Talk to Emmanuel before adding a new ministry — there's a 5-minute file-upload step that's still manual.

---

## Things you cannot edit through HubDB (yet)

The following content is still hardcoded in the page template and requires Emmanuel to change:

| Content | Why it's hardcoded |
|---|---|
| Hero title and subtitle ("The visual expression of a global family at prayer.") | One-time content, low edit frequency |
| Section descriptions on Symbol, Logos, Colors, Typography, Voice, Imagery, Design Elements, Stationery, Platforms pages | Tied to specific brand-book wording |
| Color hex values | Set in theme fields (also editable, but more carefully) |
| Pre-flight checklist items | Could become a HubDB table in the future |
| Help / contact card content | Could become module fields in the future |

If you find yourself wanting to edit any of these regularly, tell Emmanuel — they can be moved to HubDB in a follow-up phase.

---

## Common gotchas

| Issue | What to do |
|---|---|
| Edited a row but the change isn't live | You forgot to click **Publish**. HubDB has a draft state that doesn't appear publicly until published. |
| The bot doesn't recognize a question I added | Check that the keywords are lowercase and comma-separated. Refresh the live page. |
| A new ministry isn't showing up | Did you click **Publish**? Did you set **Display order**? Did you upload its logo files? |
| FAQ has duplicates | Check **Display order** — multiple rows with the same order number can render unpredictably. |
| Special characters look broken (→ × …) | They shouldn't — but if they do, copy from the live page's source rather than another tool |

---

## When to call Emmanuel

- Adding a new ministry center (logo file upload step still manual)
- Changing the look/feel of any element (colors, fonts, layout)
- Adding new SECTIONS to the brand portal (not just rows in existing sections)
- Creating new HubDB tables
- Migrating other content (e.g., Help cards) to HubDB
- Anything that doesn't fit into the three existing tables

---

## What to tell ministry centers

The brand portal at **https://www.hcfm.org/brand-preview** is now actively maintained. The FAQ is updated as new questions come in. The chatbot learns as we add to it. The ministry directory reflects the current global structure.

If a ministry center asks a question:
1. If the answer is in the FAQ, point them to it
2. If the answer is in the bot, encourage them to use the bot
3. If neither, ANSWER them directly, then add the answer to either the FAQ (if it's a structured question) or the bot KB (if it's a quick fact). The brand portal gets smarter with every interaction.

That's the magic of HubDB — content updates compound. The brand portal becomes the team's institutional memory.
