// Enhanced Data Loader for Hawaiian Pidgin Dictionary
class PidginDataLoader {
    constructor() {
        this.data = null;
        this.loaded = false;
        this.cache = new Map();
    }

    // Load dictionary data from JSON
    async loadData(url = 'data/dictionary/pidgin-dictionary.json') {
        try {
            console.log('📚 Loading pidgin dictionary data...');
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.data = await response.json();
            this.loaded = true;

            console.log(`✅ Loaded ${this.data.entries.length} pidgin entries (v${this.data.metadata.version})`);
            return this.data;
        } catch (error) {
            console.error('❌ Failed to load pidgin data:', error);
            throw error;
        }
    }


    // Get all entries
    getAllEntries() {
        if (!this.loaded) throw new Error('Data not loaded yet');
        return this.data.entries;
    }

    // Get entries by category
    getByCategory(category) {
        if (category === 'all') return this.getAllEntries();
        return this.getAllEntries().filter(entry => entry.category === category);
    }

    // Search entries
    search(term) {
        const searchTerm = term.toLowerCase();
        return this.getAllEntries().filter(entry =>
            entry.pidgin.toLowerCase().includes(searchTerm) ||
            entry.english.some(eng => eng.toLowerCase().includes(searchTerm)) ||
            entry.examples.some(ex => ex.toLowerCase().includes(searchTerm)) ||
            entry.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    // Get entries by letter
    getByLetter(letter) {
        return this.getAllEntries().filter(entry => {
            // Remove leading apostrophes and special characters, then check first letter
            const cleanWord = entry.pidgin.replace(/^[''ʻ]+/, '');
            return cleanWord.charAt(0).toLowerCase() === letter.toLowerCase();
        });
    }

    // Get random entries
    getRandomEntries(count = 10) {
        const entries = this.getAllEntries();
        const shuffled = entries.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // Get entry by ID
    getById(id) {
        return this.getAllEntries().find(entry => entry.id === id);
    }

    // Get metadata
    getMetadata() {
        return this.data?.metadata || {};
    }

    // Get categories
    getCategories() {
        return this.data?.categories || {};
    }

    // Get category statistics
    getCategoryStats() {
        const stats = {};
        const entries = this.getAllEntries();

        for (const entry of entries) {
            stats[entry.category] = (stats[entry.category] || 0) + 1;
        }

        return stats;
    }

    // Export data in various formats
    exportToJSON() {
        return JSON.stringify(this.data, null, 2);
    }

    exportToCSV() {
        const entries = this.getAllEntries();
        const headers = ['id', 'pidgin', 'english', 'category', 'pronunciation', 'examples', 'usage', 'origin'];
        const rows = entries.map(entry => [
            entry.id,
            entry.pidgin,
            entry.english.join('; '),
            entry.category,
            entry.pronunciation,
            entry.examples.join('; '),
            entry.usage,
            entry.origin
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// Initialize global data loader
const pidginDataLoader = new PidginDataLoader();

// Make it globally available
window.pidginDataLoader = pidginDataLoader;

// Auto-load data when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await pidginDataLoader.loadData();


        // Dispatch custom event for modules that need to know data is ready
        window.dispatchEvent(new CustomEvent('pidginDataLoaded', {
            detail: { loader: pidginDataLoader }
        }));

    } catch (error) {
        console.error('Failed to initialize pidgin data:', error);
    }
});