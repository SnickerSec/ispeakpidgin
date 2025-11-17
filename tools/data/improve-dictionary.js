#!/usr/bin/env node

/**
 * Dictionary Improvement Script
 * Applies pronunciation and categorization improvements to the master data
 */

const fs = require('fs');
const path = require('path');

const MASTER_DATA_PATH = path.join(__dirname, '..', 'data', 'master', 'pidgin-master.json');
const RECOMMENDATIONS_PATH = '/tmp/enhanced_final_recommendations.json';

console.log('🔧 Dictionary Improvement Script');
console.log('================================\n');

// Load the data
console.log('📖 Loading master data...');
const masterData = JSON.parse(fs.readFileSync(MASTER_DATA_PATH, 'utf8'));

console.log('📋 Loading recommendations...');
const recommendations = JSON.parse(fs.readFileSync(RECOMMENDATIONS_PATH, 'utf8'));

console.log(`✅ Loaded ${masterData.entries.length} entries`);
console.log(`✅ Loaded ${recommendations.improvements.length} improvement recommendations\n`);

// Create a map for quick lookup
const improvementsMap = new Map();
recommendations.improvements.forEach(improvement => {
    improvementsMap.set(improvement.id, improvement);
});

// Track changes
let pronunciationUpdates = 0;
let categoryUpdates = 0;
let totalUpdates = 0;

// Apply improvements
console.log('🔄 Applying improvements...\n');

masterData.entries.forEach((entry, index) => {
    const improvement = improvementsMap.get(entry.id);

    if (improvement) {
        let updated = false;
        const changes = [];

        // Update pronunciation if different
        if (improvement.newPronunciation && entry.pronunciation !== improvement.newPronunciation) {
            const oldPronunciation = entry.pronunciation;
            entry.pronunciation = improvement.newPronunciation;
            changes.push(`pronunciation: "${oldPronunciation}" → "${improvement.newPronunciation}"`);
            pronunciationUpdates++;
            updated = true;
        }

        // Update category if different
        if (improvement.newCategory && entry.category !== improvement.newCategory) {
            const oldCategory = entry.category;
            entry.category = improvement.newCategory;
            changes.push(`category: "${oldCategory}" → "${improvement.newCategory}"`);
            categoryUpdates++;
            updated = true;
        }

        if (updated) {
            totalUpdates++;
            console.log(`${totalUpdates}. ${entry.pidgin} (${entry.id})`);
            changes.forEach(change => console.log(`   ✓ ${change}`));
            if (improvement.reason) {
                console.log(`   💡 ${improvement.reason}`);
            }
            console.log('');
        }
    }
});

// Update metadata
masterData.metadata.lastUpdated = new Date().toISOString().split('T')[0];

// Save the updated data
console.log('\n💾 Saving updated master data...');
fs.writeFileSync(
    MASTER_DATA_PATH,
    JSON.stringify(masterData, null, 2),
    'utf8'
);

// Summary
console.log('\n✨ Update Summary');
console.log('================');
console.log(`📝 Total entries: ${masterData.entries.length}`);
console.log(`✅ Entries updated: ${totalUpdates}`);
console.log(`🗣️ Pronunciation updates: ${pronunciationUpdates}`);
console.log(`📂 Category updates: ${categoryUpdates}`);
console.log(`\n📁 Updated file: ${MASTER_DATA_PATH}`);
console.log('\n✅ Dictionary improvements applied successfully!');
console.log('\n💡 Next steps:');
console.log('   1. Run: npm run consolidate-data');
console.log('   2. Run: npm run build');
console.log('   3. Test the dictionary page');
