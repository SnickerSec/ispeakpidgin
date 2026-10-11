#!/usr/bin/env node

/**
 * Apply Migration 039 to Supabase
 * Ingests 25 curated island slang, cuisine, and cultural terms:
 *   - loco moco, lomi salmon, squid luau, mochi, poi dog, pupu platter
 *   - mo' bettah, chotto matte, kachi kachi, bagasu, botan, totus
 *   - no make lolo, choke traffic, puka shell, shaka brah, puʻuwai
 *   - stink, kalua pig, mahalo plenty, bettah, daikon legs
 *   - maui no ka oi, on da lo lo yo, me ka mahalo
 * And updates broke da mouth with spelling variants (broke mouth, broke mouf).
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
        pidgin: 'loco moco',
        english: ['local rice dish with hamburger patty, egg, and gravy', 'Hawaiian comfort food dish'],
        category: 'food',
        pronunciation: 'LOH-koh MOH-koh',
        examples: [
            'Ho, I stay starving, we go get one loco moco from da diner.',
            'Two scoop rice and extra gravy on top da loco moco.'
        ],
        usage: 'A staple Hawaii diner comfort dish composed of a bowl of hot white rice topped with a hamburger patty, a sunny-side-up fried egg, and rich brown gravy.',
        origin: 'Hawaii local diner creation (Hilo, 1949)',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['food', 'diner', 'comfort food', 'local eats'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'lomi salmon',
        english: ['salted salmon side dish with tomatoes and onions', 'traditional Hawaiian luau side dish'],
        category: 'food',
        pronunciation: 'LOH-mee SAH-mun',
        examples: [
            'No forget da lomi salmon for da luau plate.',
            'Lomi salmon taste so ono wit poi and kalua pork.'
        ],
        usage: 'A classic Hawaiian side dish made with diced salted salmon, ripe crushed tomatoes, sweet Maui onions, and crushed ice.',
        origin: 'Hawaiian (lomi = massage or mix by hand)',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['food', 'luau', 'traditional', 'local eats'],
        source_language: 'hawaiian',
        spelling_variants: ['lomi lomi salmon', 'lomilomi salmon']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'squid luau',
        english: ['octopus or squid simmered in taro leaves and coconut milk', 'traditional Hawaiian stew'],
        category: 'food',
        pronunciation: 'SKWID LOO-ow',
        examples: [
            'My tutu make da best squid luau on da island.',
            'Squid luau stay rich and sweet from da coconut milk.'
        ],
        usage: 'A cherished traditional Hawaiian stew prepared by slow-cooking tender octopus or squid with young luau (taro) leaves, coconut milk, and sea salt.',
        origin: 'Hawaiian traditional cuisine',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['food', 'traditional', 'luau', 'seafood'],
        source_language: 'hawaiian',
        spelling_variants: ['squid lūʻau']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'mochi',
        english: ['sweet chewy rice cake', 'local Japanese dessert'],
        category: 'food',
        pronunciation: 'MOH-chee',
        examples: [
            'Aunty brought fresh butter mochi to da potluck.',
            'Dis strawberry mochi stay broke da mouth.'
        ],
        usage: 'A chewy, sweet, glutinous rice cake that is a beloved dessert across Hawaii, appearing in variations like butter mochi, chi chi dango, and strawberry mochi.',
        origin: 'Japanese loanword',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['food', 'dessert', 'japanese', 'baking'],
        source_language: 'japanese',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'poi dog',
        english: ['mixed breed dog', 'local island mutt'],
        category: 'slang',
        pronunciation: 'POY DAWG',
        examples: [
            'My dog is one rescue poi dog, smart as anything.',
            'He got one loyal poi dog dat follow him everywhere.'
        ],
        usage: 'A friendly local slang term for a mixed-breed dog, or affectionately for someone of mixed heritage / multicultural background.',
        origin: 'Hawaiian-English hybrid',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['slang', 'animals', 'pets', 'local identity'],
        source_language: 'hawaiian',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'pupu platter',
        english: ['appetizer assortment plate', 'party starter dish'],
        category: 'food',
        pronunciation: 'POO-poo PLAT-tah',
        examples: [
            'Order da pupu platter while we wait for da main food.',
            'Da pupu platter get lumpia, chicken wings, and edamame.'
        ],
        usage: 'A large platter of mixed appetizers and finger foods served at parties, pau hana gatherings, and local diners.',
        origin: 'Hawaiian-English hybrid (pūpū = appetizer/snack)',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['food', 'pupu', 'parties', 'gatherings'],
        source_language: 'hawaiian',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: "mo' bettah",
        english: ['much better', 'far superior', 'preferable'],
        category: 'slang',
        pronunciation: 'MOH BEH-tah',
        examples: [
            'Going early morning is mo bettah, no get traffic.',
            'Homemade poke stay mo bettah than store-bought.'
        ],
        usage: 'The essential Pidgin comparative meaning "much better", "superior", or "way more enjoyable".',
        origin: 'Pidgin comparative construction',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['slang', 'grammar', 'expressions', 'everyday'],
        source_language: 'pidgin',
        spelling_variants: ['mo bettah']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'chotto matte',
        english: ['wait a minute', 'hold on', 'hold your horses'],
        category: 'slang',
        pronunciation: 'CHOH-toh MAH-teh',
        examples: [
            'Chotto matte brah, I still tying my shoes.',
            'Chotto matte, lemme check da directions first.'
        ],
        usage: 'A common loan phrase used in Hawaii conversation to tell someone to pause, slow down, or wait a second.',
        origin: 'Japanese loanword',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['slang', 'japanese', 'expressions', 'time'],
        source_language: 'japanese',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'kachi kachi',
        english: ['Puerto Rican dance music in Hawaii', 'upbeat island accordion music'],
        category: 'general',
        pronunciation: 'KAH-chee KAH-chee',
        examples: [
            'Dey playing kachi kachi music at da graduation party!',
            'Everyone was dancing to da kachi kachi band.'
        ],
        usage: 'A lively genre of Puerto Rican dance music created by immigrants to Hawaii plantations, characterized by accordion, cuatro, and guiro rhythm.',
        origin: 'Puerto Rican plantation culture in Hawaii',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['music', 'culture', 'puerto rican', 'parties'],
        source_language: 'pidgin',
        spelling_variants: ['kachikachi']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'bagasu',
        english: ['useless residue', 'worthless person', 'scoundrel'],
        category: 'slang',
        pronunciation: 'bah-GAH-soo',
        examples: [
            'Dat guy acting like real bagasu.',
            'Clean up all dat bagasu from da yard.'
        ],
        usage: 'Originally sugarcane fiber waste; colloquially used in local plantation slang as a playful or biting term for a rascal or good-for-nothing.',
        origin: 'Ilocano and plantation Spanish/Portuguese (bagasse)',
        difficulty: 'advanced',
        frequency: 'low',
        tags: ['slang', 'insults', 'plantation', 'vintage'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'botan',
        english: ['button', 'snap fastener'],
        category: 'slang',
        pronunciation: 'boh-TAHN',
        examples: [
            'Push da botan for open da gate.',
            'Your shirt missing one botan, brah.'
        ],
        usage: 'A button on clothing, or a button on an electronic switch/device.',
        origin: 'Japanese loanword (botan / ボタン)',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['slang', 'japanese', 'everyday', 'objects'],
        source_language: 'japanese',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'totus',
        english: ['fart', 'flatulence'],
        category: 'slang',
        pronunciation: 'TOH-toos',
        examples: [
            'Who wen make totus in da car?!',
            'Crack da window, someone wen make totus.'
        ],
        usage: 'Plantation-era slang word for breaking wind or flatulence.',
        origin: 'Portuguese plantation loanword',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['slang', 'humor', 'plantation', 'body'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'no make lolo',
        english: ['do not act foolish', 'do not make a fool of yourself'],
        category: 'slang',
        pronunciation: 'NOH MAYK LOH-loh',
        examples: [
            'Behave in front da kumu, no make lolo.',
            'No make lolo on camera, brah!'
        ],
        usage: 'Admonition instructing someone to behave with common sense and stop acting crazy or stupid.',
        origin: 'Pidgin idiom with Hawaiian lōlō (crazy/foolish)',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['slang', 'idioms', 'advice', 'behavior'],
        source_language: 'hawaiian',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'choke traffic',
        english: ['heavy traffic', 'bumper to bumper gridlock'],
        category: 'slang',
        pronunciation: 'CHOHK TRAF-fik',
        examples: [
            'H-1 get choke traffic right now, take da back road.',
            'We was late because had choke traffic going town-bound.'
        ],
        usage: 'Severe highway or island road congestion where cars are packed tightly bumper-to-bumper.',
        origin: 'Pidgin idiom (choke = abundant/crowded)',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['slang', 'travel', 'driving', 'everyday'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'puka shell',
        english: ['naturally perforated cone shell necklace', 'traditional shell jewelry'],
        category: 'general',
        pronunciation: 'POO-kah SHELL',
        examples: [
            'He wearing his vintage puka shell necklace.',
            'We went hunting for puka shells along da shoreline.'
        ],
        usage: 'A traditional beach necklace or jewelry item made from the worn, naturally holed tip of cone shells found along Hawaiian shorelines.',
        origin: 'Hawaiian-English hybrid (puka = hole)',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['beach', 'fashion', 'jewelry', 'ocean'],
        source_language: 'hawaiian',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'shaka brah',
        english: ['island greeting accompanied by shaka sign', 'hang loose friend'],
        category: 'greetings',
        pronunciation: 'SHAH-kah BRAH',
        examples: [
            'Shaka brah, good for see you!',
            'Threw him one big shaka brah when he let us merge.'
        ],
        usage: 'The quintessential friendly Hawaii greeting and hand gesture expressing goodwill, friendliness, and solidarity.',
        origin: 'Pidgin colloquialism',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['greetings', 'shaka', 'aloha', 'slang'],
        source_language: 'pidgin',
        spelling_variants: ['shaka braddah', 'shaka bruddah']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'puʻuwai',
        english: ['heart', 'affection', 'feelings'],
        category: 'cultural',
        pronunciation: 'poo-oo-WYE',
        examples: [
            'From da bottom of my puʻuwai, mahalo nui loa.',
            'Uncle get one big puʻuwai, always taking care da family.',
            'Listen to your puʻuwai when you need for choose da right path.'
        ],
        usage: 'Heart, feelings, affection, or moral character. Commonly used in Hawaiian and local expressions of sincerity, aloha, and heartfelt emotion.',
        origin: 'Hawaiian (puʻu = heart/mound, wai = water/vital fluid)',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['hawaiian', 'cultural', 'heart', 'feelings', 'aloha'],
        source_language: 'hawaiian',
        spelling_variants: ['puuwai']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'stink',
        english: ['mean', 'rude', 'nasty', 'in a bad mood'],
        category: 'slang',
        pronunciation: 'STINK',
        examples: [
            'How come you acting so stink to me?',
            'No be stink, share da musubi wit your sistah.',
            'He get one stink attitude today, no talk to him.'
        ],
        usage: 'As an adjective, stink describes a bad attitude, not a bad smell: someone acting stink is being mean or rude. It also shows up in stink face (a scowl), alongside stink eye and talk stink.',
        origin: 'From English "stink", extended in Pidgin from a bad smell to a bad attitude.',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['slang', 'attitude', 'english'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'kalua pig',
        english: ['pork slow-cooked in an underground oven', 'smoky shredded pork'],
        category: 'food',
        pronunciation: 'kah-LOO-ah pig',
        examples: [
            'Get kalua pig and cabbage at da plate lunch place.',
            'Uncle wen dig da imu fo\' da kalua pig.',
            'Fo\' da baby lūʻau get kalua pig, lomi salmon, and poi.'
        ],
        usage: 'A whole pig cooked in an imu (underground oven) until smoky and tender, then shredded; a lūʻau staple. At home and in plate lunches it is usually made in an oven or slow cooker with Hawaiian salt. Also called kalua pork.',
        origin: 'Hawaiian kālua, to bake in an imu (underground oven).',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['food', 'hawaiian', 'luau'],
        source_language: 'hawaiian',
        spelling_variants: ['kalua pork', 'kālua pig', 'kālua pork']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'mahalo plenty',
        english: ['thank you very much', 'thanks a lot'],
        category: 'greetings',
        pronunciation: 'mah-HAH-loh PLEN-tee',
        examples: [
            'Mahalo plenty fo\' da ride, cuz!',
            'Aunty, mahalo plenty fo\' da food.',
            'Mahalo plenty, brah, you saved me.'
        ],
        usage: 'A Pidgin way to say thanks a lot: Hawaiian mahalo plus English plenty (a lot). More casual than mahalo nui loa.',
        origin: 'Hawaiian mahalo (thanks) with English plenty.',
        difficulty: 'beginner',
        frequency: 'medium',
        tags: ['greetings', 'gratitude', 'hawaiian'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'bettah',
        english: ['better', 'you had better'],
        category: 'slang',
        pronunciation: 'BET-tah',
        examples: [
            'Bettah you go now before da traffic.',
            'Dis one bettah, try taste.',
            'You feeling bettah today?'
        ],
        usage: 'Pidgin pronunciation of "better": the final -er becomes -ah, as in braddah and sistah. At the start of a sentence it means "you had better" (Bettah you go now). Best known in mo\' bettah.',
        origin: 'English "better" with the Pidgin -ah ending.',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['slang', 'english'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'daikon legs',
        english: ['thick legs', 'stocky legs'],
        category: 'slang',
        pronunciation: 'DYE-kohn legs',
        examples: [
            'Ho, dat soccer player get daikon legs, strong!',
            'She wen tease me \'cause I get daikon legs.',
            'All da hiking wen give me daikon legs.'
        ],
        usage: 'Teasing description of thick, sturdy legs, likened to a daikon radish. Playful between friends, but it is a jab about someone\'s body, so know your audience.',
        origin: 'From Japanese daikon-ashi (radish legs), brought by Japanese immigrants to Hawaii.',
        difficulty: 'intermediate',
        frequency: 'medium',
        tags: ['slang', 'japanese', 'body'],
        source_language: 'pidgin',
        spelling_variants: []
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'maui no ka oi',
        english: ['Maui is the best', 'Maui is number one'],
        category: 'expressions',
        pronunciation: 'MOW-ee noh kah OY',
        examples: [
            'No matta where you go, Maui no ka oi, brah.',
            'Ho, dat sunset from Haleakala proves Maui no ka oi.',
            'Chee-hoo! Maui no ka oi all day!'
        ],
        usage: 'Famous island phrase and motto celebrating Maui island pride: "Maui is the best" or "Maui is top of the line". Frequently seen on island bumper stickers, shirts, and signs.',
        origin: 'Hawaiian: Maui + nō (indeed) + ka (the) + ʻoi (best/superior).',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['expressions', 'pride', 'island', 'maui', 'hawaiian'],
        source_language: 'hawaiian',
        spelling_variants: ['maui no ka \'oi', 'maui nō ka ʻoi']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'on da lo lo yo',
        english: ['on the down-low', 'secretly', 'quietly', 'under the radar'],
        category: 'slang',
        pronunciation: 'on dah LOH LOH YOH',
        examples: [
            'Keep dis news on da lo lo yo, no tell nobody yet.',
            'We stay planning one surprise party, so stay on da lo lo yo.',
            'Brah, dat deal went down on da lo lo yo.'
        ],
        usage: 'Island Pidgin expression meaning to keep something confidential, secret, or discreet ("on the down-low"). Used when telling someone not to broadcast sensitive news or gossip.',
        origin: 'Blend of English "on the down-low" / "low-low" with Pidgin rhythm and rhyming marker "yo".',
        difficulty: 'intermediate',
        frequency: 'high',
        tags: ['slang', 'secrets', 'discreet', 'expressions'],
        source_language: 'pidgin',
        spelling_variants: ['on da low low', 'on da low low yo', 'on da lolo yo', 'on da loloyo']
    },
    {
        id: crypto.randomUUID(),
        pidgin: 'me ka mahalo',
        english: ['with gratitude', 'with thanks', 'warm regards', 'sincerely'],
        category: 'greetings',
        pronunciation: 'may kah mah-HAH-loh',
        examples: [
            'Me ka mahalo for your kokua and support.',
            'He wen sign da letter \'Me ka mahalo, Uncle Kimo.\'',
            'Me ka mahalo nui loa to all our volunteers today.'
        ],
        usage: 'Traditional and formal Hawaiian letter or email sign-off meaning "with gratitude" or "with thanks". Commonly seen as a closing valediction in local correspondence, formal messages, and community announcements.',
        origin: 'Hawaiian: me (with) + ka (the) + mahalo (gratitude/thanks).',
        difficulty: 'beginner',
        frequency: 'high',
        tags: ['greetings', 'valediction', 'formal', 'hawaiian', 'gratitude'],
        source_language: 'hawaiian',
        spelling_variants: ['me ka mahalo nui', 'me ka mahalo nui loa']
    }
];

async function applyMigration() {
    console.log('🚀 Applying Migration 039...');

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
    const { data: brokeDaMouth } = await supabase
        .from('dictionary_entries')
        .select('id, pidgin, spelling_variants')
        .eq('pidgin', 'broke da mouth')
        .maybeSingle();

    if (brokeDaMouth) {
        const currentVariants = brokeDaMouth.spelling_variants || [];
        const mergedVariants = Array.from(new Set([...currentVariants, 'broke mouth', 'broke mouf']));
        const { error: updateErr } = await supabase
            .from('dictionary_entries')
            .update({
                spelling_variants: mergedVariants,
                updated_at: new Date().toISOString()
            })
            .eq('id', brokeDaMouth.id);

        if (updateErr) {
            console.error(`❌ Failed to update "broke da mouth" variants:`, updateErr.message);
        } else {
            console.log(`✅ Updated "broke da mouth" with variants:`, mergedVariants);
        }
    }

    console.log('🎉 Migration 039 applied successfully!');
}

applyMigration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
