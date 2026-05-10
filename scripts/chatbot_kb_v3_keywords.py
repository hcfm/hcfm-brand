#!/usr/bin/env python3
"""
Expand the v3 deep-rewrite rows' `keywords` field to include natural user
phrasings ("muted gold to yellow gold", "why change gold", etc.) so the
JS matcher actually routes those queries to the deep answer instead of
to thinner v1 usage entries.

Fetches existing rows, finds the v3 rewritten ones by match_keywords,
PATCHes their `keywords` field with an expanded keyword set, then publishes.

Run after scripts/chatbot_kb_v3_push.py (which only patches the `answer`
field). This step patches the `keywords` field on the same rows.
"""
from __future__ import annotations
import json, re, sys, urllib.request, urllib.error
from pathlib import Path

REPO = Path(__file__).parent.parent.resolve()
CONFIG = REPO / "hubspot.config.yml"
TABLE_ID = "282697845"
BASE = "https://api.hubapi.com"

# Per-rewrite: the v3 match_keywords (used to find the row), and the
# expanded keyword set we want to PUT on that row's `keywords` column.
EXPANSIONS = [
    {
        "match": "why yellow gold primary, why elevated yellow gold, gold change 2026",
        "keywords": (
            "why yellow gold primary, why elevated yellow gold, gold change 2026, "
            "why did we move from muted gold to yellow gold, why change gold, "
            "why move from muted gold, why switch to yellow gold, "
            "muted gold to yellow gold, yellow gold reason, why warmer gold, "
            "why gold change, yellow gold vs muted gold rationale, "
            "why yellow gold marketing"
        ),
    },
    {
        "match": "why 60-30-10, color hierarchy why, why one color leads",
        "keywords": (
            "why 60-30-10, color hierarchy why, why one color leads, "
            "60 30 10 rule, why color ratios, why color proportions, "
            "color balance rule, how much of each color"
        ),
    },
    {
        "match": "why dark, why black background, dark mode",
        "keywords": (
            "why dark, why black background, dark mode, why dark backgrounds, "
            "why use black background, dark mode design, dark background reason, "
            "why so much black, why hcfm uses black"
        ),
    },
    {
        "match": "why blue yellow, ikea best buy walmart, industry blue yellow",
        "keywords": (
            "why blue yellow, ikea best buy walmart, industry blue yellow, "
            "why blue and yellow, walmart yellow, blue yellow combination, "
            "why hcfm uses both blue and yellow, complementary colors brand, "
            "why blue plus yellow"
        ),
    },
    {
        "match": "why three fonts, why not one font",
        "keywords": (
            "why three fonts, why not one font, why so many fonts, "
            "why multiple fonts, why three typefaces, why whitney calluna playlist, "
            "font system reason"
        ),
    },
    {
        "match": "10 beads, ten beads, rosary beads, why ten",
        "keywords": (
            "10 beads, ten beads, rosary beads, why ten, why 10 beads, "
            "why ten shapes, what do the beads mean, symbol beads, "
            "mark beads, decade rosary"
        ),
    },
    {
        "match": "why playlist script rules, why strict colors script",
        "keywords": (
            "why playlist script rules, why strict colors script, "
            "why playlist script restrictions, why limit playlist script, "
            "why only three colors playlist, playlist script color rules why, "
            "decorative script rules why"
        ),
    },
    {
        "match": "why hcfm blue 0047bb, pantone 2728 reason",
        "keywords": (
            "why hcfm blue 0047bb, pantone 2728 reason, why this blue, "
            "why hcfm blue specifically, blue 0047bb meaning, "
            "pantone 2728c reason, why marian blue tradition"
        ),
    },
    {
        "match": "why blue mary, mary blue tradition, why marian blue",
        "keywords": (
            "why blue mary, mary blue tradition, why marian blue, why two blues, "
            "marian blue vs hcfm blue, why second blue, marian blue 00a9e0 reason"
        ),
    },
    {
        "match": "why simplified palette, 20 colors to 6",
        "keywords": (
            "why simplified palette, 20 colors to 6, why removed colors, "
            "why fewer colors, why cut palette, why simplified colors, "
            "old palette to new, why drop extended palette"
        ),
    },
    {
        "match": "why dark overlay opacity range, overlay 40 to 70",
        "keywords": (
            "why dark overlay opacity range, overlay 40 to 70, "
            "why overlay opacity, why dark overlay rule, "
            "photo overlay opacity reason, why 40 60 percent overlay"
        ),
    },
    {
        "match": "why thin border 3 4 pixels, border thickness rule",
        "keywords": (
            "why thin border 3 4 pixels, border thickness rule, "
            "why thin borders, why border 3-4px, why narrow borders, "
            "border weight reason"
        ),
    },
    {
        "match": "why real not stock, authentic photography",
        "keywords": (
            "why real not stock, authentic photography, why no stock photos, "
            "why no stock images, why real families only, "
            "why ban stock photography, authentic vs stock"
        ),
    },
    {
        "match": "why narrative voice, why stories not bullets",
        "keywords": (
            "why narrative voice, why stories not bullets, why storytelling, "
            "why narrative not lists, why we write narratively, "
            "why we avoid bullets, story versus bullet, voice narrative reason"
        ),
    },
    {
        "match": "why two voice registers, voice why two",
        "keywords": (
            "why two voice registers, voice why two, why two voices, "
            "why different voices, why faithful and vendor voices, "
            "why two ways of writing, voice registers reason"
        ),
    },
    {
        "match": "why digital first, mobile audience, digital channels",
        "keywords": (
            "why digital first, mobile audience, digital channels, "
            "why design for phones, why mobile first, why screens first, "
            "why not print first"
        ),
    },
    {
        "match": "why same brand globally, brand consistency vs culture, fragmentation",
        "keywords": (
            "why same brand globally, brand consistency vs culture, fragmentation, "
            "why one global brand, why not localize colors, "
            "why consistent across countries, why global brand consistency, "
            "why universal palette"
        ),
    },
    {
        "match": "why this brand page, purpose of brand portal",
        "keywords": (
            "why this brand page, purpose of brand portal, why brand portal, "
            "why hcfm.org/brand, why this site exists, why move from sharepoint, "
            "purpose of this page"
        ),
    },
    {
        "match": "why ab test, why test colors, why not just decide",
        "keywords": (
            "why ab test, why test colors, why not just decide, "
            "why ab test colors, why test before deciding, "
            "why measure brand changes, why data drives brand"
        ),
    },
]

