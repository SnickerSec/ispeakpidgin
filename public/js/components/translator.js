// Pidgin Translator Module
class PidginTranslator {
    constructor() {
        // Use both the original translation dict and the comprehensive data
        this.dict = (typeof pidginPhrases !== 'undefined' && pidginPhrases.translationDict) ? pidginPhrases.translationDict : {};
        this.comprehensiveDict = this.createComprehensiveDict();
        this.reverseDict = this.createReverseDict();
        this.contextPatterns = this.createContextPatterns();
        this.grammarRules = this.createGrammarRules();
    }

    // Create translation dictionary from enhanced data
    createComprehensiveDict() {
        const dict = {};
        if (window.pidginDictionary && window.pidginDictionary.isNewSystem) {
            const entries = window.pidginDictionary.dataLoader.getAllEntries();
            for (let entry of entries) {
                // Add pidgin to english mapping
                for (let englishTranslation of entry.english) {
                    dict[englishTranslation.toLowerCase()] = entry.pidgin;

                    // Add variations and synonyms
                    if (englishTranslation.includes('/')) {
                        englishTranslation.split('/').forEach(variant => {
                            dict[variant.trim().toLowerCase()] = entry.pidgin;
                        });
                    }
                }
            }
        }
        return dict;
    }

    // Create context patterns for better translation
    createContextPatterns() {
        return {
            greetings: {
                patterns: ['howzit', 'aloha', 'wassup', 'eh', 'ho brah'],
                context: 'greeting',
                enhanceWith: ['brah', 'sistah', 'cuz', 'bruddah']
            },
            food: {
                patterns: ['grindz', 'ono', 'broke da mouth', 'kau kau', 'manapua'],
                context: 'food',
                enhanceWith: ['stay ono', 'so good', 'delicious']
            },
            emotions: {
                patterns: ['stoked', 'bummed', 'huhu', 'shame', 'chicken skin'],
                context: 'emotion',
                enhanceWith: ['real', 'so', 'little bit']
            },
            directions: {
                patterns: ['mauka', 'makai', 'ova dea', 'right hea', 'diamond head side'],
                context: 'location',
                enhanceWith: ['side', 'way', 'direction']
            }
        };
    }

    // Create enhanced grammar rules
    createGrammarRules() {
        return {
            pidginToEnglish: {
                // Common Pidgin patterns to English
                'stay (.+)': 'is $1',
                'wen (.+)': 'did $1',
                'going (.+)': 'will $1',
                'no can (.+)': 'cannot $1',
                'like (.+)': 'want to $1',
                'gotta (.+)': 'have to $1',
                'neva (.+)': 'never $1'
            },
            englishToPidgin: {
                // English patterns to Pidgin
                'I am (.+)': 'I stay $1',
                'you are (.+)': 'you stay $1',
                'he is (.+)': 'he stay $1',
                'she is (.+)': 'she stay $1',
                'they are (.+)': 'dey stay $1',
                'we are (.+)': 'we stay $1',
                'going to (.+)': 'going $1',
                "don't (.+)": 'no $1',
                "doesn't (.+)": 'no $1',
                "didn't (.+)": 'neva $1'
            }
        };
    }

