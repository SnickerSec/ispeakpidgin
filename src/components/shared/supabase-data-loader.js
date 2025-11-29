// Supabase-Enhanced Data Loader
// Fetches dictionary data from Supabase API with JSON fallback
class SupabaseDataLoader {
    constructor() {
        this.data = null;
        this.entries = [];
        this.loaded = false;
        this.cache = new Map();
        this.apiBaseUrl = '/api/dictionary';
        this.useSupabase = true;
        this.stats = null;
        this.categories = [];

        // Backward compatibility
        this.isNewSystem = true;
        this.legacyMode = false;
        this.viewType = 'dictionary';
    }

    // Main initialization - tries Supabase first, falls back to JSON
    async autoLoad() {
        try {
            // Try Supabase API first
            console.log('🔄 Attempting to load from Supabase API...');
            await this.loadFromSupabase();
            console.log('✅ Loaded from Supabase API');
            return this.data;
        } catch (error) {
            console.warn('⚠️ Supabase API unavailable, falling back to JSON...', error.message);
            this.useSupabase = false;
            return await this.loadFromJSON();
        }
    }

    // Load data from Supabase API
    async loadFromSupabase() {
        // First, get stats to know total count
        const statsResponse = await fetch(`${this.apiBaseUrl}/stats`);
        if (!statsResponse.ok) throw new Error('Stats endpoint failed');
        this.stats = await statsResponse.json();

        // Load all entries (paginated)
        const allEntries = [];
        const pageSize = 100;
        const totalPages = Math.ceil(this.stats.totalEntries / pageSize);

        for (let page = 1; page <= totalPages; page++) {
            const response = await fetch(`${this.apiBaseUrl}?page=${page}&limit=${pageSize}`);
            if (!response.ok) throw new Error(`Failed to fetch page ${page}`);
            const data = await response.json();
            allEntries.push(...data.entries);
        }

        // Transform to match expected format
        this.entries = allEntries.map(entry => ({
            ...entry,
            key: entry.id, // Add key for backward compatibility
            example: entry.examples?.[0] || '',
            audioExample: entry.audio_example || entry.examples?.[0] || entry.pidgin
        }));

        // Build data structure for compatibility
        this.data = {
            entries: this.entries,
            metadata: {
                totalEntries: this.stats.totalEntries,
                source: 'supabase',
                lastUpdated: this.stats.lastUpdated
            },
            categories: this.stats.byCategory
        };

        this.categories = Object.keys(this.stats.byCategory);
        this.loaded = true;

        console.log(`📊 Loaded ${this.entries.length} entries from Supabase`);
        return this.data;
    }

    // Fallback: Load from JSON files
    async loadFromJSON() {
        try {
            console.log('📚 Loading from JSON files...');
            const response = await fetch('data/views/dictionary.json');

            if (!response.ok) throw new Error('JSON load failed');

            this.data = await response.json();
            this.entries = this.data.entries.map(entry => ({
                ...entry,
                key: entry.id,
                example: entry.examples?.[0] || '',
                audioExample: entry.audioExample || entry.examples?.[0] || entry.pidgin
            }));

            this.loaded = true;
            console.log(`✅ Loaded ${this.entries.length} entries from JSON`);
            return this.data;
        } catch (error) {
            console.error('❌ Failed to load from JSON:', error);
            throw error;
        }
    }

