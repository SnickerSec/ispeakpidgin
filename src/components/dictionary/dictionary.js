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
        // Use the enhanced data loader
        if (typeof pidginDataLoader !== 'undefined') {
            try {
                await this.waitForDataLoader();
                this.dataLoader = pidginDataLoader;
                this.isNewSystem = true;
                console.log('✅ Using enhanced JSON data system with', this.dataLoader.getAllEntries().length, 'entries');
                return;
            } catch (error) {
                console.error('❌ Enhanced data loader failed:', error);
                throw new Error('Failed to load pidgin dictionary data');
            }
        } else {
            console.error('❌ Data loader not available');
            throw new Error('Pidgin data loader not found');
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
        throw new Error('Dictionary not properly initialized');
    }

    getByCategory(category) {
        if (this.isNewSystem) {
            return this.dataLoader.getByCategory(category).map(entry => ({ ...entry, key: entry.id }));
        }
        throw new Error('Dictionary not properly initialized');
    }

    getByLetter(letter) {
        if (this.isNewSystem) {
            return this.dataLoader.getByLetter(letter).map(entry => ({ ...entry, key: entry.id }));
        }
        throw new Error('Dictionary not properly initialized');
    }

    getRandomWords(count = 10) {
        if (this.isNewSystem) {
            return this.dataLoader.getRandomEntries(count).map(entry => ({ ...entry, key: entry.id }));
        }
        throw new Error('Dictionary not properly initialized');
    }

    // Get total count
    getTotalCount() {
        if (this.isNewSystem) {
            return this.dataLoader.getAllEntries().length;
        }
        throw new Error('Dictionary not properly initialized');
    }

    // Get categories information
    getCategories() {
        if (this.isNewSystem) {
            return this.dataLoader.getCategories();
        }
        throw new Error('Dictionary not properly initialized');
    }
}

// Initialize the dictionary
const pidginDictionary = new PidginDictionary();

// Expose to global scope for practice system and other modules
window.pidginDictionary = pidginDictionary;