# HCFM Brand Portal Chatbot — LLM-backed architecture proposal

**Status:** Proposal for review. Not yet implemented. Builds on the
v3.1 keyword-matched bot that's currently live at
[hcfm.org/brand](https://www.hcfm.org/brand).

**Why this exists.** The current bot is a search box with friendly UI:
keyword overlap → one canned answer. The v3 deep answers (2,500-3,500
chars each) plus the v3.1 session/name/preface layer simulate
conversation but can't actually reason. To get the behavior Emmanuel
described — *"thinks ahead of the user, references by name, adapts
answers to context, feels like talking to a colleague"* — we need an
LLM call in the loop.

This doc covers the architecture, the tradeoffs, and the implementation
plan. It's a starting point for a real conversation with Victoria and
Margaret about whether to ship it.

---

## 1. The honest gap between v3.1 and what was asked for

| What Emmanuel asked for | What v3.1 delivers | The gap |
|---|---|---|
| Explains WHY questions with depth | ✅ 19 deep rewrites avg 2,900 chars | None on covered topics. Novel questions still hit "I don't have a confident answer" |
| Thinks ahead of the user | "You might also want to know" pills | Pre-authored suggestions, not anticipation |
| References user by name | Preface + welcome | Body of answer is identical for all users |
| Tracks what user looks at | Session memory of asked questions | Doesn't see which sections of the site they visited or which downloads they clicked |
| Adapts to user's context (designer-in-Manila vs vendor) | Captures role | The role is stored, never used in answers |
| Suggests follow-ups proactively | ✅ Authored followups per entry | Limited to what we pre-wrote |
| Feels like a chatbot | First touch is conversational | Mid-conversation is still "lookup → one prewritten answer" |
| Without AI | ✅ No external dependency | Hard ceiling. Can't synthesize, can't reason, can't handle novel questions |

The honest reading: **v3.1 is the best a keyword-matched bot can be.
Anything beyond it requires an LLM in the loop.**

---

## 2. What an LLM-backed bot actually adds

Concrete behaviors that become possible:

1. **Novel questions get answered.** "Can I put the Yellow Gold logo on a
   Marian Blue background for our March Marian feast?" — current bot has
   no entry for this. LLM synthesizes from: Yellow Gold logo rules + Marian
   Blue accent rules + Marian feast imagery direction + the WCAG contrast
   table. Returns a specific yes/no/conditional answer with the reasoning.

2. **Role-tailored explanations.** A designer in Manila asking "what fonts
   should I use" gets the technical answer (Whitney 600/700, Calluna
   regular, weight pairing, Playlist Script seasoning rule). A non-designer
   ministry-center director asking the same question gets "use Whitney for
   headlines, Calluna for body text — Canva templates are pre-set so you
   don't need to think about this" plus a link to the Canva template kit.

3. **Specific situations, not just topics.** "We're doing a Father's Day
   campaign in June targeting young dads with kids under 5 — what's our
   brand stance for this?" — current bot has no entry for this. LLM
   reasons from: brand voice + photography categories + Marian/family
   register + platform dimensions + 60-30-10 rule for digital + the
   younger-audience research. Returns a specific brief.

4. **Genuine follow-up depth.** Right now if a user clicks the "why blue
   yellow ikea" follow-up, they get a different prewritten answer that
   doesn't reference the previous one. LLM can say: "Earlier I mentioned
   the Mehrabian & Russell color-affect research. Here's how that connects
   to the blue-yellow pairing specifically…"

5. **Cross-document reasoning.** Ministry-center asks "we're doing a
   Family Rosary print booklet for a Filipino parish — Tagalog text,
   donor sponsorship logos on back cover, photos of real families.
   Which fonts and palette weights?" — LLM combines the print-context
   palette (White 60%, HCFM Blue 30%, Muted Gold 10%) + stationery
   specs + co-branding rules + photography rules + Filipino cultural
   notes. Current bot would need 5 separate pre-written answers
   stitched together by the user.

6. **Genuine "didn't understand" handling.** Current bot is binary:
   confident match or "I don't know." LLM can say "I'm not sure — is
   this about [interpretation A] or [interpretation B]?" and let the
   user clarify.

7. **Same answer in three languages.** Translation becomes trivial —
   prompt the LLM in Spanish or Tagalog and get the same answer in
   that language, grounded in the same brand knowledge.

---

## 3. The architecture (RAG with answer grounding)

