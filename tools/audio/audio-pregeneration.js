// Audio Pre-generation Script
// Fetches dictionary terms from Supabase and pre-generates high-quality audio via ElevenLabs
// Run with: node tools/audio/audio-pregeneration.js [--force] [--limit 50]

require('dotenv').config({ path: '../../.env' });
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { supabase } = require('../../config/supabase');

// Configuration
const AUDIO_DIR = path.join(__dirname, '../../public/assets/audio');
const INDEX_FILE = path.join(AUDIO_DIR, 'index.json');
const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic local voice

// Parse arguments
const args = process.argv.slice(2);
const FORCE_REGEN = args.includes('--force');
const LIMIT_ARG = args.indexOf('--limit');
const MAX_TO_GENERATE = LIMIT_ARG !== -1 ? parseInt(args[LIMIT_ARG + 1], 10) : 100;

// Pidgin pronunciation corrections for TTS (identical to elevenlabs-speech.js)
function applyPronunciationCorrections(text) {
    const pronunciationMap = {
        'kine': 'kyne',
        'da kine': 'dah kyne',
        'da': 'dah',
        'any kine': 'any kyne',
        'small kine': 'small kyne',
        'funny kine': 'funny kyne',
        'fast kine': 'fast kyne',
        'faskine': 'fas-kyne',
        'pau': 'pow',
        'pau hana': 'pow hah-nah',
        'mauka': 'mow-kah',
        'makai': 'mah-kye',
        'ono': 'oh-no',
        'oe': 'oh-eh',
        'ʻoe': 'oh-eh',
        'auwe': 'ow-way',
        'wahine': 'vah-hee-nay',
        'kane': 'kah-nay',
        'keiki': 'kay-kee',
        'tutu': 'too-too',
        'lanai': 'lah-nye',
        'mahalo': 'mah-hah-low',
        'aloha': 'ah-low-hah',
        'ohana': 'oh-hah-nah',
        'kokua': 'koh-koo-ah',
        'malama': 'mah-lah-mah',
        'kapu': 'kah-poo',
        'wiki': 'vee-kee',
        'wikiwiki': 'vee-kee-vee-kee',
        'pupus': 'poo-poos',
        'pupu': 'poo-poo',
        'gou': 'gow',
        'hale': 'hah-leh',
        'hele': 'heh-leh',
        'kupuna': 'koo-poo-nah',
        'lolo': 'low-low',
        'pilau': 'pee-lau',
        'puka': 'poo-kah',
        'humbug': 'hum-bug',
        'ho': 'hoh',
        'howzit': 'how-zit',
        'hana hou': 'hah-nah hoh-oo',
        'hanahou': 'hah-nah-hoh-oo',
        'wassamattayou': 'wah-sah-mah-tah-yoo',
        'whaddsdascoops': 'whah-dah-dah-skoops',
        'shaka': 'shah-kah',
        'slippahs': 'slippahz',
        'still': 'steel',
        'brah': 'brah',
        'bruddah': 'bruh-dah',
        'sistah': 'sis-tah',
        'cuz': 'kuz',
        'sole': 'so-leh',
        'pake': 'pah-keh',
        'haole': 'how-leh',
        'poke': 'poh-kay',
        'musubi': 'moo-soo-bee',
        'shoyu': 'show-yoo',
        'mochi': 'mo-chee',
        'manapua': 'mah-nah-poo-ah',
        'malasada': 'mah-lah-sah-dah',
        'kanak': 'kah-nahk',
        'grindz': 'gryndz',
        'grind': 'grynd',
        'kaukau': 'cow-cow',
        'cheehoo': 'chee-hoo!',
        'rajah': 'rah-jah',
        'shoots': 'shoots',
        'choke': 'choke',
        'bamboocha': 'bam-boo-chah',
        'akamai': 'ah-kah-my',
        'buggah': 'buh-gah',
        'niele': 'nee-eh-leh',
        'pilikia': 'pee-lee-kee-ah',
        'ainokea': 'eye-no-kay-ah',
        'mo bettah': 'mo beh-tah',
        'kay den': 'kay den...',
        'aurite': 'ah-rye-t',
        'stink eye': 'stink eye',
        'chicken skin': 'chicken skin',
        'talk story': 'talk story',
        'broke da mouth': 'broke dah mouth',
        'kanak attack': 'kah-nahk ah-tack',
        'li hing mui': 'lee hing moo-ee',
        'lilikoi': 'lee-lee-koy',
        'faka': 'fah-kah',
        'hamajang': 'hah-mah-jahng',
        'mayjah': 'may-jah',
        'poho': 'poh-hoh'
    };

    let correctedText = text.toLowerCase();

    // 1. Th-fronting
    const thWords = {
        'the': 'dah', 'that': 'daht', 'this': 'dis', 'them': 'dehm',
        'there': 'dea', 'then': 'dehn', 'their': 'dea', 'they': 'dey',
        'with': 'wit', 'mother': 'mah-dah', 'father': 'fah-dah', 'brother': 'bruh-dah'
    };
    
    Object.entries(thWords).forEach(([word, replacement]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        correctedText = correctedText.replace(regex, replacement);
    });

    // 2. Final 'r' dropping
    correctedText = correctedText.replace(/(\w+)er\b/g, '$1ah');
    correctedText = correctedText.replace(/(\w+)ar\b/g, '$1ah');
    correctedText = correctedText.replace(/(\w+)or\b/g, '$1oh');

    // Sort keys by length descending to match longer phrases first
    const sortedKeys = Object.keys(pronunciationMap).sort((a, b) => b.length - a.length);

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

    // Check if file already exists
    if (!FORCE_REGEN) {
        try {
            await fs.access(filepath);
            return { text: normalizedText, filename, skipped: true };
        } catch {
            // File doesn't exist, proceed to generate
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

    // Load existing index
    let index = {};
    try {
        const indexData = await fs.readFile(INDEX_FILE, 'utf8');
        index = JSON.parse(indexData);
        console.log(`📦 Loaded index with ${Object.keys(index).length} terms`);
    } catch (e) {
        console.log('📦 No existing index found, creating new one.');
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
                console.log('Already exists (Indexed)');
                skipCount++;
            } else {
                console.log('Generated! ✨');
                successCount++;
            }
        } else {
            console.log('FAILED ❌');
        }

        // Save index every 5 items
        if ((i + 1) % 5 === 0) {
            await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
        }

        // Rate limiting delay
        if (!result?.skipped) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Final index save
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
    
    console.log(`\n✅ Audio Pipeline Summary`);
    console.log('=======================');
    console.log(`✨ New audio generated: ${successCount}`);
    console.log(`⏭️  Skipped/Indexed: ${skipCount}`);
    console.log(`📊 Total now indexed: ${Object.keys(index).length}`);
    console.log(`📂 Audio stored in: public/assets/audio/`);
    
    if (successCount < termsToProcess.length) {
        console.log(`\n💡 Note: ${termsToProcess.length - successCount - skipCount} terms remain. Run again to process more.`);
    }
}

main().catch(error => {
    console.error('\n❌ Fatal Pipeline Error:', error);
    process.exit(1);
});
