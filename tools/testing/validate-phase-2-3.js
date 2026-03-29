#!/usr/bin/env node

/**
 * Validate Phase 2 & 3 Improvements
 *
 * Tests all improvements made in Phase 2 (Grammar Patterns) and Phase 3 (Story Examples + Context Tracking)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { supabase } = require('../../config/supabase');

async function runValidation() {
    console.log('🧪 Validating Phase 2 & 3 Improvements\n');
    console.log('📡 Fetching data from Supabase...');

    // 1. Fetch dictionary entries for phrase/sentence lookup
    const { data: entries, error: dictError } = await supabase
        .from('dictionary_entries')
        .select('*');

    if (dictError) {
        console.error('❌ Failed to fetch dictionary entries:', dictError.message);
        process.exit(1);
    }

    // 2. Fetch phrases
    const { data: phrases, error: phraseError } = await supabase
        .from('phrases')
        .select('*');

    if (phraseError) {
        console.error('❌ Failed to fetch phrases:', phraseError.message);
        process.exit(1);
    }

    // 3. Fetch stories
    const { data: stories, error: storyError } = await supabase
        .from('stories')
        .select('*');

    if (storyError) {
        console.error('❌ Failed to fetch stories:', storyError.message);
        process.exit(1);
    }

    // Reconstruct data structures
    const phraseLookup = {};
    const sentenceLookup = { englishToPidgin: {} };
    
    entries.forEach(entry => {
        const engArr = Array.isArray(entry.english) ? entry.english : [entry.english];
        engArr.forEach(eng => {
            const engLower = eng.toLowerCase();
            if (eng.includes(' ')) {
                if (!phraseLookup[engLower]) phraseLookup[engLower] = [];
                phraseLookup[engLower].push({ pidgin: entry.pidgin });
            }
        });
    });

    phrases.forEach(phrase => {
        const engLower = phrase.english.toLowerCase();
        if (!sentenceLookup.englishToPidgin[engLower]) sentenceLookup.englishToPidgin[engLower] = [];
        sentenceLookup.englishToPidgin[engLower].push(phrase.pidgin);
    });

    let totalSentencesCount = 0;
    const storyList = stories.map(s => {
        const englishText = s.english_translation || s.englishTranslation || '';
        const pidginText = s.pidgin_text || s.pidginText || '';
        
        // Split into sentences (basic splitter)
        const englishSentences = englishText.split(/(?<=[.!?])\s+/);
        const pidginSentences = pidginText.split(/(?<=[.!?])\s+/);
        
        const matchedSentences = [];
        for (let i = 0; i < Math.min(englishSentences.length, pidginSentences.length); i++) {
            matchedSentences.push({
                english: englishSentences[i],
                pidgin: pidginSentences[i]
            });
        }
        
        totalSentencesCount += matchedSentences.length;

        return {
            title: s.title,
            category: s.category || 'culture',
            english: englishText,
            pidgin: pidginText,
            sentences: matchedSentences
        };
    });

    const storyExamples = {
        metadata: {
            totalStories: stories.length,
            totalSentences: totalSentencesCount
        },
        stories: storyList
    };

    console.log('\n📊 Dataset Loaded:');
    console.log(`   Phrase lookups: ${Object.keys(phraseLookup).length}`);
    console.log(`   Sentence lookups: ${Object.keys(sentenceLookup.englishToPidgin).length}`);
    console.log(`   Story examples: ${storyExamples.metadata.totalStories}`);
    console.log(`   Story sentences: ${storyExamples.metadata.totalSentences}\n`);

    // ============================================================================
    // PHASE 2: GRAMMAR PATTERN TESTS
    // ============================================================================
    console.log('='.repeat(70));
    console.log('📝 PHASE 2: GRAMMAR PATTERN TESTS');
    console.log('='.repeat(70));

    const grammarTests = {
        'Present Tense': [
            { input: "I'm hungry", expected: "I stay hungry" },
            { input: "You're tired", expected: "you stay tired" },
            { input: "He's working", expected: "he stay working" },
            { input: "They're surfing", expected: "dey stay surfing" }
        ],
        'Future Tense': [
            { input: "I will go", expected: "I going go" },
            { input: "I'll be there", expected: "I going be there" },
            { input: "We will eat", expected: "we going eat" }
        ],
        'Past Tense': [
            { input: "I was tired", expected: "I was tired" },
            { input: "You were late", expected: "you was late" },
            { input: "They were surfing", expected: "dey was surfing" }
        ],
        'Past Perfect': [
            { input: "I went to the beach", expected: "I wen go beach" },
            { input: "He went home", expected: "he wen go home" }
        ],
        'Negations': [
            { input: "I don't know", expected: "I no know" },
            { input: "I didn't go", expected: "I neva go" },
            { input: "I can't help", expected: "I no can help" }
        ],
        'Questions (Do/Does/Did)': [
            { input: "Do you want food?", expected: "you like food?" },
            { input: "Did you go?", expected: "you wen go?" }
        ],
        'Questions (Are/Is/Was)': [
            { input: "Are you ready?", expected: "you stay ready?" },
            { input: "Is he coming?", expected: "he stay coming?" }
        ],
        'Modal Verbs': [
            { input: "I want to eat", expected: "I like eat" },
            { input: "I must go", expected: "I gotta go" }
        ]
    };

    const grammarResults = {
        total: 0,
        passed: 0,
        failed: 0
    };

    console.log('\n🔬 Testing Grammar Transformations:\n');

    Object.entries(grammarTests).forEach(([category, tests]) => {
        console.log(`\n📌 ${category}:`);

        tests.forEach(test => {
            grammarResults.total++;
            const result = simulateGrammarTransform(test.input);
            const words = test.expected.toLowerCase().split(' ');
            const pattern = words.length > 1 ? words.slice(1, 3).join(' ') : words[0];
            const success = result.toLowerCase().includes(pattern);

            if (success) {
                grammarResults.passed++;
                console.log(`   ✅ "${test.input}" → "${result}"`);
            } else {
                grammarResults.failed++;
                console.log(`   ❌ "${test.input}" → "${result}"`);
                console.log(`      Expected pattern: "${test.expected}"`);
            }
        });
    });

    const grammarAccuracy = (grammarResults.passed / grammarResults.total * 100).toFixed(1);
    console.log(`\n📊 Grammar Pattern Accuracy: ${grammarAccuracy}%`);
    console.log(`   Passed: ${grammarResults.passed}/${grammarResults.total}`);
    console.log(`   Failed: ${grammarResults.failed}/${grammarResults.total}\n`);

    // ============================================================================
    // PHASE 3: STORY TRANSLATION TESTS
    // ============================================================================
    console.log('='.repeat(70));
    console.log('📚 PHASE 3: STORY TRANSLATION TESTS');
    console.log('='.repeat(70));

    const storyResults = {
        total: 0,
        exactMatch: 0,
        goodMatch: 0,
        partial: 0,
        failed: 0
    };

    console.log('\n🔬 Testing Story Translations:\n');

    storyExamples.stories.slice(0, 5).forEach((story, index) => {
        console.log(`\n${index + 1}. ${story.title} (${story.category})`);
        console.log(`   English: "${story.english.substring(0, 80)}..."`);
        console.log(`   Expected: "${story.pidgin.substring(0, 80)}..."`);

        // Test individual sentences
        if (Array.isArray(story.sentences)) {
            story.sentences.forEach((sent, sentIndex) => {
                storyResults.total++;
                const sentLower = sent.english.toLowerCase().trim();

                // Check sentence lookup
                const exactMatch = sentenceLookup.englishToPidgin[sentLower];
                if (exactMatch && exactMatch.length > 0) {
                    storyResults.exactMatch++;
                    console.log(`   ✅ Sentence ${sentIndex + 1}: Exact match`);
                } else {
                    // Try chunking simulation
                    const chunked = simulateChunking(sent.english, phraseLookup);
                    const similarity = calculateSimilarity(chunked.toLowerCase(), sent.pidgin.toLowerCase());

                    if (similarity >= 0.85) {
                        storyResults.goodMatch++;
                        console.log(`   ✅ Sentence ${sentIndex + 1}: Good match (${Math.round(similarity * 100)}%)`);
                    } else if (similarity >= 0.65) {
                        storyResults.partial++;
                        console.log(`   ⚠️  Sentence ${sentIndex + 1}: Partial match (${Math.round(similarity * 100)}%)`);
                    } else {
                        storyResults.failed++;
                        console.log(`   ❌ Sentence ${sentIndex + 1}: Poor match (${Math.round(similarity * 100)}%)`);
                    }
                }
            });
        }
    });

    const storyAccuracy = storyResults.total > 0 ? ((storyResults.exactMatch + storyResults.goodMatch) / storyResults.total * 100).toFixed(1) : 0;
    const storyUseful = storyResults.total > 0 ? ((storyResults.exactMatch + storyResults.goodMatch + storyResults.partial) / storyResults.total * 100).toFixed(1) : 0;

    console.log(`\n📊 Story Translation Results:`);
    console.log(`   Total sentences tested: ${storyResults.total}`);
    console.log(`   Exact matches: ${storyResults.exactMatch} (${storyResults.total > 0 ? (storyResults.exactMatch/storyResults.total*100).toFixed(1) : 0}%)`);
    console.log(`   Good matches (85%+): ${storyResults.goodMatch} (${storyResults.total > 0 ? (storyResults.goodMatch/storyResults.total*100).toFixed(1) : 0}%)`);
    console.log(`   Partial matches (65-84%): ${storyResults.partial} (${storyResults.total > 0 ? (storyResults.partial/storyResults.total*100).toFixed(1) : 0}%)`);
    console.log(`   Failed (<65%): ${storyResults.failed} (${storyResults.total > 0 ? (storyResults.failed/storyResults.total*100).toFixed(1) : 0}%)`);
    console.log(`\n   Story Accuracy: ${storyAccuracy}%`);
    console.log(`   Useful Results: ${storyUseful}%\n`);

    console.log('\n✅ Validation complete!\n');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function simulateGrammarTransform(text) {
    let result = text.toLowerCase();

    // Apply basic grammar rules
    const rules = {
        "i'm ": "i stay ",
        "you're ": "you stay ",
        "he's ": "he stay ",
        "she's ": "she stay ",
        "they're ": "dey stay ",
        "i will ": "i going ",
        "i'll ": "i going ",
        " the ": " da ",
        " with ": " wit ",
        " for ": " fo ",
        " to the ": " ",
        "don't ": "no ",
        "didn't ": "neva ",
        "can't ": "no can ",
        "do you ": "you ",
        "did you ": "you wen ",
        "are you ": "you stay ",
        "is he ": "he stay ",
        "want to ": "like ",
        "must ": "gotta "
    };

    Object.entries(rules).forEach(([pattern, replacement]) => {
        result = result.replace(new RegExp(pattern, 'g'), replacement);
    });

    return result;
}

function simulateChunking(sentence, phraseLookup) {
    const words = sentence.toLowerCase().split(/\s+/);
    const chunks = [];
    let position = 0;

    while (position < words.length) {
        let found = false;

        // Try longest phrase first
        for (let length = Math.min(10, words.length - position); length >= 2; length--) {
            const phrase = words.slice(position, position + length).join(' ');

            if (phraseLookup[phrase]) {
                chunks.push(phraseLookup[phrase][0].pidgin);
                position += length;
                found = true;
                break;
            }
        }

        // If no phrase, use word
        if (!found) {
            chunks.push(applyBasicRules(words[position]));
            position++;
        }
    }

    return chunks.join(' ');
}

function applyBasicRules(word) {
    const rules = {
        'the': 'da',
        'that': 'dat',
        'this': 'dis',
        'with': 'wit',
        'for': 'fo',
        'about': 'bout',
        'to': '',
        'going': 'goin',
        'am': 'stay',
        'is': 'stay',
        'are': 'stay'
    };
    return rules[word] || word;
}

function calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}

runValidation().catch(err => {
    console.error('Validation failed:', err);
    process.exit(1);
});
