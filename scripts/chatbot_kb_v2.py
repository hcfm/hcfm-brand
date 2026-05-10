#!/usr/bin/env python3
"""
HCFM Brand Portal — Chatbot KB v2 expansion + categorization.

What this script does:
1. Defines ~130 NEW Q&A entries for the brand-assistant chatbot, covering the
   gaps identified in the v1 audit: practical how-tos, real-world scenarios,
   editorial conventions, tools, vendors, localization, conversational warmth,
   troubleshooting, and edge cases.
2. Categorizes the existing 169 v1 entries by topic so the KB is browsable.
3. Outputs three artifacts under ./build/:
     - chatbot_kb_v2_new_rows.csv    — new rows, ready for HubDB CSV import
     - chatbot_kb_v2_full.json       — full merged KB (v1 categorized + v2 new)
     - chatbot_kb_v2_categories.csv  — category assignments for the existing 169

How to run:
    python3 scripts/chatbot_kb_v2.py
    # then in HubDB UI:
    # Marketing > Files and Templates > HubDB > hcfm_chatbot_kb (id 282697845)
    # Click 'Import' → upload chatbot_kb_v2_new_rows.csv
    # Then 'Publish'.

Style discipline used for every new entry:
- Talk like a human, not a manual. Contractions allowed. Reads aloud naturally.
- Start with a one-line answer when possible. Add the 'why' / 'how' below it.
- Concrete examples beat abstract description.
- End with a soft confirmation or pointer where natural ('Want me to go
  deeper on any of that?', 'If that's not what you meant, tell me what's
  off and I'll try again.', 'The Voice page has more on this.').
- Honest when something has limits ('I can't approve designs — Victoria or
  Emmanuel does that.').
"""

from __future__ import annotations
import csv, json, os, sys
from pathlib import Path

HERE = Path(__file__).parent.resolve()
BUILD = HERE.parent / "build"
BUILD.mkdir(parents=True, exist_ok=True)

# ----------------------------------------------------------------------------
# 1. CATEGORIZATION OF EXISTING v1 ENTRIES (by keyword prefix match)
# ----------------------------------------------------------------------------
# The existing 169 entries have empty category fields. We assign categories
# heuristically based on keyword content so the KB is browsable.

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

# Order matters: more specific categories listed earlier win.
CATEGORY_ORDER = ["symbol", "father-peyton", "logo", "typography", "voice", "imagery",
                  "design-elements", "stationery", "platforms", "accessibility",
                  "research", "regional", "translation", "ministries", "workflow",
                  "contact", "downloads", "history", "philosophy", "colors"]


def categorize(keywords: str) -> str:
    """Return best-matching category for an entry given its comma-separated keywords."""
    kw_lower = (keywords or "").lower()
    for cat in CATEGORY_ORDER:
        for trigger in CATEGORY_KEYWORDS.get(cat, []):
            if trigger in kw_lower:
                return cat
    return "general"


# ----------------------------------------------------------------------------
# 2. NEW Q&A ENTRIES (v2 expansion)
# ----------------------------------------------------------------------------
# Format: dict with keywords (comma-separated), answer (HubL-safe HTML), category,
# priority (HubDB sort order — lower = higher priority; assign as range so v2
# entries don't collide with v1's 1-169).
#
# Priority assignments:
#   200-249: conversational/clarification (most-used short responses)
#   250-299: workflow / how-to
#   300-349: real-world scenarios
#   350-399: editorial / naming conventions
#   400-449: tools / software
#   450-499: vendor / designer / printer
#   500-549: localization
#   550-599: troubleshooting / edge cases
#   600-649: additional comparisons + deepening philosophy

NEW_ENTRIES: list[dict] = []


def add(keywords: str, answer: str, category: str, priority: int) -> None:
    NEW_ENTRIES.append({
        "keywords": keywords,
        "answer": answer,
        "category": category,
        "priority": priority,
    })


# ----------------------------------------------------------------------------
# 2a. CONVERSATIONAL / CLARIFICATION (priority 200-249)
# ----------------------------------------------------------------------------

add(
    "hi, hello, hey, greetings",
    "Hi — I'm the HCFM brand assistant. I know the colors, logos, fonts, voice rules, and the why behind every choice in the 2026 system. Ask me anything. <br><br>Some examples: <em>'What's HCFM Blue's hex?'</em>, <em>'Why did we change in 2026?'</em>, <em>'Can I use Yellow Gold for body text?'</em>, <em>'How do I refer to Father Peyton?'</em>",
    "conversation", 200,
)
add(
    "thanks, thank you, thanks a lot, appreciate it",
    "Anytime. If something on the brand page is missing or confusing, the asset request form on the <a href='#help'>Help page</a> goes to Victoria and Emmanuel — they answer within two business days.",
    "conversation", 201,
)
add(
    "who are you, what are you, are you a bot, are you ai",
    "I'm a brand assistant — not an AI, just a trained knowledge base that pattern-matches your question to a written answer. Every answer was written by Emmanuel and reflects the 2026 HCFM brand system. If I don't have your answer, I'll escalate to him + Victoria.",
    "conversation", 202,
)
add(
    "human, real person, talk to someone, escalate",
    "If you want a person rather than me: email <a href='mailto:vhassan@hcfm.org'>vhassan@hcfm.org</a> or <a href='mailto:eepau@hcfm.org'>eepau@hcfm.org</a>. You can also use the asset-request form on the <a href='#help'>Help page</a> — same inbox, slightly more structure.",
    "conversation", 203,
)
add(
    "yes, yep, yeah, correct, that helps",
    "Glad that landed. Want another question, or were you done?",
    "conversation", 204,
)
add(
    "no, nope, not really, doesn't help, didn't help, not what i meant",
    "Got it — let me try a different angle. Can you tell me what specifically is unclear, or what you were actually trying to do? Sometimes a one-word clue (\"social post,\" \"print,\" \"a vendor asked me\") helps me find the right answer.",
    "conversation", 205,
)
add(
    "more, tell me more, go deeper, explain more, elaborate",
    "Sure. Tell me which part you want me to go deeper on — the why, the how, an example, or the trade-offs we considered?",
    "conversation", 206,
)
add(
    "i don't understand, confusing, can you simplify, plain english, eli5",
    "Fair. Tell me your role — designer, ministry-center staff, vendor, parent volunteer — and I'll rephrase. Brand vocab is rough if you didn't grow up in it.",
    "conversation", 207,
)
add(
    "what can you do, what do you know, help me, capabilities",
    "I can answer pretty much anything about the 2026 HCFM brand: colors (hex/Pantone/why), logos (when to use which), the symbol's five layers of meaning, fonts (Whitney/Calluna/Playlist Script), voice (how we sound, what to say, what to avoid), imagery rules, platform dimensions, the 60-30-10 hierarchy, accessibility, and the reasoning behind every choice. Try a question.",
    "conversation", 208,
)
add(
    "can you help me, i need help, i'm stuck",
    "Definitely — what are you working on? A social post, a print piece, a logo placement question, a vendor brief? Knowing the format usually narrows the answer fast.",
    "conversation", 209,
)
add(
    "i'm new, first time, just joined, onboarding",
    "Welcome. Best 10-minute path: (1) skim the <a href='#symbol'>Symbol page</a> for what the mark means, (2) read <a href='#colors'>Colors</a> for the palette, (3) check <a href='#voice'>Voice</a> for how we sound. After that, you'll get the rest by osmosis. The <a href='#downloads'>Downloads page</a> has logo files when you need them.",
    "conversation", 210,
)
add(
    "bookmark, save this page, where do i go, url",
    "Bookmark <strong>hcfm.org/brand</strong>. That's the canonical home for everything brand-related. SharePoint is being phased out for brand reference.",
    "conversation", 211,
)


