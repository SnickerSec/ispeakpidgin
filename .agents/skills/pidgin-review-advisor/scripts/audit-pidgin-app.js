#!/usr/bin/env node
'use strict';

/**
 * ChokePidgin / iSpeakPidgin diagnostic audit.
 *
 * Design rule: every check must MEASURE something. A check that only asserts a
 * file exists tells the reviewer nothing they didn't already know, and reporting
 * "HEALTHY" from an existence test produces confident, false reviews. Where a
 * measurement needs credentials or the network and can't be taken, the check
 * reports SKIP with the reason — never OK.
 *
 * Usage:
 *   node .claude/skills/pidgin-review-advisor/scripts/audit-pidgin-app.js [flags]
 *
 *   --live     Query Supabase for real row counts / content-quality metrics
 *              (needs SUPABASE_URL + SUPABASE_ANON_KEY; never uses mock data).
 *   --net      Probe the Cloudflare edge vs the Railway origin for chokepidgin.com.
 *   --json     Emit the machine-readable report only (for agent consumption).
 *   --strict   Exit non-zero when any check FAILs (for CI use).
 *   --quiet    Suppress progress lines; print the summary only.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const argv = process.argv.slice(2);
const FLAGS = {
    live: argv.includes('--live'),
    net: argv.includes('--net'),
    json: argv.includes('--json'),
    strict: argv.includes('--strict'),
    quiet: argv.includes('--quiet') || argv.includes('--json')
};

// ---------------------------------------------------------------------------
// Repo location. Tried in order, so the script works wherever the skill is
// installed — including a user-level copy under ~/.claude/skills, which has no
// repo above it and must fall back to the working directory:
//   1. up from this script  (project-local install: .claude/ or .agents/)
//   2. up from the cwd      (global install, invoked from inside the repo)
//   3. $PIDGIN_REPO_ROOT    (explicit override)
// Walking up beats counting '..' segments, which breaks on any depth change.
// ---------------------------------------------------------------------------
function walkUpFor(start) {
    let dir = path.resolve(start);
    for (let i = 0; i < 12; i++) {
        if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, 'server.js'))) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

function findRepoRoot() {
    const override = process.env.PIDGIN_REPO_ROOT;
    if (override && fs.existsSync(path.join(override, 'server.js'))) return override;
    return walkUpFor(__dirname) || walkUpFor(process.cwd()) || null;
}

const REPO_ROOT = findRepoRoot();
if (!REPO_ROOT) {
    console.error([
        '❌ Could not locate the ispeakpidgin repo (needs package.json + server.js).',
        `   Searched above the script (${__dirname})`,
        `   and above the working directory (${process.cwd()}).`,
        '   Fix: run this from inside the repo, or set PIDGIN_REPO_ROOT=/path/to/ispeakpidgin.'
    ].join('\n'));
    process.exit(2);
}

// Zero-dependency .env loader (does not overwrite real environment values).
(function loadEnv() {
    try {
        const envPath = path.join(REPO_ROOT, '.env');
        if (!fs.existsSync(envPath)) return;
        for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
            const idx = trimmed.indexOf('=');
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) process.env[key] = val;
        }
    } catch { /* unreadable .env is not fatal */ }
})();

// ---------------------------------------------------------------------------
// Report model
// ---------------------------------------------------------------------------
const PILLARS = {
    supabase:    'Supabase Database & Content',
    elevenlabs:  'ElevenLabs TTS & Pronunciation',
    cicd:        'GitHub CI/CD & Repo Hygiene',
    ai:          'Gemini AI API',
    linguistics: 'Pidgin Linguistics & Phonetics',
    vocabulary:  'Vocabulary, Slang & SEO Pipeline',
    deploy:      'Railway, Express & Cloudflare Edge'
};

const RANK = { FAIL: 3, WARN: 2, SKIP: 1, OK: 0 };
const report = {
    generatedAt: new Date().toISOString(),
    repoRoot: REPO_ROOT,
    mode: { live: FLAGS.live, net: FLAGS.net },
    pillars: Object.fromEntries(Object.keys(PILLARS).map(k => [k, { title: PILLARS[k], status: 'OK', checks: [] }])),
    findings: []
};

/**
 * @param {'OK'|'WARN'|'FAIL'|'SKIP'} status
 * check.finding  — what is wrong (omit when OK/SKIP)
 * check.fix      — the concrete next action
 * check.metrics  — numbers the reviewer may quote
 */
function record(pillar, check) {
    const entry = { status: 'OK', evidence: [], ...check };
    report.pillars[pillar].checks.push(entry);
    if (RANK[entry.status] > RANK[report.pillars[pillar].status]) report.pillars[pillar].status = entry.status;
    if (entry.finding) {
        report.findings.push({
            pillar, id: entry.id, severity: entry.status, title: entry.title,
            finding: entry.finding, fix: entry.fix || null, metrics: entry.metrics || null
        });
    }
    return entry;
}

const progress = msg => { if (!FLAGS.quiet) console.log(msg); };

// File helpers -------------------------------------------------------------
const abs = rel => path.join(REPO_ROOT, rel);
const exists = rel => fs.existsSync(abs(rel));
function read(rel) {
    try { return fs.readFileSync(abs(rel), 'utf8'); } catch { return null; }
}
function missingOf(list) { return list.filter(f => !exists(f)); }

