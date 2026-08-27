// Audio Pre-generation Script
// Fetches dictionary terms from Supabase and pre-generates high-quality audio via ElevenLabs
// Run with: node tools/audio/audio-pregeneration.js [--force] [--limit 50]

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const fs = require('fs').promises;
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const AUDIO_DIR = path.join(__dirname, '../../public/assets/audio');
const INDEX_FILE = path.join(AUDIO_DIR, 'index.json');
const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic local voice
const BUCKET_NAME = 'audio-assets';
// routes/tts.js finds a cached clip by (md5_hash, voice_id, direction) in translation_cache and
// then downloads audio_filename. Uploading to the bucket without writing that row leaves the
// audio unreachable: the route re-synthesizes and re-bills ElevenLabs for a clip it already owns.
// That is exactly what happened here -- 1,780 pre-generated clips sat in storage with no index
// row until tools/audio/rebuild-cache-index.js recovered them. Every upload below now writes its
// row, so the two never drift apart again.
const DIRECTION = 'tts';

// Parse arguments
const args = process.argv.slice(2);
const IS_AUDIT = args.includes('--audit') || args.includes('--dry-run');
const FORCE_REGEN = args.includes('--force');
const LIMIT_ARG = args.indexOf('--limit');
const MAX_TO_GENERATE = LIMIT_ARG !== -1 ? parseInt(args[LIMIT_ARG + 1], 10) : 100;

// Shared pronunciation map (identical to elevenlabs-speech.js)
// Imported from the runtime speech engine, never copied. This file used to carry its own
// duplicate of the map (and of the th-fronting table) behind a comment claiming it was
// 'identical to elevenlabs-speech.js'. It was identical -- by luck, not by construction.
const {
    PIDGIN_PRONUNCIATION_MAP: globalPronunciationMap,
    PIDGIN_TH_WORDS,
    applyPronunciationCorrections,
    ELEVENLABS_SYNTHESIS
} = require('../../src/components/speech/elevenlabs-speech.js');

// Helper to check if a word is likely Hawaiian/Pidgin (contains unique patterns)


async function fetchAllEntries() {
    try {
        console.log('📡 Fetching all dictionary entries from Supabase...');
        const { data, error } = await supabase
            .from('dictionary_entries')
            .select('pidgin')
            .order('pidgin', { ascending: true });

        if (error) throw error;
        return data.map(item => item.pidgin);
    } catch (error) {
        console.error('❌ Error fetching entries:', error.message);
        return [];
    }
}

