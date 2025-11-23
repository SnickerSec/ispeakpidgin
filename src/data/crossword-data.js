// Hawaiian Pidgin Crossword Data
// Generated from pidgin-master.json dictionary

const crosswordData = {
    metadata: {
        version: '1.0',
        totalWords: 0,
        lastUpdated: '2025-01-23',
        themes: ['food', 'expressions', 'cultural', 'slang', 'nature', 'people', 'actions', 'emotions', 'greetings']
    },

    // Crossword-suitable words with clues
    words: [
        // This will be populated by a build script from the master dictionary
        // Format: { word: 'ALOHA', clue: 'Hawaiian greeting', category: 'greetings', difficulty: 'beginner', length: 5 }
    ],

    // Pre-generated daily puzzles
    dailyPuzzles: [
        // Format: { date: '2025-01-23', grid: [...], words: [...], theme: 'food' }
    ],

    // Themed puzzle collections
    themedPuzzles: {
        food: [],
        expressions: [],
        cultural: [],
        slang: [],
        mixed: []
    },

    // Get daily puzzle based on date
    getDailyPuzzle(date = new Date()) {
        const startDate = new Date('2025-01-23');
        const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
        const puzzleIndex = daysDiff % this.dailyPuzzles.length;

        return {
            ...this.dailyPuzzles[puzzleIndex],
            dayNumber: daysDiff + 1
        };
    },

    // Get random puzzle by theme
    getPuzzleByTheme(theme) {
        const puzzles = this.themedPuzzles[theme] || this.themedPuzzles.mixed;
        const randomIndex = Math.floor(Math.random() * puzzles.length);
        return puzzles[randomIndex];
    },

    // Get words by criteria
    getWordsByLength(length) {
        return this.words.filter(w => w.length === length);
    },

    getWordsByCategory(category) {
        return this.words.filter(w => w.category === category);
    },

    getWordsByDifficulty(difficulty) {
        return this.words.filter(w => w.difficulty === difficulty);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = crosswordData;
}