/** Keys of an object literal written as  'key': 'value'  — used for the phonetic maps. */
function quotedMapKeys(src) {
    const out = new Set();
    const re = /^\s*'([^']+)'\s*:\s*'/gm;
    let m;
    while ((m = re.exec(src)) !== null) out.add(m[1]);
    return out;
}

function git(args) {
    try {
        return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch { return null; }
}

// ---------------------------------------------------------------------------
// Supabase client — built directly, NOT via config/supabase.js, because that
// module silently falls back to a mock client backed by a fixture file. Mock
// row counts reported as live ones would be worse than no numbers at all.
// ---------------------------------------------------------------------------
const SUPA_URL = process.env.SUPABASE_URL || null;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null;

function makeClient() {
    if (!SUPA_URL || !SUPA_KEY) return null;
    try {
        const { createClient } = require(path.join(REPO_ROOT, 'node_modules', '@supabase/supabase-js'));
        return createClient(SUPA_URL, SUPA_KEY, {
            global: { fetch: (u, o) => fetch(u, { ...o, signal: AbortSignal.timeout(15000) }) }
        });
    } catch { return null; }
}

const CONTENT_TABLES = [
    'dictionary_entries', 'phrases', 'stories', 'pickup_lines', 'pickup_line_components',
    'quiz_questions', 'wordle_words', 'crossword_words', 'crossword_puzzles', 'translation_cache'
];

// ===========================================================================
// 1. Supabase
// ===========================================================================
async function auditSupabase(db) {
    progress('🗄️  Auditing Supabase database & content quality...');

    const hasAnon = !!process.env.SUPABASE_ANON_KEY;
    const hasService = !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
    record('supabase', {
        id: 'supabase.credentials',
        title: 'Credentials available to this shell',
        status: hasAnon ? 'OK' : 'SKIP',
        evidence: [
            `SUPABASE_URL: ${SUPA_URL ? 'set' : 'unset'}`,
            `SUPABASE_ANON_KEY: ${hasAnon ? 'set' : 'unset'}`,
            `SUPABASE_SERVICE_KEY: ${hasService ? 'set' : 'unset (admin-only endpoints cannot be exercised)'}`
        ],
        finding: hasAnon ? null : 'No Supabase credentials in this shell, so all live content metrics below are unmeasured. This says nothing about production.',
        fix: hasAnon ? null : 'Populate .env, then re-run with --live.'
    });

    if (!db || !FLAGS.live) {
        record('supabase', {
            id: 'supabase.content',
            title: 'Live content metrics',
            status: 'SKIP',
            evidence: [!FLAGS.live ? '--live not passed' : 'Supabase client unavailable (missing credentials or @supabase/supabase-js not installed)'],
            finding: 'Row counts, orphaned entries and content-quality gaps were not measured. Do not quote counts from documentation as if they were observed.',
            fix: 'Re-run: node .claude/skills/pidgin-review-advisor/scripts/audit-pidgin-app.js --live'
        });
        return;
    }

    // Row counts -----------------------------------------------------------
    const counts = {};
    const errors = [];
    await Promise.all(CONTENT_TABLES.map(async table => {
        try {
            const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
            if (error) { errors.push(`${table}: ${error.message}`); counts[table] = null; }
            else counts[table] = count;
        } catch (e) { errors.push(`${table}: ${e.message}`); counts[table] = null; }
    }));

    const empty = Object.entries(counts).filter(([, c]) => c === 0).map(([t]) => t);
    record('supabase', {
        id: 'supabase.row-counts',
        title: 'Content table row counts',
        status: errors.length ? 'FAIL' : (empty.length ? 'WARN' : 'OK'),
        evidence: Object.entries(counts).map(([t, c]) => `${t}: ${c === null ? 'unreadable' : c} rows`),
        metrics: counts,
        finding: errors.length ? `Unreadable tables (RLS, rename, or outage): ${errors.join('; ')}`
            : (empty.length ? `Empty tables: ${empty.join(', ')}` : null),
        fix: errors.length ? 'Check RLS policies for the anon role and confirm the table names still match routes/*.js.' : null
    });

    // Dictionary content quality -------------------------------------------
    try {
        const { data, error } = await db
            .from('dictionary_entries')
            .select('id, pidgin, english, category, pronunciation, usage, examples');
        if (error) throw new Error(error.message);

        const rows = data || [];
        const blank = v => v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
        const noPron = rows.filter(r => blank(r.pronunciation));
        const noCat = rows.filter(r => blank(r.category));
        const noExample = rows.filter(r => blank(r.examples) && blank(r.usage));
        const noEnglish = rows.filter(r => blank(r.english));

        const seen = new Map();
        for (const r of rows) {
            const key = String(r.pidgin || '').trim().toLowerCase();
            if (!key) continue;
            seen.set(key, (seen.get(key) || 0) + 1);
        }
        const dupes = [...seen.entries()].filter(([, n]) => n > 1);

        const pct = n => rows.length ? ((n / rows.length) * 100).toFixed(1) + '%' : 'n/a';
        const worst = Math.max(noPron.length, noExample.length, noEnglish.length, dupes.length);
        record('supabase', {
            id: 'supabase.dictionary-quality',
            title: 'dictionary_entries field completeness',
            status: noEnglish.length || dupes.length ? 'WARN' : (worst > rows.length * 0.25 ? 'WARN' : 'OK'),
            evidence: [
                `entries: ${rows.length}`,
                `missing pronunciation: ${noPron.length} (${pct(noPron.length)})`,
                `missing category: ${noCat.length} (${pct(noCat.length)})`,
                `no usage AND no examples: ${noExample.length} (${pct(noExample.length)})`,
                `missing english meaning: ${noEnglish.length}`,
                `duplicate pidgin terms: ${dupes.length}${dupes.length ? ' → ' + dupes.slice(0, 8).map(([k, n]) => `${k}×${n}`).join(', ') : ''}`
            ],
            metrics: {
                entries: rows.length, missingPronunciation: noPron.length, missingCategory: noCat.length,
                missingExample: noExample.length, missingEnglish: noEnglish.length, duplicateTerms: dupes.length
            },
            finding: (noEnglish.length || dupes.length || worst > rows.length * 0.25)
                ? `Content gaps in dictionary_entries: ${noPron.length} without pronunciation, ${noExample.length} without any usage/example, ${dupes.length} duplicate terms.`
                : null,
            fix: 'Backfill via tools/data/improve-dictionary.js (npm run data:improve); de-duplicate before regenerating word pages, since each duplicate emits a competing /word/ page.'
        });

        // Audio cache coverage ---------------------------------------------
        if (counts.translation_cache !== null && counts.translation_cache !== undefined) {
            const ratio = rows.length ? counts.translation_cache / rows.length : 0;
            record('supabase', {
                id: 'supabase.audio-cache',
                title: 'Pre-generated audio coverage',
                status: ratio < 0.5 ? 'WARN' : 'OK',
                evidence: [
                    `translation_cache rows: ${counts.translation_cache}`,
                    `dictionary entries: ${rows.length}`,
                    `cache rows per entry: ${ratio.toFixed(2)} (cache also holds phrases/stories/talk-story lines, so >1 is normal)`
                ],
                metrics: { cacheRows: counts.translation_cache, entries: rows.length, ratio: Number(ratio.toFixed(3)) },
                finding: ratio < 0.5 ? 'Fewer cached audio rows than dictionary entries — most playbacks are paying live ElevenLabs credits and first-play latency.' : null,
                fix: 'node tools/audio/audio-pregeneration.js to warm the audio-assets bucket + translation_cache.'
            });
        }
    } catch (e) {
        record('supabase', {
            id: 'supabase.dictionary-quality',
            title: 'dictionary_entries field completeness',
            status: 'FAIL',
            evidence: [`Query failed: ${e.message}`],
            finding: `Could not read dictionary_entries: ${e.message}`,
            fix: 'Verify the anon key and RLS select policy on dictionary_entries.'
        });
    }
}

// ===========================================================================
// 2. ElevenLabs TTS & pronunciation
// ===========================================================================
function auditElevenLabs() {
    progress('🎙️  Auditing ElevenLabs voices & pronunciation engine...');

    const KIMO = 'f0ODjLMfcJmlKfs7dFCW';
    const core = ['src/components/speech/elevenlabs-speech.js', 'routes/tts.js', 'tools/audio/audio-pregeneration.js'];
    const missing = missingOf(core);
    record('elevenlabs', {
        id: 'elevenlabs.wiring',
        title: 'TTS components present',
        status: missing.length ? 'FAIL' : 'OK',
        evidence: core.map(f => `${f}: ${exists(f) ? 'present' : 'MISSING'}`),
        finding: missing.length ? `Missing TTS components: ${missing.join(', ')}` : null
    });

    // Phonetic map drift — the single highest-value check in this pillar.
    const speechSrc = read('src/components/speech/elevenlabs-speech.js');
    const auditSrc = read('tools/testing/pronunciation-audit.js');
    if (speechSrc && auditSrc) {
        const speechKeys = quotedMapKeys(speechSrc);
        const auditKeys = quotedMapKeys(auditSrc);
        const onlySpeech = [...speechKeys].filter(k => !auditKeys.has(k));
        const onlyAudit = [...auditKeys].filter(k => !speechKeys.has(k));
        const drift = onlySpeech.length + onlyAudit.length;
        record('elevenlabs', {
            id: 'elevenlabs.map-drift',
            title: 'Phonetic map parity (runtime copy vs audit copy)',
            status: drift > 0 ? 'WARN' : 'OK',
            evidence: [
                `src/components/speech/elevenlabs-speech.js: ${speechKeys.size} mappings (runtime — the one users hear)`,
                `tools/testing/pronunciation-audit.js: ${auditKeys.size} mappings (audit copy, comment claims "identical")`,
                onlySpeech.length ? `only in runtime: ${onlySpeech.slice(0, 12).join(', ')}${onlySpeech.length > 12 ? ` … +${onlySpeech.length - 12}` : ''}` : 'only in runtime: none',
                onlyAudit.length ? `only in audit: ${onlyAudit.slice(0, 12).join(', ')}${onlyAudit.length > 12 ? ` … +${onlyAudit.length - 12}` : ''}` : 'only in audit: none'
            ],
            metrics: { runtimeKeys: speechKeys.size, auditKeys: auditKeys.size, onlyRuntime: onlySpeech.length, onlyAudit: onlyAudit.length },
            finding: drift > 0
                ? `The two hand-copied phonetic maps have drifted by ${drift} mappings, so pronunciation-audit.js scores a different map than the one shipped to users — its coverage percentage is not the real coverage.`
                : null,
            fix: 'Extract the map into one shared module (e.g. src/components/speech/pronunciation-map.js) and have both the runtime engine and the audit tool import it.'
        });
    }

    // Voice-ID guard: deprecated Aunty/Braddah voices must not come back.
    const scanDirs = ['src', 'routes', 'services', 'tools'];
    const foundIds = new Map();
    function walk(dir) {
        let entries = [];
        try { entries = fs.readdirSync(abs(dir), { withFileTypes: true }); } catch { return; }
        for (const e of entries) {
            const rel = path.join(dir, e.name);
            if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '_archive') walk(rel); continue; }
            if (!/\.(js|html)$/.test(e.name)) continue;
            const src = read(rel);
            if (!src) continue;
            const re = /voice_?[Ii]d['"]?\s*[:=]\s*['"]([A-Za-z0-9]{18,24})['"]/g;
            let m;
            while ((m = re.exec(src)) !== null) {
                if (!foundIds.has(m[1])) foundIds.set(m[1], []);
                if (!foundIds.get(m[1]).includes(rel)) foundIds.get(m[1]).push(rel);
            }
        }
    }
    scanDirs.forEach(walk);
    const strays = [...foundIds.keys()].filter(id => id !== KIMO);
    record('elevenlabs', {
        id: 'elevenlabs.voice-guard',
        title: 'Only the Kimo voice is referenced',
        status: strays.length ? 'WARN' : 'OK',
        evidence: [...foundIds.entries()].map(([id, files]) =>
            `${id}${id === KIMO ? ' (Kimo — approved)' : ' (UNAPPROVED)'}: ${files.slice(0, 4).join(', ')}${files.length > 4 ? ` +${files.length - 4} more` : ''}`),
        metrics: { distinctVoiceIds: foundIds.size, unapproved: strays.length },
        finding: strays.length ? `Voice IDs other than Kimo are referenced: ${strays.join(', ')}. Aunty/Braddah were removed for poor acoustic quality and must not be reintroduced.` : null,
        fix: strays.length ? 'Replace stray IDs with f0ODjLMfcJmlKfs7dFCW, or confirm the new voice was deliberately auditioned.' : null
    });

    // Where phonetics actually get applied.
    const ttsSrc = read('routes/tts.js') || '';
    const serverSideAppliesPhonetics = /pronunciation|phonetic/i.test(ttsSrc);
    record('elevenlabs', {
        id: 'elevenlabs.phonetics-boundary',
        title: 'Phonetic substitution boundary',
        status: serverSideAppliesPhonetics ? 'OK' : 'WARN',
        evidence: [
            `routes/tts.js applies phonetic substitution: ${serverSideAppliesPhonetics ? 'yes' : 'no — it forwards req.body.text verbatim'}`,
            `routes/tts.js caches by md5(text)+voice_id: ${/md5|createHash/.test(ttsSrc) ? 'yes' : 'no'}`
        ],
        finding: serverSideAppliesPhonetics ? null
            : 'Phonetics are client-side only: any non-browser caller (audio pre-generation, Talk Story server-side synthesis, future integrations) reaches ElevenLabs with unphoneticized text and gets mainland pronunciation.',
        fix: 'Apply the shared map inside routes/tts.js so every caller benefits, keeping the cache key on the post-substitution text.'
    });

    record('elevenlabs', {
        id: 'elevenlabs.api-key',
        title: 'ELEVENLABS_API_KEY in this shell',
        status: process.env.ELEVENLABS_API_KEY ? 'OK' : 'SKIP',
        evidence: [process.env.ELEVENLABS_API_KEY ? 'set' : 'unset locally (Railway may still have it)']
    });
}

