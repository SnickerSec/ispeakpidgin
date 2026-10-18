#!/usr/bin/env node

/**
 * Apply Migration 048: Enrich search demand meanings (malihini, haole, akua, lehua, lanai, cuz)
 * and resolve search gap for 'have a great' in live Supabase.
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
    console.log('🚀 Applying Migration 048 (Enrich search demand variants & meanings)...');

    // 1. malihini: add 'outsider' and 'visitor'
    const { data: malihini, error: malihiniErr } = await supabase
        .from('dictionary_entries')
        .update({
            english: ['newcomer', 'tourist', 'outsider', 'visitor'],
            updated_at: new Date().toISOString()
        })
        .eq('id', 'malihini_114')
        .select('id, pidgin, english');

    if (malihiniErr) console.warn('Warning updating malihini:', malihiniErr.message);
    else console.log('✅ Updated malihini:', malihini);

    // 2. haole: add 'white people'
    const { data: haole, error: haoleErr } = await supabase
        .from('dictionary_entries')
        .update({
            english: ['white person', 'white people', 'foreigner', 'non-Hawaiian'],
            updated_at: new Date().toISOString()
        })
        .eq('id', 'haole_064')
        .select('id, pidgin, english');

    if (haoleErr) console.warn('Warning updating haole:', haoleErr.message);
    else console.log('✅ Updated haole:', haole);

    // 3. akua: add 'creator', 'lord', 'the creator' and spelling_variants ['ke akua', 'keakua']
    const { data: akua, error: akuaErr } = await supabase
        .from('dictionary_entries')
        .update({
            english: ['god', 'deity', 'creator', 'lord', 'the creator'],
            spelling_variants: ['ke akua', 'keakua'],
            updated_at: new Date().toISOString()
        })
        .eq('id', 'akua_287')
        .select('id, pidgin, english, spelling_variants');

    if (akuaErr) console.warn('Warning updating akua:', akuaErr.message);
    else console.log('✅ Updated akua:', akua);

    // 4. cuz: add 'cuz for cousin' to spelling_variants
    const { data: cuz, error: cuzErr } = await supabase
        .from('dictionary_entries')
        .update({
            spelling_variants: ['kuz', 'cuz for cousin'],
            updated_at: new Date().toISOString()
        })
        .eq('id', 'cuz_039')
        .select('id, pidgin, spelling_variants');

    if (cuzErr) console.warn('Warning updating cuz:', cuzErr.message);
    else console.log('✅ Updated cuz:', cuz);

    // 5. lehua: add 'lehua flower' to spelling_variants
    const { data: lehua, error: lehuaErr } = await supabase
        .from('dictionary_entries')
        .update({
            spelling_variants: ['lehua flower'],
            updated_at: new Date().toISOString()
        })
        .eq('id', 'lehua_619')
        .select('id, pidgin, spelling_variants');

    if (lehuaErr) console.warn('Warning updating lehua:', lehuaErr.message);
    else console.log('✅ Updated lehua:', lehua);

    // 6. lanai: add 'lania' to spelling_variants
    const { data: lanai, error: lanaiErr } = await supabase
        .from('dictionary_entries')
        .update({
            spelling_variants: ['lania'],
            updated_at: new Date().toISOString()
        })
        .eq('pidgin', 'lanai')
        .select('id, pidgin, spelling_variants');

    if (lanaiErr) console.warn('Warning updating lanai:', lanaiErr.message);
    else console.log('✅ Updated lanai:', lanai);

    // 7. Resolve pending search gap: 'have a great'
    const { data: gapData, error: gapErr } = await supabase
        .from('search_gaps')
        .update({ status: 'added' })
        .eq('term', 'have a great')
        .eq('status', 'pending')
        .select('id, term, status');

    if (gapErr) console.warn('Warning updating search_gaps:', gapErr.message);
    else console.log('✅ Resolved search_gap:', gapData);

    console.log('🎉 Migration 048 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
