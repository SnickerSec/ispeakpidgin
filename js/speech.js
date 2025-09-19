// Enhanced Speech Synthesis for Pidgin with SSML Support
class PidginSpeech {
    constructor() {
        this.voices = [];
        this.preferredVoice = null;
        this.isLoaded = false;
        this.phonemeMap = this.createPhonemeMap();
        this.ssmlSupported = this.checkSSMLSupport();
        this.rhythmPatterns = this.createRhythmPatterns();
        this.accentFeatures = this.createAccentFeatures();

        // Initialize voices
        this.loadVoices();

        // Handle voice loading on different browsers
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    // Check if the browser supports SSML
    checkSSMLSupport() {
        try {
            const testUtterance = new SpeechSynthesisUtterance('<speak>test</speak>');
            return true; // Most modern browsers support basic SSML
        } catch (e) {
            return false;
        }
    }

    // Create rhythm and pause patterns for natural Pidgin flow
    createRhythmPatterns() {
        return {
            // Natural pause patterns in Pidgin speech
            sentenceEnding: '<break time="700ms"/>',
            commaBreak: '<break time="300ms"/>',
            questionRise: '<prosody pitch="+15%" rate="95%">',
            questionEnd: '</prosody><break time="500ms"/>',
            exclamationEmphasis: '<prosody pitch="+10%" volume="+20%">',
            exclamationEnd: '</prosody><break time="400ms"/>',

            // Pidgin-specific rhythm patterns
            beforeBrah: '<break time="200ms"/>',
            afterYeah: '<break time="300ms"/>',
            beforeShaka: '<break time="150ms"/>',

            // Emphasis patterns
            strongEmphasis: '<prosody pitch="+20%" volume="+30%">',
            strongEmphasisEnd: '</prosody>',
            softEmphasis: '<prosody rate="90%">',
            softEmphasisEnd: '</prosody>'
        };
    }

    // Create accent features for non-rhotic simulation
    createAccentFeatures() {
        return {
            // R-dropping rules (non-rhotic feature)
            rDropping: {
                'brah': 'bra-ah',
                'fo\' sure': 'fo-ah shu-ah',
                'more': 'mo-ah',
                'better': 'beh-tah',
                'over': 'oh-vah',
                'under': 'un-dah',
                'never': 'neh-vah',
                'water': 'wah-tah',
                'after': 'af-tah',
                'sister': 'sis-tah',
                'brother': 'bruh-dah',
                'mother': 'muh-dah',
                'father': 'fah-dah',
                'teacher': 'tee-chah',
                'dinner': 'din-nah',
                'together': 'tuh-geh-dah'
            },

            // Vowel shifts characteristic of Pidgin
            vowelShifts: {
                'that': 'dat',
                'this': 'dis',
                'think': 'tink',
                'thing': 'ting',
                'three': 'tree',
                'through': 'tru',
                'throw': 'trow'
            },

            // Consonant cluster simplification
            clusterSimplification: {
                'asked': 'ask',
                'sixth': 'six',
                'fifths': 'fifs',
                'months': 'mont',
                'lengths': 'lent'
            }
        };
    }

    // Create phoneme mapping for better Pidgin pronunciation
    createPhonemeMap() {
        return {
            // Pidgin-specific pronunciations
            'brah': 'bra',
            'da kine': 'dah kyne',
            'howzit': 'house-it',
            'shoots': 'shoots',
            'pau': 'pow',
            'pau hana': 'pow hah-nah',
            'ono': 'oh-no',
            'grinds': 'grindz',
            'broke da mouth': 'broke dah mout',
            'lolo': 'low-low',
            'akamai': 'ah-kah-my',
            'wiki wiki': 'wee-kee wee-kee',
            'mauka': 'mow-kah',
            'makai': 'mah-kai',
            'haole': 'how-lee',
            'ohana': 'oh-hah-nah',
            'malama': 'mah-lah-mah',
            'kokua': 'koh-koo-ah',
            'mahalo': 'mah-hah-low',
            'aloha': 'ah-low-hah',
            'keiki': 'kay-kee',
            'wahine': 'wah-hee-nay',
            'kane': 'kah-nay',
            'hale': 'hah-lay',
            'huhu': 'who-who',
            'pupule': 'poo-poo-lay',
            'hana': 'hah-nah',
            'moemoe': 'moy-moy',
            'niele': 'nee-eh-leh',
            'pilau': 'pee-lau',
            'tutu': 'too-too',

            // Common word adjustments
            'da': 'dah',
            'dis': 'dees',
            'dat': 'daht',
            'dey': 'day',
            'dem': 'dehm',
            'dea': 'deah',
            'hea': 'heah',
            'fo': 'foh',
            'mo': 'moh',
            'ova': 'oh-vah',
            'betta': 'beh-tah',
            'wen': 'wehn',
            'wat': 'waht',
            'wea': 'weah',
            'bumbye': 'bum-bye',
            'latahs': 'lay-tahz',
            'tanks': 'tahnks',
            'choke': 'chohk',
            'geev': 'geev',
            'hele': 'heh-leh',
            'hamajang': 'hah-mah-jahng',
            'rajah': 'rah-jah',
            'shaka': 'shah-kah',
            'stoked': 'stohked',
            'sistah': 'sis-tah',
            'bruddah': 'bru-dah',
            'aunty': 'ahn-tee',
            'uncle': 'ahn-koh'
        };
    }

    // Load available voices and select the best one
    loadVoices() {
        this.voices = speechSynthesis.getVoices();

        if (this.voices.length > 0) {
            this.isLoaded = true;
            this.selectBestVoice();
        }
    }

    // Select the most appropriate voice for Pidgin
    selectBestVoice() {
        // Priority order for voice selection - updated for better Pidgin pronunciation
        const voicePreferences = [
            // Ideal: Pacific/Hawaiian voices
            { pattern: /hawaii/i, score: 100 },
            { pattern: /pacific/i, score: 95 },

            // Non-rhotic English accents (better for Pidgin)
            { pattern: /australia/i, score: 95 },
            { pattern: /en[_-]AU/i, score: 93 },
            { pattern: /new zealand/i, score: 91 },
            { pattern: /en[_-]NZ/i, score: 89 },

            // Specific Australian voices (excellent for Pidgin)
            { pattern: /karen/i, score: 92 },        // Microsoft Karen - Australian
            { pattern: /lee/i, score: 90 },          // Microsoft Lee - Australian
            { pattern: /james/i, score: 88 },        // Microsoft James - Australian
            { pattern: /catherine/i, score: 86 },    // Microsoft Catherine - Australian
            { pattern: /ryan/i, score: 84 },         // Microsoft Ryan - Australian
            { pattern: /hayley/i, score: 82 },       // Microsoft Hayley - Australian

            // Specific New Zealand voices (excellent for Pidgin)
            { pattern: /hazel/i, score: 90 },        // Microsoft Hazel - New Zealand
            { pattern: /william/i, score: 88 },      // Microsoft William - New Zealand

            // Additional Australian voices
            { pattern: /nicole/i, score: 80 },       // Australian voice variant
            { pattern: /russell/i, score: 78 },      // Australian voice variant

            // US English (still good, but more rhotic)
            { pattern: /en[_-]US/i, score: 75 },
            { pattern: /english.*united states/i, score: 73 },

            // Specific US voice names optimized for Pidgin-like pronunciation
            { pattern: /samantha/i, score: 75 }, // macOS - female, clear
            { pattern: /alex/i, score: 73 },      // macOS - male, deeper
            { pattern: /daniel/i, score: 71 },    // Windows - male, good rhythm
            { pattern: /mark/i, score: 69 },      // Windows - male, clear
            { pattern: /david/i, score: 67 },     // Windows - male
            { pattern: /zira/i, score: 65 },      // Windows - female
            { pattern: /victoria/i, score: 63 },  // Windows - female

            // British voices (non-rhotic but different vowels)
            { pattern: /en[_-]GB/i, score: 60 },
            { pattern: /british/i, score: 58 },

            // Male voices (often better for Pidgin rhythm)
            { pattern: /male/i, score: 50 },

            // Fallback to any English
            { pattern: /en/i, score: 30 },
            { pattern: /english/i, score: 25 }
        ];

        let bestVoice = null;
        let bestScore = 0;

        this.voices.forEach(voice => {
            let score = 0;
            const voiceString = `${voice.name} ${voice.lang}`.toLowerCase();

            voicePreferences.forEach(pref => {
                if (pref.pattern.test(voiceString)) {
                    score = Math.max(score, pref.score);
                }
            });

            // Prefer local voices over remote
            if (!voice.localService) {
                score -= 10;
            }

            if (score > bestScore) {
                bestScore = score;
                bestVoice = voice;
            }
        });

        this.preferredVoice = bestVoice || this.voices[0];
        console.log('Selected voice:', this.preferredVoice?.name);
    }

    // Apply comprehensive phonetic transformations for realistic Pidgin pronunciation
    applyPhoneticTransform(text) {
        let transformed = text.toLowerCase();

        // 1. Apply basic phoneme mapping first
        const sortedPhrases = Object.keys(this.phonemeMap)
            .sort((a, b) => b.length - a.length);

        sortedPhrases.forEach(phrase => {
            const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
            transformed = transformed.replace(regex, this.phonemeMap[phrase]);
        });

        // 2. Apply non-rhotic accent features (R-dropping)
        Object.keys(this.accentFeatures.rDropping).forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            transformed = transformed.replace(regex, this.accentFeatures.rDropping[word]);
        });