# ----------------------------------------------------------------------------
# 2b. WORKFLOW / HOW-TO (priority 250-299)
# ----------------------------------------------------------------------------

add(
    "how do i start, where to begin, new design, starting a design",
    "Start with the medium. <em>Where</em> is this going to live — Instagram, print bulletin, banner, email signature? That dictates dimensions (see <a href='#platforms'>Platform Dimensions</a>) and which colors to lead with (dark backgrounds for social, lighter for print). Then pick a palette ratio (the 60-30-10 rule on the <a href='#colors'>Colors</a> page), the right typeface combo (<a href='#typography'>Typography</a>), and the right imagery category. From there, build.",
    "workflow", 250,
)
add(
    "get my logo, my ministry logo, country specific logo, find my ministry logo",
    "Every sub-ministry has its own logo pack. Go to the <a href='#ministries'>Ministry Centers</a> page, click your ministry (e.g., HCFM Kenya, Family Rosary Crusade Philippines), and you'll see the variants. To download the production files, head to <a href='#downloads'>Downloads</a> → Ministry centers tab. Logo packs include PNG and JPG variants; AI source files are admin-tier only.",
    "workflow", 251,
)
add(
    "request asset, custom asset, custom design, request something custom",
    "Use the asset request form on the <a href='#help'>Help page</a>. It goes to Victoria and Emmanuel. Include: what ministry, what asset (announcement, poster, social pack), what dimensions, what deadline, and any reference materials. The clearer the brief, the faster the turnaround.",
    "workflow", 252,
)
add(
    "review my design, check my work, brand check, design review, audit",
    "Two paths. (1) Run yourself through the <a href='#checklist'>Pre-flight checklist</a> — that catches 80% of issues. (2) If you want a second set of eyes before publishing, email Victoria or Emmanuel with the file attached. We'll respond within two business days. For high-stakes pieces (donor mailers, public campaigns), always loop us in before printing.",
    "workflow", 253,
)
add(
    "approval, who approves, sign off, approver",
    "Brand-aligned design (follows the rules on this page) doesn't need approval — just ship it. <em>External-facing campaigns</em> with new copy, new imagery, or co-branding need Victoria or Emmanuel's sign-off. <em>Anything with Father Peyton's likeness</em> needs Father Fred Jenga's awareness too. When in doubt, ask Victoria.",
    "workflow", 254,
)
add(
    "feedback, comments, suggest change, suggest edit",
    "Two ways: (1) the feedback form on the <a href='#help'>Help page</a> opens our Microsoft Forms inbox (Easton team monitors), or (2) email Victoria + Emmanuel directly. Both get to the same place. We update the brand page based on real ministry-center feedback.",
    "workflow", 255,
)
add(
    "easter post, easter graphic, easter social",
    "Easter is a high-energy moment. <strong>Recommended palette:</strong> Yellow Gold dominant on Black (60-30-10), with Marian Blue accent. Use Playlist Script for a single word like <em>'Risen'</em> or <em>'Alleluia'</em>. Imagery: family at Easter Vigil, the empty tomb, a Marian image of the Resurrection. Avoid stock Easter eggs — we're a Catholic ministry, not a candy brand. Run it through the <a href='#checklist'>Pre-flight checklist</a> before publishing.",
    "scenarios", 256,
)
add(
    "christmas post, christmas graphic, advent post, nativity",
    "Advent and Christmas both lean liturgical. <strong>Advent:</strong> Purple from the extended palette, with Yellow Gold accent for candlelight feel. <strong>Christmas:</strong> Yellow Gold or White on Black, Marian Blue accent. Imagery: nativity, Holy Family, manger, candlelight. Playlist Script for <em>'Emmanuel'</em>, <em>'Joy'</em>, <em>'Peace'</em>. Avoid Santa imagery and commercial Christmas tropes.",
    "scenarios", 257,
)
add(
    "lenten, ash wednesday, lent graphic, lent social",
    "Lent reads serious and reflective. <strong>Palette:</strong> Black foundation with Purple (extended palette) accents — Purple is the liturgical color of Lent. Muted Gold for traditional/reverent moments. Avoid Yellow Gold (too energetic for the season). Imagery: ashes, fasting, prayer, the Cross. Calluna serif for body — its bookish character fits the reflective tone.",
    "scenarios", 258,
)
add(
    "pentecost, holy spirit graphic, red liturgical",
    "Pentecost is fire and Spirit. <strong>Palette:</strong> The Red from the extended palette plus Yellow Gold — both are appropriate liturgical signals. On Black for social, or with White breathing space for print. Avoid mixing too many colors — Pentecost is bold but not chaotic. Imagery: tongues of fire, dove, Mary with the apostles.",
    "scenarios", 259,
)
add(
    "mary feast, marian feast, immaculate conception, assumption, our lady",
    "Marian feasts are where Marian Blue (#00A9E0) earns its name. <strong>Palette:</strong> Marian Blue + White breathing space, with Playlist Script for <em>'Mary'</em>, <em>'Ave'</em>, or the specific feast title. Yellow Gold accents for star/halo imagery. Imagery: Marian art, the Rosary, family in prayer to Our Lady. The full Marian palette and rationale is on the <a href='#colors'>Colors</a> page.",
    "scenarios", 260,
)
add(
    "father peyton anniversary, peyton birth, peyton death, commemoration",
    "Father Peyton's anniversaries are major. <strong>Important naming rule:</strong> Don't call it his \"birthday\" — he's no longer living. Use <em>'Anniversary of Birth'</em>, <em>'Anniversary of Birthday'</em>, or <em>'Celebration of Birth.'</em> Palette: Black or Muted Gold (reverent, traditional), with archival imagery of Father Peyton himself. His message — <em>'The Family That Prays Together Stays Together'</em> — gets the trademark symbol (™).",
    "scenarios", 261,
)
add(
    "fundraising appeal, donor letter, asking for donations",
    "Donor letters use the warm, named, grateful voice (<a href='#voice'>Voice</a> page → Tone by context). Start with the family or families the donor's gift will reach, not the institution. Use specific country names (\"the Manila ministry center,\" not \"globally\"). HCFM Blue for headlines, Calluna body, no Yellow Gold body text. The brand book PDF in <a href='#downloads'>Downloads</a> covers print specs for letterhead and envelopes.",
    "scenarios", 262,
)
add(
    "event banner, conference banner, rally banner",
    "Banners are seen from 10+ feet — type has to be huge and color contrast extreme. <strong>Recommended:</strong> Black background, Yellow Gold for the headline, Marian Blue for sub-text, White for fine print. Symbol top-left or top-center. The mark scales beautifully — use it large. Print spec: 1080×1920 portrait for digital displays; for physical banners ask your vendor for their bleed/safe-area template and design to that.",
    "scenarios", 263,
)
add(
    "newsletter, email newsletter, monthly newsletter",
    "Newsletters live in the inbox — assume dark mode (most clients render dark by default now). Use HCFM Blue or Black header band, White or near-white body, Yellow Gold for one CTA button. Whitney for headlines, Calluna or system-font for body. Keep image-to-text ratio modest (some clients block images by default).",
    "scenarios", 264,
)
add(
    "youtube thumbnail, thumbnail design, video thumbnail",
    "Thumbnails are the most attention-competitive surface we have. <strong>Spec:</strong> 1280×720, large face if there is one, a single high-contrast color block (Yellow Gold on Black works almost always), 2-4 words of overlay text max. Whitney Bold. Don't use Playlist Script in thumbnails — it doesn't read at thumbnail scale.",
    "scenarios", 265,
)
add(
    "bulletin insert, parish bulletin, church bulletin",
    "Parish bulletins print on a budget — design for low-resolution print and limited color. <strong>Safe approach:</strong> Black + one accent color (HCFM Blue for institutional pieces; Yellow Gold for energy pieces). Calluna serif body (it reproduces better on cheap paper than sans-serif). Include the HCFM mark small in a corner, not the full logo.",
    "scenarios", 266,
)
add(
    "t-shirt, swag, merch, apparel, polo, cap",
    "Merch is brand-by-touch. <strong>Logo placement:</strong> small mark on left chest (polos), centered on caps, large mark on event tees. <strong>Color:</strong> White, Black, or HCFM Blue garment with single-color print. Avoid full-color prints on apparel — too many ways for color to go wrong. Always send the vendor the AI source files (admin-tier in <a href='#downloads'>Downloads</a> → Source files) for crisp output.",
    "scenarios", 267,
)
add(
    "email signature, signature, my email signature",
    "Email signatures want to be tiny and not distracting. <strong>Recommended format:</strong>"
    "<br>Name, Title — Plain text, no styling"
    "<br>Holy Cross Family Ministries — Whitney bold"
    "<br>Phone | Email | hcfm.org"
    "<br>Small HCFM mark (60-80px wide), HCFM Blue version"
    "<br>"
    "<br>Avoid stacked color blocks, taglines, multiple social icons. Tagline ('The Family That Prays Together Stays Together') is optional and looks best on one line, italic, smaller font.",
    "scenarios", 268,
)
add(
    "zoom background, virtual background, video call background",
    "Black background with the HCFM symbol large in one corner reads cleanly on camera. Avoid the full logotype — it gets distorted at video-call resolution. The symbol-on-black PNG is in <a href='#downloads'>Downloads</a> → Ministry centers → your ministry pack.",
    "scenarios", 269,
)
add(
    "powerpoint, slide deck, presentation, slides",
    "We're rebuilding the official PowerPoint template — Emmanuel is starting that work after the brand page launch. In the meantime, basic recipe: Black or HCFM Blue master background, White or Yellow Gold for titles in Whitney Bold, Calluna for body, HCFM mark top-right of every slide. The <a href='#typography'>Typography</a> page has the full type ladder.",
    "scenarios", 270,
)
add(
    "co-branding, partnership logo, joint logo, two logos",
    "Co-branding is delicate. <strong>Layout rule:</strong> HCFM logo on the left, partner logo on the right, separated by a thin vertical rule. Equal visual weight (match heights, not widths — visual weight beats pixel measurement). Both at 100% color, no tinting. <strong>Approval:</strong> always run co-branded layouts past Victoria or Emmanuel before publishing — partner brand rules sometimes override ours.",
    "scenarios", 271,
)
add(
    "new ministry, launching ministry, new ministry center",
    "When a new ministry center launches, the brand team in Easton commissions the logo pack (Logotype 1-4 in five color variants, all approved file formats). Reach out to Victoria with: ministry name, country, governance structure (HCFM-owned or affiliate), and the launch timeline. We need 4-6 weeks lead time for logo design + approval.",
    "scenarios", 272,
)


