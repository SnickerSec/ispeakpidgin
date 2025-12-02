#!/usr/bin/env node
/**
 * Add 10 New Crossword Puzzles
 * Diverse themes covering Hawaiian culture, pidgin, local life
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_KEY not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const puzzles = [
    // Puzzle 21: Beach Life
    {
        puzzle_id: "puzzle21",
        title: "Beach Life",
        description: "Hawaiian beach culture and ocean terms",
        theme: "beach",
        difficulty: "beginner",
        grid_size: { rows: 5, cols: 5 },
        grid: [
            ["S", "H", "A", "K", "A"],
            ["U", " ", " ", " ", " "],
            ["R", " ", "W", "A", "V", "E"],
            ["F", " ", " ", " ", " "],
            [" ", " ", " ", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "SHAKA", answer: "SHAKA", clue: "Iconic Hawaiian hand gesture" },
            { row: 2, col: 2, number: 3, word: "WAVE", answer: "WAVE", clue: "What surfers ride" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "SURF", answer: "SURF", clue: "Ride the waves" }
        ]
    },

    // Puzzle 22: Family Ohana
    {
        puzzle_id: "puzzle22",
        title: "Family Ohana",
        description: "Hawaiian family terms",
        theme: "family",
        difficulty: "beginner",
        grid_size: { rows: 6, cols: 6 },
        grid: [
            ["T", "U", "T", "U", " ", " "],
            ["I", " ", " ", "N", " ", " "],
            ["T", " ", " ", "C", " ", " "],
            ["I", " ", " ", "L", " ", " "],
            [" ", " ", " ", "E", " ", " "],
            [" ", " ", " ", " ", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "TUTU", answer: "TUTU", clue: "Hawaiian word for grandparent" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "TITI", answer: "TITI", clue: "Auntie in local slang" },
            { row: 0, col: 3, number: 2, word: "UNCLE", answer: "UNCLE", clue: "Respectful term for elder man" }
        ]
    },

    // Puzzle 23: Grindz Time
    {
        puzzle_id: "puzzle23",
        title: "Grindz Time",
        description: "More delicious Hawaiian foods",
        theme: "food",
        difficulty: "intermediate",
        grid_size: { rows: 6, cols: 6 },
        grid: [
            ["L", "O", "C", "O", " ", " "],
            ["U", " ", " ", "N", " ", " "],
            ["A", " ", "K", "A", "L", "U", "A"],
            ["U", " ", " ", " ", " ", " "],
            [" ", " ", " ", " ", " ", " "],
            [" ", " ", " ", " ", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "LOCO", answer: "LOCO", clue: "__ moco (rice, burger, egg dish)" },
            { row: 2, col: 2, number: 3, word: "KALUA", answer: "KALUA", clue: "__ pig (traditional Hawaiian BBQ)" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "LUAU", answer: "LUAU", clue: "Traditional Hawaiian feast" },
            { row: 0, col: 3, number: 2, word: "ONO", answer: "ONO", clue: "Delicious in Hawaiian" }
        ]
    },

    // Puzzle 24: Da Pidgin
    {
        puzzle_id: "puzzle24",
        title: "Da Pidgin",
        description: "Common pidgin expressions",
        theme: "pidgin",
        difficulty: "intermediate",
        grid_size: { rows: 5, cols: 7 },
        grid: [
            ["B", "R", "A", "H", " ", " ", " "],
            ["U", " ", " ", "O", " ", " ", " "],
            ["M", " ", " ", "W", "Z", "I", "T"],
            ["B", " ", " ", " ", " ", " ", " "],
            ["Y", " ", " ", " ", " ", " ", " "],
            ["E", " ", " ", " ", " ", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "BRAH", answer: "BRAH", clue: "Brother, friend in pidgin" },
            { row: 2, col: 3, number: 3, word: "WZIT", answer: "WZIT", clue: "How's it? Common greeting" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "BUMBYE", answer: "BUMBYE", clue: "Later, by and by" },
            { row: 0, col: 3, number: 2, word: "HOW", answer: "HOW", clue: "Part of howzit greeting" }
        ]
    },

    // Puzzle 25: Island Nature
    {
        puzzle_id: "puzzle25",
        title: "Island Nature",
        description: "Hawaiian plants and nature",
        theme: "nature",
        difficulty: "beginner",
        grid_size: { rows: 5, cols: 5 },
        grid: [
            ["K", "O", "A", " ", " "],
            ["O", " ", "L", " ", " "],
            ["K", " ", "O", " ", " "],
            ["O", " ", "H", " ", " "],
            [" ", " ", "A", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "KOA", answer: "KOA", clue: "Native Hawaiian hardwood tree" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "KOKO", answer: "KOKO", clue: "Blood in Hawaiian" },
            { row: 0, col: 2, number: 2, word: "ALOHA", answer: "ALOHA", clue: "Hello, goodbye, love" }
        ]
    },

    // Puzzle 26: Street Talk
    {
        puzzle_id: "puzzle26",
        title: "Street Talk",
        description: "Local slang and expressions",
        theme: "slang",
        difficulty: "intermediate",
        grid_size: { rows: 6, cols: 6 },
        grid: [
            ["S", "T", "I", "N", "K", " "],
            ["H", " ", " ", " ", "I", " "],
            ["O", " ", "R", "A", "J", "A", "H"],
            ["O", " ", " ", " ", "E", " "],
            ["T", " ", " ", " ", " ", " "],
            ["S", " ", " ", " ", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "STINK", answer: "STINK", clue: "__ eye (dirty look)" },
            { row: 2, col: 2, number: 3, word: "RAJAH", answer: "RAJAH", clue: "I understand, got it" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "SHOOTS", answer: "SHOOTS", clue: "Okay, sounds good" },
            { row: 0, col: 4, number: 2, word: "KINE", answer: "KINE", clue: "Kind, type (da __)" }
        ]
    },

    // Puzzle 27: Local Spots
    {
        puzzle_id: "puzzle27",
        title: "Local Spots",
        description: "Famous Hawaii places",
        theme: "places",
        difficulty: "intermediate",
        grid_size: { rows: 7, cols: 7 },
        grid: [
            ["M", "A", "U", "K", "A", " ", " "],
            ["A", " ", " ", " ", " ", " ", " "],
            ["K", " ", "O", "A", "H", "U", " "],
            ["A", " ", " ", " ", " ", " ", " "],
            ["I", " ", " ", " ", " ", " ", " "],
            [" ", " ", " ", " ", " ", " ", " "],
            [" ", " ", " ", " ", " ", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "MAUKA", answer: "MAUKA", clue: "Toward the mountains" },
            { row: 2, col: 2, number: 3, word: "OAHU", answer: "OAHU", clue: "The Gathering Place island" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "MAKAI", answer: "MAKAI", clue: "Toward the ocean" }
        ]
    },

    // Puzzle 28: Action Words
    {
        puzzle_id: "puzzle28",
        title: "Action Words",
        description: "Pidgin verbs and actions",
        theme: "verbs",
        difficulty: "beginner",
        grid_size: { rows: 5, cols: 6 },
        grid: [
            ["G", "R", "I", "N", "D", " "],
            ["O", " ", " ", " ", " ", " "],
            [" ", " ", "H", "A", "N", "A"],
            [" ", " ", " ", " ", " ", " "],
            [" ", " ", " ", " ", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "GRIND", answer: "GRIND", clue: "To eat in pidgin" },
            { row: 2, col: 2, number: 3, word: "HANA", answer: "HANA", clue: "Work, do in Hawaiian" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "GO", answer: "GO", clue: "Leave, depart" }
        ]
    },

    // Puzzle 29: Party Time
    {
        puzzle_id: "puzzle29",
        title: "Party Time",
        description: "Celebrations and good times",
        theme: "celebrations",
        difficulty: "beginner",
        grid_size: { rows: 5, cols: 6 },
        grid: [
            ["H", "U", "L", "A", " ", " "],
            ["A", " ", " ", " ", " ", " "],
            ["U", " ", "L", "E", "I", " "],
            [" ", " ", " ", " ", " ", " "],
            [" ", " ", " ", " ", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "HULA", answer: "HULA", clue: "Traditional Hawaiian dance" },
            { row: 2, col: 2, number: 3, word: "LEI", answer: "LEI", clue: "Flower garland necklace" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "HAU", answer: "HAU", clue: "Type of Hawaiian tree" }
        ]
    },

    // Puzzle 30: Weather Talk
    {
        puzzle_id: "puzzle30",
        title: "Weather Talk",
        description: "Hawaii weather and climate words",
        theme: "weather",
        difficulty: "beginner",
        grid_size: { rows: 5, cols: 5 },
        grid: [
            ["T", "R", "A", "D", "E"],
            ["R", " ", " ", " ", " "],
            ["O", " ", "U", "A", " "],
            ["P", " ", " ", " ", " "],
            [" ", " ", " ", " ", " "]
        ],
        words_across: [
            { row: 0, col: 0, number: 1, word: "TRADE", answer: "TRADE", clue: "__ winds (steady ocean breezes)" },
            { row: 2, col: 2, number: 3, word: "UA", answer: "UA", clue: "Rain in Hawaiian" }
        ],
        words_down: [
            { row: 0, col: 0, number: 1, word: "TROP", answer: "TROP", clue: "Short for tropical" }
        ]
    }
];

async function addPuzzles() {
    console.log('🧩 Adding 10 new crossword puzzles...\n');

    const { data, error } = await supabase
        .from('crossword_puzzles')
        .insert(puzzles)
        .select();

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`✅ Added ${data.length} puzzles!`);

    // Show breakdown by theme
    const byTheme = {};
    data.forEach(p => {
        byTheme[p.theme] = (byTheme[p.theme] || 0) + 1;
    });

    console.log('\n📊 Puzzles by theme:');
    Object.entries(byTheme).forEach(([theme, count]) => {
        console.log(`   ${theme}: ${count} puzzle(s)`);
    });

    // Get new total
    const { data: allPuzzles } = await supabase.from('crossword_puzzles').select('id');
    console.log(`\n🎯 New total: ${allPuzzles ? allPuzzles.length : 0} crossword puzzles`);
}

addPuzzles();
