#!/usr/bin/env node

// Generate crossword data from master dictionary
const fs = require('fs');
const path = require('path');

console.log('🎯 Generating crossword data from master dictionary...\n');

// Load master dictionary
const masterPath = path.join(__dirname, '../data/master/pidgin-master.json');
const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

// Filter and transform words for crossword use
const crosswordWords = [];

masterData.entries.forEach(entry => {
    // Clean the word - remove apostrophes, spaces, hyphens for grid placement
    const cleanWord = entry.pidgin.toUpperCase().replace(/[^A-Z]/g, '');

    // Only include words 3-15 letters
    if (cleanWord.length < 3 || cleanWord.length > 15) return;

    // Skip if no clean letters
    if (cleanWord.length === 0) return;

    // Create crossword entry
    const crosswordEntry = {
        word: cleanWord,
        displayWord: entry.pidgin, // Original with punctuation
        clue: entry.english[0] || entry.usage || 'Hawaiian Pidgin word',
        cluePidgin: entry.usage || entry.examples[0] || null,
        category: entry.category || 'expressions',
        difficulty: entry.difficulty || 'beginner',
        length: cleanWord.length,
        pronunciation: entry.pronunciation || null,
        example: entry.examples[0] || null
    };

    crosswordWords.push(crosswordEntry);
});

// Sort by word for consistency
crosswordWords.sort((a, b) => a.word.localeCompare(b.word));

// Generate statistics
const stats = {
    total: crosswordWords.length,
    byLength: {},
    byCategory: {},
    byDifficulty: {}
};

crosswordWords.forEach(word => {
    stats.byLength[word.length] = (stats.byLength[word.length] || 0) + 1;
    stats.byCategory[word.category] = (stats.byCategory[word.category] || 0) + 1;
    stats.byDifficulty[word.difficulty] = (stats.byDifficulty[word.difficulty] || 0) + 1;
});

console.log(`✅ Processed ${crosswordWords.length} words`);
console.log('\n📊 Statistics:');
console.log(`By length: 3-letter: ${stats.byLength[3] || 0}, 4-letter: ${stats.byLength[4] || 0}, 5-letter: ${stats.byLength[5] || 0}`);
console.log(`By difficulty: Beginner: ${stats.byDifficulty.beginner || 0}, Intermediate: ${stats.byDifficulty.intermediate || 0}, Advanced: ${stats.byDifficulty.advanced || 0}`);
console.log(`Top categories: ${Object.entries(stats.byCategory).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k,v]) => `${k}(${v})`).join(', ')}`);

// Create output data structure
const outputData = {
    metadata: {
        version: '1.0',
        totalWords: crosswordWords.length,
        lastUpdated: new Date().toISOString().split('T')[0],
        themes: Object.keys(stats.byCategory).sort(),
        generated: 'Auto-generated from pidgin-master.json'
    },
    words: crosswordWords,
    stats: stats
};

// Write to file
const outputPath = path.join(__dirname, '../src/data/crossword-words.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

console.log(`\n💾 Saved to: ${outputPath}`);
console.log('\n🎯 Crossword data generation complete!');
