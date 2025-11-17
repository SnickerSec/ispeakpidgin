#!/usr/bin/env node

/**
 * Add Missing Terms Script
 * Adds new Hawaiian/Pidgin terms to the master dictionary
 */

const fs = require('fs');
const path = require('path');

const MASTER_DATA_PATH = path.join(__dirname, '..', 'data', 'master', 'pidgin-master.json');
const MISSING_TERMS_PATH = '/tmp/missing-terms.json';

console.log('📚 Adding Missing Terms to Dictionary');
console.log('=====================================\n');

// Load the data
console.log('📖 Loading master data...');
const masterData = JSON.parse(fs.readFileSync(MASTER_DATA_PATH, 'utf8'));

console.log('📋 Loading missing terms...');
const missingData = JSON.parse(fs.readFileSync(MISSING_TERMS_PATH, 'utf8'));

console.log(`✅ Loaded ${masterData.entries.length} existing entries`);
console.log(`✅ Found ${missingData.missing.length} terms to add\n`);

// Generate unique IDs for new entries
function generateId(pidgin, index) {
    const cleanPidgin = pidgin
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

    const baseId = 600 + index; // Start from 600 to avoid conflicts
    return `${cleanPidgin}_${baseId}`;
}

// Improve pronunciations to match our standard format
function improvePronunciation(term, pronunciation) {
    // Split into syllables and apply proper stress patterns
    const syllables = term.split(' ');

    if (syllables.length === 1) {
        // Single word - check syllable count
        const word = syllables[0];

        // Common Hawaiian pronunciation patterns
        const patterns = {
            'a hui hou': 'ah-HOO-ee-HOW',
            'hula': 'HOO-lah',
            'halau': 'hah-LAU',
            'hanau': 'hah-NAU',
            'hauna': 'HAU-nah',
            'hele': 'HEH-leh',
            'honi': 'HOH-nee',
            'hu-i': 'HOO-ee',
            'hulihuli': 'HOO-lee-HOO-lee',
            'hupo': 'HOO-poh',
            'kahu': 'KAH-hoo',
            'kala': 'KAH-lah',
            'kepani': 'keh-PAH-nee',
            'kumu': 'KOO-moo',
            'kalua': 'kah-LOO-ah',
            'kane': 'KAH-neh',
            'lepo': 'LEH-poh',
            'lokahi': 'loh-KAH-hee',
            'luna': 'LOO-nah',
            'lua': 'LOO-ah',
            'mahu': 'MAH-hoo',
            'maka piapia': 'MAH-kah pee-ah-PEE-ah',
            'moemoe': 'MOH-eh-MOH-eh',
            'momona': 'moh-MOH-nah',
            'moo': 'MOH-oh',
            'moopuna': 'moh-oh-POO-nah',
            'kulolo': 'koo-LOH-loh',
            'kukui': 'koo-KOO-ee',
            'lehua': 'leh-HOO-ah',
            'maile': 'MY-leh',
            'nene': 'NAY-nay',
            'ti': 'TEE',
            'lanai': 'lah-NYE',
            'pake': 'PAH-keh',
            'piko': 'PEE-koh',
            'pipi': 'PEE-pee',
            'pipi kaula': 'PEE-pee KAU-lah',
            'pohaku': 'poh-HAH-koo',
            'poho': 'POH-hoh',
            'popolo': 'poh-POH-loh',
            'puaa': 'POO-ah-ah',
            'uku pau': 'OO-koo POW',
            'waa': 'WAH-ah',
            'aina': 'EYE-nah',
            'okole': 'oh-KOH-leh',
            'okole hao': 'oh-KOH-leh HAO',
            'opu': 'OH-poo'
        };

        return patterns[term.toLowerCase()] || pronunciation;
    }

    return pronunciation;
}

// Add missing terms
let addedCount = 0;
const newEntries = [];

console.log('🔄 Adding new terms...\n');

missingData.missing.forEach((term, index) => {
    const id = generateId(term.pidgin, index);
    const pronunciation = improvePronunciation(term.pidgin, term.pronunciation);

    const newEntry = {
        id: id,
        pidgin: term.pidgin,
        english: term.english,
        category: term.category,
        pronunciation: pronunciation,
        examples: [`${term.pidgin} stay ${term.english[0]}`],
        usage: term.usage,
        origin: term.origin,
        difficulty: term.difficulty,
        frequency: term.frequency,
        tags: [term.category, term.origin.toLowerCase()]
    };

    newEntries.push(newEntry);
    addedCount++;

    console.log(`${addedCount}. ${term.pidgin}`);
    console.log(`   ID: ${id}`);
    console.log(`   English: ${term.english.join(', ')}`);
    console.log(`   Pronunciation: ${pronunciation}`);
    console.log(`   Category: ${term.category}`);
    console.log('');
});

// Add new entries to master data
masterData.entries = [...masterData.entries, ...newEntries];

// Update metadata
masterData.metadata.totalEntries = masterData.entries.length;
masterData.metadata.lastUpdated = new Date().toISOString().split('T')[0];

// Sort entries alphabetically by pidgin term
masterData.entries.sort((a, b) => a.pidgin.localeCompare(b.pidgin));

// Save the updated data
console.log('\n💾 Saving updated master data...');
fs.writeFileSync(
    MASTER_DATA_PATH,
    JSON.stringify(masterData, null, 2),
    'utf8'
);

// Summary
console.log('\n✨ Addition Summary');
console.log('==================');
console.log(`📝 Previous total: ${masterData.entries.length - addedCount}`);
console.log(`➕ Terms added: ${addedCount}`);
console.log(`📚 New total: ${masterData.entries.length}`);
console.log(`\n📁 Updated file: ${MASTER_DATA_PATH}`);
console.log('\n✅ Missing terms added successfully!');
console.log('\n💡 Next steps:');
console.log('   1. Run: npm run consolidate-data');
console.log('   2. Run: npm run build');
console.log('   3. Test the dictionary page');
