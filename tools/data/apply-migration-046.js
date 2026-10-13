#!/usr/bin/env node

/**
 * Apply Migration 046: sarap is stressed on the final syllable (sah-RAHP) in live Supabase.
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
    console.log('🚀 Applying Migration 046 (sarap → sah-RAHP)...');

    const { data, error } = await supabase
        .from('dictionary_entries')
        .update({ pronunciation: 'sah-RAHP', updated_at: new Date().toISOString() })
        .eq('pidgin', 'sarap')
        .eq('pronunciation', 'SAH-rahp')
        .select('id, pidgin, pronunciation');

    if (error) {
        console.error('❌ Failed to update sarap:', error);
        process.exit(1);
    }
    if (!data.length) {
        console.log('ℹ️  No row still reads SAH-rahp; already applied.');
        return;
    }

    console.log('✅ Updated:', data);
    console.log('🎉 Migration 046 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
