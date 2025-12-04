// Supabase Data Loader - Optimized Version
// Single-request loading with client-side caching
class SupabaseDataLoader {
    constructor() {
        this.data = null;
        this.entries = [];
        this.loaded = false;
        this.loading = false;
        this.loadPromise = null;
        this.cache = new Map();
        this.apiBaseUrl = '/api/dictionary';
        this.useSupabase = true;
        this.stats = null;
        this.categories = [];

        // Cache configuration
        this.cacheKey = 'pidgin_dictionary_cache';
        this.cacheVersion = 'v2';
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes client-side cache

        // Backward compatibility
        this.isNewSystem = true;
        this.legacyMode = false;
        this.viewType = 'dictionary';
    }

    // Main initialization - loads from cache or API
    async autoLoad() {
        // If already loaded, return immediately
        if (this.loaded) {
            return this.data;
        }

        // If currently loading, wait for that promise
        if (this.loading && this.loadPromise) {
            return this.loadPromise;
        }

        this.loading = true;
        this.loadPromise = this._doLoad();

        try {
            const result = await this.loadPromise;
            return result;
        } finally {
            this.loading = false;
        }
    }

    async _doLoad() {
        const startTime = performance.now();

        // Try to load from sessionStorage cache first
        const cached = this._getFromCache();
        if (cached) {
            this._hydrateFromCache(cached);
            console.log(`⚡ Loaded ${this.entries.length} entries from cache in ${(performance.now() - startTime).toFixed(0)}ms`);
            return this.data;
        }

        // Load from API (single request)
        console.log('🔄 Loading from Supabase API...');
        await this.loadFromSupabase();
        console.log(`✅ Loaded ${this.entries.length} entries from API in ${(performance.now() - startTime).toFixed(0)}ms`);
        return this.data;
    }

    // Check sessionStorage cache
    _getFromCache() {
        try {
            const cacheData = sessionStorage.getItem(this.cacheKey);
            if (!cacheData) return null;

            const parsed = JSON.parse(cacheData);

            // Check version and TTL
            if (parsed.version !== this.cacheVersion) return null;
            if (Date.now() - parsed.timestamp > this.cacheTTL) return null;

            return parsed.data;
        } catch (e) {
            console.warn('Cache read error:', e);
            return null;
        }
    }

    // Save to sessionStorage cache
    _saveToCache(data) {
        try {
            const cacheData = {
                version: this.cacheVersion,
                timestamp: Date.now(),
                data: data
            };
            sessionStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Cache write error:', e);
        }
    }

    // Hydrate loader state from cached data
    _hydrateFromCache(cached) {
        this.entries = cached.entries.map(entry => ({
            ...entry,
            key: entry.id,
            example: entry.examples?.[0] || '',
            audioExample: entry.audio_example || entry.examples?.[0] || entry.pidgin
        }));

        this.stats = cached.stats;
        this.data = {
            entries: this.entries,
            metadata: {
                totalEntries: cached.stats.totalEntries,
                source: 'cache',
                lastUpdated: cached.stats.lastUpdated
            },
            categories: cached.stats.byCategory
        };

        this.categories = Object.keys(cached.stats.byCategory || {});
        this.loaded = true;
    }

