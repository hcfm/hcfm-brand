# Memo for Joe Pereira — HubSpot Permission Set request

Hi Joe,

I built a brand portal that lives at `hcfm.org/brand-preview` (heading to `/brand` for official launch). Everything is now self-contained inside HubSpot — assets, templates, modules, three HubDB tables for FAQ/chatbot/ministries — and the Phase 1-3 work is done.

To finalize hardening, I need a Permission Set created so my brand-portal work can't be accidentally edited by other team members.

## What I'm asking

Create a Permission Set called **"Brand Portal Editors"** with these characteristics:

| Scope | Access |
|---|---|
| Design Manager → folder `_hcfm-brand-portal` | Edit (Victoria + me) |
| Design Manager → all other folders | Read-only |
| Files → folder `_hcfm-brand` | Edit (Victoria + me) |
| Files → all other folders | Read-only |
| HubDB → tables `hcfm_faq`, `hcfm_chatbot_kb`, `hcfm_ministries` | Edit (Victoria + me) |
| Pages → `HCFM Brand Portal` page (id 212534416190) | Edit (Victoria + me) |
| All other pages | Read-only |

Then assign this Permission Set to:
- Emmanuel Epau (eepau@hcfm.org)
- Victoria Hassan (vhassan@hcfm.org)

## Why this matters

- **Today:** Anyone with marketing-pages edit permission on the team can technically open the brand portal page or edit our HubDB tables. The naming convention (`_hcfm-brand-`) and our team's discipline keeps this from happening, but it's *possible*.
- **After your change:** The brand portal becomes hard-locked. Only Victoria and I can edit the layout, the modules, the HubDB content, or the page. Other team members can view it (read-only) but cannot modify.

## What this does NOT do

- Doesn't restrict anyone from VIEWING the brand portal (it's a public page on hcfm.org)
- Doesn't affect any of the 55 other pages on hcfm.org — those keep their existing permissions
- Doesn't change anyone's permission on Catholic Mom, Family Theater, FTP, or other ministry content
- Doesn't add any cost — Permission Sets are included in our existing Marketing Hub Enterprise plan

## What you'd need to do (estimated 10 min)

1. Settings → Users & Teams → Permission Sets
2. Create new permission set: "Brand Portal Editors"
3. Set folder/page-level edit restrictions per the table above
4. Assign to my user (id 80574052) and Victoria's user

If you have questions or want to discuss before doing this, I'm happy to walk through it together. No urgency — soft mitigation via naming convention is working fine; this is the "trust but verify" layer.

Thanks,
Emmanuel

---

## Technical reference (you don't need to send this to Joe, just for your records)

- Brand portal page ID: 212534416190
- Theme name: `_hcfm-brand-portal` (Design Manager folder)
- Files folder: `_hcfm-brand`
- HubDB tables:
  - `hcfm_faq` (id 282697015)
  - `hcfm_chatbot_kb` (id 282697845)
  - `hcfm_ministries` (id 282663491)
- Live URL: `https://www.hcfm.org/brand-preview`
