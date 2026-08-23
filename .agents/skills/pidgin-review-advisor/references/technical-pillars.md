# Technical Pillars & Architecture Reference

How Supabase, ElevenLabs, Gemini, GitHub Actions, Railway and Cloudflare fit together in
**ChokePidgin / iSpeakPidgin**.

> **Read this as a map, not as evidence.** Architecture drifts faster than the prose describing
> it — this file has been wrong before. Verify anything you are about to assert against the
> source. Where a claim below is known to have drifted from the code, it is flagged inline.

---

## 1. Supabase

All content lives in Supabase Postgres + Storage. There are no local JSON content files (config
like `railway.json` is the only exception, and `tools/data/curated-missing-terms.json` is a
staging file for terms awaiting ingestion, not a content source).

### Tables
- `dictionary_entries` — columns: `id, pidgin, english (array), category, difficulty, usage,
  examples, pronunciation, origin`.
- `phrases`, `stories` (`pidgin_text`, `english_translation`, `cultural_notes`), `pickup_lines`,
  `pickup_line_components`.
- `quiz_questions`, `wordle_words`, `crossword_words`, `crossword_puzzles`.
- `user_profiles`, `user_progress`, `user_xp_transactions`, `user_badges` — gamification state.
- `user_suggestions` — community submissions awaiting review (`status = 'pending'`).
- `translation_cache` — keyed by `md5_hash` + `voice_id`, mapping to `audio_filename` in the
  `audio-assets` bucket.

Row counts change constantly. Measure them (`--live`); never quote a number from documentation.

### Client construction — an important trap
`config/supabase.js` falls back to a **mock client** backed by
`tools/testing/mock-supabase-data.json` when credentials are absent, and exports `isOfflineMock`
to say so. It also carries a hardcoded project-URL fallback. Any tool that reports "row counts"
must either check `isOfflineMock` or build its own client — otherwise it silently reports fixture
data (88 dictionary entries) as production truth. The audit script builds its own client for
exactly this reason.

### Caching
`server.js` holds an in-memory dictionary cache with a 5-minute TTL in front of Supabase.

---

## 2. ElevenLabs TTS

### Voice policy
`f0ODjLMfcJmlKfs7dFCW` (**Kimo**) is the only approved voice. The previous Aunty and Braddah
voices were removed for poor acoustic quality and **must not be reintroduced**. The audit script
scans `src/`, `routes/`, `services/`, `tools/` for voice-ID assignments and flags anything else.

Model `eleven_multilingual_v2`; voice settings `stability 0.5`, `similarity_boost 0.75`,
`style 0.0`, `use_speaker_boost true`.

### Where phonetics are applied — corrected
The phonetic substitution map is **client-side only**, defined in
`src/components/speech/elevenlabs-speech.js`. `routes/tts.js` does *not* run substitutions; it
takes `req.body.text` (already phoneticized by the browser) plus `originalText` and forwards the
former to ElevenLabs. Consequences worth surfacing in a review:

- Non-browser callers (`tools/audio/*`, any server-side synthesis) must phoneticize themselves or
  they get mainland pronunciation.
- A second, hand-copied version of the map lives in `tools/testing/pronunciation-audit.js` with
  a comment claiming it is identical. It is not — the copies drift, so the audit tool's coverage
  percentage describes a map users never hear. This is the highest-value cleanup in the pillar.

### Request lifecycle (`POST /api/text-to-speech`)
1. Receive `text` (already phoneticized), optional `voiceId` (defaults to Kimo).
2. `md5(normalizedText)` → look up `translation_cache` by `md5_hash` + `voice_id`.
3. Hit → stream the cached object from the `audio-assets` bucket.
4. Miss → call ElevenLabs, stream the response, then persist to Storage as
   `cached_{voiceId}_{hash}.mp3` and upsert `translation_cache`.

---

## 3. Gemini AI (`services/gemini.js`, `routes/ai.js`)

- **`/api/ai/talk-story`** — Kimo persona, contextual vocabulary injected into the system prompt,
  multi-turn history, JSON response (`pidgin`, `translation`, `hint`, `voiceId`), awards XP and
  the `talk_story_pro` badge.
- **`/api/ai/translate`** — bidirectional English ↔ Pidgin with tone modulation (`light`,
  `standard`, `heavy`), RAG-grounded against the live dictionary cache.
- **Model IDs are not centralized.** Several distinct `gemini-*` IDs appear across the AI source
  (a mix of pinned versions and a floating `-latest` alias). Each is a separate quota, latency and
  quality profile; a floating alias can also change behavior with no commit. Worth consolidating
  behind one constant or env var. Confirm the current set with
  `grep -rhoE "gemini-[a-z0-9.\-]+" services routes | sort -u` rather than trusting this list.
- **Protection** — express-rate-limit (`aiChatLimiter`, `semanticSearchLimiter`,
  `questionSubmitLimiter`) plus domain verification.

---

## 4. GitHub Actions (`.github/workflows/ci.yml`)

Runs on pushes to `main` and all PRs, with in-progress runs cancelled per ref:

1. `npm ci`
2. Load check — `node --check` on `server.js`/`build.js`, then `require()` every route, service
   and middleware module to catch wiring breakage.
3. `npm run build` (Railway-equivalent).
4. Validation suite — `npm test` and `npm run test:translator`.

**Step 4 is conditional on `env.SUPABASE_ANON_KEY != ''`.** Without that repo secret the step is
skipped and CI reports green having run zero tests — a false all-clear on every PR. The anon key
is a public client key already shipped to browsers, so storing it as an Actions secret is safe.
Check whether it is set before describing CI as protective.

---

## 5. Railway, Express & the Cloudflare edge

### Origin
- `railway.json` (Dockerfile builder), `Dockerfile` on `node:20-alpine`, port 3000.
- `server.js`: Helmet CSP — `mediaSrc` must include `blob:` and the Supabase origin or audio
  playback breaks; `app.set('trust proxy', 2)` so rate limiting keys on the real client IP;
  static `setHeaders` sets `no-cache, no-store, must-revalidate, max-age=0` on `sw.js`.
- `build.js`: wipes `public/`, minifies JS (Terser), optimizes images (Sharp), injects the shared
  navigation/footer templates, generates static pages.

### Edge — where reviews most often go wrong
`chokepidgin.com` is proxied through Cloudflare, so **the headers `server.js` sets are not
necessarily the headers users receive.** Cloudflare's default Browser Cache TTL overrides origin
`Cache-Control`, including the `no-store` on `sw.js`; the edge then pins an old service worker,
and because a service worker's `fetch()` is governed by the CSP of *its own script response*, the
stale worker also serves a **stale CSP**. Newly-allowlisted origins get blocked with
`sw.js:NNN … violates the following Content Security Policy directive: connect-src …` errors that
do not match the CSP in `server.js`. It presents as "the browser refuses to load the latest
updates."

Two zone settings exist to prevent this and **must not be removed**: a cache rule bypassing cache
for `/sw.js`, and Browser Cache TTL set to *Respect Existing Headers*. IDs and the full write-up
are in `CLAUDE.md`.

Always compare edge against origin before concluding anything about deployed headers:

```bash
curl -sSI https://chokepidgin.com/sw.js | grep -i "cache-control\|cf-cache-status\|age:"
curl -sSI "https://chokepidgin.com/sw.js?cb=$RANDOM" | grep -i "cache-control\|cf-cache-status"
```

`cf-cache-status: HIT` with a non-zero `age` on a file that should be fresh means the edge is
stale. Purge is by exact URL only (max 30 per request) — prefix and tag purges are Enterprise-only.
The audit script's `--net` flag automates this comparison.
