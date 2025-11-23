// Pidgin Wordle - Word Lists
// 5-letter Hawaiian Pidgin words for the daily word game

const pidginWordleData = {
    // Launch date for calculating daily word index
    launchDate: new Date('2025-01-01'),

    // Solutions List - Common 5-letter Pidgin words (daily answers)
    solutions: [
        // Common Pidgin words
        'BRAH', 'SHAKA', 'KANAK', 'HAOLE', 'WAHINE',
        'KEIKI', 'GRIND', 'HOWZI', 'BROKE', 'CHOKE',
        'STINK', 'SHOOTS', 'LOLO', 'PAKAL', 'SHISHI',

        // More Hawaiian-Pidgin terms
        'MANIN', 'JUNKS', 'LIDAT', 'KAKAI', 'BACHI',
        'HAMAZ', 'STUSH', 'COCKA', 'MAKAI', 'MAUKA',
        'WIKIO', 'HANAS', 'TALKA', 'SHISO', 'JALIK',

        // Food and cultural terms
        'MUSUB', 'SAIMI', 'BENJO', 'OKOLE', 'PIPIW',
        'LILIK', 'PAKIK', 'PUPU', 'TANGL', 'BUDDA',

        // Action words
        'MEMBA', 'TINKS', 'GARANS', 'BUMBY', 'LICKA',
        'CRUIZ', 'GAWAN', 'DAKOO', 'NOMO', 'SERIO',

        // Descriptive
        'CHOKY', 'HECKA', 'CHUBS', 'SKINY', 'PAKES',
        'PORTU', 'AKAMAI', 'PILAU', 'KAPAK', 'ONOLI',

        // More everyday words
        'BUDDE', 'CUZIN', 'FRENS', 'SISTA', 'AUNTY',
        'UNCLE', 'MOKES', 'KAUAI', 'MOLOKAI', 'LANAI',
        'HONUA', 'PUKIK', 'WAIPI', 'KOKOK', 'NIELE'
    ],

    // Valid Guesses List - All acceptable guesses (includes solutions + more)
    validGuesses: [
        // All solutions are valid
        'BRAH', 'SHAKA', 'KANAK', 'HAOLE', 'WAHINE',
        'KEIKI', 'GRIND', 'HOWZI', 'BROKE', 'CHOKE',
        'STINK', 'SHOOTS', 'LOLO', 'PAKAL', 'SHISHI',
        'MANIN', 'JUNKS', 'LIDAT', 'KAKAI', 'BACHI',
        'HAMAZ', 'STUSH', 'COCKA', 'MAKAI', 'MAUKA',
        'WIKIO', 'HANAS', 'TALKA', 'SHISO', 'JALIK',
        'MUSUB', 'SAIMI', 'BENJO', 'OKOLE', 'PIPIW',
        'LILIK', 'PAKIK', 'PUPU', 'TANGL', 'BUDDA',
        'MEMBA', 'TINKS', 'GARANS', 'BUMBY', 'LICKA',
        'CRUIZ', 'GAWAN', 'DAKOO', 'NOMO', 'SERIO',
        'CHOKY', 'HECKA', 'CHUBS', 'SKINY', 'PAKES',
        'PORTU', 'AKAMAI', 'PILAU', 'KAPAK', 'ONOLI',
        'BUDDE', 'CUZIN', 'FRENS', 'SISTA', 'AUNTY',
        'UNCLE', 'MOKES', 'KAUAI', 'MOLOKAI', 'LANAI',
        'HONUA', 'PUKIK', 'WAIPI', 'KOKOK', 'NIELE',

        // Additional valid guesses (common words, English words that locals use)
        'ALOHA', 'MAHALO', 'OHANA', 'KINE', 'PONO',
        'NANI', 'WIKI', 'HULA', 'KANE', 'KONA',
        'HILO', 'MAUI', 'OAHU', 'KAUAI', 'AINA',
        'POKE', 'LUAU', 'KAHU', 'MANA', 'TITA',
        'MOKE', 'TALK', 'GOIN', 'STAY', 'COME',
        'LIKE', 'WHAT', 'MORE', 'GOOD', 'REAL',
        'SICK', 'HARD', 'SOFT', 'FAST', 'SLOW',
        'HIGH', 'DEEP', 'LONG', 'WIDE', 'THIN',

        // More Pidgin variations
        'DAKIS', 'SCRAN', 'POTLUK', 'SLIPPA', 'BEEFS',
        'TALKS', 'STORY', 'BROKE', 'MOUTH', 'SKED'
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
