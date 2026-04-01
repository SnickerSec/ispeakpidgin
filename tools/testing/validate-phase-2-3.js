#!/usr/bin/env node

/**
 * Validate Phase 2 & 3 Improvements
 *
 * Tests all improvements made in Phase 2 (Grammar Patterns) and Phase 3 (Story Examples + Context Tracking)
 * using the ACTUAL PidginTranslator engine.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { supabase } = require('../../config/supabase');
const vm = require('vm');

// Mock browser globals for the translator class
global.window = {
    addEventListener: () => {},
    dispatchEvent: () => {}
};
global.performance = { now: () => Date.now() };
global.navigator = { userAgent: 'node' };

// Mock dependencies
global.contextTracker = { isParagraph: () => false };
global.sentenceChunker = { loaded: false };
global.phraseTranslator = { loaded: false };
global.settingsManager = { get: () => 'false' }; // Disable AI for deterministic validation

// Mock data loader
const mockDataLoader = {
    loaded: true,
    data: { translations: { englishToPidgin: {}, pidginToEnglish: {} } },
    entries: [],
    getTranslations: function() { return this.data.translations; },
    getAllEntries: function() { return this.entries; }
};
global.pidginDataLoader = mockDataLoader;

/**
 * Loads the actual PidginTranslator class from source
 */
function loadTranslatorClass() {
    const translatorPath = path.join(__dirname, '../../src/components/translator/translator.js');
    const code = fs.readFileSync(translatorPath, 'utf8');
    
    // Extract only the class definition
    const lines = code.split('\n');
    let classEndLine = lines.findIndex(line => line.includes('const translator = new PidginTranslator()'));
    if (classEndLine === -1) classEndLine = lines.length;
    
    let classCode = lines.slice(0, classEndLine).join('\n');
    classCode += '\nthis.PidginTranslator = PidginTranslator;';
    
    const script = new vm.Script(classCode);
    const context = { ...global };
    script.runInNewContext(context);
    return context.PidginTranslator;
}

