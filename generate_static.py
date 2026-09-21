#!/usr/bin/env python3
"""
HCFM Brand Portal - Static HTML Generator
==========================================
Resolves all HubL module tags in the HubSpot template to plain HTML.
Output goes to wordpress-handoff/index.html + assets/.
Run: python3 generate_static.py
"""
import re, json, os, shutil

BASE     = os.path.dirname(os.path.abspath(__file__))
TMPL     = os.path.join(BASE, "theme/_hcfm-brand-portal/templates/hcfm-brand-portal.html")
MOD_DIR  = os.path.join(BASE, "theme/_hcfm-brand-portal/modules")
CSS_SRC  = os.path.join(BASE, "theme/_hcfm-brand-portal/css/hcfm-styles.css")
JS_SRC   = os.path.join(BASE, "theme/_hcfm-brand-portal/js/hcfm-scripts.js")
OUT_DIR  = os.path.join(BASE, "wordpress-handoff")
OUT_HTML = os.path.join(OUT_DIR, "index.html")
OUT_CSS  = os.path.join(OUT_DIR, "assets/hcfm-styles.css")
OUT_JS   = os.path.join(OUT_DIR, "assets/hcfm-scripts.js")


# ─────────────────────────────────────────────────── field value parser ──

def _parse_string(s, pos):
    """Parse a \"...\"-quoted string starting at pos (opening quote already consumed)."""
    buf = []
    while pos < len(s):
        c = s[pos]
        if c == '\\' and pos + 1 < len(s) and s[pos + 1] == '"':
            buf.append('"'); pos += 2
        elif c == '"':
            return ''.join(buf), pos + 1
        else:
            buf.append(c); pos += 1
    return ''.join(buf), pos


def _parse_json_value(s, pos):
    """Parse a [array] or {object} starting at pos. Returns (parsed_value, next_pos)."""
    start, depth, in_str = pos, 0, False
    while pos < len(s):
        c = s[pos]
        if in_str:
            if c == '\\' and pos + 1 < len(s):
                pos += 2
            elif c == '"':
                in_str = False; pos += 1
            else:
                pos += 1
        else:
            if c == '"':
                in_str = True; pos += 1
            elif c in '[{':
                depth += 1; pos += 1
            elif c in ']}':
                depth -= 1; pos += 1
                if depth == 0:
                    break
            else:
                pos += 1
    raw = s[start:pos]
    try:
        return json.loads(raw), pos
    except json.JSONDecodeError:
        return raw, pos


def parse_fields(params_str):
    """Extract all field=value pairs from a module tag parameter block."""
    fields = {}
    i = 0
    n = len(params_str)
    while i < n:
        # Skip whitespace and commas
        while i < n and params_str[i] in ' \t\n\r,':
            i += 1
        if i >= n:
            break
        # Match field name followed by =
        m = re.match(r'(\w+)\s*=', params_str[i:])
        if not m:
            i += 1
            continue
        name = m.group(1)
        i += m.end()
        # Skip whitespace
        while i < n and params_str[i] in ' \t\n\r':
            i += 1
        if i >= n:
            break
        c = params_str[i]
        if c == '"':
            val, i = _parse_string(params_str, i + 1)
        elif c in '[{':
            val, i = _parse_json_value(params_str, i)
        else:
            # Unknown: skip to next comma or end
            j = params_str.find(',', i)
            val = params_str[i:j].strip() if j != -1 else params_str[i:].strip()
            i = j + 1 if j != -1 else n
        fields[name] = val
    return fields


# ─────────────────────────────────────────────────── value resolver ──

def _nested_get(val, path_parts):
    """Walk val by path_parts. val is a dict (or anything). Returns '' on miss."""
    for p in path_parts:
        if isinstance(val, dict):
            val = val.get(p, '')
        else:
            return ''
    return '' if val is None else val


def _resolve(expr, mf, lv):
    """
    Resolve a HubL expression to a Python value.
    Strips Jinja2 filters (|escape, |safe, etc.).
    Handles: module.f, module.f.g, local_var, local_var.f, local_var.f.g
    """
    base = re.split(r'\|', expr)[0].strip()
    parts = base.split('.')
    if parts[0] == 'module':
        return _nested_get(mf, parts[1:])
    if parts[0] in lv:
        start = lv[parts[0]]
        return _nested_get(start, parts[1:]) if parts[1:] else start
    return ''


def _eval_cond(cond, mf, lv):
    """Evaluate a HubL condition to bool."""
    cond = cond.strip()
    m = re.match(r'([\w.]+)\s*==\s*"([^"]*)"', cond)
    if m:
        return str(_resolve(m.group(1), mf, lv)) == m.group(2)
    val = _resolve(cond, mf, lv)
    return val if isinstance(val, bool) else bool(val)


