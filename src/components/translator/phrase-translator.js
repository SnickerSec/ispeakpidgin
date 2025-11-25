/**
 * Phrase-Level Hawaiian Pidgin Translator
 *
 * Enhanced translator specifically for phrases and sentences
 * Uses 1,618 parallel phrase translations from:
 * - 997 multi-word phrases
 * - 572 dictionary example sentences
 * - 20 pickup lines
 * - 29 synthetic common phrases
 */

class PhraseTranslator {
    constructor() {
        this.phraseLookup = null;
        this.phraseData = null;
        this.loaded = false;
        this.loadPhraseData();
    }

    async loadPhraseData() {
        try {
            // Load translator view data (contains all needed translation data)
            const dataResponse = await fetch('/data/views/translator.json');
            const translatorData = await dataResponse.json();

            // Build phrase lookup from translator data
            this.phraseLookup = {};
            this.phraseData = {
                metadata: {
                    totalPhrases: translatorData.entries ? translatorData.entries.length : 0
                },
                phrases: translatorData.entries || []
            };

            // Create lookup index for faster phrase matching
            (translatorData.entries || []).forEach(entry => {
                if (entry.english) {
                    entry.english.forEach(eng => {
                        const normalized = eng.toLowerCase().trim();
                        if (!this.phraseLookup[normalized]) {
                            this.phraseLookup[normalized] = [];
                        }
                        this.phraseLookup[normalized].push({
                            pidgin: entry.pidgin,
                            english: eng
                        });
                    });
                }
            });

            this.loaded = true;
            console.log(`✅ Loaded ${this.phraseData.metadata.totalPhrases} phrase translations`);

            // Dispatch event for initialization tracking
            window.dispatchEvent(new CustomEvent('phraseTranslatorLoaded', {
                detail: { phrasesCount: this.phraseData.metadata.totalPhrases }
            }));
        } catch (error) {
            console.error('Failed to load phrase data:', error);
            this.loaded = false;
        }
    }

    /**
     * Translate English phrase to Pidgin
     */
    translateEnglishToPidgin(text) {
        if (!this.loaded || !text) {
            return null;
        }

        const textLower = text.toLowerCase().trim();

        // 1. Check for exact phrase match
        const exactMatch = this.phraseLookup[textLower];
        if (exactMatch && exactMatch.length > 0) {
            return {
                translation: exactMatch[0].pidgin,
                confidence: 0.95,
                alternatives: exactMatch.slice(1, 3).map(m => m.pidgin),
                source: 'phrase_exact_match',
                category: exactMatch[0].category,
                difficulty: exactMatch[0].difficulty
            };
        }

        // 2. Check for partial phrase match (fuzzy)
        const partialMatch = this.findPartialPhraseMatch(textLower);
        if (partialMatch) {
            return partialMatch;
        }

        // 3. Check if it contains a known phrase
        const containsMatch = this.findContainedPhrase(textLower);
        if (containsMatch) {
            return containsMatch;
        }

        return null;
    }

    /**
     * Translate Pidgin phrase to English
     */
    translatePidginToEnglish(text) {
        if (!this.loaded || !text) {
            return null;
        }

        const textLower = text.toLowerCase().trim();

        // Search through all phrases for Pidgin match
        for (const [english, pidginOptions] of Object.entries(this.phraseLookup)) {
            for (const option of pidginOptions) {
                if (option.pidgin.toLowerCase() === textLower) {
                    return {
                        translation: english,
                        confidence: 0.95,
                        source: 'phrase_exact_match',
                        category: option.category,
                        difficulty: option.difficulty
                    };
                }
            }
        }

        // Fuzzy match for Pidgin
        const fuzzyMatch = this.findFuzzyPidginMatch(textLower);
        if (fuzzyMatch) {
            return fuzzyMatch;
        }

        return null;
    }