    // Create reverse dictionary for Pidgin to English translation
    createReverseDict() {
        const reverse = {};

        // Add from original dict
        for (let [english, pidgin] of Object.entries(this.dict)) {
            reverse[pidgin] = english;
        }

        // Add from enhanced data
        if (window.pidginDictionary && window.pidginDictionary.isNewSystem) {
            const entries = window.pidginDictionary.dataLoader.getAllEntries();
            for (let entry of entries) {
                reverse[entry.pidgin] = entry.english[0]; // Use first English translation

                // Handle variations
                if (entry.english[0].includes('/')) {
                    const mainTranslation = entry.english[0].split('/')[0].trim();
                    reverse[entry.pidgin] = mainTranslation;
                }
            }
        }

        // Add additional Pidgin-specific mappings that might not have direct English equivalents
        Object.assign(reverse, {
            'howzit': 'how are you',
            'brah': 'friend',
            'sistah': 'sister',
            'grinds': 'food',
            'grind': 'eat',
            'broke da mouth': 'delicious',
            'choke': 'a lot',
            'da kine': 'the thing',
            'pau hana': 'after work',
            'pau': 'finished',
            'shoots': 'okay/see you later',
            'no can': 'cannot',
            'stay': 'is',
            'da': 'the',
            'dat': 'that',
            'dis': 'this',
            'wat': 'what',
            'wea': 'where',
            'wen': 'did',
            'wen go': 'went',
            'hale': 'house',
            'wai': 'water',
            'mauka': 'toward the mountains',
            'makai': 'toward the ocean',
            'ride': 'car',
            'cruise': 'drive',
            'litto': 'little',
            'real': 'very',
            'mean': 'awesome',
            'hamajang': 'messed up',
            'lolo': 'crazy',
            'akamai': 'smart',
            'moemoe': 'sleep',
            'bumbye': 'later',
            'tanks': 'thank you',
            'latahs': 'see you later',
            'malama': 'take care',
            'we go': "let's go",
            'we go grind': "let's eat",
            'hele on': 'go away',
            'wiki wiki': 'hurry up',
            'i no know': "i don't know",
            'i know': 'i know',
            'you sabe': 'do you understand',
            'i sabe': 'i understand',
            'wat you said': 'what did you say',
            'no mind': 'never mind',
            'no worries': 'no problem',
            "fo' real": 'for sure',
            'you sure or wat': 'are you sure',
            'i stay hungry': "i'm hungry",
            'i stay tired': "i'm tired",
            'i stay good': "i'm good",
            "dat's good": "that's good",
            "dat's no good": "that's not good",
            'stay okay': "it's okay",
            'stay broke': "it's broken",
            'wea you going': 'where are you going',
            'wat you doing': 'what are you doing',
            'you can help me or wat': 'can you help me',
            'i need help': 'i need help',
            'come wit me': 'come with me',
            "wait fo' me": 'wait for me',
            'look dat': 'look at that',
            'ova dea': 'over there',
            'right hea': 'right here',
            'long time no see': 'long time no see',
            "wat's wrong": "what's wrong",
            'everything stay good': 'everything is fine',
            'take it easy': 'take it easy',
            'good job': 'good job',
            'watch out': 'be careful',
            'stoked': 'excited',
            'bummers': 'disappointed',
            'huhu': 'angry',
            'shame': 'embarrassed',
            'chicken skin': 'goosebumps',
            'all buss up': 'exhausted',
            'mo bettah': 'better',
            'ono': 'delicious',
            'junk': 'bad',
            'nuts': 'crazy',
            'beef': 'fight',
            'if can can if no can no can': "do it if possible if not then don't",
            'no make like': "don't pretend",
            'wat like beef': 'do you want to fight',
            'geev um': 'go for it',
            'talk story': 'chat',
            'make ass': 'make a fool of yourself',
            'no more': "there isn't",
            'get': 'there is',
            'try': 'please',
            'ohana': 'family',
            'kokua': 'help',
            'pono': 'righteous',
            'ho brah': 'wow',

            // New expanded vocabulary from content
            'chee hoo': 'expression of joy/excitement',
            'rajah dat': 'roger that/i agree',
            'hana hou': 'do it again/encore',
            'k den': 'okay then',
            'kanak attack': 'sleepy after eating',
            'hawaiian time': 'running late/relaxed time',
            'green bottles': 'heineken beer',
            'slippahs': 'flip-flops/sandals',
            'da haps': 'what happened/events',
            'side': 'area/direction',
            'kapu': 'forbidden/sacred/off-limits',
            'keiki': 'child/children',
            'lanai': 'porch/patio/balcony',
            'pupu': 'appetizers/snacks',
            'mahalo': 'thank you',
            'chance um': 'try it/take a chance',
            'like beef': 'want to fight',
            'holo holo': 'cruise around/leisurely drive',
            'hamajang': 'messed up/broken/out of order',
            'mean': 'awesome/cool/amazing',
            'lolo': 'crazy/silly/dumb/goofy',
            'chicken skin': 'goosebumps',
            'ono': 'delicious/tasty'
        });

        return reverse;
    }

