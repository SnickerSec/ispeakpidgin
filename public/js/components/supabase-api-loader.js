// Supabase API Data Loader
// Unified loader for all Supabase data (stories, phrases, crossword, pickup lines)
// Falls back to local JSON/JS data if API is unavailable

class SupabaseAPILoader {
    constructor() {
        this.apiBase = '/api';
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.useAPI = true;
    }

    // Generic fetch with caching
    async fetchWithCache(endpoint, options = {}) {
        const cacheKey = endpoint + JSON.stringify(options);
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
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
        } catch (error) {
            console.warn(`API fetch failed for ${endpoint}:`, error.message);
            throw error;
        }
    }

    // ============================================
    // STORIES API
    // ============================================

    async loadStories(options = {}) {
        try {
            const data = await this.fetchWithCache('/stories', { params: options });
            return this.transformStoriesResponse(data);
        } catch (error) {
            console.warn('Falling back to local stories data');
            return this.getLocalStories();
        }
    }

    async getStory(id) {
        try {
            const data = await this.fetchWithCache(`/stories/${id}`);
            return this.transformStory(data);
        } catch (error) {
            console.warn('Falling back to local story');
            const local = this.getLocalStories();
            return local.stories.find(s => s.id === id);
        }
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

    getLocalStories() {
        if (typeof pidginStories !== 'undefined') {
            return { stories: pidginStories.stories || pidginStories, metadata: pidginStories.metadata };
        }
        if (typeof window !== 'undefined' && window.pidginStories) {
            const stories = window.pidginStories.stories || window.pidginStories;
            return { stories, metadata: window.pidginStories.metadata };
        }
        return { stories: [], metadata: {} };
    }

    // ============================================
    // PHRASES API
    // ============================================

    async loadPhrases(options = {}) {
        try {
            const data = await this.fetchWithCache('/phrases', { params: options });
            return this.transformPhrasesResponse(data);
        } catch (error) {
            console.warn('Falling back to local phrases data');
            return this.getLocalPhrases();
        }
    }

    async getRandomPhrases(count = 5, category = null) {
        try {
            const params = { count };
            if (category) params.category = category;
            const data = await this.fetchWithCache('/phrases/random', { params });
            return data.phrases || data;
        } catch (error) {
            console.warn('Falling back to local random phrases');
            const local = this.getLocalPhrases();
            const pool = category
                ? local.phrases.filter(p => p.category === category)
                : local.phrases;
            return this.shuffleArray(pool).slice(0, count);
        }
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

    getLocalPhrases() {
        if (typeof pidginPhrases !== 'undefined') {
            return { phrases: pidginPhrases };
        }
        if (typeof window !== 'undefined' && window.pidginPhrases) {
            return { phrases: window.pidginPhrases };
        }
        return { phrases: [] };
    }

    // ============================================
    // CROSSWORD API
    // ============================================

    async loadCrosswordWords(options = {}) {
        try {
            const data = await this.fetchWithCache('/crossword/words', { params: options });
            return this.transformCrosswordResponse(data);
        } catch (error) {
            console.warn('Falling back to local crossword data');
            return this.getLocalCrosswordWords();
        }
    }

    async getRandomCrosswordWords(count = 10, options = {}) {
        try {
            const params = { count, ...options };
            const data = await this.fetchWithCache('/crossword/random', { params });
            return data.words || data;
        } catch (error) {
            console.warn('Falling back to local random crossword words');
            const local = this.getLocalCrosswordWords();
            let pool = local.words || [];
            if (options.difficulty) {
                pool = pool.filter(w => w.difficulty === options.difficulty);
            }
            if (options.minLength) {
                pool = pool.filter(w => (w.length || w.word.length) >= options.minLength);
            }
            if (options.maxLength) {
                pool = pool.filter(w => (w.length || w.word.length) <= options.maxLength);
            }
            return this.shuffleArray(pool).slice(0, count);
        }
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

    getLocalCrosswordWords() {
        if (typeof crosswordWords !== 'undefined') {
            return { words: crosswordWords };
        }
        if (typeof window !== 'undefined' && window.crosswordWords) {
            return { words: window.crosswordWords };
        }
        return { words: [] };
    }

    // ============================================
    // PICKUP LINES API
    // ============================================

    async loadPickupLines(options = {}) {
        try {
            const data = await this.fetchWithCache('/pickup-lines', { params: options });
            return this.transformPickupLinesResponse(data);
        } catch (error) {
            console.warn('Falling back to local pickup lines data');
            return this.getLocalPickupLines();
        }
    }

    async getRandomPickupLines(count = 1, options = {}) {
        try {
            const params = { count, ...options };
            const data = await this.fetchWithCache('/pickup-lines/random', { params });
            return data.lines || data;
        } catch (error) {
            console.warn('Falling back to local random pickup lines');
            const local = this.getLocalPickupLines();
            let pool = local.lines || [];
            if (options.category) {
                pool = pool.filter(l => l.category === options.category);
            }
            if (options.spiciness) {
                pool = pool.filter(l => l.spiciness === options.spiciness);
            }
            return this.shuffleArray(pool).slice(0, count);
        }
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

    getLocalPickupLines() {
        if (typeof pickupLines !== 'undefined') {
            return { lines: pickupLines };
        }
        if (typeof window !== 'undefined' && window.pickupLines) {
            return { lines: window.pickupLines };
        }
        return { lines: [] };
    }

    // ============================================
    // QUIZ API
    // ============================================

    async loadQuizQuestions(options = {}) {
        try {
            const data = await this.fetchWithCache('/quiz/questions', { params: options });
            return this.transformQuizResponse(data);
        } catch (error) {
            console.warn('Falling back to local quiz data');
            return this.getLocalQuizQuestions();
        }
    }

    transformQuizResponse(data) {
        const questions = (data.questions || data).map(q => ({
            question: q.question,
            questionType: q.question_type || q.questionType || 'multiple_choice',
            options: q.options || [],
            correctAnswer: q.correct_answer || q.correctAnswer,
            explanation: q.explanation,
            category: q.category || 'general',
            difficulty: q.difficulty || 'beginner',
            points: q.points || 10,
            tags: q.tags || []
        }));
        return { questions, metadata: data.metadata };
    }

    getLocalQuizQuestions() {
        if (typeof localQuizQuestions !== 'undefined') {
            return { questions: localQuizQuestions };
        }
        if (typeof window !== 'undefined' && window.localQuizQuestions) {
            return { questions: window.localQuizQuestions };
        }
        return { questions: [] };
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