# ─────────────────────────────────────────────────── HubL renderer ──

def render_hubl(text, mf, lv):
    """
    Render a HubL template fragment.
    Handles: {# comments #}, {% set %}, {% if/elif/else/endif %},
             {% for item in ... %}{% endfor %}, {{ expr }}.
    """
    text = re.sub(r'\{#[\s\S]*?#\}', '', text)
    out = []
    i = 0
    n = len(text)

    while i < n:

        if text[i:i+2] == '{{':
            j = text.find('}}', i + 2)
            if j == -1:
                out.append(text[i:]); break
            val = _resolve(text[i + 2:j].strip(), mf, lv)
            out.append(str(val) if val is not None else '')
            i = j + 2

        elif text[i:i+2] == '{%':
            j = text.find('%}', i + 2)
            if j == -1:
                out.append(text[i:]); break
            tag     = text[i + 2:j].strip()
            tag_end = j + 2

            if tag.startswith('set '):
                m = re.match(r'set\s+(\w+)\s*=\s*([\s\S]*)', tag)
                if m:
                    eq = re.match(r'([\w.]+)\s*==\s*"([^"]*)"', m.group(2).strip())
                    if eq:
                        lv = {**lv, m.group(1): str(_resolve(eq.group(1), mf, lv)) == eq.group(2)}
                    else:
                        lv = {**lv, m.group(1): _resolve(m.group(2).strip(), mf, lv)}
                i = tag_end

            elif tag.startswith('if '):
                rendered, i = _if_block(text, i, mf, lv)
                out.append(rendered)

            elif tag.startswith('for '):
                rendered, i = _for_block(text, i, mf, lv)
                out.append(rendered)

            elif tag in ('else', 'endif', 'endfor') or tag.startswith('elif '):
                i = tag_end  # orphan control — skip

            else:
                i = tag_end

        else:
            out.append(text[i]); i += 1

    return ''.join(out)


def _if_block(text, start, mf, lv):
    """Parse and render an if/elif/else/endif block. Returns (html, end_pos)."""
    m = re.match(r'\{%\s*if\s+([\s\S]*?)\s*%\}', text[start:])
    if not m:
        return '', start + 2

    cond_str = m.group(1).strip()
    i        = start + m.end()
    body_s   = i
    depth    = 1
    segments = []   # list of (cond_str_or_None, body_text)

    while i < len(text):
        if text[i:i+2] != '{%':
            i += 1; continue
        j   = text.find('%}', i + 2)
        if j == -1: break
        tag     = text[i + 2:j].strip()
        tag_end = j + 2

        if re.match(r'if\b', tag):
            depth += 1; i = tag_end

        elif depth == 1 and re.match(r'elif\b', tag):
            segments.append((cond_str, text[body_s:i]))
            m2       = re.match(r'elif\s+([\s\S]*)', tag)
            cond_str = m2.group(1).strip() if m2 else ''
            i        = tag_end; body_s = i

        elif depth == 1 and re.match(r'else\b', tag):
            segments.append((cond_str, text[body_s:i]))
            cond_str = None
            i        = tag_end; body_s = i

        elif re.match(r'endif\b', tag):
            if depth == 1:
                segments.append((cond_str, text[body_s:i]))
                i = tag_end; break
            else:
                depth -= 1; i = tag_end

        else:
            i = tag_end

    for cond, body in segments:
        if cond is None:
            return render_hubl(body, mf, lv), i
        if _eval_cond(cond, mf, lv):
            return render_hubl(body, mf, lv), i

    return '', i


def _for_block(text, start, mf, lv):
    """Parse and render a for/endfor block. Returns (html, end_pos)."""
    m = re.match(r'\{%\s*for\s+(\w+)\s+in\s+([\w.]+)\s*%\}', text[start:])
    if not m:
        return '', start + 2

    item_var  = m.group(1)
    iter_expr = m.group(2).strip()
    i         = start + m.end()
    body_s    = i
    depth     = 1

    while i < len(text):
        if text[i:i+2] != '{%':
            i += 1; continue
        j   = text.find('%}', i + 2)
        if j == -1: break
        tag     = text[i + 2:j].strip()
        tag_end = j + 2

        if re.match(r'for\b', tag):
            depth += 1; i = tag_end
        elif re.match(r'endfor\b', tag):
            if depth == 1:
                body = text[body_s:i]; i = tag_end; break
            else:
                depth -= 1; i = tag_end
        else:
            i = tag_end
    else:
        body = text[body_s:i]

    items = _resolve(iter_expr, mf, lv)
    if not isinstance(items, list) or not items:
        return '', i

    return ''.join(render_hubl(body, mf, {**lv, item_var: item}) for item in items), i


