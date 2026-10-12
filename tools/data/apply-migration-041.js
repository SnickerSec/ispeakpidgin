#!/usr/bin/env node

/**
 * Apply Migration 041 to Supabase
 * Ingests 8 high-value terms from search gaps & Search Console demand,
 * enriches existing entries with variants, and triages the search_gaps backlog:
 *   - aloha e komo mai, aku eye, fadah man, dap, aiyah, spesho, trow up, dangah
 *   - adds variants to shaka, kamaaina, fo' real, sarap, mahalo, a hui hou, menpachi eyes, chillin
 *   - marks answered search gaps 'added' and noise search gaps 'ignored'
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
        pidgin: 'aku eye',
        english: ['bulging eyes', 'bug-eyed', 'wide glassy eyes', 'staring blankly'],
        category: 'slang',
        pronunciation: 'AH-koo eye',
        examples: [
            'Why you got aku eye like dat? You nevah sleep last night?',
            'He stayed looking at da waves wit aku eye.'
        ],
        usage: 'Local slang describing someone with wide, bulging, tired, or blankly staring eyes, resembling an aku (skipjack tuna). Similar to menpachi eyes.',
        origin: 'Hawaiian aku (skipjack tuna) + English eye.',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['slang', 'expressions', 'humor', 'local'],
        source_language: 'pidgin',
        spelling_variants: ['aku eyes']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'fadah man',
        english: ['Catholic priest', 'minister', 'pastor', 'reverend'],
        category: 'people',
        pronunciation: 'FAH-dah man',
        examples: [
            "Fadah man wen give da blessing befo' we eat.",
            'Uncle went talk story wit da fadah man aftah church.'
        ],
        usage: 'Local Pidgin term referring to a Catholic priest, pastor, or clerical father figure.',
        origin: 'Pidgin pronunciation of father man.',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['people', 'church', 'culture', 'local'],
        source_language: 'pidgin',
        spelling_variants: ['father man', 'fada man']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'dap',
        english: ['fist bump', 'handshake greeting', 'hand clasp greeting'],
        category: 'slang',
        pronunciation: 'dap',
        examples: [
            'Give da boy dap when you see him.',
            'Shoots brah, throw me one dap.'
        ],
        usage: 'Casual island hand greeting incorporating a slap, slide, or fist bump between friends and braddahs.',
        origin: 'Colloquial greeting gesture adopted widely in island culture.',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['slang', 'greetings', 'gesture'],
        source_language: 'pidgin',
        spelling_variants: ['dhaap', 'dapps']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'spesho',
        english: ['special', 'extraordinary', 'precious', 'unique'],
        category: 'slang',
        pronunciation: 'SPESH-oh',
        examples: [
            'Dis one stay real spesho to me.',
            'Da Good An Spesho Book stay da Pidgin Old Testament.'
        ],
        usage: 'Hawaiian Pidgin phonetic pronunciation and spelling of special. Widely recognized in Hawaii literature and everyday speech.',
        origin: 'Hawaiian Pidgin phonetic pronunciation of English special.',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['slang', 'expressions', 'everyday'],
        source_language: 'pidgin',
        spelling_variants: ['speso', 'speco']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'trow up',
        english: ['vomit', 'throw up', 'puke', 'get sick'],
        category: 'actions',
        pronunciation: 'trow up',
        examples: [
            'Too much malasada, now I feel like I going trow up.',
            'Dat boat ride was rough, almost everyone wen trow up.'
        ],
        usage: 'Everyday Pidgin term for vomiting or throwing up. Follows the standard Pidgin th-stopping ("th" -> "t").',
        origin: 'Pidgin phonology for English throw up.',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['actions', 'health', 'slang'],
        source_language: 'pidgin',
        spelling_variants: ['trow-up']
    }
];

async function applyMigration() {
    console.log('🚀 Applying Migration 041...');

    // 1. Insert new terms
    for (const term of newTerms) {
        const variantsToCheck = [term.pidgin, ...(term.spelling_variants || [])];
        const { data: existing } = await supabase
            .from('dictionary_entries')
            .select('id, pidgin')
            .in('pidgin', variantsToCheck)
            .maybeSingle();

        if (existing) {
            console.log(`⚠️ Term "${term.pidgin}" or variant already exists (id: ${existing.id}), skipping insert.`);
        } else {
            const { error } = await supabase
                .from('dictionary_entries')
                .insert([term]);

            if (error) {
                console.error(`❌ Failed to insert "${term.pidgin}":`, error.message);
                process.exit(1);
            }
            console.log(`✅ Inserted term: "${term.pidgin}" (id: ${term.id})`);
        }
    }

    // 2. Update existing entries with spelling/search variants
    const variantUpdates = [
        { pidgin: 'e komo mai', variants: ['aloha e komo mai', 'komo mai'] },
        { pidgin: 'ai yah', variants: ['aiyah', 'aiyh', 'aiya'] },
        { pidgin: 'shaka', variants: ['hang loose', 'hang loose hand sign'] },
        { pidgin: 'kamaaina', variants: ['local'] },
        { pidgin: 'fosho', variants: ['fo sho', 'fo sho origin'] },
        { pidgin: 'danjah', variants: ['dangah'] },
        { pidgin: 'sarap', variants: ['grabe ang sarap'] },
        { pidgin: 'mahalo', variants: ['grateful'] },
        { pidgin: 'a hui hou', variants: ['farewell'] },
        { pidgin: 'menpachi eyes', variants: ['tako eye'] },
        { pidgin: 'chillin', variants: ['chillon'] }
    ];

    for (const item of variantUpdates) {
        const { data: existing } = await supabase
            .from('dictionary_entries')
            .select('id, pidgin, spelling_variants')
            .eq('pidgin', item.pidgin)
            .maybeSingle();

        if (existing) {
            const current = existing.spelling_variants || [];
            const merged = Array.from(new Set([...current, ...item.variants]));
            const { error: updateErr } = await supabase
                .from('dictionary_entries')
                .update({ spelling_variants: merged, updated_at: new Date().toISOString() })
                .eq('id', existing.id);

            if (updateErr) {
                console.error(`❌ Failed to update variants for "${item.pidgin}":`, updateErr.message);
            } else {
                console.log(`✅ Updated "${item.pidgin}" with variants:`, merged);
            }
        }
    }

    // 3. Update search_gaps table
    const addedTerms = [
        'aloha e komo mai', 'aku eye', 'aku eyes', 'fadah man', 'father man',
        'fada man', 'dap', 'dhaap', 'dapps', 'aiyah', 'aiyh', 'spesho',
        'speso', 'speco', 'trow up', 'throw up', 'vomit', 'dangah',
        'danger', 'tako eye', 'chillon', 'hang loose hand sign', 'grabe ang sarap'
    ];

    const { error: addErr } = await supabase
        .from('search_gaps')
        .update({ status: 'added' })
        .eq('status', 'pending')
        .in('term', addedTerms);

    if (addErr) {
        console.warn('⚠️ Could not update search_gaps to added:', addErr.message);
    } else {
        console.log(`✅ Marked ${addedTerms.length} search gaps as 'added'`);
    }

    const ignoredTerms = [
        'fo&#x27;evah', 'i&#x27;ve got your back'
    ];

    const { error: ignoreErr } = await supabase
        .from('search_gaps')
        .update({ status: 'ignored' })
        .eq('status', 'pending')
        .in('term', ignoredTerms);

    if (ignoreErr) {
        console.warn('⚠️ Could not update search_gaps to ignored:', ignoreErr.message);
    } else {
        console.log(`✅ Marked ${ignoredTerms.length} noise/entity search gaps as 'ignored'`);
    }

    console.log('🎉 Migration 041 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
