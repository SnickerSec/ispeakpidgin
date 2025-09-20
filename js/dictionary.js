// Pidgin Dictionary Module
class PidginDictionary {
    constructor() {
        this.initializeDictionary();
        this.currentCategory = 'all';
        this.searchTerm = '';
    }

    initializeDictionary() {
        // Load comprehensive pidgin data and deduplicate
        this.dictionary = comprehensivePidginData;
        this.actualCount = Object.keys(this.dictionary).length;
        console.log('Dictionary initialized with', this.actualCount, 'unique entries');
    }

    searchDictionary(term) {
        const searchLower = term.toLowerCase().trim();
        const results = [];

        for (let [key, entry] of Object.entries(this.dictionary)) {
            if (key.includes(searchLower) ||
                entry.english.toLowerCase().includes(searchLower) ||
                entry.example.toLowerCase().includes(searchLower)) {
                results.push({ ...entry, key });
            }
        }

        return results;
    }

    getByCategory(category) {
        if (category === 'all') {
            return Object.entries(this.dictionary).map(([key, entry]) => ({ ...entry, key }));
        }

        const results = [];
        for (let [key, entry] of Object.entries(this.dictionary)) {
            if (entry.category === category) {
                results.push({ ...entry, key });
            }
        }
        return results;
    }

    getByLetter(letter) {
        const results = [];
        const letterLower = letter.toLowerCase();

        for (let [key, entry] of Object.entries(this.dictionary)) {
            if (key.charAt(0) === letterLower) {
                results.push({ ...entry, key });
            }
        }

        return results.sort((a, b) => a.key.localeCompare(b.key));
    }

    getRandomWords(count = 10) {
        const keys = Object.keys(this.dictionary);
        const randomWords = [];
        const usedIndexes = new Set();

        while (randomWords.length < count && randomWords.length < keys.length) {
            const randomIndex = Math.floor(Math.random() * keys.length);
            if (!usedIndexes.has(randomIndex)) {
                usedIndexes.add(randomIndex);
                const key = keys[randomIndex];
                randomWords.push({ ...this.dictionary[key], key });
            }
        }

        return randomWords;
    }
}

// Initialize the dictionary
const pidginDictionary = new PidginDictionary();