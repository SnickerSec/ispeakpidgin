/**
 * Context Tracker
 *
 * Tracks conversational context across multi-sentence paragraphs:
 * 1. Robust sentence splitting (preserves abbreviations, punctuation, and newlines)
 * 2. Inter-sentence discourse marker translation ("After that" → "Aftah dat", "Therefore" → "Das why")
 * 3. Pronoun resolution & gender/animacy tracking
 * 4. Tense & progressive aspect continuity across narrative sentences
 * 5. Entity memory (people, places, things mentioned)
 *
 * Improves multi-sentence translation accuracy and conversational flow.
 */

class ContextTracker {
    constructor(chunkerInstance = null) {
        this.chunker = chunkerInstance;
        this.context = {
            entities: [],        // Named entities and nouns mentioned
            currentTense: null,  // Current narrative tense (past, present, future)
            lastSubject: null,   // Last sentence subject
            lastSubjectGender: null, // 'male' | 'female' | 'plural' | 'thing'
            lastObject: null,    // Last object mentioned
            locations: [],       // Places mentioned
            timeContext: null    // Time frame (yesterday, today, tomorrow)
        };
        this.sentenceHistory = [];
        this.maxHistory = 5; // Keep last 5 sentences for context
    }

    /**
     * Translate multiple sentences with context tracking
     */
    translateParagraph(text, direction = 'eng-to-pidgin') {
        if (!text || typeof text !== 'string') {
            return null;
        }

        const trimmed = text.trim();
        if (!trimmed) return null;

        // Split into clean sentence units
        const sentences = this.splitIntoSentences(trimmed);
        if (sentences.length === 0) return null;

        // Reset context for new paragraph
        this.resetContext();

        const results = [];
        let overallConfidence = 0;

        sentences.forEach((sentence, index) => {
            // Translate with current context
            const result = this.translateWithContext(sentence, direction, index);
            results.push(result);
            overallConfidence += (result.confidence || 0.7);

            // Update context for next sentence
            this.updateContext(sentence, result.translation, direction);
        });

        const translatedText = results.map(r => r.translation).join(' ');
        const avgConfidence = results.length > 0 ? overallConfidence / results.length : 0.7;

        return {
            translation: translatedText,
            confidence: avgConfidence,
            method: 'context_aware_paragraph',
            sentenceCount: sentences.length,
            sentences: results,
            contextUsed: this.getContextSummary()
        };
    }

    /**
     * Translate single sentence using accumulated context
     */
    translateWithContext(sentence, direction = 'eng-to-pidgin', sentenceIndex = 0) {
        let processedSentence = sentence;

        if (direction === 'eng-to-pidgin') {
            processedSentence = this.applyContextToEnglish(sentence, sentenceIndex);
        } else {
            processedSentence = this.applyContextToPidgin(sentence, sentenceIndex);
        }

        // Use bound chunker or global sentenceChunker if available
        const chunker = this.chunker || (typeof sentenceChunker !== 'undefined' && sentenceChunker.loaded ? sentenceChunker : null);

        let result = null;
        if (chunker && typeof chunker.translateSentence === 'function') {
            result = chunker.translateSentence(processedSentence, direction);
        }

        // Fallback translation if chunker is unavailable
        if (!result) {
            result = {
                translation: processedSentence,
                confidence: 0.7,
                method: 'context_rule_fallback'
            };
        }

        result.sentenceIndex = sentenceIndex;
        result.contextApplied = this.context.entities.length > 0 || !!this.context.lastSubject || !!this.context.currentTense;

        return result;
    }

    /**
     * Apply context and discourse transitions to English sentence before translation
     */
    applyContextToEnglish(sentence, sentenceIndex = 0) {
        let processed = sentence.trim();

        // 1. Apply discourse transitions for subsequent sentences
        if (sentenceIndex > 0) {
            processed = this.applyEnglishDiscourseTransitions(processed);
        }

        // 2. Resolve pronouns based on last known subject
        if (this.context.lastSubject) {
            processed = this.resolveEnglishPronouns(processed);
        }

        // 3. Aspect continuity: Maintain progressive past aspect
        if (this.context.currentTense === 'past') {
            processed = processed
                .replace(/\bwas being\b/gi, 'stay')
                .replace(/\bwere being\b/gi, 'stay');
        }

        return processed;
    }

