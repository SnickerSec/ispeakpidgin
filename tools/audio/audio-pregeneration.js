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
const globalPronunciationMap = {
    // "kine" should rhyme with "nine"
    'kine': 'kyne',
    'da kine': 'dah kyne',
    'da': 'dah',
    'any kine': 'any kyne',
    'small kine': 'small kyne',
    'funny kine': 'funny kyne',
    'fast kine': 'fast kyne',
    'faskine': 'fas-kyne',

    // Core Hawaiian/Pidgin words with specific phonetic needs
    'pau': 'pow',
    'pau hana': 'pow hah-nah',
    'mauka': 'mow-kah',
    'makai': 'mah-kye',
    'ono': 'oh-noh',
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
    'haole': 'how-lee',
    'poke': 'poh-kay',
    'musubi': 'moo-soo-bee',
    'shoyu': 'show-yoo',
    'mochi': 'mo-chee',
    'manapua': 'mah-nah-poo-ah',
    'malasada': 'mah-lah-sah-dah',
    'malasadas': 'mah-lah-sah-dahz',
    'kanak': 'kah-nahk',
    'grindz': 'gryndz',
    'grind': 'grynd',
    'kaukau': 'cow-cow',
    'kau kau': 'cow-cow',
    'cheehoo': 'chee-hoo!',
    'chee-hoo': 'chee-hoo!',
    'rajah': 'rah-jah',
    'shoots': 'shoots',
    'choke': 'choke',
    'bamboocha': 'bam-boo-chah',
    'akamai': 'ah-kah-my',
    'buggah': 'buh-gah',
    'niele': 'nee-eh-leh',
    'pilikia': 'pee-lee-kee-ah',
    'chee hu': 'chee-hoo!',
    'bust \'em up': 'bust em up',
    'bust em up': 'bust em up',
    'buss up': 'bus up',
    'fakafied': 'fah-kah-fyde',
    'ainokea': 'eye-no-kay-ah',
    'mo bettah': 'mo beh-tah',
    'kay den': 'kay den...',
    'aurite': 'ah-rye-t',
    'stink eye': 'stink eye',
    'chicken skin': 'chicken skin',
    'talk story': 'talk story',
    'broke da mouth': 'broke dah mowt',
    'broke da mout': 'broke dah mowt',
    'kanak attack': 'kah-nahk ah-tack',
    'mālama da ʻāina': 'mah-lah-mah dah eye-nah',
    'nō ka ʻoi': 'noh kah oy',
    'no ka oi': 'noh kah oy',
    'a hui hou': 'ah-hoo-ee-hoh',
    'aʻole pilikia': 'ah-oh-leh pee-lee-kee-ah',
    'aole pilikia': 'ah-oh-leh pee-lee-kee-ah',
    'moopuna': 'mo-poo-nah',
    'li hing mui': 'lee hing moo-ee',
    'lilikoi': 'lee-lee-koy',
    'shave ice': 'shave ice',
    'plate lunch': 'plate lunch',
    'loco moco': 'low-coh moh-coh',
    'ballah': 'bal-lah',
    'rubbah': 'rub-bah',
    'punani': 'poo-nah-nee',
    'boto': 'boh-toh',
    'faka': 'fah-kah',
    'hamajang': 'hah-mah-jahng',
    'mayjah': 'may-jah',
    'poho': 'poh-hoh',
    'rajah dat': 'rah-jah dat',
    'yobo': 'yo-boh',
    'wit\'': 'wit',
    'wit': 'wit',
    'yesterday': 'yes-tah-deh',
    'no make body': 'no make bah-dee',
    'if can can': 'if can, can',
    'if can, can': 'if can, can',
    'if no can no can': 'if no can, no can',
    'if no can, no can': 'if no can, no can',
    'gotta': 'got-tah',
    'heavies': 'heh-veez',
    'in da pit': 'in dah pit',
    'junk surf': 'junk surf',
    'shred da gnar': 'shred dah nahr',
    'guans': 'gwahnz',
    'habut': 'hah-boot',
    'gee vum': 'jee vum',
    'solid bro': 'solid bro',
    'too much style': 'too much style',
    'point break': 'point brayk',
    'dawn patrol': 'dawn pah-trohl',
    'close out': 'klohz owt',
    'drop in': 'drop een',
    'talk stink': 'talk steenk',
    'shave head': 'shayv hed',
    'spam musubi': 'spam moo-soo-bee',
    'poke bowl': 'poh-kay bohl',
    'choke grindz': 'choke gryndz',

    // Culture, Food & Nature
    'poi': 'poy',
    'luau': 'loo-ow',
    'laulau': 'laow-laow',
    'pipikaula': 'pee-pee-kow-lah',
    'haupia': 'how-pee-ah',
    'lomilomi': 'low-mee-low-mee',
    'lomi lomi': 'low-mee-low-mee',
    'kiawe': 'kee-ah-veh',
    'hula': 'hoo-lah',
    'halau': 'hah-laow',
    'hālau': 'hah-laow',
    'kumu': 'koo-moo',
    'malo': 'mah-low',
    'ti': 'tee',
    'lei': 'lay',
    'heiau': 'hay-ow',
    'menehune': 'meh-neh-hoo-neh',
    'alii': 'ah-lee-ee',
    'ali\'i': 'ah-lee-ee',
    'aliʻi': 'ah-lee-ee',
    'imu': 'ee-moo',
    'mo\'o': 'moh-oh',
    'moʻo': 'moh-oh',
    'pueo': 'poo-eh-oh',
    'nene': 'neh-neh',
    'nēnē': 'neh-neh',
    'hapa': 'hah-pah',
    'hapa haole': 'hah-pah how-lee',
    'mana': 'mah-nah',
    'pono': 'poh-noh',
    'lanakila': 'lah-nah-kee-lah',
    'kamaaina': 'kah-mah-eye-nah',
    'kama\'aina': 'kah-mah-eye-nah',
    'kamaʻāina': 'kah-mah-eye-nah',
    'makana': 'mah-kah-nah',
    'pualani': 'poo-ah-lah-nee',
    'kealoha': 'kay-ah-low-hah',
    'hoaloha': 'ho-ah-low-hah',
    'luana': 'loo-ah-nah',
    'huhu': 'hoo-hoo',
    'hūhū': 'hoo-hoo',
    'pupule': 'poo-poo-lay',
    'muliwai': 'moo-lee-vye',
    'moemoe': 'moy-moy',
    'nani': 'nah-nee',
    'ua': 'oo-ah',
    'bumbye': 'bum-bye',
    'bumbai': 'bum-bye',
    'latah': 'lay-tah',
    'latahs': 'lay-tahz',
    'later': 'lay-tah',
    'fo\'': 'foh',
    'fo': 'foh',
    'mahimahi': 'mah-hee-mah-hee',
    'mahi-mahi': 'mah-hee-mah-hee',
    'opihi': 'oh-pee-hee',
    'ʻopihi': 'oh-pee-hee',
    'limu': 'lee-moo',
    'hapai': 'hah-pye',
    'hāpai': 'hah-pye',
    'haumana': 'how-mah-nah',
    'haumāna': 'how-mah-nah',
    'holoholo': 'hoh-low-hoh-low',
    'huli huli': 'hoo-lee hoo-lee',
    'hulihuli': 'hoo-lee-hoo-lee',
    'kulolo': 'koo-low-low',
    'kūlolo': 'koo-low-low',
    'kahuna': 'kah-hoo-nah',
    'pikake': 'pee-kah-kay',
    'pīkake': 'pee-kah-kay',
    'pohaku': 'poh-hah-koo',
    'pōhaku': 'poh-hah-koo',
    'pua': 'poo-ah',
    'ukulele': 'oo-koo-lay-lay',
    'ʻukulele': 'oo-koo-lay-lay',
    'mana\'o': 'mah-nah-oh',
    'manaʻo': 'mah-nah-oh',
    'pali': 'pah-lee',
    'pahoehoe': 'pah-hoy-hoy',
    'pāhoehoe': 'pah-hoy-hoy',
    'tutu kane': 'too-too kah-nay',
    'tūtū kāne': 'too-too kah-nay',
    'hanabada': 'hah-nah-bah-dah',
    'obake': 'oh-bah-keh',
    'malihini': 'mah-lee-hee-nee',
    'aina': 'eye-nah',
    'ʻāina': 'eye-nah',
    'kai': 'kye',
    'mauna': 'mow-nah',
    'all pau': 'all pow',
    'kolohe': 'koh-low-hay',
    'no worry': 'no worry',
    'neva': 'neh-vah',
    'no can': 'no can',

    // Island Place Names
    'kailua': 'kye-loo-ah',
    'kaneohe': 'kah-nay-oh-hay',
    'kāneʻohe': 'kah-nay-oh-hay',
    'waikiki': 'wye-kee-kee',
    'waikīkī': 'wye-kee-kee',
    'haleiwa': 'hah-lay-ee-vah',
    'haleʻiwa': 'hah-lay-ee-vah',
    'waianae': 'wye-ah-nye',
    'waiʻanae': 'wye-ah-nye',
    'waimanalo': 'wye-mah-nah-low',
    'waimānalo': 'wye-mah-nah-low',
    'molokai': 'moh-loh-kye',
    'molokaʻi': 'moh-loh-kye',
    'kahului': 'kah-hoo-loo-ee',
    'hilo': 'hee-low',
    'kona': 'koh-nah',
    'punaluu': 'poo-nah-loo-oo',
    'punaluʻu': 'poo-nah-loo-oo',
    'kakaako': 'kah-kah-ah-koh',
    'kakaʻako': 'kah-kah-ah-koh',
    'kahala': 'kah-hah-lah',
    'kāhala': 'kah-hah-lah',
    'kapolei': 'kah-poh-lay',
    'mililani': 'mee-lee-lah-nee',
    'aiea': 'eye-eh-ah',
    'ʻaiea': 'eye-eh-ah',
    'makaha': 'mah-kah-hah',
    'mākaha': 'mah-kah-hah',
    'makawao': 'mah-kah-wow',
    'pukalani': 'poo-kah-lah-nee',
    'waimea': 'wye-may-ah',
    'hanalei': 'hah-nah-lay',
    'lahaina': 'lah-hye-nah',
    'lāhainā': 'lah-hye-nah',
    'ewa': 'eh-vah',
    'ʻewa': 'eh-vah',
    'honolulu': 'hoh-noh-loo-loo',
    'ala moana': 'ah-lah moh-ah-nah',
    'kapiolani': 'kah-pee-oh-lah-nee',
    'kapiʻolani': 'kah-pee-oh-lah-nee',
    'kalakaua': 'kah-lah-cow-ah',
    'kalākaua': 'kah-lah-cow-ah',
    'kuhio': 'koo-hee-oh',
    'kūhiō': 'koo-hee-oh',
    'waipahu': 'wye-pah-hoo',
    'kahuku': 'kah-hoo-koo',
    'laie': 'lah-ee-eh',
    'lāʻie': 'lah-ee-eh',
    'hanauma': 'hah-now-mah',
    'lanikai': 'lah-nee-kye',
    'koolau': 'koh-oh-laow',
    'koʻolau': 'koh-oh-laow',

    // Expanded Modern Slang & Food Expressions
    'kefe': 'keh-feh',
    'sukebe': 'soo-keh-beh',
    'hukilau': 'hoo-kee-laow',
    'tita': 'tee-tah',
    'menpachi': 'men-pah-chee',
    'menpachi eyes': 'men-pah-chee eyes',
    'chawan': 'chah-wahn',
    'moke': 'mohk',
    'two scoops': 'two skoops',
    'mac salad': 'mack salad'
};