    // Enhanced main translation function with confidence scoring
    translate(text, direction = 'eng-to-pidgin') {
        if (!text || text.trim() === '') {
            return { text: '', confidence: 0, suggestions: [] };
        }

        let result;
        let confidence = 0;
        let suggestions = [];

        if (direction === 'pidgin-to-eng') {
            result = this.translatePidginToEnglish(text);
        } else {
            result = this.translateEnglishToPidgin(text);
        }

        // Calculate confidence and generate suggestions
        const analysis = this.analyzeTranslation(text, result, direction);
        confidence = analysis.confidence;
        suggestions = analysis.suggestions;

        return {
            text: result,
            confidence: confidence,
            suggestions: suggestions,
            pronunciation: direction === 'eng-to-pidgin' ? this.getPronunciation(result) : null
        };
    }

    // Enhanced Pidgin to English translation with fuzzy matching
    translatePidginToEnglish(pidginText) {
        let text = pidginText.toLowerCase().trim();
        let originalText = text;

        // First try to match complete phrases
        if (this.reverseDict[text]) {
            return this.capitalizeFirst(this.reverseDict[text]);
        }

        // Apply grammar patterns
        for (let [pattern, replacement] of Object.entries(this.grammarRules.pidginToEnglish)) {
            const regex = new RegExp(pattern, 'gi');
            text = text.replace(regex, replacement);
        }

        // Try to match longer phrases first
        const sortedPhrases = Object.keys(this.reverseDict)
            .filter(key => key.includes(' '))
            .sort((a, b) => b.length - a.length);

        for (let phrase of sortedPhrases) {
            const regex = new RegExp(`\\b${this.escapeRegex(phrase)}\\b`, 'gi');
            if (regex.test(text)) {
                text = text.replace(regex, this.reverseDict[phrase]);
            }
        }

        // Enhanced word-by-word translation with fuzzy matching
        let words = text.split(' ');
        let translatedWords = words.map(word => {
            // Preserve punctuation
            let punctuation = '';
            let cleanWord = word;

            const punctMatch = word.match(/([.,!?;:]+)$/);
            if (punctMatch) {
                punctuation = punctMatch[1];
                cleanWord = word.slice(0, -punctuation.length);
            }

            // Check exact match first
            if (this.reverseDict[cleanWord]) {
                return this.reverseDict[cleanWord] + punctuation;
            }

            // Try fuzzy matching for common misspellings
            const fuzzyMatch = this.findFuzzyMatch(cleanWord, Object.keys(this.reverseDict));
            if (fuzzyMatch && this.calculateSimilarity(cleanWord, fuzzyMatch) > 0.7) {
                return this.reverseDict[fuzzyMatch] + punctuation;
            }

            // Return original word if no translation found
            return word;
        });

        // Join words and clean up
        let result = translatedWords.join(' ');

        // Apply enhanced English grammar corrections
        result = this.applyEnglishGrammar(result);

        return this.capitalizeFirst(result);
    }

