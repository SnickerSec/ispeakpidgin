#!/usr/bin/env node
/**
 * Rebuild translation_cache from orphaned audio files.
 *
 * Why this exists: public.translation_cache was never created in production, so every TTS
 * request uploaded its MP3 to the audio-assets bucket and then failed to write the index row.
 * The audio is real and already paid for -- it is just unreachable. This script recovers it.
 *
 * The matching problem: two naming schemes exist -- cached_{voiceId}_{md5}.mp3 from the TTS route
 * and {md5}.mp3 from audio-pregeneration.js -- and the md5 in a cached_ name was historically
 * computed over the PHONETICIZED text, while the route now looks up the md5 of the CANONICAL text.
 * A hash cannot be reversed, so recovery works forward: take every known source string, compute
 * both hashes, and see whether a file exists under either. When one does, we know that file's
 * source text and can write a row keyed the way the running code reads it.
 *
 *   node tools/audio/rebuild-cache-index.js            # dry run, prints what it would do
 *   node tools/audio/rebuild-cache-index.js --apply    # write the rows
 *
 * Run --apply until it reports 0 recoverable. When several source strings phoneticize to the
 * same speech they share one clip, and the one-row-per-file guard below claims that file for
 * the first of them per run; the rest are picked up on the following pass. Convergence takes a
 * couple of runs, not dozens.
 *
 * Deprecated voices are never indexed: Aunty/Braddah audio was removed deliberately, and
 * resurrecting it through the cache would undo that.
 */
require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { applyPronunciationCorrections } = require('../../src/components/speech/elevenlabs-speech.js');

const APPLY = process.argv.includes('--apply');
const KIMO = 'f0ODjLMfcJmlKfs7dFCW';
const BUCKET = 'audio-assets';
const DIRECTION = 'tts';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error('❌ SUPABASE_URL and a service-role key are required.');
    process.exit(1);
}
const db = createClient(url, key);

const norm = s => String(s).trim().toLowerCase();
const md5 = s => crypto.createHash('md5').update(norm(s)).digest('hex');

async function listCachedObjects() {
    // Two naming schemes live in this bucket, and recovery has to see both.
    //
    //   cached_{voiceId}_{md5}.mp3   written by routes/tts.js on a cache miss
    //   {md5}.mp3                    written by tools/audio/audio-pregeneration.js
    //
    // The second scheme is the reason this script previously recovered 168 rows and stopped:
    // its regex only matched the first, so 1,780 pre-generated clips fell through and every
    // playback of them re-billed ElevenLabs for audio already sitting in storage. Both schemes
    // hash the same thing -- md5 of the trimmed, lowercased source text -- so once a bare-hash
    // file is matched to its source string it indexes exactly like a cached_ one.
    //
    // Pre-generation only ever ran with Kimo (VOICE_ID in audio-pregeneration.js), so a
    // bare-hash file carries no voice in its name and is attributed to Kimo.
    const found = new Map(); // md5 -> filename
    const scheme = new Map(); // md5 -> 'prefixed' | 'bare'
    let skippedDeprecated = 0;
    let offset = 0;
    for (;;) {
        const { data, error } = await db.storage.from(BUCKET).list('', { limit: 1000, offset });
        if (error) throw new Error(`storage list failed: ${error.message}`);
        if (!data || data.length === 0) break;
        for (const obj of data) {
            const prefixed = /^cached_([A-Za-z0-9]+)_([0-9a-f]{32})\.mp3$/.exec(obj.name);
            if (prefixed) {
                if (prefixed[1] !== KIMO) { skippedDeprecated++; continue; }
                // A prefixed file names its voice explicitly, so it wins over a bare-hash file
                // for the same md5 regardless of the order the pages of the listing arrive in.
                found.set(prefixed[2], obj.name);
                scheme.set(prefixed[2], 'prefixed');
                continue;
            }
            const bare = /^([0-9a-f]{32})\.mp3$/.exec(obj.name);
            if (!bare) continue;
            if (scheme.get(bare[1]) === 'prefixed') continue;
            found.set(bare[1], obj.name);
            scheme.set(bare[1], 'bare');
        }
        offset += data.length;
        if (data.length < 1000) break;
    }
    return { found, scheme, skippedDeprecated };
}

async function fetchAll(table, columns) {
    const rows = [];
    let from = 0;
    for (;;) {
        const { data, error } = await db.from(table).select(columns).range(from, from + 999);
        if (error) throw new Error(`${table}: ${error.message}`);
        if (!data || data.length === 0) break;
        rows.push(...data);
        if (data.length < 1000) break;
        from += 1000;
    }
    return rows;
}