This is the standard "retrieval-augmented generation" pattern. The LLM
isn't doing brand-design improv — it's a senior brand consultant who has
the brand book open in front of them.

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER (HubSpot CMS page, no JS framework change)                 │
│                                                                     │
│  Chat input → POST /api/brand-chat                                  │
│    { query, session: { name, role, topics, asked } }                │
│                                                                     │
│  ← Streamed response (Server-Sent Events)                           │
│    Markdown text rendered as it arrives                             │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│  EDGE FUNCTION (HubSpot Serverless OR Cloudflare Worker OR Vercel)  │
│                                                                     │
│  1. Retrieve: top 5 most-relevant v3 KB entries + the brand-system  │
│     summary (a fixed ~3KB doc of color/font/logo/voice fundamentals)│
│                                                                     │
│  2. Build prompt: system instructions + retrieved KB + session      │
│     context + user query                                            │
│                                                                     │
│  3. Stream Anthropic API → caller (browser)                         │
│                                                                     │
│  4. Log query + response for offline review (PII-stripped)          │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│  ANTHROPIC API (claude-haiku-4-5 or claude-sonnet-4-5)              │
│  Streaming completion with the brand-knowledge context              │
└─────────────────────────────────────────────────────────────────────┘
```

### Why this shape

- **Browser stays simple.** Existing chat UI keeps working; only the
  network call changes. Session state (name/role/history) is still
  client-side, sent in each request.
- **Edge function does retrieval.** Keeps the API key off the client
  (critical — never expose Anthropic keys in browser JS). Lets us run
  retrieval and grounding logic server-side.
- **HubDB stays the source of truth.** The v3 KB rows become the
  retrieval corpus. No new database. Edits in HubSpot reflect in the
  bot's answers within minutes.
- **Streaming**, not batch. User sees the answer appearing word-by-word
  like ChatGPT — feels alive, not laggy.

### What gets sent to the LLM each turn

The prompt template:

```
You are the HCFM Brand Portal assistant. You help ministry-center staff,
designers, vendors, and partners apply the 2026 HCFM brand correctly.

## YOUR REGISTER
- Warm, direct, declarative. No marketing-speak. Names specifics.
- For practical questions: give the specific answer first, then explain why.
- For "why" questions: short answer (1-2 sentences) → the science /
  industry parallel / Catholic angle when relevant / what we still use
  the alternative for.
- Never invent rules. If the brand book doesn't say, say so.

## USER CONTEXT
Name: {name}  Role: {role}
Earlier in this conversation they've asked about: {topics}

## BRAND KNOWLEDGE
{retrieved KB entries — top 5 most-relevant v3 rewrites + brand-system summary}

## USER QUERY
{query}