    /**
     * Map English transition phrasing to authentic Pidgin discourse markers
     */
    applyEnglishDiscourseTransitions(text) {
        const transitions = [
            { pattern: /^After that,?\s+/i, replacement: 'Aftah dat, ' },
            { pattern: /^Afterwards,?\s+/i, replacement: 'Aftah dat, ' },
            { pattern: /^Then,?\s+/i, replacement: 'Den, ' },
            { pattern: /^Because of that,?\s+/i, replacement: 'Das why, ' },
            { pattern: /^That is why,?\s+/i, replacement: 'Das why, ' },
            { pattern: /^Therefore,?\s+/i, replacement: 'Das why, ' },
            { pattern: /^Later on,?\s+/i, replacement: 'Latahs, ' },
            { pattern: /^Later,?\s+/i, replacement: 'Latahs, ' },
            { pattern: /^For example,?\s+/i, replacement: 'Like for instance, ' },
            { pattern: /^For instance,?\s+/i, replacement: 'Like for instance, ' },
            { pattern: /^Suddenly,?\s+/i, replacement: 'All of one sudden, ' },
            { pattern: /^All of a sudden,?\s+/i, replacement: 'All of one sudden, ' },
            { pattern: /^Actually,?\s+/i, replacement: 'Matter of fact, ' },
            { pattern: /^In fact,?\s+/i, replacement: 'Matter of fact, ' },
            { pattern: /^By the way,?\s+/i, replacement: 'By da way, ' },
            { pattern: /^In the end,?\s+/i, replacement: 'At da end, ' },
            { pattern: /^Finally,?\s+/i, replacement: 'At da end, ' },
            { pattern: /^Meanwhile,?\s+/i, replacement: 'Same time, ' },
            { pattern: /^At the same time,?\s+/i, replacement: 'Same time, ' },
            { pattern: /^In addition,?\s+/i, replacement: 'Plus, ' },
            { pattern: /^Furthermore,?\s+/i, replacement: 'Plus, ' }
        ];

        for (const { pattern, replacement } of transitions) {
            if (pattern.test(text)) {
                return text.replace(pattern, replacement);
            }
        }
        return text;
    }

    /**
     * Resolve English pronouns using tracked subject context
     */
    resolveEnglishPronouns(text) {
        let processed = text;
        const gender = this.context.lastSubjectGender;

        if (gender === 'male') {
            processed = processed.replace(/^He was\b/i, 'He stay')
                .replace(/^He is\b/i, 'He stay')
                .replace(/^He went\b/i, 'He wen go');
        } else if (gender === 'female') {
            processed = processed.replace(/^She was\b/i, 'She stay')
                .replace(/^She is\b/i, 'She stay')
                .replace(/^She went\b/i, 'She wen go');
        } else if (gender === 'plural') {
            processed = processed.replace(/^They were\b/i, 'Dey stay')
                .replace(/^They are\b/i, 'Dey stay')
                .replace(/^They went\b/i, 'Dey wen go');
        }

        return processed;
    }

    /**
     * Apply context to Pidgin sentence before translating to English
     */
    applyContextToPidgin(sentence, sentenceIndex = 0) {
        let processed = sentence.trim();

        if (sentenceIndex > 0) {
            const transitions = [
                { pattern: /^Aftah dat,?\s+/i, replacement: 'After that, ' },
                { pattern: /^Das why,?\s+/i, replacement: 'That is why, ' },
                { pattern: /^All of one sudden,?\s+/i, replacement: 'Suddenly, ' },
                { pattern: /^Jus like dat,?\s+/i, replacement: 'Suddenly, ' },
                { pattern: /^Latahs,?\s+/i, replacement: 'Later on, ' },
                { pattern: /^Bumbai,?\s+/i, replacement: 'Later on, ' },
                { pattern: /^Matter of fact,?\s+/i, replacement: 'Actually, ' },
                { pattern: /^At da end,?\s+/i, replacement: 'In the end, ' },
                { pattern: /^Same time,?\s+/i, replacement: 'Meanwhile, ' }
            ];

            for (const { pattern, replacement } of transitions) {
                if (pattern.test(processed)) {
                    processed = processed.replace(pattern, replacement);
                    break;
                }
            }
        }

        return processed;
    }

