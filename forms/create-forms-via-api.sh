#!/bin/bash
# create-forms-via-api.sh — Run this AFTER you've regenerated your PAK with the 'forms' scope checked.
# It creates 4 HubSpot Forms via the v3 API and writes their GUIDs into forms-config.json.

set -e
cd "$(dirname "$0")/.."

TOKEN=$(grep -A 1 'accessToken:' hubspot.config.yml | tail -1 | sed 's/^ *//')
if [ -z "$TOKEN" ]; then
  echo "ERROR: No accessToken in hubspot.config.yml. Run 'hs accounts list' first to refresh, then re-run this script."
  exit 1
fi

PORTAL=275132
FORMS=(asset-request feedback vendor-access bot-escalation)

echo "=== Creating 4 HubSpot Forms ==="
declare -A GUIDS

for SHORT in "${FORMS[@]}"; do
  KEY="hcfm-${SHORT}"  # e.g., hcfm-asset-request, hcfm-feedback
  PAYLOAD_FILE="forms/hcfm-brand-${SHORT}.json"
  if [ ! -f "$PAYLOAD_FILE" ]; then
    PAYLOAD_FILE="forms/hcfm-${SHORT}.json"
  fi
  if [ ! -f "$PAYLOAD_FILE" ]; then
    echo "  ✗ Payload not found for $KEY (tried hcfm-brand-${SHORT}.json and hcfm-${SHORT}.json)"
    continue
  fi
  echo "  Creating $KEY from $PAYLOAD_FILE..."
  RESP=$(/usr/bin/curl -sS -X POST "https://api.hubapi.com/marketing/v3/forms" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "@$PAYLOAD_FILE")
  GUID=$(echo "$RESP" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
  if [ -n "$GUID" ]; then
    echo "    ✓ Created: $GUID"
    GUIDS[$SHORT]=$GUID
  else
    echo "    ✗ Failed: $RESP"
  fi
done

echo ""
echo "=== Updating forms-config.json with GUIDs ==="
python3 << PYEOF
import json
with open('forms/forms-config.json') as f:
    cfg = json.load(f)
mapping = {
    'asset_request': "${GUIDS[asset-request]}",
    'feedback': "${GUIDS[feedback]}",
    'vendor_access': "${GUIDS[vendor-access]}",
    'bot_escalation': "${GUIDS[bot-escalation]}",
}
for k, v in mapping.items():
    if v and v.strip():
        cfg['forms'][k]['guid'] = v
with open('forms/forms-config.json', 'w') as f:
    json.dump(cfg, f, indent=2)
print("Wrote new GUIDs to forms-config.json")
PYEOF

echo ""
echo "=== Next steps ==="
echo "  1. Run: python3 forms/apply-forms.py"
echo "  2. Run: npx -p @hubspot/cli@latest hs cms upload theme/_hcfm-brand-portal _hcfm-brand-portal"
echo "  3. Republish the website page via HubSpot UI"
