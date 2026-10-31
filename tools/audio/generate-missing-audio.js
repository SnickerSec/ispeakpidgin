#!/usr/bin/env node

/**
 * Bulk Audio Generation & Audit Tool (Supabase Edition)
 * Audits and fills gaps for missing TTS audio across dictionary, phrases, and pickup lines.
 *
 * Usage:
 *   node tools/audio/generate-missing-audio.js --audit              # Audit coverage across all content tables
 *   node tools/audio/generate-missing-audio.js --audit --table phrases
 *   node tools/audio/generate-missing-audio.js --limit 10          # Generate audio for next 10 missing items
 *   node tools/audio/generate-missing-audio.js --limit 5 --table phrases
 *
 * NPM:
 *   npm run audio:audit:all
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { ELEVENLABS_BASE_URL } = require('../../services/ai-upstreams');
const { fetchAllRows } = require('../../services/fetch-all-rows');
const { loadPronunciationGuides } = require('../../services/pronunciation');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const {
    PIDGIN_PRONUNCIATION_MAP: globalPronunciationMap,
    applyPronunciationCorrections,
    ELEVENLABS_SYNTHESIS,
    KIMO_VOICE_ID
} = require('../../src/components/speech/elevenlabs-speech.js');

const BUCKET_NAME = 'audio-assets';
const VOICE_ID = KIMO_VOICE_ID; // Authentic local Uncle Kimo voice
const DIRECTION = 'tts';
const AUDIO_DIR = path.join(__dirname, '../../public/assets/audio');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseArgs(argv) {
    const args = argv.slice(2);
    const config = {
        audit: args.includes('--audit') || args.includes('--dry-run'),
        limit: 20,
        table: 'all',
        help: args.includes('--help') || args.includes('-h')
    };

    const limitIdx = args.indexOf('--limit');
    if (limitIdx !== -1 && args[limitIdx + 1]) {
        config.limit = parseInt(args[limitIdx + 1], 10) || 20;
    }

    const tableIdx = args.indexOf('--table');
    if (tableIdx !== -1 && args[tableIdx + 1]) {
        config.table = args[tableIdx + 1].toLowerCase();
    }

    return config;
}

/**
 * md5 hashes of every text translation_cache holds audio for: the store routes/tts.js serves
 * from, so "covered" here means "the site will play it without calling ElevenLabs". This used to
 * read audio-assets/index.json, which the site no longer consults and which had drifted.
 */
async function loadCachedHashes() {
    const rows = await fetchAllRows(supabase, 'translation_cache', 'md5_hash, audio_filename',
        { filter: q => q.eq('voice_id', VOICE_ID).eq('direction', DIRECTION) });
    return new Set(rows.filter(r => r.audio_filename).map(r => r.md5_hash));
}

const hashOf = text => crypto.createHash('md5').update(text.trim().toLowerCase()).digest('hex');

/**
 * Fetch all rows from a table with pagination past 1000 rows.
 */
async function fetchAllTableEntries(table) {
    const rows = await fetchAllRows(supabase, table, 'id, pidgin');
    return rows.map(r => r.pidgin && r.pidgin.trim()).filter(Boolean);
}

async function generateAndUpload(text) {
    const normalized = text.toLowerCase().trim();
    const hash = crypto.createHash('md5').update(normalized).digest('hex');
    const filename = `${hash}.mp3`;
    const correctedText = applyPronunciationCorrections(text);
    const apiUrl = `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${VOICE_ID}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text: correctedText,
            model_id: ELEVENLABS_SYNTHESIS.model_id,
            voice_settings: ELEVENLABS_SYNTHESIS.voice_settings
        })
    });

    if (!response.ok) {
        throw new Error(`ElevenLabs error: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, buffer, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    // Update translation_cache
    await supabase.from('translation_cache').upsert({
        original_text: text,
        translated_text: correctedText,
        direction: DIRECTION,
        voice_id: VOICE_ID,
        audio_filename: filename,
        md5_hash: hash
    }, { onConflict: 'md5_hash,direction,voice_id' });

    // Save locally if directory exists
    if (fs.existsSync(AUDIO_DIR)) {
        try {
            fs.writeFileSync(path.join(AUDIO_DIR, filename), buffer);
        } catch {}
    }

    return { filename, hash, spokenText: correctedText };
}

function printHelp() {
    console.log(`
🌺 ChokePidgin Bulk Audio Generation & Audit Tool
==================================================
Audits and generates pre-cached TTS audio across dictionary, phrases, and pickup lines.

Usage:
  node tools/audio/generate-missing-audio.js [options]

Options:
  --audit, --dry-run     Inspect audio coverage without generating any clips
  --table <name>         Filter table: dictionary, phrases, pickups, or all (default: all)
  --limit <number>       Maximum items to generate in this run (default: 20)
  --help, -h             Show this help screen

Examples:
  # Audit coverage across all content tables:
  node tools/audio/generate-missing-audio.js --audit

  # Audit phrase coverage only:
  node tools/audio/generate-missing-audio.js --audit --table phrases

  # Generate next 10 missing phrase clips:
  node tools/audio/generate-missing-audio.js --limit 10 --table phrases
`);
}

