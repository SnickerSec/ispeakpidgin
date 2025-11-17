// Google Translate API Integration Module
class GoogleTranslateService {
    constructor() {
        this.apiEndpoint = '/api/translate';
        this.initialized = true;
    }

    // Translate English to Pidgin using Google Translate
    async englishToPidgin(text) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    sourceLanguage: 'en',
                    targetLanguage: 'haw' // Hawaiian - closest to Pidgin
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
                pronunciation: this.generatePronunciation(data.translatedText)
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

    // Translate Pidgin to English using Google Translate
    async pidginToEnglish(text) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    sourceLanguage: 'haw', // Hawaiian - closest to Pidgin
                    targetLanguage: 'en'
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
        // This is a simple placeholder - you can enhance it later
        return `Pronunciation: ${text}`;
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
