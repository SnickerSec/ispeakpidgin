#!/usr/bin/env node

/**
 * Apply Migration 045: Merge 'punnami' into 'punani' in live Supabase.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('🚀 Applying Migration 045 (punnami -> punani)...');

    // 1. Fetch current punani entry
    const { data: punani, error: fetchErr } = await supabase
        .from('dictionary_entries')
        .select('id, pidgin, spelling_variants')
        .eq('id', 'punani_383')
        .single();

    if (fetchErr) {
        console.error('❌ Failed to fetch punani_383:', fetchErr);
        process.exit(1);
    }

    const currentVariants = punani.spelling_variants || [];
    const mergedVariants = Array.from(new Set([...currentVariants, 'punnami']));

    const { error: updateErr } = await supabase
        .from('dictionary_entries')
        .update({
            spelling_variants: mergedVariants,
            updated_at: new Date().toISOString()
        })
        .eq('id', 'punani_383');

    if (updateErr) {
        console.error('❌ Failed to update punani_383 variants:', updateErr);
        process.exit(1);
    }

    console.log('✅ Updated punani_383 spelling_variants:', mergedVariants);

    // 2. Delete embedding for punnami
    const { error: embedDelErr } = await supabase
        .from('dictionary_embeddings')
        .delete()
        .eq('entry_id', 'b4cb0eb9-c2d4-4c33-9a73-13b14fdad5e0');

    if (embedDelErr) console.warn('Warning deleting punnami embedding:', embedDelErr.message);
    else console.log('✅ Deleted embedding for standalone punnami');

    // 3. Delete standalone punnami row
    const { error: delErr } = await supabase
        .from('dictionary_entries')
        .delete()
        .eq('id', 'b4cb0eb9-c2d4-4c33-9a73-13b14fdad5e0');

    if (delErr) {
        console.error('❌ Failed to delete standalone punnami entry:', delErr);
        process.exit(1);
    }
    console.log('✅ Deleted standalone punnami headword');

    // 4. Update any pending search_gaps
    await supabase
        .from('search_gaps')
        .update({ status: 'added' })
        .eq('term', 'punnami')
        .eq('status', 'pending');

    console.log('🎉 Migration 045 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