// ===========================================================================
// 3. GitHub CI/CD & repo hygiene
// ===========================================================================
function auditCicd() {
    progress('🐙 Auditing GitHub Actions & repo hygiene...');

    const ci = read('.github/workflows/ci.yml');
    if (!ci) {
        record('cicd', {
            id: 'cicd.workflow', title: 'CI workflow', status: 'FAIL',
            evidence: ['.github/workflows/ci.yml: MISSING'],
            finding: 'No CI workflow — nothing verifies that a push still builds.',
            fix: 'Add a workflow running npm ci, npm run build, npm test.'
        });
    } else {
        const runsBuild = /npm run build/.test(ci);
        const runsTest = /npm test|npm run test/.test(ci);
        // A step gated behind `if: ${{ env.SECRET != '' }}` silently no-ops when the secret is absent.
        const gated = /if:\s*\$\{\{\s*env\.SUPABASE_ANON_KEY\s*!=\s*''\s*\}\}/.test(ci);
        record('cicd', {
            id: 'cicd.workflow',
            title: 'CI coverage',
            status: !runsBuild ? 'FAIL' : (gated || !runsTest ? 'WARN' : 'OK'),
            evidence: [
                `runs npm run build: ${runsBuild}`,
                `runs the test suite: ${runsTest}`,
                `test step gated on SUPABASE_ANON_KEY secret: ${gated}`
            ],
            metrics: { runsBuild, runsTest, testStepGated: gated },
            finding: gated
                ? 'The validation suite is conditional on a SUPABASE_ANON_KEY repo secret. If that secret is not set, CI is green while running zero tests — a false all-clear on every PR.'
                : (!runsTest ? 'CI never runs the test suite.' : null),
            fix: gated
                ? 'Add SUPABASE_ANON_KEY (a public client key, safe as an Actions secret) under Settings → Secrets → Actions, then confirm the "Validation suite" step actually executes in the next run.'
                : null
        });
    }

    const suites = [
        'tools/testing/run-all-tests.js', 'tools/testing/run-validation.js',
        'tools/testing/validate-phase-2-3.js', 'tools/testing/pronunciation-audit.js',
        'tools/testing/audit-site.js'
    ];
    const missingSuites = missingOf(suites);
    record('cicd', {
        id: 'cicd.suites', title: 'Validation suites on disk', status: missingSuites.length ? 'WARN' : 'OK',
        evidence: suites.map(s => `${s}: ${exists(s) ? 'present' : 'MISSING'}`),
        finding: missingSuites.length ? `Referenced but absent: ${missingSuites.join(', ')}` : null
    });

    // Repo hygiene
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
    const dirty = git(['status', '--porcelain']);
    const lastCommit = git(['log', '-1', '--format=%h %ad %s', '--date=short']);
    const ahead = git(['rev-list', '--count', '@{u}..HEAD']);
    const dirtyCount = dirty ? dirty.split('\n').filter(Boolean).length : 0;
    record('cicd', {
        id: 'cicd.repo-state', title: 'Working tree & branch state',
        status: dirtyCount > 0 ? 'WARN' : 'OK',
        evidence: [
            `branch: ${branch || 'unknown'}`,
            `uncommitted files: ${dirtyCount}`,
            `unpushed commits: ${ahead === null ? 'unknown (no upstream)' : ahead}`,
            `last commit: ${lastCommit || 'unknown'}`
        ],
        metrics: { branch, uncommittedFiles: dirtyCount, unpushedCommits: ahead ? Number(ahead) : null },
        finding: dirtyCount > 0 ? `${dirtyCount} uncommitted file(s) — audit results reflect local edits that are not deployed.` : null
    });

    const gitignore = read('.gitignore') || '';
    record('cicd', {
        id: 'cicd.build-artifacts', title: 'Build output kept out of git',
        status: /^public\/?$/m.test(gitignore) ? 'OK' : 'WARN',
        evidence: [`public/ in .gitignore: ${/^public\/?$/m.test(gitignore)}`, `tracked files under public/: ${(git(['ls-files', 'public']) || '').split('\n').filter(Boolean).length}`],
        finding: /^public\/?$/m.test(gitignore) ? null : 'Generated public/ output is tracked in git — build artifacts will produce noisy diffs and merge conflicts.'
    });
}

