#!/usr/bin/env node

/**
 * Apply Migration 040 to Supabase
 * Ingests 10 high-value terms from search gaps and triages search_gaps backlog:
 *   - kanaka maoli, pork hash, went grad, kava, makahiki, beach boy, holokū, nuff said, jah den, ay koodish
 *   - adds variants to you da man, aole pilikia, grindz, chotto
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
        pidgin: 'kanaka maoli',
        english: ['Native Hawaiian', 'indigenous Hawaiian person', 'original person of the land'],
        category: 'people',
        pronunciation: 'kah-NAH-kah mow-LEE',
        examples: [
            'He is proud kanaka maoli, tracing his lineage back through generations.',
            'Support local kanaka maoli artists and cultural practitioners.'
        ],
        usage: 'Native Hawaiian, of indigenous Hawaiian ancestry. Used with deep cultural respect and cultural identity.',
        origin: 'Hawaiian: kanaka (human/person) + maoli (native/indigenous/true).',
        difficulty: 'intermediate',
        frequency: 'high',
        tags: ['hawaiian', 'people', 'culture', 'identity'],
        source_language: 'hawaiian',
        spelling_variants: ['kanaka', 'kanaka ʻōiwi', 'kanaka oiwi']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'pork hash',
        english: ['steamed pork dumpling', 'local dim sum dumpling', 'siu mai'],
        category: 'food',
        pronunciation: 'pork hash',
        examples: [
            'Grab two manapua and tree pork hash from da bakery.',
            'Dip da pork hash in hot mustard and shoyu, so ono!'
        ],
        usage: 'A Hawaii Chinese-local dim sum classic (siu mai) featuring seasoned ground pork, water chestnuts, and shrimp steamed in an open wonton wrapper.',
        origin: 'Hawaii Chinese-plantation culinary adaptation of Cantonese siu mai (烧卖).',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['food', 'local eats', 'dim sum', 'snack'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'went grad',
        english: ['graduated', 'finished school', 'graduated high school'],
        category: 'expressions',
        pronunciation: 'went grad',
        examples: [
            'What year you went grad?',
            'We wen grad together from McKinley.',
            'His keiki wen grad college on da mainland.'
        ],
        usage: 'The classic Hawaii local milestone question and phrase describing graduating from school, especially high school, which serves as a core local connection in Hawaii.',
        origin: 'Hawaiian Pidgin past-tense preverbal marker "wen/went" + English "grad" (graduate).',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['school', 'expressions', 'everyday', 'milestones'],
        source_language: 'pidgin',
        spelling_variants: ['wen grad']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'kava',
        english: ['traditional Polynesian ceremonial beverage', 'awa root drink'],
        category: 'cultural',
        pronunciation: 'KAH-vah',
        examples: [
            'Come join da kava circle tonight and talk story.',
            'Drinking kava helps you relax and pau hana in peace.'
        ],
        usage: 'A traditional calming beverage prepared from the roots of the kava plant (Piper methysticum), shared across the Pacific and Hawaii during ceremonies and community gatherings.',
        origin: 'Polynesian / Hawaiian (ʻawa).',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['cultural', 'polynesian', 'tradition', 'gatherings'],
        source_language: 'hawaiian',
        spelling_variants: ['ʻawa', 'awa']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'makahiki',
        english: ['ancient Hawaiian New Year festival', 'season of peace and harvest', 'year'],
        category: 'cultural',
        pronunciation: 'mah-kah-HEE-kee',
        examples: [
            'During Makahiki season, warfare was forbidden across da islands.',
            'Hauʻoli Makahiki Hou means Happy New Year!'
        ],
        usage: 'The ancient Hawaiian harvest festival and new year season dedicated to Lono, god of agriculture and fertility, marked by games, sports, feasts, and peace.',
        origin: 'Hawaiian: makahiki (year, season, annual festival).',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['cultural', 'history', 'celebration', 'hawaiian'],
        source_language: 'hawaiian',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'beach boy',
        english: ['Waikiki surfing instructor', 'waterman ambassador', 'surf guide'],
        category: 'people',
        pronunciation: 'beach boy',
        examples: [
            'Uncle was one Waikiki beach boy from small kid time.',
            'Da beach boys know how fo read every single wave.'
        ],
        usage: 'The legendary watermen and surf instructors of Waikiki who helped popularize surfing worldwide while serving as ambassadors of aloha.',
        origin: 'Hawaii coastal surf culture.',
        difficulty: 'beginner',
        frequency: 'medium',
        tags: ['people', 'surfing', 'ocean', 'waikiki'],
        source_language: 'pidgin',
        spelling_variants: ['beach boys']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'holokū',
        english: ['traditional formal Hawaiian gown', 'floor-length dress with train'],
        category: 'cultural',
        pronunciation: 'hoh-loh-KOO',
        examples: [
            'Tutu wore her velvet holokū for da May Day pageant.',
            'Da singer looked stunning in her silk holokū.'
        ],
        usage: 'An elegant, formal, floor-length Hawaiian gown with a train, adapted in the 19th century from missionary dresses into a dignified symbol of Hawaiian royalty and modern formal attire.',
        origin: 'Hawaiian: holokū.',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['cultural', 'fashion', 'tradition', 'pageants'],
        source_language: 'hawaiian',
        spelling_variants: ['holoku']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'nuff said',
        english: ['say no more', 'enough said', 'completely agreed', 'understood'],
        category: 'expressions',
        pronunciation: 'nuff sed',
        examples: [
            'Free food and live music? Nuff said, I stay dea!',
            'Nuff said brah, pack your gear and we go.'
        ],
        usage: 'Everyday colloquial phrase indicating immediate agreement and that no further explanation or convincing is necessary.',
        origin: 'Pidgin contraction of English "enough said".',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['expressions', 'slang', 'agreement', 'everyday'],
        source_language: 'pidgin',
        spelling_variants: ["'nuff said"]
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'jah den',
        english: ['alright then', 'see you later', 'until then', 'that is that'],
        category: 'greetings',
        pronunciation: 'jah den',
        examples: [
            'Shoots, I see you tomorrow, jah den!',
            'Jah den brah, take care!'
        ],
        usage: 'A casual Pidgin farewell and parting expression meaning "alright then" or "see you then".',
        origin: 'Hawaiian Pidgin contraction of "just then" or "alright then".',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['greetings', 'parting', 'farewell', 'slang'],
        source_language: 'pidgin',
        spelling_variants: ['den jah']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'ay koodish',
        english: ['exclamation of shock', 'oh no', 'good grief', 'yikes'],
        category: 'expressions',
        pronunciation: 'eye koo-DEESH',
        examples: [
            'Ay koodish! How come da tyre stay flat?',
            'Ay koodish, look at da long line!'
        ],
        usage: 'Plantation-era island exclamation expressing disbelief, shock, surprise, or distress.',
        origin: 'Hawaii plantation multicultural loanword.',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['expressions', 'slang', 'shock', 'plantation'],
        source_language: 'pidgin',
        spelling_variants: ['ay kudeesh', 'ay koodeesh', 'cu dish']
    }
];

async function applyMigration() {
    console.log('🚀 Applying Migration 040...');

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

    // 2. Update existing entries with spelling variants
    const variantUpdates = [
        { pidgin: 'you da man', variants: ['you the man', 'you are the man'] },
        { pidgin: 'aole pilikia', variants: ["a'ole pilikoa", "a'ole pilikia", 'aole pilikoa'] },
        { pidgin: 'grindz', variants: ['grinding'] },
        { pidgin: 'chotto', variants: ['chote'] }
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
        'kanaka maoli', 'pork hash', 'went grad', 'kava', 'makahiki',
        'beach boy', 'holoku', 'nuff said', 'jah den', 'ay koodish',
        'ay kudeesh', 'ay koodeesh', 'cu dish', 'you the man', 'you are the man',
        "a'ole pilikoa", 'chote', 'grinding', 'enough said'
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
        'hog cheese', 'payd', 'hake', 'youre acting odd', 'slow down', 'bawce',
        'me ke', 'pilua', 'pka', 'hartha', 'manerve', 'koliana', 'hugu',
        'gaesekki', 'sponga', 'sponging', 'ki ki', 'kiki', 'squorleh',
        'what you want', 'okoa', 'odamot', 'love you', 'bobola', 'bestes',
        'olos', 'wow wee', 'oww wee', 'kea da pooa', 'higu', 'onu onu',
        'scrub', 'podafee', 'sexy', 'boonies', 'big head', 'shion',
        'haput', 'bomba', 'hulimaka', 'friends gathering', 'family gathering',
        'mamby', 'namby', 'gromet', 'irrants', 'ballbaranz', 'way to go',
        'kee kee', 'kei kei', 'bo hi', 'pooa', 'kuky', 'sups', 'motto bravery',
        'mish', 'knowitall', 'toko', 'cheerah', 'squirleh', 'have fun',
        'hafun', 'old woman', 'give up', 'macho bravery', 'know it all',
        'all good', 'akamia', 'maho', 'supah', 'rodgs', 'rodga', 'malimi',
        'woteveah', 'wotevah', 'havefun', 'piliko', 'chiro', 'bad attitude',
        'yowns', 'youowns', 'maka like', 'you owns', 'cheo', 'patai',
        'helmen', 'gunner', 'deleic', 'delico', 'barefoot', 'barefeet',
        'hawaiian zip bag', 'balawau', 'puni', 'not knowing something',
        'wailua da mouth', 'jag up', 'kulu', 'tane', 'take your time',
        'jagged', 'jags', 'waddu', 'no play today', 'loser', 'havfun',
        'tap out', 'magu', 'lazy no work', 'misi', 'gaufunit', 'are you okay?',
        'jaloke', 'hulo', 'mahoe', 'shut up', 'widdout', 'no bring',
        'vlkid', 'vkid', 'vikid', 'villkid', 'village kid', 'villagekid',
        'gaff', "fo'evah", 'pidu', 'i got you', "i've got your back",
        'kadai', 'ai soon', 'being smart', 'bissha', 'pussha', 'pissha',
        'sassy', 'dummeh', 'dinkey', 'tuy', 'hujangus', 'hfun', 'uji',
        'whip um kealoha', 'choke timez', 'spaz', 'hamo', 'kanpang', 'kampung',
        'moog', 'campung', 'tarantaran', 'bulls testicles', 'taran taran',
        'yors', 'lumpai', 'kaka', 'me hao', 'failky', 'fun time', 'shuna',
        'suna', 'shoona', 'pahine', 'poke squid', 'halanka', 'kudica',
        'kudiyab', 'sounds cute dat one', 'hope all is well', 'stay well',
        'astin', 'astine', 'numbah', 'boal', 'bola', 'dang', 'hana you',
        'gadut', 'tidda', 'himel', 'tutmary', 'tuntamary', 'so nah nah',
        'loniele', 'loloniele', 'clueless', 'tunta mary', 'scammer',
        'barenz', 'chik', 'dagah', 'wipe out', 'fat guy', 'paias', 'houi',
        'sniffy', 'burato', 'borato', 'baora', 'barato', 'calm down',
        'ay koof', 'good time', 'ebi', 'stay put', 'no like work', 'oshade',
        'screamah', 'koki', 'oldma', 'nem', 'o shade', 'o’shade', 'lbu',
        'pii', 'bolla', 'stay out', 'rottin', 'tede', 'milimili', 'ibu',
        'main land', 'maga', 'tih', 'ventah', 'big guy', 'dat true',
        'stay plenty', 'tight', 'imaway', 'jemo', 'kahonees', 'stinker',
        'mai komo', 'kanakasorr', 'tete'
    ];

    const { error: ignoreErr } = await supabase
        .from('search_gaps')
        .update({ status: 'ignored' })
        .eq('status', 'pending')
        .in('term', ignoredTerms);

    if (ignoreErr) {
        console.warn('⚠️ Could not update search_gaps to ignored:', ignoreErr.message);
    } else {
        console.log(`✅ Marked ${ignoredTerms.length} noise search gaps as 'ignored'`);
    }

    console.log('🎉 Migration 040 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
