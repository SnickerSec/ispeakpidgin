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

// Replicate the exact transformation logic from elevenlabs-speech.js
function applyPronunciationCorrections(text) {
    // Map of Pidgin words to phonetic spelling for better TTS pronunciation
    // Optimized specifically for ElevenLabs voices
    const pronunciationMap = {
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
        'slippahs': 'slip-pahz',
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
        'mālama da ʻāina': 'mah-lah-mah dah eye-nah',
        'nō ka ʻoi': 'noh kah oy',
        'a hui hou': 'ah-hoo-ee-hoh',
        'aʻole pilikia': 'ah-oh-leh pee-lee-kee-ah',
        'moopuna': 'mo-poo-nah',
        'li hing mui': 'lee hing moo-ee',
        'lilikoi': 'lee-lee-koy',
        'shave ice': 'shave ice',
        'plate lunch': 'plate lunch',
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
        'yesterday': 'yes-tah-deh'
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
    correctedText = correctedText.replace(/(\w+)er\b/g, '$1-ah');
    correctedText = correctedText.replace(/(\w+)ar\b/g, '$1-ah');
    correctedText = correctedText.replace(/(\w+)or\b/g, '$1-oh');

    // 3. Vowel Adjustments for Hawaiian words
    const isPidginLike = (word) => {
        // Exclude common English words that might trigger false positives
        const commonEnglish = ['you', 'your', 'out', 'about', 'around', 'sound', 'house', 'mouth', 'stout', 'shout'];
        if (commonEnglish.includes(word.toLowerCase())) return false;

        return /['ʻ]/.test(word) || pronunciationMap[word.replace(/['ʻ]/g, '')] || 
               ['ka', 'la', 'ma', 'na', 'ha', 'ke', 'le', 'me', 'ne', 'he', 'oi', 'ai', 'au', 'ei', 'ie', 'ou'].some(s => word.includes(s));
    };

    const words = correctedText.split(/\s+/);
    const processedWords = words.map(word => {
        const cleanWord = word.replace(/['ʻ]/g, '');
        if (pronunciationMap[word]) return pronunciationMap[word];
        if (pronunciationMap[cleanWord]) return pronunciationMap[cleanWord];
        
        if (isPidginLike(word)) {
            let w = word.replace(/['ʻ]/g, '-');
            w = w.replace(/ai/g, 'eye');
            w = w.replace(/au/g, 'ow');
            w = w.replace(/oi/g, 'oy');
            w = w.replace(/ei/g, 'ay');
            w = w.replace(/ie/g, 'ee-eh');
            w = w.replace(/^-/, '').replace(/-$/, '');
            return w;
        }
        return word;
    });
    
    correctedText = processedWords.join(' ');

    // 4. Hardcoded map
    const sortedKeys = Object.keys(pronunciationMap).sort((a, b) => b.length - a.length);
    sortedKeys.forEach(original => {
        const phonetic = pronunciationMap[original];
        const regex = new RegExp(`\\b${original}\\b`, 'gi');
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

            // Danger: Still contains okina? (ElevenLabs might stumble)
            if (corrected.includes('ʻ') || (corrected.includes("'") && !corrected.includes("..."))) {
                score -= 20;
                issues.push('Unresolved okinas');
            }

            // Danger: Contains Hawaiian vowel clusters but wasn't transformed?
            const clusters = ['ai', 'au', 'oi', 'ei', 'ie', 'ou'];
            clusters.forEach(c => {
                if (original.toLowerCase().includes(c) && !wasTransformed) {
                    // Check if the cluster is in an English exclusion
                    const commonEnglish = ['you', 'your', 'out', 'about', 'around', 'sound', 'house', 'mouth', 'stout', 'shout'];
                    const words = original.toLowerCase().split(/\s+/);
                    const hasExcludedWord = words.some(w => commonEnglish.includes(w) && w.includes(c));
                    
                    if (!hasExcludedWord) {
                        score -= 10;
                        issues.push(`Untransformed cluster: ${c}`);
                    }
                }
            });

            // Danger: Long words without hyphens
            const words = corrected.split(/\s+/);
            words.forEach(w => {
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
        const perfectScore = results.filter(r => r.score === 100).length;
        const problematic = results.filter(r => r.score < 100);

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
