/**
 * Pronunciation Practice Module
 * Uses Web Speech API to listen to user and rate their pronunciation
 */

class PronunciationPractice {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.currentWord = null;
        this.attempts = [];
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.onStartCallback = null;
        this.onEndCallback = null;

        this.initSpeechRecognition();
    }

    /**
     * Initialize Web Speech API
     */
    initSpeechRecognition() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
            this.supported = false;
            return;
        }

        this.supported = true;
        this.recognition = new SpeechRecognition();

        // Configuration
        this.recognition.continuous = false;      // Stop after one result
        this.recognition.interimResults = true;   // Show results as user speaks
        this.recognition.lang = 'en-US';          // Use English (closest to Pidgin)
        this.recognition.maxAlternatives = 3;     // Get multiple interpretations

        // Try to set up grammar list (progressive enhancement - may not work in all browsers)
        this.setupGrammar();

        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('🎤 Listening...');
            if (this.onStartCallback) this.onStartCallback();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('🎤 Stopped listening');
            if (this.onEndCallback) this.onEndCallback();
        };

        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            if (this.onErrorCallback) {
                this.onErrorCallback(event.error);
            }
        };
    }

    /**
     * Set up JSGF grammar for better Pidgin word recognition
     * Note: Browser support is limited, but this is a progressive enhancement
     */
    setupGrammar() {
        const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

        if (!SpeechGrammarList) {
            console.log('SpeechGrammarList not supported - using fallback matching');
            return;
        }

        try {
            this.grammarList = new SpeechGrammarList();
            this.grammarLoaded = false;
            console.log('SpeechGrammarList initialized - will load words from Supabase');
        } catch (error) {
            console.warn('Failed to create SpeechGrammarList:', error);
        }
    }

    /**
     * Load Pidgin words from Supabase and add to grammar
     */
    async loadGrammarFromSupabase() {
        if (!this.grammarList || this.grammarLoaded) {
            return;
        }

        try {
            // Fetch all pidgin words from Supabase
            const response = await fetch(
                'https://jfzgzjgdptowfbtljvyp.supabase.co/rest/v1/dictionary_entries?select=pidgin,pronunciation',
                {
                    headers: {
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmemd6amdkcHRvd2ZidGxqdnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzk0OTMsImV4cCI6MjA3OTk1NTQ5M30.xPubHKR0PFEic52CffEBVCwmfPz-AiqbwFk39ulwydM'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Supabase error: ${response.status}`);
            }

            const entries = await response.json();

            // Build JSGF grammar with all Pidgin words
            // Also include common English equivalents for better recognition
            const words = new Set();

            entries.forEach(entry => {
                // Add the pidgin word
                words.add(entry.pidgin.toLowerCase());

                // Add known English equivalents from our map
                const equivalents = this.pidginToEnglishMap[entry.pidgin.toLowerCase()];
                if (equivalents) {
                    equivalents.forEach(equiv => words.add(equiv.toLowerCase()));
                }
            });

            // Create JSGF grammar string
            const wordList = Array.from(words).join(' | ');
            const grammar = `#JSGF V1.0; grammar pidgin; public <pidgin> = ${wordList};`;

            // Add grammar with high weight (1.0 = highest priority)
            this.grammarList.addFromString(grammar, 1.0);
            this.recognition.grammars = this.grammarList;

            this.grammarLoaded = true;
            console.log(`✅ Loaded ${words.size} words into speech grammar`);

        } catch (error) {
            console.warn('Failed to load grammar from Supabase:', error);
            // Continue without grammar - fallback matching will still work
        }
    }

    /**
     * Check if speech recognition is supported
     */
    isSupported() {
        return this.supported;
    }

    /**
     * Start listening for user speech
     * @param {Object} wordData - The word to practice { pidgin, pronunciation, english }
     */
    async startListening(wordData) {
        if (!this.supported) {
            console.error('Speech recognition not supported');
            return false;
        }

        if (this.isListening) {
            this.stopListening();
        }

        this.currentWord = wordData;

        // Load grammar from Supabase on first use (progressive enhancement)
        await this.loadGrammarFromSupabase();

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start recognition:', error);
            return false;
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Handle speech recognition result
     */
    handleResult(event) {
        const results = event.results[event.results.length - 1];

        if (results.isFinal) {
            // Get all alternatives
            const alternatives = [];
            for (let i = 0; i < results.length; i++) {
                alternatives.push({
                    transcript: results[i].transcript.toLowerCase().trim(),
                    confidence: results[i].confidence
                });
            }

            // Score the pronunciation
            const score = this.scorePronunciation(alternatives);

            // Store attempt
            this.attempts.push({
                word: this.currentWord,
                spoken: alternatives[0].transcript,
                alternatives: alternatives,
                score: score,
                timestamp: new Date()
            });

            // Callback with result
            if (this.onResultCallback) {
                this.onResultCallback(score);
            }
        } else {
            // Interim result - could show live feedback
            const interim = results[0].transcript;
            console.log('Interim:', interim);
        }
    }

    /**
     * Known Pidgin words and their likely English speech recognition equivalents
     * These should count as correct/near-correct pronunciations
     */
    pidginToEnglishMap = {
        'howzit': ["how's it", "how is it", "hows it", "how sit", "howzit"],
        'da kine': ["the kind", "da kine", "the kine", "da kind", "ducane"],
        'brah': ["bra", "bruh", "bro", "brah", "brother"],
        'shoots': ["shoots", "shoot", "suits", "chutes"],
        'pau': ["pow", "pal", "paul", "pao", "pau"],
        'ono': ["oh no", "ono", "oh know"],
        'grindz': ["grinds", "grins", "grands", "grindz"],
        'mahalo': ["mahalo", "my hello", "ma hello"],
        'pau hana': ["pow hana", "pow hannah", "pal hana", "pau hana"],
        'talk story': ["talk story", "talkstory", "talk stories"],
        'broke da mouth': ["broke the mouth", "broke da mouth", "broken mouth"],
        'mo bettah': ["more better", "mo bettah", "more beta", "mo better"],
        'small kine': ["small kind", "small kine", "small can"],
        'chicken skin': ["chicken skin", "chickenskin"],
        'no worry beef curry': ["no worry beef curry", "don't worry beef curry"],
        'hamajang': ["hama jang", "hamajang", "have a junk", "how much on"],
        'ainokea': ["i don't care", "i no care", "eye no care"],
        'lolo': ["lolo", "low low", "lo lo"],
        'rajah dat': ["roger that", "rajah dat", "roger dad"],
        'pupule': ["poopoolay", "poo poo lay", "pupule", "poopoo"]
    };

    /**
     * Score the pronunciation attempt
     * @param {Array} alternatives - Speech recognition alternatives
     * @returns {Object} Score object with details
     */
    scorePronunciation(alternatives) {
        if (!this.currentWord) {
            return { overall: 0, feedback: 'No word to compare' };
        }

        const expected = this.normalizeText(this.currentWord.pidgin);
        const spoken = alternatives[0].transcript;
        const spokenNormalized = this.normalizeText(spoken);

        // Check if this is a known Pidgin word with expected English equivalents
        const knownEquivalents = this.pidginToEnglishMap[expected] ||
                                  this.pidginToEnglishMap[this.currentWord.pidgin.toLowerCase()];

        let isKnownEquivalent = false;
        if (knownEquivalents) {
            for (const equiv of knownEquivalents) {
                if (spokenNormalized === this.normalizeText(equiv) ||
                    spokenNormalized.includes(this.normalizeText(equiv)) ||
                    this.normalizeText(equiv).includes(spokenNormalized)) {
                    isKnownEquivalent = true;
                    break;
                }
            }
            // Also check all alternatives
            for (const alt of alternatives) {
                const altNorm = this.normalizeText(alt.transcript);
                for (const equiv of knownEquivalents) {
                    if (altNorm === this.normalizeText(equiv)) {
                        isKnownEquivalent = true;
                        break;
                    }
                }
            }
        }

        // Calculate various similarity scores
        const exactMatch = spokenNormalized === expected || isKnownEquivalent;
        const levenshteinScore = this.calculateLevenshteinScore(expected, spokenNormalized);
        const phoneticScore = this.calculatePhoneticScore(expected, spokenNormalized);
        const wordMatchScore = this.calculateWordMatchScore(expected, spokenNormalized);

        // Boost score significantly if it's a known equivalent
        const equivalentBonus = isKnownEquivalent ? 40 : 0;

        // Check alternatives for better matches
        let bestAlternativeScore = levenshteinScore;
        let bestAlternative = spoken;

        for (const alt of alternatives) {
            const altNormalized = this.normalizeText(alt.transcript);
            const altScore = this.calculateLevenshteinScore(expected, altNormalized);
            if (altScore > bestAlternativeScore) {
                bestAlternativeScore = altScore;
                bestAlternative = alt.transcript;
            }
        }

        // Weighted overall score with bonus for known equivalents
        const overall = Math.round(
            (bestAlternativeScore * 0.4) +
            (phoneticScore * 0.35) +
            (wordMatchScore * 0.25) +
            equivalentBonus
        );

        // Generate feedback
        const finalScore = Math.min(100, Math.max(0, overall));
        const feedback = this.generateFeedback(expected, spokenNormalized, finalScore, isKnownEquivalent);

        return {
            overall: finalScore,
            exact: exactMatch,
            spoken: spoken,
            expected: this.currentWord.pidgin,
            levenshtein: Math.round(levenshteinScore),
            phonetic: Math.round(phoneticScore),
            wordMatch: Math.round(wordMatchScore),
            feedback: feedback,
            stars: this.getStarRating(finalScore),
            alternatives: alternatives.map(a => a.transcript),
            isKnownEquivalent: isKnownEquivalent
        };
    }

    /**
     * Normalize text for comparison
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/['']/g, "'")      // Normalize apostrophes
            .replace(/[^\w\s']/g, '')   // Remove punctuation except apostrophes
            .replace(/\s+/g, ' ')       // Normalize spaces
            .trim();
    }

    /**
     * Calculate Levenshtein distance score (0-100)
     */
    calculateLevenshteinScore(expected, spoken) {
        const distance = this.levenshteinDistance(expected, spoken);
        const maxLength = Math.max(expected.length, spoken.length);

        if (maxLength === 0) return 100;

        const similarity = 1 - (distance / maxLength);
        return similarity * 100;
    }

    /**
     * Levenshtein distance algorithm
     */
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                        dp[i - 1][j],     // deletion
                        dp[i][j - 1],     // insertion
                        dp[i - 1][j - 1]  // substitution
                    );
                }
            }
        }

        return dp[m][n];
    }

    /**
     * Calculate phonetic similarity score using Soundex-like approach
     */
    calculatePhoneticScore(expected, spoken) {
        const expectedPhonetic = this.toPhonetic(expected);
        const spokenPhonetic = this.toPhonetic(spoken);

        return this.calculateLevenshteinScore(expectedPhonetic, spokenPhonetic);
    }

    /**
     * Simple phonetic encoding for Pidgin
     * Groups similar sounds together
     */
    toPhonetic(text) {
        return text
            .toLowerCase()
            // Pidgin-specific transformations
            .replace(/da\b/g, 'the')        // da -> the
            .replace(/dis/g, 'this')        // dis -> this
            .replace(/dat/g, 'that')        // dat -> that
            .replace(/dey/g, 'they')        // dey -> they
            .replace(/fo['']?\s/g, 'for ')  // fo' -> for
            .replace(/wen\b/g, 'when')      // wen -> when
            .replace(/wea/g, 'where')       // wea -> where
            .replace(/brah/g, 'bra')        // normalize brah
            .replace(/braddah/g, 'brada')   // normalize braddah
            // General phonetic groupings
            .replace(/[aeiou]+/g, 'a')      // Collapse vowels
            .replace(/[bp]/g, 'b')          // b/p similar
            .replace(/[dt]/g, 'd')          // d/t similar
            .replace(/[gkq]/g, 'k')         // g/k/q similar
            .replace(/[sz]/g, 's')          // s/z similar
            .replace(/[fv]/g, 'f')          // f/v similar
            .replace(/[mn]/g, 'm')          // m/n similar
            .replace(/[wy]/g, 'w')          // w/y similar
            .replace(/[lr]/g, 'r')          // l/r similar (important for Pidgin!)
            .replace(/h/g, '')              // h often dropped
            .replace(/\s+/g, '');           // Remove spaces
    }

    /**
     * Calculate word-by-word match score
     */
    calculateWordMatchScore(expected, spoken) {
        const expectedWords = expected.split(/\s+/);
        const spokenWords = spoken.split(/\s+/);

        if (expectedWords.length === 0) return 0;

        let matches = 0;
        let partialMatches = 0;

        for (const expWord of expectedWords) {
            // Check for exact match
            if (spokenWords.includes(expWord)) {
                matches++;
            } else {
                // Check for partial/phonetic match
                for (const spkWord of spokenWords) {
                    const similarity = this.calculateLevenshteinScore(expWord, spkWord);
                    if (similarity > 70) {
                        partialMatches += similarity / 100;
                        break;
                    }
                }
            }
        }

        const totalScore = matches + (partialMatches * 0.7);
        return (totalScore / expectedWords.length) * 100;
    }

    /**
     * Generate human-readable feedback
     */
    generateFeedback(expected, spoken, score, isKnownEquivalent = false) {
        const feedback = [];

        if (score >= 90) {
            feedback.push({
                type: 'success',
                message: isKnownEquivalent
                    ? "Ho, you sound like one local! Da speech system heard English but you said um right! 🤙"
                    : "Ho, you sound like one local! Perfect! 🤙"
            });
        } else if (score >= 75) {
            feedback.push({
                type: 'good',
                message: isKnownEquivalent
                    ? "Solid! We recognized your Pidgin! 🌺"
                    : "Solid! Getting da hang of it! 🌺"
            });
        } else if (score >= 50) {
            feedback.push({
                type: 'ok',
                message: "Not bad, but can be mo' bettah! Keep practicing."
            });
        } else {
            feedback.push({
                type: 'needs_work',
                message: "No worry, try listen again and practice. You got dis!"
            });
        }

        // Specific feedback based on common mistakes
        const expectedWords = expected.split(/\s+/);
        const spokenWords = spoken.split(/\s+/);

        // Check for specific Pidgin pronunciation issues
        if (expected.includes('da') && !spoken.includes('da') && spoken.includes('the')) {
            feedback.push({
                type: 'tip',
                message: "Try say 'da' not 'the' - sounds more local!"
            });
        }

        if (expected.includes('brah') && spoken.includes('bra')) {
            feedback.push({
                type: 'tip',
                message: "'Brah' - make sure get small 'h' sound at da end"
            });
        }

        if (expectedWords.length !== spokenWords.length) {
            if (spokenWords.length > expectedWords.length) {
                feedback.push({
                    type: 'tip',
                    message: "Try say um faster, all one flow"
                });
            } else {
                feedback.push({
                    type: 'tip',
                    message: "Missing some words - try again slower"
                });
            }
        }

        return feedback;
    }

    /**
     * Convert score to star rating (1-5)
     */
    getStarRating(score) {
        if (score >= 90) return 5;
        if (score >= 75) return 4;
        if (score >= 60) return 3;
        if (score >= 40) return 2;
        return 1;
    }

    /**
     * Set callback for results
     */
    onResult(callback) {
        this.onResultCallback = callback;
    }

    /**
     * Set callback for errors
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }

    /**
     * Set callback for start
     */
    onStart(callback) {
        this.onStartCallback = callback;
    }

    /**
     * Set callback for end
     */
    onEnd(callback) {
        this.onEndCallback = callback;
    }

    /**
     * Get practice history
     */
    getHistory() {
        return this.attempts;
    }

    /**
     * Get statistics
     */
    getStats() {
        if (this.attempts.length === 0) {
            return { totalAttempts: 0, averageScore: 0, bestScore: 0 };
        }

        const scores = this.attempts.map(a => a.score.overall);
        return {
            totalAttempts: this.attempts.length,
            averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            bestScore: Math.max(...scores),
            recentScores: scores.slice(-10)
        };
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.attempts = [];
    }
}

// Create global instance
const pronunciationPractice = new PronunciationPractice();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PronunciationPractice, pronunciationPractice };
}
