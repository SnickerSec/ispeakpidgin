#!/usr/bin/env node

/**
 * Pronunciation Audit Tool
 * Measures how well our phonetic rules cover the dictionary.
 */

require('dotenv').config();
const { supabase } = require('../../config/supabase');

// Shared pronunciation map (identical to elevenlabs-speech.js)
// Imported, never copied. This file used to carry hand-synced duplicates of BOTH the
// pronunciation map and the th-fronting table. They happened to be in sync, but nothing
// enforced it -- a comment asserting they were identical was the only guarantee, and the
// next edit to either side would have silently made this tool score a map users never hear.
// Requiring the runtime module makes divergence structurally impossible.
const {
    PIDGIN_PRONUNCIATION_MAP: globalPronunciationMap,
    PIDGIN_TH_WORDS,
    applyPronunciationCorrections,
    setPronunciationGuides
} = require('../../src/components/speech/elevenlabs-speech.js');

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

async function runAudit() {
    console.log('🎙️  Starting Dictionary Pronunciation Audit...\n');

    try {
        const { data: entries, error } = await supabase
            .from('dictionary_entries')
            .select('pidgin, english, category, pronunciation');

        if (error) throw error;

        // Inject the same authored guides routes/tts.js loads, so this audit scores what users
        // actually hear. Measuring the algorithm alone would understate coverage and, worse,
        // would once again be auditing something other than the shipped behaviour.
        const guideCount = setPronunciationGuides(entries);

        console.log(`📊 Auditing ${entries.length} terms (${guideCount} authored pronunciation guides in play)...\n`);

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
                        // Pidgin 'um (them/it) really is "um" -- get'um, chance 'um, geev 'um.
                        // Rewriting it to "oom" would be wrong, so these are not defects. This
                        // exception is why the audit previously reported four "problems" that
                        // were all the same non-problem.
                        const isUmWord = /(^|[\s'-])um\b/.test(correctedLower);
                        if (hasRemainingU && !isUmWord) {
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

            const authoredGuide = (entry.pronunciation || '').trim().toLowerCase().replace(/\s+/g, ' ');
            const fromGuide = !!authoredGuide && corrected.toLowerCase() === authoredGuide;

            return {
                word: original,
                phonetic: corrected,
                fromGuide,
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
                // Saying where the pronunciation came from makes the finding actionable: a
                // guide-sourced flag is a content fix in dictionary_entries.pronunciation, an
                // algorithm-sourced one is a code or map fix.
                const src = p.fromGuide ? 'authored guide' : 'algorithm';
                console.log(`❌ "${p.word}" -> "${p.phonetic}" [Score: ${p.score}, ${src}] | Issues: ${p.issues.join(', ')}`);
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
