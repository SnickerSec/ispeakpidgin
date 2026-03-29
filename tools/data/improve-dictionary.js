#!/usr/bin/env node

/**
 * Dictionary Improvement Script
 * Applies pronunciation and categorization improvements to the Supabase dictionary
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { supabase } = require('../../config/supabase');

const RECOMMENDATIONS_PATH = '/tmp/enhanced_final_recommendations.json';

async function main() {
    console.log('🔧 Supabase Dictionary Improvement Script');
    console.log('========================================\n');

    if (!fs.existsSync(RECOMMENDATIONS_PATH)) {
        console.error(`❌ Recommendations file not found at: ${RECOMMENDATIONS_PATH}`);
        process.exit(1);
    }

    // Load recommendations
    console.log('📋 Loading recommendations...');
    const recommendations = JSON.parse(fs.readFileSync(RECOMMENDATIONS_PATH, 'utf8'));
    console.log(`✅ Loaded ${recommendations.improvements.length} improvement recommendations\n`);

    // Track changes
    let totalUpdates = 0;
    let failedUpdates = 0;

    console.log('🔄 Applying improvements to Supabase...\n');

    for (const improvement of recommendations.improvements) {
        const updateData = {};
        const changes = [];

        if (improvement.newPronunciation) {
            updateData.pronunciation = improvement.newPronunciation;
            changes.push(`pronunciation → "${improvement.newPronunciation}"`);
        }

        if (improvement.newCategory) {
            updateData.category = improvement.newCategory;
            changes.push(`category → "${improvement.newCategory}"`);
        }

        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
                .from('dictionary_entries')
                .update(updateData)
                .eq('id', improvement.id);

            if (updateError) {
                console.error(`❌ Error updating entry ${improvement.id}:`, updateError.message);
                failedUpdates++;
            } else {
                totalUpdates++;
                console.log(`${totalUpdates}. Updated: ${improvement.id}`);
                changes.forEach(change => console.log(`   ✓ ${change}`));
                if (improvement.reason) {
                    console.log(`   💡 ${improvement.reason}`);
                }
                console.log('');
            }
        }
    }

    // Summary
    console.log('\n✨ Update Summary');
    console.log('================');
    console.log(`✅ Entries updated: ${totalUpdates}`);
    console.log(`❌ Failed updates: ${failedUpdates}`);
    console.log(`\n✅ Dictionary improvements processed successfully!`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});

