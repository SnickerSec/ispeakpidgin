#!/usr/bin/env node

/**
 * Apply Migration 042 to Supabase
 * Ingests live search-gap terms and expands high-demand search variants:
 *   - uso (Samoan: brother / friend; variants: fa uso, fa'a uso)
 *   - spoil (entitled/fussy child; variants: spoil brat, spoilt, spoile)
 *   - updates hauna to include 'spoiled', 'stinky', 'rotten'
 *   - enriches variants for shaka, a hui hou, howzit
 *   - triages pending search_gaps rows
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newTerms = [
    {
        id: crypto.randomUUID(),
        pidgin: 'uso',
        english: ['brother', 'bro', 'brotherhood', 'friend'],
        category: 'slang',
        pronunciation: 'OO-soh',
        examples: [
            "Cheee, what's up uso!",
            'Dat guy my uso from way back, we grew up together.'
        ],
        usage: 'A Samoan term widely embraced across Hawaii meaning brother or close friend, used similarly to brah or bro.',
        origin: 'Samoan uso (sibling of the same gender). Commonly used in local Hawaii culture.',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['slang', 'polynesian', 'brotherhood', 'greetings', 'local'],
        source_language: 'pidgin',
        spelling_variants: ['fa uso', "fa'a uso"]
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'spoil',
        english: ['spoiled', 'acting entitled', 'fussy', 'bratty'],
        category: 'descriptions',
        pronunciation: 'SPOIL',
        examples: [
            'No be so spoil, eat what stay on your plate.',
            'Dat kid stay one spoil brat when he no get his way.'
        ],
        usage: 'Used to describe someone who acts entitled, fussy, or demanding like a spoiled child. Commonly heard as "spoil brat".',
        origin: 'English spoiled, adapted with characteristic Pidgin consonant cluster reduction.',
        difficulty: 'beginner',
        frequency: 'medium',
        tags: ['slang', 'descriptions', 'behavior', 'family'],
        source_language: 'pidgin',
        spelling_variants: ['spoil brat', 'spoilt', 'spoile']
    }
];

const enrichedVariants = [
    {
        id: 'shaka_1029',
        variants: ['hand gesture with thumb and pinky out', 'shaka sign', 'shaka hand']
    },
    {
        id: 'a_hui_hou_600',
        variants: ['aloha a hui hou', 'a hui hou kakou']
    },
    {
        id: 'howzit_072',
        variants: ['howzit response', 'howzit braddah']
    }
];

async function applyMigration() {
    console.log('🚀 Applying Migration 042...');

    // 1. Ingest new terms
    for (const term of newTerms) {
        const { data: existing } = await supabase
            .from('dictionary_entries')
            .select('id, pidgin')
            .eq('pidgin', term.pidgin)
            .maybeSingle();

        if (existing) {
            console.log(`⚠️ Term "${term.pidgin}" already exists (id: ${existing.id}), updating...`);
            const { error } = await supabase
                .from('dictionary_entries')
                .update({
                    english: term.english,
                    spelling_variants: term.spelling_variants,
                    usage: term.usage,
                    origin: term.origin,
                    examples: term.examples,
                    pronunciation: term.pronunciation,
                    category: term.category,
                    difficulty: term.difficulty,
                    frequency: term.frequency,
                    tags: term.tags,
                    source_language: term.source_language,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) {
                console.error(`❌ Failed to update ${term.pidgin}:`, error);
            } else {
                console.log(`✅ Updated existing entry: ${term.pidgin}`);
            }
        } else {
            const { error } = await supabase
                .from('dictionary_entries')
                .insert([term]);

            if (error) {
                console.error(`❌ Failed to insert ${term.pidgin}:`, error);
            } else {
                console.log(`✅ Ingested new term: ${term.pidgin} (id: ${term.id})`);
            }
        }
    }

    // 2. Update hauna English meanings
    console.log('🔄 Updating hauna English meanings...');
    const { error: haunaErr } = await supabase
        .from('dictionary_entries')
        .update({
            english: ['smelly', 'spoiled', 'rotten', 'foul-smelling'],
            updated_at: new Date().toISOString()
        })
        .eq('id', 'hauna_604');

    if (haunaErr) {
        console.error('❌ Failed to update hauna:', haunaErr);
    } else {
        console.log('✅ Updated hauna English meanings.');
    }

    // 3. Enrich variants on existing entries
    for (const item of enrichedVariants) {
        const { data: current } = await supabase
            .from('dictionary_entries')
            .select('id, pidgin, spelling_variants')
            .eq('id', item.id)
            .single();

        if (current) {
            const currentVariants = current.spelling_variants || [];
            const merged = Array.from(new Set([...currentVariants, ...item.variants]));
            const { error } = await supabase
                .from('dictionary_entries')
                .update({
                    spelling_variants: merged,
                    updated_at: new Date().toISOString()
                })
                .eq('id', item.id);

            if (error) {
                console.error(`❌ Failed to enrich variants for ${current.pidgin}:`, error);
            } else {
                console.log(`✅ Enriched variants for ${current.pidgin}:`, merged);
            }
        }
    }

    // 4. Triage pending search gaps
    console.log('🧹 Triaging search_gaps...');
    const { data: gaps, error: gapsFetchErr } = await supabase
        .from('search_gaps')
        .select('*')
        .eq('status', 'pending');

    if (gapsFetchErr) {
        console.error('❌ Error fetching search gaps:', gapsFetchErr);
    } else if (gaps && gaps.length > 0) {
        console.log(`Found ${gaps.length} pending search gaps.`);
        for (const gap of gaps) {
            const termLower = gap.term.toLowerCase().trim();
            if (['spoiled', 'spoile', 'fa uso', 'aloha a hui hou', 'uso', 'spoil'].includes(termLower)) {
                await supabase
                    .from('search_gaps')
                    .update({
                        status: 'added',
                        notes: 'Addressed in Migration 042',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', gap.id);
                console.log(`✅ Triaged gap "${gap.term}" -> added`);
            }
        }
    } else {
        console.log('No pending search gaps found.');
    }

    console.log('🎉 Migration 042 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
