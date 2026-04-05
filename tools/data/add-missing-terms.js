#!/usr/bin/env node

/**
 * Add Missing Terms Script
 * Adds new Hawaiian/Pidgin terms to the Supabase dictionary
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();
const { supabase } = require('../../config/supabase');

const DEFAULT_MISSING_TERMS_PATH = '/tmp/missing-terms.json';
const MISSING_TERMS_PATH = process.argv[2] || DEFAULT_MISSING_TERMS_PATH;

async function main() {
    console.log('📚 Adding Missing Terms to Supabase Dictionary');
    console.log('============================================\n');

    if (!fs.existsSync(MISSING_TERMS_PATH)) {
        console.error(`❌ Missing terms file not found at: ${MISSING_TERMS_PATH}`);
        console.log('Please create this file with format: { "missing": [ { "pidgin": "...", "english": ["..."], ... } ] }');
        process.exit(1);
    }

    // Load the data
    console.log('📋 Loading missing terms...');
    const missingData = JSON.parse(fs.readFileSync(MISSING_TERMS_PATH, 'utf8'));
    console.log(`✅ Found ${missingData.missing.length} terms to add\n`);

    // Fetch existing entries to check for duplicates
    console.log('🔍 Checking for existing entries in Supabase...');
    const { data: existingEntries, error: fetchError } = await supabase
        .from('dictionary_entries')
        .select('pidgin');

    if (fetchError) {
        console.error('❌ Error fetching existing entries:', fetchError.message);
        process.exit(1);
    }

    const existingPidginSet = new Set(existingEntries.map(e => e.pidgin.toLowerCase()));
    console.log(`✅ Loaded ${existingEntries.length} existing entries\n`);

    // Add missing terms
    let addedCount = 0;
    let skippedCount = 0;
    const entriesToInsert = [];

    console.log('🔄 Preparing new terms...\n');

    missingData.missing.forEach((term, index) => {
        if (existingPidginSet.has(term.pidgin.toLowerCase())) {
            console.log(`⚠️  Skipping duplicate: "${term.pidgin}"`);
            skippedCount++;
            return;
        }

        // Generate ID if not provided (UUID)
        const id = term.id || crypto.randomUUID();

        const newEntry = {
            id: id,
            pidgin: term.pidgin,
            english: Array.isArray(term.english) ? term.english : [term.english],
            category: term.category || 'general',
            pronunciation: term.pronunciation || '',
            examples: term.examples || [`${term.pidgin} stay ${Array.isArray(term.english) ? term.english[0] : term.english}`],
            usage: term.usage || '',
            origin: term.origin || '',
            difficulty: term.difficulty || 'intermediate',
            frequency: term.frequency || 'medium',
            tags: term.tags || [term.category || 'general']
        };

        entriesToInsert.push(newEntry);
        addedCount++;

        console.log(`${addedCount}. Preparing: ${term.pidgin}`);
    });

    if (entriesToInsert.length === 0) {
        console.log('\n✨ No new terms to add.');
        return;
    }

    // Insert into Supabase
    console.log(`\n💾 Inserting ${entriesToInsert.length} entries into Supabase...`);
    
    // Insert in batches of 50 to be safe
    const batchSize = 50;
    for (let i = 0; i < entriesToInsert.length; i += batchSize) {
        const batch = entriesToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
            .from('dictionary_entries')
            .insert(batch);

        if (insertError) {
            console.error(`❌ Error inserting batch starting at index ${i}:`, insertError.message);
        } else {
            console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entriesToInsert.length / batchSize)}`);
        }
    }

    // Summary
    console.log('\n✨ Addition Summary');
    console.log('==================');
    console.log(`➕ Terms added: ${addedCount}`);
    console.log(`⚠️  Terms skipped (duplicates): ${skippedCount}`);
    console.log(`\n✅ Missing terms processed successfully!`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});