// ===========================================================================
// 4. Gemini AI API
// ===========================================================================
function auditAi() {
    progress('🤖 Auditing Gemini AI service & endpoints...');

    const core = ['services/gemini.js', 'routes/ai.js'];
    const missing = missingOf(core);
    record('ai', {
        id: 'ai.wiring', title: 'AI service present', status: missing.length ? 'FAIL' : 'OK',
        evidence: core.map(f => `${f}: ${exists(f) ? 'present' : 'MISSING'}`),
        finding: missing.length ? `Missing: ${missing.join(', ')}` : null
    });

    const srcs = ['services/gemini.js', 'routes/ai.js'].map(read).filter(Boolean).join('\n');
    const models = [...new Set((srcs.match(/gemini-[a-z0-9.\-]+/g) || []))];
    record('ai', {
        id: 'ai.models', title: 'Gemini model IDs in use',
        status: models.length === 0 ? 'WARN' : (models.length > 2 ? 'WARN' : 'OK'),
        evidence: models.length ? models.map(m => `model: ${m}`) : ['no gemini-* model id found in source'],
        metrics: { models },
        finding: models.length > 2
            ? `${models.length} different Gemini model IDs are hardcoded (${models.join(', ')}); each is a separate quota/latency/quality profile and they drift independently.`
            : (models.length === 0 ? 'No model ID found — the model may be selected dynamically or the integration moved.' : null),
        fix: models.length > 2 ? 'Centralize model selection in services/gemini.js behind one constant (or env var) so upgrades are a one-line change.' : null
    });

    const serverSrc = read('server.js') || '';
    const aiSrc = read('routes/ai.js') || '';
    const limiters = ['aiChatLimiter', 'semanticSearchLimiter', 'questionSubmitLimiter']
        .filter(l => serverSrc.includes(l) || aiSrc.includes(l));
    record('ai', {
        id: 'ai.rate-limits', title: 'Rate limiting on AI endpoints',
        status: limiters.length ? 'OK' : 'WARN',
        evidence: limiters.length ? limiters.map(l => `${l}: wired`) : ['no named AI rate limiter found in server.js / routes/ai.js'],
        metrics: { limiters },
        finding: limiters.length ? null : 'AI endpoints appear unthrottled — a scripted client can burn the Gemini quota and the bill.',
        fix: limiters.length ? null : 'Wrap /api/ai/* with express-rate-limit before the handler.'
    });

    record('ai', {
        id: 'ai.api-key', title: 'GEMINI_API_KEY in this shell',
        status: process.env.GEMINI_API_KEY ? 'OK' : 'SKIP',
        evidence: [process.env.GEMINI_API_KEY ? 'set' : 'unset locally (Railway may still have it)']
    });
}

