# AGENTS.md
Guidance for Antigravity (AGY) and agentic workflows in ChokePidgin / iSpeakPidgin.

## Available Workspace Skills
- **`pidgin-review-advisor`** (`.agents/skills/pidgin-review-advisor/SKILL.md`):
  - Reviews the complete application across all 7 pillars: Supabase, ElevenLabs TTS, GitHub CI/CD, Gemini AI API, Hawaiian Pidgin language & pronunciation, vocabulary expansion (new words, slang, phrases), and Railway deployment.
  - Generates 3 prioritized next-work options.
  - Automated diagnostic helper: `node .agents/skills/pidgin-review-advisor/scripts/audit-pidgin-app.js`.

## Core Build & Test Commands
```bash
# Production build (build.js -> public/)
npm run build

# Fast build (skips heavy page generation)
npm run build:quick

# Run all test validation suites
npm test

# Run phonetics & pronunciation audit
node tools/testing/pronunciation-audit.js
```

## Critical Architecture Rules
1. **Never edit `public/` directly**: Always edit in `src/`. `build.js` wipes `public/` on build.
2. **Template Injection**: Always use `<!-- NAVIGATION_PLACEHOLDER -->` and `<!-- FOOTER_PLACEHOLDER -->` in HTML pages.
3. **Data Source**: All content data resides in Supabase. Never create local JSON data files for content.
