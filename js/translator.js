// Pidgin Translator Module
class PidginTranslator {
    constructor() {
        this.dict = pidginPhrases.translationDict;
        this.reverseDict = this.createReverseDict();
    }

    // Create reverse dictionary for Pidgin to English translation
    createReverseDict() {
        const reverse = {};
        for (let [english, pidgin] of Object.entries(this.dict)) {
            // Handle multiple word mappings
            reverse[pidgin] = english;
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

    // Main translation function - now supports both directions
    translate(text, direction = 'eng-to-pidgin') {
        if (!text || text.trim() === '') {
            return '';
        }

        if (direction === 'pidgin-to-eng') {
            return this.translatePidginToEnglish(text);
        } else {
            return this.translateEnglishToPidgin(text);
        }
    }

    // Pidgin to English translation
    translatePidginToEnglish(pidginText) {
        let text = pidginText.toLowerCase().trim();

        // First try to match complete phrases
        if (this.reverseDict[text]) {
            return this.capitalizeFirst(this.reverseDict[text]);
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

        // Then translate individual words
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

            // Check if word exists in reverse dictionary
            if (this.reverseDict[cleanWord]) {
                return this.reverseDict[cleanWord] + punctuation;
            }

            // Return original word if no translation found
            return word;
        });

        // Join words and clean up
        let result = translatedWords.join(' ');

        // Apply some English grammar corrections
        result = this.applyEnglishGrammar(result);

        return this.capitalizeFirst(result);
    }

    // English to Pidgin translation (original function renamed)
    translateEnglishToPidgin(englishText) {
        let text = englishText.toLowerCase().trim();

        // First try to match complete phrases
        for (let [english, pidgin] of Object.entries(this.dict)) {
            if (text === english) {
                return this.capitalizeFirst(pidgin);
            }
        }

        // Try to match longer phrases first
        const sortedPhrases = Object.keys(this.dict)
            .filter(key => key.includes(' '))
            .sort((a, b) => b.length - a.length);

        for (let phrase of sortedPhrases) {
            const regex = new RegExp(`\\b${this.escapeRegex(phrase)}\\b`, 'gi');
            if (regex.test(text)) {
                text = text.replace(regex, this.dict[phrase]);
            }
        }

        // Then translate individual words
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

            // Check if word exists in dictionary
            if (this.dict[cleanWord]) {
                return this.dict[cleanWord] + punctuation;
            }

            // Return original word if no translation found
            return word;
        });

        // Join words and clean up
        let result = translatedWords.join(' ');

        // Apply some Pidgin grammar rules
        result = this.applyPidginGrammar(result);

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

    // Apply Pidgin grammar patterns
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

        // Add "yeah" for questions
        if (text.endsWith('?')) {
            text = text.slice(0, -1) + ', yeah?';
        }

        return text;
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

    // Generate pronunciation guide
    getPronunciation(pidginText) {
        // Simple pronunciation rules
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
            'makai': 'mah-kye'
        };

        for (let [word, pronunciation] of Object.entries(pronunciationGuide)) {
            if (pidginText.toLowerCase().includes(word)) {
                return `Pronunciation tip: ${word} = ${pronunciation}`;
            }
        }

        return '';
    }
}

// Initialize translator
const translator = new PidginTranslator();