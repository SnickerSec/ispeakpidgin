// ElevenLabs Text-to-Speech Integration
class ElevenLabsSpeech {
    constructor() {
        this.isPlaying = false;
        this.currentAudio = null;
        this.cache = new Map(); // Cache audio blobs for repeated terms
        this.initializationPromise = this.initialize();
    }

    async initialize() {
        console.log('ElevenLabs TTS initialized with Hawaiian voice');
        return true;
    }

    async speak(text, options = {}) {
        try {
            // Wait for initialization
            await this.initializationPromise;

            // Stop any currently playing audio
            this.stop();

            // Normalize text for caching
            const normalizedText = text.trim().toLowerCase();

            // Check cache first
            if (this.cache.has(normalizedText)) {
                console.log('Playing cached audio for:', text);
                this.playAudioBlob(this.cache.get(normalizedText));
                return;
            }

            console.log('Generating Hawaiian Pidgin speech for:', text);

            // Show loading state if callback provided
            if (options.onStart) {
                options.onStart();
            }

            // Make request to our backend API
            const response = await fetch('/api/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
            }

            // Get audio blob from response
            const audioBlob = await response.blob();

            // Cache the audio for future use
            this.cache.set(normalizedText, audioBlob);

            // Play the audio
            this.playAudioBlob(audioBlob);

            if (options.onSuccess) {
                options.onSuccess();
            }

        } catch (error) {
            console.error('ElevenLabs TTS error:', error);

            if (options.onError) {
                options.onError(error);
            }

            // Fallback to browser speech synthesis
            this.fallbackToWebSpeech(text);
        }
    }

    playAudioBlob(audioBlob) {
        try {
            // Create audio URL from blob
            const audioUrl = URL.createObjectURL(audioBlob);

            // Create and configure audio element
            this.currentAudio = new Audio(audioUrl);
            this.isPlaying = true;

            // Set up event listeners
            this.currentAudio.addEventListener('ended', () => {
                this.isPlaying = false;
                URL.revokeObjectURL(audioUrl); // Clean up blob URL
                this.currentAudio = null;
            });

            this.currentAudio.addEventListener('error', (e) => {
                console.error('Audio playback error:', e);
                this.isPlaying = false;
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
            });

            // Play the audio
            this.currentAudio.play().catch(error => {
                console.error('Audio play error:', error);
                this.isPlaying = false;
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
            });

        } catch (error) {
            console.error('Error playing audio blob:', error);
            this.isPlaying = false;
        }
    }

    fallbackToWebSpeech(text) {
        console.log('Falling back to web speech synthesis');

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            // Try to use a voice that might sound more natural
            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice =>
                voice.lang.includes('en') &&
                (voice.name.includes('Natural') || voice.name.includes('Enhanced'))
            ) || voices.find(voice => voice.lang.includes('en-US'));

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported');
        }
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isPlaying = false;

        // Also stop web speech synthesis
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
    }

    isSupported() {
        // ElevenLabs is server-side, so always supported if fetch is available
        return typeof fetch !== 'undefined';
    }

    getVoiceInfo() {
        return {
            name: 'Hawaiian Local Voice (ElevenLabs)',
            description: 'Authentic Hawaiian Pidgin pronunciation powered by AI',
            provider: 'ElevenLabs',
            language: 'Hawaiian Pidgin English',
            quality: 'Premium'
        };
    }

    // Method to preload common terms
    async preloadCommonTerms(terms = []) {
        const commonPidginTerms = [
            'aloha', 'mahalo', 'pau', 'grindz', 'da kine', 'brah', 'shoots',
            'howzit', 'talk story', 'broke da mouth', 'chicken skin', 'stink eye',
            ...terms
        ];

        console.log('Preloading common Pidgin terms...');

        // Preload in batches to avoid overwhelming the API
        const batchSize = 3;
        for (let i = 0; i < commonPidginTerms.length; i += batchSize) {
            const batch = commonPidginTerms.slice(i, i + batchSize);

            const promises = batch.map(async (term) => {
                if (!this.cache.has(term.toLowerCase())) {
                    try {
                        await this.speak(term, { silent: true });
                        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
                    } catch (error) {
                        console.warn(`Failed to preload "${term}":`, error);
                    }
                }
            });

            await Promise.all(promises);

            // Delay between batches
            if (i + batchSize < commonPidginTerms.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`Preloaded ${this.cache.size} terms`);
    }

    // Get cache statistics
    getCacheStats() {
        return {
            cachedTerms: this.cache.size,
            memoryUsage: Array.from(this.cache.values()).reduce((total, blob) => total + blob.size, 0)
        };
    }

    // Clear cache to free memory
    clearCache() {
        this.cache.clear();
        console.log('Audio cache cleared');
    }
}

// Create global instance
const elevenLabsSpeech = new ElevenLabsSpeech();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElevenLabsSpeech;
}