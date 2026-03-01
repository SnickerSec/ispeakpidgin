// Enhanced Data Loader V2 - Supports new consolidated data structure
class PidginDataLoader {
    constructor() {
        this.data = null;
        this.loaded = false;
        this.cache = new Map();
        this.viewType = null; // dictionary, translator, learning
        this.searchIndex = null;
        this.pronunciationMap = null;
        this.masterData = null; // Complete master data including stories

        // Backward compatibility flags
        this.isNewSystem = false;
        this.legacyMode = false;
    }

    // Auto-detect and load appropriate data source
    async autoLoad() {
        // Try new structure first
        try {
            // Check which page we're on to load appropriate view
            const path = window.location.pathname;

            if (path.includes('dictionary')) {
                await this.loadView('dictionary');
            } else if (path.includes('translator')) {
                await this.loadView('translator');
            } else {
                // Default to dictionary view for homepage
                await this.loadView('dictionary');
            }

            // Load indexes for enhanced functionality
            await this.loadIndexes();

            // Load master data (includes stories and complete dataset)
            await this.loadMasterData();

            this.isNewSystem = true;
            return this.data;

        } catch (error) {
            // Fall back to old structure
            return await this.loadLegacy();
        }
    }

    // Load specific view from new structure
    async loadView(viewType = 'dictionary') {
        const viewUrls = {
            'dictionary': 'data/views/dictionary.json',
            'translator': 'data/views/translator.json',
            'learning': 'data/views/learning.json',
            'master': 'data/master/pidgin-master.json' // For admin/development
        };

        const url = viewUrls[viewType];
        if (!url) {
            throw new Error(`Unknown view type: ${viewType}`);
        }

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.data = await response.json();
            this.viewType = viewType;
            this.loaded = true;
            this.isNewSystem = true;

            return this.data;
        } catch (error) {
            console.error(`Failed to load ${viewType} view:`, error);
            throw error;
        }
    }

    // Load master data including stories and complete dataset
    async loadMasterData() {
        try {
            const response = await fetch('data/master/pidgin-master.json');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.masterData = await response.json();
            return this.masterData;
        } catch (error) {
            console.warn('Master data not loaded:', error);
            return null;
        }
    }

    // Load search and pronunciation indexes
    async loadIndexes() {
        try {
            // Load search index
            const searchResponse = await fetch('data/indexes/search-index.json');
            if (searchResponse.ok) {
                this.searchIndex = await searchResponse.json();
            }

            // Load pronunciation map
            const pronResponse = await fetch('data/indexes/pronunciation-map.json');
            if (pronResponse.ok) {
                this.pronunciationMap = await pronResponse.json();
            }
        } catch (error) {
            console.warn('Indexes not loaded:', error);
        }
    }

    // Legacy loader for backward compatibility
    async loadLegacy(url = 'data/dictionary/pidgin-dictionary.json') {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const legacyData = await response.json();

            // Transform to new structure for consistency
            this.data = {
                metadata: legacyData.metadata,
                entries: legacyData.entries,
                categories: legacyData.categories
            };

            this.loaded = true;
            this.legacyMode = true;
            this.isNewSystem = false;

            return this.data;
        } catch (error) {
            console.error('Failed to load legacy pidgin data:', error);
            throw error;
        }
    }

    // Get all entries (works with both structures)
    getAllEntries() {
        if (!this.loaded) throw new Error('Data not loaded yet');

        // Handle different view types
        if (this.viewType === 'translator') {
            // Translator view doesn't have entries, return empty array
            return [];
        }

        return this.data.entries || [];
    }

    // Get entries by category
    getByCategory(category) {
        if (category === 'all') return this.getAllEntries();
        return this.getAllEntries().filter(entry => entry.category === category);
    }

    // Enhanced search with index support
    search(term) {
        const searchTerm = term.toLowerCase();

        // Use search index if available
        if (this.searchIndex && this.searchIndex.terms) {
            const indexResults = this.searchIndex.terms[searchTerm];
            if (indexResults) {
                // Map index results to actual entries
                const entryIds = new Set(indexResults.map(r => r.id));
                return this.getAllEntries().filter(entry => entryIds.has(entry.id));
            }
        }

        // Fallback to regular search
        return this.getAllEntries().filter(entry =>
            entry.pidgin.toLowerCase().includes(searchTerm) ||
            entry.english.some(eng => eng.toLowerCase().includes(searchTerm)) ||
            (entry.examples && entry.examples.some(ex => ex.toLowerCase().includes(searchTerm))) ||
            (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    // Get translation mappings (for translator)
    getTranslations() {
        if (!this.loaded) throw new Error('Data not loaded yet');

        // Return translations if available (new structure)
        if (this.data.translations) {
            return this.data.translations;
        }

        // Build translations from entries (legacy)
        const translations = {
            englishToPidgin: {},
            pidginToEnglish: {}
        };

        this.getAllEntries().forEach(entry => {
            // English to Pidgin
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

            // Pidgin to English
            translations.pidginToEnglish[entry.pidgin.toLowerCase()] = entry.english;
        });

        return translations;
    }

    // Get pronunciation for a word
    getPronunciation(word) {
        const wordLower = word.toLowerCase();

        // Use pronunciation map if available
        if (this.pronunciationMap) {
            return this.pronunciationMap[wordLower];
        }

        // Fallback to searching entries
        const entry = this.getAllEntries().find(e =>
            e.pidgin.toLowerCase() === wordLower
        );

        return entry?.pronunciation || null;
    }

    // Get phrases by category (for learning view)
    getPhrases(category = 'all') {
        if (!this.loaded) throw new Error('Data not loaded yet');

        if (this.data.phrases) {
            if (category === 'all') {
                // Flatten all phrase categories
                return Object.values(this.data.phrases).flat();
            }
            return this.data.phrases[category] || [];
        }

        return [];
    }

    // Get stories (for learning view)
    getStories() {
        if (!this.loaded) throw new Error('Data not loaded yet');
        return this.data.stories || this.data.content?.stories || [];
    }

    // Get categories
    getCategories() {
        if (!this.loaded) throw new Error('Data not loaded yet');
        return this.data.categories || {};
    }

    // Get metadata
    getMetadata() {
        if (!this.loaded) throw new Error('Data not loaded yet');
        return this.data.metadata || {};
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get entry by ID
    getById(id) {
        return this.getAllEntries().find(entry => entry.id === id);
    }

    // Get random entry
    getRandomEntry() {
        const entries = this.getAllEntries();
        return entries[Math.floor(Math.random() * entries.length)];
    }

    // Get entries by difficulty
    getByDifficulty(difficulty) {
        return this.getAllEntries().filter(entry => entry.difficulty === difficulty);
    }

    // Get entries by frequency
    getByFrequency(frequency) {
        return this.getAllEntries().filter(entry => entry.frequency === frequency);
    }

    // Get entries starting with letter
    getByLetter(letter) {
        const letterLower = letter.toLowerCase();
        return this.getAllEntries().filter(entry =>
            entry.pidgin.toLowerCase().startsWith(letterLower)
        );
    }

    // Fuzzy search with scoring
    fuzzySearch(term, threshold = 0.3) {
        const searchTerm = term.toLowerCase();
        const results = [];

        this.getAllEntries().forEach(entry => {
            let score = 0;

            // Exact match scores highest
            if (entry.pidgin.toLowerCase() === searchTerm) {
                score = 1.0;
            } else if (entry.pidgin.toLowerCase().includes(searchTerm)) {
                score = 0.7;
            }

            // Check English translations
            entry.english.forEach(eng => {
                if (eng.toLowerCase() === searchTerm) {
                    score = Math.max(score, 0.9);
                } else if (eng.toLowerCase().includes(searchTerm)) {
                    score = Math.max(score, 0.6);
                }
            });

            if (score >= threshold) {
                results.push({ entry, score });
            }
        });

        return results.sort((a, b) => b.score - a.score).map(r => r.entry);
    }
}

// Create global instance
const pidginDataLoader = new PidginDataLoader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pidginDataLoader.autoLoad().then(() => {
            // Dispatch event when data is loaded
            window.dispatchEvent(new Event('pidginDataLoaded'));
        }).catch(error => {
            console.error('Failed to auto-load data:', error);
        });
    });
} else {
    // DOM already loaded
    pidginDataLoader.autoLoad().then(() => {
        window.dispatchEvent(new Event('pidginDataLoaded'));
    }).catch(error => {
        console.error('Failed to auto-load data:', error);
    });
}

// Make available globally
window.pidginDataLoader = pidginDataLoader;