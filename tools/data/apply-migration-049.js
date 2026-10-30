#!/usr/bin/env node

/**
 * Apply Migration 049:
 * 1. Add Hawaiian orthography variants ('ʻāina', '\'āina') and search fragment ('aina spelling') to aina
 * 2. Add 'boro' variant to boro boro
 * 3. Add 'haole boy' variant to haole
 * 4. Triage pending noise search gaps ('gomme', 'bofa deez docs', 'kaj kame', 'tatata') to 'ignored'
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
    console.log('🚀 Applying Migration 049 (Search Console variants, diacritics & gap triage)...');

    // 1. aina: add Hawaiian orthography ('ʻāina', '\'āina') and query variant ('aina spelling')
    const { data: aina, error: ainaErr } = await supabase
        .from('dictionary_entries')
        .update({
            spelling_variants: ['da aina', 'ʻāina', '\'āina', 'aina spelling'],
            updated_at: new Date().toISOString()
        })
        .eq('id', 'ina_309')
        .select('id, pidgin, spelling_variants');

    if (ainaErr) console.warn('Warning updating aina:', ainaErr.message);
    else console.log('✅ Updated aina spelling_variants:', aina);

    // 2. boro boro: add 'boro'
    const { data: boro, error: boroErr } = await supabase
        .from('dictionary_entries')
        .update({
            spelling_variants: ['boro'],
            updated_at: new Date().toISOString()
        })
        .eq('id', 'ac7d8942-6c27-4933-83d8-bb4e23faea5d')
        .select('id, pidgin, spelling_variants');

    if (boroErr) console.warn('Warning updating boro boro:', boroErr.message);
    else console.log('✅ Updated boro boro spelling_variants:', boro);

    // 3. haole: add 'haole boy'
    const { data: haole, error: haoleErr } = await supabase
        .from('dictionary_entries')
        .update({
            spelling_variants: ['holeo', 'haole boy'],
            updated_at: new Date().toISOString()
        })
        .eq('id', 'haole_064')
        .select('id, pidgin, spelling_variants');

    if (haoleErr) console.warn('Warning updating haole:', haoleErr.message);
    else console.log('✅ Updated haole spelling_variants:', haole);

    // 4. Triage noise in search_gaps
    const noiseTerms = ['gomme', 'bofa deez docs', 'kaj kame', 'tatata'];
    const { data: gaps, error: gapsErr } = await supabase
        .from('search_gaps')
        .update({ status: 'ignored' })
        .in('term', noiseTerms)
        .eq('status', 'pending')
        .select('id, term, status');

    if (gapsErr) console.warn('Warning updating search_gaps:', gapsErr.message);
    else console.log('✅ Triaged noise search_gaps:', gaps);

    console.log('🎉 Migration 049 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