    // Enhanced English to Pidgin translation with context awareness
    translateEnglishToPidgin(englishText) {
        let text = englishText.toLowerCase().trim();
        let originalText = text;

        // Detect context for better translation
        const context = this.detectContext(text);

        // Apply grammar patterns first
        for (let [pattern, replacement] of Object.entries(this.grammarRules.englishToPidgin)) {
            const regex = new RegExp(pattern, 'gi');
            text = text.replace(regex, replacement);
        }

        // First try comprehensive dictionary
        for (let [english, pidgin] of Object.entries(this.comprehensiveDict)) {
            if (text === english) {
                return this.enhanceWithContext(this.capitalizeFirst(pidgin), context);
            }
        }

        // Then try original dictionary
        for (let [english, pidgin] of Object.entries(this.dict)) {
            if (text === english) {
                return this.enhanceWithContext(this.capitalizeFirst(pidgin), context);
            }
        }

        // Combine both dictionaries for phrase matching
        const combinedDict = { ...this.dict, ...this.comprehensiveDict };

        // Try to match longer phrases first
        const sortedPhrases = Object.keys(combinedDict)
            .filter(key => key.includes(' '))
            .sort((a, b) => b.length - a.length);

        for (let phrase of sortedPhrases) {
            const regex = new RegExp(`\\b${this.escapeRegex(phrase)}\\b`, 'gi');
            if (regex.test(text)) {
                text = text.replace(regex, combinedDict[phrase]);
            }
        }

        // Enhanced word-by-word translation
        let words = text.split(' ');
        let translatedWords = words.map(word => {
            // Preserve punctuation
            let punctuation = '';
            let cleanWord = word;

            const punctMatch = word.match(/([.,!?;:]+)$/);
            if (punctMatch) {
                punctuation = punctMatch[1];
                cleanWord = word.slice(0, -punctuation.length);
            }

            // Check comprehensive dictionary first
            if (this.comprehensiveDict[cleanWord]) {
                return this.comprehensiveDict[cleanWord] + punctuation;
            }

            // Check original dictionary
            if (this.dict[cleanWord]) {
                return this.dict[cleanWord] + punctuation;
            }

            // Try fuzzy matching
            const allKeys = [...Object.keys(this.comprehensiveDict), ...Object.keys(this.dict)];
            const fuzzyMatch = this.findFuzzyMatch(cleanWord, allKeys);
            if (fuzzyMatch && this.calculateSimilarity(cleanWord, fuzzyMatch) > 0.7) {
                return (this.comprehensiveDict[fuzzyMatch] || this.dict[fuzzyMatch]) + punctuation;
            }

            // Return original word if no translation found
            return word;
        });

        // Join words and clean up
        let result = translatedWords.join(' ');

        // Apply enhanced Pidgin grammar rules
        result = this.applyPidginGrammar(result);

        // Enhance with context
        result = this.enhanceWithContext(result, context);

        return this.capitalizeFirst(result);
    }

