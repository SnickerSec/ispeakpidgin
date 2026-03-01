// LLM Translation Service via Kilo Gateway (Gemini Flash)
class GoogleTranslateService {
    constructor() {
        this.apiEndpoint = '/api/translate-llm';
        this.initialized = true;
    }

    // Post-LLM validation: check translated output against local dictionary
    // If the LLM left an English word untranslated that has a known Pidgin equivalent, substitute it
    validateTranslation(originalText, translatedText, direction) {
        if (direction !== 'eng-to-pidgin') return translatedText;
        if (typeof pidginTranslator === 'undefined' || !pidginTranslator || !pidginTranslator.comprehensiveDict) return translatedText;

        const dict = pidginTranslator.comprehensiveDict;
        const inputWords = originalText.toLowerCase().replace(/[.,!?;:'"()\-]/g, ' ').split(/\s+/).filter(w => w.length > 1);
        let result = translatedText;

        for (const word of inputWords) {
            const pidginEquivalent = dict[word];
            if (!pidginEquivalent) continue;

            // Check if the LLM output still contains this English word (untranslated)
            const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
            if (wordRegex.test(result)) {
                result = result.replace(wordRegex, pidginEquivalent);
            }
        }

        return result;
    }

    // Translate English to Pidgin using LLM
    async englishToPidgin(text) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    direction: 'eng-to-pidgin'
                })
            });

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }

            const data = await response.json();

            // Layer 3: Post-LLM validation against local dictionary
            const validatedText = this.validateTranslation(text, data.translatedText, 'eng-to-pidgin');

            // Return in format compatible with existing translator
            return [{
                translation: validatedText,
                confidence: 0.95,
                pronunciation: this.generatePronunciation(validatedText)
            }];

        } catch (error) {
            console.error('Google Translate error:', error);
            return [{
                translation: text,
                confidence: 0,
                pronunciation: null,
                error: error.message
            }];
        }
    }

    // Translate Pidgin to English using LLM
    async pidginToEnglish(text) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    direction: 'pidgin-to-eng'
                })
            });

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }

            const data = await response.json();

            // Return in format compatible with existing translator
            return [{
                translation: data.translatedText,
                confidence: 0.95, // Google Translate has high confidence
                pronunciation: null
            }];

        } catch (error) {
            console.error('Google Translate error:', error);
            return [{
                translation: text,
                confidence: 0,
                pronunciation: null,
                error: error.message
            }];
        }
    }

    // Generate basic pronunciation guide (placeholder)
    generatePronunciation(text) {
        // Return just the pronunciation text without label (label added in UI)
        return text;
    }

    // Method to translate using the enhanced translate() format
    async translate(text, direction = 'eng-to-pidgin') {
        let result;

        if (direction === 'eng-to-pidgin') {
            const results = await this.englishToPidgin(text);
            result = results[0];
        } else {
            const results = await this.pidginToEnglish(text);
            result = results[0];
        }

        return {
            text: result.translation,
            confidence: Math.round(result.confidence * 100),
            suggestions: [],
            pronunciation: result.pronunciation,
            alternatives: [],
            metadata: {
                source: 'google-translate',
                method: 'api'
            }
        };
    }
}

// Initialize Google Translate service
const googleTranslateService = new GoogleTranslateService();

// Make available globally
window.googleTranslateService = googleTranslateService;
