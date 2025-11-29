#!/usr/bin/env node

/**
 * Migration script: JSON to Supabase
 * Migrates all dictionary entries from pidgin-master.json to Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
    console.log('\nTo get your service key:');
    console.log('1. Go to Supabase Dashboard → Project Settings → API');
    console.log('2. Copy the "service_role" key (NOT the anon key)');
    console.log('3. Run: SUPABASE_SERVICE_KEY="your-key" node tools/migrate-to-supabase.js');
    process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load master data
const masterDataPath = path.join(__dirname, '../data/master/pidgin-master.json');

async function migrate() {
    console.log('🚀 Starting migration to Supabase...\n');

    // Load JSON data
    if (!fs.existsSync(masterDataPath)) {
        console.error('❌ Master data file not found:', masterDataPath);
        process.exit(1);
    }

    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
    const entries = masterData.entries;

    console.log(`📦 Found ${entries.length} entries to migrate\n`);

    // Transform entries for Supabase
    const transformedEntries = entries.map(entry => ({
        id: entry.id,
        pidgin: entry.pidgin,
        english: entry.english || [],
        category: entry.category || null,
        pronunciation: entry.pronunciation || null,
        examples: entry.examples || [],
        usage: entry.usage || null,
        origin: entry.origin || null,
        difficulty: entry.difficulty || null,
        frequency: entry.frequency || null,
        tags: entry.tags || [],
        audio_example: entry.audioExample || null
    }));

    // Insert in batches of 100
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transformedEntries.length; i += batchSize) {
        const batch = transformedEntries.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(transformedEntries.length / batchSize);

        console.log(`📤 Uploading batch ${batchNum}/${totalBatches} (${batch.length} entries)...`);

        const { data, error } = await supabase
            .from('dictionary_entries')
            .upsert(batch, { onConflict: 'id' });

        if (error) {
            console.error(`   ❌ Batch ${batchNum} failed:`, error.message);
            errorCount += batch.length;
        } else {
            console.log(`   ✅ Batch ${batchNum} complete`);
            successCount += batch.length;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount} entries`);
    if (errorCount > 0) {
        console.log(`   ❌ Failed: ${errorCount} entries`);
    }
    console.log('='.repeat(50));

    // Verify by counting entries in database
    const { count, error: countError } = await supabase
        .from('dictionary_entries')
        .select('*', { count: 'exact', head: true });

    if (!countError) {
        console.log(`\n🔍 Verification: ${count} entries now in Supabase database`);
    }

    console.log('\n✨ Migration complete!');
}

migrate().catch(console.error);
