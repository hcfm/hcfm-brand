#!/usr/bin/env python3
"""
apply-forms.py — Once the 4 HubSpot Forms exist and you have their GUIDs,
update forms/forms-config.json with the real GUIDs, then run:

    python3 forms/apply-forms.py

This injects the GUIDs into:
  - theme/_hcfm-brand-portal/js/hcfm-scripts.js  (form-submit handler)
  - theme/_hcfm-brand-portal/templates/hcfm-brand-portal.html  (form structure)

Then deploy with:
    npx -p @hubspot/cli@latest hs cms upload theme/_hcfm-brand-portal _hcfm-brand-portal
And republish the website page in HubSpot UI.
"""

import json, re, sys, os
from pathlib import Path

ROOT = Path(__file__).parent.parent
CONFIG = ROOT / 'forms' / 'forms-config.json'
JS_PATH = ROOT / 'theme' / '_hcfm-brand-portal' / 'js' / 'hcfm-scripts.js'
TPL_PATH = ROOT / 'theme' / '_hcfm-brand-portal' / 'templates' / 'hcfm-brand-portal.html'

def main():
    cfg = json.loads(CONFIG.read_text())
    portal = cfg['portalId']
    forms = cfg['forms']

    # Verify all GUIDs are filled in
    missing = [k for k, f in forms.items() if f['guid'].startswith('__')]
    if missing:
        print(f"ERROR: GUIDs still placeholder for: {', '.join(missing)}")
        print("Fill in real GUIDs in forms/forms-config.json before running this script.")
        sys.exit(1)

    print(f"Portal: {portal}")
    for k, f in forms.items():
        print(f"  {f['name']}: {f['guid']}")

    # ---- Inject submission handler into scripts.js ----
    js = JS_PATH.read_text()
    handler_block = f'''
  /* HCFM Forms — submit to HubSpot Forms API (Phase 4) */
  const HCFM_FORMS = {{
    portalId: '{portal}',
    asset_request: '{forms['asset_request']['guid']}',
    feedback: '{forms['feedback']['guid']}',
    vendor_access: '{forms['vendor_access']['guid']}',
    bot_escalation: '{forms['bot_escalation']['guid']}'
  }};
  async function hcfmSubmitForm(formKey, fields) {{
    const guid = HCFM_FORMS[formKey];
    if (!guid) {{ console.warn('Unknown form key:', formKey); return false; }}
    const url = `https://api.hsforms.com/submissions/v3/integration/submit/${{HCFM_FORMS.portalId}}/${{guid}}`;
    const payload = {{
      fields: Object.entries(fields).map(([name, value]) => ({{ name, value: String(value || '') }})),
      context: {{ pageUri: window.location.href, pageName: document.title }}
    }};
    try {{
      const r = await fetch(url, {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify(payload)
      }});
      return r.ok;
    }} catch (e) {{ console.warn('Form submit failed:', e); return false; }}
  }}
'''

    # Insert after the IIFE start, before any other code
    marker = "(function () {\n  'use strict';"
    if marker in js and 'HCFM_FORMS' not in js:
        js = js.replace(marker, marker + handler_block, 1)
        JS_PATH.write_text(js)
        print(f"  ✓ Injected hcfmSubmitForm() into scripts.js")
    elif 'HCFM_FORMS' in js:
        print(f"  - hcfmSubmitForm() already in scripts.js")
    else:
        print(f"  ✗ scripts.js IIFE marker not found")

    # ---- Replace mailto form actions in template ----
    tpl = TPL_PATH.read_text()

    # Replace asset request form
    old_action_1 = 'action="mailto:vhassan@hcfm.org,eepau@hcfm.org?subject=Brand%20Asset%20Request" method="post" enctype="text/plain"'
    new_action_1 = 'data-hcfm-form="asset_request" onsubmit="event.preventDefault(); hcfmSubmitForm(\'asset_request\', { firstname: this.querySelector(\'[name=Name]\')?.value, email: this.querySelector(\'[name=Email]\')?.value, hcfm_ministry_center: this.querySelector(\'[name=Ministry]\')?.value, hcfm_brand_request: this.querySelector(\'[name=Request]\')?.value }).then(ok => { this.querySelector(\'.form-status\')?.classList.add(ok ? \'ok\' : \'fail\'); if (ok) this.reset(); }); return false;"'
    if old_action_1 in tpl:
        tpl = tpl.replace(old_action_1, new_action_1)
        print(f"  ✓ Replaced asset request form action")

    # Replace feedback form
    old_action_2 = 'action="mailto:vhassan@hcfm.org,eepau@hcfm.org?subject=Brand%20Page%20Feedback" method="post" enctype="text/plain"'
    new_action_2 = 'data-hcfm-form="feedback" onsubmit="event.preventDefault(); hcfmSubmitForm(\'feedback\', { firstname: this.querySelector(\'[name=Name]\')?.value, email: this.querySelector(\'[name=Email]\')?.value, hcfm_brand_feedback: this.querySelector(\'[name=Feedback]\')?.value }).then(ok => { this.querySelector(\'.form-status\')?.classList.add(ok ? \'ok\' : \'fail\'); if (ok) this.reset(); }); return false;"'
    if old_action_2 in tpl:
        tpl = tpl.replace(old_action_2, new_action_2)
        print(f"  ✓ Replaced feedback form action")

    TPL_PATH.write_text(tpl)
    print(f"\nDone. Now run:")
    print(f"  npx -p @hubspot/cli@latest hs cms upload theme/_hcfm-brand-portal _hcfm-brand-portal")
    print(f"Then republish the website page via HubSpot UI.")

if __name__ == '__main__':
    main()
