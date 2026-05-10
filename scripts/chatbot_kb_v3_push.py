#!/usr/bin/env python3
"""
Push v3 deep "why" rewrites into HubDB hcfm_chatbot_kb.

How it works:
1. Fetch all 271 existing rows via API (so we get IDs).
2. For each of the 19 v3 rewrites, find the best-matching existing row by
   keyword-token overlap against the rewrite's `match_keywords`.
3. Append a hidden <div class="chat-followups-data" data-followups="…"> to
   the answer HTML so the JS can render proactive "you might also want to
   know about…" pills WITHOUT requiring a new HubDB column.
4. PATCH the row's `answer` field with the rich new content.
5. Publish the draft.

Safety: dry-run mode by default; pass --apply to actually PATCH.
"""
from __future__ import annotations
import argparse, json, re, sys, urllib.request, urllib.error
from pathlib import Path

REPO = Path(__file__).parent.parent.resolve()
CONFIG = REPO / "hubspot.config.yml"
REWRITES_JSON = REPO / "build" / "chatbot_kb_v3_rewrites.json"
TABLE_ID = "282697845"
BASE = "https://api.hubapi.com"

STOP = {"why", "the", "and", "for", "are", "with", "what", "where", "from",
        "this", "that", "how", "not", "use", "our", "but", "all", "you",
        "your", "have", "has", "was", "one", "two", "into", "out", "of"}


def read_token() -> str:
    """Read short-lived accessToken (refreshed by CLI via `hs hubdb fetch` etc.)."""
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
        sys.stderr.write(f"HTTP {e.code} {method} {url}\n{body_txt[:600]}\n")
        raise


def tokenize(s: str) -> set[str]:
    s = (s or "").lower()
    toks = re.findall(r"[a-z0-9#]+", s)
    return {t for t in toks if t not in STOP and len(t) > 1}


def score(rewrite_keywords: str, row_keywords: str) -> float:
    """Higher is better. Considers token overlap + phrase substring bonus."""
    rw = tokenize(rewrite_keywords)
    rk = tokenize(row_keywords)
    if not rw or not rk:
        return 0.0
    overlap = len(rw & rk)
    # phrase bonus: if a comma-separated phrase from the rewrite appears in row
    bonus = 0.0
    for phrase in [p.strip().lower() for p in rewrite_keywords.split(",")]:
        if len(phrase) > 5 and phrase in (row_keywords or "").lower():
            bonus += 3.0
    return overlap + bonus


def embed_followups(answer: str, followups: str) -> str:
    """Append hidden div with followups so JS can render proactive pills."""
    if not followups:
        return answer
    return (
        answer.rstrip()
        + f'\n<div class="chat-followups-data" data-followups="{followups}" style="display:none"></div>'
    )


def fetch_all_rows(token: str) -> list[dict]:
    rows: list[dict] = []
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
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true",
                        help="Actually PATCH HubDB. Default is dry-run.")
    parser.add_argument("--min-score", type=float, default=2.0,
                        help="Minimum match score to apply a rewrite (default 2.0)")
    args = parser.parse_args()

    if not REWRITES_JSON.exists():
        sys.stderr.write(f"Missing {REWRITES_JSON}. Run scripts/chatbot_kb_v3.py first.\n")
        sys.exit(1)

    rewrites = json.loads(REWRITES_JSON.read_text())
    print(f"Loaded {len(rewrites)} v3 rewrites from {REWRITES_JSON.name}\n")

    token = read_token()
    print(f"Fetching rows from HubDB …")
    rows = fetch_all_rows(token)
    print(f"  fetched {len(rows)} rows\n")

    # For each rewrite, find the best-matching existing row
    plan = []
    used_ids: set[str] = set()
    for rw in rewrites:
        kw = rw["match_keywords"]
        ranked = sorted(
            ((score(kw, r.get("values", {}).get("keywords") or ""), r) for r in rows),
            key=lambda x: x[0], reverse=True
        )
        # Skip rows already claimed by an earlier rewrite (deduplication)
        chosen = None
        chosen_score = 0.0
        for s, r in ranked:
            rid = str(r.get("id"))
            if rid in used_ids:
                continue
            chosen = r
            chosen_score = s
            break
        if not chosen or chosen_score < args.min_score:
            plan.append({"rewrite": rw, "row": None, "score": chosen_score,
                         "status": "NO MATCH"})
            continue
        used_ids.add(str(chosen["id"]))
        plan.append({
            "rewrite": rw,
            "row": chosen,
            "score": chosen_score,
            "status": "MATCH",
        })

    # Print plan
    print(f"=== MATCH PLAN ===\n")
    width = 70
    for i, p in enumerate(plan, 1):
        rw_kw = p["rewrite"]["match_keywords"][:width-12]
        if p["status"] == "MATCH":
            row_kw = (p["row"].get("values", {}).get("keywords") or "")[:width-12]
            rid = p["row"].get("id")
            print(f"  {i:2d}. score={p['score']:.1f}  row#{rid}")
            print(f"      v3:  {rw_kw}")
            print(f"      row: {row_kw}\n")
        else:
            print(f"  {i:2d}. NO MATCH  ({p['rewrite']['match_keywords'][:60]})\n")

    matched = sum(1 for p in plan if p["status"] == "MATCH")
    print(f"\nPlan summary: {matched}/{len(plan)} rewrites would update existing rows.")
    unmatched = [p for p in plan if p["status"] != "MATCH"]
    if unmatched:
        print(f"  {len(unmatched)} rewrites have no high-confidence match — they will be")
        print(f"  INSERTED as new rows (with new keywords) instead.\n")

    if not args.apply:
        print(f"\n*** DRY RUN — no changes made. Pass --apply to PATCH HubDB. ***")
        return

    # APPLY
    print(f"\n=== APPLYING ===\n")
    updated = 0
    inserted = 0
    for p in plan:
        rw = p["rewrite"]
        rich_answer = embed_followups(rw["answer"], rw["followups"])
        if p["status"] == "MATCH":
            row_id = p["row"].get("id")
            body = {"values": {"answer": rich_answer}}
            try:
                req("PATCH", f"/cms/v3/hubdb/tables/{TABLE_ID}/rows/{row_id}/draft",
                    token, body)
                updated += 1
                print(f"  PATCH row#{row_id}  ({rw['match_keywords'][:55]})")
            except Exception as ex:
                sys.stderr.write(f"  FAILED row#{row_id}: {ex}\n")
        else:
            # Insert a new row with the v3 rewrite
            body = {
                "values": {
                    "keywords": rw["match_keywords"],
                    "answer": rich_answer,
                    "category": "philosophy",
                    "priority": 300,
                }
            }
            try:
                req("POST", f"/cms/v3/hubdb/tables/{TABLE_ID}/rows", token, body)
                inserted += 1
                print(f"  INSERT new  ({rw['match_keywords'][:55]})")
            except Exception as ex:
                sys.stderr.write(f"  FAILED insert: {ex}\n")

    print(f"\nUpdated {updated} rows; inserted {inserted} new rows.")

    # Publish
    print("\nPublishing draft live …")
    req("POST", f"/cms/v3/hubdb/tables/{TABLE_ID}/draft/push-live", token, {})
    print("Published.\n")
    print(f"=== DONE ===")


if __name__ == "__main__":
    main()
