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

        // Note: SpeechGrammarList is deprecated and unreliable
        // We use post-processing normalization instead (English → Pidgin mapping)

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
     * Check if speech recognition is supported
     */
    isSupported() {
        return this.supported;
    }

    /**
     * Start listening for user speech
     * @param {Object} wordData - The word to practice { pidgin, pronunciation, english }
     */
    startListening(wordData) {
        if (!this.supported) {
            console.error('Speech recognition not supported');
            return false;
        }

        if (this.isListening) {
            this.stopListening();
        }

        this.currentWord = wordData;

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
     * English-to-Pidgin normalization map
     * Maps common English transcriptions BACK to correct Pidgin spelling
     * This is the key to accurate scoring - we normalize the English output first
     */
    englishToPidginMap = {
        // Common word-level substitutions
        "how's it": "howzit",
        "how is it": "howzit",
        "hows it": "howzit",
        "how sit": "howzit",
        "the kind": "da kine",
        "the kine": "da kine",
        "da kind": "da kine",
        "ducane": "da kine",
        "bra": "brah",
        "bruh": "brah",
        "bro": "brah",
        "brother": "brah",
        "shoot": "shoots",
        "suits": "shoots",
        "chutes": "shoots",
        "pow": "pau",
        "pal": "pau",
        "paul": "pau",
        "pao": "pau",
        "oh no": "ono",
        "oh know": "ono",
        "grinds": "grindz",
        "grins": "grindz",
        "grands": "grindz",
        "my hello": "mahalo",
        "ma hello": "mahalo",
        "pow hana": "pau hana",
        "pow hannah": "pau hana",
        "pal hana": "pau hana",
        "talk stories": "talk story",
        "talkstory": "talk story",
        "broke the mouth": "broke da mouth",
        "broken mouth": "broke da mouth",
        "more better": "mo bettah",
        "more beta": "mo bettah",
        "mo better": "mo bettah",
        "small kind": "small kine",
        "small can": "small kine",
        "chickenskin": "chicken skin",
        "don't worry beef curry": "no worry beef curry",
        "hama jang": "hamajang",
        "have a junk": "hamajang",
        "how much on": "hamajang",
        "i don't care": "ainokea",
        "i no care": "ainokea",
        "eye no care": "ainokea",
        "low low": "lolo",
        "lo lo": "lolo",
        "roger that": "rajah dat",
        "roger dad": "rajah dat",
        "poopoolay": "pupule",
        "poo poo lay": "pupule",
        "poopoo": "pupule",
        // Common single-word substitutions (applied after phrase matching)
        "the": "da",
        "for": "fo",
        "going": "goin",
        "nothing": "notting",
        "something": "someting",
        "everything": "everyting",
        "with": "wit",
        "brother": "braddah",
        "sister": "sistah",
        "water": "waddah",
        "better": "bettah",
        "later": "latah",
        "already": "awready"
    };

    /**
     * Known Pidgin words and their likely English speech recognition equivalents
     * Used for quick lookup to detect if transcription is a known equivalent
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
        'pupule': ["poopoolay", "poo poo lay", "pupule", "poopoo"],
        'fo': ["for", "fo", "four"],
        'da': ["the", "da", "duh"],
        'wit': ["with", "wit"],
        'bettah': ["better", "bettah"],
        'braddah': ["brother", "braddah", "brada"],
        'sistah': ["sister", "sistah", "sista"],
        'waddah': ["water", "waddah", "wadda"],
        'lidat': ["like that", "lidat", "like dat"],
        'bumbye': ["by and by", "bumbye", "bum bye", "bomb by"],
        'choke': ["choke", "a lot", "plenty"],
        'shaka': ["shaka", "shock a", "shocker"]
    };

    /**
     * Normalize English transcription back to Pidgin spelling
     * This is the KEY to accurate scoring - convert "how's it" → "howzit"
     * @param {string} englishText - Raw transcription from speech API
     * @returns {string} Normalized Pidgin text
     */
    normalizeEnglishToPidgin(englishText) {
        let normalized = englishText.toLowerCase().trim();

        // First, apply multi-word phrase replacements (longer phrases first)
        const phraseKeys = Object.keys(this.englishToPidginMap)
            .filter(k => k.includes(' '))
            .sort((a, b) => b.length - a.length);

        for (const phrase of phraseKeys) {
            const pidgin = this.englishToPidginMap[phrase];
            normalized = normalized.replace(new RegExp(phrase, 'gi'), pidgin);
        }

        // Then apply single-word replacements
        const wordKeys = Object.keys(this.englishToPidginMap)
            .filter(k => !k.includes(' '));

        for (const word of wordKeys) {
            const pidgin = this.englishToPidginMap[word];
            // Use word boundaries to avoid partial replacements
            normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), pidgin);
        }

        return normalized;
    }

    /**
     * Score the pronunciation attempt
     * Strategy: Normalize English output → Pidgin, then compare to target
     * @param {Array} alternatives - Speech recognition alternatives
     * @returns {Object} Score object with details
     */
    scorePronunciation(alternatives) {
        if (!this.currentWord) {
            return { overall: 0, feedback: 'No word to compare' };
        }

        const expected = this.normalizeText(this.currentWord.pidgin);
        const spoken = alternatives[0].transcript;
        const confidence = alternatives[0].confidence || 0.8; // API confidence score

        // STEP 1: Normalize the English transcription back to Pidgin
        const spokenNormalized = this.normalizeText(spoken);
        const spokenAsPidgin = this.normalizeEnglishToPidgin(spokenNormalized);

        console.log(`🎯 Expected: "${expected}"`);
        console.log(`🎤 Raw transcription: "${spoken}"`);
        console.log(`🔄 Normalized to Pidgin: "${spokenAsPidgin}"`);

        // STEP 2: Check if raw transcription matches a known English equivalent
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

        // STEP 3: Calculate Word Accuracy (WER-based) using normalized Pidgin
        const wordAccuracy = this.calculateWordAccuracy(expected, spokenAsPidgin);

        // STEP 4: Calculate similarity scores (both raw and normalized)
        const exactMatch = spokenAsPidgin === expected || spokenNormalized === expected || isKnownEquivalent;
        const levenshteinScore = this.calculateLevenshteinScore(expected, spokenAsPidgin);
        const phoneticScore = this.calculatePhoneticScore(expected, spokenAsPidgin);

        // Check alternatives for better matches (also normalize them)
        let bestAlternativeScore = levenshteinScore;
        let bestAlternative = spoken;

        for (const alt of alternatives) {
            const altNormalized = this.normalizeEnglishToPidgin(this.normalizeText(alt.transcript));
            const altScore = this.calculateLevenshteinScore(expected, altNormalized);
            if (altScore > bestAlternativeScore) {
                bestAlternativeScore = altScore;
                bestAlternative = alt.transcript;
            }
        }

        // STEP 5: Calculate final score using the formula:
        // Rating = (0.7 × Word Accuracy) + (0.3 × Confidence Score)
        // Plus bonus for exact/known equivalent matches
        const baseScore = (wordAccuracy * 0.7) + (confidence * 100 * 0.3);
        const equivalentBonus = (exactMatch || isKnownEquivalent) ? 15 : 0;
        const overall = Math.round(Math.min(100, baseScore + equivalentBonus));

        // Generate feedback
        const finalScore = Math.min(100, Math.max(0, overall));
        const feedback = this.generateFeedback(expected, spokenAsPidgin, finalScore, isKnownEquivalent);

        return {
            overall: finalScore,
            exact: exactMatch,
            spoken: spoken,
            spokenNormalized: spokenAsPidgin, // Show the Pidgin-normalized version
            expected: this.currentWord.pidgin,
            confidence: Math.round(confidence * 100),
            wordAccuracy: Math.round(wordAccuracy),
            levenshtein: Math.round(levenshteinScore),
            phonetic: Math.round(phoneticScore),
            feedback: feedback,
            stars: this.getStarRating(finalScore),
            alternatives: alternatives.map(a => a.transcript),
            isKnownEquivalent: isKnownEquivalent
        };
    }

    /**
     * Calculate Word Accuracy (WER-inspired)
     * Compares word-by-word match percentage
     * @param {string} expected - Target Pidgin phrase
     * @param {string} spoken - Normalized spoken text
     * @returns {number} Accuracy percentage (0-100)
     */
    calculateWordAccuracy(expected, spoken) {
        const expectedWords = expected.split(/\s+/).filter(w => w.length > 0);
        const spokenWords = spoken.split(/\s+/).filter(w => w.length > 0);

        if (expectedWords.length === 0) return 0;

        // For single-word comparisons, use character-level accuracy
        if (expectedWords.length === 1 && spokenWords.length === 1) {
            const similarity = this.calculateLevenshteinScore(expectedWords[0], spokenWords[0]);
            return similarity;
        }

        let matches = 0;
        let partialMatches = 0;

        for (const expWord of expectedWords) {
            // Check for exact match
            if (spokenWords.includes(expWord)) {
                matches++;
            } else {
                // Check for close match (Levenshtein > 80%)
                for (const spkWord of spokenWords) {
                    const similarity = this.calculateLevenshteinScore(expWord, spkWord);
                    if (similarity >= 80) {
                        partialMatches += similarity / 100;
                        break;
                    } else if (similarity >= 60) {
                        partialMatches += (similarity / 100) * 0.5;
                        break;
                    }
                }
            }
        }

        const totalScore = matches + partialMatches;
        return (totalScore / expectedWords.length) * 100;
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
                message: "Ho, you sound like one local! Perfect! 🤙"
            });
        } else if (score >= 75) {
            feedback.push({
                type: 'good',
                message: "Solid! Getting da hang of it! 🌺"
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
