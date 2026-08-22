# The 3-Option Recommendation Framework

When the Pidgin Review Advisor completes its multi-pillar evaluation, it must formulate **exactly 3 distinct, actionable, high-impact options** for the user. This framework ensures each option addresses a distinct strategic priority.

---

## Strategic Archetypes for the 3 Options

### 🌴 Option 1: AI & Audio Interactive Experience
- **Focus Area**: ElevenLabs TTS integration, Gemini AI Talk-Story personas, pronunciation engine accuracy, interactive audio playback.
- **Typical Goals**:
  - Add voice selection toggle to all dictionary cards and games.
  - Expand phonetic pronunciation rules for unmapped terms.
  - Pre-generate missing ElevenLabs audio into Supabase `audio-assets`.
  - Enhance Talk-Story tutor with richer character memories and audio response streaming.
- **Target Value**: Maximum user engagement, authentic immersion, and auditory learning.

### 🏄 Option 2: Linguistic Content, Slang & SEO Growth
- **Focus Area**: Supabase vocabulary expansion, missing slang discovery, Search Console gap closure, static entry page generation.
- **Typical Goals**:
  - Ingest 25-50 high-frequency missing terms (Surf slang, Food terms, Youth slang) into Supabase `dictionary_entries`.
  - Run SEO feedback loop (`npm run seo:loop`) to resolve top search query gaps.
  - Re-generate static entry pages (`npm run generate:pages`) and updated XML sitemap (`npm run generate:sitemap`).
  - Add new phrase collections (e.g., "Ordering at Da Drive-In", "Local Etiquette Guide").
- **Target Value**: Increased search traffic, organic discovery, cultural authenticity, and comprehensive reference breadth.

### ⚙️ Option 3: DevOps, Reliability & Full-Stack Architecture
- **Focus Area**: Railway production deployment, Supabase database tuning, GitHub Actions CI validation, security & performance optimizations.
- **Typical Goals**:
  - Audit and tune Supabase PostgreSQL indexes and query latencies.
  - Enhance Dockerfile build caching and Railway healthcheck endpoints.
  - Expand GitHub Actions CI workflow to run automated phonetics and SEO linting.
  - Tighten CSP and rate limiting headers in `server.js` for production scale.
- **Target Value**: Ultra-fast response times, 100% uptime, automated test guarantees, and clean deployment cycles.

---

## Option Specification Schema

Each option presented to the user must include:

1. **Title & Icon**: A catchy, clear headline.
2. **Strategic Theme**: One-line summary of why this work matters now.
3. **Actionable Deliverables**: 3-4 bullet points referencing specific files, tools, or tables.
4. **Estimated Effort & Impact**: e.g., Effort: Low (1-2 hours) / Medium / High | Impact: High (User Retention / Search Growth / Reliability).
5. **Execution Command / Next Step**: Exact prompt or command to start the work immediately.

---

## Interactive Keyboard Selection Integration (`ask_question`)

To provide an effortless terminal/UI experience where the user can navigate with the **Up (↑)** and **Down (↓)** arrow keys and select by hitting **Enter**, the review advisor must trigger `ask_question` with the formulated options:

```javascript
ask_question({
  questions: [{
    question: "Which improvement option would you like to execute next?",
    options: [
      "(Recommended) Option 1: AI Talk-Story & ElevenLabs Audio Expansion",
      "Option 2: Slang & Vocabulary Expansion with Search Feedback Loop",
      "Option 3: Railway Production Hardening, CI/CD & Supabase Optimization"
    ],
    is_multi_select: false
  }]
})
```