    // Apply English grammar corrections when translating from Pidgin
    applyEnglishGrammar(text) {
        // Fix common patterns
        text = text.replace(/\bi is\b/gi, 'I am');
        text = text.replace(/\byou is\b/gi, 'you are');
        text = text.replace(/\bhe is\b/gi, 'he is');
        text = text.replace(/\bshe is\b/gi, 'she is');
        text = text.replace(/\bthey is\b/gi, 'they are');
        text = text.replace(/\bwe is\b/gi, 'we are');

        // Fix double negatives
        text = text.replace(/\bno don't\b/gi, "don't");
        text = text.replace(/\bno doesn't\b/gi, "doesn't");

        // Remove duplicate articles
        text = text.replace(/\bthe the\b/gi, 'the');
        text = text.replace(/\ba a\b/gi, 'a');

        return text;
    }

    // Apply enhanced Pidgin grammar patterns
    applyPidginGrammar(text) {
        // Replace "I am" with "I stay"
        text = text.replace(/\bi am\b/gi, 'I stay');
        text = text.replace(/\byou are\b/gi, 'you stay');
        text = text.replace(/\bhe is\b/gi, 'he stay');
        text = text.replace(/\bshe is\b/gi, 'she stay');
        text = text.replace(/\bthey are\b/gi, 'dey stay');
        text = text.replace(/\bwe are\b/gi, 'we stay');

        // Replace "going to" with "going"
        text = text.replace(/\bgoing to\b/gi, 'going');

        // Replace "don't" variations
        text = text.replace(/\bdon't\b/gi, 'no');
        text = text.replace(/\bdoesn't\b/gi, 'no');
        text = text.replace(/\bdidn't\b/gi, 'neva');

        // Replace "have to" with "gotta"
        text = text.replace(/\bhave to\b/gi, 'gotta');
        text = text.replace(/\bhas to\b/gi, 'gotta');

        // Enhanced question handling
        if (text.endsWith('?')) {
            if (text.includes('how') || text.includes('what') || text.includes('where')) {
                text = text.slice(0, -1) + ', o wat?';
            } else {
                text = text.slice(0, -1) + ', yeah?';
            }
        }

        // Add more natural Pidgin patterns
        text = text.replace(/\bvery\b/gi, 'real');
        text = text.replace(/\breally\b/gi, 'real');
        text = text.replace(/\ba lot of\b/gi, 'choke');
        text = text.replace(/\bmany\b/gi, 'choke');

        return text;
    }

    // Detect context of the input text
    detectContext(text) {
        const lowerText = text.toLowerCase();

        for (let [contextName, contextData] of Object.entries(this.contextPatterns)) {
            for (let pattern of contextData.patterns) {
                if (lowerText.includes(pattern.toLowerCase())) {
                    return contextName;
                }
            }
        }

        // Check for question words
        if (lowerText.includes('how') || lowerText.includes('what') || lowerText.includes('where') ||
            lowerText.includes('when') || lowerText.includes('why') || lowerText.includes('who')) {
            return 'question';
        }

        // Check for emotional content
        if (lowerText.includes('happy') || lowerText.includes('sad') || lowerText.includes('angry') ||
            lowerText.includes('excited') || lowerText.includes('tired')) {
            return 'emotions';
        }

        return 'general';
    }

    // Enhance translation with context
    enhanceWithContext(translation, context) {
        if (!context || context === 'general') {
            return translation;
        }

        const contextData = this.contextPatterns[context];
        if (!contextData) {
            return translation;
        }

        // Add contextual enhancements
        if (context === 'greetings' && !translation.includes('brah') && !translation.includes('sistah')) {
            translation += ' brah';
        }

        return translation;
    }

    // Calculate string similarity using Levenshtein distance
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;

        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;

        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

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
        return (maxLen - matrix[len1][len2]) / maxLen;
    }

    // Find the best fuzzy match for a word
    findFuzzyMatch(word, candidates) {
        let bestMatch = null;
        let bestSimilarity = 0;

        for (let candidate of candidates) {
            const similarity = this.calculateSimilarity(word.toLowerCase(), candidate.toLowerCase());
            if (similarity > bestSimilarity && similarity > 0.6) {
                bestSimilarity = similarity;
                bestMatch = candidate;
            }
        }

        return bestMatch;
    }

    // Analyze translation quality and generate suggestions
    analyzeTranslation(originalText, translatedText, direction) {
        const originalWords = originalText.toLowerCase().split(' ');
        const translatedWords = translatedText.toLowerCase().split(' ');

        let translatedCount = 0;
        let totalWords = originalWords.length;
        let suggestions = [];

        // Count how many words were actually translated
        for (let word of originalWords) {
            const cleanWord = word.replace(/[.,!?;:]/g, '');
            if (direction === 'eng-to-pidgin') {
                if (this.dict[cleanWord] || this.comprehensiveDict[cleanWord]) {
                    translatedCount++;
                }
            } else {
                if (this.reverseDict[cleanWord]) {
                    translatedCount++;
                }
            }
        }

        const confidence = totalWords > 0 ? (translatedCount / totalWords) * 100 : 0;

        // Generate suggestions based on untranslated words
        if (confidence < 80) {
            if (direction === 'eng-to-pidgin') {
                suggestions = this.generateEnglishToPidginSuggestions(originalText);
            } else {
                suggestions = this.generatePidginToEnglishSuggestions(originalText);
            }
        }

        return {
            confidence: Math.round(confidence),
            suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
        };
    }

    // Generate suggestions for English to Pidgin translation
    generateEnglishToPidginSuggestions(englishText) {
        const suggestions = [];
        const context = this.detectContext(englishText);

        if (context !== 'general') {
            const contextData = this.contextPatterns[context];
            if (contextData && contextData.patterns) {
                suggestions.push(`Try using ${context} words like: ${contextData.patterns.slice(0, 3).join(', ')}`);
            }
        }

        // Add common phrase suggestions
        if (englishText.toLowerCase().includes('how are you')) {
            suggestions.push('Try: "howzit brah" or "wassup"');
        }
        if (englishText.toLowerCase().includes('thank you')) {
            suggestions.push('Try: "tanks" or "mahalo"');
        }
        if (englishText.toLowerCase().includes('food') || englishText.toLowerCase().includes('eat')) {
            suggestions.push('Try: "grindz" for food, "grind" for eat');
        }

        return suggestions;
    }

    // Generate suggestions for Pidgin to English translation
    generatePidginToEnglishSuggestions(pidginText) {
        const suggestions = [];

        // Look for partial matches in comprehensive data
        const words = pidginText.toLowerCase().split(' ');
        for (let word of words) {
            const cleanWord = word.replace(/[.,!?;:]/g, '');
            // Find similar words in the dictionary
            const similar = this.findFuzzyMatch(cleanWord, Object.keys(this.reverseDict));
            if (similar && similar !== cleanWord) {
                suggestions.push(`Did you mean "${similar}" instead of "${cleanWord}"?`);
            }
        }

        return suggestions;
    }

    // Helper function to escape regex special characters
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Capitalize first letter
    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Enhanced pronunciation guide with multiple words support
    getPronunciation(pidginText) {
        const pronunciations = [];
        const words = pidginText.toLowerCase().split(' ');

        // Check enhanced data for each word
        if (window.pidginDictionary && window.pidginDictionary.isNewSystem) {
            const entries = window.pidginDictionary.dataLoader.getAllEntries();
            for (let word of words) {
                const cleanWord = word.replace(/[.,!?;:]/g, '');
                for (let entry of entries) {
                    if (cleanWord === entry.pidgin.toLowerCase() && entry.pronunciation) {
                        pronunciations.push(`${entry.pidgin} = ${entry.pronunciation}`);
                        break;
                    }
                }
            }
        }

        // Fallback to enhanced pronunciation rules
        const pronunciationGuide = {
            'brah': 'brah (like "bra")',
            'da kine': 'dah kyne',
            'howzit': 'how-zit',
            'shoots': 'shoots',
            'grinds': 'grindz',
            'pau': 'pow',
            'ono': 'oh-no',
            'broke da mouth': 'broke dah mout',
            'lolo': 'low-low',
            'akamai': 'ah-kah-my',
            'wiki wiki': 'wee-kee wee-kee',
            'mauka': 'mow-kah',
            'makai': 'mah-kye',
            'mahalo': 'mah-HAH-loh',
            'keiki': 'KAY-kee',
            'ohana': 'oh-HAH-nah',
            'kokua': 'koh-KOO-ah',
            'aloha': 'ah-LOH-hah',
            'pono': 'POH-noh',
            'manapua': 'mah-nah-POO-ah',
            'slippahs': 'SLIP-pahz',
            'hale': 'HAH-leh',
            'lanai': 'lah-NYE',
            'pupu': 'POO-poo'
        };

        for (let word of words) {
            const cleanWord = word.replace(/[.,!?;:]/g, '');
            if (pronunciationGuide[cleanWord] && !pronunciations.some(p => p.includes(cleanWord))) {
                pronunciations.push(`${cleanWord} = ${pronunciationGuide[cleanWord]}`);
            }
        }

        if (pronunciations.length > 0) {
            return `Pronunciation: ${pronunciations.join(', ')}`;
        }

        return '';
    }

    // Backward compatibility method for old translation calls
    translateSimple(text, direction = 'eng-to-pidgin') {
        const result = this.translate(text, direction);
        return typeof result === 'string' ? result : result.text;
    }
}

// Initialize translator
const translator = new PidginTranslator();

// Make available as pidginTranslator for consistency
const pidginTranslator = translator;

// Add methods for backward compatibility with translator-page.js
pidginTranslator.englishToPidgin = function(text) {
    const result = this.translate(text, 'eng-to-pidgin');
    return [{
        translation: result.text,
        confidence: (result.confidence || 80) / 100,
        pronunciation: result.pronunciation
    }];
};

pidginTranslator.pidginToEnglish = function(text) {
    const result = this.translate(text, 'pidgin-to-eng');
    return [{
        translation: result.text,
        confidence: (result.confidence || 80) / 100,
        pronunciation: result.pronunciation
    }];
};

// Global exposure for other modules
window.pidginTranslator = pidginTranslator;