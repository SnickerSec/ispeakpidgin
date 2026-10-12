#!/usr/bin/env node

/**
 * Apply Migration 044: Add 'hihu' spelling variant to 'huhu' in live Supabase.
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
    console.log('🚀 Applying Migration 044 (hihu -> huhu)...');

    const { data: current, error: fetchErr } = await supabase
        .from('dictionary_entries')
        .select('id, pidgin, spelling_variants')
        .eq('id', 'huhu_073')
        .single();

    if (fetchErr) {
        console.error('❌ Failed to fetch huhu_073:', fetchErr);
        process.exit(1);
    }

    const currentVariants = current.spelling_variants || [];
    const merged = Array.from(new Set([...currentVariants, 'hihu']));

    const { error: updateErr } = await supabase
        .from('dictionary_entries')
        .update({
            spelling_variants: merged,
            updated_at: new Date().toISOString()
        })
        .eq('id', 'huhu_073');

    if (updateErr) {
        console.error('❌ Failed to update huhu_073 variants:', updateErr);
        process.exit(1);
    }

    console.log('✅ Enriched huhu variants:', merged);

    // Triage any pending 'hihu' gap
    const { error: gapErr } = await supabase
        .from('search_gaps')
        .update({
            status: 'added'
        })
        .eq('term', 'hihu')
        .eq('status', 'pending');

    if (gapErr) console.warn('Warning updating search_gaps:', gapErr);

    console.log('🎉 Migration 044 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