// ===========================================================================
// 5. Linguistics & phonetics
// ===========================================================================
function auditLinguistics() {
    progress('🌺 Auditing Pidgin grammar & phonetic rules...');

    const translatorDir = 'src/components/translator';
    const files = (() => { try { return fs.readdirSync(abs(translatorDir)); } catch { return []; } })();
    const translatorSrc = files.map(f => read(path.join(translatorDir, f)) || '').join('\n');

    const markers = { stay: /['"]stay['"]/, wen: /['"]wen['"]/, nevah: /['"]nevah['"]/, 'no can': /no can/, 'like (desiderative)': /['"]like['"]/ };
    const present = Object.entries(markers).filter(([, re]) => re.test(translatorSrc)).map(([k]) => k);
    record('linguistics', {
        id: 'linguistics.grammar-markers', title: 'Preverbal marker coverage in the translator',
        status: files.length === 0 ? 'FAIL' : (present.length >= 4 ? 'OK' : 'WARN'),
        evidence: [
            `translator modules: ${files.join(', ') || 'none found'}`,
            `markers handled: ${present.join(', ') || 'none detected'}`
        ],
        metrics: { modules: files.length, markersFound: present },
        finding: files.length === 0 ? 'Translator components not found at src/components/translator.'
            : (present.length < 4 ? `Only ${present.length}/5 core tense-aspect markers appear in the translator source; unhandled markers make output read as accented English rather than Pidgin.` : null)
    });

    const speechSrc = read('src/components/speech/elevenlabs-speech.js') || '';
    const okinaCount = (speechSrc.match(/ʻ/g) || []).length;
    const kahakoCount = (speechSrc.match(/[āēīōū]/g) || []).length;
    record('linguistics', {
        id: 'linguistics.diacritics', title: 'ʻOkina / kahakō handling in the speech layer',
        status: okinaCount > 0 ? 'OK' : 'WARN',
        evidence: [`ʻokina occurrences: ${okinaCount}`, `kahakō vowels: ${kahakoCount}`],
        metrics: { okina: okinaCount, kahako: kahakoCount },
        finding: okinaCount > 0 ? null : 'No ʻokina appears in the phonetic layer — Hawaiian loanwords with a glottal stop will be normalized away before synthesis.',
        fix: okinaCount > 0 ? null : 'Add ʻokina-bearing keys (ʻohana, Hawaiʻi, manaʻo) to the shared map, and strip-or-map deliberately rather than incidentally.'
    });

    record('linguistics', {
        id: 'linguistics.coverage-measurement', title: 'Dictionary-wide phonetic coverage',
        status: 'SKIP',
        evidence: ['Requires Supabase credentials: node tools/testing/pronunciation-audit.js'],
        finding: 'Coverage percentage was not measured by this script. Never quote a remembered figure — run the tool.',
        fix: 'node tools/testing/pronunciation-audit.js  (note the map-drift finding above: it scores the audit copy of the map, not the runtime one)'
    });
}

// ===========================================================================
// 6. Vocabulary, slang & SEO pipeline
// ===========================================================================
async function auditVocabulary(db) {
    progress('📖 Auditing vocabulary expansion & SEO feedback pipeline...');

    const pipeline = {
        'tools/data/add-missing-terms.js': 'npm run data:add-missing',
        'tools/data/improve-dictionary.js': 'npm run data:improve',
        'tools/seo/feedback-loop.js': 'npm run seo:loop',
        'tools/generators/generate-entry-pages.js': 'npm run generate:pages',
        'tools/generators/generate-sitemap.js': 'npm run generate:sitemap'
    };
    const missing = missingOf(Object.keys(pipeline));
    record('vocabulary', {
        id: 'vocabulary.pipeline', title: 'Expansion & SEO tooling', status: missing.length ? 'WARN' : 'OK',
        evidence: Object.entries(pipeline).map(([f, cmd]) => `${cmd} → ${f}: ${exists(f) ? 'present' : 'MISSING'}`),
        finding: missing.length ? `Missing tooling: ${missing.join(', ')}` : null
    });

    // Curated backlog: how many curated terms are still absent from the dictionary?
    let curated = null;
    try {
        const raw = read('tools/data/curated-missing-terms.json');
        if (raw) {
            const parsed = JSON.parse(raw);
            curated = Array.isArray(parsed) ? parsed : (parsed.missing || parsed.terms || null);
        }
    } catch { /* fall through */ }

    if (!curated) {
        record('vocabulary', {
            id: 'vocabulary.backlog', title: 'Curated term backlog', status: 'SKIP',
            evidence: ['tools/data/curated-missing-terms.json unreadable or in an unexpected shape']
        });
    } else if (!db || !FLAGS.live) {
        record('vocabulary', {
            id: 'vocabulary.backlog', title: 'Curated term backlog', status: 'SKIP',
            evidence: [`${curated.length} curated terms staged`, 'ingestion status needs --live to compare against dictionary_entries'],
            finding: 'Cannot tell how many staged terms are already in the dictionary without a live query.',
            fix: 'Re-run with --live.'
        });
    } else {
        try {
            const { data, error } = await db.from('dictionary_entries').select('pidgin');
            if (error) throw new Error(error.message);
            const have = new Set((data || []).map(r => String(r.pidgin || '').trim().toLowerCase()));
            const pending = curated.filter(t => !have.has(String(t.pidgin || '').trim().toLowerCase()));
            record('vocabulary', {
                id: 'vocabulary.backlog', title: 'Curated term backlog',
                status: pending.length ? 'WARN' : 'OK',
                evidence: [
                    `curated terms staged: ${curated.length}`,
                    `already in dictionary: ${curated.length - pending.length}`,
                    `still missing: ${pending.length}${pending.length ? ' → ' + pending.slice(0, 12).map(t => t.pidgin).join(', ') : ''}`
                ],
                metrics: { curated: curated.length, pending: pending.length },
                finding: pending.length ? `${pending.length} curated terms are staged in the repo but not yet in Supabase — ready-to-ship content sitting idle.` : null,
                fix: pending.length ? 'npm run data:add-missing, then npm run generate:pages && npm run generate:sitemap.' : null
            });
        } catch (e) {
            record('vocabulary', {
                id: 'vocabulary.backlog', title: 'Curated term backlog', status: 'WARN',
                evidence: [`comparison failed: ${e.message}`]
            });
        }
    }

    // Pending community suggestions
    if (db && FLAGS.live) {
        try {
            const { count, error } = await db.from('user_suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            if (error) throw new Error(error.message);
            record('vocabulary', {
                id: 'vocabulary.suggestions', title: 'Pending community submissions',
                status: count > 20 ? 'WARN' : 'OK',
                evidence: [`user_suggestions with status=pending: ${count}`],
                metrics: { pendingSuggestions: count },
                finding: count > 20 ? `${count} community submissions are queued unreviewed — the highest-signal source of authentic new slang is backing up.` : null,
                fix: count > 20 ? 'Review in /admin.html, or triage with node tools/check-pending.js.' : null
            });
        } catch (e) {
            record('vocabulary', {
                id: 'vocabulary.suggestions', title: 'Pending community submissions', status: 'SKIP',
                evidence: [`user_suggestions unreadable: ${e.message} (RLS usually restricts this to the service role)`]
            });
        }
    } else {
        record('vocabulary', {
            id: 'vocabulary.suggestions', title: 'Pending community submissions', status: 'SKIP',
            evidence: ['needs --live plus a service-role key']
        });
    }
}

// ===========================================================================
// 7. Railway / Express / Cloudflare edge
// ===========================================================================
async function auditDeploy() {
    progress('📦 Auditing Railway, Express hardening & Cloudflare edge...');

    const core = ['railway.json', 'Dockerfile', 'server.js', 'build.js'];
    const missing = missingOf(core);
    record('deploy', {
        id: 'deploy.files', title: 'Deployment configuration present', status: missing.length ? 'FAIL' : 'OK',
        evidence: core.map(f => `${f}: ${exists(f) ? 'present' : 'MISSING'}`),
        finding: missing.length ? `Missing: ${missing.join(', ')}` : null
    });

    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ELEVENLABS_API_KEY', 'GEMINI_API_KEY'];
    const optional = ['SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'PORT'];
    const missingReq = required.filter(v => !process.env[v]);
    record('deploy', {
        id: 'deploy.env', title: 'Environment variables in this shell',
        status: missingReq.length ? 'SKIP' : 'OK',
        evidence: [...required, ...optional].map(v => `${v}: ${process.env[v] ? 'set' : 'unset'}`),
        metrics: { missingRequiredLocally: missingReq },
        finding: missingReq.length ? `Not set locally: ${missingReq.join(', ')}. This is a local-shell observation only — it is NOT evidence that Railway is misconfigured.` : null,
        fix: missingReq.length ? 'Confirm the Railway service variables in the dashboard before reporting this as a production issue.' : null
    });

    const serverSrc = read('server.js') || '';
    const mediaBlock = serverSrc.match(/mediaSrc:\s*\[([^\]]*)\]/s);
    const mediaOk = mediaBlock ? /blob:/.test(mediaBlock[1]) : false;
    record('deploy', {
        id: 'deploy.csp-media', title: 'CSP allows audio playback',
        status: mediaOk ? 'OK' : 'FAIL',
        evidence: [mediaBlock ? `mediaSrc: [${mediaBlock[1].replace(/\s+/g, ' ').trim()}]` : 'no mediaSrc directive found in server.js'],
        finding: mediaOk ? null : 'CSP mediaSrc does not allow blob: — ElevenLabs/Supabase audio playback will be blocked in the browser.',
        fix: mediaOk ? null : "Add 'blob:' and https://*.supabase.co to the helmet mediaSrc directive."
    });

    const swNoStore = /sw\.js[\s\S]{0,300}?no-store/.test(serverSrc);
    record('deploy', {
        id: 'deploy.sw-cache', title: 'Service worker marked uncacheable at the origin',
        status: swNoStore ? 'OK' : 'FAIL',
        evidence: [`server.js sets no-store on sw.js: ${swNoStore}`],
        finding: swNoStore ? null : 'sw.js is served cacheable. A pinned service worker serves a stale CSP with it, producing connect-src violations that do not match the CSP in server.js.',
        fix: swNoStore ? null : "In the static setHeaders hook, set Cache-Control: 'no-cache, no-store, must-revalidate, max-age=0' for sw.js."
    });

    record('deploy', {
        id: 'deploy.trust-proxy', title: 'trust proxy configured for Cloudflare + Railway',
        status: /trust proxy/.test(serverSrc) ? 'OK' : 'WARN',
        evidence: [(serverSrc.match(/app\.set\(['"]trust proxy['"][^)]*\)/) || ['not set'])[0]],
        finding: /trust proxy/.test(serverSrc) ? null : 'Without trust proxy, rate limiting keys on the proxy IP and throttles all users as one.'
    });

    // Edge vs origin — the failure mode documented in CLAUDE.md.
    if (!FLAGS.net) {
        record('deploy', {
            id: 'deploy.edge', title: 'Cloudflare edge vs Railway origin', status: 'SKIP',
            evidence: ['--net not passed'],
            finding: 'Edge cache behaviour is unverified. The headers server.js sets are not necessarily the headers users receive.',
            fix: 'Re-run with --net, or: curl -sSI https://chokepidgin.com/sw.js | grep -i "cache-control\\|cf-cache-status\\|age:"'
        });
    } else {
        try {
            const probe = async url => {
                const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(12000) });
                return {
                    status: res.status,
                    cacheControl: res.headers.get('cache-control'),
                    cfStatus: res.headers.get('cf-cache-status'),
                    age: res.headers.get('age')
                };
            };
            const edge = await probe('https://chokepidgin.com/sw.js');
            const origin = await probe(`https://chokepidgin.com/sw.js?cb=${process.pid}${Date.now()}`);
            const stale = edge.cfStatus === 'HIT' && Number(edge.age || 0) > 0;
            const mismatch = (edge.cacheControl || '') !== (origin.cacheControl || '');
            record('deploy', {
                id: 'deploy.edge', title: 'Cloudflare edge vs Railway origin',
                status: (stale || mismatch) ? 'FAIL' : 'OK',
                evidence: [
                    `edge   /sw.js → ${edge.status} cache-control="${edge.cacheControl}" cf-cache-status=${edge.cfStatus} age=${edge.age || '0'}`,
                    `origin /sw.js?cb → ${origin.status} cache-control="${origin.cacheControl}" cf-cache-status=${origin.cfStatus}`
                ],
                metrics: { edge, origin },
                finding: (stale || mismatch)
                    ? 'The edge is serving a cached sw.js whose headers differ from the origin. That pins an old service worker — and its stale CSP — for users, which surfaces as "the browser refuses to load the latest updates".'
                    : null,
                fix: (stale || mismatch)
                    ? 'Verify the /sw.js Bypass-cache rule (ruleset 65970663838141ce9592b4a616d3e508, rule 82244fb2fcae412b86fe6ff7da5e0277) and Browser Cache TTL = Respect Existing Headers, then purge https://chokepidgin.com/sw.js by exact URL.'
                    : null
            });
        } catch (e) {
            record('deploy', {
                id: 'deploy.edge', title: 'Cloudflare edge vs Railway origin', status: 'SKIP',
                evidence: [`probe failed: ${e.message}`]
            });
        }
    }
}

// ===========================================================================
// Output
// ===========================================================================
const ICON = { OK: '🟢', WARN: '🟡', FAIL: '🔴', SKIP: '⚪', PARTIAL: '⚪' };

// A pillar whose only non-OK checks were unmeasured is PARTIAL, not "skipped":
// some things were verified, but the pillar cannot be called healthy.
function pillarLabel(pillar) {
    if (pillar.status !== 'SKIP') return pillar.status;
    return pillar.checks.some(c => c.status === 'OK') ? 'PARTIAL' : 'SKIP';
}

function printHuman() {
    console.log('\n=============================================================');
    console.log('🌺 CHOKEPIDGIN / ISPEAKPIDGIN AUDIT');
    console.log(`   ${report.generatedAt}   live=${FLAGS.live} net=${FLAGS.net}`);
    console.log('=============================================================');

    for (const [key, pillar] of Object.entries(report.pillars)) {
        const label = pillarLabel(pillar);
        console.log(`\n${ICON[label]} ${pillar.title}  [${label}]`);
        for (const c of pillar.checks) {
            console.log(`   ${ICON[c.status]} ${c.title}`);
            for (const e of c.evidence) console.log(`        · ${e}`);
            if (c.finding) console.log(`        → ${c.finding}`);
            if (c.fix) console.log(`        ↳ fix: ${c.fix}`);
        }
    }

    const bySeverity = s => report.findings.filter(f => f.severity === s);
    console.log('\n-------------------------------------------------------------');
    console.log(`FINDINGS: ${bySeverity('FAIL').length} FAIL · ${bySeverity('WARN').length} WARN · ${bySeverity('SKIP').length} UNMEASURED`);
    for (const f of [...bySeverity('FAIL'), ...bySeverity('WARN')]) {
        console.log(`  ${ICON[f.severity]} [${f.pillar}] ${f.finding}`);
    }
    const unmeasured = bySeverity('SKIP');
    if (unmeasured.length) {
        console.log('\n  Unmeasured (do not report these areas as healthy):');
        for (const f of unmeasured) console.log(`     ⚪ [${f.pillar}] ${f.title}`);
    }
    console.log('=============================================================\n');
}

(async function main() {
    const db = makeClient();
    await auditSupabase(db);
    auditElevenLabs();
    auditCicd();
    auditAi();
    auditLinguistics();
    await auditVocabulary(db);
    await auditDeploy();

    for (const pillar of Object.values(report.pillars)) pillar.label = pillarLabel(pillar);

    if (FLAGS.json) console.log(JSON.stringify(report, null, 2));
    else printHuman();

    const hasFail = report.findings.some(f => f.severity === 'FAIL');
    process.exit(FLAGS.strict && hasFail ? 1 : 0);
})().catch(err => {
    console.error('❌ Audit crashed:', err.stack || err.message);
    process.exit(2);
});
