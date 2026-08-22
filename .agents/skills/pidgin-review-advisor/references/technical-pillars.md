# Technical Pillars & Architecture Reference

This reference documents the technical architecture of **ChokePidgin / iSpeakPidgin**, detailing how Supabase, ElevenLabs, Gemini AI, GitHub Actions, and Railway interact.

---

## 1. Supabase Architecture

All application data is hosted in Supabase PostgreSQL and Supabase Storage.

### Data Flow & Cache Strategy
- **Dictionary Cache (`server.js`)**: In-memory cache in Express with a 5-minute TTL to reduce database load on high-traffic dictionary and translation searches.
- **Audio Assets Storage**: Bucket `audio-assets` stores pre-generated `.mp3` files.
- **Translation Audio Cache (`translation_cache` table)**:
  - Keyed by `md5_hash` (MD5 hash of normalized text) and `voice_id`.
  - Maps to `audio_filename` in the `audio-assets` bucket.
  - Avoids redundant ElevenLabs API credit spend.

### Key Database Tables
- `dictionary_entries`: Core Pidgin terms, definitions, phonetic guide, examples, categories, difficulty levels.
- `phrases`: Common multi-word phrases and idioms.
- `stories`: Longer cultural stories with bilingual side-by-side text.
- `pickup_lines` & `pickup_line_components`: Dynamic pickup line generator source data.
- `quiz_questions`, `wordle_words`, `crossword_words`: Interactive game assets.
- `user_profiles`, `user_progress`, `user_xp_transactions`, `user_badges`: Gamification state.

---

## 2. ElevenLabs Text-to-Speech Engine

### Voice Configuration
- **Model**: `eleven_multilingual_v2`
- **Voice Settings**:
  - `stability`: `0.5`
  - `similarity_boost`: `0.75`
  - `style`: `0.0`
  - `use_speaker_boost`: `true`
- **Configured Voice IDs**:
  - `f0ODjLMfcJmlKfs7dFCW` (Kimo / Hawaiian local male)
  - `EXAVITQu4vr4xnSDxMaL` (Sarah / Aunty Leilani)
  - `ErXwbc3VNbCc1k9An9bS` (Ethan / Braddah Shane)

### Audio Delivery Lifecycle
1. Request arrives at `POST /api/text-to-speech` with `text` and optional `voiceId`.
2. Compute `md5_hash` of normalized text.
3. Query Supabase `translation_cache` for existing record.
4. If found, stream audio from Supabase `audio-assets` bucket.
5. If not found, run phonetic substitutions, call ElevenLabs REST API, stream response, and asynchronously persist to Supabase Storage and `translation_cache`.

---

## 3. Gemini AI API & Semantic RAG

### Integration Details (`services/gemini.js` & `routes/ai.js`)
- **Model Endpoint**: Gemini 1.5/2.0 REST API via HTTP fetch.
- **Interactive Persona Chat (`/api/ai/talk-story`)**:
  - Injects contextual Pidgin vocabulary matching user query into the system prompt.
  - Multi-turn conversation history with persona-specific guidelines.
  - Strict JSON response format containing `pidgin`, `translation`, `hint`, and `voiceId`.
  - Gamification integration automatically awards 10 XP and unlocks the `talk_story_pro` badge.
- **Semantic Translation (`/api/ai/translate`)**:
  - Bidirectional English $\leftrightarrow$ Pidgin.
  - Supports tone modulation: `light` (tourist-friendly), `standard` (everyday local), `heavy` (broad creole).
  - RAG grounding ensures vocabulary matches verified dictionary entries.

---

## 4. GitHub Actions CI/CD Pipeline

### Workflow Configuration (`.github/workflows/ci.yml`)
- Triggers on `push` to `main` and all Pull Requests.
- Steps:
  1. Node.js environment setup (Node 20.x LTS).
  2. Dependency installation (`npm ci`).
  3. Site build verification (`npm run build`).
  4. Test suite execution (`npm test` in mock offline mode if Supabase secrets unavailable).
  5. Master validation suite (`npm run test:validation`).

---

## 5. Railway Deployment Setup

### Production Hosting Configuration
- **Configuration File**: `railway.json` with Dockerfile builder.
- **Dockerfile**:
  - Base: `node:20-alpine`
  - Installs production dependencies and builds static assets via `node build.js`.
  - Exposes port `3000`.
  - Healthcheck and graceful shutdown.
- **Express Server (`server.js`)**:
  - Security headers via Helmet (configured CSP with `mediaSrc: ["blob:", "https://*.supabase.co"]` for ElevenLabs/Supabase audio playback).
  - Rate limiting on API, translation, AI chat, and question submissions.
  - Trust proxy enabled (`app.set('trust proxy', 2)`) for Cloudflare/Railway reverse proxies.
