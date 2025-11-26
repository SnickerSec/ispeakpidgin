// Pre-generated Hawaiian Pidgin Crossword Puzzles
// These puzzles are hand-crafted for optimal playability

const crosswordPuzzles = {
    // Puzzle 1: Beginner - Food Theme (5x5 grid)
    puzzle1: {
        id: 1,
        theme: 'food',
        difficulty: 'beginner',
        size: { rows: 5, cols: 5 },
        title: 'Local Grindz',
        description: 'All about Hawaiian food!',
        grid: [
            ['P', 'O', 'K', 'E', ' '],
            ['O', ' ', ' ', ' ', ' '],
            ['I', ' ', 'M', 'U', 'S', 'U', 'B'],
            [' ', ' ', 'A', ' ', ' '],
            [' ', ' ', 'H', 'I', ' ']
        ],
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'POKE', clue: 'Raw fish salad, local favorite', answer: 'POKE' },
                { number: 3, row: 2, col: 2, word: 'MUSUBI', clue: 'Spam and rice snack', answer: 'MUSUBI' },
                { number: 4, row: 4, col: 2, word: 'HI', clue: 'Slang for "high" or elevated', answer: 'HI' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'POI', clue: 'Taro paste, staple food', answer: 'POI' },
                { number: 2, row: 2, col: 2, word: 'MAHI', clue: 'Type of fish (dolphin fish)', answer: 'MAHI' }
            ]
        }
    },

    // Puzzle 2: Beginner - Greetings & Expressions (7x7 grid)
    puzzle2: {
        id: 2,
        theme: 'greetings',
        difficulty: 'beginner',
        size: { rows: 7, cols: 7 },
        title: 'Talk Story',
        description: 'Common greetings and expressions',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'ALOHA', clue: 'Hello or goodbye', answer: 'ALOHA' },
                { number: 4, row: 2, col: 0, word: 'HOWZIT', clue: 'How are you?', answer: 'HOWZIT' },
                { number: 6, row: 4, col: 0, word: 'MAHALO', clue: 'Thank you', answer: 'MAHALO' },
                { number: 8, row: 6, col: 0, word: 'SHAKA', clue: 'Hang loose hand sign', answer: 'SHAKA' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'AKAMAI', clue: 'Smart, clever', answer: 'AKAMAI' },
                { number: 3, row: 0, col: 4, word: 'HANA', clue: 'Work', answer: 'HANA' }
            ]
        }
    },

    // Puzzle 3: Beginner - Family & People
    puzzle3: {
        id: 3,
        theme: 'family',
        difficulty: 'beginner',
        size: { rows: 6, cols: 6 },
        title: 'Ohana Time',
        description: 'Family and people terms',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'BRAH', clue: 'Brother, friend', answer: 'BRAH' },
                { number: 3, row: 2, col: 0, word: 'KEIKI', clue: 'Child, kid', answer: 'KEIKI' },
                { number: 5, row: 4, col: 0, word: 'AUNTY', clue: 'Respectful term for older woman', answer: 'AUNTY' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'BRUDDAH', clue: 'Brother (long form)', answer: 'BRUDDAH' },
                { number: 2, row: 0, col: 3, word: 'HAOLE', clue: 'Caucasian person', answer: 'HAOLE' }
            ]
        }
    },

    // Puzzle 4: Beginner - Beach & Ocean
    puzzle4: {
        id: 4,
        theme: 'beach',
        difficulty: 'beginner',
        size: { rows: 6, cols: 6 },
        title: 'Beach Vibes',
        description: 'Ocean and beach pidgin',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'SURF', clue: 'Ride the waves', answer: 'SURF' },
                { number: 3, row: 2, col: 0, word: 'SHOREBREAK', clue: 'Waves breaking at the beach', answer: 'SHOREBREAK' },
                { number: 5, row: 4, col: 0, word: 'SLIPPAH', clue: 'Flip-flops, sandals', answer: 'SLIPPAH' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'SETS', clue: 'Groups of waves', answer: 'SETS' },
                { number: 2, row: 0, col: 2, word: 'REEF', clue: 'Coral formation', answer: 'REEF' }
            ]
        }
    },

    // Puzzle 5: Intermediate - Local Slang
    puzzle5: {
        id: 5,
        theme: 'slang',
        difficulty: 'intermediate',
        size: { rows: 7, cols: 7 },
        title: 'Local Kine',
        description: 'Authentic pidgin slang',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'DAKINE', clue: 'The thing, whatchamacallit', answer: 'DAKINE' },
                { number: 3, row: 2, col: 0, word: 'GRINDZ', clue: 'Food, to eat', answer: 'GRINDZ' },
                { number: 5, row: 4, col: 0, word: 'STINK', clue: 'Bad, unpleasant', answer: 'STINK' },
                { number: 7, row: 6, col: 0, word: 'CHOKE', clue: 'Plenty, a lot', answer: 'CHOKE' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'DASSIT', clue: 'That\'s it, exactly', answer: 'DASSIT' },
                { number: 2, row: 0, col: 3, word: 'KAPU', clue: 'Forbidden, off limits', answer: 'KAPU' }
            ]
        }
    },

    // Puzzle 6: Intermediate - Actions & Verbs
    puzzle6: {
        id: 6,
        theme: 'actions',
        difficulty: 'intermediate',
        size: { rows: 6, cols: 6 },
        title: 'Do Um',
        description: 'Common pidgin verbs',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'STAY', clue: 'To be, am/is/are', answer: 'STAY' },
                { number: 3, row: 2, col: 0, word: 'LIKE', clue: 'Want to, going to', answer: 'LIKE' },
                { number: 5, row: 4, col: 0, word: 'BEEF', clue: 'Fight, problem with', answer: 'BEEF' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'SCRAP', clue: 'To fight', answer: 'SCRAP' },
                { number: 2, row: 0, col: 2, word: 'TALK', clue: '__ story (chat)', answer: 'TALK' }
            ]
        }
    },

    // Puzzle 7: Intermediate - Places & Locations
    puzzle7: {
        id: 7,
        theme: 'places',
        difficulty: 'intermediate',
        size: { rows: 7, cols: 7 },
        title: 'Around Town',
        description: 'Places and locations',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'MAKAI', clue: 'Toward the ocean', answer: 'MAKAI' },
                { number: 3, row: 2, col: 0, word: 'MAUKA', clue: 'Toward the mountains', answer: 'MAUKA' },
                { number: 5, row: 4, col: 0, word: 'TOWN', clue: 'Downtown, city center', answer: 'TOWN' },
                { number: 7, row: 6, col: 0, word: 'SIDE', clue: 'Area, region (Windward __)', answer: 'SIDE' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'MARKET', clue: 'Store, supermarket', answer: 'MARKET' },
                { number: 2, row: 0, col: 4, word: 'AINA', clue: 'Land, earth', answer: 'AINA' }
            ]
        }
    },

    // Puzzle 8: Advanced - Expressions & Phrases
    puzzle8: {
        id: 8,
        theme: 'expressions',
        difficulty: 'advanced',
        size: { rows: 8, cols: 8 },
        title: 'Talk Da Kine',
        description: 'Complex pidgin expressions',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'PAUHANA', clue: 'After work, happy hour', answer: 'PAUHANA' },
                { number: 3, row: 2, col: 0, word: 'BROKEDAMOUTH', clue: 'Delicious food', answer: 'BROKEDAMOUTH' },
                { number: 5, row: 4, col: 0, word: 'SHOOTS', clue: 'Okay, sounds good', answer: 'SHOOTS' },
                { number: 7, row: 6, col: 0, word: 'RAJAH', clue: 'Roger, understood', answer: 'RAJAH' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'PLANNY', clue: 'Plenty, a lot', answer: 'PLANNY' },
                { number: 2, row: 0, col: 5, word: 'HUMBUG', clue: 'Hassle, bother', answer: 'HUMBUG' }
            ]
        }
    },

    // Puzzle 9: Advanced - Food & Cooking
    puzzle9: {
        id: 9,
        theme: 'food',
        difficulty: 'advanced',
        size: { rows: 7, cols: 7 },
        title: 'Ono Grindz',
        description: 'Delicious food words',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'ONO', clue: 'Delicious, tasty', answer: 'ONO' },
                { number: 3, row: 2, col: 0, word: 'KAUKAU', clue: 'Food, to eat', answer: 'KAUKAU' },
                { number: 5, row: 4, col: 0, word: 'PUPUS', clue: 'Appetizers, snacks', answer: 'PUPUS' },
                { number: 7, row: 6, col: 0, word: 'LAULAU', clue: 'Pork wrapped in taro leaves', answer: 'LAULAU' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'OPIHI', clue: 'Hawaiian limpet delicacy', answer: 'OPIHI' },
                { number: 2, row: 0, col: 2, word: 'OPAE', clue: 'Shrimp', answer: 'OPAE' }
            ]
        }
    },

    // Puzzle 10: Advanced - Culture & Traditions
    puzzle10: {
        id: 10,
        theme: 'culture',
        difficulty: 'advanced',
        size: { rows: 8, cols: 8 },
        title: 'Island Roots',
        description: 'Cultural terms and traditions',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'LUAU', clue: 'Hawaiian feast, party', answer: 'LUAU' },
                { number: 3, row: 2, col: 0, word: 'HULA', clue: 'Traditional Hawaiian dance', answer: 'HULA' },
                { number: 5, row: 4, col: 0, word: 'UKULELE', clue: 'Small Hawaiian guitar', answer: 'UKULELE' },
                { number: 7, row: 6, col: 0, word: 'KANIKAPILA', clue: 'Jam session, music gathering', answer: 'KANIKAPILA' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'LOMI', clue: 'To massage, rub', answer: 'LOMI' },
                { number: 2, row: 0, col: 3, word: 'IMU', clue: 'Underground oven', answer: 'IMU' }
            ]
        }
    },

    // Puzzle 11: Beginner - Weather & Nature
    puzzle11: {
        id: 11,
        theme: 'nature',
        difficulty: 'beginner',
        size: { rows: 6, cols: 6 },
        title: 'Island Weather',
        description: 'Weather and nature terms',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'RAIN', clue: 'Water from the sky', answer: 'RAIN' },
                { number: 3, row: 2, col: 0, word: 'SUN', clue: 'Bright and hot', answer: 'SUN' },
                { number: 5, row: 4, col: 0, word: 'WIND', clue: 'Air movement', answer: 'WIND' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'RAINBOW', clue: 'Colorful arc after rain', answer: 'RAINBOW' },
                { number: 2, row: 0, col: 3, word: 'IWAS', clue: 'Nine-O (milkfish)', answer: 'IWAS' }
            ]
        }
    },

    // Puzzle 12: Beginner - Time & Days
    puzzle12: {
        id: 12,
        theme: 'time',
        difficulty: 'beginner',
        size: { rows: 6, cols: 6 },
        title: 'Island Time',
        description: 'Time-related pidgin',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'BUMBYE', clue: 'Later, by and by', answer: 'BUMBYE' },
                { number: 3, row: 2, col: 0, word: 'NOW', clue: 'Right now, immediately', answer: 'NOW' },
                { number: 5, row: 4, col: 0, word: 'EARLY', clue: 'Before the usual time', answer: 'EARLY' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'BEFORE', clue: 'Earlier than', answer: 'BEFORE' },
                { number: 2, row: 0, col: 4, word: 'YET', clue: 'Still, already', answer: 'YET' }
            ]
        }
    },

    // Puzzle 13: Intermediate - Emotions & Feelings
    puzzle13: {
        id: 13,
        theme: 'emotions',
        difficulty: 'intermediate',
        size: { rows: 7, cols: 7 },
        title: 'How You Feel',
        description: 'Emotions and feelings',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'HAPPY', clue: 'Feeling good, joyful', answer: 'HAPPY' },
                { number: 3, row: 2, col: 0, word: 'BODDAH', clue: 'Bother, annoy', answer: 'BODDAH' },
                { number: 5, row: 4, col: 0, word: 'SHAME', clue: 'Embarrassed, shy', answer: 'SHAME' },
                { number: 7, row: 6, col: 0, word: 'SKED', clue: 'Scared, afraid', answer: 'SKED' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'HUHU', clue: 'Angry, upset', answer: 'HUHU' },
                { number: 2, row: 0, col: 3, word: 'PAU', clue: 'Finished, done', answer: 'PAU' }
            ]
        }
    },

    // Puzzle 14: Intermediate - Transportation
    puzzle14: {
        id: 14,
        theme: 'transportation',
        difficulty: 'intermediate',
        size: { rows: 6, cols: 6 },
        title: 'Get Around',
        description: 'Getting from here to there',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'BUS', clue: 'Public transportation', answer: 'BUS' },
                { number: 3, row: 2, col: 0, word: 'RIDE', clue: 'Transportation, lift', answer: 'RIDE' },
                { number: 5, row: 4, col: 0, word: 'CRUISE', clue: 'Drive around, hang out', answer: 'CRUISE' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'BROKE', clue: '__ da mouth (delicious)', answer: 'BROKE' },
                { number: 2, row: 0, col: 2, word: 'SHISHI', clue: 'Pee, urinate', answer: 'SHISHI' }
            ]
        }
    },

    // Puzzle 15: Intermediate - Animals & Creatures
    puzzle15: {
        id: 15,
        theme: 'animals',
        difficulty: 'intermediate',
        size: { rows: 6, cols: 6 },
        title: 'Island Creatures',
        description: 'Animals and bugs',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'GECKO', clue: 'Small lizard in house', answer: 'GECKO' },
                { number: 3, row: 2, col: 0, word: 'HONU', clue: 'Sea turtle', answer: 'HONU' },
                { number: 5, row: 4, col: 0, word: 'MANO', clue: 'Shark', answer: 'MANO' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'GRINDS', clue: 'Food', answer: 'GRINDS' },
                { number: 2, row: 0, col: 3, word: 'KIKI', clue: 'Titi, auntie (casual)', answer: 'KIKI' }
            ]
        }
    },

    // Puzzle 16: Advanced - Business & Work
    puzzle16: {
        id: 16,
        theme: 'work',
        difficulty: 'advanced',
        size: { rows: 7, cols: 7 },
        title: 'Work Talk',
        description: 'Business and work terms',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'HANA', clue: 'Work, job', answer: 'HANA' },
                { number: 3, row: 2, col: 0, word: 'KULEANA', clue: 'Responsibility, duty', answer: 'KULEANA' },
                { number: 5, row: 4, col: 0, word: 'KOKUA', clue: 'Help, assistance', answer: 'KOKUA' },
                { number: 7, row: 6, col: 0, word: 'BOSS', clue: 'Manager, person in charge', answer: 'BOSS' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'HARD', clue: '__ time (difficult)', answer: 'HARD' },
                { number: 2, row: 0, col: 3, word: 'AUDIT', clue: 'Check, review', answer: 'AUDIT' }
            ]
        }
    },

    // Puzzle 17: Advanced - Sports & Games
    puzzle17: {
        id: 17,
        theme: 'sports',
        difficulty: 'advanced',
        size: { rows: 7, cols: 7 },
        title: 'Play Ball',
        description: 'Sports and games',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'SURF', clue: 'Ride waves', answer: 'SURF' },
                { number: 3, row: 2, col: 0, word: 'VOLLEYBALL', clue: 'Beach game with net', answer: 'VOLLEYBALL' },
                { number: 5, row: 4, col: 0, word: 'DIVE', clue: 'Jump into water', answer: 'DIVE' },
                { number: 7, row: 6, col: 0, word: 'FISH', clue: 'Catch seafood', answer: 'FISH' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'SCORE', clue: 'Points in game', answer: 'SCORE' },
                { number: 2, row: 0, col: 3, word: 'REEF', clue: 'Coral formation', answer: 'REEF' }
            ]
        }
    },

    // Puzzle 18: Advanced - Directions & Navigation
    puzzle18: {
        id: 18,
        theme: 'directions',
        difficulty: 'advanced',
        size: { rows: 7, cols: 7 },
        title: 'Find Your Way',
        description: 'Getting around the island',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'MAKAI', clue: 'Toward the ocean', answer: 'MAKAI' },
                { number: 3, row: 2, col: 0, word: 'MAUKA', clue: 'Toward the mountains', answer: 'MAUKA' },
                { number: 5, row: 4, col: 0, word: 'EWA', clue: 'Westward direction', answer: 'EWA' },
                { number: 7, row: 6, col: 0, word: 'KOKO', clue: 'Eastward (__ Head)', answer: 'KOKO' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'MAIN', clue: '__ street, downtown', answer: 'MAIN' },
                { number: 2, row: 0, col: 3, word: 'KANE', clue: 'Man, male', answer: 'KANE' }
            ]
        }
    },

    // Puzzle 19: Advanced - Party & Celebration
    puzzle19: {
        id: 19,
        theme: 'celebration',
        difficulty: 'advanced',
        size: { rows: 8, cols: 8 },
        title: 'Party Time',
        description: 'Celebration and fun',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'LUAU', clue: 'Hawaiian party, feast', answer: 'LUAU' },
                { number: 3, row: 2, col: 0, word: 'BACHANAL', clue: 'Wild party, celebration', answer: 'BACHANAL' },
                { number: 5, row: 4, col: 0, word: 'JAMMING', clue: 'Playing music together', answer: 'JAMMING' },
                { number: 7, row: 6, col: 0, word: 'DRINK', clue: 'Beverage, alcohol', answer: 'DRINK' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'LOLO', clue: 'Crazy, silly', answer: 'LOLO' },
                { number: 2, row: 0, col: 4, word: 'AINA', clue: 'Land', answer: 'AINA' }
            ]
        }
    },

    // Puzzle 20: Advanced - Respect & Manners
    puzzle20: {
        id: 20,
        theme: 'respect',
        difficulty: 'advanced',
        size: { rows: 8, cols: 8 },
        title: 'Show Respect',
        description: 'Manners and respect',
        grid: null,
        words: {
            across: [
                { number: 1, row: 0, col: 0, word: 'MAHALO', clue: 'Thank you', answer: 'MAHALO' },
                { number: 3, row: 2, col: 0, word: 'RESPECT', clue: 'Honor, regard', answer: 'RESPECT' },
                { number: 5, row: 4, col: 0, word: 'AKAMAI', clue: 'Smart, clever', answer: 'AKAMAI' },
                { number: 7, row: 6, col: 0, word: 'PONO', clue: 'Righteous, proper', answer: 'PONO' }
            ],
            down: [
                { number: 1, row: 0, col: 0, word: 'MANNERS', clue: 'Proper behavior', answer: 'MANNERS' },
                { number: 2, row: 0, col: 5, word: 'OHANA', clue: 'Family', answer: 'OHANA' }
            ]
        }
    },

    // Get puzzle by ID
    getPuzzle(id) {
        return this[`puzzle${id}`] || this.puzzle1;
    },

    // Get random puzzle
    getRandomPuzzle() {
        const puzzleCount = 20; // Updated with 20 puzzles
        const randomId = Math.floor(Math.random() * puzzleCount) + 1;
        return this.getPuzzle(randomId);
    },

    // Get daily puzzle (cycles through available puzzles)
    getDailyPuzzle(date = new Date()) {
        const startDate = new Date('2025-01-23');
        const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
        const puzzleCount = 20; // Updated with 20 puzzles
        const puzzleId = (daysDiff % puzzleCount) + 1;

        return {
            ...this.getPuzzle(puzzleId),
            dayNumber: daysDiff + 1,
            date: date.toISOString().split('T')[0]
        };
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = crosswordPuzzles;
}