async function main() {
    const config = parseArgs(process.argv);

    if (config.help) {
        printHelp();
        process.exit(0);
    }

    console.log(`🎙️ ChokePidgin Audio Pipeline ${config.audit ? '(Audit Mode)' : ''}`);
    console.log('==================================================\n');

    // 1. Preload authored pronunciation guides
    await loadPronunciationGuides(supabase, { required: true });

    // 2. Load what translation_cache already holds
    const cached = await loadCachedHashes();
    console.log(`📦 translation_cache holds audio for ${cached.size} texts.\n`);

    // 3. Fetch content
    console.log('🔍 Fetching content entries across tables...');
    const tablesToFetch = [];
    if (config.table === 'all' || config.table === 'dictionary' || config.table === 'dictionary_entries') {
        tablesToFetch.push({ name: 'dictionary', table: 'dictionary_entries' });
    }
    if (config.table === 'all' || config.table === 'phrases') {
        tablesToFetch.push({ name: 'phrases', table: 'phrases' });
    }
    if (config.table === 'all' || config.table === 'pickups' || config.table === 'pickup_lines') {
        tablesToFetch.push({ name: 'pickup_lines', table: 'pickup_lines' });
    }
    if (config.table === 'all' || config.table === 'pickup_components' || config.table === 'pickup_line_components') {
        tablesToFetch.push({ name: 'pickup_line_components', table: 'pickup_line_components' });
    }

    const tableStats = [];
    const allMissingMap = new Map(); // term -> array of table names

    for (const t of tablesToFetch) {
        const rawEntries = await fetchAllTableEntries(t.table);
        const unique = Array.from(new Set(rawEntries.map(e => e.toLowerCase())));
        const covered = unique.filter(e => cached.has(hashOf(e)));
        const missing = unique.filter(e => !cached.has(hashOf(e)));

        tableStats.push({
            name: t.name,
            total: unique.length,
            covered: covered.length,
            missing: missing.length,
            pct: unique.length > 0 ? ((covered.length / unique.length) * 100).toFixed(1) : '100.0',
            missingItems: missing
        });

        for (const item of missing) {
            if (!allMissingMap.has(item)) {
                allMissingMap.set(item, []);
            }
            allMissingMap.get(item).push(t.name);
        }
    }

    // Print Audit Table
    console.log('📊 Audio Coverage Breakdown:');
    console.log('-'.repeat(55));
    for (const stat of tableStats) {
        console.log(`   ${stat.name.padEnd(16)}: ${stat.covered.toString().padStart(4)} / ${stat.total.toString().padEnd(4)} (${stat.pct}%)  Missing: ${stat.missing}`);
    }
    console.log('-'.repeat(55));

    const totalUniqueMissing = Array.from(allMissingMap.keys());
    console.log(`\n✨ Total unique terms missing audio: ${totalUniqueMissing.length}`);

    if (config.audit) {
        if (totalUniqueMissing.length > 0) {
            console.log('\n📝 Sample missing items:');
            for (const item of totalUniqueMissing.slice(0, 10)) {
                console.log(`   • "${item}" [${allMissingMap.get(item).join(', ')}]`);
            }
            console.log(`\n💡 To generate audio, run: node tools/audio/generate-missing-audio.js --limit 10`);
        } else {
            console.log('\n🎉 100% audio coverage! All terms across tables have warm pre-generated audio.');
        }
        return;
    }

    // Generation Mode
    if (totalUniqueMissing.length === 0) {
        console.log('\n✅ All terms already have warm audio.');
        return;
    }

    if (!ELEVENLABS_API_KEY) {
        console.error('\n❌ ELEVENLABS_API_KEY is required to generate audio.');
        process.exit(1);
    }

    const toGenerate = totalUniqueMissing.slice(0, config.limit);
    console.log(`\n🚀 Generating audio for ${toGenerate.length} terms (Limit: ${config.limit})...\n`);

    let successCount = 0;
    for (let i = 0; i < toGenerate.length; i++) {
        const item = toGenerate[i];
        process.stdout.write(`  [${i + 1}/${toGenerate.length}] "${item}"... `);

        try {
            const result = await generateAndUpload(item);
            cached.add(result.hash);
            successCount++;
            console.log('Generated! ✨');

            // Small delay to pace requests
            await new Promise(resolve => setTimeout(resolve, 600));
        } catch (err) {
            console.log('FAILED ❌', err.message);
        }
    }

    console.log(`\n✅ Generation complete: ${successCount}/${toGenerate.length} terms successfully synthesized and indexed.`);
    console.log(`📊 translation_cache now holds audio for ${cached.size} texts.`);
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