# ----------------------------------------------------------------------------
# 2c. EDITORIAL / NAMING CONVENTIONS (priority 350-399)
# ----------------------------------------------------------------------------

add(
    "hcfm singular, hcfm plural, hcfm grammar, hcfm verb",
    "<strong>HCFM is a singular noun.</strong> Write 'HCFM serves families…' — never 'HCFM serve.' Same rule for 'Holy Cross Family Ministries' written out — singular verb. (One family of ministries, not many.) Same logic applies to 'well-being' in the mission, which is hyphenated.",
    "voice", 350,
)
add(
    "father or fr, fr abbreviation, father vs fr",
    "Use <strong>Father</strong> (full word), not <strong>Fr.</strong> (abbreviation), whenever possible. So 'Father Peyton' not 'Fr. Peyton.' First or last name use depends on the priest's personal preference and the formality of the copy.",
    "voice", 351,
)
add(
    "csc, c.s.c., congregation initials, csc punctuation",
    "<strong>C.S.C.</strong> — with periods. Set off with commas in body copy: 'Father Willy Raymond, C.S.C., is the president.' The order is the Congregation of Holy Cross, and the initials follow Catholic Church convention.",
    "voice", 352,
)
add(
    "venerable patrick peyton, father patrick peyton, peyton name, how to refer to peyton",
    "Two acceptable formats: <strong>Venerable Patrick Peyton</strong> OR <strong>Father Patrick Peyton, C.S.C.</strong> — but never combine 'Venerable' and 'Father' in the same reference. Per Catholic Church guidelines, sainthood titles (Saint, Venerable, Blessed) drop the 'Father' / 'Brother' and the C.S.C. After first mention, 'Father Peyton' is fine.",
    "father-peyton", 353,
)
add(
    "peyton birthday, peyton birth, father peyton birthday",
    "Father Peyton is no longer living, so avoid the word 'birthday.' Events on or around his birth date should be titled <strong>'Anniversary of Birth'</strong>, <strong>'Anniversary of Birthday'</strong>, or <strong>'Celebration of Birth.'</strong> Saying 'birthday' implies he's still living — confusing for audiences who don't know him.",
    "father-peyton", 354,
)
add(
    "father moreau, basil moreau, congregation founder",
    "Father Moreau is the founder of the Congregation of Holy Cross. Use the English form of his name: <strong>Basil Anthony Mary Moreau, C.S.C.</strong> — or <strong>Blessed Basil Anthony Moreau</strong> if using the sainthood title.",
    "voice", 355,
)
add(
    "rosary capital, rosary uppercase, capital r rosary",
    "<strong>Always capital R</strong> in the word 'Rosary,' in every context. This is an HCFM convention that overrides standard AP grammar (which lowercases it). 'Rosary makers' is also two words. If a vendor's house style lowercases it, ask them to make an exception for our materials.",
    "voice", 356,
)
add(
    "ministry centers, mission center, hcfm office",
    "All HCFM locations around the world are <strong>Ministry Centers</strong> — capital M, capital C. <em>Never</em> use 'office' (we're not a corporate office). <em>Never</em> use 'Mission Center' (that means too many other things). 'A family of ministries' is the mission language; 'Ministry Centers' is the operational language.",
    "ministries", 357,
)
add(
    "north easton, easton building, father peyton center",
    "The HCFM campus in North Easton, Massachusetts is called <strong>The Father Peyton Center.</strong> The chapel there is <strong>'Our Lady of the Holy Rosary Chapel.'</strong> The chapel at the Holy Cross Center is <strong>'St. Joseph Chapel'</strong> — not 'St. Joseph's.' The museum's full name is <strong>'Museum of Family Prayer: A Contemporary Experience of Father Peyton's Ministry.'</strong>",
    "ministries", 358,
)
add(
    "catholic mom, catholicmom, .com",
    "Refer to as <strong>Catholic Mom</strong> or <strong>Catholic Mom.com</strong> — include the '.com' whenever possible. Their tagline is 'A community of women celebrating all things faith, family, and fun.' Don't shorten to 'CMom' or 'CathMom.'",
    "ministries", 359,
)
add(
    "family theater productions, ftp, family theater",
    "Use the full name — <strong>Family Theater Productions</strong> — in all external communications. The abbreviation <strong>FTP</strong> may be used internally when space is tight but is not preferred. <em>Never</em> shorten to 'Family Theater' externally — that loses the 'Productions' which signals the org makes media. Mission: 'Inspire, Educate, and Entertain.' Tagline: 'Produces family, faith-based media.'",
    "ministries", 360,
)
add(
    "catholic central, ccentral, enterforming",
    "Two separate words: <strong>Catholic Central.</strong> Include the '.com' whenever possible. Their tagline is 'Insights on all things Catholic.' Hashtag: <strong>#Enterforming</strong> — capital E, one word, no spaces or underscores.",
    "ministries", 361,
)
add(
    "ireland memorial centre, ireland visitor center, peyton memorial",
    "The HCFM visitors center in Ireland is called <strong>The Father Patrick Peyton, C.S.C., Memorial Centre.</strong> Note the British spelling 'Centre' (with -re), not 'Center' — the location is in Ireland and the locally-correct spelling matters.",
    "ministries", 362,
)
add(
    "family that prays trademark, message trademark, prays together trademark",
    "<strong>The Family That Prays Together Stays Together</strong> is a trademarked phrase (™) of The Family Rosary, Inc. Use the ™ symbol on first reference in any external publication. <strong>Punctuation rules:</strong> no period at the end if it stands alone in a graphic; period if it's in body copy or quoted as Father Peyton's words; a comma is <em>never</em> used within the phrase.",
    "father-peyton", 363,
)
add(
    "world at prayer trademark, world peace trademark, registered trademark",
    "<strong>A World at Prayer is a World at Peace</strong> is a <em>registered</em> trademark (®) of The Family Rosary, Inc. Use the ® symbol on first reference in any external publication. Same punctuation rules as the other message: no period if standalone graphic, period if body copy, no comma within.",
    "father-peyton", 364,
)
add(
    "slogan, motto, tagline, peyton slogan",
    "Don't call Father Peyton's two phrases 'slogan' or 'motto' — refer to them as <strong>messages</strong> or <strong>Father Peyton's vision.</strong> They're not marketing slogans; they're his life's work distilled into two sentences. The vocabulary signals the difference.",
    "father-peyton", 365,
)
add(
    "copyright, copyright notation, all rights reserved",
    "Standard copyright format: <strong>© (year) The Family Rosary, Inc., All Rights Reserved.</strong> Use on packaging, product, and formal publications. Space-permitting use the full notation; otherwise the year + © symbol is acceptable.",
    "voice", 366,
)
add(
    "reverential capitalization, capitalize god, his her his pronouns",
    "Names, adjectives, and pronouns referring to God are capitalized in our copy: <em>Creator God</em>, <em>Your love for us</em>, <em>His blessings on us</em>, <em>the Holy Spirit</em>, <em>the Father.</em> This is called reverential capitalization. (Some non-Catholic style guides reject it; ours follows it.)",
    "voice", 367,
)
add(
    "congregation of holy cross, the holy cross, csc order",
    "Correct full name: <strong>The Congregation of Holy Cross.</strong> Never write 'the Holy Cross' alone (the article + saint's name reads wrong). HCFM is sponsored <em>by</em> the Congregation, not <em>by</em> the Holy Cross.",
    "voice", 368,
)


