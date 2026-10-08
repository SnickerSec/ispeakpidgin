#!/usr/bin/env node

/**
 * Apply Migration 037 to Supabase
 * Ingests palala, homelunch, onefaka, and dis ol' way, plus variant updates.
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
        pidgin: 'palala',
        english: ['brother', 'friend', 'bro', 'local guy', 'dude'],
        category: 'people',
        pronunciation: 'pah-LAH-lah',
        examples: [
            'Howzit, palala! Long time no see!',
            'Dat palala over dea know how fo\' fix your truck.',
            'Shoots, tanks palala, I catch you later.'
        ],
        usage: 'Used warmly between friends or to refer respectfully to another local guy. Hawaiianized adaptation of "brother", parallel to "braddah". Common across Oahu, Maui, and Hawaii Island.',
        origin: 'Hawaiianized adaptation of English "brother" (also influenced by Hawaiian palaoa/palalah).',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['people', 'greetings', 'slang', 'friendship'],
        source_language: 'pidgin',
        spelling_variants: ['palalah']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'homelunch',
        english: ['packed lunch', 'home lunch', 'lunch from home', 'brown-bag lunch', 'bento from home'],
        category: 'food',
        pronunciation: 'HOHM-lunch',
        examples: [
            'You buying school lunch today or you get homelunch?',
            'My mom wen pack me one mean homelunch wit spam musubi and chips.',
            'Homelunch gang stay eating outside by da pavilion.'
        ],
        usage: 'Everyday Hawaii school and workplace term for lunch brought from home, contrasting with buying school lunch, cafeteria food, or takeout plate lunch.',
        origin: 'Hawaii plantation and school culture terminology distinguishing home-prepared bentos from cafeteria lunches.',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['food', 'daily life', 'school', 'lifestyle'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'onefaka',
        english: ['someone', 'a guy', 'some dude', 'that guy', 'a person'],
        category: 'slang',
        pronunciation: 'wun-FAH-kah',
        examples: [
            'I wen see onefaka trying fo\' open your car door!',
            'Who dat onefaka walking around wit no slippahs?',
            'Lucky onefaka, he wen win da jackpot.'
        ],
        usage: 'Very common Pidgin compound of "one" (indefinite article "a/an") and "faka" (fellow/guy). Can be neutral/affectionate between friends ("lucky onefaka") or derogatory toward an outsider/troublemaker depending on tone.',
        origin: 'Hawaiian Pidgin grammatical compound of "one" (a/an) + "faka" (from English fucker/fellow).',
        difficulty: 'intermediate',
        frequency: 'high',
        tags: ['slang', 'people', 'expressions'],
        source_language: 'pidgin',
        spelling_variants: ['one faka', 'won faka']
    },
    {
        id: crypto.randomUUID(),
        pidgin: "dis ol' way",
        english: ['like this', 'in this manner', 'this way', 'the customary way', 'this old way'],
        category: 'expressions',
        pronunciation: 'dis-OHL-way',
        examples: [
            'If you do \'um dis ol\' way, goin\' take all day brah!',
            'Why you stay walking dis ol\' way?',
            'We always wen cook da kalua pig dis ol\' way, from small kid time.'
        ],
        usage: 'Idiomatic expression describing doing something in a particular, customary, or frustratingly slow manner ("like this" or "this old way").',
        origin: 'Hawaiian Pidgin idiom adapted from English "this old way" with creole phonology.',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['expressions', 'idioms', 'daily life'],
        source_language: 'pidgin',
        spelling_variants: ['this ole way', 'dis ole way', 'dis old way']
    }
];

async function applyMigration() {
    console.log('🚀 Applying Migration 036...');

    // 1. Insert new terms
    for (const term of newTerms) {
        const { data: existing } = await supabase
            .from('dictionary_entries')
            .select('id, pidgin')
            .eq('pidgin', term.pidgin)
            .maybeSingle();

        if (existing) {
            console.log(`⚠️ Term "${term.pidgin}" already exists (id: ${existing.id}), skipping insert.`);
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

    // 2. Update existing entries with spelling variants & meanings
    const updates = [
        {
            id: 'hammah_060',
            pidgin: 'hammah',
            update: {
                english: ['pound hard', 'badass', 'hard worker', 'heavy hitter', 'beast'],
                spelling_variants: ['hammas'],
                updated_at: new Date().toISOString()
            }
        },
        {
            id: 'a9e7c36e-997e-4d8d-ade3-691011f1269b',
            pidgin: 'ono',
            update: {
                spelling_variants: ['oohno'],
                updated_at: new Date().toISOString()
            }
        },
        {
            id: 'huhu_073',
            pidgin: 'huhu',
            update: {
                spelling_variants: ['hu hu', 'who who', 'hu hu hu'],
                updated_at: new Date().toISOString()
            }
        },
        {
            id: '94f37a14-252b-47b3-a2ab-50e42faad66f',
            pidgin: 'geev',
            update: {
                spelling_variants: ['geeve'],
                updated_at: new Date().toISOString()
            }
        },
        {
            id: 'geev_um_1026',
            pidgin: "geev 'um",
            update: {
                spelling_variants: ['givem', 'geevum', "give 'um"],
                updated_at: new Date().toISOString()
            }
        }
    ];

    for (const item of updates) {
        const { error } = await supabase
            .from('dictionary_entries')
            .update(item.update)
            .eq('id', item.id);

        if (error) {
            console.error(`❌ Failed to update "${item.pidgin}":`, error.message);
        } else {
            console.log(`✅ Updated existing entry: "${item.pidgin}"`);
        }
    }

    console.log('🎉 Migration 036 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
