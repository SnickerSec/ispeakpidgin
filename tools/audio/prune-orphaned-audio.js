#!/usr/bin/env node
/**
 * Delete cached TTS audio that nothing points at.
 *
 * Two categories, both safe to remove:
 *   - deprecated voices: Aunty/Braddah clips left over from before those voices were dropped.
 *     They are deliberately never indexed, so they can only ever be dead weight.
 *   - orphaned Kimo clips: audio uploaded while translation_cache did not exist, whose source
 *     text tools/audio/rebuild-cache-index.js could not identify. Regenerating one on demand
 *     costs a single ElevenLabs call; guessing at its text would risk serving the wrong
 *     pronunciation for a word, which is worse.
 *
 * Files referenced by translation_cache.audio_filename are never deleted, and pre-generated
 * audio (named <hash>.mp3, no cached_ prefix) is out of scope entirely.
 *
 *   node tools/audio/prune-orphaned-audio.js           # dry run
 *   node tools/audio/prune-orphaned-audio.js --apply   # delete
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const APPLY = process.argv.includes('--apply');
const KIMO = 'f0ODjLMfcJmlKfs7dFCW';
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
    // Every cached_* object currently in the bucket
    const objects = [];
    for (let offset = 0; ; ) {
        const { data, error } = await db.storage.from('audio-assets').list('', { limit: 1000, offset });
        if (error) throw new Error(error.message);
        if (!data || !data.length) break;
        objects.push(...data.map(o => o.name));
        offset += data.length;
        if (data.length < 1000) break;
    }
    const cached = objects.filter(n => /^cached_/.test(n));
    const pregenerated = objects.filter(n => !/^cached_/.test(n));

    // Anything the cache index points at must survive.
    const referenced = new Set();
    for (let from = 0; ; from += 1000) {
        const { data, error } = await db.from('translation_cache').select('audio_filename').range(from, from + 999);
        if (error) throw new Error(error.message);
        if (!data || !data.length) break;
        data.forEach(r => r.audio_filename && referenced.add(r.audio_filename));
        if (data.length < 1000) break;
    }

    const deprecated = cached.filter(n => !n.startsWith(`cached_${KIMO}_`));
    const orphaned = cached.filter(n => n.startsWith(`cached_${KIMO}_`) && !referenced.has(n));
    const keep = cached.filter(n => referenced.has(n));
    const doomed = [...new Set([...deprecated, ...orphaned])].filter(n => !referenced.has(n));

    console.log(`  objects in bucket:        ${objects.length}`);
    console.log(`  pre-generated (untouched):${pregenerated.length}`);
    console.log(`  cached_* total:           ${cached.length}`);
    console.log(`    referenced by index:    ${keep.length}  <- KEEP`);
    console.log(`    deprecated voice:       ${deprecated.length}  <- delete`);
    console.log(`    orphaned Kimo:          ${orphaned.length}  <- delete`);
    console.log(`  to delete:                ${doomed.length}`);

    const overlap = doomed.filter(n => referenced.has(n));
    if (overlap.length) { console.error(`  ❌ ABORT: ${overlap.length} referenced files in delete set`); process.exit(1); }
    console.log('  ✅ safety check: no referenced file is in the delete set');

    if (!APPLY) { console.log('\n  dry run — pass --apply to delete'); return; }

    let removed = 0;
    for (let i = 0; i < doomed.length; i += 100) {
        const batch = doomed.slice(i, i + 100);
        const { error } = await db.storage.from('audio-assets').remove(batch);
        if (error) { console.error(`  ❌ batch ${i / 100 + 1}: ${error.message}`); continue; }
        removed += batch.length;
    }
    console.log(`\n  ✅ deleted ${removed} files`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
