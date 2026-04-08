#!/usr/bin/env node

/**
 * Pronunciation Audit Tool
 * Measures how well our phonetic rules cover the dictionary.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Common Hawaiian/Pidgin words with specific phonetic needs
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
    'chee hu': 'chee-hoo!',
    'pilau': 'pee-lau',
    'bust \'em up': 'bust em up',
    'bust em up': 'bust em up',
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
    'poho': 'poh-hoh',
    'rajah dat': 'rajah dat',
    'yobo': 'yo-boh',
    'wit\'': 'wit',
    'wit': 'wit',
    'yesterday': 'yes-tah-deh'
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
