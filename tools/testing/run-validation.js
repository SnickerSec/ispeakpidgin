#!/usr/bin/env node

/**
 * Automated Translator Validation Runner
 *
 * Runs validation tests by loading the ACTUAL translator class
 * and measuring real-world accuracy against the Supabase dataset.
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
    console.log('🚀 Hawaiian Pidgin Translator Validation\n');
    
    const PidginTranslator = loadTranslatorClass();
    
    console.log('📡 Fetching dictionary data from Supabase...');
    const { data: entries, error } = await supabase
        .from('dictionary_entries')
        .select('*')
        .order('pidgin', { ascending: true });

    if (error) {
        console.error('❌ Failed to fetch dictionary entries:', error.message);
        process.exit(1);
    }

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
                id: entry.id,
                confidence: 1.0
            });
        });
        mockDataLoader.data.translations.pidginToEnglish[entry.pidgin.toLowerCase()] = engArr;
    });

    // Initialize the real translator
    const translator = new PidginTranslator();
    translator.initialized = false;
    translator.tryInitialize();

    console.log(`📊 Loaded ${entries.length} master entries`);
    console.log(`📊 Reconstructed translator view with ${Object.keys(mockDataLoader.data.translations.englishToPidgin).length} English→Pidgin mappings\n`);

    // Test results
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        byCategory: {},
        byType: {},
        failures: []
    };

    // Calculate similarity (Levenshtein)
    function calculateSimilarity(str1, str2) {
        str1 = (str1 || '').toLowerCase().trim();
        str2 = (str2 || '').toLowerCase().trim();
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

    // Test English → Pidgin translation using ACTUAL engine
    async function testEnglishToPidgin(englishWord, expectedPidgin) {
        const translationObj = await translator.translate(englishWord, 'eng-to-pidgin');
        const actual = translationObj.text.toLowerCase();
        
        // Get all valid options for this word from our dataset
        const options = mockDataLoader.data.translations.englishToPidgin[englishWord.toLowerCase().trim()] || [];
        const validPidgins = options.map(o => o.pidgin.toLowerCase());
        if (!validPidgins.includes(expectedPidgin.toLowerCase())) validPidgins.push(expectedPidgin.toLowerCase());

        let bestScore = 0;
        let bestMatch = null;
        
        const hasMatch = validPidgins.some(opt => {
            const score = calculateSimilarity(actual, opt);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = opt;
            }
            return score >= 0.85; // Strict threshold for literal matches
        });

        return {
            passed: hasMatch,
            score: bestScore,
            actual: actual,
            bestValidOption: bestMatch,
            reason: hasMatch ? 'Match' : `Only ${Math.round(bestScore * 100)}% similar to closest valid option`
        };
    }

    // Test Pidgin → English translation using ACTUAL engine
    async function testPidginToEnglish(pidginWord, expectedEnglishArr) {
        const translationObj = await translator.translate(pidginWord, 'pidgin-to-eng');
        const actual = translationObj.text.toLowerCase();
        
        const hasMatch = expectedEnglishArr.some(expected => {
            const score = calculateSimilarity(actual, expected);
            return score >= 0.8;
        });

        return {
            passed: hasMatch,
            score: hasMatch ? 1.0 : 0,
            actual: actual,
            reason: hasMatch ? 'Match' : 'No matching English meaning found'
        };
    }

    // Update stats
    function updateStats(category, type, passed) {
        if (!results.byCategory[category]) results.byCategory[category] = { total: 0, passed: 0, failed: 0 };
        results.byCategory[category].total++;
        if (passed) results.byCategory[category].passed++; else results.byCategory[category].failed++;

        if (!results.byType[type]) results.byType[type] = { total: 0, passed: 0, failed: 0 };
        results.byType[type].total++;
        if (passed) results.byType[type].passed++; else results.byType[type].failed++;
    }

    console.log('🔬 Running validation tests...\n');

    // Run tests for each entry
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const category = entry.category || 'unknown';
        const englishArr = Array.isArray(entry.english) ? entry.english : [entry.english];

        // Test each English word → Pidgin
        for (const englishWord of englishArr) {
            results.total++;
            const result = await testEnglishToPidgin(englishWord, entry.pidgin);

            if (result.passed) {
                results.passed++;
            } else {
                results.failed++;
                results.failures.push({
                    type: 'english-to-pidgin',
                    input: englishWord,
                    expected: entry.pidgin,
                    actual: result.actual,
                    category: category,
                    score: result.score,
                    reason: result.reason
                });
            }
            updateStats(category, 'english-to-pidgin', result.passed);
        }

        // Test Pidgin → English
        results.total++;
        const result = await testPidginToEnglish(entry.pidgin, englishArr);

        if (result.passed) {
            results.passed++;
        } else {
            results.failed++;
            results.failures.push({
                type: 'pidgin-to-english',
                input: entry.pidgin,
                expected: englishArr.join(', '),
                actual: result.actual,
                category: category,
                score: result.score,
                reason: result.reason
            });
        }
        updateStats(category, 'pidgin-to-english', result.passed);

        if ((i + 1) % 100 === 0) {
            process.stdout.write(`  Tested ${i + 1}/${entries.length} entries...\r`);
        }
    }

    console.log(`  Completed all ${entries.length} entries!       \n`);

    // Calculate accuracy
    results.accuracy = ((results.passed / results.total) * 100).toFixed(1);

    // Calculate details
    Object.keys(results.byCategory).forEach(cat => {
        results.byCategory[cat].accuracy = ((results.byCategory[cat].passed / results.byCategory[cat].total) * 100).toFixed(1);
    });
    Object.keys(results.byType).forEach(type => {
        results.byType[type].accuracy = ((results.byType[type].passed / results.byType[type].total) * 100).toFixed(1);
    });

    // Display results
    console.log('═'.repeat(60));
    console.log('📊 VALIDATION RESULTS');
    console.log('═'.repeat(60));
    console.log(`\n✅ Overall Accuracy: ${results.accuracy}%`);
    console.log(`   Total Tests: ${results.total}`);
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}\n`);

    console.log('─'.repeat(60));
    console.log('📈 Accuracy by Test Type:');
    console.log('─'.repeat(60));
    Object.entries(results.byType)
        .sort((a, b) => parseFloat(b[1].accuracy) - parseFloat(a[1].accuracy))
        .forEach(([type, stats]) => {
            const bar = '█'.repeat(Math.round(parseFloat(stats.accuracy) / 5));
            const color = parseFloat(stats.accuracy) >= 80 ? '🟢' : '🔴';
            console.log(`${color} ${type.padEnd(25)} ${stats.accuracy.padStart(5)}%  ${bar}`);
        });

    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const reportPath = path.join(__dirname, `../../docs/validation-report-${timestamp}.json`);
    const report = {
        timestamp: new Date().toISOString(),
        summary: results,
        topFailures: results.failures.slice(0, 20)
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved: ${reportPath}\n`);
}

runValidation().catch(err => {
    console.error('Validation failed:', err);
    process.exit(1);
});
