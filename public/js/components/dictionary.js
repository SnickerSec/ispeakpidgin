// Enhanced Pidgin Dictionary Module
class PidginDictionary {
    constructor() {
        this.dataLoader = null;
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.isNewSystem = false;
        this.initializeDictionary();
    }

    async initializeDictionary() {
        // Try to use new data loader if available
        if (typeof pidginDataLoader !== 'undefined') {
            try {
                await this.waitForDataLoader();
                this.dataLoader = pidginDataLoader;
                this.isNewSystem = true;
                console.log('✅ Using enhanced JSON data system with', this.dataLoader.getAllEntries().length, 'entries');
                return;
            } catch (error) {
                console.warn('⚠️ Enhanced data loader failed, falling back to legacy system');
            }
        }

        // Fallback to legacy system
        if (typeof comprehensivePidginData !== 'undefined') {
            this.dictionary = comprehensivePidginData;
            this.actualCount = Object.keys(this.dictionary).length;
            console.log('📚 Using legacy data system with', this.actualCount, 'entries');
        } else {
            console.error('❌ No data system available');
        }
    }

    async waitForDataLoader() {
        // Wait for data loader to be ready
        return new Promise((resolve, reject) => {
            if (pidginDataLoader.loaded) {
                resolve();
                return;
            }

            const timeout = setTimeout(() => reject(new Error('Data loader timeout')), 10000);

            window.addEventListener('pidginDataLoaded', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
        });
    }

    searchDictionary(term) {
        if (this.isNewSystem) {
            return this.dataLoader.search(term).map(entry => ({ ...entry, key: entry.id }));
        }

        // Legacy system
        const searchLower = term.toLowerCase().trim();
        const results = [];

        for (let [key, entry] of Object.entries(this.dictionary)) {
            if (key.includes(searchLower) ||
                entry.english.toLowerCase().includes(searchLower) ||
                (entry.example && entry.example.toLowerCase().includes(searchLower))) {
                results.push({ ...entry, key });
            }
        }

        return results;
    }

    getByCategory(category) {
        if (this.isNewSystem) {
            return this.dataLoader.getByCategory(category).map(entry => ({ ...entry, key: entry.id }));
        }

        // Legacy system
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
        if (this.isNewSystem) {
            return this.dataLoader.getByLetter(letter).map(entry => ({ ...entry, key: entry.id }));
        }

        // Legacy system
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
        if (this.isNewSystem) {
            return this.dataLoader.getRandomEntries(count).map(entry => ({ ...entry, key: entry.id }));
        }

        // Legacy system
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

    // Get total count
    getTotalCount() {
        if (this.isNewSystem) {
            return this.dataLoader.getAllEntries().length;
        }
        return this.actualCount || Object.keys(this.dictionary).length;
    }

    // Get categories information
    getCategories() {
        if (this.isNewSystem) {
            return this.dataLoader.getCategories();
        }

        // Legacy fallback - extract categories from data
        const categories = new Set();
        Object.values(this.dictionary).forEach(entry => {
            if (entry.category) categories.add(entry.category);
        });

        return Array.from(categories).reduce((acc, cat) => {
            acc[cat] = { name: cat.charAt(0).toUpperCase() + cat.slice(1), description: '', icon: '📝' };
            return acc;
        }, {});
    }
}

// Initialize the dictionary
const pidginDictionary = new PidginDictionary();

// Expose to global scope for practice system and other modules
window.pidginDictionary = pidginDictionary;