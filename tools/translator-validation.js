#!/usr/bin/env node

/**
 * Translator Validation & Improvement Tool
 *
 * Uses pidgin-master.json data to:
 * 1. Test translator accuracy
 * 2. Identify translation gaps
 * 3. Suggest improvements
 * 4. Generate accuracy reports
 */

const fs = require('fs');
const path = require('path');

class TranslatorValidator {
    constructor() {
        this.masterData = null;
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            accuracy: 0,
            detailedResults: []
        };
        this.improvements = [];
    }

    // Load master data
    loadMasterData() {
        const masterPath = path.join(__dirname, '../data/master/pidgin-master.json');
        const data = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
        this.masterData = data;
        console.log(`✅ Loaded ${data.entries.length} entries from master data`);
        return data;
    }

    // Generate test cases from master data
    generateTestCases() {
        const testCases = [];

        for (const entry of this.masterData.entries) {
            // Test 1: English → Pidgin
            for (const englishWord of entry.english) {
                testCases.push({
                    type: 'english-to-pidgin',
                    input: englishWord,
                    expectedOutput: entry.pidgin,
                    alternatives: entry.english.filter(e => e !== englishWord),
                    category: entry.category,
                    difficulty: entry.difficulty,
                    entryId: entry.id
                });
            }

            // Test 2: Pidgin → English
            testCases.push({
                type: 'pidgin-to-english',
                input: entry.pidgin,
                expectedOutput: entry.english,
                category: entry.category,
                difficulty: entry.difficulty,
                entryId: entry.id
            });

            // Test 3: Example sentences
            if (entry.examples && entry.examples.length > 0) {
                entry.examples.forEach(example => {
                    testCases.push({
                        type: 'example-sentence',
                        input: example,
                        expectedWords: [entry.pidgin],
                        category: entry.category,
                        entryId: entry.id
                    });
                });
            }

            // Test 4: Common typos
            if (entry.pidgin.length > 3) {
                const typos = this.generateTypos(entry.pidgin);
                typos.forEach(typo => {
                    testCases.push({
                        type: 'fuzzy-match',
                        input: typo,
                        expectedOutput: entry.pidgin,
                        category: entry.category,
                        entryId: entry.id
                    });
                });
            }
        }

        console.log(`📊 Generated ${testCases.length} test cases`);
        return testCases;
    }

    // Generate common typos for testing fuzzy matching
    generateTypos(word) {
        const typos = [];

        // Missing last letter
        if (word.length > 3) {
            typos.push(word.slice(0, -1));
        }

        // Transposed letters
        if (word.length > 2) {
            const mid = Math.floor(word.length / 2);
            const chars = word.split('');
            [chars[mid], chars[mid + 1]] = [chars[mid + 1], chars[mid]];
            typos.push(chars.join(''));
        }

        // Common substitutions
        const substitutions = {
            'a': 'e', 'e': 'a', 'i': 'e', 'o': 'a',
            'z': 's', 's': 'z', 'k': 'c', 'c': 'k'
        };

        for (let i = 0; i < word.length; i++) {
            if (substitutions[word[i]]) {
                const typo = word.substring(0, i) + substitutions[word[i]] + word.substring(i + 1);
                typos.push(typo);
            }
        }

        return typos.slice(0, 2); // Limit to 2 typos per word
    }

    // Calculate similarity between two strings
    calculateSimilarity(str1, str2) {
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();

        if (str1 === str2) return 1.0;

        const len1 = str1.length;
        const len2 = str2.length;
        const maxLen = Math.max(len1, len2);

        if (maxLen === 0) return 1.0;

        // Levenshtein distance
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

    // Validate a single translation
    validateTranslation(testCase, actualOutput) {
        const result = {
            testCase: testCase,
            actualOutput: actualOutput,
            passed: false,
            score: 0,
            reason: ''
        };

        if (!actualOutput || actualOutput.trim() === '') {
            result.reason = 'No translation returned';
            return result;
        }

        switch (testCase.type) {
            case 'english-to-pidgin':
                // Check exact match
                if (actualOutput.toLowerCase() === testCase.expectedOutput.toLowerCase()) {
                    result.passed = true;
                    result.score = 1.0;
                    result.reason = 'Exact match';
                } else {
                    // Check similarity
                    const similarity = this.calculateSimilarity(actualOutput, testCase.expectedOutput);
                    result.score = similarity;
                    if (similarity >= 0.8) {
                        result.passed = true;
                        result.reason = `Close match (${Math.round(similarity * 100)}% similar)`;
                    } else {
                        result.reason = `Incorrect translation (${Math.round(similarity * 100)}% similar)`;
                    }
                }
                break;

            case 'pidgin-to-english':
                // Check if any expected English translation matches
                const expectedEnglish = Array.isArray(testCase.expectedOutput)
                    ? testCase.expectedOutput
                    : [testCase.expectedOutput];

                const matches = expectedEnglish.some(expected =>
                    actualOutput.toLowerCase().includes(expected.toLowerCase()) ||
                    expected.toLowerCase().includes(actualOutput.toLowerCase())
                );

                if (matches) {
                    result.passed = true;
                    result.score = 1.0;
                    result.reason = 'Contains expected translation';
                } else {
                    // Check similarity with each option
                    const bestSimilarity = Math.max(...expectedEnglish.map(exp =>
                        this.calculateSimilarity(actualOutput, exp)
                    ));
                    result.score = bestSimilarity;
                    if (bestSimilarity >= 0.7) {
                        result.passed = true;
                        result.reason = `Partial match (${Math.round(bestSimilarity * 100)}% similar)`;
                    } else {
                        result.reason = `Incorrect translation (${Math.round(bestSimilarity * 100)}% similar)`;
                    }
                }
                break;

            case 'fuzzy-match':
                const fuzzyMatch = actualOutput.toLowerCase() === testCase.expectedOutput.toLowerCase();
                const fuzzySimilarity = this.calculateSimilarity(actualOutput, testCase.expectedOutput);

                result.score = fuzzySimilarity;
                if (fuzzyMatch || fuzzySimilarity >= 0.85) {
                    result.passed = true;
                    result.reason = 'Fuzzy match successful';
                } else {
                    result.reason = `Fuzzy match failed (${Math.round(fuzzySimilarity * 100)}% similar)`;
                }
                break;

            case 'example-sentence':
                const containsExpected = testCase.expectedWords.some(word =>
                    actualOutput.toLowerCase().includes(word.toLowerCase())
                );

                if (containsExpected) {
                    result.passed = true;
                    result.score = 1.0;
                    result.reason = 'Contains expected pidgin word';
                } else {
                    result.reason = 'Missing expected pidgin word';
                    result.score = 0.0;
                }
                break;
        }

        return result;
    }

    // Analyze test results and suggest improvements
    analyzeResults() {
        const analysis = {
            byCategory: {},
            byDifficulty: {},
            byType: {},
            commonFailures: [],
            suggestions: []
        };

        // Group by category, difficulty, type
        this.testResults.detailedResults.forEach(result => {
            const category = result.testCase.category || 'unknown';
            const difficulty = result.testCase.difficulty || 'unknown';
            const type = result.testCase.type;

            // By category
            if (!analysis.byCategory[category]) {
                analysis.byCategory[category] = { total: 0, passed: 0, failed: 0, accuracy: 0 };
            }
            analysis.byCategory[category].total++;
            if (result.passed) {
                analysis.byCategory[category].passed++;
            } else {
                analysis.byCategory[category].failed++;
            }

            // By difficulty
            if (!analysis.byDifficulty[difficulty]) {
                analysis.byDifficulty[difficulty] = { total: 0, passed: 0, failed: 0, accuracy: 0 };
            }
            analysis.byDifficulty[difficulty].total++;
            if (result.passed) {
                analysis.byDifficulty[difficulty].passed++;
            } else {
                analysis.byDifficulty[difficulty].failed++;
            }

            // By type
            if (!analysis.byType[type]) {
                analysis.byType[type] = { total: 0, passed: 0, failed: 0, accuracy: 0 };
            }
            analysis.byType[type].total++;
            if (result.passed) {
                analysis.byType[type].passed++;
            } else {
                analysis.byType[type].failed++;
            }

            // Track failures
            if (!result.passed) {
                analysis.commonFailures.push({
                    input: result.testCase.input,
                    expected: result.testCase.expectedOutput,
                    actual: result.actualOutput,
                    category: category,
                    difficulty: difficulty,
                    score: result.score,
                    reason: result.reason
                });
            }
        });

        // Calculate accuracies
        Object.keys(analysis.byCategory).forEach(key => {
            const cat = analysis.byCategory[key];
            cat.accuracy = (cat.passed / cat.total * 100).toFixed(2);
        });

        Object.keys(analysis.byDifficulty).forEach(key => {
            const diff = analysis.byDifficulty[key];
            diff.accuracy = (diff.passed / diff.total * 100).toFixed(2);
        });

        Object.keys(analysis.byType).forEach(key => {
            const type = analysis.byType[key];
            type.accuracy = (type.passed / type.total * 100).toFixed(2);
        });

        // Generate suggestions
        analysis.suggestions = this.generateSuggestions(analysis);

        return analysis;
    }

    // Generate improvement suggestions
    generateSuggestions(analysis) {
        const suggestions = [];

        // Check for low accuracy categories
        Object.entries(analysis.byCategory).forEach(([category, stats]) => {
            if (parseFloat(stats.accuracy) < 70) {
                suggestions.push({
                    priority: 'high',
                    category: 'Category Coverage',
                    issue: `Low accuracy in "${category}" category (${stats.accuracy}%)`,
                    suggestion: `Add more ${category} translations to the dictionary`,
                    impact: `Would improve ${stats.failed} failed translations`
                });
            }
        });

        // Check for fuzzy matching performance
        const fuzzyStats = analysis.byType['fuzzy-match'];
        if (fuzzyStats && parseFloat(fuzzyStats.accuracy) < 80) {
            suggestions.push({
                priority: 'medium',
                category: 'Fuzzy Matching',
                issue: `Fuzzy matching accuracy is ${fuzzyStats.accuracy}%`,
                suggestion: 'Lower fuzzy match threshold from 0.85 to 0.80',
                impact: `Could improve ${fuzzyStats.failed} typo corrections`
            });
        }

        // Check for difficult words
        const advancedStats = analysis.byDifficulty['advanced'];
        if (advancedStats && parseFloat(advancedStats.accuracy) < 60) {
            suggestions.push({
                priority: 'low',
                category: 'Advanced Words',
                issue: `Advanced words have ${advancedStats.accuracy}% accuracy`,
                suggestion: 'Add more advanced word examples and usage context',
                impact: 'Improves learning experience for advanced users'
            });
        }

        // Find most common failure patterns
        const failurePatterns = this.findFailurePatterns(analysis.commonFailures);
        failurePatterns.forEach(pattern => {
            suggestions.push({
                priority: pattern.count > 10 ? 'high' : 'medium',
                category: 'Missing Translations',
                issue: `${pattern.count} failures for words like "${pattern.example}"`,
                suggestion: `Add missing translations: ${pattern.words.join(', ')}`,
                impact: `Would fix ${pattern.count} test cases`
            });
        });

        return suggestions.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            return priority[b.priority] - priority[a.priority];
        });
    }

    // Find patterns in failures
    findFailurePatterns(failures) {
        const patterns = {};

        failures.forEach(failure => {
            const key = failure.category + '_' + failure.difficulty;
            if (!patterns[key]) {
                patterns[key] = {
                    category: failure.category,
                    difficulty: failure.difficulty,
                    words: [],
                    count: 0,
                    example: failure.input
                };
            }
            patterns[key].words.push(failure.input);
            patterns[key].count++;
        });

        return Object.values(patterns)
            .filter(p => p.count >= 3)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    // Generate HTML report
    generateHTMLReport(analysis) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translator Validation Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 p-8">
    <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold text-gray-900 mb-8">🔍 Translator Validation Report</h1>

        <!-- Overall Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="text-3xl font-bold text-blue-600">${this.testResults.total}</div>
                <div class="text-gray-600">Total Tests</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="text-3xl font-bold text-green-600">${this.testResults.passed}</div>
                <div class="text-gray-600">Passed</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="text-3xl font-bold text-red-600">${this.testResults.failed}</div>
                <div class="text-gray-600">Failed</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="text-3xl font-bold text-purple-600">${this.testResults.accuracy}%</div>
                <div class="text-gray-600">Accuracy</div>
            </div>
        </div>

        <!-- By Category -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
            <h2 class="text-2xl font-bold mb-4">📊 Accuracy by Category</h2>
            <div class="space-y-3">
                ${Object.entries(analysis.byCategory).map(([cat, stats]) => `
                    <div class="flex items-center justify-between">
                        <span class="text-gray-700">${cat}</span>
                        <div class="flex items-center gap-4">
                            <span class="text-sm text-gray-500">${stats.passed}/${stats.total}</span>
                            <div class="w-32 bg-gray-200 rounded-full h-2">
                                <div class="bg-${parseFloat(stats.accuracy) >= 80 ? 'green' : parseFloat(stats.accuracy) >= 60 ? 'yellow' : 'red'}-500 h-2 rounded-full"
                                     style="width: ${stats.accuracy}%"></div>
                            </div>
                            <span class="text-sm font-medium w-16">${stats.accuracy}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Improvement Suggestions -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
            <h2 class="text-2xl font-bold mb-4">💡 Improvement Suggestions</h2>
            <div class="space-y-4">
                ${analysis.suggestions.map((sug, i) => `
                    <div class="border-l-4 border-${sug.priority === 'high' ? 'red' : sug.priority === 'medium' ? 'yellow' : 'blue'}-500 pl-4 py-2">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-2 py-1 text-xs rounded bg-${sug.priority === 'high' ? 'red' : sug.priority === 'medium' ? 'yellow' : 'blue'}-100 text-${sug.priority === 'high' ? 'red' : sug.priority === 'medium' ? 'yellow' : 'blue'}-700">
                                ${sug.priority.toUpperCase()}
                            </span>
                            <span class="font-semibold text-gray-900">${sug.category}</span>
                        </div>
                        <div class="text-gray-700 mb-1"><strong>Issue:</strong> ${sug.issue}</div>
                        <div class="text-gray-700 mb-1"><strong>Suggestion:</strong> ${sug.suggestion}</div>
                        <div class="text-sm text-gray-600"><strong>Impact:</strong> ${sug.impact}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Sample Failures -->
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-2xl font-bold mb-4">❌ Sample Failures (Top 20)</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr class="border-b">
                            <th class="text-left p-2">Input</th>
                            <th class="text-left p-2">Expected</th>
                            <th class="text-left p-2">Actual</th>
                            <th class="text-left p-2">Score</th>
                            <th class="text-left p-2">Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${analysis.commonFailures.slice(0, 20).map(failure => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="p-2">${failure.input}</td>
                                <td class="p-2">${Array.isArray(failure.expected) ? failure.expected.join(', ') : failure.expected}</td>
                                <td class="p-2 text-red-600">${failure.actual}</td>
                                <td class="p-2">${Math.round(failure.score * 100)}%</td>
                                <td class="p-2"><span class="px-2 py-1 text-xs bg-gray-100 rounded">${failure.category}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`;

        return html;
    }

    // Save report to file
    saveReport(analysis) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const htmlPath = path.join(__dirname, `../docs/translator-validation-${timestamp}.html`);
        const jsonPath = path.join(__dirname, `../docs/translator-validation-${timestamp}.json`);

        // Save HTML report
        const html = this.generateHTMLReport(analysis);
        fs.writeFileSync(htmlPath, html);
        console.log(`\n📄 HTML Report saved: ${htmlPath}`);

        // Save JSON data
        fs.writeFileSync(jsonPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            testResults: this.testResults,
            analysis: analysis
        }, null, 2));
        console.log(`📄 JSON Report saved: ${jsonPath}`);

        return { htmlPath, jsonPath };
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslatorValidator;
}

// CLI execution
if (require.main === module) {
    console.log('🚀 Starting Translator Validation...\n');

    const validator = new TranslatorValidator();
    validator.loadMasterData();

    const testCases = validator.generateTestCases();
    console.log(`\n⚠️  Note: This is a framework for validation.`);
    console.log(`   To run actual tests, integrate with translator.js in browser context.`);
    console.log(`   Use tools/test-translator.html for browser-based testing.\n`);

    console.log(`📊 Test Framework Ready:`);
    console.log(`   - ${testCases.filter(t => t.type === 'english-to-pidgin').length} English→Pidgin tests`);
    console.log(`   - ${testCases.filter(t => t.type === 'pidgin-to-english').length} Pidgin→English tests`);
    console.log(`   - ${testCases.filter(t => t.type === 'fuzzy-match').length} Fuzzy matching tests`);
    console.log(`   - ${testCases.filter(t => t.type === 'example-sentence').length} Example sentence tests`);
}
