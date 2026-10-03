// Supabase Data Loader - Optimized Version with IndexedDB Caching
// Single-request loading with persistent client-side caching
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
        this.cacheKey = 'pidgin_dictionary_master';
        this.cacheVersion = 'v3'; // Upgraded to v3 for IndexedDB
        
        // Backward compatibility
        this.isNewSystem = true;
        this.legacyMode = false;
        this.viewType = 'dictionary';
    }

    /**
     * Main initialization - loads from cache or API
     * Optimized for instant start from persistent cache
     */
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

        // 1. Try to load from persistent IndexedDB cache first (instant)
        const cached = await this._getFromCache();
        
        if (cached) {
            console.log(`📦 Loaded from persistent cache in ${Math.round(performance.now() - startTime)}ms`);
            this._hydrateFromCache(cached);
            
            // Background sync check (don't block the UI)
            this._syncWithServer(cached.stats?.lastUpdated);
            
            return this.data;
        }

        // 2. No cache found, load from API (first time or cache cleared)
        console.log('📡 No cache found, fetching from API...');
        await this.loadFromSupabase();
        return this.data;
    }

    /**
     * Checks if server has newer data and updates if needed
     * @param {string} cachedLastUpdated - Timestamp of local cache
     */
    async _syncWithServer(cachedLastUpdated) {
        try {
            // Check stats endpoint for latest update timestamp
            const response = await fetch(`${this.apiBaseUrl}/stats`);
            if (!response.ok) return;
            
            const stats = await response.json();
            const serverLastUpdated = stats.lastUpdated;

            // If server has newer data, re-fetch everything in background
            if (serverLastUpdated && cachedLastUpdated !== serverLastUpdated) {
                console.log('🔄 Server has newer data, updating cache...');
                await this.loadFromSupabase();
                // Dispatch event so UI can refresh if it wants to
                window.dispatchEvent(new Event('pidginDataUpdated'));
            }
        } catch (e) {
            console.warn('Sync check failed (likely offline):', e.message);
        }
    }

    // Check IndexedDB cache
    async _getFromCache() {
        try {
            if (!window.dictionaryCache) {
                console.warn('DictionaryCache not initialized');
                return null;
            }

            const cached = await window.dictionaryCache.get(this.cacheKey);
            if (!cached) return null;

            // Check version
            if (cached.version !== this.cacheVersion) {
                console.log('⚠️ Cache version mismatch, invalidating...');
                await window.dictionaryCache.delete(this.cacheKey);
                return null;
            }

            return cached.data;
        } catch (e) {
            console.warn('Cache read error:', e);
            return null;
        }
    }

    // Save to IndexedDB cache
    async _saveToCache(data) {
        try {
            if (!window.dictionaryCache) return;

            const cacheObj = {
                version: this.cacheVersion,
                timestamp: Date.now(),
                data: data
            };
            await window.dictionaryCache.set(this.cacheKey, cacheObj);
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

        // Try bulk endpoint
        try {
            const response = await fetch(`${this.apiBaseUrl}/all`);
            if (response.ok) {
                data = await response.json();
            } else {
                throw new Error(`Bulk endpoint returned ${response.status}`);
            }
        } catch (bulkError) {
            console.warn('Bulk endpoint failed, falling back to paginated:', bulkError.message);
            data = await this._loadPaginated();
        }

        if (!data || !data.entries || data.entries.length === 0) {
            throw new Error('Failed to load dictionary data');
        }

        // Save to persistent cache
        await this._saveToCache(data);

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
        return this.data;
    }

    // Fallback: Load data using paginated endpoint
    async _loadPaginated() {
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
    search(term) {
        if (!term || term.length < 2) {
            return this.getAllEntries();
        }

        let normalizedTerm = term.toLowerCase().trim();
        // Map common search misspellings/variations
        if (normalizedTerm === 'kakua' || normalizedTerm === 'kakua kakua') {
            normalizedTerm = 'kokua';
        }

        // Use local fuzzy search for instant results
        return this.fuzzySearch(normalizedTerm);
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
    getRandomEntries(count = 5, difficulty = null) {
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

    // Whether an English meaning should translate to this entry. Entries whose origin
    // says they come from ʻŌlelo Hawaiʻi (maika'i, 'ae, nani...) are Hawaiian, not Pidgin,
    // so they only count for the pairs Pidgin speakers really use mid-sentence.
    isPidginUsage(entry, english) {
        // source_language comes from migration 018; before it is applied, fall back to origin text
        const isHawaiian = entry.source_language
            ? entry.source_language === 'hawaiian'
            : /hawaiian language|from hawaiian|ʻōlelo|olelo hawai/i.test(entry.origin || '');
        if (!isHawaiian) return true;
        const pidgin = String(entry.pidgin).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f'ʻ‘’]/g, '');
        const allowed = SupabaseDataLoader.PIDGIN_HAWAIIAN_LOANWORDS[pidgin];
        return Boolean(allowed && allowed.includes(String(english).toLowerCase().trim()));
    }

    // Entries ordered most-common first, so translation lookups that take the first
    // candidate prefer "no worries" (very high) over "for no worries" (medium)
    getEntriesByFrequency() {
        const rank = { 'very_high': 4, 'very high': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const score = entry => rank[String(entry.frequency).toLowerCase()] || 2;
        return [...this.entries].sort((a, b) => score(b) - score(a));
    }

    // Get translations (for translator compatibility)
    getTranslations() {
        const translations = {
            englishToPidgin: {},
            pidginToEnglish: {}
        };

        this.getEntriesByFrequency().forEach(entry => {
            if (Array.isArray(entry.english)) {
                entry.english.forEach(eng => {
                    if (!this.isPidginUsage(entry, eng)) return;
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

    /**
     * Clear all caches (Persistent + RAM)
     */
    async clearCache() {
        this.cache.clear();
        if (window.dictionaryCache) {
            await window.dictionaryCache.clear();
        }
    }

    // Force refresh from API
    async refresh() {
        await this.clearCache();
        this.loaded = false;
        return this.autoLoad();
    }
}

// Create global instance
const supabaseDataLoader = new SupabaseDataLoader();

/**
 * Handle data loading and events
 */
async function initializeDataLoader() {
    try {
        await supabaseDataLoader.autoLoad();
        window.dispatchEvent(new Event('pidginDataLoaded'));
    } catch (error) {
        console.error('Failed to auto-load data:', error);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDataLoader);
} else {
    initializeDataLoader();
}

// Make available globally
window.supabaseDataLoader = supabaseDataLoader;
// Hawaiian loanwords that are everyday Pidgin, keyed by the word with ʻokina and
// macrons stripped, listing the English meanings they may translate.
SupabaseDataLoader.PIDGIN_HAWAIIAN_LOANWORDS = {
    'mahalo': ['thank you', 'thanks'],
    'keiki': ['child', 'children', 'kid', 'kids'],
    'ono': ['delicious', 'tasty'],
    'pau': ['finished', 'done', 'completed'],
    'pau hana': ['after work', 'finished work'],
    'kokua': ['help', 'assistance', 'cooperation'],
    'wiki wiki': ['hurry', 'hurry up', 'quick', 'quickly', 'fast'],
    'ohana': ['family', 'extended family'],
    'puka': ['hole', 'opening'],
    'pilau': ['stinky', 'smelly', 'rotten'],
    'aloha': ['hello', 'goodbye'],
    'a hui hou': ['goodbye', 'until we meet again', 'see you later'],
    'hana hou': ['encore', 'do it again', 'one more time'],
    'akamai': ['smart', 'clever', 'intelligent'],
    'haole': ['white person', 'foreigner'],
    'hapa': ['half', 'mixed race'],
    'huhu': ['angry', 'upset'],
    'kolohe': ['mischievous'],
    'lolo': ['crazy', 'stupid'],
    'pupule': ['crazy', 'insane'],
    'opu': ['stomach', 'tummy'],
    'pilikia': ['trouble', 'problem'],
    'niele': ['nosy'],
    'lanai': ['porch', 'balcony', 'patio', 'veranda'],
    'pupu': ['appetizer', 'snacks', 'snack'],
    'kuleana': ['responsibility'],
    'malihini': ['newcomer', 'tourist'],
    'kamaaina': ['local resident', 'longtime resident'],
    'mauka': ['toward the mountains'],
    'makai': ['toward the ocean'],
    'manini': ['stingy'],
    'poho': ['waste', 'a pity', 'loss'],
    'hemo': ['remove', 'take off'],
    'huli': ['to turn', 'flip'],
    'lua': ['toilet', 'bathroom'],
    'kapakahi': ['crooked'],
    'tutu': ['grandmother', 'grandparent'],
    'puuwai': ['heart', 'feelings', 'affection']
};

window.pidginDataLoader = supabaseDataLoader; // Backward compatibility alias
