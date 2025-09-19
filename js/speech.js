// Enhanced Speech Synthesis for Pidgin
class PidginSpeech {
    constructor() {
        this.voices = [];
        this.preferredVoice = null;
        this.isLoaded = false;
        this.phonemeMap = this.createPhonemeMap();

        // Initialize voices
        this.loadVoices();

        // Handle voice loading on different browsers
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
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
        // Priority order for voice selection
        const voicePreferences = [
            // Ideal: Pacific/Hawaiian voices
            { pattern: /hawaii/i, score: 100 },
            { pattern: /pacific/i, score: 90 },

            // Good: American English voices (closer to Pidgin)
            { pattern: /en[_-]US/i, score: 80 },
            { pattern: /english.*united states/i, score: 75 },

            // Specific voice names that work well
            { pattern: /samantha/i, score: 70 }, // macOS
            { pattern: /alex/i, score: 65 },      // macOS
            { pattern: /victoria/i, score: 60 },  // Windows
            { pattern: /david/i, score: 55 },     // Windows

            // Male voices (often better for Pidgin)
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

    // Apply phonetic transformations for better pronunciation
    applyPhoneticTransform(text) {
        let transformed = text.toLowerCase();

        // Sort by length (longest first) to match phrases before individual words
        const sortedPhrases = Object.keys(this.phonemeMap)
            .sort((a, b) => b.length - a.length);

        sortedPhrases.forEach(phrase => {
            const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
            transformed = transformed.replace(regex, this.phonemeMap[phrase]);
        });

        return transformed;
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

    // Main speak function with enhanced pronunciation
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

            // Apply phonetic transformations
            const phoneticText = this.applyPhoneticTransform(text);

            // Create utterance
            const utterance = new SpeechSynthesisUtterance(phoneticText);

            // Set voice
            if (this.preferredVoice) {
                utterance.voice = this.preferredVoice;
            }

            // Apply speech parameters
            const params = this.getSpeechParameters(text);
            utterance.rate = options.rate || params.rate;
            utterance.pitch = options.pitch || params.pitch;
            utterance.volume = options.volume || params.volume;

            // Add SSML-like pauses for better rhythm
            let processedText = phoneticText;
            processedText = processedText.replace(/,/g, ',<pause300>');
            processedText = processedText.replace(/\./g, '.<pause500>');
            processedText = processedText.replace(/!/g, '!<pause400>');
            processedText = processedText.replace(/\?/g, '?<pause400>');

            // Handle pauses (basic implementation)
            if (processedText.includes('<pause')) {
                processedText = processedText.replace(/<pause(\d+)>/g, (match, ms) => {
                    return '...'; // Use periods as a pause proxy
                });
            }

            utterance.text = processedText;

            // Event handlers
            utterance.onend = () => resolve();
            utterance.onerror = (error) => reject(error);

            // Speak
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