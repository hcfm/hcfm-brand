#!/usr/bin/env python3
"""
HCFM email signature banner operations.

Three commands, all runnable locally.

NOT wired into GitHub Actions. The banner-health and build-go-pages
workflows each carry their own inline copy of this logic as a heredoc.
That duplication is the bug: a fix made here does not reach the workflow
that actually runs daily. Folding the workflows onto this file is the job.

    python3 scripts/banner_ops.py check      # health + staleness gate
    python3 scripts/banner_ops.py build-go   # regenerate /go/<key>/ redirect pages
    python3 scripts/banner_ops.py selftest   # prove the gate fires on bad input

WHY THIS EXISTS
Every HCFM staff signature loads one image from this repository. If that image
is missing, malformed, the wrong size, or advertising an event that already
happened, every person in the organisation is sending a broken or misleading
email and nothing tells anyone. In August 2026 the second case ran for nine
days. `check` is the alarm.

Standard library only, so the workflow needs no dependency install and cannot
break because of an upstream package.
"""
from __future__ import annotations

import datetime as _dt
import json
import os
import pathlib
import struct
import sys
import urllib.error
import urllib.parse
import urllib.request

REPO = pathlib.Path(__file__).resolve().parent.parent
BANNERS = REPO / "email-banners"
MANIFEST = BANNERS / "campaigns.yml"
GO_DIR = REPO / "go"

# The live host every installed signature points at. When IT creates the CNAME
# for banners.hcfm.org and the custom domain is set on Pages, change this one
# line, re-run build-go, and regenerate the signature templates.
SITE_BASE = "https://hcfm.github.io/hcfm-brand"

# Enforced image contract. These are the numbers Banner Studio validates
# against too; if you change one, change it in banner-studio/api/upload.js.
REQUIRED_WIDTH = 600
MIN_HEIGHT = 100
MAX_HEIGHT = 200
MAX_BYTES = 250 * 1024
SOFT_MAX_BYTES = 100 * 1024

UTM_SOURCE = "email-signature"
UTM_MEDIUM = "email"


# --------------------------------------------------------------------------
# Tiny YAML reader.
#
# campaigns.yml is deliberately a flat two-level mapping of scalars so that it
# can be parsed without PyYAML. No dependency means the health gate cannot fail
# because of an install step. If the file ever needs lists or nesting, install
# PyYAML in the workflow and delete this function.
# --------------------------------------------------------------------------
def read_manifest(path: pathlib.Path = MANIFEST) -> dict:
    data: dict[str, dict] = {}
    current: str | None = None
    for lineno, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.split("#", 1)[0].rstrip() if not raw.strip().startswith("#") else ""
        if not line.strip():
            continue
        if not line.startswith(" ") and line.rstrip().endswith(":"):
            current = line.rstrip()[:-1].strip()
            data[current] = {}
            continue
        if current is None:
            raise ValueError(f"{path.name}:{lineno}: value outside any ministry block")
        if ":" not in line:
            raise ValueError(f"{path.name}:{lineno}: expected 'key: value'")
        key, _, value = line.strip().partition(":")
        data[current][key.strip()] = value.strip().strip('"').strip("'")
    return data


