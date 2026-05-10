#!/usr/bin/env python3
"""
Push the v2 expansion (102 new rows) into the HubDB hcfm_chatbot_kb table,
then categorize the existing 169 v1 rows, then publish the table draft.

Auth: reads accessToken from hubspot.config.yml (refreshed via hs CLI).
"""
from __future__ import annotations
import csv, json, os, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

REPO = Path(__file__).parent.parent.resolve()
CONFIG = REPO / "hubspot.config.yml"
NEW_CSV = REPO / "build" / "chatbot_kb_v2_new_rows.csv"
V1_CAT_CSV = REPO / "build" / "chatbot_kb_v2_categories.csv"

TABLE_ID = "282697845"  # hcfm_chatbot_kb
BASE = "https://api.hubapi.com"


def read_token() -> str:
    """Extract accessToken from hubspot.config.yml."""
    text = CONFIG.read_text()
    m = re.search(r"accessToken:\s*>-\s*\n\s*(\S+)", text)
    if not m:
        # fallback: single-line key
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
        sys.stderr.write(f"HTTP {e.code} {method} {url}\n{body_txt}\n")
        raise


def main() -> None:
    if not NEW_CSV.exists() or not V1_CAT_CSV.exists():
        sys.stderr.write(
            f"Build artifacts missing. Run scripts/chatbot_kb_v2.py first.\n"
        )
        sys.exit(1)

    token = read_token()
    print(f"Using token (first 30): {token[:30]}…\n")

    # --- Step 1: refresh token via a known-good API call (CLI doesn't need this) ---
    # We're going to use the access token directly; if it's expired, the calls
    # below will 401 and we surface the error to the user.

    # --- Step 2: insert v2 new rows ---
    new_rows = list(csv.DictReader(NEW_CSV.open()))
    print(f"Inserting {len(new_rows)} new rows into HubDB draft …")
    inserted = 0
    for row in new_rows:
        body = {
            "values": {
                "keywords": row["keywords"],
                "answer": row["answer"],
                "category": row["category"],
                "priority": int(row["priority"]),
            }
        }
        try:
            req("POST", f"/cms/v3/hubdb/tables/{TABLE_ID}/rows", token, body)
            inserted += 1
            if inserted % 10 == 0:
                print(f"  inserted {inserted}/{len(new_rows)}…")
        except Exception as ex:
            sys.stderr.write(f"  FAILED on row: {row['keywords'][:60]} — {ex}\n")
    print(f"  done. Inserted {inserted}/{len(new_rows)}.\n")

    # --- Step 3: update categories on existing v1 rows ---
    v1_cats = list(csv.DictReader(V1_CAT_CSV.open()))
    print(f"Updating categories on {len(v1_cats)} existing v1 rows …")
    updated = 0
    for row in v1_cats:
        row_id = row["row_id"]
        new_cat = row["new_category"]
        body = {"values": {"category": new_cat}}
        try:
            req("PATCH", f"/cms/v3/hubdb/tables/{TABLE_ID}/rows/{row_id}/draft", token, body)
            updated += 1
            if updated % 30 == 0:
                print(f"  updated {updated}/{len(v1_cats)}…")
        except Exception as ex:
            sys.stderr.write(f"  FAILED on row {row_id}: {ex}\n")
    print(f"  done. Updated {updated}/{len(v1_cats)}.\n")

    # --- Step 4: publish the table draft ---
    print("Publishing the table draft live …")
    req("POST", f"/cms/v3/hubdb/tables/{TABLE_ID}/draft/push-live", token, {})
    print("  done.\n")

    print(f"=== DONE ===")
    print(f"  v2 new rows inserted: {inserted}")
    print(f"  v1 rows recategorized: {updated}")
    print(f"  Table published live.")


if __name__ == "__main__":
    main()
