---
name: pidgin-review-advisor
description: >-
  Audits the ChokePidgin / iSpeakPidgin application across Supabase, ElevenLabs TTS, GitHub CI/CD,
  Gemini AI, Hawaiian Pidgin language & pronunciation, vocabulary/slang expansion, and the
  Railway + Cloudflare delivery path. Produces an evidence-backed health assessment and 3
  prioritized options for what to work on next. Use when asked to review, audit, health-check,
  or "what should I work on next" for this app.
---

# Pidgin Review & Enhancement Advisor

Audit the app, report what is actually true about it, and offer three grounded choices for the
next piece of work.

## Non-negotiable: evidence before assessment

This skill exists because "what should I build next?" is easy to answer badly — with plausible
recommendations that sound informed and aren't. Two rules prevent that:

1. **Every claim traces to something observed in this session** — a check in the audit report, a
   `file.js:line`, a command's output, or a live row count. Prose in this repo's docs (including
   this skill and `CLAUDE.md`) is a *hypothesis to verify*, not evidence. Row counts especially:
   the numbers in `CLAUDE.md` are a snapshot from whenever it was written.
2. **Unmeasured is never "healthy."** If credentials, network, or a long-running suite were
   unavailable, the pillar is `PARTIAL` and the report says which measurement is missing. A
   green matrix built from unrun checks is the single worst output this skill can produce.

Never state a percentage, row count, or pass rate you did not observe. If you want one, run the
thing that produces it.

## Step 1 — Run the diagnostic

```bash
node .claude/skills/pidgin-review-advisor/scripts/audit-pidgin-app.js --live --net
```

Flags: `--live` queries Supabase for real row counts and content-quality metrics (needs
`SUPABASE_URL` + `SUPABASE_ANON_KEY`; it never falls back to mock data). `--net` probes the
Cloudflare edge against the Railway origin. `--json` emits the machine-readable report.
`--strict` exits non-zero on any FAIL. Without `--live`/`--net` those checks report `SKIP`,
which you must carry through to the review as unmeasured.

The script measures rather than checks for file existence: whether the phonetic map has a single
owner or is duplicated across consumers, unapproved ElevenLabs voice IDs, whether CI's test step is gated
behind a possibly-absent secret, dictionary field completeness and duplicates, curated-term
backlog vs what is actually in Supabase, CSP/`sw.js`/`trust proxy` hardening, and edge-vs-origin
cache divergence.

## Step 2 — Fill the gaps the script cannot reach

The script is deliberately fast and side-effect-free. Depending on what it flagged and what the
user cares about, add targeted evidence:

| Question | Command |
| :--- | :--- |
| Do the suites actually pass? | `npm test` and `npm run test:translator` |
| Real phonetic coverage over the dictionary | `node tools/testing/pronunciation-audit.js` |
| Broken links / SEO regressions on the built site | `npm run build && node tools/testing/audit-site.js` |
| What are users searching for that we lack? | `npm run seo:loop` |
| Does the production build still work? | `npm run build` |
| What changed recently? | `git log --oneline -20` |

Read the source before asserting anything about behavior. A finding like "rate limiting is
missing" must cite the file you looked at.

## Step 3 — Assess the 7 pillars

1. **Supabase** — content volume and quality (missing pronunciations, missing examples, duplicate
   terms), RLS/key separation, audio cache coverage.
2. **ElevenLabs TTS** — Kimo (`f0ODjLMfcJmlKfs7dFCW`) is the only approved voice; Aunty and
   Braddah were removed for poor acoustic quality and must not return. Phonetic map integrity,
   where substitution is applied, cache hit economics.
3. **GitHub CI/CD** — does CI actually run tests, or is the step conditional; suite health; build
   artifact hygiene.
4. **Gemini AI** — model ID sprawl, persona quality in `/api/ai/talk-story`, RAG grounding in
   `/api/ai/translate`, rate limiting and abuse cost.
5. **Pidgin linguistics** — preverbal markers (*stay*, *wen*, *go*, *like*), negation (*nevah*,
   *no can*), copula deletion, ʻokina/kahakō handling, tone profiles.
6. **Vocabulary & slang** — search-gap backlog, pending community submissions, staged curated
   terms not yet ingested.
7. **Railway + Cloudflare delivery** — Dockerfile/env/Helmet CSP, and the edge layer: Cloudflare
   sits in front of Railway, so **the headers `server.js` sets are not necessarily the headers
   users receive**. See `CLAUDE.md` for the `/sw.js` bypass rule and the stale-SW/CSP failure mode.