def png_dimensions(blob: bytes) -> tuple[int, int]:
    """Width and height straight out of the IHDR chunk. Raises on a non-PNG."""
    if len(blob) < 24 or blob[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG (signature bytes do not match)")
    if blob[12:16] != b"IHDR":
        raise ValueError("malformed PNG (first chunk is not IHDR)")
    width, height = struct.unpack(">II", blob[16:24])
    return width, height


def _fetch(url: str, timeout: int = 30) -> tuple[int, bytes]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "hcfm-banner-health", "Cache-Control": "no-cache"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, b""


# --------------------------------------------------------------------------
# check
# --------------------------------------------------------------------------
def _check_one_image(key: str, blob: bytes, problems: list[str], warnings: list[str]) -> None:
    try:
        width, height = png_dimensions(blob)
    except ValueError as exc:
        problems.append(f"{key}: {exc}")
        return
    if width != REQUIRED_WIDTH:
        problems.append(f"{key}: width is {width}px, must be exactly {REQUIRED_WIDTH}px")
    if not (MIN_HEIGHT <= height <= MAX_HEIGHT):
        problems.append(f"{key}: height is {height}px, must be {MIN_HEIGHT}-{MAX_HEIGHT}px")
    if len(blob) > MAX_BYTES:
        problems.append(f"{key}: {len(blob) // 1024} KB exceeds the {MAX_BYTES // 1024} KB limit")
    elif len(blob) > SOFT_MAX_BYTES:
        warnings.append(f"{key}: {len(blob) // 1024} KB is over the {SOFT_MAX_BYTES // 1024} KB target")


def check(live: bool = True) -> int:
    manifest = read_manifest()
    today = _dt.date.today()
    problems: list[str] = []
    warnings: list[str] = []
    lines: list[str] = []

    for key, meta in manifest.items():
        label = meta.get("label", key)
        local = BANNERS / key / "banner.png"

        if not local.exists():
            problems.append(f"{key}: email-banners/{key}/banner.png is missing from the repository")
        else:
            _check_one_image(key, local.read_bytes(), problems, warnings)

        # Staleness. This is the check that would have caught the nine-day
        # Global Rosary overrun, so it is a failure and not a warning.
        raw_end = meta.get("end_date", "")
        try:
            end = _dt.date.fromisoformat(raw_end)
            if today > end:
                problems.append(
                    f"{key}: campaign '{meta.get('campaign', '?')}' ended {end.isoformat()} "
                    f"({(today - end).days} days ago). The banner is stale on every "
                    f"{label} signature until it is replaced."
                )
        except ValueError:
            problems.append(f"{key}: end_date '{raw_end}' is not a valid YYYY-MM-DD date")

        dest = meta.get("destination", "")
        if not dest.startswith("https://"):
            problems.append(f"{key}: destination must be https, got '{dest}'")

        if live:
            url = f"{SITE_BASE}/email-banners/{key}/banner.png"
            status, blob = _fetch(url)
            if status != 200:
                problems.append(f"{key}: live URL returned HTTP {status} ({url})")
            else:
                _check_one_image(f"{key} (live)", blob, problems, warnings)
                lines.append(f"  {label:46} live OK  {len(blob) // 1024:>4} KB")

            go_url = f"{SITE_BASE}/go/{key}/"
            go_status, go_body = _fetch(go_url)
            if go_status != 200:
                problems.append(f"{key}: redirect page returned HTTP {go_status} ({go_url})")
            elif dest and dest.encode() not in go_body:
                problems.append(
                    f"{key}: redirect page does not point at the destination in campaigns.yml. "
                    f"Run `python3 scripts/banner_ops.py build-go` and commit."
                )

            # The click destination itself. A banner that renders perfectly and
            # lands on a dead page is still a broken banner, and this is the
            # half nobody thinks to check.
            dest_status, _ = _fetch(dest, timeout=20)
            if dest_status >= 400:
                problems.append(f"{key}: click destination returned HTTP {dest_status} ({dest})")

    print("HCFM banner health check")
    print(f"  date: {today.isoformat()}   ministries: {len(manifest)}   live checks: {'on' if live else 'off'}")
    for line in lines:
        print(line)
    for warning in warnings:
        print(f"  WARNING  {warning}")
    if problems:
        print("\nFAILED")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print("\nPASS  every banner is present, correctly sized, current, and reachable.")
    return 0


# --------------------------------------------------------------------------
# build-go
# --------------------------------------------------------------------------
GO_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{label}</title>
<link rel="canonical" href="{destination}">
<meta http-equiv="refresh" content="0; url={tagged}">
<style>
  :root {{ color-scheme: light; }}
  body {{ margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0047BB; color:#fff; text-align:center; padding:24px;
         font-family:'Whitney','Helvetica Neue',Helvetica,Arial,sans-serif; }}
  .card {{ max-width:520px; }}
  .msg {{ font-family:Georgia,'Times New Roman',serif; font-style:italic; font-size:22px;
         line-height:1.4; margin:0 0 18px; }}
  .rule {{ width:68px; height:2px; background:#FFB500; margin:0 auto 18px; }}
  .go {{ display:inline-block; background:#FFB500; color:#00307f; font-weight:700;
        text-decoration:none; padding:12px 22px; border-radius:4px; letter-spacing:.04em; }}
  .small {{ margin-top:16px; font-size:13px; color:#cfe0ff; }}
  .small a {{ color:#fff; }}
</style>
</head>
<body>
  <div class="card">
    <p class="msg">A World at Prayer is a World at Peace<sup>&reg;</sup></p>
    <div class="rule"></div>
    <p>Taking you to {label}.</p>
    <p><a class="go" href="{tagged}">Continue to {display_host}</a></p>
    <p class="small">If you are not redirected automatically,
      <a href="{tagged}">click here</a>.</p>
  </div>
<script>location.replace({json_target});</script>
</body>
</html>
"""


def _tag(destination: str, campaign: str, key: str) -> str:
    parts = urllib.parse.urlsplit(destination)
    query = dict(urllib.parse.parse_qsl(parts.query, keep_blank_values=True))
    query.update(
        {
            "utm_source": UTM_SOURCE,
            "utm_medium": UTM_MEDIUM,
            "utm_campaign": campaign,
            "utm_content": key,
        }
    )
    return urllib.parse.urlunsplit(
        (parts.scheme, parts.netloc, parts.path or "/", urllib.parse.urlencode(query), parts.fragment)
    )


def build_go() -> int:
    manifest = read_manifest()
    GO_DIR.mkdir(exist_ok=True)
    written = []
    for key, meta in manifest.items():
        destination = meta["destination"]
        tagged = _tag(destination, meta.get("campaign", "unspecified"), key)
        html = GO_TEMPLATE.format(
            label=meta.get("label", key),
            destination=destination,
            tagged=tagged.replace("&", "&amp;"),
            display_host=urllib.parse.urlsplit(destination).netloc.replace("www.", ""),
            json_target=json.dumps(tagged),
        )
        out_dir = GO_DIR / key
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "index.html").write_text(html, encoding="utf-8")
        written.append(f"  go/{key}/index.html -> {tagged}")

    readme = GO_DIR / "README.md"
    readme.write_text(
        "# go/\n\n"
        "Redirect pages for the campaign banner in every HCFM email signature.\n\n"
        "Every installed signature links its banner to `"
        f"{SITE_BASE}/go/<ministry>/`, never straight at a campaign page. That means\n"
        "Marketing can change where a banner click lands by editing one line in\n"
        "`email-banners/campaigns.yml`, with no signature re-install anywhere in the\n"
        "organisation.\n\n"
        "These files are generated. Do not edit them by hand: edit `campaigns.yml`\n"
        "and the build-go-pages workflow rewrites this folder on push.\n\n"
        "Each page carries UTM tags (`utm_source=email-signature`, `utm_medium=email`,\n"
        "`utm_campaign=<slug>`, `utm_content=<ministry>`) so banner clicks are visible\n"
        "in GA4 and can be reported alongside everything else in the weekly analytics\n"
        "system. A meta refresh, a JavaScript replace, and a visible button are all\n"
        "present, because secure email gateways strip some of those and never all.\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(written)} redirect pages:")
    for line in written:
        print(line)
    return 0


# --------------------------------------------------------------------------
# selftest
#
# A gate nobody has watched fail is a gate nobody should trust. This proves
# each rule fires on the exact fault it was written for, before `check` is
# allowed to vouch for the live site.
# --------------------------------------------------------------------------
def selftest() -> int:
    failures: list[str] = []

    def expect(condition: bool, description: str) -> None:
        if not condition:
            failures.append(description)

    good = (
        b"\x89PNG\r\n\x1a\n" + struct.pack(">I", 13) + b"IHDR" + struct.pack(">II", 600, 150)
    )
    expect(png_dimensions(good) == (600, 150), "png_dimensions should read 600x150 from a valid header")

    try:
        png_dimensions(b"GIF89a" + b"\x00" * 40)
        failures.append("png_dimensions should reject a GIF")
    except ValueError:
        pass

    problems: list[str] = []
    warnings: list[str] = []
    _check_one_image(
        "wide",
        b"\x89PNG\r\n\x1a\n" + struct.pack(">I", 13) + b"IHDR" + struct.pack(">II", 800, 150),
        problems,
        warnings,
    )
    expect(any("width is 800px" in p for p in problems), "an 800px-wide banner must fail")

    problems.clear()
    _check_one_image(
        "tall",
        b"\x89PNG\r\n\x1a\n" + struct.pack(">I", 13) + b"IHDR" + struct.pack(">II", 600, 400),
        problems,
        warnings,
    )
    expect(any("height is 400px" in p for p in problems), "a 400px-tall banner must fail")

    manifest = read_manifest()
    expect(len(manifest) == 6, f"campaigns.yml should describe 6 ministries, found {len(manifest)}")
    for key, meta in manifest.items():
        for field in ("label", "campaign", "destination", "end_date"):
            expect(field in meta, f"{key} is missing '{field}' in campaigns.yml")
        expect(
            (BANNERS / key / "banner.png").exists(),
            f"{key} has no banner.png in the repository",
        )

    tagged = _tag("https://www.hcfm.org/", "rosary-month", "parent")
    expect("utm_source=email-signature" in tagged, "UTM source must be applied to the destination")
    expect("utm_campaign=rosary-month" in tagged, "UTM campaign must come from campaigns.yml")
    expect(
        _tag("https://www.hcfm.org/?x=1", "c", "k").count("?") == 1,
        "tagging a destination that already has a query string must not add a second '?'",
    )

    if failures:
        print("SELFTEST FAILED")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print("SELFTEST PASS  every rule fires on the fault it was written for.")
    return 0


def main() -> int:
    command = sys.argv[1] if len(sys.argv) > 1 else "check"
    if command == "check":
        return check(live="--no-live" not in sys.argv)
    if command == "build-go":
        return build_go()
    if command == "selftest":
        return selftest()
    print(__doc__)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
