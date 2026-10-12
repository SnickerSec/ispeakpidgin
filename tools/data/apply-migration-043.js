#!/usr/bin/env node

/**
 * Apply Migration 043 to Supabase
 * Ingests local slang "garut", expands mahalo search variants, and triages search_gaps.
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

const newTerm = {
    id: crypto.randomUUID(),
    pidgin: 'garut',
    english: ['flirty', 'boy-crazy', 'girl-crazy', 'teasing', 'coquettish'],
    category: 'slang',
    pronunciation: 'gah-ROOT',
    examples: [
        'Eh, no be so garut! You just met da guy five minutes ago.',
        'She stay acting all garut in front of da boys.'
    ],
    usage: 'Used in local Pidgin to tease someone who is being overly flirty, boy-crazy, or acting coquettish. Often said as gentle teasing among friends and family.',
    origin: 'Ilocano garut (flirtatious, promiscuous, or playful). Brought to Hawaii plantations by Filipino laborers and widely adopted into local Pidgin.',
    difficulty: 'intermediate',
    frequency: 'medium',
    tags: ['slang', 'filipino', 'ilocano', 'personality', 'humor', 'local'],
    source_language: 'pidgin',
    spelling_variants: ['garot', 'gaddut']
};

const enrichedVariants = [
    {
        id: '97452e75-c017-44db-95f8-22a3d852e9c7', // mahalo nui loa
        variants: ['mahalo nunui']
    },
    {
        id: '6792256e-1d9b-4c5b-b890-dd47534eb363', // aole pilikia
        variants: ['mahalo response']
    }
];

async function applyMigration() {
    console.log('🚀 Applying Migration 043...');

    // 1. Ingest garut
    const { data: existing } = await supabase
        .from('dictionary_entries')
        .select('id, pidgin')
        .eq('pidgin', newTerm.pidgin)
        .maybeSingle();

    if (existing) {
        console.log(`⚠️ Term "${newTerm.pidgin}" already exists (id: ${existing.id}), updating...`);
        const { error } = await supabase
            .from('dictionary_entries')
            .update({
                english: newTerm.english,
                spelling_variants: newTerm.spelling_variants,
                usage: newTerm.usage,
                origin: newTerm.origin,
                examples: newTerm.examples,
                pronunciation: newTerm.pronunciation,
                category: newTerm.category,
                difficulty: newTerm.difficulty,
                frequency: newTerm.frequency,
                tags: newTerm.tags,
                source_language: newTerm.source_language,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

        if (error) console.error(`❌ Failed to update ${newTerm.pidgin}:`, error);
        else console.log(`✅ Updated existing entry: ${newTerm.pidgin}`);
    } else {
        const { error } = await supabase
            .from('dictionary_entries')
            .insert([newTerm]);

        if (error) console.error(`❌ Failed to insert ${newTerm.pidgin}:`, error);
        else console.log(`✅ Ingested new term: ${newTerm.pidgin} (id: ${newTerm.id})`);
    }

    // 2. Enrich variants
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

    // 3. Triage pending search gaps
    console.log('🧹 Triaging search_gaps...');
    const { data: gaps } = await supabase
        .from('search_gaps')
        .select('*')
        .eq('status', 'pending');

    if (gaps && gaps.length > 0) {
        for (const gap of gaps) {
            const termLower = gap.term.toLowerCase().trim();
            if (['kiri', 'kuruchung'].includes(termLower)) {
                await supabase
                    .from('search_gaps')
                    .update({
                        status: 'ignored',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', gap.id);
                console.log(`✅ Ignored out-of-scope gap: "${gap.term}"`);
            } else if (['garut', 'garot', 'mahalo nunui', 'mahalo response'].includes(termLower)) {
                await supabase
                    .from('search_gaps')
                    .update({
                        status: 'added',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', gap.id);
                console.log(`✅ Triaged gap "${gap.term}" -> added`);
            }
        }
    }

    console.log('🎉 Migration 043 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
});