    // Load data from Supabase API - SINGLE REQUEST with fallback
    async loadFromSupabase() {
        let data;

        // Try new bulk endpoint first
        try {
            const response = await fetch(`${this.apiBaseUrl}/all`);
            if (response.ok) {
                data = await response.json();
                console.log('✅ Loaded from /all endpoint');
            } else {
                throw new Error(`Bulk endpoint returned ${response.status}`);
            }
        } catch (bulkError) {
            console.warn('⚠️ Bulk endpoint failed, falling back to paginated:', bulkError.message);
            data = await this._loadPaginated();
        }

        if (!data || !data.entries || data.entries.length === 0) {
            throw new Error('Failed to load dictionary data');
        }

        // Save to cache before processing
        this._saveToCache(data);

        // Transform entries
        this.entries = data.entries.map(entry => ({
            ...entry,
            key: entry.id,
            example: entry.examples?.[0] || '',
            audioExample: entry.audio_example || entry.examples?.[0] || entry.pidgin
        }));

        this.stats = data.stats;

        // Build data structure for compatibility
        this.data = {
            entries: this.entries,
            metadata: {
                totalEntries: data.stats.totalEntries,
                source: 'supabase',
                lastUpdated: data.stats.lastUpdated
            },
            categories: data.stats.byCategory
        };

        this.categories = Object.keys(data.stats.byCategory || {});
        this.loaded = true;

        console.log(`📊 Loaded ${this.entries.length} entries from Supabase`);
        return this.data;
    }

    // Fallback: Load data using paginated endpoint
    async _loadPaginated() {
        console.log('🔄 Loading with paginated fallback...');

        // First get stats to know total count
        const statsResponse = await fetch(`${this.apiBaseUrl}/stats`);
        if (!statsResponse.ok) throw new Error('Stats endpoint failed');
        const stats = await statsResponse.json();

        // Load all entries (paginated)
        const allEntries = [];
        const pageSize = 100;
        const totalPages = Math.ceil(stats.totalEntries / pageSize);

        for (let page = 1; page <= totalPages; page++) {
            const response = await fetch(`${this.apiBaseUrl}?page=${page}&limit=${pageSize}`);
            if (!response.ok) throw new Error(`Failed to fetch page ${page}`);
            const pageData = await response.json();
            allEntries.push(...pageData.entries);
        }

        console.log(`✅ Loaded ${allEntries.length} entries via pagination`);

        return {
            entries: allEntries,
            stats: {
                totalEntries: stats.totalEntries,
                byCategory: stats.byCategory,
                lastUpdated: stats.lastUpdated || new Date().toISOString()
            }
        };
    }

    // Search using local data (faster than API for already-loaded data)
    async search(term) {
        if (!term || term.length < 2) {
            return this.getAllEntries();
        }

        // Use local fuzzy search for instant results
        return this.fuzzySearch(term);
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

    // Get random entries (local)
    async getRandomEntries(count = 5, difficulty = null) {
        let pool = this.entries;
        if (difficulty) {
            pool = pool.filter(e => e.difficulty === difficulty);
        }

        // Shuffle and take count
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

    // Fuzzy search with scoring (optimized)
    fuzzySearch(term, threshold = 0.3) {
        const searchTerm = term.toLowerCase();
        const results = [];

        for (const entry of this.entries) {
            let score = 0;
            const pidginLower = entry.pidgin.toLowerCase();

            // Exact match on pidgin
            if (pidginLower === searchTerm) {
                score = 1.0;
            }
            // Starts with (high priority)
            else if (pidginLower.startsWith(searchTerm)) {
                score = 0.85;
            }
            // Contains in pidgin
            else if (pidginLower.includes(searchTerm)) {
                score = 0.7;
            }

            // Check English translations
            if (Array.isArray(entry.english)) {
                for (const eng of entry.english) {
                    const engLower = eng.toLowerCase();
                    if (engLower === searchTerm) {
                        score = Math.max(score, 0.9);
                    } else if (engLower.startsWith(searchTerm)) {
                        score = Math.max(score, 0.75);
                    } else if (engLower.includes(searchTerm)) {
                        score = Math.max(score, 0.6);
                    }
                }
            }

            if (score >= threshold) {
                results.push({ entry, score });
            }
        }

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);
        return results.map(r => r.entry);
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

    // Clear all caches
    clearCache() {
        this.cache.clear();
        try {
            sessionStorage.removeItem(this.cacheKey);
        } catch (e) {
            // Ignore
        }
    }

    // Force refresh from API
    async refresh() {
        this.clearCache();
        this.loaded = false;
        return this.autoLoad();
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