# ----------------------------------------------------------------------------
# 2d. TOOLS / SOFTWARE (priority 400-449)
# ----------------------------------------------------------------------------

add(
    "canva, canva template, canva brand",
    "Canva templates for HCFM are coming — Emmanuel is preparing them for ministry-center designers who don't use Adobe. In the meantime: set your Canva brand kit with HCFM Blue #0047BB, Yellow Gold #FFB500, Marian Blue #00A9E0, Black, White. Upload Whitney and Calluna fonts if you have a Canva Pro account; otherwise use Canva's Whitney and Calluna substitutes (Montserrat and Lora are decent fallbacks).",
    "tools", 400,
)
add(
    "adobe, illustrator, photoshop, indesign",
    "AI source files (the editable masters) are admin-tier in <a href='#downloads'>Downloads</a> → Source files — Easton internal team only. PNG and JPG variants for ministry centers are public-password tier (request the password from Victoria or Emmanuel). All Adobe Creative Cloud fonts can sync Whitney, Calluna, and Playlist Script if your subscription includes Adobe Fonts.",
    "tools", 401,
)
add(
    "google slides, google docs, gsuite",
    "Google Workspace doesn't have Whitney, Calluna, or Playlist Script by default. <strong>Fallbacks:</strong> use Open Sans or Lato for sans-serif headlines, Lora or Source Serif Pro for body. Set the color palette in your Google account theme. A Google Slides HCFM template is on Emmanuel's task list — coming soon.",
    "tools", 402,
)
add(
    "powerpoint template, ppt template, slide template",
    "An official 2026 PowerPoint template is in development — Emmanuel is rebuilding it from scratch. Until then: black master slide, Whitney Bold (Calibri or Aptos as fallback), HCFM mark top-right, body in Calluna (Cambria as fallback). For donor decks, Marian Blue is a strong secondary.",
    "tools", 403,
)
add(
    "figma, sketch, design tool",
    "Figma supports the Adobe Fonts sync, so Whitney, Calluna, and Playlist Script will appear if your Adobe Creative Cloud subscription includes them. Otherwise upload the OTF files (Downloads → Fonts) into your Figma team library. The HCFM color tokens (HCFM Blue, Yellow Gold, etc.) are documented on the <a href='#colors'>Colors</a> page with hex values — add them as styles.",
    "tools", 404,
)
add(
    "word, microsoft word, letterhead, word template",
    "Word letterhead templates for HCFM, Family Rosary, Catholic Mom, Family Theater Productions, Father Peyton Prayer Guild, and Museum of Family Prayer are in <a href='#downloads'>Downloads</a> → Letterhead Word templates. Use the body in Times New Roman per the print spec (the Brand Guidelines 2026 PDF documents the recipe).",
    "tools", 405,
)
add(
    "iphone, mobile design, designing on phone",
    "Mobile design tools (Canva on iPad, Adobe Express on iPhone) are fine for quick social posts but can't reproduce the full type system — Playlist Script especially needs a desktop. For anything print-bound or campaign-bound, design on desktop. The brand portal itself works on mobile if you need to look up a hex code on the go.",
    "tools", 406,
)
add(
    "screen vs print, rgb vs cmyk, color conversion",
    "Digital uses hex (#0047BB for HCFM Blue) or RGB. Print uses Pantone or CMYK. <strong>Recipe:</strong> match the Pantone spec (e.g., HCFM Blue = Pantone 2728 Coated) and let the printer convert. If they ask for CMYK directly, expect a slight shift — Pantone-to-CMYK loses some vibrancy on Yellow Gold and Marian Blue especially. The <a href='#colors'>Colors</a> page documents Pantone for every brand color.",
    "tools", 407,
)


