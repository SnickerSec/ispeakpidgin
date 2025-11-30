#!/usr/bin/env node

/**
 * Migrate Games Data to Supabase
 * Wordle words, Crossword puzzles, and Pickup Line Components
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
    console.log('\nRun: SUPABASE_SERVICE_KEY="your-key" node tools/migrate-games-to-supabase.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// WORDLE DATA
// ============================================

// 96 authentic Pidgin solutions
const wordleSolutions = [
    'ANOAI', 'AUANA', 'AIYAH', 'AIKEA', 'AISUS', 'AKULE', 'ALOHA', 'AMPED', 'ANDEN', 'AUNTY',
    'BACHI', 'BENTO', 'BOCHA', 'BOROT', 'BULAI', 'CHANG', 'CHOKE', 'CRASH', 'DABES', 'FOWAT',
    'FOSHO', 'GANJA', 'GETUM', 'GRIND', 'HABUT', 'HAKAK', 'HALAU', 'HANAI', 'HANAU', 'HAOLE',
    'HAPAI', 'HAUNA', 'HEIAU', 'HONAH', 'ILIKE', 'IRRAZ', 'IYKYK', 'JAMUP', 'JOOSE', 'JUNKS',
    'KALUA', 'KAPUT', 'KEIKI', 'KOKUA', 'KUKAE', 'KUKUI', 'LANAI', 'LEHUA', 'MAILE', 'MAKAI',
    'MAUKA', 'MAUNA', 'MENTO', 'NAILS', 'NIELE', 'NOACK', 'NOCAN', 'OBAKE', 'OHANA', 'OKOLE',
    'OPALA', 'OPIHI', 'PANTY', 'PILAU', 'RAJAH', 'SCRAP', 'SHAME', 'TANKS', 'WAKEA', 'SCOSH',
    'NOLIE', 'UNCLE', 'KPUNA', 'LIDAT', 'SOLID', 'KATSU', 'SHOYU', 'SHAKA', 'GOING', 'SCRAM',
    'BROKE', 'DIRTY', 'SALTY', 'STOUT', 'KLOLO', 'PHAKU', 'BENJO', 'GOHAN', 'ZORIS', 'PINAY',
    'PINOY', 'SARAP', 'BANGO', 'GECKO', 'GUAVA', 'NOACT'
];

// Valid guesses (includes solutions + common English)
const validGuessesOnly = [
    'ABOUT', 'ABOVE', 'AFTER', 'AGAIN', 'ALONG', 'APPLE', 'BREAD', 'BREAK', 'BRING', 'BUILD',
    'CAUSE', 'CHAIR', 'CHEAP', 'CLEAN', 'CLEAR', 'CLOSE', 'COMES', 'COULD', 'COUNT', 'DADDY',
    'DANCE', 'DOING', 'DRINK', 'DRIVE', 'EARLY', 'EARTH', 'EIGHT', 'ENJOY', 'ENTER', 'ERROR',
    'EVERY', 'FIGHT', 'FIRST', 'FLOOR', 'FORCE', 'FORTH', 'FOUND', 'FRESH', 'FRONT', 'FRUIT',
    'FUNNY', 'GIVEN', 'GLASS', 'GONNA', 'GREAT', 'GREEN', 'GROUP', 'GUESS', 'HAPPY', 'HEART',
    'HEAVY', 'HELLO', 'HENCE', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'IDEAS', 'IMAGE', 'ISSUE',
    'ITEMS', 'JUDGE', 'KNOWS', 'LARGE', 'LATER', 'LAUGH', 'LEARN', 'LEAST', 'LEAVE', 'LEGAL',
    'LEMON', 'LEVEL', 'LIGHT', 'LIVED', 'LOOKS', 'LOOSE', 'LOVED', 'LOWER', 'LUCKY', 'LUNCH',
    'MAJOR', 'MATCH', 'MAYBE', 'MEANS', 'MEDIA', 'MIGHT', 'MINOR', 'MONEY', 'MONTH', 'MORAL',
    'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NEEDS', 'NEVER', 'NIGHT', 'NOISE', 'NORTH', 'NOTED',
    'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'ORDER', 'OTHER', 'OUGHT', 'PAINT',
    'PANEL', 'PAPER', 'PARTY', 'PEACE', 'PHASE', 'PHONE', 'PHOTO', 'PIECE', 'PLACE', 'PLAIN',
    'PLANE', 'PLANT', 'PLATE', 'POINT', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME',
    'PRINT', 'PRIOR', 'PROOF', 'PROUD', 'PROVE', 'QUEEN', 'QUICK', 'QUIET', 'QUITE', 'RADIO',
    'RAISE', 'RANGE', 'RAPID', 'RATIO', 'REACH', 'READY', 'REFER', 'RIGHT', 'RIVER', 'ROUND',
    'ROUTE', 'ROYAL', 'RURAL', 'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SENSE', 'SERVE', 'SEVEN',
    'SHALL', 'SHAPE', 'SHARE', 'SHARP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT',
    'SHOCK', 'SHORE', 'SHORT', 'SHOWN', 'SIGHT', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED', 'SKILL',
    'SLEEP', 'SLIDE', 'SMALL', 'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SOLVE', 'SORRY', 'SOUND',
    'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT', 'SPOKE', 'SPORT',
    'STAFF', 'STAGE', 'STAKE', 'STAND', 'START', 'STATE', 'STEAM', 'STEEL', 'STICK', 'STILL',
    'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY', 'STUFF',
    'STYLE', 'SUGAR', 'SUITE', 'SUPER', 'SWEET', 'TABLE', 'TAKEN', 'TASTE', 'TAXES', 'TEACH',
    'TEETH', 'TERRY', 'TEXAS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK',
    'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW', 'TIGHT', 'TIMES', 'TITLE',
    'TODAY', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIN', 'TREAT',
    'TREND', 'TRIAL', 'TRIED', 'TRIES', 'TRUCK', 'TRULY', 'TRUST', 'TRUTH', 'TWICE', 'UNDER',
    'UNDUE', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALID',
    'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOCAL', 'VOICE', 'WASTE', 'WATCH', 'WATER',
    'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN', 'WORLD',
    'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND', 'WRITE', 'WRONG', 'WROTE', 'YIELD',
    'YOUNG', 'YOURS', 'YOUTH'
];

// ============================================
// CROSSWORD PUZZLES
// ============================================

const crosswordPuzzles = [
    {
        puzzle_id: 'puzzle1',
        title: 'Local Grindz',
        description: 'All about Hawaiian food!',
        theme: 'food',
        difficulty: 'beginner',
        grid_size: { rows: 5, cols: 7 },
        grid: [
            ['P', 'O', 'K', 'E', ' ', ' ', ' '],
            ['O', ' ', ' ', ' ', ' ', ' ', ' '],
            ['I', ' ', 'M', 'U', 'S', 'U', 'B'],
            [' ', ' ', 'A', ' ', ' ', ' ', ' '],
            [' ', ' ', 'H', 'I', ' ', ' ', ' ']
        ],
        words_across: [
            { number: 1, row: 0, col: 0, word: 'POKE', clue: 'Raw fish salad, local favorite' },
            { number: 3, row: 2, col: 2, word: 'MUSUBI', clue: 'Spam and rice snack' },
            { number: 4, row: 4, col: 2, word: 'HI', clue: 'Slang for "high" or elevated' }
        ],
        words_down: [
            { number: 1, row: 0, col: 0, word: 'POI', clue: 'Taro paste, staple food' },
            { number: 2, row: 2, col: 2, word: 'MAHI', clue: 'Type of fish (dolphin fish)' }
        ]
    },
    {
        puzzle_id: 'puzzle2',
        title: 'Talk Story',
        description: 'Common greetings and expressions',
        theme: 'greetings',
        difficulty: 'beginner',
        grid_size: { rows: 7, cols: 7 },
        grid: null,
        words_across: [
            { number: 1, row: 0, col: 0, word: 'ALOHA', clue: 'Hello or goodbye' },
            { number: 4, row: 2, col: 0, word: 'HOWZIT', clue: 'How are you?' },
            { number: 6, row: 4, col: 0, word: 'MAHALO', clue: 'Thank you' },
            { number: 8, row: 6, col: 0, word: 'SHAKA', clue: 'Hang loose hand sign' }
        ],
        words_down: [
            { number: 1, row: 0, col: 0, word: 'AKAMAI', clue: 'Smart, clever' },
            { number: 3, row: 0, col: 4, word: 'HANA', clue: 'Work' }
        ]
    }
];

// ============================================
// PICKUP LINE COMPONENTS
// ============================================

const pickupLineComponents = [
    // Openers
    { component_type: 'opener', pidgin: 'Eh, listen', pronunciation: 'EH, LIS-sen' },
    { component_type: 'opener', pidgin: 'Ho, wow', pronunciation: 'HO, wow' },
    { component_type: 'opener', pidgin: 'Check it', pronunciation: 'check IT' },
    { component_type: 'opener', pidgin: 'Brah, fo real', pronunciation: 'BRAH, foh REE-al' },
    { component_type: 'opener', pidgin: 'Sistah, check dis out', pronunciation: 'SIS-tah, check DIS out' },
    { component_type: 'opener', pidgin: 'No joke', pronunciation: 'no JOKE' },
    { component_type: 'opener', pidgin: 'Shoots, I gotta tell you', pronunciation: 'SHOOTS, I GAH-tah tell you' },
    { component_type: 'opener', pidgin: 'Eh, you know wat', pronunciation: 'EH, you know WAHT' },
    { component_type: 'opener', pidgin: 'Ho brah', pronunciation: 'HO BRAH' },
    { component_type: 'opener', pidgin: 'Auwe', pronunciation: 'ow-WEH' },
    { component_type: 'opener', pidgin: 'Rajah dat', pronunciation: 'RAH-jah DAHT' },
    { component_type: 'opener', pidgin: 'Bumbye I tell you', pronunciation: 'BUM-bye I tell you' },

    // Compliments
    { component_type: 'compliment', pidgin: 'you stay look planny good', pronunciation: 'you stay look PLAN-nee good' },
    { component_type: 'compliment', pidgin: 'you da kine person I like know', pronunciation: 'you dah KYNE PER-son I like know' },
    { component_type: 'compliment', pidgin: 'dat smile of yours', pronunciation: 'daht SMILE of yours' },
    { component_type: 'compliment', pidgin: 'you get da most beautiful eyes', pronunciation: 'you get dah most byoo-tee-ful EYES' },
    { component_type: 'compliment', pidgin: 'you stay shine bright', pronunciation: 'you stay SHINE bright' },
    { component_type: 'compliment', pidgin: 'you stay look bettah den shave ice', pronunciation: 'you stay look BET-tah den shave ICE' },
    { component_type: 'compliment', pidgin: 'your vibe stay so ono', pronunciation: 'your VIBE stay so OH-no' },
    { component_type: 'compliment', pidgin: 'da way you walk', pronunciation: 'dah way you WALK' },
    { component_type: 'compliment', pidgin: 'you get dat aloha spirit', pronunciation: 'you get daht ah-LOH-hah SPEER-it' },
    { component_type: 'compliment', pidgin: 'you stay glow like da sunset', pronunciation: 'you stay GLOW like dah SUN-set' },
    { component_type: 'compliment', pidgin: 'you more sweet den haupia', pronunciation: 'you more SWEET den how-PEE-ah' },
    { component_type: 'compliment', pidgin: 'you stay catch my eye', pronunciation: 'you stay CATCH my eye' },

    // Actions
    { component_type: 'action', pidgin: 'get me all choke up', pronunciation: 'get me all CHOKE up' },
    { component_type: 'action', pidgin: 'stay more sweet than shave ice', pronunciation: 'stay more SWEET than shave ICE' },
    { component_type: 'action', pidgin: 'make my slippah fly off', pronunciation: 'make my SLIP-pah fly OFF' },
    { component_type: 'action', pidgin: 'like da best kine plate lunch', pronunciation: 'like dah best KYNE plate LUNCH' },
    { component_type: 'action', pidgin: 'make me like pau hana right now', pronunciation: 'make me like PAU HAH-nah right NOW' },
    { component_type: 'action', pidgin: 'stay bettah den Waikiki sunset', pronunciation: 'stay BET-tah den why-kee-kee SUN-set' },
    { component_type: 'action', pidgin: 'make me like grind all day', pronunciation: 'make me like GRIND all DAY' },
    { component_type: 'action', pidgin: 'stay smoove like butter mochi', pronunciation: 'stay SMOOVE like BU-ter MO-chee' },
    { component_type: 'action', pidgin: 'make my heart stay race', pronunciation: 'make my HEART stay RACE' },
    { component_type: 'action', pidgin: 'could neva get pau looking at you', pronunciation: 'could NEH-vah get PAU LOO-king at you' },
    { component_type: 'action', pidgin: 'stay broke da mouth good', pronunciation: 'stay BROKE dah MOUTH good' },
    { component_type: 'action', pidgin: 'like one fresh malasada', pronunciation: 'like one fresh mah-lah-SAH-dah' },

    // Flavor words
    { component_type: 'flavor', pidgin: 'choke', pronunciation: 'CHOKE', meaning: 'a lot/many' },
    { component_type: 'flavor', pidgin: 'da kine', pronunciation: 'dah KYNE', meaning: 'the thing/whatchamacallit' },
    { component_type: 'flavor', pidgin: 'brah', pronunciation: 'BRAH', meaning: 'brother/friend' },
    { component_type: 'flavor', pidgin: 'sistah', pronunciation: 'SIS-tah', meaning: 'sister/friend' },
    { component_type: 'flavor', pidgin: 'shoots', pronunciation: 'SHOOTS', meaning: 'okay/sounds good' },
    { component_type: 'flavor', pidgin: 'pau', pronunciation: 'PAU', meaning: 'finished/done' },
    { component_type: 'flavor', pidgin: 'grindz', pronunciation: 'GRINDZ', meaning: 'food' },
    { component_type: 'flavor', pidgin: 'ono', pronunciation: 'OH-no', meaning: 'delicious' },
    { component_type: 'flavor', pidgin: 'bumbye', pronunciation: 'BUM-bye', meaning: 'later/eventually' },
    { component_type: 'flavor', pidgin: 'planny', pronunciation: 'PLAN-nee', meaning: 'plenty/a lot' },

    // Complete lines
    { component_type: 'complete', pidgin: 'Eh, you da only kine wave I wanna catch', pronunciation: 'EH, you dah OH-nlee KYNE wave I WAH-nah catch', english: "You're the only wave I want to catch", category: 'ocean' },
    { component_type: 'complete', pidgin: "Ho, if you was one musubi, you'd be da special kine", pronunciation: "HO, if you was one moo-soo-BEE, you'd be dah SPEH-shul KYNE", english: "If you were a musubi, you'd be the special kind", category: 'food' }
];

// ============================================
// MIGRATION FUNCTIONS
// ============================================

async function migrateWordleWords() {
    console.log('\n🎮 Migrating Wordle Words...');

    // Prepare all words
    const allWords = [];

    // Add solutions (can be both solution and valid guess)
    wordleSolutions.forEach(word => {
        allWords.push({
            word: word,
            is_solution: true,
            is_valid_guess: true,
            difficulty: 'medium'
        });
    });

    // Add valid guesses only (not solutions)
    validGuessesOnly.forEach(word => {
        if (!wordleSolutions.includes(word)) {
            allWords.push({
                word: word,
                is_solution: false,
                is_valid_guess: true,
                difficulty: 'easy'
            });
        }
    });

    // Insert in batches
    const batchSize = 100;
    let successCount = 0;

    for (let i = 0; i < allWords.length; i += batchSize) {
        const batch = allWords.slice(i, i + batchSize);
        const { error } = await supabase.from('wordle_words').upsert(batch, {
            onConflict: 'word',
            ignoreDuplicates: true
        });

        if (error) {
            console.error(`   ⚠️ Batch error: ${error.message}`);
        } else {
            successCount += batch.length;
        }
    }

    console.log(`   ✅ Migrated ${successCount} wordle words (${wordleSolutions.length} solutions, ${validGuessesOnly.length} valid guesses)`);
    return successCount;
}

async function migrateCrosswordPuzzles() {
    console.log('\n🧩 Migrating Crossword Puzzles...');

    const { error } = await supabase.from('crossword_puzzles').upsert(crosswordPuzzles, {
        onConflict: 'puzzle_id'
    });

    if (error) {
        console.error('   ❌ Error:', error.message);
        return 0;
    }

    console.log(`   ✅ Migrated ${crosswordPuzzles.length} crossword puzzles`);
    return crosswordPuzzles.length;
}

async function migratePickupLineComponents() {
    console.log('\n💕 Migrating Pickup Line Components...');

    const { error } = await supabase.from('pickup_line_components').insert(pickupLineComponents);

    if (error) {
        console.error('   ❌ Error:', error.message);
        return 0;
    }

    console.log(`   ✅ Migrated ${pickupLineComponents.length} pickup line components`);
    return pickupLineComponents.length;
}

async function showCurrentCounts() {
    console.log('\n📊 Supabase Data Counts:');

    const tables = [
        'dictionary_entries', 'phrases', 'stories', 'crossword_words',
        'pickup_lines', 'quiz_questions', 'wordle_words', 'crossword_puzzles', 'pickup_line_components'
    ];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            if (error.code === '42P01') {
                console.log(`   ${table}: (table not created yet)`);
            } else {
                console.log(`   ${table}: Error - ${error.message}`);
            }
        } else {
            console.log(`   ${table}: ${count} records`);
        }
    }
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('🚀 Migrating Games Data to Supabase...');
    console.log('='.repeat(50));
    console.log('\n⚠️  Make sure you have run the SQL schema first!');
    console.log('   File: tools/supabase-games-schema.sql\n');

    await showCurrentCounts();

    const wordleCount = await migrateWordleWords();
    const puzzleCount = await migrateCrosswordPuzzles();
    const componentCount = await migratePickupLineComponents();

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   🎮 Wordle Words: ${wordleCount}`);
    console.log(`   🧩 Crossword Puzzles: ${puzzleCount}`);
    console.log(`   💕 Pickup Line Components: ${componentCount}`);
    console.log('='.repeat(50));

    await showCurrentCounts();

    console.log('\n✨ Migration complete!');
}

main().catch(console.error);
