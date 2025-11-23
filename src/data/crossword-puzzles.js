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
        grid: null, // Will be generated from words
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

    // Get puzzle by ID
    getPuzzle(id) {
        return this[`puzzle${id}`] || this.puzzle1;
    },

    // Get random puzzle
    getRandomPuzzle() {
        const puzzleCount = 2; // Update as more puzzles added
        const randomId = Math.floor(Math.random() * puzzleCount) + 1;
        return this.getPuzzle(randomId);
    },

    // Get daily puzzle (cycles through available puzzles)
    getDailyPuzzle(date = new Date()) {
        const startDate = new Date('2025-01-23');
        const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
        const puzzleCount = 2; // Update as more puzzles added
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
