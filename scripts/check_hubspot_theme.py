"""Check local theme JSON structure and standalone JavaScript syntax."""
import json
from pathlib import Path
import subprocess

THEME = Path(__file__).resolve().parents[1] / "theme" / "_hcfm-brand-portal"


def check_fields(fields, source):
    if not isinstance(fields, list):
        raise ValueError(f"{source}: fields must be an array")
    names = set()
    for field in fields:
        if not isinstance(field, dict) or not field.get("name") or not field.get("type"):
            raise ValueError(f"{source}: each field needs a name and type")
        if field["name"] in names:
            raise ValueError(f"{source}: duplicate field name {field['name']}")
        names.add(field["name"])
        if field["type"] == "group":
            check_fields(field.get("children"), source)


for relative in ("theme.json", "fields.json", "templates/hcfm-brand-portal.html"):
    if not (THEME / relative).is_file():
        raise ValueError(f"Theme is missing required file: {relative}")
if not (THEME / "modules").is_dir():
    raise ValueError("Theme modules directory is missing")

json_paths = sorted(THEME.rglob("*.json"))
for path in json_paths:
    data = json.loads(path.read_text(encoding="utf-8"))
    if path.name == "fields.json":
        check_fields(data, path.relative_to(THEME))
    elif not isinstance(data, dict):
        raise ValueError(f"{path.relative_to(THEME)}: configuration must be an object")

modules = sorted((THEME / "modules").glob("*.module"))
if not modules:
    raise ValueError("Theme must contain at least one module")
for module in modules:
    for filename in ("fields.json", "meta.json", "module.html"):
        if not (module / filename).is_file():
            raise ValueError(f"{module.name}: missing {filename}")

scripts = sorted(THEME.rglob("*.js"))
for path in scripts:
    subprocess.run(["node", "--check", str(path)], check=True)

print(f"Passed {len(json_paths)} JSON files, {len(modules)} module file sets, "
      f"and {len(scripts)} standalone JavaScript syntax check(s).")
print("HubL rendering and HubSpot platform validation require an approved preview.")
