#!/usr/bin/env node

/**
 * Story Audio Generation Script
 * Voicing the "Talk Story" section using ElevenLabs
 */

require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BUCKET_NAME = 'audio-assets';
const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic local voice

if (!supabaseUrl || !supabaseServiceKey || !ELEVENLABS_API_KEY) {
    console.error('❌ Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or ELEVENLABS_API_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    'yesterday': 'yes-tah-deh'
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
    console.log('🎙️ Story Audio Generation');
    console.log('========================\n');

    try {
        // 1. Load index from Supabase
        const { data: indexBlob } = await supabase.storage.from(BUCKET_NAME).download('index.json');
        let index = indexBlob ? JSON.parse(await indexBlob.text()) : {};

        // 2. Fetch all stories
        const { data: stories, error } = await supabase.from('stories').select('id, title, pidgin_text');
        if (error) throw error;

        console.log(`📊 Found ${stories.length} stories.`);

        for (const story of stories) {
            const key = `story:${story.id}`;
            if (index[key]) {
                console.log(`⏭️  Skipping: "${story.title}" (Already exists)`);
                continue;
            }

            process.stdout.write(`🔊 Generating audio for: "${story.title}"... `);
            
            try {
                const filename = await generateAndUpload(story.pidgin_text);
                index[key] = filename;
                
                // Update story record with filename (optional but good practice)
                await supabase.from('stories').update({ audio_example: filename }).eq('id', story.id);
                
                // Save index to Supabase
                const indexStr = JSON.stringify(index, null, 2);
                await supabase.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(indexStr), {
                    contentType: 'application/json',
                    upsert: true
                });
                
                console.log('DONE ✨');
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.log('FAILED ❌', err.message);
            }
        }

        console.log('\n✨ All stories processed!');

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
    }
}

async function generateAndUpload(text) {
    const hash = crypto.createHash('md5').update(text.trim().toLowerCase()).digest('hex');
    const filename = `story_${hash}.mp3`;
    
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
            model_id: 'eleven_multilingual_v2', // Better for long text
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    });

    if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, buffer, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (error) throw error;
    return filename;
}

main();