STOP = {"the", "and", "with", "from"}


def read_token() -> str:
    text = CONFIG.read_text()
    m = re.search(r"accessToken:\s*>-\s*\n\s*(\S+)", text)
    if not m:
        m = re.search(r"accessToken:\s*(\S+)", text)
    return m.group(1).strip()


def req(method: str, path: str, token: str, body: dict | None = None) -> dict:
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(
        url, data=data, method=method,
        headers={"Authorization": f"Bearer {token}",
                 "Content-Type": "application/json",
                 "Accept": "application/json"},
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
    # Fetch all rows to find IDs by match_keywords substring
    rows = []
    after = None
    while True:
        path = f"/cms/v3/hubdb/tables/{TABLE_ID}/rows?limit=1000"
        if after:
            path += f"&after={after}"
        data = req("GET", path, token)
        rows.extend(data.get("results", []))
        nxt = data.get("paging", {}).get("next", {}).get("after")
        if not nxt:
            break
        after = nxt

    print(f"Fetched {len(rows)} rows.\n")

    updated = 0
    for exp in EXPANSIONS:
        match_kw = exp["match"]
        # Find row where keywords field == the original match string
        target = None
        for r in rows:
            kw = (r.get("values", {}).get("keywords") or "").strip()
            if kw == match_kw:
                target = r
                break
        if not target:
            sys.stderr.write(f"  NO MATCH for: {match_kw[:60]}\n")
            continue
        row_id = target.get("id")
        body = {"values": {"keywords": exp["keywords"]}}
        try:
            req("PATCH", f"/cms/v3/hubdb/tables/{TABLE_ID}/rows/{row_id}/draft", token, body)
            updated += 1
            print(f"  PATCH keywords row#{row_id}: +{len(exp['keywords']) - len(match_kw)} chars")
        except Exception as e:
            sys.stderr.write(f"  FAILED row#{row_id}: {e}\n")

    print(f"\nUpdated keywords on {updated} rows.")
    print("Publishing draft live…")
    req("POST", f"/cms/v3/hubdb/tables/{TABLE_ID}/draft/push-live", token, {})
    print("Published.")


if __name__ == "__main__":
    main()