## RESPONSE FORMAT
- Plain HTML (use <p>, <ul>, <strong>, <em> only; no headings).
- 200-1500 words depending on question depth.
- End with "you might also want to know: ..." if useful follow-ups exist.
```

The retrieval step: cosine-similarity over keyword embeddings is overkill
for 271 entries. Simple TF-IDF or even our existing token-overlap matcher
selects the top 5 entries. Total context: ~10-15KB of KB + ~500 bytes
session = under 5K tokens.

### Output rendering

LLM returns HTML (we constrain via the prompt). Browser injects it into
the chat panel exactly like it does today. The existing `parseAnswer`,
`buildPreface`, etc. logic still runs — the LLM's output can have the
same `<div class="chat-followups-data">` hidden marker if we want it to
suggest specific KB topics as next pills.

---

## 4. The three deployment options (with tradeoffs)

### Option A — HubSpot Serverless Function (simplest, slowest)

HubSpot has serverless functions inside CMS Hub. We add a `.functions/`
folder to the theme with a TypeScript handler. URL is automatic:
`/_hcfm/api/brand-chat`. Authenticated via the existing HubSpot session.

**Pros:** Zero new infrastructure. Same deploy story as the theme
(`hs cms upload`). HubSpot manages secrets via a UI.

**Cons:** Slower cold starts (~1-2s). Limited to 10s execution per
request — we'd need to ensure streaming responses keep the connection
warm. May not support SSE natively (would need to check).

**Cost:** Included in CMS Hub Pro+ (which we already pay for).

### Option B — Cloudflare Worker (fastest, cheapest)

Spin up a Cloudflare Worker at `chat.hcfm.org` or similar. ~10ms cold
start. Native SSE support. Free tier handles 100,000 requests/day.

**Pros:** Fast. Cheap. Battle-tested for this exact pattern.

**Cons:** New infrastructure to maintain. Need to set up DNS and
CORS for hcfm.org → workers.dev. Slightly more setup.

**Cost:** Free for our volume. Anthropic API costs separate (below).

### Option C — Vercel / Netlify Function (middle ground)

Deploy the same handler as a Vercel or Netlify function. Similar to
Cloudflare in performance, slightly more setup than HubSpot serverless.

**Cost:** Free tier covers our volume.

**Recommendation:** **Option B (Cloudflare Worker).** Best
price/performance, native SSE, separates the AI cost from HubSpot
billing, and gives us a dedicated `chat.hcfm.org` endpoint we can
monitor and rate-limit independently.

---

## 5. Cost model

### Anthropic API pricing (current, May 2026)

Claude Haiku 4.5: $1/M input tokens, $5/M output tokens.
Claude Sonnet 4.5: $3/M input tokens, $15/M output tokens.

### Per-query cost estimate

Average query:
- System + retrieved KB: ~5,000 tokens input
- Session context: ~500 tokens input
- User query: ~30 tokens input
- Response: ~600 tokens output (~450 words)

**Haiku 4.5:** (5,530 × $1/M) + (600 × $5/M) = **$0.0085 per query**.
**Sonnet 4.5:** (5,530 × $3/M) + (600 × $15/M) = **$0.025 per query**.

### Monthly cost at different usage levels

| Queries/month | Haiku 4.5 | Sonnet 4.5 |
|---|---|---|
| 500 (one ministry center using it daily) | $4 | $13 |
| 2,000 (~all centers occasionally) | $17 | $50 |
| 10,000 (heavy ongoing use) | $85 | $250 |
| 50,000 (every visitor uses it) | $425 | $1,250 |

**Recommendation:** Start with Haiku 4.5. It's plenty smart enough for
brand Q&A grounded in our KB. Reserve Sonnet for specific scenarios
(e.g. cross-cultural campaign briefs that need deeper reasoning).

### Caching to reduce cost further

Anthropic supports prompt caching: the system prompt + KB context is
~5,500 tokens that doesn't change between users. Cached input tokens
cost ~10% of the regular rate.

With caching, average cost drops to roughly:
- Haiku: $0.0015/query → **$15/month at 10K queries**
- Sonnet: $0.005/query → **$50/month at 10K queries**

---

## 6. The grounding strategy (so the LLM doesn't make stuff up)

This is the most important section. An ungrounded LLM is dangerous on a
public brand portal because it will confidently invent rules that don't
exist in the brand book.

**Rule 1 — Retrieval is mandatory.** Every query triggers a retrieval
against the v3 KB before the LLM call. The LLM sees the actual brand
text in its context window.

**Rule 2 — Strict prompt.** The system instruction includes:

> If the brand knowledge above doesn't directly cover the user's
> question, say "I don't have that documented in the brand book —
> let me put you in touch with Victoria and Emmanuel directly" and
> escalate. Never invent rules.

**Rule 3 — Citations.** The LLM is asked to cite which KB entry each
claim came from, formatted as `<sup class="kb-cite">[Yellow Gold rules]</sup>`.
The browser renders these as small interactive footnotes that scroll
to the source entry when clicked. Builds trust + audit trail.

**Rule 4 — Refusal on edge cases.** The system prompt explicitly lists
"never claim research findings without specific citation; never invent
historical claims about Father Peyton; never speculate about
ministry-center cultural sensitivities — defer to local leadership."

**Rule 5 — Human escalation path.** Every answer has a quiet "doesn't
match what you needed? → email Victoria & Emmanuel" link.

**Rule 6 — Offline review.** Every query + response is logged
(PII-stripped) for monthly review. We catch hallucinations or bad
behavior post-hoc and tune the prompt.

---

## 7. Privacy and data governance

HCFM serves Catholic families across 18 countries. Some considerations:

- **What goes to Anthropic.** The user's typed query + their session
  state (name they gave us, role they gave us, list of topics they
  asked about). This is the same data we already store in
  sessionStorage. We do NOT send IP address, identity, geolocation, or
  any HubSpot CRM data.
- **What does NOT go to Anthropic.** Browser history. Cookies. CRM
  contact details. Any data about the user beyond what they typed into
  the chat.
- **Anthropic's data policy.** Their commercial API does not train
  models on submitted data. Standard 30-day server-side log retention
  for trust/safety, then deletion.
- **GDPR posture.** Our edge function logs queries pseudonymously
  (random session ID, no name even if user gave us one). 90-day
  retention. User can request deletion via the existing footer privacy
  contact.
- **Vatican/Holy See data sensitivity.** None of the brand-Q&A traffic
  involves diocesan, sacramental, or pastoral data. Brand-design
  questions only. Low risk.
- **What to disclose.** Add a small disclosure to the chat panel:
  *"This assistant uses AI to answer your questions. Your messages are
  sent to Anthropic's Claude API for processing. We don't log
  personally identifying information."*

---

## 8. The migration path (phased, low-risk)

We do NOT switch off the keyword bot. We layer the LLM on top.

### Phase 0 — Today
v3.1 keyword bot live. Deep answers + name + preface + followups.
Baseline working, no LLM involvement.

### Phase 1 — Add LLM as fallback (~2 days work)
When the keyword matcher returns `null` (no confident match), instead
of "I don't have a confident answer," fall through to the LLM. User
sees a streamed response. Logging captures every fallback query so we
can review what novel questions are being asked.

**Risk:** Very low. LLM only fires for unmatched queries. Cost ~$0.01
per fallback. If quality is bad, easy to revert.

### Phase 2 — Promote LLM to primary, keep KB as ground (~2 days)
Every query triggers retrieval + LLM. The 19 deep v3 entries become
the LLM's "voice training" — it learns to write like that register.
Keyword bot kept as cache for repeat questions.

**Risk:** Medium. Need to confirm answer quality is at or above v3.1.
A/B test in production for a week before fully cutting over.

### Phase 3 — Personalization layer (~3 days)
Use the captured role to actually tailor answers. "Marketing lead in
Philippines" gets answers framed for that role automatically. Add a
small admin UI where Victoria can flag "good answer" / "bad answer"
on the query log — feedback loop into prompt tuning.

### Phase 4 — Multi-language (~1 day per language)
Spanish for Latin America centers. Tagalog for Philippines. No code
change beyond a language picker — the LLM translates on the fly.

### Phase 5 — Browse-aware (~1-2 days)
When the user is on a specific brand-portal page (e.g. Colors), the
bot knows that. Questions like "is this allowed?" or "explain this
more" become possible because the bot has the page context.

**Total time to a real "mini AI":** 8-12 working days across phases.
Most value lands in phases 1 and 2 (the first 4 days).

---

## 9. Specific implementation notes (so this isn't just talk)

### Code I'd add

```
/Brand_Page_Mockup/
├── chatbot/
│   ├── worker.ts                ← Cloudflare Worker handler
│   ├── retrieval.ts             ← KB retrieval + prompt assembly
│   ├── prompts/
│   │   ├── system.md            ← Hand-tuned system prompt
│   │   └── refusal_examples.md  ← Examples for the LLM
│   ├── package.json
│   └── wrangler.toml            ← Cloudflare config
└── theme/_hcfm-brand-portal/js/
    └── hcfm-scripts.js          ← Modify handleChatQuery to POST + stream
