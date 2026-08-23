// Audio Pre-generation Script
// Fetches dictionary terms from Supabase and pre-generates high-quality audio via ElevenLabs
// Run with: node tools/audio/audio-pregeneration.js [--force] [--limit 50]

require('dotenv').config({ path: '../../.env' });
const fs = require('fs').promises;
const path = require('path');
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

// Parse arguments
const args = process.argv.slice(2);
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
    const hash = crypto.createHash('md5').update(normalizedText).digest('hex');
    const filename = `${hash}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    // Check if file already exists locally or in Supabase
    // (For simplicity, we'll check local first if it exists, but the main goal is Supabase)
    if (!FORCE_REGEN) {
        try {
            await fs.access(filepath);
            return { text: normalizedText, filename, skipped: true };
        } catch {
            // Check Supabase Storage
            const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
                search: filename
            });
            if (data && data.length > 0) {
                return { text: normalizedText, filename, skipped: true };
            }
        }
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    const correctedText = applyPronunciationCorrections(text);

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

        return { text: normalizedText, filename, skipped: false };
    } catch (error) {
        console.error(`  ✗ Error generating "${text}":`, error.message);
        return null;
    }
}

async function main() {
    console.log('🎙️ ChokePidgin Audio Pipeline');
    console.log('===========================\n');

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        console.error('❌ ELEVENLABS_API_KEY not found in .env');
        process.exit(1);
    }

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

    for (let i = 0; i < toGenerate.length; i++) {
        const term = toGenerate[i];
        process.stdout.write(`  [${i + 1}/${toGenerate.length}] Processing: "${term}"... `);
        
        const result = await generateAudioFile(term, apiKey);
        
        if (result) {
            index[result.text] = result.filename;
            if (result.skipped) {
                console.log('Already exists');
                skipCount++;
            } else {
                console.log('Generated! ✨');
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
