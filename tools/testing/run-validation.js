#!/usr/bin/env node

/**
 * Automated Translator Validation Runner
 *
 * Runs validation tests by loading the translator data and
 * simulating translations to measure accuracy
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { supabase } = require('../../config/supabase');

async function runValidation() {
    console.log('🚀 Hawaiian Pidgin Translator Validation\n');
    console.log('📡 Fetching dictionary data from Supabase...');

    // Fetch all dictionary entries
    const { data: entries, error } = await supabase
        .from('dictionary_entries')
        .select('*')
        .order('pidgin', { ascending: true });

    if (error) {
        console.error('❌ Failed to fetch dictionary entries:', error.message);
        process.exit(1);
    }

    const masterData = { entries };

    // Reconstruct translator view
    const translatorView = {
        translations: {
            englishToPidgin: {},
            pidginToEnglish: {}
        }
    };

    entries.forEach(entry => {
        // Handle English to Pidgin
        const englishArr = Array.isArray(entry.english) ? entry.english : [entry.english];
        englishArr.forEach(eng => {
            const engLower = eng.toLowerCase();
            if (!translatorView.translations.englishToPidgin[engLower]) {
                translatorView.translations.englishToPidgin[engLower] = [];
            }
            translatorView.translations.englishToPidgin[engLower].push({
                pidgin: entry.pidgin,
                id: entry.id
            });
        });

        // Handle Pidgin to English
        const pidginLower = entry.pidgin.toLowerCase();
        translatorView.translations.pidginToEnglish[pidginLower] = englishArr;
    });

    console.log(`📊 Loaded ${masterData.entries.length} master entries`);
    console.log(`📊 Reconstructed translator view with ${Object.keys(translatorView.translations.englishToPidgin).length} English→Pidgin mappings\n`);

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
        str1 = (str1 || '').toLowerCase();
        str2 = (str2 || '').toLowerCase();

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
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return (maxLen - matrix[len1][len2]) / maxLen;
    }

    // Test English → Pidgin translation
    function testEnglishToPidgin(englishWord, expectedPidgin, category) {
        const key = englishWord.toLowerCase();
        const translations = translatorView.translations.englishToPidgin[key];

        if (!translations || translations.length === 0) {
            return {
                passed: false,
                score: 0,
                actual: null,
                reason: 'No translation found'
            };
        }

        // Check if any of the possible translations for this English word match the expected Pidgin
        // This handles synonyms correctly (e.g., 'friend' -> 'brah' or 'cuz')
        let bestMatch = { score: 0, pidgin: null };
        const hasMatch = translations.some(t => {
            const similarity = calculateSimilarity(t.pidgin, expectedPidgin);
            if (similarity > bestMatch.score) {
                bestMatch = { score: similarity, pidgin: t.pidgin };
            }
            return similarity >= 0.8;
        });

        return {
            passed: hasMatch,
            score: bestMatch.score,
            actual: bestMatch.pidgin,
            reason: hasMatch ? 'Match' : `Only ${Math.round(bestMatch.score * 100)}% similar`
        };
    }

    // Test Pidgin → English translation
    function testPidginToEnglish(pidginWord, expectedEnglish, category) {
        const key = pidginWord.toLowerCase();
        const translations = translatorView.translations.pidginToEnglish[key];

        if (!translations || translations.length === 0) {
            return {
                passed: false,
                score: 0,
                actual: null,
                reason: 'No translation found'
            };
        }

        const actualEnglish = translations;

        // Check if any expected English word matches
        const expectedArray = Array.isArray(expectedEnglish) ? expectedEnglish : [expectedEnglish];
        const hasMatch = expectedArray.some(expected =>
            actualEnglish.some(actual =>
                actual.toLowerCase() === expected.toLowerCase() ||
                actual.toLowerCase().includes(expected.toLowerCase()) ||
                expected.toLowerCase().includes(actual.toLowerCase())
            )
        );

        if (hasMatch) {
            return {
                passed: true,
                score: 1.0,
                actual: actualEnglish.join(', '),
                reason: 'Match found'
            };
        }

        // Calculate best similarity
        let bestScore = 0;
        expectedArray.forEach(expected => {
            actualEnglish.forEach(actual => {
                const sim = calculateSimilarity(actual, expected);
                if (sim > bestScore) bestScore = sim;
            });
        });

        return {
            passed: bestScore >= 0.7,
            score: bestScore,
            actual: actualEnglish.join(', '),
            reason: bestScore >= 0.7 ? 'Partial match' : `Only ${Math.round(bestScore * 100)}% similar`
        };
    }

    // Update stats
    function updateStats(category, type, passed) {
        // By category
        if (!results.byCategory[category]) {
            results.byCategory[category] = { total: 0, passed: 0, failed: 0 };
        }
        results.byCategory[category].total++;
        if (passed) {
            results.byCategory[category].passed++;
        } else {
            results.byCategory[category].failed++;
        }

        // By type
        if (!results.byType[type]) {
            results.byType[type] = { total: 0, passed: 0, failed: 0 };
        }
        results.byType[type].total++;
        if (passed) {
            results.byType[type].passed++;
        } else {
            results.byType[type].failed++;
        }
    }

    console.log('🔬 Running validation tests...\n');

    // Run tests for each entry
    masterData.entries.forEach((entry, index) => {
        const category = entry.category || 'unknown';
        const englishArr = Array.isArray(entry.english) ? entry.english : [entry.english];

        // Test each English word → Pidgin
        englishArr.forEach(englishWord => {
            results.total++;
            const result = testEnglishToPidgin(englishWord, entry.pidgin, category);

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
        });

        // Test Pidgin → English
        results.total++;
        const result = testPidginToEnglish(entry.pidgin, englishArr, category);

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

        // Progress indicator
        if ((index + 1) % 100 === 0) {
            process.stdout.write(`  Tested ${index + 1}/${masterData.entries.length} entries...\r`);
        }
    });

    console.log(`  Completed all ${masterData.entries.length} entries!       \n`);

    // Calculate accuracy
    results.accuracy = ((results.passed / results.total) * 100).toFixed(1);

    // Calculate category accuracies
    Object.keys(results.byCategory).forEach(cat => {
        const stats = results.byCategory[cat];
        stats.accuracy = ((stats.passed / stats.total) * 100).toFixed(1);
    });

    // Calculate type accuracies
    Object.keys(results.byType).forEach(type => {
        const stats = results.byType[type];
        stats.accuracy = ((stats.passed / stats.total) * 100).toFixed(1);
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
            const color = parseFloat(stats.accuracy) >= 80 ? '🟢' : parseFloat(stats.accuracy) >= 60 ? '🟡' : '🔴';
            console.log(`${color} ${type.padEnd(25)} ${stats.accuracy.padStart(5)}%  ${bar}`);
            console.log(`   ${stats.passed}/${stats.total} tests passed\n`);
        });

    console.log('─'.repeat(60));
    console.log('📊 Accuracy by Category:');
    console.log('─'.repeat(60));
    Object.entries(results.byCategory)
        .sort((a, b) => parseFloat(b[1].accuracy) - parseFloat(a[1].accuracy))
        .forEach(([category, stats]) => {
            const bar = '█'.repeat(Math.round(parseFloat(stats.accuracy) / 5));
            const color = parseFloat(stats.accuracy) >= 80 ? '🟢' : parseFloat(stats.accuracy) >= 60 ? '🟡' : '🔴';
            console.log(`${color} ${category.padEnd(25)} ${stats.accuracy.padStart(5)}%  ${bar}`);
            console.log(`   ${stats.passed}/${stats.total} tests passed\n`);
        });

    // Generate improvement suggestions
    console.log('─'.repeat(60));
    console.log('💡 IMPROVEMENT SUGGESTIONS:');
    console.log('─'.repeat(60));

    const suggestions = [];

    // Low accuracy categories
    Object.entries(results.byCategory).forEach(([category, stats]) => {
        if (parseFloat(stats.accuracy) < 70) {
            suggestions.push({
                priority: 'HIGH',
                issue: `Low accuracy in "${category}" category (${stats.accuracy}%)`,
                suggestion: `Add more ${category} translations and alternative forms`,
                impact: `Would improve ${stats.failed} failed translations`
            });
        }
    });

    // Overall accuracy issues
    if (parseFloat(results.accuracy) < 80) {
        suggestions.push({
            priority: 'MEDIUM',
            issue: `Overall accuracy is ${results.accuracy}%`,
            suggestion: 'Review and expand translation mappings in Supabase',
            impact: 'Improves general translation quality'
        });
    }

    // Find missing translations
    const missingTranslations = results.failures.filter(f => f.reason === 'No translation found');
    if (missingTranslations.length > 0) {
        const uniqueMissing = [...new Set(missingTranslations.map(f => f.input))];
        suggestions.push({
            priority: 'HIGH',
            issue: `${uniqueMissing.length} words have no translations`,
            suggestion: `Add missing translations: ${uniqueMissing.slice(0, 5).join(', ')}${uniqueMissing.length > 5 ? '...' : ''}`,
            impact: `Would fix ${missingTranslations.length} test cases`
        });
    }

    // Type-specific suggestions
    Object.entries(results.byType).forEach(([type, stats]) => {
        if (parseFloat(stats.accuracy) < 70) {
            suggestions.push({
                priority: 'MEDIUM',
                issue: `${type} accuracy is ${stats.accuracy}%`,
                suggestion: `Review ${type} translation logic and mappings`,
                impact: `Would improve ${stats.failed} failed tests`
            });
        }
    });

    if (suggestions.length === 0) {
        console.log('🎉 No critical issues found! Translator performing well.\n');
    } else {
        suggestions
            .sort((a, b) => {
                const priority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                return priority[b.priority] - priority[a.priority];
            })
            .forEach((sug, i) => {
                console.log(`\n${i + 1}. [${sug.priority}] ${sug.issue}`);
                console.log(`   💡 ${sug.suggestion}`);
                console.log(`   📈 Impact: ${sug.impact}`);
            });
        console.log();
    }

    // Show top failures
    if (results.failures.length > 0) {
        console.log('─'.repeat(60));
        console.log('❌ TOP 15 FAILURES:');
        console.log('─'.repeat(60));
        results.failures
            .sort((a, b) => a.score - b.score)
            .slice(0, 15)
            .forEach((failure, i) => {
                console.log(`\n${i + 1}. ${failure.type} [${failure.category}]`);
                console.log(`   Input: "${failure.input}"`);
                console.log(`   Expected: "${failure.expected}"`);
                console.log(`   Actual: "${failure.actual || 'N/A'}"`);
                console.log(`   Score: ${Math.round(failure.score * 100)}%`);
                console.log(`   Reason: ${failure.reason}`);
            });
        console.log();
    }

    console.log('═'.repeat(60));
    console.log('✅ Validation Complete!');
    console.log('═'.repeat(60));

    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const reportPath = path.join(__dirname, `../../docs/validation-report-${timestamp}.json`);

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: results.total,
            passed: results.passed,
            failed: results.failed,
            accuracy: results.accuracy
        },
        byCategory: results.byCategory,
        byType: results.byType,
        suggestions: suggestions,
        topFailures: results.failures.slice(0, 20)
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved: ${reportPath}\n`);
}

runValidation().catch(err => {
    console.error('Validation failed:', err);
    process.exit(1);
});