    /**
     * Update context after translating a sentence
     */
    updateContext(originalSentence, translatedSentence, direction) {
        const sentence = originalSentence.toLowerCase();

        // Add to history
        this.sentenceHistory.push({
            original: originalSentence,
            translated: translatedSentence,
            direction: direction
        });
        if (this.sentenceHistory.length > this.maxHistory) {
            this.sentenceHistory.shift();
        }

        // Extract entities (people, places, things)
        this.extractEntities(sentence);

        // Detect narrative tense
        this.detectTense(sentence);

        // Track subject & gender
        this.trackSubject(sentence);

        // Track locations
        this.trackLocations(sentence);

        // Track time context
        this.trackTimeContext(sentence);
    }

    /**
     * Extract named entities and important nouns
     */
    extractEntities(sentence) {
        const entityPatterns = [
            /my (uncle|aunt|aunty|grandmother|grandfather|tutu|tutu kane|tutu wahine|braddah|sistah|friend|boss|family|ohana)/g,
            /(beach|work|home|school|restaurant|food truck|diner|kitchen)/g,
            /the (h1|h-1|highway|island|city|ocean|shore)/gi
        ];

        entityPatterns.forEach(pattern => {
            const matches = sentence.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (!this.context.entities.includes(match)) {
                        this.context.entities.push(match);
                    }
                });
            }
        });
    }

    /**
     * Detect narrative tense from sentence
     */
    detectTense(sentence) {
        if (sentence.match(/yesterday|last week|last night|earlier|was|were|went|had|did|wen /)) {
            this.context.currentTense = 'past';
        } else if (sentence.match(/tomorrow|will|going to|gonna|next week|bumbai|latahs/)) {
            this.context.currentTense = 'future';
        } else if (sentence.match(/today|now|currently|am|is|are|stay/)) {
            this.context.currentTense = 'present';
        }
    }

    /**
     * Track sentence subject for pronoun resolution
     */
    trackSubject(sentence) {
        const malePatterns = [/my (uncle|braddah|brother|dad|father|grandfather|tutu kane|friend|boy|kane)/, /\b(uncle|braddah|kane|da buggah|he)\b/];
        const femalePatterns = [/my (aunt|aunty|sistah|sister|mom|mother|grandmother|tutu wahine|girl|wahine)/, /\b(aunt|aunty|sistah|wahine|she)\b/];
        const pluralPatterns = [/my (friends|cousins|family|ohana|parents|boys|girls|gang)/, /\b(they|dey|all da guys|all da boys)\b/];

        for (const pattern of malePatterns) {
            const match = sentence.match(pattern);
            if (match) {
                this.context.lastSubject = match[0];
                this.context.lastSubjectGender = 'male';
                return;
            }
        }

        for (const pattern of femalePatterns) {
            const match = sentence.match(pattern);
            if (match) {
                this.context.lastSubject = match[0];
                this.context.lastSubjectGender = 'female';
                return;
            }
        }

        for (const pattern of pluralPatterns) {
            const match = sentence.match(pattern);
            if (match) {
                this.context.lastSubject = match[0];
                this.context.lastSubjectGender = 'plural';
                return;
            }
        }
    }

    /**
     * Track locations mentioned
     */
    trackLocations(sentence) {
        const locationPatterns = [
            /(beach|ocean|shore|surf|pipeline|waikiki|north shore)/gi,
            /(home|house|hale)/gi,
            /(work|office|job)/gi,
            /(restaurant|food truck|diner|store)/gi,
            /(big island|oahu|maui|kauai|lanai|molokai|honolulu|hilo|kailua)/gi
        ];

        locationPatterns.forEach(pattern => {
            const matches = sentence.match(pattern);
            if (matches) {
                matches.forEach(location => {
                    const locLower = location.toLowerCase();
                    if (!this.context.locations.includes(locLower)) {
                        this.context.locations.push(locLower);
                    }
                });
            }
        });
    }

    /**
     * Track time context
     */
    trackTimeContext(sentence) {
        const timePatterns = {
            'yesterday': 'past',
            'last week': 'past',
            'last weekend': 'past',
            'last night': 'past',
            'today': 'present',
            'now': 'present',
            'tomorrow': 'future',
            'next week': 'future',
            'later': 'future',
            'latahs': 'future',
            'bumbai': 'future'
        };

        Object.entries(timePatterns).forEach(([timeWord, context]) => {
            if (sentence.includes(timeWord)) {
                this.context.timeContext = context;
            }
        });
    }

    /**
     * Split text into sentences with abbreviation and quote protection
     */
    splitIntoSentences(text) {
        if (!text) return [];

        const abbreviations = [
            { regex: /\bMr\./gi, placeholder: '__MR__' },
            { regex: /\bMrs\./gi, placeholder: '__MRS__' },
            { regex: /\bMs\./gi, placeholder: '__MS__' },
            { regex: /\bDr\./gi, placeholder: '__DR__' },
            { regex: /\bSt\./gi, placeholder: '__ST__' },
            { regex: /\bvs\./gi, placeholder: '__VS__' },
            { regex: /\be\.g\./gi, placeholder: '__EG__' },
            { regex: /\bi\.e\./gi, placeholder: '__IE__' },
            { regex: /\betc\./gi, placeholder: '__ETC__' },
            { regex: /\bU\.S\./gi, placeholder: '__US__' },
            { regex: /\bH-1\b/gi, placeholder: '__H1__' },
            { regex: /\bH-2\b/gi, placeholder: '__H2__' },
            { regex: /\bH-3\b/gi, placeholder: '__H3__' }
        ];

        let masked = text;
        abbreviations.forEach(({ regex, placeholder }) => {
            masked = masked.replace(regex, placeholder);
        });

        // Split on terminal punctuation followed by space/newline or double newlines
        const rawUnits = masked
            .replace(/([.!?]+["']?)(?:\s+|\n+)/g, '$1|SPLIT|')
            .replace(/\n\n+/g, '|SPLIT|')
            .split('|SPLIT|')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // Restore abbreviations
        const sentences = rawUnits.map(unit => {
            let restored = unit;
            abbreviations.forEach(({ placeholder }, idx) => {
                const originalStr = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'St.', 'vs.', 'e.g.', 'i.e.', 'etc.', 'U.S.', 'H-1', 'H-2', 'H-3'][idx];
                restored = restored.replace(new RegExp(placeholder, 'g'), originalStr);
            });
            return restored;
        });

        return sentences;
    }

    /**
     * Reset context for new paragraph
     */
    resetContext() {
        this.context = {
            entities: [],
            currentTense: null,
            lastSubject: null,
            lastSubjectGender: null,
            lastObject: null,
            locations: [],
            timeContext: null
        };
        this.sentenceHistory = [];
    }

    /**
     * Get summary of context used
     */
    getContextSummary() {
        return {
            entitiesTracked: this.context.entities.length,
            tense: this.context.currentTense,
            subject: this.context.lastSubject,
            gender: this.context.lastSubjectGender,
            locationsTracked: this.context.locations.length,
            timeContext: this.context.timeContext,
            sentencesInHistory: this.sentenceHistory.length
        };
    }

    /**
     * Check if input is likely a paragraph (multiple sentences or 25+ words)
     */
    isParagraph(text) {
        if (!text || typeof text !== 'string') return false;
        const sentences = this.splitIntoSentences(text);
        const wordCount = text.trim().split(/\s+/).length;
        return sentences.length >= 2 || wordCount >= 25;
    }
}

// Create global instance
const contextTracker = new ContextTracker();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextTracker;
}

