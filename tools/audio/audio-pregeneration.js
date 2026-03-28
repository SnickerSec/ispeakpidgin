// Audio Pre-generation Script
// Fetches dictionary terms from Supabase and pre-generates high-quality audio via ElevenLabs
// Run with: node tools/audio/audio-pregeneration.js

require('dotenv').config({ path: '../../.env' });
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Reconstruct SUPABASE_URL if missing
let SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
        const payload = JSON.parse(Buffer.from(SUPABASE_SERVICE_ROLE_KEY.split('.')[1], 'base64').toString());
        if (payload && payload.ref) {
            SUPABASE_URL = `https://${payload.ref}.supabase.co`;
        }
    } catch (e) {}
}

const AUDIO_DIR = path.join(__dirname, '../../public/assets/audio');
const INDEX_FILE = path.join(AUDIO_DIR, 'index.json');

async function fetchTopEntries() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Supabase credentials missing');
        return [];
    }

    try {
        console.log('Fetching top dictionary entries from Supabase...');
        const url = `${SUPABASE_URL}/rest/v1/dictionary_entries?select=pidgin&order=pidgin.asc&limit=150`;
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
        const data = await response.json();
        return data.map(item => item.pidgin);
    } catch (error) {
        console.error('Error fetching entries:', error.message);
        return [];
    }
}

async function generateAudioFile(text, apiKey) {
    const normalizedText = text.trim().toLowerCase();
    const hash = crypto.createHash('md5').update(normalizedText).digest('hex');
    const filename = `${hash}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    // Check if file already exists
    try {
        await fs.access(filepath);
        console.log(`  ✓ Already exists: "${text}"`);
        return { text: normalizedText, filename };
    } catch {
        // File doesn't exist, generate it
    }

    const voiceId = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic local voice
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_flash_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8,
                    style: 0.0,
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            console.error(`  ✗ Failed to generate: "${text}" (${response.status})`);
            return null;
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(filepath, audioBuffer);
        console.log(`  ✨ Generated: "${text}" -> ${filename}`);
        return { text: normalizedText, filename };
    } catch (error) {
        console.error(`  ✗ Error generating "${text}":`, error.message);
        return null;
    }
}

async function main() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        console.error('❌ ELEVENLABS_API_KEY not found in .env');
        process.exit(1);
    }

    // Ensure audio directory exists
    await fs.mkdir(AUDIO_DIR, { recursive: true });

    const terms = await fetchTopEntries();
    if (terms.length === 0) {
        console.log('No terms found to process.');
        return;
    }

    console.log(`🚀 Starting audio seeding for ${terms.length} terms...\n`);

    const index = {};
    try {
        const existingIndex = await fs.readFile(INDEX_FILE, 'utf8');
        Object.assign(index, JSON.parse(existingIndex));
    } catch (e) {}

    let successCount = 0;
    
    // We only process in batches to be safe with rate limits
    for (let i = 0; i < terms.length; i++) {
        const term = terms[i];
        const result = await generateAudioFile(term, apiKey);
        
        if (result) {
            index[result.text] = result.filename;
            successCount++;
        }

        // Small delay to prevent API flooding
        if (i % 5 === 0) {
            await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Final index save
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
    
    console.log(`\n✅ Audio seeding complete!`);
    console.log(`📊 Successfully indexed: ${successCount} terms`);
    console.log(`📂 Audio files stored in: ${AUDIO_DIR}`);
    console.log(`📄 Index file: ${INDEX_FILE}`);
}

main().catch(console.error);