# ─────────────────────────────────────────────────── module rendering ──

def _load_module_html(tag_path):
    name = os.path.basename(tag_path.rstrip('/'))
    path = os.path.join(MOD_DIR, name + '.module', 'module.html')
    if not os.path.exists(path):
        return f'<!-- MODULE NOT FOUND: {name} -->'
    with open(path, encoding='utf-8') as f:
        return f.read()


def render_module(tag_text):
    """Render a complete {% module ... %} tag to plain HTML."""
    m = re.match(r'\{%\s*module\s+"([^"]+)"\s+path="([^"]+)"', tag_text)
    if not m:
        return '<!-- UNPARSEABLE MODULE TAG -->'
    label, path = m.group(1), m.group(2)
    params_raw  = tag_text[m.end():]
    if params_raw.endswith('%}'):
        params_raw = params_raw[:-2]
    fields   = parse_fields(params_raw)
    template = _load_module_html(path)
    rendered = render_hubl(template, fields, {})
    return f'<!-- module:{label} -->\n{rendered.strip()}'


# ─────────────────────────────────────────────────── template processing ──

MODULE_RE = re.compile(r'\{%\s*module\s+"[^"]+"\s+path="[^"]+"[\s\S]*?%\}', re.DOTALL)


def process_template():
    with open(TMPL, encoding='utf-8') as f:
        src = f.read()

    # HubSpot template metadata comment at top
    src = re.sub(r'^<!--\s*templateType:[\s\S]*?-->\s*\n?', '', src)

    # CSS require → direct link
    src = src.replace(
        '{{ require_css(get_asset_url("../css/hcfm-styles.css")) }}',
        '<link rel="stylesheet" href="./assets/hcfm-styles.css">'
    )

    # JS require → direct script tag
    src = src.replace(
        '{{ require_js(get_asset_url("../js/hcfm-scripts.js")) }}',
        '<script src="./assets/hcfm-scripts.js"></script>'
    )

    # Standard HubSpot includes (page-level scripts/meta injected by CMS)
    src = src.replace('{{ standard_header_includes }}', '')
    src = src.replace('{{ standard_footer_includes }}', '')

    # FAQ HubDB block → placeholder (content lives in HubDB table 282697015)
    src = re.sub(
        r'\{%\s*set\s+faq_rows\s*=[\s\S]*?\{%\s*endfor\s*%\}',
        '<!-- FAQ items: pull from WordPress CPT or ACF repeater (HubDB table 282697015) -->',
        src
    )

    # Chatbot KB HubDB block → placeholder
    src = re.sub(
        r'<!-- HCFM Chatbot KB[\s\S]*?</div>',
        '<!-- Chatbot KB: populate from WordPress (HubDB table 282697845) -->\n'
        '<div id="hcfm-bot-kb-host" hidden></div>',
        src
    )

    # Ministries HubDB block → placeholder
    src = re.sub(
        r'<!-- HCFM Ministries[\s\S]*?</div>',
        '<!-- Ministries grid: populate from WordPress (HubDB table 282663491) -->\n'
        '<div id="hcfm-ministries-host" hidden></div>',
        src
    )

    # Render all module tags
    src = MODULE_RE.sub(lambda m: render_module(m.group(0)), src)

    # Clean up remaining HubL (comments, stray tags, stray variables)
    src = re.sub(r'\{#[\s\S]*?#\}', '', src)
    src = re.sub(r'\{%[\s\S]*?%\}',  '', src)
    src = re.sub(r'\{\{[\s\S]*?\}\}', '', src)

    return src


# ─────────────────────────────────────────────────── main ──

def main():
    os.makedirs(os.path.join(OUT_DIR, 'assets'), exist_ok=True)

    print('Generating static HTML...')
    html = process_template()

    with open(OUT_HTML, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'  {OUT_HTML}')

    shutil.copy(CSS_SRC, OUT_CSS)
    print(f'  {OUT_CSS}')

    shutil.copy(JS_SRC, OUT_JS)
    print(f'  {OUT_JS}')

    modules_rendered = len(re.findall(r'<!-- module:', html))
    leftover_hubl    = len(re.findall(r'\{[{%]', html))
    print(f'\n  Modules rendered : {modules_rendered}')
    print(f'  Leftover HubL    : {leftover_hubl}  (0 = clean)')
    if leftover_hubl:
        samples = re.findall(r'.{0,40}\{[{%].{0,40}', html)[:5]
        for s in samples:
            print(f'    {s.strip()}')


if __name__ == '__main__':
    main()