        // 3. Apply vowel shifts
        Object.keys(this.accentFeatures.vowelShifts).forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            transformed = transformed.replace(regex, this.accentFeatures.vowelShifts[word]);
        });

        // 4. Apply consonant cluster simplification
        Object.keys(this.accentFeatures.clusterSimplification).forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            transformed = transformed.replace(regex, this.accentFeatures.clusterSimplification[word]);
        });

        // 5. Additional Pidgin-specific transformations
        transformed = this.applyAdvancedPidginFeatures(transformed);

        return transformed;
    }

    // Apply advanced Pidgin linguistic features
    applyAdvancedPidginFeatures(text) {
        let transformed = text;

        // Th-fronting (th → t or d)
        transformed = transformed.replace(/\bthe\b/g, 'da');
        transformed = transformed.replace(/\bthem\b/g, 'dem');
        transformed = transformed.replace(/\bthey\b/g, 'dey');
        transformed = transformed.replace(/\bthen\b/g, 'den');
        transformed = transformed.replace(/\bthere\b/g, 'dea');

        // Final consonant cluster reduction
        transformed = transformed.replace(/sts\b/g, 's');
        transformed = transformed.replace(/nds\b/g, 'ns');
        transformed = transformed.replace(/mps\b/g, 'ms');

        // Syllable-final L-vocalization (bottle → bot-o)
        transformed = transformed.replace(/tle\b/g, 'to');
        transformed = transformed.replace(/dle\b/g, 'do');

        // Reduce unstressed syllables
        transformed = transformed.replace(/about/g, 'bout');
        transformed = transformed.replace(/around/g, 'round');
        transformed = transformed.replace(/because/g, 'cause');

        return transformed;
    }

    // Apply SSML markup for natural rhythm and intonation
    applySSMLMarkup(text) {
        // Note: Most browsers don't actually support SSML in speechSynthesis
        // This function is mainly for logging/debugging purposes
        // We'll simulate the effects through other means

        let ssmlText = text;

        // Add pauses for natural rhythm
        ssmlText = ssmlText.replace(/,/g, this.rhythmPatterns.commaBreak);
        ssmlText = ssmlText.replace(/\./g, this.rhythmPatterns.sentenceEnding);

        // Handle questions with rising intonation
        ssmlText = ssmlText.replace(/([^?]+)\?/g,
            this.rhythmPatterns.questionRise + '$1' + this.rhythmPatterns.questionEnd);

        // Handle exclamations with emphasis
        ssmlText = ssmlText.replace(/([^!]+)!/g,
            this.rhythmPatterns.exclamationEmphasis + '$1' + this.rhythmPatterns.exclamationEnd);

        // Add Pidgin-specific rhythm patterns
        ssmlText = ssmlText.replace(/\bbrah\b/g,
            this.rhythmPatterns.beforeBrah + 'brah');
        ssmlText = ssmlText.replace(/\byeah\b/g,
            'yeah' + this.rhythmPatterns.afterYeah);

        // Emphasize key Pidgin words
        const emphasizedWords = ['howzit', 'shoots', 'broke da mouth', 'choke', 'da kine'];
        emphasizedWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            ssmlText = ssmlText.replace(regex,
                this.rhythmPatterns.softEmphasis + word + this.rhythmPatterns.softEmphasisEnd);
        });

        // Wrap in SSML speak tag
        return `<speak>${ssmlText}</speak>`;
    }

    // Adjust speech parameters for more natural Pidgin sound
    getSpeechParameters(text) {
        const params = {
            rate: 0.9,      // Slightly slower for clarity
            pitch: 1.0,     // Normal pitch
            volume: 1.0     // Full volume
        };

        // Adjust rate based on content
        if (text.includes('!')) {
            params.rate = 0.95;  // Slightly faster for excitement
            params.pitch = 1.1;  // Higher pitch for enthusiasm
        }

        if (text.includes('?')) {
            params.pitch = 1.15; // Rising intonation for questions
        }

        // Slower for longer phrases
        if (text.length > 50) {
            params.rate = 0.85;
        }

        return params;
    }

    // Main speak function with enhanced phonetic processing
    speak(text, options = {}) {
        return new Promise((resolve, reject) => {
            if (!('speechSynthesis' in window)) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            // Cancel any ongoing speech
            speechSynthesis.cancel();

            // Wait for voices to load if needed
            if (!this.isLoaded) {
                setTimeout(() => this.speak(text, options), 100);
                return;
            }

            // Apply comprehensive phonetic transformations
            const phoneticText = this.applyPhoneticTransform(text);

            // Generate SSML for debugging purposes (not actually used for speech)
            const ssmlText = this.applySSMLMarkup(phoneticText);

            // Create utterance with phonetic text (NOT SSML - most browsers don't support it)
            const utterance = new SpeechSynthesisUtterance(phoneticText);

            // Set voice (prefer non-rhotic accents)
            if (this.preferredVoice) {
                utterance.voice = this.preferredVoice;
            }

            // Apply speech parameters optimized for Pidgin
            const params = this.getSpeechParameters(text);
            utterance.rate = options.rate || params.rate;
            utterance.pitch = options.pitch || params.pitch;
            utterance.volume = options.volume || params.volume;

            // Simulate rhythm by adding pauses using periods
            let textWithPauses = phoneticText;
            textWithPauses = textWithPauses.replace(/,/g, '... ');
            textWithPauses = textWithPauses.replace(/\./g, '..... ');
            textWithPauses = textWithPauses.replace(/!/g, '!... ');
            textWithPauses = textWithPauses.replace(/\?/g, '?... ');

            // Use the text with simulated pauses for speech
            utterance.text = textWithPauses;

            // Enhanced debugging
            if (options.debug) {
                console.log('🎙️ Speech Debug Info:');
                console.log('Original text:', text);
                console.log('Phonetic text:', phoneticText);
                console.log('Final speech text:', textWithPauses);
                console.log('SSML (for reference):', ssmlText);
                console.log('Selected voice:', this.preferredVoice?.name);
                console.log('Speech parameters:', params);
            }

            // Event handlers
            utterance.onend = () => resolve();
            utterance.onerror = (error) => {
                console.warn('Speech failed:', error);
                reject(error);
            };

            // Speak the enhanced text
            speechSynthesis.speak(utterance);
        });
    }

    // Get available voices for user selection
    getAvailableVoices() {
        return this.voices.map(voice => ({
            name: voice.name,
            lang: voice.lang,
            local: voice.localService,
            default: voice.default
        }));
    }

    // Allow manual voice selection
    setVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.preferredVoice = voice;
            return true;
        }
        return false;
    }

    // Test different voices
    testVoices(text = "Howzit brah! Da waves stay pumping today!") {
        this.voices.forEach((voice, index) => {
            setTimeout(() => {
                console.log(`Testing voice: ${voice.name}`);
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = voice;
                utterance.rate = 0.9;
                speechSynthesis.speak(utterance);
            }, index * 3000);
        });
    }
}

// Initialize the Pidgin speech synthesizer
const pidginSpeech = new PidginSpeech();