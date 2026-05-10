#!/usr/bin/env python3
"""
Fix-up: categorize the existing 169 v1 rows in HubDB hcfm_chatbot_kb.

Fetches rows via the HubDB API (which DOES return IDs, unlike the CLI's local
JSON dump), assigns categories by keyword matching, PATCHes each row, then
publishes the draft.
"""
from __future__ import annotations
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

REPO = Path(__file__).parent.parent.resolve()
CONFIG = REPO / "hubspot.config.yml"
TABLE_ID = "282697845"
BASE = "https://api.hubapi.com"

# Same categorization logic as chatbot_kb_v2.py — kept in sync by hand.
CATEGORY_KEYWORDS = {
    "colors":          ["color", "palette", "primary", "secondary", "blue", "gold", "black", "white",
                        "pantone", "hex", "rgb", "marian", "muted", "ffb500", "0047bb", "00a9e0",
                        "89764b", "000000", "ffffff", "contrast", "wcag", "complementary",
                        "ikea", "gestalt", "60-30-10", "color wheel", "color hierarchy"],
    "logo":            ["mark vs logo", "logotype", "favicon", "logo download", "logo do not",
                        "minimum size", "clear space", "free space", "ai file", "eps", "svg",
                        "logo size", "logo rule", "misuse", "logo design", "sub brand", "podcast logo"],
    "symbol":          ["symbol meaning", "10 beads", "ten beads", "family of prayer",
                        "floral", "moon", "welcome", "invitation", "mark layers", "circular",
                        "each shape person"],
    "typography":      ["font", "typography", "calluna", "whitney", "playlist script", "times roman",
                        "body text", "headline", "font pairing", "humanist sans", "monotype",
                        "three fonts", "one font", "script"],
    "voice":           ["voice", "tone", "we say", "we avoid", "donor letter", "social caption",
                        "narrative voice", "warm voice", "family unit"],
    "imagery":         ["imagery", "photography", "photo categor", "rule of thirds", "leading lines",
                        "frame within", "filling the frame", "shot list", "event photography",
                        "stock photography", "staged photo", "real not stock", "photography rules"],
    "design-elements": ["design element", "thin border", "color fade", "gradient",
                        "dark overlay", "border thickness", "overlay opacity", "one accent per design",
                        "one or two elements", "restraint design"],
    "stationery":      ["stationery", "letterhead", "business card", "envelope", "easton address",
                        "word template"],
    "platforms":       ["instagram", "facebook", "linkedin", "twitter", "x size", "youtube",
                        "platform dimensions", "platform"],
    "downloads":       ["password", "access", "unlock", "logo download", "where logo",
                        "download logo", "get logo", "font download", "where font", "get fonts",
                        "ai files restricted", "password gate", "gated downloads"],
    "ministries":      ["ministry center", "sub ministry", "ministries list", "family rosary",
                        "catholic mom", "museum of family prayer", "family theater productions"],
    "father-peyton":   ["father peyton", "venerable", "patrick peyton", "founder", "peyton phrase",
                        "the family that prays"],
    "history":         ["why changed", "why update", "why new system", "transition", "deadline",
                        "2026 system", "simplified palette", "playlist script added",
                        "follower decline", "what stayed", "full rebrand", "gradual change",
                        "phased rollout"],
    "accessibility":   ["wcag aa", "contrast ratio", "accessibility ratio", "yellow gold body",
                        "gold readability"],
    "research":        ["research backing", "evidence", "labrecque", "cyr trust",
                        "ab test", "test color", "google color test", "paid boosting",
                        "qualitative research", "negative feedback rate", "cta over vanity",
                        "click rate"],
    "regional":        ["uganda", "philippines black", "ireland color", "east africa",
                        "vatican", "ewtn", "word on fire", "global community", "audience",
                        "younger generations", "mobile screens", "digital first", "global"],
    "workflow":        ["preflight", "pre-flight", "checklist", "before publish",
                        "review my work", "who reviews", "check my design",
                        "co-branding", "partner logo", "report misuse", "wrong use",
                        "centralized asset distribution", "sharepoint replacement",
                        "ministry support", "easton creatives support"],
    "contact":         ["contact", "email", "help", "who maintains", "who owns brand",
                        "easton creatives", "who manages brand"],
    "translation":     ["translation", "french", "spanish", "portuguese", "swahili"],
    "philosophy":      ["why aesthetic", "why this brand", "value of brand guidelines",
                        "purpose of brand portal", "why public", "why visible",
                        "why simplicity logo", "no extra icons", "consistency mission"],
}
CATEGORY_ORDER = ["symbol", "father-peyton", "logo", "typography", "voice", "imagery",
                  "design-elements", "stationery", "platforms", "accessibility",
                  "research", "regional", "translation", "ministries", "workflow",
                  "contact", "downloads", "history", "philosophy", "colors"]

