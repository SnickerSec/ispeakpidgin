#!/usr/bin/env node

/**
 * Bulk Audio Generation Script
 * Fills the gap for missing dictionary audio using ElevenLabs
 * and saves files locally to eliminate AI waste.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');
const { supabase } = require('../../config/supabase');

// Configuration
const BATCH_SIZE = 5; // Start small for testing
const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Kimo / Hawaiian
const AUDIO_DIR = path.join(__dirname, '../../src/assets/audio');
const INDEX_PATH = path.join(AUDIO_DIR, 'index.json');
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Create audio directory if it doesn't exist
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

async function main() {
    console.log('🎙️ Bulk Audio Generation (Static Asset Freeze)');
    console.log('============================================\n');

    if (!ELEVENLABS_API_KEY) {
        console.error('❌ ELEVENLABS_API_KEY not found.');
        process.exit(1);
    }

    try {
        // 1. Load current index
        let index = {};
        if (fs.existsSync(INDEX_PATH)) {
            index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
        }

        // 2. Fetch all entries from Supabase
        console.log('🔍 Fetching dictionary entries...');
        const { data: entries, error } = await supabase
            .from('dictionary_entries')
            .select('pidgin');

        if (error) throw error;

        // 3. Find missing audio
        const missing = entries.filter(e => !index[e.pidgin.toLowerCase()]);
        console.log(`📊 Found ${entries.length} total words.`);
        console.log(`📊 Found ${missing.length} words missing audio.`);

        if (missing.length === 0) {
            console.log('✅ All words have audio! No work to do.');
            return;
        }

        const toProcess = missing.slice(0, BATCH_SIZE);
        console.log(`🚀 Processing next batch of ${toProcess.length} words...\n`);

        for (const entry of toProcess) {
            const word = entry.pidgin;
            console.log(`🔊 Generating audio for: "${word}"...`);
            
            try {
                const filename = await generateAudio(word);
                if (filename) {
                    index[word.toLowerCase()] = filename;
                    // Save index incrementally so we don't lose progress on error
                    fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
                    console.log(`   ✅ Saved as ${filename}`);
                }
                
                // Rate limit protection
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (err) {
                console.error(`   ❌ Failed "${word}":`, err.message);
            }
        }

        console.log('\n✨ Batch processing complete!');
        console.log(`📄 Updated index at: ${INDEX_PATH}`);

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
    }
}

/**
 * Calls ElevenLabs API and saves the file
 */
async function generateAudio(text) {
    const hash = crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex');
    const filename = `${hash}.mp3`;
    const filePath = path.join(AUDIO_DIR, filename);

    // Apply basic phonetic corrections (minimal version of what's in the frontend)
    let correctedText = text.toLowerCase();
    if (correctedText === 'kine') correctedText = 'kyne';
    if (correctedText === 'pau') correctedText = 'pow';
    if (correctedText === 'akamai') correctedText = 'ah-kah-my';

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
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs error: ${response.status} - ${errText}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    return filename;
}

main();