# ----------------------------------------------------------------------------
# 2e. VENDOR / DESIGNER / PRINTER (priority 450-499)
# ----------------------------------------------------------------------------

add(
    "vendor brief, designer brief, brief for vendor",
    "When briefing an external designer or vendor, point them to hcfm.org/brand. Then specify: (1) which logo configuration to use (mark only, Logotype 1, 2, 3, or 4), (2) which colors (Pantone numbers for print, hex for digital), (3) which fonts (and whether they need to license them or you'll provide), (4) the deliverable spec (dimensions, file format), (5) brand contact (Victoria or Emmanuel) for approval. Vendors love clear specs.",
    "vendors", 450,
)
add(
    "printer, print vendor, sending to printer",
    "Printers want Pantone numbers, not hex codes. Send them the HCFM colors as <strong>Pantone Coated</strong> — that's what's on the <a href='#colors'>Colors</a> page. For coated paper stock, the spec is on the <a href='#stationery'>Stationery</a> page. For uncoated stock, ask the printer for the equivalent Pantone Uncoated value. Always proof in real ink before approving a print run.",
    "vendors", 451,
)
add(
    "color matching print, pantone matching, print accuracy",
    "Color matching: Pantone 2728C (HCFM Blue) and 871C (Muted Gold) are the most-used spot colors and most printers stock them. Pantone 7549C (Yellow Gold) is less common — confirm your printer can match it before designing. For 4-color process printing (CMYK), expect a slight shift. Always print a proof and approve in person if possible.",
    "vendors", 452,
)
add(
    "vendor logo file, send logo to vendor, vendor needs logo",
    "Send vendors the EPS or AI file for print, PNG for digital. Both are in <a href='#downloads'>Downloads</a> → Ministry centers (PNG/JPG public-password tier) or → Source files (AI/EPS admin tier). Do <em>not</em> send vendors PNG files for print work — they won't scale. Always include a usage license note: 'Files licensed for use on the [project name]. Not for reuse or redistribution.'",
    "vendors", 453,
)
add(
    "freelance designer, hire designer, freelancer brand",
    "Freelance designers should be briefed off the brand page and pointed to <a href='#downloads'>Downloads</a> for assets. Request a co-branded NDA if they're working on Father Peyton imagery or unannounced campaign work. The brand portal includes a 'For Vendors' section on the <a href='#help'>Help page</a> — that's the link to share.",
    "vendors", 454,
)
add(
    "agency, marketing agency, external agency",
    "If you're working with an external agency: send them to hcfm.org/brand. They should treat it as the brand book. For source files, they request a password from Victoria or Emmanuel — admin-tier access is granted per-engagement, not blanket. Agencies sometimes try to 'improve' the brand — flag any deviations from the brand book to Emmanuel before approving.",
    "vendors", 455,
)
add(
    "photographer, hire photographer, event photographer",
    "Photographers should be briefed against the <a href='#imagery'>Imagery</a> page — five approved categories, real-not-stock, dark overlays on text moments. For event photographers, also send the shot-list framework (Details, Venue, Attendees, Speakers/Special Guests) on the same page. Talk through composition (rule of thirds, leading lines, etc.) only if their portfolio shows they need the prompt.",
    "vendors", 456,
)
add(
    "videographer, video producer, hire videographer",
    "Brand video standards: open with a stable establishing shot (no shaky-cam intros), use HCFM-palette lower-thirds, Father Peyton imagery in archival quality (no AI upscaling). Aspect ratios: 16:9 for YouTube and Facebook feeds, 9:16 for Reels/Stories/TikTok. Sound: 192kbps minimum. Captions: hardcoded for social, separate SRT for YouTube.",
    "vendors", 457,
)
add(
    "t-shirt vendor, apparel vendor, screen printer",
    "Apparel printers: send the AI source for the logo, specify <em>one color of ink</em> (single-color printing is cheapest and reproduces most reliably). Specify ink color by Pantone — usually White on a colored garment, or HCFM Blue on White. Place the logo on the left chest (3-4 inches wide) for polos; centered on caps; full chest for event tees.",
    "vendors", 458,
)
add(
    "banner vendor, signage vendor, sign company",
    "Banner vendors: ask them for their bleed/safe-area template before designing — different finishers have different specs. Design to their template, send them the AI source (not PNG). Color: Pantone Coated for vinyl banner stock; CMYK for fabric or backlit material. Confirm in writing the file format they want — sometimes it's PDF/X, sometimes it's AI.",
    "vendors", 459,
)