Severity rubric — use it literally, so the colors carry information:

| | Meaning |
| :--- | :--- |
| 🔴 FAIL | Users are affected now, or a safeguard is absent (audio blocked by CSP, CI runs no tests, table unreadable). |
| 🟡 WARN | Real defect or debt with a bounded blast radius (duplicated definitions, duplicate entries, model sprawl). |
| ⚪ PARTIAL | Verified in part; at least one measurement could not be taken. Name the missing one. |
| 🟢 OK | Measured this session and sound. |

## Step 4 — Report

```markdown
# 🌺 ChokePidgin Application Review

**Evidence base:** [audit flags used, suites run, what could NOT be measured and why]

## Executive Summary
[3-4 sentences: overall health, the one thing most worth fixing, and the biggest blind spot.]

## Pillar Assessment

| Pillar | Status | Measured Evidence | Opportunity |
| :--- | :---: | :--- | :--- |
| Supabase | 🟢/🟡/🔴/⚪ | [numbers or file:line you observed] | [gap] |
| … | | | |

## Findings
[FAIL first, then WARN. Each: what is wrong, the evidence, the blast radius, the fix.]

## Not Measured
[Explicit list. This section is never empty unless every check ran with --live --net.]
```

## Step 5 — Offer exactly 3 options

Build the options **from the findings**, not from a menu of themes. Rules:

- Each option must be traceable to at least one finding above; if a theme has no finding behind
  it, it is not an option this time.
- The three must be genuinely different in kind — different risk, effort, and payoff — so the
  choice is real. If the findings all cluster in one area, make the options differ by *depth*
  (fix the instance / fix the class / rebuild the mechanism) and say so.
- Recommend one, with a reason tied to severity or user impact. Do not order them by effort.
- Each option gets: title, why-now (citing the finding), 3-4 concrete deliverables naming files,
  effort estimate, and how you would verify it worked.
- If a FAIL exists, the recommended option must address it or explain why not.

Then present the choice with `AskUserQuestion` (Claude Code). Under Antigravity the equivalent
tool is `ask_question` with `is_multi_select`.

```json
{
  "questions": [{
    "question": "Which improvement should I take on next?",
    "header": "Next work",
    "multiSelect": false,
    "options": [
      { "label": "<Option 1 title> (Recommended)", "description": "<finding it resolves + effort>" },
      { "label": "<Option 2 title>", "description": "<finding it resolves + effort>" },
      { "label": "<Option 3 title>", "description": "<finding it resolves + effort>" }
    ]
  }]
}
```

Once the user picks, execute it fully — including the verification step you promised.

## References

- [Technical Pillars & Architecture](./references/technical-pillars.md) — how Supabase, ElevenLabs,
  Gemini, CI, Railway and Cloudflare actually fit together, and where the docs have drifted from code.
- [Linguistics & Slang Taxonomy](./references/linguistics-and-slang.md) — grammar rules, phonetic
  conventions, and slang expansion candidates.
- [3-Option Framework](./references/three-option-framework.md) — how to turn findings into options.
- [Diagnostic script](./scripts/audit-pidgin-app.js)

## Keeping the installed copies in sync

This skill can be installed in three places, and **`~/.claude/skills/` shadows the project copy** —
a stale copy there silently overrides every edit made in the repo, which is exactly how this skill
once ended up recommending two voices that had been deleted for poor quality.

| Location | Used by |
| :--- | :--- |
| `.claude/skills/` (in repo) | Claude Code — **source of truth** |
| `.agents/skills/` (in repo) | Antigravity |
| `~/.claude/skills/` | Claude Code user-level install; takes precedence over the project copy |

After editing the source of truth:

```bash
bash .claude/skills/pidgin-review-advisor/scripts/sync-skill.sh         # push to every target present
bash .claude/skills/pidgin-review-advisor/scripts/sync-skill.sh --check # verify, non-zero if drifted
```

The user-level copy is synced only if it already exists — the script will not create one, since a
project-specific skill should not appear in unrelated projects. If you review a report that
contradicts the repo, check `--check` first: you may be reading output from a shadowed copy.

The diagnostic script finds the repo from its own path, then the working directory, then
`$PIDGIN_REPO_ROOT` — so it works from any of the three installs, and exits 2 with an explanation
rather than guessing when it cannot locate the repo.
