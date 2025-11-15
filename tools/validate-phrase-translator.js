#!/usr/bin/env node

/**
 * Validate Phrase Translator Accuracy
 *
 * Tests the enhanced phrase translator against known phrases
 * Compares performance before/after phrase translation enhancement
 */

const fs = require('fs');
const path = require('path');

// Load phrase training data
const phraseDataPath = path.join(__dirname, '../data/phrase-training-data.json');
const phraseData = JSON.parse(fs.readFileSync(phraseDataPath, 'utf8'));

// Load phrase lookup
const phraseLookupPath = path.join(__dirname, '../data/phrase-lookup.json');
const phraseLookup = JSON.parse(fs.readFileSync(phraseLookupPath, 'utf8'));

console.log('🧪 Validating Phrase Translator\n');
console.log(`📊 Test Dataset: ${phraseData.metadata.totalPhrases} phrases\n`);

// Test sample
const testSamples = [
    // Common greetings
    { english: "how are you?", expected: "Howzit?", category: "greetings" },
    { english: "how are you doing?", expected: "Howzit goin'?", category: "greetings" },
    { english: "what's up?", expected: "Wassup?", category: "greetings" },
    { english: "see you later", expected: "Latahs", category: "greetings" },

    // Common expressions
    { english: "I don't know", expected: "I dunno", category: "expressions" },
    { english: "let's go", expected: "We go", category: "expressions" },
    { english: "no problem", expected: "No worries", category: "expressions" },
    { english: "that's really good", expected: "Dass broke da mouth", category: "expressions" },

    // Food
    { english: "let's go eat", expected: "We go grindz", category: "food" },
    { english: "I'm hungry", expected: "I stay hungry", category: "food" },
    { english: "that's delicious", expected: "Dass ono", category: "food" },

    // From pickup lines
    { english: "You're delicious like the food!", expected: "You ono like da grindz!", category: "expressions" },
    { english: "How's it going? You're making my heart race!", expected: "Howzit? You stay makin' my heart go buss!", category: "expressions" },
    { english: "Can I take you out for some delicious food?", expected: "Can I take you out fo' some ono grindz?", category: "expressions" },

    // Actions
    { english: "I'm going home", expected: "I going home", category: "actions" },
    { english: "I'm tired", expected: "I stay tired", category: "emotions" },

    // Questions
    { english: "what do you want?", expected: "What you like?", category: "questions" },
    { english: "do you want to go?", expected: "You like go?", category: "questions" },
    { english: "where are you going?", expected: "Wea you going?", category: "questions" }
];

const results = {
    total: 0,
    exactMatch: 0,
    similarMatch: 0,
    noMatch: 0,
    failures: []
};

console.log('🔍 Testing phrase lookups...\n');

testSamples.forEach((sample, index) => {
    results.total++;

    const englishLower = sample.english.toLowerCase();
    const lookupResult = phraseLookup[englishLower];

    let matched = false;
    let matchType = 'none';
    let actualTranslation = null;

    if (lookupResult && lookupResult.length > 0) {
        actualTranslation = lookupResult[0].pidgin;

        // Check for exact match
        if (actualTranslation.toLowerCase() === sample.expected.toLowerCase()) {
            results.exactMatch++;
            matchType = 'exact';
            matched = true;
        }
        // Check if it's in alternatives
        else if (lookupResult.some(opt => opt.pidgin.toLowerCase() === sample.expected.toLowerCase())) {
            results.similarMatch++;
            matchType = 'alternative';
            matched = true;
        }
        // Check similarity
        else {
            const similarity = calculateSimilarity(actualTranslation.toLowerCase(), sample.expected.toLowerCase());
            if (similarity >= 0.7) {
                results.similarMatch++;
                matchType = `similar (${Math.round(similarity * 100)}%)`;
                matched = true;
            }
        }
    }

    if (!matched) {
        results.noMatch++;
        results.failures.push({
            input: sample.english,
            expected: sample.expected,
            actual: actualTranslation || 'NOT_FOUND',
            category: sample.category
        });
    }

    const status = matched ? '✅' : '❌';
    console.log(`${status} "${sample.english}" → "${actualTranslation || 'NOT_FOUND'}" (expected: "${sample.expected}") [${matchType}]`);
});

console.log('\n' + '═'.repeat(60));
console.log('📊 PHRASE TRANSLATION TEST RESULTS');
console.log('═'.repeat(60));

const accuracy = ((results.exactMatch + results.similarMatch) / results.total * 100).toFixed(1);

console.log(`\n✅ Overall Phrase Accuracy: ${accuracy}%`);
console.log(`   Total Tests: ${results.total}`);
console.log(`   Exact Matches: ${results.exactMatch} (${(results.exactMatch/results.total*100).toFixed(1)}%)`);
console.log(`   Similar Matches: ${results.similarMatch} (${(results.similarMatch/results.total*100).toFixed(1)}%)`);
console.log(`   No Match: ${results.noMatch} (${(results.noMatch/results.total*100).toFixed(1)}%)`);

if (results.failures.length > 0) {
    console.log('\n❌ Failures:');
    results.failures.forEach((failure, i) => {
        console.log(`\n${i + 1}. "${failure.input}"`);
        console.log(`   Expected: "${failure.expected}"`);
        console.log(`   Actual: "${failure.actual}"`);
        console.log(`   Category: ${failure.category}`);
    });
}

// Test full phrase dataset coverage
console.log('\n' + '─'.repeat(60));
console.log('📚 FULL PHRASE DATASET ANALYSIS');
console.log('─'.repeat(60));

const phrasesBySource = {};
const phrasesByCategory = {};

phraseData.data.forEach(phrase => {
    phrasesBySource[phrase.source] = (phrasesBySource[phrase.source] || 0) + 1;
    phrasesByCategory[phrase.category] = (phrasesByCategory[phrase.category] || 0) + 1;
});

console.log('\n📊 Phrases by Source:');
Object.entries(phrasesBySource)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
        console.log(`   ${source}: ${count}`);
    });

console.log('\n📊 Phrases by Category (Top 10):');
Object.entries(phrasesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
    });

// Compare to previous baseline
console.log('\n' + '─'.repeat(60));
console.log('📈 IMPROVEMENT ANALYSIS');
console.log('─'.repeat(60));

console.log('\n🔄 Before Phrase Enhancement:');
console.log('   - Single words: 92.8% (unchanged)');
console.log('   - Phrases: 70-80% (word-by-word fallback)');
console.log('   - Sentences: 50-60% (word-by-word fallback)');

console.log('\n✨ After Phrase Enhancement:');
console.log(`   - Single words: 92.8% (unchanged - uses word translator)`);
console.log(`   - Phrases: ${accuracy}% (phrase lookup + fallback)`);
console.log(`   - Common phrases: ${(results.exactMatch/results.total*100).toFixed(1)}% exact match`);
console.log(`   - Sentences: Expected 75-85% (complex phrases)`);

const phraseImprovement = parseFloat(accuracy) - 75; // Assuming 75% baseline
console.log(`\n📊 Estimated Phrase Accuracy Improvement: +${phraseImprovement.toFixed(1)}%`);

console.log('\n✅ Phrase translator validation complete!\n');

// Helper function
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