// Helper to check if a word is likely Hawaiian/Pidgin (contains unique patterns)
function isPidginLike(word) {
    // Exclude common English words that might trigger false positives
    const commonEnglish = [
        'you', 'your', 'out', 'about', 'around', 'sound', 'house', 'mouth', 'stout', 'shout',
        'friend', 'believe', 'field', 'piece', 'view', 'die', 'lie', 'tie', 'tried',
        'cousin', 'jealous', 'touch', 'enough', 'rough', 'tough', 'young', 'country', 'should', 'would', 'could',
        'lunch', 'just', 'much', 'such', 'but', 'bus', 'up', 'us', 'under', 'until', 'uncle',
        'buss', 'buggah', 'bust', 'cuz', 'humbug', 'funny', 'rub', 'rubbah', 'surf', 'brush', 'crush', 'must', 'trust',
        'chance', 'dance', 'lance', 'glance', 'france', 'stance', 'bruddah', 'laff', 'chawan', 'stay', 'broke',
        'aunty', 'going', 'nails', 'worries', 'wait', 'bait', 'shark', 'choice', 'goin', 'townie', 'point', 'noise',
        'voice', 'boil', 'oil', 'soil', 'join', 'coin', 'enjoy', 'boy', 'toy', 'joy',
        'cut', 'joke', 'um', 'them', 'then', 'than', 'that', 'this', 'there', 'their', 'they', 'with', 'jealous',
        'mout', 'bout', 'bust', 'pilau', 'up', 'em'
    ];
    if (commonEnglish.includes(word.toLowerCase())) return false;

    return /['ʻ]/.test(word) || globalPronunciationMap[word.replace(/['ʻ]/g, '')] || 
           ['ka', 'la', 'ma', 'na', 'ha', 'ke', 'le', 'me', 'ne', 'he', 'oi', 'ai', 'au', 'ei', 'ie', 'ou', 'lua', 'pua', 'hua'].some(s => word.includes(s));
}

