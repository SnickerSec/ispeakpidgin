#!/usr/bin/env node

/**
 * Pronunciation Audit Tool
 * Measures how well our phonetic rules cover the dictionary.
 */

require('dotenv').config();
const { supabase } = require('../../config/supabase');

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

// Helper to check if a word is likely Hawaiian/Pidgin (contains unique patterns)
function isPidginLike(word) {
    if (commonEnglish.includes(word.toLowerCase())) return false;

    return /['ʻ]/.test(word) || globalPronunciationMap[word.replace(/['ʻ]/g, '')] || 
           ['ka', 'la', 'ma', 'na', 'ha', 'ke', 'le', 'me', 'ne', 'he', 'oi', 'ai', 'au', 'ei', 'ie', 'ou', 'lua', 'pua', 'hua'].some(s => word.includes(s));
}

// Replicate the exact transformation logic from elevenlabs-speech.js
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

    // 5. Add natural pauses for Pidgin rhythm
    correctedText = correctedText
        .replace(/, /g, '... ') 
        .replace(/\beh\b(?!\.\.\.)/gi, 'eh...') 
        .replace(/\bhoh\b(?!\.\.\.)/gi, 'hoh...') 
        .replace(/\bbrah\b(?!\.\.\.)/gi, '...brah')
        .replace(/\byeah\b\?/gi, '...yeah?')
        .replace(/\bo wat\b\?/gi, '...or wat?');

    return correctedText;
}

async function runAudit() {
    console.log('🎙️  Starting Dictionary Pronunciation Audit...\n');

    try {
        const { data: entries, error } = await supabase
            .from('dictionary_entries')
            .select('pidgin, english, category');

        if (error) throw error;

        console.log(`📊 Auditing ${entries.length} terms...\n`);

        const results = entries.map(entry => {
            const original = entry.pidgin;
            const corrected = applyPronunciationCorrections(original);
            const wasTransformed = original.toLowerCase() !== corrected.toLowerCase();
            
            // Heuristic Scoring (0-100)
            let score = 100;
            const issues = [];

            // 1. Unresolved okinas
            if (corrected.includes('ʻ') || (corrected.includes("'") && !corrected.includes("..."))) {
                score -= 20;
                issues.push('Unresolved okinas');
            }

            // 2. Untransformed Hawaiian clusters
            const clusters = ['ai', 'au', 'oi', 'ei', 'ie', 'ou'];
            
            const words = original.toLowerCase().split(/[\s,?!.'ʻ-]+/);
            words.forEach(word => {
                if (word.length < 2) return;
                clusters.forEach(c => {
                    if (word.includes(c) && !commonEnglish.includes(word)) {
                        // Check if it was actually transformed in the final output
                        const wasClusterTransformed = !corrected.toLowerCase().includes(word);
                        if (!wasClusterTransformed) {
                            score -= 10;
                            issues.push(`Potential Hawaiian cluster untransformed: ${c} in "${word}"`);
                        }
                    }
                });
            });

            // 3. Unresolved 'th' in likely Pidgin phrases
            if (original.toLowerCase().includes('the ') || original.toLowerCase().includes(' this') || original.toLowerCase().includes(' that')) {
                if (corrected.toLowerCase().includes('the ') || corrected.toLowerCase().includes(' this') || corrected.toLowerCase().includes(' that')) {
                    score -= 15;
                    issues.push('Unresolved "th" in Pidgin context');
                }
            }

            // 4. Final 'r' in likely local words
            if (original.toLowerCase().endsWith('er') || original.toLowerCase().endsWith('ar')) {
                if (corrected.toLowerCase().endsWith('er') || corrected.toLowerCase().endsWith('ar')) {
                    // Only flag if it's not a common English word we want to keep standard
                    const keepStandardR = ['under', 'over', 'water', 'better', 'after']; // though usually these are changed in Pidgin
                    if (!keepStandardR.includes(original.toLowerCase())) {
                        score -= 10;
                        issues.push('Unresolved final "r"');
                    }
                }
            }

            // 5. 'U' sounds that should be 'oo' in Hawaiian words
            if (isPidginLike(original) && original.toLowerCase().includes('u') && !original.toLowerCase().includes('ou')) {
                const correctedLower = corrected.toLowerCase();
                if (!correctedLower.includes('oo') && !correctedLower.includes('ow') && !correctedLower.includes('ou')) {
                    if (correctedLower.includes('u')) {
                        // Check if 'u' is followed by n, s, t, or p which we excluded in logic
                        const hasRemainingU = /\bu\b/.test(correctedLower) || /\bu(?![nstp])/.test(correctedLower) || /[^nstp]u\b/.test(correctedLower);
                        if (hasRemainingU) {
                            score -= 5;
                            issues.push('Potential "u" -> "oo" missing');
                        }
                    }
                }
            }

            // 6. Long words without breaks
            const correctedWords = corrected.split(/\s+/);
            correctedWords.forEach(w => {
                if (w.length > 12 && !w.includes('-')) {
                    score -= 5;
                    issues.push(`Long word without hyphens: ${w}`);
                }
            });

            return {
                word: original,
                phonetic: corrected,
                transformed: wasTransformed,
                score,
                issues,
                category: entry.category
            };
        });

        // Summary Stats
        const total = results.length;
        const transformedCount = results.filter(r => r.transformed).length;
        const problematic = results.filter(r => r.score < 100).sort((a, b) => a.score - b.score);
        const perfectScore = total - problematic.length;

        console.log('--- Summary ---');
        console.log(`Total Terms: ${total}`);
        console.log(`Phonetically Mapped: ${transformedCount} (${((transformedCount/total)*100).toFixed(1)}%)`);
        console.log(`Confidence Score 100: ${perfectScore} (${((perfectScore/total)*100).toFixed(1)}%)`);
        console.log(`Potentially Problematic: ${problematic.length}\n`);

        if (problematic.length > 0) {
            console.log('--- Terms Needing Review (Score < 100) ---');
            problematic.forEach(p => {
                console.log(`❌ "${p.word}" -> "${p.phonetic}" [Score: ${p.score}] | Issues: ${p.issues.join(', ')}`);
            });
        }

        console.log('\n--- Sample of High-Confidence Transformations ---');
        results.filter(r => r.transformed && r.score === 100).slice(0, 10).forEach(r => {
            console.log(`✅ "${r.word}" -> "${r.phonetic}"`);
        });

    } catch (err) {
        console.error('❌ Audit failed:', err.message);
    }
}

runAudit();