    // Search using API or local
    async search(term) {
        if (!term || term.length < 2) {
            return this.getAllEntries();
        }

        const searchTerm = term.toLowerCase();

        // Try API search first if Supabase is available
        if (this.useSupabase) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/search?q=${encodeURIComponent(term)}&limit=50`);
                if (response.ok) {
                    const data = await response.json();
                    return data.results.map(entry => ({
                        ...entry,
                        key: entry.id,
                        example: entry.examples?.[0] || '',
                        audioExample: entry.audio_example || entry.examples?.[0] || entry.pidgin
                    }));
                }
            } catch (error) {
                console.warn('API search failed, using local search');
            }
        }

        // Local search fallback
        return this.entries.filter(entry =>
            entry.pidgin.toLowerCase().includes(searchTerm) ||
            (Array.isArray(entry.english) && entry.english.some(eng => eng.toLowerCase().includes(searchTerm))) ||
            (entry.examples && entry.examples.some(ex => ex.toLowerCase().includes(searchTerm)))
        );
    }

    // Get all entries
    getAllEntries() {
        return this.entries;
    }

    // Get entries by category
    getByCategory(category) {
        if (category === 'all') return this.getAllEntries();
        return this.entries.filter(entry => entry.category === category);
    }

    // Get entries by letter
    getByLetter(letter) {
        const letterLower = letter.toLowerCase();
        return this.entries.filter(entry =>
            entry.pidgin.toLowerCase().startsWith(letterLower)
        );
    }

    // Get entry by ID
    getById(id) {
        return this.entries.find(entry => entry.id === id || entry.key === id);
    }

    // Get random entries
    async getRandomEntries(count = 5, difficulty = null) {
        // Try API first
        if (this.useSupabase) {
            try {
                let url = `${this.apiBaseUrl}/random?count=${count}`;
                if (difficulty) url += `&difficulty=${difficulty}`;

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    return data.entries.map(entry => ({
                        ...entry,
                        key: entry.id,
                        example: entry.examples?.[0] || '',
                        audioExample: entry.audio_example || entry.examples?.[0] || entry.pidgin
                    }));
                }
            } catch (error) {
                console.warn('API random failed, using local');
            }
        }

        // Local fallback
        let pool = this.entries;
        if (difficulty) {
            pool = pool.filter(e => e.difficulty === difficulty);
        }

        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    // Get single random entry
    getRandomEntry() {
        return this.entries[Math.floor(Math.random() * this.entries.length)];
    }

    // Get entries by difficulty
    getByDifficulty(difficulty) {
        return this.entries.filter(entry => entry.difficulty === difficulty);
    }

    // Get entries by frequency
    getByFrequency(frequency) {
        return this.entries.filter(entry => entry.frequency === frequency);
    }

    // Get pronunciation
    getPronunciation(word) {
        const entry = this.entries.find(e => e.pidgin.toLowerCase() === word.toLowerCase());
        return entry?.pronunciation || null;
    }

    // Get categories
    getCategories() {
        if (this.stats?.byCategory) {
            return this.stats.byCategory;
        }

        // Build from entries
        const categories = {};
        this.entries.forEach(entry => {
            if (entry.category) {
                categories[entry.category] = (categories[entry.category] || 0) + 1;
            }
        });
        return categories;
    }

    // Get metadata
    getMetadata() {
        return this.data?.metadata || {
            totalEntries: this.entries.length,
            source: this.useSupabase ? 'supabase' : 'json'
        };
    }

    // Get total count
    getTotalCount() {
        return this.entries.length;
    }

    // Fuzzy search with scoring
    fuzzySearch(term, threshold = 0.3) {
        const searchTerm = term.toLowerCase();
        const results = [];

        this.entries.forEach(entry => {
            let score = 0;

            if (entry.pidgin.toLowerCase() === searchTerm) {
                score = 1.0;
            } else if (entry.pidgin.toLowerCase().includes(searchTerm)) {
                score = 0.7;
            }

            if (Array.isArray(entry.english)) {
                entry.english.forEach(eng => {
                    if (eng.toLowerCase() === searchTerm) {
                        score = Math.max(score, 0.9);
                    } else if (eng.toLowerCase().includes(searchTerm)) {
                        score = Math.max(score, 0.6);
                    }
                });
            }

            if (score >= threshold) {
                results.push({ entry, score });
            }
        });

        return results.sort((a, b) => b.score - a.score).map(r => r.entry);
    }

    // Get translations (for translator compatibility)
    getTranslations() {
        const translations = {
            englishToPidgin: {},
            pidginToEnglish: {}
        };

        this.entries.forEach(entry => {
            if (Array.isArray(entry.english)) {
                entry.english.forEach(eng => {
                    const engLower = eng.toLowerCase();
                    if (!translations.englishToPidgin[engLower]) {
                        translations.englishToPidgin[engLower] = [];
                    }
                    translations.englishToPidgin[engLower].push({
                        pidgin: entry.pidgin,
                        confidence: 1.0,
                        id: entry.id
                    });
                });
            }

            translations.pidginToEnglish[entry.pidgin.toLowerCase()] = entry.english;
        });

        return translations;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Create global instance
const supabaseDataLoader = new SupabaseDataLoader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        supabaseDataLoader.autoLoad().then(() => {
            window.dispatchEvent(new Event('pidginDataLoaded'));
        }).catch(error => {
            console.error('Failed to auto-load data:', error);
        });
    });
} else {
    supabaseDataLoader.autoLoad().then(() => {
        window.dispatchEvent(new Event('pidginDataLoaded'));
    }).catch(error => {
        console.error('Failed to auto-load data:', error);
    });
}

// Make available globally (replacing old loader)
window.supabaseDataLoader = supabaseDataLoader;
window.pidginDataLoader = supabaseDataLoader; // Backward compatibility alias
