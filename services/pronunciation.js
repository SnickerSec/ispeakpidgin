/**
 * The one loader for dictionary pronunciation guides.
 *
 * applyPronunciationCorrections (src/components/speech/elevenlabs-speech.js) gives an authored
 * dictionary respelling ("shee-shee" for shishi) priority over every rule -- but only once
 * someone has injected the guides with setPronunciationGuides. That state is module-global, so a
 * caller that forgets produces different audio for the same word: measured 2026-10-24, 458 of 798
 * dictionary terms are spoken differently with and without guides. routes/tts.js loaded them;
 * routes/admin.js and five of the audio generators did not, and admin shared the server process,
 * so whether an admin-made clip used guides depended on whether anyone had played audio first.
 *
 * Every server route and tool that synthesizes speech goes through here first.
 * tools/testing/test-pronunciation-loader.js fails the build when one does not.
 */
const { fetchAllRows } = require('./fetch-all-rows');
const {
    applyPronunciationCorrections,
    setPronunciationGuides
} = require('../src/components/speech/elevenlabs-speech.js');

// One query for the whole dictionary, so a long-running server refreshes on a TTL rather than
// per request. A one-shot tool loads once and never reaches the TTL.
const GUIDE_TTL_MS = 5 * 60 * 1000;

let loadedAt = 0;
let loadedCount = 0;
let loading = null;

/**
 * Load guides into the transform if they are missing or stale.
 *
 * @param {object} db - Supabase client (service role or anon; the column is public)
 * @param {object} [opts]
 * @param {boolean} [opts.required] - throw instead of degrading. Tools set this: a generator that
 *   runs without guides bakes the wrong pronunciation into translation_cache, where it is served
 *   until someone invalidates it. The server leaves it off: a failed load must not take TTS down,
 *   and it is retried on the next request.
 * @returns {Promise<number>} guides in effect
 */
async function loadPronunciationGuides(db, { required = false } = {}) {
    if (Date.now() - loadedAt < GUIDE_TTL_MS) return loadedCount;
    if (!db) {
        if (required) throw new Error('loadPronunciationGuides: no Supabase client (set SUPABASE_URL and a key)');
        return loadedCount;
    }
    if (!loading) {
        loading = (async () => {
            try {
                const rows = await fetchAllRows(db, 'dictionary_entries', 'id, pidgin, pronunciation',
                    { filter: q => q.not('pronunciation', 'is', null) });
                loadedCount = setPronunciationGuides(rows);
                loadedAt = Date.now();
                console.log(`🗣️  Loaded ${loadedCount} dictionary pronunciation guides`);
            } finally {
                loading = null;
            }
        })();
    }
    try {
        await loading;
    } catch (e) {
        if (required) throw new Error(`Pronunciation guides failed to load: ${e.message}`);
        console.warn('Pronunciation guide load failed (rules only until the next attempt):', e.message);
    }
    return loadedCount;
}

/** The exact text ElevenLabs should receive for `text`, guides included. */
async function spokenTextFor(db, text, opts) {
    await loadPronunciationGuides(db, opts);
    return applyPronunciationCorrections(text);
}

module.exports = { loadPronunciationGuides, spokenTextFor, GUIDE_TTL_MS };
