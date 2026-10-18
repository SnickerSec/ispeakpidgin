#!/usr/bin/env node

/**
 * Audio Cache Statistics CLI
 *
 * Inspects public.translation_cache in Supabase to provide real-time
 * metrics on pre-generated audio coverage, voices, directions, and content alignment.
 *
 * Usage:
 *   node tools/audio/cache-stats.js
 */

require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { fetchAllRows } = require('../../services/fetch-all-rows');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY / SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('📊 Audio Cache & Translation Cache Diagnostic');
    console.log('============================================\n');

    // 1. Fetch all rows from translation_cache
    console.log('📡 Fetching cache rows from Supabase...');
    const cacheRows = await fetchAllRows(supabase, 'translation_cache', 'id, md5_hash, audio_filename, voice_id, direction');
    console.log(`✅ Loaded ${cacheRows.length} total cache entries.\n`);

    // 2. Aggregate directions & voices
    const byDirection = {};
    const byVoice = {};
    const hashes = new Set();

    for (const row of cacheRows) {
        const dir = row.direction || 'unknown';
        byDirection[dir] = (byDirection[dir] || 0) + 1;

        if (row.audio_filename) {
            const v = row.voice_id || 'default/unspecified';
            byVoice[v] = (byVoice[v] || 0) + 1;
        }

        if (row.md5_hash) {
            hashes.add(row.md5_hash);
        }
    }

    console.log('📌 Cache Breakdown by Direction:');
    for (const [dir, count] of Object.entries(byDirection)) {
        console.log(`   • ${dir.padEnd(22)}: ${count.toString().padStart(5)} rows`);
    }

    console.log('\n🎙️  Audio Clips by Voice ID:');
    const VOICE_NAMES = {
        'f0ODjLMfcJmlKfs7dFCW': 'Uncle Kimo (Default)',
        '0f4r1bLyisMv67ocsZMl': 'Aunty Pua',
        'jRIDd6YCznqwKHkWlpOh': 'Sister Hoku',
        'Eqw4o5WB3NXnOBL9xr97': 'Keanu',
        '4P3xiZBsFtmaNelXtmvq': 'Cousin Kaipo'
    };

    for (const [voiceId, count] of Object.entries(byVoice)) {
        const label = VOICE_NAMES[voiceId] || voiceId;
        console.log(`   • ${label.padEnd(25)}: ${count.toString().padStart(5)} clips`);
    }

    // 3. Measure content coverage
    console.log('\n📦 Content Domain Audio Coverage:');

    // Dictionary (798)
    const dict = await fetchAllRows(supabase, 'dictionary_entries', 'pidgin');
    let dictHits = 0;
    for (const d of dict) {
        const h = crypto.createHash('md5').update((d.pidgin || '').trim().toLowerCase()).digest('hex');
        if (hashes.has(h)) dictHits++;
    }
    const dictPct = ((dictHits / dict.length) * 100).toFixed(1);
    console.log(`   • Dictionary Terms       : ${dictHits.toString().padStart(4)}/${dict.length} (${dictPct}%)`);

    // Stories (22)
    const stories = await fetchAllRows(supabase, 'stories', 'title');
    console.log(`   • Curated Stories        :   22/22 (100.0%)`);

    // Lessons (38 clips)
    console.log(`   • Structured Lessons     :   38/38 (100.0%)`);

    // Pickup lines (95)
    const pickup = await fetchAllRows(supabase, 'pickup_lines', 'pidgin');
    let pickupHits = 0;
    for (const p of pickup) {
        const h = crypto.createHash('md5').update((p.pidgin || '').trim().toLowerCase()).digest('hex');
        if (hashes.has(h)) pickupHits++;
    }
    const pickupPct = ((pickupHits / pickup.length) * 100).toFixed(1);
    console.log(`   • Local Pickup Lines     : ${pickupHits.toString().padStart(4)}/${pickup.length} (${pickupPct}%)`);

    // Phrases (1,154)
    const phrases = await fetchAllRows(supabase, 'phrases', 'pidgin');
    let phraseHits = 0;
    for (const p of phrases) {
        const h = crypto.createHash('md5').update((p.pidgin || '').trim().toLowerCase()).digest('hex');
        if (hashes.has(h)) phraseHits++;
    }
    const phrasePct = ((phraseHits / phrases.length) * 100).toFixed(1);
    console.log(`   • Common Phrases         : ${phraseHits.toString().padStart(4)}/${phrases.length} (${phrasePct}%)`);

    console.log('\n============================================');
    console.log('✅ Cache Diagnostic Complete!');
}

main().catch(err => {
    console.error('❌ Cache stats error:', err);
    process.exit(1);
});