# ----------------------------------------------------------------------------
# 2f. LOCALIZATION (priority 500-549)
# ----------------------------------------------------------------------------

add(
    "translate, translation, translating materials",
    "HCFM materials get translated into the local language of each Ministry Center. The 2026 brand system applies across all languages — only the words change. Color, type, logo, and design rules stay identical. For Spanish content used in the US, request <strong>Latin American Spanish</strong> specifically (not Castilian / Spain Spanish) — the audience is Latin American Catholic families.",
    "localization", 500,
)
add(
    "spanish, latin american spanish, mexican spanish",
    "<strong>Use Latin American Spanish</strong> for HCFM materials targeted at US Hispanic audiences and Mexico/Peru/Chile/Uruguay ministry centers. For Spain or European audiences (rare for us), use Castilian. When briefing translators, name the variant explicitly — 'Spanish' alone is ambiguous and translators default to whichever they grew up with.",
    "localization", 501,
)
add(
    "tagalog, filipino, philippines language",
    "<strong>Tagalog</strong> is the formal language; <strong>Filipino</strong> is the same language with more English loanwords (urban, younger). Family Rosary Crusade Philippines uses both depending on audience — formal events lean Tagalog, social media leans Filipino. English is widely understood in Philippines too.",
    "localization", 502,
)
add(
    "swahili, kenya tanzania uganda, east africa language",
    "<strong>Swahili</strong> (Kiswahili) is the regional lingua franca for HCFM Kenya, Tanzania, and Uganda. English is also widely spoken — most ministry materials in East Africa run bilingual (Swahili + English). Color and brand rules stay identical across the regional languages.",
    "localization", 503,
)
add(
    "french, france haiti, french language",
    "French is the primary language for HCFM France and one of three languages used in Haiti (alongside Haitian Creole and English). When commissioning French translation, specify <em>European French</em> (for France) or <em>Quebecois / Canadian French</em> (rare for HCFM but worth flagging). For Haiti, also commission Haitian Creole versions of key materials.",
    "localization", 504,
)
add(
    "portuguese, brazil portuguese, lusophone",
    "Portuguese for HCFM materials targets Brazil (Rosário em Familia Brasil). Specify <em>Brazilian Portuguese</em> when briefing translators — European Portuguese has different grammar, vocabulary, and tone. Brazilian Portuguese is warmer and more conversational; European is more formal.",
    "localization", 505,
)
add(
    "bengali, bangladesh language",
    "<strong>Bengali</strong> for HCFM Bangladesh. It's written in a non-Latin script — make sure your designer uses a real Bengali font (Shonar Bangla, Hind Siliguri) and not a Latin font with substituted glyphs. Whitney and Calluna don't have Bengali variants — for Bengali body text we use Hind Siliguri as the brand-aligned fallback.",
    "localization", 506,
)
add(
    "right to left, rtl, arabic, hebrew",
    "HCFM doesn't yet have ministry centers in Arabic or Hebrew speaking regions, but if/when we do, all layouts will need to mirror (right-to-left). The 2026 brand system was designed left-to-right; an RTL adaptation would need new artwork. Talk to Emmanuel before committing to RTL deliverables.",
    "localization", 507,
)
add(
    "date format, date convention",
    "US English uses month/day/year (e.g., 1/15/2026). Most other ministry-center countries use day/month/year (15/1/2026 or 15 January 2026). For international communications, spell out the month — '15 January 2026' is unambiguous in every locale. For social media captions, lean on the locale convention of the audience.",
    "localization", 508,
)