```

### The Worker handler (sketch — not full code)

```typescript
import Anthropic from '@anthropic-ai/sdk';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const { query, session } = await req.json();

    // 1. Retrieve top-5 KB entries
    const kb = await fetchKBFromHubDB(env.HUBSPOT_TOKEN);  // cached 5min
    const matches = retrieveTopK(kb, query, 5);

    // 2. Build the prompt
    const messages = [{
      role: 'user',
      content: assemblePrompt({ query, session, matches }),
    }];

    // 3. Stream from Anthropic
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_KEY });
    const stream = await anthropic.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    });

    // 4. Stream back as SSE
    return new Response(toSSE(stream), {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  },
};
```

### The browser change (sketch)

```javascript
// In handleChatQuery, replace the synchronous rankMatches → addChatMessage with:
async function handleChatQueryLLM(query) {
  const session = {
    name: chatSession.name,
    role: chatSession.role,
    topics: chatSession.topics,
    asked: Array.from(chatSession.askedKeys),
  };

  const res = await fetch('https://chat.hcfm.org/brand', {
    method: 'POST',
    body: JSON.stringify({ query, session }),
  });

  // Stream the response into a new bot message
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const botMsg = startBotMessage();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    botMsg.appendChunk(decoder.decode(value));
  }
  finalizeBotMessage(botMsg);
  rememberTopic(extractTopic(botMsg));
}
```

---

## 10. The risks I'd flag for Victoria and Margaret before shipping

1. **Hallucination on novel questions.** Even with grounding, the LLM
   can confidently misstate rules. Mitigation: refusal-first prompt
   tuning + monthly query review + the citation footnotes (so users
   can verify).
2. **Voice drift.** LLM answers might subtly diverge from HCFM's voice
   over time as the model evolves. Mitigation: the v3 deep rewrites
   are the gold-standard voice anchors in the prompt. Periodic side-by-side
   reviews.
3. **Cost spike.** A bot, a partner agency, or a spammer could hit the
   endpoint 10,000 times overnight. Mitigation: rate limit per IP +
   per session + daily cap. Cloudflare provides these as primitives.
4. **API dependency.** If Anthropic has an outage, the bot is down.
   Mitigation: keep the keyword bot as fallback. When LLM fails,
   degrade gracefully back to v3.1 behavior.
5. **Catholic-specific sensitivity.** A user might ask theologically
   adjacent questions ("can I use Marian Blue for a non-Marian
   campaign?"). Mitigation: prompt instructs the LLM to defer to
   ministry-center leadership on anything pastoral; flag and escalate.
6. **Cross-cultural missteps.** Asked about Filipino vs Ugandan
   imagery customs, the LLM might get it wrong. Mitigation: prompt
   explicitly tells the LLM to defer to local ministry-center
   leadership on cultural specifics rather than guess.
7. **Public perception.** Some Catholic audiences are AI-skeptical.
   Mitigation: disclose plainly ("this assistant uses AI"), make
   refusal language clear ("I don't have that documented; let me
   connect you with the team"), and keep the human-escalation path
   visible at all times.

---

## 11. Decision recommended

**Ship Phase 1 (LLM as fallback only) as a 2-day spike.**
- Zero risk to current bot
- Quantifies real value: we see exactly which queries the keyword bot
  can't handle and how the LLM handles them
- Builds the worker infrastructure we'd reuse for Phase 2+
- Cost cap: $50 in the first month, hard ceiling we set in Anthropic's
  console

**After 2 weeks of data: decide whether to promote to Phase 2.**
- If LLM fallback adds clear value (covers ≥30% of unmatched queries
  with good answers, voice stays on-brand): promote
- If quality is mixed: tune the prompt or escalate-only
- If quality is bad: stay on v3.1 and document why

This is the safest way to learn whether the LLM architecture actually
delivers on the "mini AI" vision Emmanuel described — without
committing to a full rewrite based on hope.

---

## 12. Open questions for Victoria and Margaret

1. **Anthropic account.** Does HCFM already have an Anthropic API
   account? (Easton may. If not, ~10 min to set one up; payment
   typically via Easton Creatives' card.)

2. **Hosting choice.** Cloudflare Worker (recommended) or HubSpot
   Serverless (simpler operationally)? Either works.

3. **Disclosure language.** What should we tell users about AI use?
   Default proposal: small footer text in the chat panel saying "This
   assistant uses AI. Your messages help us improve the brand book.
   We don't store personal info." Victoria's call on tone.

4. **Languages at launch.** English only at Phase 1-2, or do we add
   Spanish immediately for Father Joe's audience? (Trivial to add;
   just a UI toggle.)

5. **Citation rendering style.** Footnotes (`[Yellow Gold rules]`),
   inline links, or hidden? My preference: footnotes that scroll to
   the cited section when clicked. Builds trust + teaches users where
   things are.

6. **The "Catholic sensitivity" line.** Should the LLM be allowed to
   discuss anything beyond brand-design? Or strict: "this is a brand
   bot, for theology / pastoral questions please contact your ministry
   center"? My instinct is strict — keeps the bot in its lane and
   reduces risk.

7. **Budget ceiling.** What's the monthly cap? Recommend $50 for
   Phase 1 spike, $200/mo cap for Phase 2+. Easy to adjust in
   Anthropic's console.

---

## TL;DR

- v3.1 is at the ceiling of what a keyword-matched bot can do
- An LLM-backed version delivers the "thinks ahead / adapts to context
  / handles novel questions" behavior Emmanuel asked for
- Architecture is standard RAG: retrieve top-5 KB entries, prompt
  Claude Haiku 4.5 with strict grounding, stream back to browser
- Cost: $15-50/mo at expected volume with prompt caching
- Risk: low if we phase it (fallback first, then primary)
- 2 days of work to ship Phase 1, 2 weeks of measured data to decide
  on Phase 2+

**Recommendation:** ship Phase 1 as a learning spike. Decide on
Phase 2 based on real query data.
