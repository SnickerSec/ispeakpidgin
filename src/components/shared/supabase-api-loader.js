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
            id: q.id,
            question: q.question,
            questionType: q.question_type || q.questionType || 'multiple_choice',
            options: q.options || [],
            correctAnswer: q.correct_answer || q.correctAnswer,
            explanation: q.explanation,
            description: q.explanation, // Alias for compatibility
            image: q.image || '❓', // Default emoji
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
    // WORDLE API
    // ============================================

    async loadWordleWords(options = {}) {
        try {
            const data = await this.fetchWithCache('/wordle/words', { params: options });
            return this.transformWordleWordsResponse(data);
        } catch (error) {
            console.warn('Falling back to local wordle words');
            return this.getLocalWordleWords();
        }
    }

    async getDailyWordleWord() {
        try {
            const data = await this.fetchWithCache('/wordle/daily');
            return {
                word: data.word,
                meaning: data.meaning,
                pronunciation: data.pronunciation,
                difficulty: data.difficulty,
                date: data.date,
                dayNumber: this.calculateDayNumber(data.date)
            };
        } catch (error) {
            console.warn('Falling back to local daily wordle word');
            const local = this.getLocalWordleWords();
            return this.getDailyWordFromLocal(local.words || []);
        }
    }

    async validateWordleWord(word) {
        try {
            const data = await this.fetchWithCache(`/wordle/validate/${word.toUpperCase()}`);
            return data.valid || false;
        } catch (error) {
            console.warn('Falling back to local word validation');
            const local = this.getLocalWordleWords();
            return (local.words || []).some(w => w.toUpperCase() === word.toUpperCase());
        }
    }

    transformWordleWordsResponse(data) {
        const words = data.words || data;
        return {
            words: Array.isArray(words) ? words : [],
            metadata: data.metadata
        };
    }

    getLocalWordleWords() {
        if (typeof pidginWordleData !== 'undefined' && pidginWordleData.words) {
            return { words: pidginWordleData.words };
        }
        if (typeof window !== 'undefined' && window.pidginWordleData?.words) {
            return { words: window.pidginWordleData.words };
        }
        return { words: [] };
    }

    getDailyWordFromLocal(words) {
        if (words.length === 0) return null;
        const today = new Date();
        const dayNumber = this.calculateDayNumber();
        const wordIndex = dayNumber % words.length;
        return {
            word: words[wordIndex],
            dayNumber: dayNumber,
            date: today.toISOString().split('T')[0]
        };
    }

    calculateDayNumber(dateString) {
        // Calculate day number from epoch (Jan 1, 2024 as day 1)
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
        try {
            const data = await this.fetchWithCache('/crossword/puzzles', { params: options });
            return this.transformCrosswordPuzzlesResponse(data);
        } catch (error) {
            console.warn('Falling back to local crossword puzzles');
            return this.getLocalCrosswordPuzzles();
        }
    }

    async getDailyCrosswordPuzzle() {
        try {
            const data = await this.fetchWithCache('/crossword/daily');
            return this.transformCrosswordPuzzle(data.puzzle || data);
        } catch (error) {
            console.warn('Falling back to local daily puzzle');
            const local = this.getLocalCrosswordPuzzles();
            return this.getDailyPuzzleFromLocal(local.puzzles || []);
        }
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

    getLocalCrosswordPuzzles() {
        if (typeof crosswordPuzzles !== 'undefined') {
            return { puzzles: crosswordPuzzles };
        }
        if (typeof window !== 'undefined' && window.crosswordPuzzles) {
            return { puzzles: window.crosswordPuzzles };
        }
        return { puzzles: [] };
    }

    getDailyPuzzleFromLocal(puzzles) {
        if (puzzles.length === 0) return null;
        const today = new Date();
        const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
        const puzzleIndex = daysSinceEpoch % puzzles.length;
        return puzzles[puzzleIndex];
    }

    // ============================================
    // PICKUP LINE COMPONENTS API
    // ============================================

    async loadPickupLineComponents(options = {}) {
        try {
            const data = await this.fetchWithCache('/pickup-components', { params: options });
            return this.transformPickupComponentsResponse(data);
        } catch (error) {
            console.warn('Falling back to local pickup line components');
            return this.getLocalPickupLineComponents();
        }
    }

    async getRandomPickupLineComponents(options = {}) {
        try {
            const data = await this.fetchWithCache('/pickup-components/random', { params: options });
            return this.transformPickupComponentsResponse(data);
        } catch (error) {
            console.warn('Falling back to local random components');
            return this.getLocalPickupLineComponents();
        }
    }

    transformPickupComponentsResponse(data) {
        // Check if data has pre-grouped components (from API)
        if (data.grouped) {
            return {
                components: {
                    openers: data.grouped.opener || [],
                    compliments: data.grouped.compliment || [],
                    actions: data.grouped.action || [],
                    completedLines: data.grouped.complete || [],
                    prettyPhrases: data.grouped.flavor || {},
                    placesToEat: data.grouped.places_to_eat || [],
                    landmarks: data.grouped.landmark || [],
                    hikingTrails: data.grouped.hiking_trail || []
                },
                metadata: data.metadata || { count: data.count }
            };
        }

        // Fallback: transform array of components
        const components = data.components || data;
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

        if (Array.isArray(components)) {
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
        } else {
            // Already grouped (local fallback)
            grouped.openers = components.openers || [];
            grouped.compliments = components.compliments || [];
            grouped.actions = components.actions || [];
            grouped.completedLines = components.completedLines || components.complete_lines || [];
            grouped.prettyPhrases = components.prettyPhrases || {};
            grouped.placesToEat = components.placesToEat || [];
            grouped.landmarks = components.landmarks || [];
            grouped.hikingTrails = components.hikingTrails || [];
        }

        return { components: grouped, metadata: data.metadata };
    }

    getLocalPickupLineComponents() {
        if (typeof pickupLineComponents !== 'undefined') {
            return { components: pickupLineComponents };
        }
        if (typeof window !== 'undefined' && window.pickupLineComponents) {
            return { components: window.pickupLineComponents };
        }
        return { components: { openers: [], compliments: [], actions: [], completedLines: [] } };
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
