// Enhanced Data Loader for Hawaiian Pidgin Dictionary
class PidginDataLoader {
    constructor() {
        this.data = null;
        this.loaded = false;
        this.cache = new Map();
    }

    // Load dictionary data from JSON
    async loadData(url = 'data/pidgin-dictionary.json') {
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
            // Fallback to legacy data if available
            return this.loadLegacyData();
        }
    }

    // Fallback to legacy comprehensive data
    loadLegacyData() {
        console.log('🔄 Falling back to legacy data format...');

        if (typeof comprehensivePidginData !== 'undefined') {
            // Convert legacy format to new format
            this.data = this.convertLegacyData(comprehensivePidginData);
            this.loaded = true;
            console.log(`✅ Converted ${this.data.entries.length} legacy entries`);
            return this.data;
        }

        throw new Error('No pidgin data available');
    }

    // Convert legacy JavaScript object to new JSON format
    convertLegacyData(legacyData) {
        const entries = [];
        let idCounter = 1;

        for (const [key, entry] of Object.entries(legacyData)) {
            // Skip if entry is invalid
            if (!entry || !entry.pidgin || !entry.english) continue;

            const newEntry = {
                id: `${key.replace(/[^a-z0-9]/g, '_')}_${idCounter.toString().padStart(3, '0')}`,
                pidgin: entry.pidgin,
                english: Array.isArray(entry.english) ? entry.english : [entry.english],
                category: entry.category || 'expressions',
                pronunciation: entry.pronunciation || '',
                examples: entry.example ? [entry.example] : [],
                usage: entry.usage || '',
                origin: entry.origin || '',
                difficulty: this.inferDifficulty(entry.pidgin),
                frequency: this.inferFrequency(entry.pidgin),
                tags: this.generateTags(entry),
                audioExample: entry.audioExample || entry.example || ''
            };

            entries.push(newEntry);
            idCounter++;
        }

        return {
            metadata: {
                version: '2.0',
                lastUpdated: new Date().toISOString().split('T')[0],
                totalEntries: entries.length,
                description: 'Hawaiian Pidgin Dictionary (Converted from Legacy)',
                source: 'legacy-conversion'
            },
            categories: this.getDefaultCategories(),
            entries: entries
        };
    }

    // Infer difficulty level based on word characteristics
    inferDifficulty(pidgin) {
        const commonWords = ['howzit', 'brah', 'ono', 'pau', 'shoots', 'stay', 'da', 'grindz'];
        const intermediateWords = ['da kine', 'broke da mouth', 'talk story', 'pau hana'];

        if (commonWords.includes(pidgin.toLowerCase())) return 'beginner';
        if (intermediateWords.includes(pidgin.toLowerCase())) return 'intermediate';
        if (pidgin.includes(' ') || pidgin.length > 8) return 'advanced';
        return 'beginner';
    }

    // Infer frequency based on word characteristics
    inferFrequency(pidgin) {
        const veryHigh = ['howzit', 'brah', 'da', 'stay', 'pau', 'shoots', 'ono'];
        const high = ['grindz', 'da kine', 'choke', 'no can', 'like'];

        if (veryHigh.includes(pidgin.toLowerCase())) return 'very_high';
        if (high.includes(pidgin.toLowerCase())) return 'high';
        return 'medium';
    }

    // Generate tags based on entry data
    generateTags(entry) {
        const tags = [];

        if (entry.category) tags.push(entry.category);
        if (entry.origin === 'Hawaiian') tags.push('hawaiian');
        if (entry.origin === 'English') tags.push('english');
        if (entry.english.includes('food') || entry.category === 'food') tags.push('food');
        if (entry.english.includes('greeting') || entry.category === 'greetings') tags.push('greeting');

        return tags;
    }

    // Get default categories
    getDefaultCategories() {
        return {
            greetings: { name: "Greetings", description: "Ways to say hello", icon: "🙋‍♂️" },
            food: { name: "Food", description: "Food and eating", icon: "🍽️" },
            expressions: { name: "Expressions", description: "Common phrases", icon: "💬" },
            slang: { name: "Slang", description: "Casual language", icon: "🤙" },
            emotions: { name: "Emotions", description: "Feelings", icon: "😊" },
            actions: { name: "Actions", description: "Verbs", icon: "⚡" },
            directions: { name: "Directions", description: "Locations", icon: "🧭" },
            nature: { name: "Nature", description: "Environment", icon: "🌿" },
            cultural: { name: "Cultural", description: "Traditional", icon: "🌺" },
            family: { name: "Family", description: "Relationships", icon: "👨‍👩‍👧‍👦" }
        };
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
        return this.getAllEntries().filter(entry =>
            entry.pidgin.charAt(0).toLowerCase() === letter.toLowerCase()
        );
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

// Auto-load data when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await pidginDataLoader.loadData();

        // Create compatibility layer for existing code
        window.comprehensivePidginData = {};
        pidginDataLoader.getAllEntries().forEach(entry => {
            window.comprehensivePidginData[entry.pidgin] = {
                pidgin: entry.pidgin,
                english: entry.english[0], // Use first English translation
                category: entry.category,
                pronunciation: entry.pronunciation,
                example: entry.examples[0] || '',
                usage: entry.usage,
                origin: entry.origin,
                audioExample: entry.audioExample
            };
        });

        console.log('✅ Compatibility layer created for legacy code');

        // Dispatch custom event for modules that need to know data is ready
        window.dispatchEvent(new CustomEvent('pidginDataLoaded', {
            detail: { loader: pidginDataLoader }
        }));

    } catch (error) {
        console.error('Failed to initialize pidgin data:', error);
    }
});