def categorize(keywords: str) -> str:
    kw_lower = (keywords or "").lower()
    for cat in CATEGORY_ORDER:
        for trig in CATEGORY_KEYWORDS.get(cat, []):
            if trig in kw_lower:
                return cat
    return "general"


def read_token() -> str:
    text = CONFIG.read_text()
    m = re.search(r"accessToken:\s*>-\s*\n\s*(\S+)", text)
    if not m:
        m = re.search(r"accessToken:\s*(\S+)", text)
    if not m:
        sys.stderr.write("ERROR: couldn't find accessToken in hubspot.config.yml\n")
        sys.exit(1)
    return m.group(1).strip()


def req(method: str, path: str, token: str, body: dict | None = None) -> dict:
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(
        url, data=data, method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            text = resp.read().decode()
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode() if e.fp else ""
        sys.stderr.write(f"HTTP {e.code} {method} {url}\n{body_txt[:400]}\n")
        raise


def main() -> None:
    token = read_token()
    # Fetch all rows via API (paginated)
    all_rows: list[dict] = []
    after = None
    while True:
        path = f"/cms/v3/hubdb/tables/{TABLE_ID}/rows?limit=1000"
        if after:
            path += f"&after={after}"
        data = req("GET", path, token)
        all_rows.extend(data.get("results", []))
        paging = data.get("paging", {})
        nxt = paging.get("next", {}).get("after")
        if not nxt:
            break
        after = nxt

    print(f"Fetched {len(all_rows)} rows from HubDB.")

    # We only want to update rows that are NOT already categorized OR are v1 rows
    # (priority 1-200; v2 entries are 200+ and already have categories).
    to_update = []
    for row in all_rows:
        row_id = row.get("id")
        v = row.get("values", {})
        kw = v.get("keywords") or ""
        cur_cat = v.get("category") or ""
        priority = v.get("priority") or 0
        # Skip v2 rows (already categorized)
        if priority and int(priority) >= 200:
            continue
        # Only update if no category set
        if cur_cat:
            continue
        new_cat = categorize(kw)
        to_update.append((row_id, kw, new_cat))

    print(f"Need to categorize {len(to_update)} v1 rows.")

    # Update each via PATCH /draft path
    updated = 0
    for row_id, kw, new_cat in to_update:
        body = {"values": {"category": new_cat}}
        try:
            req("PATCH", f"/cms/v3/hubdb/tables/{TABLE_ID}/rows/{row_id}/draft", token, body)
            updated += 1
            if updated % 30 == 0:
                print(f"  updated {updated}/{len(to_update)}…")
        except Exception as ex:
            sys.stderr.write(f"  FAILED row {row_id}: {ex}\n")
    print(f"Updated {updated}/{len(to_update)} rows.")

    # Publish
    print("Publishing draft live…")
    req("POST", f"/cms/v3/hubdb/tables/{TABLE_ID}/draft/push-live", token, {})
    print("Published.")


if __name__ == "__main__":
    main()
