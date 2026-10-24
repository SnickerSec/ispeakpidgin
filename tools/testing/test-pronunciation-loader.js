#!/usr/bin/env node
/**
 * Every server route and audio tool that turns text into ElevenLabs input must load the
 * dictionary pronunciation guides through services/pronunciation.js first.
 *
 * Why this is a test and not a convention: the guides live in module-global state, so forgetting
 * them is silent. It produced different audio for 458 of 798 dictionary terms depending on which
 * path made the clip, and routes/admin.js (sharing the server process with routes/tts.js) used
 * them only if someone had happened to play audio since the last deploy.
 *
 * Also checks the loader's failure contract: tools fail loudly, the server degrades.
 */
const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const SCAN_DIRS = ['routes', 'services', 'tools/audio'];

// Files allowed to call the transform without loading guides, each with the reason.
const EXEMPT = {
    'services/pronunciation.js': 'is the loader',
    'tools/audio/audition-voice.js': 'speaks fixed benchmark sentences with no database; guides only ever match a whole single term',
    'tools/audio/detect-phonetic-drift.js': 'hashes tuned-map terms only, and setPronunciationGuides never lets a guide override a map key'
};

function jsFiles(dir) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap(e => {
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) return jsFiles(rel);
        return e.name.endsWith('.js') ? [rel] : [];
    });
}

async function run() {
    console.log('🗣️  Pronunciation guide loader coverage\n');

    // 1. Static: callers of the transform also call the loader.
    const offenders = [];
    const strayInjectors = [];
    let callers = 0;
    for (const rel of SCAN_DIRS.flatMap(jsFiles)) {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        if (/\bsetPronunciationGuides\s*\(/.test(src) && rel !== 'services/pronunciation.js') strayInjectors.push(rel);
        if (!/\bapplyPronunciationCorrections\s*\(/.test(src)) continue;
        callers++;
        if (EXEMPT[rel]) continue;
        if (!/\b(loadPronunciationGuides|spokenTextFor)\s*\(/.test(src)) offenders.push(rel);
    }
    assert.ok(callers > 5, `expected to find the transform's callers, found ${callers} (did a directory move?)`);
    assert.deepEqual(offenders, [],
        `These files apply the pronunciation transform without loading dictionary guides:\n  ${offenders.join('\n  ')}\n` +
        `Call loadPronunciationGuides(db) from services/pronunciation.js first (tools: { required: true }).`);
    assert.deepEqual(strayInjectors, [],
        `setPronunciationGuides should only be called by services/pronunciation.js:\n  ${strayInjectors.join('\n  ')}`);
    console.log(`   ✅ ${callers} files apply the transform; all load guides through services/pronunciation.js (${Object.keys(EXEMPT).length} exempt with reasons)`);

    // 2. Behaviour: tools fail loudly, the server degrades. Fresh module per case (module state).
    const failingDb = { from: () => { throw new Error('boom'); } };
    const fresh = () => {
        delete require.cache[require.resolve('../../services/pronunciation')];
        return require('../../services/pronunciation');
    };
    const warn = console.warn; const log = console.log;
    console.warn = () => {}; console.log = () => {};
    try {
        await assert.rejects(fresh().loadPronunciationGuides(failingDb, { required: true }), /failed to load/);
        await assert.rejects(fresh().loadPronunciationGuides(null, { required: true }), /no Supabase client/);
        assert.equal(await fresh().loadPronunciationGuides(failingDb), 0);
        assert.equal(await fresh().loadPronunciationGuides(null), 0);

        // A working client: guides are injected and change the transform's output.
        const rows = [{ id: 1, pidgin: 'shishi', pronunciation: 'SHEE-shee' }];
        const okDb = {
            from: () => {
                const q = { select: () => q, not: () => q, order: () => q, range: () => Promise.resolve({ data: rows, error: null }) };
                return q;
            }
        };
        const svc = fresh();
        assert.equal(await svc.loadPronunciationGuides(okDb, { required: true }), 1);
        assert.equal(await svc.spokenTextFor(okDb, 'shishi'), 'shee-shee');
    } finally {
        console.warn = warn; console.log = log;
    }
    console.log('   ✅ tools fail loudly without guides; the server degrades; loaded guides reach the transform');
    console.log('\n✅ Pronunciation loader checks passed\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
