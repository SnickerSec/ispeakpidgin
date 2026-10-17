#!/usr/bin/env node

/**
 * Apply Migration 047: Ingest search-demand terms ('haʻaheo', 'das how stay') and resolve search gaps in live Supabase.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newEntries = [
    {
        pidgin: 'haʻaheo',
        english: ['pride', 'proud', 'to cherish with pride'],
        category: 'cultural',
        pronunciation: 'hah-ah-HEH-oh',
        examples: ['Get plenty haʻaheo in da community.'],
        usage: 'Expresses deep cultural pride, honor, and dignity in Hawaiian heritage and identity.',
        origin: 'Hawaiian',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['cultural', 'hawaiian', 'values', 'pride'],
        source_language: 'hawaiian',
        spelling_variants: ['haaheo']
    },
    {
        pidgin: 'das how stay',
        english: ["that's how it is", "that's the way it is", "that is how it is"],
        category: 'phrases',
        pronunciation: 'dahs how STAY',
        examples: ['Sometimes win, sometimes lose, das how stay.'],
        usage: 'Common philosophical phrase accepting life as it happens; synonymous with "c\'est la vie" or "it is what it is".',
        origin: 'Pidgin',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['phrases', 'idiom', 'acceptance', 'slang'],
        source_language: 'pidgin',
        spelling_variants: ['das how', 'dat how stay']
    }
];

async function applyMigration() {
    console.log('🚀 Applying Migration 047 (Add haʻaheo & das how stay, resolve search gaps)...');

    // 1. Ingest new dictionary entries if not already present
    for (const entry of newEntries) {
        const { data: existing, error: checkErr } = await supabase
            .from('dictionary_entries')
            .select('id, pidgin')
            .eq('pidgin', entry.pidgin);

        if (checkErr) {
            console.error(`❌ Error checking ${entry.pidgin}:`, checkErr);
            process.exit(1);
        }

        if (existing && existing.length > 0) {
            console.log(`ℹ️  "${entry.pidgin}" already exists (id: ${existing[0].id}), skipping insert.`);
        } else {
            const rowToInsert = {
                id: crypto.randomUUID(),
                ...entry,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: inserted, error: insertErr } = await supabase
                .from('dictionary_entries')
                .insert([rowToInsert])
                .select('id, pidgin');

            if (insertErr) {
                console.error(`❌ Failed to insert ${entry.pidgin}:`, insertErr);
                process.exit(1);
            }
            console.log(`✅ Inserted ${entry.pidgin}:`, inserted);
        }
    }

    // 2. Resolve pending search gaps
    console.log('🔄 Resolving pending search_gaps...');
    const { data: updatedGaps, error: gapErr } = await supabase
        .from('search_gaps')
        .update({ status: 'added' })
        .in('term', ['pride', 'how it is'])
        .eq('status', 'pending')
        .select('id, term, status');

    if (gapErr) {
        console.warn('⚠️  Could not update search_gaps (added):', gapErr.message);
    } else {
        console.log('✅ Updated search_gaps (added):', updatedGaps);
    }

    const { data: ignoredGaps, error: ignoreErr } = await supabase
        .from('search_gaps')
        .update({ status: 'ignored' })
        .eq('term', 'rnjoy')
        .eq('status', 'pending')
        .select('id, term, status');

    if (ignoreErr) {
        console.warn('⚠️  Could not update search_gaps (ignored):', ignoreErr.message);
    } else {
        console.log('✅ Updated search_gaps (ignored):', ignoredGaps);
    }

    console.log('🎉 Migration 047 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