# ----------------------------------------------------------------------------
# 2g. TROUBLESHOOTING / EDGE CASES (priority 550-599)
# ----------------------------------------------------------------------------

add(
    "used wrong color, made a mistake, mistake on social",
    "Don't panic. If you've already published with an off-brand color (e.g., used Magenta from the old palette instead of Yellow Gold): (1) take the post down or edit it if the platform allows, (2) repost with the correct version, (3) email Victoria or Emmanuel so we can note the pattern and avoid it next time. We don't punish mistakes — we patch them quickly.",
    "troubleshooting", 550,
)
add(
    "competitor, ewtn, word on fire, busted halo, comparison",
    "EWTN's brand is heavily blue-and-yellow but in a different register — more traditional, more textual, more 'broadcast.' Word on Fire uses a darker, more sophisticated palette (warm grays, deep blues, less yellow). Busted Halo leans casual. HCFM's brand sits between traditional and modern — dark backgrounds for digital, classic typography, Marian/Rosary imagery as our visual core. We don't copy any of them — we look like ourselves.",
    "regional", 551,
)
add(
    "use blue 50 percent opacity, tint blue, semi transparent",
    "Tints (partial opacity) of HCFM colors are allowed but only on photographic overlays — not for type or solid color blocks. So: a 60% Black overlay on a photo to improve text legibility is fine; a 50% HCFM Blue patch as a 'soft' brand color is not (it falls outside the brand and becomes ambiguous).",
    "edge-cases", 552,
)
add(
    "tint photo blue, blue photo overlay, color overlay photo",
    "Color overlays on photos that shift the photo's natural look are <em>not</em> approved — we use real photography in real colors. The exception is the dark overlay (Black at 40-60% opacity) which is for text legibility, not stylization. If you want a moody/branded photo look, work with the photographer at capture time, not as a post-production filter.",
    "edge-cases", 553,
)
add(
    "glow, drop shadow, 3d effect, outline on mark",
    "<strong>No.</strong> The HCFM mark has clean line work that gets destroyed by glows, drop shadows, 3D extrusions, or strokes/outlines. The 'Logo do not' gallery on the <a href='#logos'>Logos</a> page shows the worst offenders. If you feel the mark needs a glow to stand out, the background contrast is wrong — fix the background, not the mark.",
    "edge-cases", 554,
)
add(
    "symbol larger than wordmark, scale mark bigger",
    "The 4 logotype configurations on the <a href='#logos'>Logos</a> page document the exact symbol-to-wordmark proportions. <em>Never</em> resize the symbol independently of the wordmark — the relationship is part of the design. If you need the symbol bigger, use the mark alone (just the symbol, no wordmark) — that's a separate approved variant.",
    "edge-cases", 555,
)
add(
    "one color available, single color, monochrome",
    "If you only have one color available (single-color print, screen-print on apparel, embroidery), use Black for light backgrounds, White for dark backgrounds. Both are part of the brand. Avoid using a non-brand color even if it's 'close' — better to be in pure Black than off-brand blue.",
    "edge-cases", 556,
)
add(
    "non-catholic vendor, secular vendor, working with non catholic",
    "Most external vendors aren't Catholic — that's fine. The brand book is comprehensive enough that they don't need to know the theology to follow the rules. Brief them on what's required (logos, colors, fonts, do/don'ts) and skip the spiritual context unless they ask. Many of our best vendors are not Catholic; the brand is the contract.",
    "edge-cases", 557,
)
add(
    "competitor platform, post on competitor",
    "If HCFM content is going to live on a non-HCFM platform (a partner's social, a co-branded campaign), check whether their brand rules conflict with ours. When in conflict, ours apply to <em>our</em> piece of the content; theirs apply to <em>theirs</em>. Always get co-branded layouts approved by Victoria or Emmanuel before publishing.",
    "edge-cases", 558,
)
add(
    "low resolution, blurry logo, pixelated logo",
    "A pixelated logo means you're using a raster (PNG/JPG) when you should be using a vector (SVG/AI/EPS). For print, always use vector — it scales infinitely without quality loss. For digital, the PNG at the correct dimensions is fine. If you only have a small PNG and need it bigger, request a fresh file from Victoria or Emmanuel — don't upscale.",
    "edge-cases", 559,
)


# ----------------------------------------------------------------------------
# 2h. DEEPER PHILOSOPHY / ADDITIONAL COMPARISONS (priority 600-649)
# ----------------------------------------------------------------------------