async function generateAudioFile(text, apiKey) {
    const normalizedText = text.trim().toLowerCase();
    // The same key routes/tts.js computes: md5 of the trimmed, lowercased CANONICAL text.
    const hash = crypto.createHash('md5').update(normalizedText).digest('hex');
    const filename = `${hash}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);
    const correctedText = applyPronunciationCorrections(text);

    // Check if file already exists locally or in Supabase
    // (For simplicity, we'll check local first if it exists, but the main goal is Supabase)
    if (!FORCE_REGEN) {
        try {
            await fs.access(filepath);
            return { text, normalized: normalizedText, spoken: correctedText, hash, filename, skipped: true };
        } catch {
            // Check Supabase Storage
            const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
                search: filename
            });
            if (data && data.length > 0) {
                return { text, normalized: normalizedText, spoken: correctedText, hash, filename, skipped: true };
            }
        }
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: correctedText,
                model_id: ELEVENLABS_SYNTHESIS.model_id,
                voice_settings: ELEVENLABS_SYNTHESIS.voice_settings
            })
        });

        if (!response.ok) {
            console.error(`  ✗ Failed to generate: "${text}" (${response.status})`);
            return null;
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());
        
        // 1. Save locally
        await fs.writeFile(filepath, audioBuffer);
        
        // 2. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filename, audioBuffer, {
                contentType: 'audio/mpeg',
                upsert: true
            });
        
        if (uploadError) {
            console.error(`  ✗ Failed to upload to Supabase: "${filename}"`, uploadError.message);
            // We still return the result because it was saved locally
        }

        return { text, normalized: normalizedText, spoken: correctedText, hash, filename, skipped: false };
    } catch (error) {
        console.error(`  ✗ Error generating "${text}":`, error.message);
        return null;
    }
}

/**
 * Write the translation_cache row that makes a stored clip reachable by routes/tts.js.
 *
 * Runs for skipped files too: a clip uploaded by an earlier version of this script has no row,
 * and re-running the pipeline is the natural place to backfill it. Upsert on the same conflict
 * target the route uses, so repeat runs are free.
 */
async function indexClip(result) {
    const { error } = await supabase.from('translation_cache').upsert({
        original_text: result.text,
        translated_text: result.spoken,
        direction: DIRECTION,
        voice_id: VOICE_ID,
        audio_filename: result.filename,
        md5_hash: result.hash
    }, { onConflict: 'md5_hash,direction,voice_id' });
    if (error) {
        // Loud, not silent. A clip that uploads but fails to index is a clip we pay for twice.
        console.error(`  ⚠️  cache index write failed for "${result.text}": ${error.message}`);
        return false;
    }
    return true;
}

async function main() {
    console.log(`🎙️ ChokePidgin Audio Pipeline ${IS_AUDIT ? '(Audit Mode)' : ''}`);
    console.log('===========================\n');

    // Ensure audio directory exists
    await fs.mkdir(AUDIO_DIR, { recursive: true });

    // Load existing index (Try Supabase first, then local)
    let index = {};
    try {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).download('index.json');
        if (data) {
            index = JSON.parse(await data.text());
            console.log(`📦 Loaded index from Supabase with ${Object.keys(index).length} terms`);
            // Save locally too for sync
            await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
        } else {
            throw new Error('Supabase index not found');
        }
    } catch (e) {
        try {
            const indexData = await fs.readFile(INDEX_FILE, 'utf8');
            index = JSON.parse(indexData);
            console.log(`📦 Loaded index from local file with ${Object.keys(index).length} terms`);
        } catch (localError) {
            console.log('📦 No existing index found, creating new one.');
        }
    }

    const allTerms = await fetchAllEntries();
    if (allTerms.length === 0) {
        console.log('❌ No terms found in Supabase.');
        return;
    }

    console.log(`🔍 Total terms in Supabase: ${allTerms.length}`);

    if (IS_AUDIT) {
        console.log(`\n📊 Audit Mode: Checking cache & storage coverage for ${allTerms.length} dictionary terms...`);
        const cachedRows = [];
        let from = 0;
        while (true) {
            const { data, error } = await supabase
                .from('translation_cache')
                .select('md5_hash, audio_filename')
                .eq('voice_id', VOICE_ID)
                .eq('direction', DIRECTION)
                .range(from, from + 999);
            if (error) {
                console.warn('Cache fetch warning:', error.message);
                break;
            }
            if (!data || data.length === 0) break;
            cachedRows.push(...data);
            if (data.length < 1000) break;
            from += 1000;
        }

        const cacheSet = new Set(cachedRows.map(r => r.md5_hash));
        let inStorageCount = 0;
        let inCacheCount = 0;
        let missingTerms = [];

        for (const term of allTerms) {
            const normalized = term.trim().toLowerCase();
            const hash = crypto.createHash('md5').update(normalized).digest('hex');
            const inIndex = Boolean(index[normalized]);
            const inCache = cacheSet.has(hash);
            if (inIndex) inStorageCount++;
            if (inCache) inCacheCount++;
            if (!inIndex && !inCache) missingTerms.push(term);
        }

        console.log('\n===================================================');
        console.log(`📊 Dictionary Audio Audit Summary:`);
        console.log(`   Total terms:           ${allTerms.length}`);
        console.log(`   In Storage (index):    ${inStorageCount}/${allTerms.length} (${((inStorageCount / allTerms.length) * 100).toFixed(1)}%)`);
        console.log(`   In translation_cache:  ${inCacheCount}/${allTerms.length} (${((inCacheCount / allTerms.length) * 100).toFixed(1)}%)`);
        console.log(`   Missing terms:         ${missingTerms.length}`);
        if (missingTerms.length > 0) {
            console.log(`   Sample missing:        ${missingTerms.slice(0, 5).join(', ')}`);
        }
        console.log('===================================================\n');
        return;
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        console.error('❌ ELEVENLABS_API_KEY not found in .env');
        process.exit(1);
    }

    // Identify terms that need audio
    const termsToProcess = allTerms.filter(term => {
        const normalized = term.trim().toLowerCase();
        return FORCE_REGEN || !index[normalized];
    });

    console.log(`✨ Terms needing audio: ${termsToProcess.length}`);
    
    if (termsToProcess.length === 0) {
        console.log('\n✅ All terms already have audio. Use --force to regenerate.');
        return;
    }

    const toGenerate = termsToProcess.slice(0, MAX_TO_GENERATE);
    console.log(`🚀 Processing ${toGenerate.length} terms (Limit: ${MAX_TO_GENERATE})...\n`);

    let successCount = 0;
    let skipCount = 0;
    let indexedCount = 0;

    for (let i = 0; i < toGenerate.length; i++) {
        const term = toGenerate[i];
        process.stdout.write(`  [${i + 1}/${toGenerate.length}] Processing: "${term}"... `);
        
        const result = await generateAudioFile(term, apiKey);
        
        if (result) {
            index[result.normalized] = result.filename;
            const indexed = await indexClip(result);
            if (indexed) indexedCount++;
            if (result.skipped) {
                console.log(indexed ? 'Already exists' : 'Already exists (NOT indexed)');
                skipCount++;
            } else {
                console.log(indexed ? 'Generated! ✨' : 'Generated (NOT indexed) ⚠️');
                successCount++;
            }
        } else {
            console.log('FAILED ❌');
        }

        // Save index every 10 items
        if ((i + 1) % 10 === 0) {
            const indexStr = JSON.stringify(index, null, 2);
            await fs.writeFile(INDEX_FILE, indexStr);
            await supabase.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(indexStr), {
                contentType: 'application/json',
                upsert: true
            });
        }

        // Rate limiting delay
        if (!result?.skipped) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Final index save
    const finalIndexStr = JSON.stringify(index, null, 2);
    await fs.writeFile(INDEX_FILE, finalIndexStr);
    await supabase.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(finalIndexStr), {
        contentType: 'application/json',
        upsert: true
    });
    
    console.log(`\n✅ Audio Pipeline Summary`);
    console.log('=======================');
    console.log(`✨ New audio generated: ${successCount}`);
    console.log(`⏭️  Skipped/Indexed: ${skipCount}`);
    console.log(`🔗 Reachable via translation_cache: ${indexedCount}/${successCount + skipCount}`);
    console.log(`📊 Total now indexed: ${Object.keys(index).length}`);
    console.log(`📂 Audio stored in Supabase bucket: ${BUCKET_NAME}`);
    
    if (successCount < termsToProcess.length) {
        console.log(`\n💡 Note: ${termsToProcess.length - successCount - skipCount} terms remain. Run again to process more.`);
    }
}

main().catch(error => {
    console.error('\n❌ Fatal Pipeline Error:', error);
    process.exit(1);
});
