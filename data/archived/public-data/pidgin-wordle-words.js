// Pidgin Wordle - Word Lists
// 5-letter Hawaiian Pidgin words for the daily word game
// All words sourced from pidgin-master.json dictionary

const pidginWordleData = {
    // Launch date for calculating daily word index
    launchDate: new Date('2025-01-01'),

    // Solutions List - 96 authentic 5-letter Pidgin words from dictionary
    solutions: [
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
    ],

    // Valid Guesses List - All acceptable guesses (includes solutions + common English words)
    validGuesses: [
        // All 96 authentic Pidgin solutions
        'ANOAI', 'AUANA', 'AIYAH', 'AIKEA', 'AISUS', 'AKULE', 'ALOHA', 'AMPED', 'ANDEN', 'AUNTY',
        'BACHI', 'BENTO', 'BOCHA', 'BOROT', 'BULAI', 'CHANG', 'CHOKE', 'CRASH', 'DABES', 'FOWAT',
        'FOSHO', 'GANJA', 'GETUM', 'GRIND', 'HABUT', 'HAKAK', 'HALAU', 'HANAI', 'HANAU', 'HAOLE',
        'HAPAI', 'HAUNA', 'HEIAU', 'HONAH', 'ILIKE', 'IRRAZ', 'IYKYK', 'JAMUP', 'JOOSE', 'JUNKS',
        'KALUA', 'KAPUT', 'KEIKI', 'KOKUA', 'KUKAE', 'KUKUI', 'LANAI', 'LEHUA', 'MAILE', 'MAKAI',
        'MAUKA', 'MAUNA', 'MENTO', 'NAILS', 'NIELE', 'NOACK', 'NOCAN', 'OBAKE', 'OHANA', 'OKOLE',
        'OPALA', 'OPIHI', 'PANTY', 'PILAU', 'RAJAH', 'SCRAP', 'SHAME', 'TANKS', 'WAKEA', 'SCOSH',
        'NOLIE', 'UNCLE', 'KPUNA', 'LIDAT', 'SOLID', 'KATSU', 'SHOYU', 'SHAKA', 'GOING', 'SCRAM',
        'BROKE', 'DIRTY', 'SALTY', 'STOUT', 'KLOLO', 'PHAKU', 'BENJO', 'GOHAN', 'ZORIS', 'PINAY',
        'PINOY', 'SARAP', 'BANGO', 'GECKO', 'GUAVA', 'NOACT',

        // Common English words that locals use
        'ABOUT', 'ABOVE', 'AFTER', 'AGAIN', 'ALONG',
        'APPLE', 'BREAD', 'BREAK', 'BRING', 'BUILD',
        'CAUSE', 'CHAIR', 'CHEAP', 'CLEAN', 'CLEAR',
        'CLOSE', 'COMES', 'COULD', 'COUNT', 'DADDY',
        'DANCE', 'DOING', 'DRINK', 'DRIVE', 'EARLY',
        'EARTH', 'EIGHT', 'ENJOY', 'ENTER', 'ERROR',
        'EVERY', 'FIGHT', 'FIRST', 'FIRST', 'FLOOR',
        'FORCE', 'FORTH', 'FOUND', 'FRESH', 'FRONT',
        'FRUIT', 'FUNNY', 'GIVEN', 'GLASS', 'GOING',
        'GONNA', 'GREAT', 'GREEN', 'GROUP', 'GUESS',
        'HAPPY', 'HEART', 'HEAVY', 'HELLO', 'HENCE',
        'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'IDEAS',
        'IMAGE', 'ISSUE', 'ITEMS', 'JUDGE', 'KNOWS',
        'LARGE', 'LATER', 'LAUGH', 'LEARN', 'LEAST',
        'LEAVE', 'LEGAL', 'LEMON', 'LEVEL', 'LIGHT',
        'LIVED', 'LOOKS', 'LOOSE', 'LOVED', 'LOWER',
        'LUCKY', 'LUNCH', 'MAJOR', 'MATCH', 'MAYBE',
        'MEANS', 'MEDIA', 'MIGHT', 'MINOR', 'MONEY',
        'MONTH', 'MORAL', 'MOUSE', 'MOUTH', 'MOVIE',
        'MUSIC', 'NEEDS', 'NEVER', 'NIGHT', 'NOISE',
        'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR',
        'OCEAN', 'OFFER', 'OFTEN', 'ORDER', 'OTHER',
        'OUGHT', 'PAINT', 'PANEL', 'PAPER', 'PARTY',
        'PEACE', 'PHASE', 'PHONE', 'PHOTO', 'PIECE',
        'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE',
        'POINT', 'POUND', 'POWER', 'PRESS', 'PRICE',
        'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PROOF',
        'PROUD', 'PROVE', 'QUEEN', 'QUICK', 'QUIET',
        'QUITE', 'RADIO', 'RAISE', 'RANGE', 'RAPID',
        'RATIO', 'REACH', 'READY', 'REFER', 'RIGHT',
        'RIVER', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL',
        'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SENSE',
        'SERVE', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE',
        'SHARP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT',
        'SHINE', 'SHIRT', 'SHOCK', 'SHORE', 'SHORT',
        'SHOWN', 'SIGHT', 'SINCE', 'SIXTH', 'SIXTY',
        'SIZED', 'SKILL', 'SLEEP', 'SLIDE', 'SMALL',
        'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SOLID',
        'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE',
        'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT',
        'SPLIT', 'SPOKE', 'SPORT', 'STAFF', 'STAGE',
        'STAKE', 'STAND', 'START', 'STATE', 'STEAM',
        'STEEL', 'STICK', 'STILL', 'STOCK', 'STONE',
        'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP',
        'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR',
        'SUITE', 'SUPER', 'SWEET', 'TABLE', 'TAKEN',
        'TASTE', 'TAXES', 'TEACH', 'TEETH', 'TERRY',
        'TEXAS', 'THANK', 'THEFT', 'THEIR', 'THEME',
        'THERE', 'THESE', 'THICK', 'THING', 'THINK',
        'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW',
        'TIGHT', 'TIMES', 'TITLE', 'TODAY', 'TOPIC',
        'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACK',
        'TRADE', 'TRAIN', 'TREAT', 'TREND', 'TRIAL',
        'TRIED', 'TRIES', 'TRUCK', 'TRULY', 'TRUST',
        'TRUTH', 'TWICE', 'UNDER', 'UNDUE', 'UNION',
        'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN',
        'USAGE', 'USUAL', 'VALID', 'VALUE', 'VIDEO',
        'VIRUS', 'VISIT', 'VITAL', 'VOCAL', 'VOICE',
        'WASTE', 'WATCH', 'WATER', 'WHEEL', 'WHERE',
        'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE',
        'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE',
        'WORST', 'WORTH', 'WOULD', 'WOUND', 'WRITE',
        'WRONG', 'WROTE', 'YIELD', 'YOUNG', 'YOURS',
        'YOUTH'
    ],

    // Get the daily word based on current date
    getDailyWord() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day

        const launchDay = new Date(this.launchDate);
        launchDay.setHours(0, 0, 0, 0);

        // Calculate days since launch
        const daysSinceLaunch = Math.floor((today - launchDay) / (1000 * 60 * 60 * 24));

        // Use modulo to cycle through the solutions list
        const wordIndex = daysSinceLaunch % this.solutions.length;

        return {
            word: this.solutions[wordIndex],
            dayNumber: daysSinceLaunch + 1,
            index: wordIndex
        };
    },

    // Check if a guess is valid
    isValidGuess(guess) {
        const upperGuess = guess.toUpperCase();
        return this.validGuesses.includes(upperGuess);
    },

    // Check letter states for a guess
    checkGuess(guess, solution) {
        const result = [];
        const solutionLetters = solution.split('');
        const guessLetters = guess.toUpperCase().split('');

        // First pass: mark correct letters (green)
        const used = new Array(solutionLetters.length).fill(false);
        guessLetters.forEach((letter, i) => {
            if (letter === solutionLetters[i]) {
                result[i] = 'correct';
                used[i] = true;
            }
        });

        // Second pass: mark present letters (yellow)
        guessLetters.forEach((letter, i) => {
            if (result[i]) return; // Already marked as correct

            const foundIndex = solutionLetters.findIndex((l, idx) =>
                l === letter && !used[idx]
            );

            if (foundIndex !== -1) {
                result[i] = 'present';
                used[foundIndex] = true;
            } else {
                result[i] = 'absent';
            }
        });

        return result;
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pidginWordleData;
}