/** Every string the site plausibly sent to TTS, deduplicated. */
async function candidateTexts() {
    const set = new Set();
    const add = v => { if (typeof v === 'string' && v.trim()) set.add(v.trim()); };

    for (const r of await fetchAll('dictionary_entries', 'pidgin, usage, examples')) {
        add(r.pidgin);
        add(r.usage);
        if (Array.isArray(r.examples)) r.examples.forEach(add);
        else add(r.examples);
    }
    for (const r of await fetchAll('phrases', 'pidgin, english')) { add(r.pidgin); add(r.english); }
    for (const r of await fetchAll('pickup_lines', 'pidgin')) add(r.pidgin);
    for (const r of await fetchAll('stories', 'title, pidgin_text')) { add(r.title); add(r.pidgin_text); }
    return [...set];
}

(async () => {
    console.log('🔎 Rebuilding translation_cache index from orphaned audio\n');

    const { found, scheme, skippedDeprecated } = await listCachedObjects();
    const schemeTotals = { prefixed: 0, bare: 0 };
    scheme.forEach(v => { schemeTotals[v]++; });
    console.log(`   indexable Kimo clips:         ${found.size}`);
    console.log(`     cached_{voice}_{md5}.mp3:   ${schemeTotals.prefixed}`);
    console.log(`     {md5}.mp3 (pre-generated):  ${schemeTotals.bare}`);
    console.log(`   skipped (deprecated voices):  ${skippedDeprecated}`);

    const texts = await candidateTexts();
    console.log(`   candidate source strings:     ${texts.length}\n`);

    // Paginated on purpose. A bare .select() is capped at 1000 rows by PostgREST, so once the
    // recovery succeeded and the table passed 1000 entries, an unpaginated read saw only the
    // first page and re-reported ~900 already-indexed clips as "recoverable" on every re-run.
    const existing = await fetchAll('translation_cache', 'md5_hash, direction');
    const already = new Set(existing.filter(r => r.direction === DIRECTION).map(r => r.md5_hash));

    const rows = [];
    const usedFiles = new Set();
    let viaPhonetic = 0, viaCanonical = 0;
    const recoveredByScheme = { prefixed: 0, bare: 0 };

    for (const text of texts) {
        const spoken = applyPronunciationCorrections(text);
        const canonicalHash = md5(text);      // what the running route looks up
        const phoneticHash = md5(spoken);     // what older filenames were named with

        let filename = null, matchedVia = null;
        if (found.has(phoneticHash)) { filename = found.get(phoneticHash); matchedVia = 'phonetic'; }
        else if (found.has(canonicalHash)) { filename = found.get(canonicalHash); matchedVia = 'canonical'; }
        if (!filename) continue;
        // Count AFTER the dedup checks, so the per-scheme totals always sum to the row count.
        if (already.has(canonicalHash) || usedFiles.has(filename)) continue;
        if (matchedVia === 'phonetic') viaPhonetic++; else viaCanonical++;
        recoveredByScheme[scheme.get(matchedVia === 'phonetic' ? phoneticHash : canonicalHash)]++;

        usedFiles.add(filename);
        rows.push({
            original_text: text,
            translated_text: spoken,
            direction: DIRECTION,
            voice_id: KIMO,
            audio_filename: filename,
            md5_hash: canonicalHash
        });
    }

    const unmatched = found.size - usedFiles.size;
    console.log(`   recoverable:                  ${rows.length}`);
    console.log(`     matched via phonetic hash:  ${viaPhonetic}`);
    console.log(`     matched via canonical hash: ${viaCanonical}`);
    console.log(`     from cached_* files:        ${recoveredByScheme.prefixed}`);
    console.log(`     from pre-generated files:   ${recoveredByScheme.bare}`);
    console.log(`   unmatched files left orphaned:${unmatched}`);
    console.log(`   (unmatched = audio whose source text is no longer in the database, or was\n    produced by a phonetic map that has since changed)\n`);

    if (rows.length) {
        console.log('   sample:');
        rows.slice(0, 8).forEach(r => console.log(`     "${r.original_text.slice(0, 40)}" -> "${r.translated_text.slice(0, 40)}"`));
        console.log('');
    }

    if (!APPLY) {
        console.log('ℹ️  Dry run. Re-run with --apply to write these rows.');
        return;
    }

    let written = 0;
    for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200);
        const { error } = await db.from('translation_cache')
            .upsert(chunk, { onConflict: 'md5_hash,direction,voice_id' });
        if (error) { console.error(`   ❌ chunk ${i / 200 + 1} failed: ${error.message}`); continue; }
        written += chunk.length;
        console.log(`   wrote ${written}/${rows.length}`);
    }
    console.log(`\n✅ Indexed ${written} previously-orphaned clips.`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