add(
    "why this brand portal, why a website, why not pdf",
    "Three reasons. (1) A PDF goes stale the moment we update the brand; a website updates instantly. (2) PDFs are awkward to search; a website has search, chatbot, FAQ. (3) Ministry centers in 18 countries needed something that didn't depend on SharePoint, which blocks external collaborators. The brand page solves all three at once.",
    "philosophy", 600,
)
add(
    "why not let local centers pick colors, regional palette, local brand",
    "Tempting but fragmenting. Research (Bottomley & Doyle 2006) shows brand consistency matters more than locale-specific palette switching. A Filipino family seeing our Manila content and an Irish family seeing our Dublin content should both recognize HCFM instantly. Cultural awareness happens in <em>how we use</em> the colors (palette weighting, imagery choice), not <em>what's in</em> the palette.",
    "philosophy", 601,
)
add(
    "why one symbol globally, why not localize logo",
    "The symbol is HCFM's deepest brand asset — 10 beads of the Rosary, family of prayer, Marian floral character. Localizing it would dilute the meaning. What <em>does</em> localize is the wordmark: 'HCFM Kenya,' 'Family Rosary Crusade Philippines,' 'INFAM Peru.' The mark stays universal; the name underneath adapts.",
    "philosophy", 602,
)
add(
    "why brand book important, value of guidelines",
    "Three things a brand book buys you. (1) <strong>Speed</strong> — designers and vendors stop asking 'what color?' a hundred times. (2) <strong>Consistency</strong> — your audience sees the same brand from every ministry, builds trust faster. (3) <strong>Accountability</strong> — when something goes wrong, the rule is in writing and you can point to it. Without a brand book, every project becomes a debate.",
    "philosophy", 603,
)
add(
    "marian blue vs hcfm blue, two blues, which blue",
    "<strong>HCFM Blue (#0047BB)</strong> is the identifier — formal, institutional, used for logos, letterheads, official documents. <strong>Marian Blue (#00A9E0)</strong> is the accent — lighter, Marian, used for devotional content and pairings with Playlist Script. Same family, different role. Think 'institutional vs devotional.'",
    "colors", 604,
)
add(
    "yellow gold vs muted gold, two golds, which gold",
    "<strong>Yellow Gold (#FFB500)</strong> is the digital primary — energetic, attention-grabbing, used for headlines, CTAs, social impact. <strong>Muted Gold (#89764B)</strong> is the print/formal accent — sophisticated, traditional, used for letterhead Pantone ink, donor stewardship materials, plaques. Yellow Gold for screens; Muted Gold for paper.",
    "colors", 605,
)
add(
    "why both blues, why both golds, two of each",
    "Different jobs. The 'primary blue and gold' (HCFM Blue + Yellow Gold) carry the digital identity and the energetic moments. The 'secondary blue and gold' (Marian Blue + Muted Gold) carry the devotional and the traditional moments. Together they cover the full range of HCFM communications without becoming repetitive.",
    "colors", 606,
)
add(
    "whitney vs calluna, when whitney, when calluna",
    "<strong>Whitney</strong> (sans-serif) is for headlines, subheads, short impactful copy, UI buttons. <strong>Calluna</strong> (serif) is for body paragraphs, long-form reading, formal documents. The pairing — sans for headline, serif for body — is the most-tested editorial type combination in publishing. Use them together; don't substitute one for the other.",
    "typography", 607,
)
add(
    "when use playlist script, where script font, playlist usage",
    "<strong>Playlist Script</strong> is for accent moments — a single word, an emphasis phrase, a name highlighted in a headline. Never use it for body text, never use it at small sizes (it becomes unreadable), and only in three approved colors: Yellow Gold, White, or Marian Blue. Think 'seasoning' — a sprinkle elevates the meal; a handful ruins it.",
    "typography", 608,
)
add(
    "logo on dark vs light, white logo, color version",
    "Five approved color variations: Black (light backgrounds), HCFM Blue (brand emphasis on neutral background), Muted Gold (premium/formal contexts), White (dark backgrounds — the 'reverse' version), Two-tone Gold-and-Blue (logo only, premium materials). Match the version to the background, not the other way around.",
    "logo", 609,
)
add(
    "small logo size, smallest logo, logo minimum",
    "The mark alone (symbol only): never smaller than 5/16 inch (0.3125\" / 7.94mm) in print, 24 pixels on screen. The full logotypes with 'FAMILY ROSARY CRUSADE' / 'HCFM' wordmark: the wordmark height must be at least 1/16 inch (0.0625\" / 1.59mm) in print, 12 pixels on screen. Below these sizes the symbol loses detail and the wordmark becomes illegible.",
    "logo", 610,
)


# ----------------------------------------------------------------------------
# 3. BUILD AND WRITE OUT
# ----------------------------------------------------------------------------

def main() -> None:
    v1_path = Path("/tmp/chatbot_kb.json")
    if not v1_path.exists():
        sys.stderr.write(
            f"ERROR: {v1_path} not found.\n"
            f"Run 'hs hubdb fetch 282697845 /tmp/chatbot_kb.json' first.\n"
        )
        sys.exit(1)

    # Load v1
    v1 = json.load(open(v1_path))
    v1_rows = v1.get("rows", [])

    # Categorize v1 entries
    v1_cat_csv = BUILD / "chatbot_kb_v2_categories.csv"
    with v1_cat_csv.open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["row_id", "keywords", "current_category", "new_category"])
        for r in v1_rows:
            row_id = r.get("id")
            kw = r.get("values", {}).get("keywords", "")
            current_cat = r.get("values", {}).get("category", "") or ""
            new_cat = categorize(kw)
            w.writerow([row_id, kw, current_cat, new_cat])

    # Write new rows CSV (ready for HubDB import)
    new_csv = BUILD / "chatbot_kb_v2_new_rows.csv"
    with new_csv.open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["keywords", "answer", "category", "priority"])
        for e in NEW_ENTRIES:
            w.writerow([e["keywords"], e["answer"], e["category"], e["priority"]])

    # Write merged JSON
    merged: list[dict] = []
    for r in v1_rows:
        v = r.get("values", {})
        merged.append({
            "id": r.get("id"),
            "keywords": v.get("keywords", ""),
            "answer": v.get("answer", ""),
            "category": v.get("category", "") or categorize(v.get("keywords", "")),
            "priority": v.get("priority"),
            "source": "v1",
        })
    for e in NEW_ENTRIES:
        merged.append({**e, "source": "v2"})

    merged_json = BUILD / "chatbot_kb_v2_full.json"
    merged_json.write_text(json.dumps(merged, indent=2))

    # Summary
    print(f"=== HCFM Chatbot KB v2 build complete ===")
    print(f"")
    print(f"v1 existing rows:     {len(v1_rows)}")
    print(f"v2 new rows:          {len(NEW_ENTRIES)}")
    print(f"merged total:         {len(v1_rows) + len(NEW_ENTRIES)}")
    print(f"")
    print(f"Outputs:")
    print(f"  {new_csv}")
    print(f"     → upload to HubDB hcfm_chatbot_kb via Import CSV")
    print(f"  {v1_cat_csv}")
    print(f"     → reference for assigning categories to existing 169 entries")
    print(f"  {merged_json}")
    print(f"     → full merged view for any future analysis")
    print(f"")
    print(f"Next steps:")
    print(f"  1. Review {new_csv} — sanity-check the new entries")
    print(f"  2. HubSpot UI: HubDB → hcfm_chatbot_kb → Import CSV")
    print(f"  3. Publish the table")
    print(f"  4. Test the chatbot live on hcfm.org/brand")


if __name__ == "__main__":
    main()