async function runValidation() {
    console.log('🧪 Validating Phase 2 & 3 Improvements (REAL ENGINE)\n');
    
    const PidginTranslator = loadTranslatorClass();
    
    console.log('📡 Fetching data from Supabase...');
    const [entriesRes, phrasesRes, storiesRes] = await Promise.all([
        supabase.from('dictionary_entries').select('*'),
        supabase.from('phrases').select('*'),
        supabase.from('stories').select('*')
    ]);

    if (entriesRes.error || phrasesRes.error || storiesRes.error) {
        console.error('❌ Failed to fetch data from Supabase');
        process.exit(1);
    }

    const entries = entriesRes.data;
    const phrases = phrasesRes.data;
    const stories = storiesRes.data;

    // Populate mock data loader
    mockDataLoader.entries = entries;
    entries.forEach(entry => {
        const engArr = Array.isArray(entry.english) ? entry.english : [entry.english];
        engArr.forEach(eng => {
            const engLower = eng.toLowerCase().trim();
            if (!mockDataLoader.data.translations.englishToPidgin[engLower]) {
                mockDataLoader.data.translations.englishToPidgin[engLower] = [];
            }
            mockDataLoader.data.translations.englishToPidgin[engLower].push({
                pidgin: entry.pidgin,
                id: entry.id
            });
        });
        mockDataLoader.data.translations.pidginToEnglish[entry.pidgin.toLowerCase()] = engArr;
    });

    // Initialize the real translator
    const translator = new PidginTranslator();
    translator.initialized = false;
    translator.tryInitialize();

    console.log('\n📊 Dataset Loaded:');
    console.log(`   Dictionary entries: ${entries.length}`);
    console.log(`   Phrases: ${phrases.length}`);
    console.log(`   Stories: ${stories.length}\n`);

    // ============================================================================
    // PHASE 2: GRAMMAR PATTERN TESTS
    // ============================================================================
    console.log('='.repeat(70));
    console.log('📝 PHASE 2: GRAMMAR PATTERN TESTS');
    console.log('='.repeat(70));

    const grammarTests = {
        'Present Tense': [
            { input: "I'm hungry", expected: "i stay hungry" },
            { input: "You're tired", expected: "you stay tired" },
            { input: "He's working", expected: "he stay working" },
            { input: "They're surfing", expected: "dey stay surfing" }
        ],
        'Future Tense': [
            { input: "I will go", expected: "i going go" },
            { input: "I'll be there", expected: "i going be there" },
            { input: "We will eat", expected: "we going kau kau" }
        ],
        'Past Tense': [
            { input: "I was tired", expected: "i was tired" },
            { input: "You were late", expected: "you was late" },
            { input: "They were surfing", expected: "dey was surfing" }
        ],
        'Past Perfect': [
            { input: "I went to the beach", expected: "i wen go beach" },
            { input: "He went home", expected: "he wen go home" }
        ],
        'Negations': [
            { input: "I don't know", expected: "i no know" },
            { input: "I didn't go", expected: "i neva go" },
            { input: "I can't help", expected: "i no can help" }
        ],
        'Questions (Do/Does/Did)': [
            { input: "Do you want food?", expected: "you like grinds" },
            { input: "Did you go?", expected: "you wen go?" }
        ],
        'Questions (Are/Is/Was)': [
            { input: "Are you ready?", expected: "you stay ready?" },
            { input: "Is he coming?", expected: "he stay coming?" }
        ],
        'Modal Verbs': [
            { input: "I want to eat", expected: "i like kau kau" },
            { input: "I must go", expected: "i gotta go" }
        ]
    };

    let grammarPassed = 0;
    let grammarTotal = 0;

    for (const [category, tests] of Object.entries(grammarTests)) {
        console.log(`\n📌 ${category}:`);
        for (const test of tests) {
            grammarTotal++;
            const result = await translator.translate(test.input, 'eng-to-pidgin');
            const actual = result.text.toLowerCase();
            const expected = test.expected.toLowerCase();
            
            const similarity = calculateSimilarity(actual, expected);
            const passed = similarity >= 0.85;

            if (passed) {
                grammarPassed++;
                console.log(`   ✅ "${test.input}" → "${actual}"`);
            } else {
                console.log(`   ❌ "${test.input}" → "${actual}"`);
                console.log(`      Expected pattern: "${test.expected}"`);
            }
        }
    }

    console.log(`\n📊 Grammar Pattern Accuracy: ${((grammarPassed / grammarTotal) * 100).toFixed(1)}%`);
    console.log(`   Passed: ${grammarPassed}/${grammarTotal}`);

    // ============================================================================
    // PHASE 3: STORY TRANSLATION TESTS
    // ============================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📚 PHASE 3: STORY TRANSLATION TESTS');
    console.log('='.repeat(70));

    const storyResults = {
        total: 0,
        goodMatch: 0,
        partial: 0,
        failed: 0
    };

    // Split stories into sentences and test
    for (let i = 0; i < Math.min(5, stories.length); i++) {
        const story = stories[i];
        console.log(`\n${i + 1}. ${story.title} (${story.category || 'culture'})`);
        
        const englishText = story.english_translation || story.englishTranslation || '';
        const pidginText = story.pidgin_text || story.pidginText || '';
        
        const englishSentences = englishText.split(/(?<=[.!?])\s+/).filter(s => s.length > 5);
        const pidginSentences = pidginText.split(/(?<=[.!?])\s+/).filter(s => s.length > 5);
        
        for (let j = 0; j < Math.min(englishSentences.length, pidginSentences.length); j++) {
            storyResults.total++;
            const english = englishSentences[j];
            const expected = pidginSentences[j];
            
            const result = await translator.translate(english, 'eng-to-pidgin');
            const actual = result.text.toLowerCase();
            
            const similarity = calculateSimilarity(actual, expected.toLowerCase());

            if (similarity >= 0.8) {
                storyResults.goodMatch++;
                console.log(`   ✅ Sentence ${j + 1}: Good match (${Math.round(similarity * 100)}%)`);
            } else if (similarity >= 0.6) {
                storyResults.partial++;
                console.log(`   ⚠️  Sentence ${j + 1}: Partial match (${Math.round(similarity * 100)}%)`);
            } else {
                storyResults.failed++;
                console.log(`   ❌ Sentence ${j + 1}: Poor match (${Math.round(similarity * 100)}%)`);
                console.log(`      Actual: "${actual}"`);
                console.log(`      Expected: "${expected.toLowerCase()}"`);
            }
        }
    }

    const storyAccuracy = ((storyResults.goodMatch / storyResults.total) * 100).toFixed(1);
    const storyUseful = (((storyResults.goodMatch + storyResults.partial) / storyResults.total) * 100).toFixed(1);

    console.log(`\n📊 Story Translation Results:`);
    console.log(`   Total sentences tested: ${storyResults.total}`);
    console.log(`   Good matches (80%+): ${storyResults.goodMatch}`);
    console.log(`   Partial matches (60-79%): ${storyResults.partial}`);
    console.log(`   Failed (<60%): ${storyResults.failed}`);
    console.log(`\n   Story Accuracy: ${storyAccuracy}%`);
    console.log(`   Useful Results: ${storyUseful}%\n`);
}

function calculateSimilarity(str1, str2) {
    str1 = str1.toLowerCase().trim();
    str2 = str2.toLowerCase().trim();
    if (str1 === str2) return 1.0;
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    if (maxLen === 0) return 1.0;
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    return (maxLen - matrix[len1][len2]) / maxLen;
}

runValidation().catch(err => {
    console.error('Validation failed:', err);
    process.exit(1);
});