    /**
     * Find partial phrase match (handles variations)
     */
    findPartialPhraseMatch(text) {
        const words = text.split(/\s+/);

        // Try different combinations
        for (let i = 0; i < words.length; i++) {
            for (let j = i + 1; j <= words.length; j++) {
                const phrase = words.slice(i, j).join(' ');
                const match = this.phraseLookup[phrase];

                if (match && match.length > 0) {
                    return {
                        translation: match[0].pidgin,
                        confidence: 0.85,
                        alternatives: match.slice(1, 3).map(m => m.pidgin),
                        source: 'phrase_partial_match',
                        matchedPhrase: phrase,
                        category: match[0].category
                    };
                }
            }
        }

        return null;
    }

    /**
     * Find if text contains a known phrase
     */
    findContainedPhrase(text) {
        const phrases = Object.keys(this.phraseLookup).sort((a, b) => b.length - a.length);

        for (const phrase of phrases) {
            if (text.includes(phrase)) {
                const match = this.phraseLookup[phrase][0];
                return {
                    translation: match.pidgin,
                    confidence: 0.75,
                    source: 'phrase_contained',
                    matchedPhrase: phrase,
                    category: match.category,
                    note: `Found phrase: "${phrase}"`
                };
            }
        }

        return null;
    }

    /**
     * Fuzzy match for Pidgin phrases
     */
    findFuzzyPidginMatch(text) {
        let bestMatch = null;
        let bestSimilarity = 0;

        for (const [english, pidginOptions] of Object.entries(this.phraseLookup)) {
            for (const option of pidginOptions) {
                const similarity = this.calculateSimilarity(text, option.pidgin.toLowerCase());

                if (similarity > bestSimilarity && similarity > 0.7) {
                    bestSimilarity = similarity;
                    bestMatch = {
                        translation: english,
                        confidence: similarity,
                        source: 'phrase_fuzzy_match',
                        matchedAgainst: option.pidgin,
                        category: option.category
                    };
                }
            }
        }

        return bestMatch;
    }

    /**
     * Calculate string similarity (Levenshtein-based)
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        const maxLen = Math.max(len1, len2);
        return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
    }

    /**
     * Get phrase suggestions for autocomplete
     */
    getSuggestions(partial, limit = 5) {
        if (!this.loaded || !partial || partial.length < 2) {
            return [];
        }

        const partialLower = partial.toLowerCase();
        const suggestions = [];

        for (const english of Object.keys(this.phraseLookup)) {
            if (english.startsWith(partialLower)) {
                suggestions.push({
                    text: english,
                    pidgin: this.phraseLookup[english][0].pidgin,
                    category: this.phraseLookup[english][0].category
                });

                if (suggestions.length >= limit) break;
            }
        }

        return suggestions;
    }

    /**
     * Get phrases by category
     */
    getPhrasesByCategory(category, limit = 10) {
        if (!this.loaded) return [];

        const phrases = [];

        for (const [english, pidginOptions] of Object.entries(this.phraseLookup)) {
            for (const option of pidginOptions) {
                if (option.category === category) {
                    phrases.push({
                        english,
                        pidgin: option.pidgin,
                        difficulty: option.difficulty,
                        source: option.source
                    });

                    if (phrases.length >= limit) return phrases;
                }
            }
        }

        return phrases;
    }

    /**
     * Get random phrase for learning
     */
    getRandomPhrase(difficulty = null) {
        if (!this.loaded) return null;

        const allPhrases = [];

        for (const [english, pidginOptions] of Object.entries(this.phraseLookup)) {
            for (const option of pidginOptions) {
                if (!difficulty || option.difficulty === difficulty) {
                    allPhrases.push({
                        english,
                        pidgin: option.pidgin,
                        difficulty: option.difficulty,
                        category: option.category
                    });
                }
            }
        }

        if (allPhrases.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * allPhrases.length);
        return allPhrases[randomIndex];
    }
}

// Create global instance
const phraseTranslator = new PhraseTranslator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhraseTranslator;
}
