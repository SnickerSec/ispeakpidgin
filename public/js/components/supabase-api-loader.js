// Supabase API Data Loader
// Unified loader for all Supabase data (stories, phrases, crossword, pickup lines)
// All data is fetched from Supabase API - no local fallbacks

class SupabaseAPILoader {
    constructor() {
        this.apiBase = '/api';
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    // Generic fetch with caching
    async fetchWithCache(endpoint, options = {}) {
        const cacheKey = endpoint + JSON.stringify(options);
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        const url = new URL(this.apiBase + endpoint, window.location.origin);
        if (options.params) {
            Object.entries(options.params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, value);
                }
            });
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    }

    // ============================================
    // STORIES API
    // ============================================

    async loadStories(options = {}) {
        const data = await this.fetchWithCache('/stories', { params: options });
        return this.transformStoriesResponse(data);
    }

    async getStory(id) {
        const data = await this.fetchWithCache(`/stories/${id}`);
        return this.transformStory(data);
    }

    transformStoriesResponse(data) {
        const stories = (data.stories || data).map(s => this.transformStory(s));
        return {
            stories,
            metadata: data.metadata || {
                totalStories: stories.length,
                lastUpdated: new Date().toISOString()
            }
        };
    }

    transformStory(s) {
        return {
            id: s.id,
            title: s.title,
            pidginText: s.pidgin_text || s.pidginText,
            englishTranslation: s.english_translation || s.englishTranslation,
            culturalNotes: s.cultural_notes || s.culturalNotes,
            vocabulary: s.vocabulary || [],
            audioExample: s.audio_example || s.audioExample,
            tags: s.tags || [],
            difficulty: s.difficulty || 'intermediate'
        };
    }

    // ============================================
    // PHRASES API
    // ============================================

    async loadPhrases(options = {}) {
        const data = await this.fetchWithCache('/phrases', { params: options });
        return this.transformPhrasesResponse(data);
    }

    async getRandomPhrases(count = 5, category = null) {
        const params = { count };
        if (category) params.category = category;
        const data = await this.fetchWithCache('/phrases/random', { params });
        return data.phrases || data;
    }

    transformPhrasesResponse(data) {
        const phrases = (data.phrases || data).map(p => ({
            pidgin: p.pidgin,
            english: p.english,
            category: p.category,
            context: p.context,
            pronunciation: p.pronunciation,
            source: p.source,
            difficulty: p.difficulty || 'beginner',
            tags: p.tags || []
        }));
        return { phrases, metadata: data.metadata };
    }

    // ============================================
    // CROSSWORD API
    // ============================================

    async loadCrosswordWords(options = {}) {
        const data = await this.fetchWithCache('/crossword/words', { params: options });
        return this.transformCrosswordResponse(data);
    }

    async getRandomCrosswordWords(count = 10, options = {}) {
        const params = { count, ...options };
        const data = await this.fetchWithCache('/crossword/random', { params });
        return data.words || data;
    }

    transformCrosswordResponse(data) {
        const words = (data.words || data).map(w => ({
            word: w.word,
            displayWord: w.display_word || w.displayWord || w.word,
            clue: w.clue,
            cluePidgin: w.clue_pidgin || w.cluePidgin,
            category: w.category,
            difficulty: w.difficulty || 'beginner',
            length: w.length || w.word.length,
            pronunciation: w.pronunciation,
            example: w.example
        }));
        return { words, metadata: data.metadata };
    }

    // ============================================
    // PICKUP LINES API
    // ============================================

    async loadPickupLines(options = {}) {
        const data = await this.fetchWithCache('/pickup-lines', { params: options });
        return this.transformPickupLinesResponse(data);
    }

    async getRandomPickupLines(count = 1, options = {}) {
        const params = { count, ...options };
        const data = await this.fetchWithCache('/pickup-lines/random', { params });
        return data.lines || data;
    }

    transformPickupLinesResponse(data) {
        const lines = (data.lines || data).map(l => ({
            pidgin: l.pidgin,
            english: l.english,
            category: l.category || 'romantic',
            spiciness: l.spiciness || 2,
            context: l.context,
            tags: l.tags || []
        }));
        return { lines, metadata: data.metadata };
    }

    // ============================================
    // QUIZ API
    // ============================================

    async loadQuizQuestions(options = {}) {
        const data = await this.fetchWithCache('/quiz/questions', { params: options });
        return this.transformQuizResponse(data);
    }

    transformQuizResponse(data) {
        const questions = (data.questions || data).map(q => ({
            id: q.id,
            question: q.question,
            questionType: q.question_type || q.questionType || 'multiple_choice',
            options: q.options || [],
            correctAnswer: q.correct_answer || q.correctAnswer,
            explanation: q.explanation,
            description: q.explanation,
            image: q.image || '<i class="ti ti-question-mark"></i>',
            category: q.category || 'general',
            difficulty: q.difficulty || 'beginner',
            points: q.points || 10,
            tags: q.tags || []
        }));
        return { questions, metadata: data.metadata };
    }

    // ============================================
    // WORDLE API
    // ============================================

    async loadWordleWords(options = {}) {
        const data = await this.fetchWithCache('/wordle/words', { params: options });
        return this.transformWordleWordsResponse(data);
    }

    async getDailyWordleWord() {
        const data = await this.fetchWithCache('/wordle/daily');
        return {
            word: data.word,
            meaning: data.meaning,
            pronunciation: data.pronunciation,
            difficulty: data.difficulty,
            date: data.date,
            dayNumber: this.calculateDayNumber(data.date)
        };
    }

    async validateWordleWord(word) {
        const data = await this.fetchWithCache(`/wordle/validate/${word.toUpperCase()}`);
        return data.valid || false;
    }

    transformWordleWordsResponse(data) {
        const words = data.words || data;
        return {
            words: Array.isArray(words) ? words : [],
            metadata: data.metadata
        };
    }

    calculateDayNumber(dateString) {
        const epoch = new Date('2024-01-01');
        const targetDate = dateString ? new Date(dateString) : new Date();
        const diffTime = targetDate.getTime() - epoch.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    // ============================================
    // CROSSWORD PUZZLES API
    // ============================================

    async loadCrosswordPuzzles(options = {}) {
        const data = await this.fetchWithCache('/crossword/puzzles', { params: options });
        return this.transformCrosswordPuzzlesResponse(data);
    }

    async getDailyCrosswordPuzzle() {
        const data = await this.fetchWithCache('/crossword/daily');
        return this.transformCrosswordPuzzle(data.puzzle || data);
    }

    transformCrosswordPuzzlesResponse(data) {
        const puzzles = (data.puzzles || data).map(p => this.transformCrosswordPuzzle(p));
        return { puzzles, metadata: data.metadata };
    }

    transformCrosswordPuzzle(p) {
        return {
            id: p.puzzle_id || p.id,
            title: p.title,
            description: p.description,
            theme: p.theme,
            difficulty: p.difficulty || 'beginner',
            size: p.grid_size || p.size || 10,
            grid: p.grid || [],
            words: {
                across: p.words_across || p.words?.across || [],
                down: p.words_down || p.words?.down || []
            },
            usedOn: p.used_on || p.usedOn
        };
    }

    // ============================================
    // PICKUP LINE COMPONENTS API
    // ============================================

    async loadPickupLineComponents(options = {}) {
        // Load both pickup components and 808 locations in parallel
        const [componentsData, locationsData] = await Promise.all([
            this.fetchWithCache('/pickup-components', { params: options }),
            this.fetchWithCache('/locations-808', { params: {} })
        ]);
        return this.transformPickupComponentsResponse(componentsData, locationsData);
    }

    async getRandomPickupLineComponents(options = {}) {
        const data = await this.fetchWithCache('/pickup-components/random', { params: options });
        return this.transformPickupComponentsResponse(data, null);
    }

    transformPickupComponentsResponse(data, locationsData) {
        const grouped = {
            openers: [],
            compliments: [],
            actions: [],
            completedLines: [],
            prettyPhrases: {},
            placesToEat: [],
            landmarks: [],
            hikingTrails: []
        };

        // Process pickup components
        if (data.grouped) {
            grouped.openers = data.grouped.opener || [];
            grouped.compliments = data.grouped.compliment || [];
            grouped.actions = data.grouped.action || [];
            grouped.completedLines = data.grouped.complete || [];
            grouped.prettyPhrases = this.transformFlavorToPretyPhrases(data.grouped.flavor || []);
        } else if (Array.isArray(data.components || data)) {
            const components = data.components || data;
            components.forEach(c => {
                const item = {
                    pidgin: c.pidgin || c.pidgin_text,
                    english: c.english || c.english_translation,
                    pronunciation: c.pronunciation,
                    category: c.category,
                    tags: c.tags || []
                };

                const type = c.component_type || c.componentType;
                if (type === 'opener') grouped.openers.push(item);
                else if (type === 'compliment') grouped.compliments.push(item);
                else if (type === 'action') grouped.actions.push(item);
                else if (type === 'complete_line' || type === 'complete') grouped.completedLines.push(item);
            });
        }

        // Process 808 locations from separate table
        if (locationsData && locationsData.grouped) {
            grouped.placesToEat = locationsData.grouped.places_to_eat || [];
            grouped.landmarks = locationsData.grouped.landmark || [];
            grouped.hikingTrails = locationsData.grouped.hiking_trail || [];
        }

        return { components: grouped, metadata: data.metadata || { count: data.count } };
    }

    // Transform flavor components to prettyPhrases grouped by gender
    transformFlavorToPretyPhrases(flavorItems) {
        const prettyPhrases = {
            wahine: [],
            kane: []
        };

        if (Array.isArray(flavorItems)) {
            flavorItems.forEach(item => {
                const phrase = item.pidgin || item;
                // Add to both genders for now (can be refined based on category)
                if (item.category === 'kane') {
                    prettyPhrases.kane.push(phrase);
                } else if (item.category === 'wahine') {
                    prettyPhrases.wahine.push(phrase);
                } else {
                    // Default: add to both
                    prettyPhrases.wahine.push(phrase);
                    prettyPhrases.kane.push(phrase);
                }
            });
        }

        // Add defaults if empty
        if (prettyPhrases.wahine.length === 0) {
            prettyPhrases.wahine = ['You so pretty', 'You stay beautiful', 'You da kine gorgeous'];
        }
        if (prettyPhrases.kane.length === 0) {
            prettyPhrases.kane = ['You so handsome', 'You stay looking sharp', 'You da kine good looking'];
        }

        return prettyPhrases;
    }

    // ============================================
    // DICTIONARY API
    // ============================================

    async loadDictionaryEntries(options = {}) {
        const data = await this.fetchWithCache('/dictionary', { params: options });
        return this.transformDictionaryResponse(data);
    }

    async searchDictionary(query, options = {}) {
        const params = { q: query, ...options };
        const data = await this.fetchWithCache('/dictionary/search', { params });
        return data.results || data;
    }

    async getDictionaryWord(pidginWord) {
        const data = await this.fetchWithCache(`/dictionary/word/${encodeURIComponent(pidginWord)}`);
        return this.transformDictionaryEntry(data);
    }

    async getDictionaryStats() {
        return await this.fetchWithCache('/dictionary/stats');
    }

    async getRandomDictionaryWords(count = 5, difficulty = null) {
        const params = { count };
        if (difficulty) params.difficulty = difficulty;
        const data = await this.fetchWithCache('/dictionary/random', { params });
        return (data.entries || data).map(e => this.transformDictionaryEntry(e));
    }

    transformDictionaryResponse(data) {
        const entries = (data.entries || data).map(e => this.transformDictionaryEntry(e));
        return {
            entries,
            metadata: data.metadata || {
                totalEntries: entries.length,
                lastUpdated: new Date().toISOString()
            }
        };
    }

    transformDictionaryEntry(e) {
        return {
            id: e.id,
            pidgin: e.pidgin,
            english: e.english,
            pronunciation: e.pronunciation,
            category: e.category,
            examples: e.examples || [],
            usage: e.usage,
            origin: e.origin,
            difficulty: e.difficulty || 'beginner',
            frequency: e.frequency || 'medium',
            tags: e.tags || [],
            audioExample: e.audio_example || e.audioExample
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    clearCache() {
        this.cache.clear();
    }
}

// Create global instance
const supabaseAPI = new SupabaseAPILoader();

// Make available globally
if (typeof window !== 'undefined') {
    window.supabaseAPI = supabaseAPI;
}

// For module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseAPILoader, supabaseAPI };
}
