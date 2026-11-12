#!/usr/bin/env node

/**
 * Apply Migration 051:
 * 1. Add Search Console & search_gaps phonetic spelling variants to kahuna, hula, haole,
 *    a hui hou, braddah, cuzzo, faamolemole, ack, sistah, and wassup.
 * 2. Backfill optional metadata on cuzzo.
 * 3. Ingest two local Hawaii Pidgin slang entries: ufa and bvds.
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

async function mergeVariants(id, addVariants, extraFields = {}) {
    const { data: existing, error: fetchErr } = await supabase
        .from('dictionary_entries')
        .select('id, pidgin, spelling_variants')
        .eq('id', id)
        .single();
    if (fetchErr) throw new Error(`Fetch ${id}: ${fetchErr.message}`);

    const merged = Array.from(new Set([...(existing.spelling_variants || []), ...addVariants]));
    const { data, error } = await supabase
        .from('dictionary_entries')
        .update({
            spelling_variants: merged,
            ...extraFields,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, pidgin, spelling_variants');
    if (error) throw new Error(`Update ${id}: ${error.message}`);
    console.log(`✅ Updated ${existing.pidgin}:`, data[0].spelling_variants);
}

async function applyMigration() {
    console.log('🚀 Applying Migration 051 (Search Console phonetic variants & local slang)...\n');

    await mergeVariants('kahuna_083', ['cahunas', 'kahoonas', 'kahonas', 'cahuna', 'kahoona', 'kahona', 'kahunas']);
    await mergeVariants('hula_601', ['hoola', 'houla', 'huala']);
    await mergeVariants('haole_064', ['holeo', 'haole boy', 'howlie']);
    await mergeVariants('a_hui_hou_600', ['farewell', 'aloha a hui hou', 'a hui hou kakou', 'a hou hoi']);
    await mergeVariants('braddah_318', ['bruddah', 'brodda']);
    await mergeVariants('5f427e7d-d547-4d68-9de6-ed605abb042a', ['couso', 'cuzo'], {
        origin: 'Playful island slang variation of "cousin" / "cuz," reflecting close family-style friendships across Hawaii.',
        difficulty: 'beginner',
        frequency: 'medium',
        audio_example: 'Eh cuzzo, you like go surf later?'
    });
    await mergeVariants('84b11693-97a3-4ae9-b791-3fde62b0a724', ['faʻamolemole', "fa'amolemole", 'fakamolemole'], {
        origin: "From Samoan faʻamolemole (\"please\"), heard alongside cognate Tongan fakamolemole across Hawaii's Pacific Islander communities."
    });
    await mergeVariants('ack_002', ['acking', 'aking'], {
        english: ['to act', 'behave', 'act up', 'show off']
    });
    await mergeVariants('sistah_160', ['sista', 'sosta']);
    await mergeVariants('wassup_190', ['sup', 'sahp', 'sap', 'whassup']);

    const newEntries = [
        {
            id: 'a7b8c9d0-e1f2-4a3b-8c4d-5e6f7a8b9c01',
            pidgin: 'ufa',
            english: ['butt', 'buttocks', 'rear end'],
            category: 'slang',
            pronunciation: 'OO-fah',
            examples: [
                'Shut your ufa!',
                'He wen fall right on his ufa.',
                'No act lolo or you get boot in da ufa.'
            ],
            usage: 'Borrowed from Samoan into Hawaii local slang, "ufa" means butt or rear end (similar to Hawaiian "okole"). Commonly heard in playful local trash talk and schoolyard banter across the islands.',
            origin: "Directly from the Samoan word ufa (buttocks/rear end), brought into everyday Hawaii Pidgin slang through Hawaii's Samoan community.",
            difficulty: 'beginner',
            frequency: 'medium',
            tags: ['slang', 'samoan', 'body'],
            audio_example: 'He wen fall right on his ufa.',
            source_language: 'pidgin',
            spelling_variants: ['ufas'],
            updated_at: new Date().toISOString()
        },
        {
            id: 'b8c9d0e1-f2a3-4b4c-9d5e-6f7a8b9c0d12',
            pidgin: 'bvds',
            english: ['underwear', 'briefs', "men's underwear"],
            category: 'slang',
            pronunciation: 'bee-vee-DEEZ',
            examples: [
                'Go put on clean BVDs before we go town!',
                'Small kid time we used to jump off da pier in our BVDs.',
                'Aunty hang all da BVDs on da clothesline.'
            ],
            usage: "Classic local Hawaii Pidgin term for men's or boys' underwear and briefs, used generically regardless of the actual brand.",
            origin: 'From the American underwear brand B.V.D., generalized in plantation and mid-century Hawaii into the everyday local word for briefs or underwear.',
            difficulty: 'beginner',
            frequency: 'medium',
            tags: ['slang', 'clothing', 'everyday'],
            audio_example: 'Go put on clean BVDs before we go town!',
            source_language: 'pidgin',
            spelling_variants: ['bvd'],
            updated_at: new Date().toISOString()
        }
    ];

    const { data: inserted, error: insErr } = await supabase
        .from('dictionary_entries')
        .upsert(newEntries, { onConflict: 'id' })
        .select('id, pidgin, english');
    if (insErr) throw new Error(`Upsert new entries: ${insErr.message}`);
    console.log('✅ Upserted new slang entries:', inserted);

    console.log('\n🎉 Migration 051 applied successfully!');
}

applyMigration().catch(err => {
    console.error('❌ Fatal migration error:', err.message);
    process.exit(1);
});
