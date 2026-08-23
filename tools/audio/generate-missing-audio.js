#!/usr/bin/env node

/**
 * Bulk Audio Generation Script (Supabase Edition)
 * Fills the gap for missing audio across dictionary, phrases, and pickup lines
 * and saves files to Supabase Storage to eliminate AI waste.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BUCKET_NAME = 'audio-assets';
const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic local voice

if (!supabaseUrl || !supabaseServiceKey || !ELEVENLABS_API_KEY) {
    console.error('❌ Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or ELEVENLABS_API_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const AUDIO_DIR = path.join(__dirname, '../../public/assets/audio');

// Configuration
const BATCH_SIZE = 500; 

// Shared pronunciation map (identical to elevenlabs-speech.js)
// Imported from the runtime speech engine. This file used to carry a 32-entry subset of the
// map plus its own copy of the transform, so generated clips were pronounced differently --
// and far less locally -- than what users hear live from /api/text-to-speech.
const {
    PIDGIN_PRONUNCIATION_MAP: globalPronunciationMap,
    applyPronunciationCorrections,
    ELEVENLABS_SYNTHESIS
} = require('../../src/components/speech/elevenlabs-speech.js');


async function main() {
    console.log('🎙️ Bulk Audio Generation (Supabase Version)');
    console.log('==========================================\n');

    try {
        // 1. Load index from Supabase
        console.log('📡 Downloading index.json from Supabase...');
        const { data: indexBlob, error: downloadError } = await supabase.storage.from(BUCKET_NAME).download('index.json');
        let index = {};
        if (indexBlob) {
            index = JSON.parse(await indexBlob.text());
            console.log(`✅ Loaded index with ${Object.keys(index).length} terms.`);
        } else {
            console.log('⚠️ No index found in Supabase, starting fresh.');
        }

        // 2. Fetch all entries from multiple tables
        console.log('🔍 Fetching all text entries...');
        const [dictRes, phrasesRes, pickupRes] = await Promise.all([
            supabase.from('dictionary_entries').select('pidgin'),
            supabase.from('phrases').select('pidgin'),
            supabase.from('pickup_lines').select('pidgin')
        ]);

        const allEntries = [
            ...(dictRes.data || []),
            ...(phrasesRes.data || []),
            ...(pickupRes.data || [])
        ].map(e => e.pidgin.trim());

        // Unique normalized list
        const uniqueEntries = [...new Set(allEntries.map(e => e.toLowerCase()))];
        console.log(`📊 Found ${uniqueEntries.length} unique terms across all tables.`);

        // 3. Find missing audio
        const missing = uniqueEntries.filter(e => !index[e]);
        console.log(`📊 Found ${missing.length} terms missing audio.`);

        if (missing.length === 0) {
            console.log('✅ All terms have audio! No work to do.');
            return;
        }

        const toProcess = missing.slice(0, BATCH_SIZE);
        console.log(`🚀 Processing next batch of ${toProcess.length} terms...\n`);

        for (let i = 0; i < toProcess.length; i++) {
            const word = toProcess[i];
            process.stdout.write(`  [${i + 1}/${toProcess.length}] "${word}"... `);
            
            try {
                const result = await generateAndUpload(word);
                if (result) {
                    index[word] = result;
                    // Save index incrementally to Supabase
                    const indexStr = JSON.stringify(index, null, 2);
                    await supabase.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(indexStr), {
                        contentType: 'application/json',
                        upsert: true
                    });

                    // Also update local index.json if directory exists
                    if (fs.existsSync(AUDIO_DIR)) {
                        fs.writeFileSync(path.join(AUDIO_DIR, 'index.json'), indexStr);
                    }
                    console.log('DONE ✨');
                }
                
                await new Promise(resolve => setTimeout(resolve, 800));
            } catch (err) {
                console.log('FAILED ❌', err.message);
            }
        }

        console.log('\n✨ Batch processing complete!');

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
    }
}

async function generateAndUpload(text) {
    const hash = crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex');
    const filename = `${hash}.mp3`;
    
    const correctedText = applyPronunciationCorrections(text);
    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    
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
        throw new Error(`ElevenLabs error: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Upload to Supabase
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, buffer, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (error) throw error;
    
    // Also save locally if dir exists
    if (fs.existsSync(AUDIO_DIR)) {
        fs.writeFileSync(path.join(AUDIO_DIR, filename), buffer);
    }

    return filename;
}

main();