function applyPronunciationCorrections(text) {
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

    // 3. Vowel Adjustments for Hawaiian words
    const words = correctedText.split(/\s+/);
    const processedWords = words.map(word => {
        const cleanWord = word.replace(/['ʻ]/g, '');
        if (globalPronunciationMap[word]) return globalPronunciationMap[word];
        if (globalPronunciationMap[cleanWord]) return globalPronunciationMap[cleanWord];
        
        if (isPidginLike(word)) {
            let w = word.replace(/['ʻ]/g, '-');
            w = w.replace(/ai/g, 'eye');
            w = w.replace(/au/g, 'ow');
            w = w.replace(/oi/g, 'oy');
            w = w.replace(/ei/g, 'ay');
            w = w.replace(/ie/g, 'ee-eh');
            // Hawaiian 'u' sounds like 'oo' (as in hula, pupule)
            if (!w.includes('oo') && !w.includes('ow')) {
                // Only transform 'u' if it's not followed by certain consonants that usually stay 'u'
                // Or if it's a standalone 'u'
                w = w.replace(/\bu\b/g, 'oo');
                w = w.replace(/u(?![nstp])/g, 'oo');
            }
            w = w.replace(/^-/, '').replace(/-$/, '');
            return w;
        }
        return word;
    });
    
    correctedText = processedWords.join(' ');

    // 4. Hardcoded map
    const sortedKeys = Object.keys(globalPronunciationMap).sort((a, b) => b.length - a.length);
    sortedKeys.forEach(original => {
        const phonetic = globalPronunciationMap[original];
        const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        correctedText = correctedText.replace(regex, phonetic);
    });

    return correctedText;
}

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
