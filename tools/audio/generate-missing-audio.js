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
const globalPronunciationMap = {
    'kine': 'kyne', 'da kine': 'dah kyne', 'da': 'dah', 'any kine': 'any kyne',
    'small kine': 'small kyne', 'funny kine': 'funny kyne', 'fast kine': 'fast kyne',
    'faskine': 'fas-kyne', 'pau': 'pow', 'pau hana': 'pow hah-nah', 'mauka': 'mow-kah',
    'makai': 'mah-kye', 'ono': 'oh-no', 'oe': 'oh-eh', 'ʻoe': 'oh-eh', 'auwe': 'ow-way',
    'wahine': 'vah-hee-nay', 'kane': 'kah-nay', 'keiki': 'kay-kee', 'tutu': 'too-too',
    'lanai': 'lah-nye', 'mahalo': 'mah-hah-low', 'aloha': 'ah-low-hah', 'ohana': 'oh-hah-nah',
    'kokua': 'koh-koo-ah', 'malama': 'mah-lah-mah', 'kapu': 'kah-poo', 'wiki': 'vee-kee',
    'wikiwiki': 'vee-kee-vee-kee', 'pupus': 'poo-poos', 'pupu': 'poo-poo', 'gou': 'gow',
    'hale': 'hah-leh', 'hele': 'heh-leh', 'kupuna': 'koo-poo-nah', 'lolo': 'low-low',
    'pilau': 'pee-lau', 'puka': 'poo-kah', 'humbug': 'hum-bug', 'ho': 'hoh',
    'howzit': 'how-zit', 'hana hou': 'hah-nah hoh-oo', 'hanahou': 'hah-nah-hoh-oo',
    'wassamattayou': 'wah-sah-mah-tah-yoo', 'whaddsdascoops': 'whah-dah-dah-skoops',
    'shaka': 'shah-kah', 'slippahs': 'slippahz', 'still': 'steel', 'brah': 'brah',
    'bruddah': 'bruh-dah', 'sistah': 'sis-tah', 'cuz': 'kuz', 'sole': 'so-leh',
    'pake': 'pah-keh', 'haole': 'how-leh', 'poke': 'poh-kay', 'musubi': 'moo-soo-bee',
    'shoyu': 'show-yoo', 'mochi': 'mo-chee', 'manapua': 'mah-nah-poo-ah',
    'malasada': 'mah-lah-sah-dah', 'kanak': 'kah-nahk', 'grindz': 'gryndz',
    'grind': 'grynd', 'kaukau': 'cow-cow', 'cheehoo': 'chee-hoo!', 'rajah': 'rah-jah',
    'shoots': 'shoots', 'choke': 'choke', 'bamboocha': 'bam-boo-chah',
    'akamai': 'ah-kah-my', 'buggah': 'buh-gah', 'niele': 'nee-eh-leh',
    'pilikia': 'pee-lee-kee-ah', 'chee hu': 'chee-hoo!', 'pilau': 'pee-lau',
    'bust \'em up': 'bust em up', 'bust em up': 'bust em up', 'ainokea': 'eye-no-kay-ah',
    'mo bettah': 'mo beh-tah', 'kay den': 'kay den...', 'aurite': 'ah-rye-t',
    'stink eye': 'stink eye', 'chicken skin': 'chicken skin', 'talk story': 'talk story',
    'broke da mouth': 'broke dah mouth', 'kanak attack': 'kah-nahk ah-tack',
    'mālama da ʻāina': 'mah-lah-mah dah eye-nah', 'nō ka ʻoi': 'noh kah oy',
    'a hui hou': 'ah-hoo-ee-oh', 'aʻole pilikia': 'ah-oh-leh pee-lee-kee-ah',
    'moopuna': 'mo-poo-nah', 'li hing mui': 'lee hing moo-ee', 'lilikoi': 'lee-lee-koy',
    'shave ice': 'shave ice', 'plate lunch': 'plate lunch', 'ballah': 'bal-lah',
    'rubbah': 'rub-bah', 'punani': 'poo-nah-nee', 'boto': 'boh-toh', 'faka': 'fah-kah',
    'hamajang': 'hah-mah-jahng', 'mayjah': 'may-jah', 'poho': 'poh-hoh',
    'rajah dat': 'rah-jah dat', 'yobo': 'yo-boh', 'wit\'': 'wit', 'wit': 'wit',
    'yesterday': 'yes-tah-deh', 'shoots brah': 'shoots brah', 'cousin cuz': 'kuz-in kuz',
    'mempachi': 'mem-pah-chee', 'menpachi': 'mem-pah-chee', 'you da best': 'you dah best',
    'you da man': 'you dah man'
    };

function applyPronunciationCorrections(text) {
    let correctedText = text.toLowerCase();
    const thWords = {
        'the': 'dah', 'that': 'daht', 'this': 'dis', 'them': 'dehm',
        'there': 'dea', 'then': 'dehn', 'their': 'dea', 'they': 'dey',
        'with': 'wit', 'mother': 'mah-dah', 'father': 'fah-dah', 'brother': 'bruh-dah'
    };
    Object.entries(thWords).forEach(([word, replacement]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        correctedText = correctedText.replace(regex, replacement);
    });
    correctedText = correctedText.replace(/(\w+)er\b/g, '$1ah');
    correctedText = correctedText.replace(/(\w+)ar\b/g, '$1ah');
    correctedText = correctedText.replace(/(\w+)or\b/g, '$1oh');
    
    const sortedKeys = Object.keys(globalPronunciationMap).sort((a, b) => b.length - a.length);
    sortedKeys.forEach(original => {
        const phonetic = globalPronunciationMap[original];
        const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        correctedText = correctedText.replace(regex, phonetic);
    });
    return correctedText;
}

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
            model_id: 'eleven_flash_v2_5',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.8
            }
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
