// ElevenLabs Text-to-Speech Integration
class ElevenLabsSpeech {
    constructor() {
        this.isPlaying = false;
        this.currentAudio = null;
        this.cache = new Map(); // In-memory cache
        this.dbName = 'PidginAudioCache';
        this.storeName = 'audioCache';
        this.initializationPromise = this.initialize();
    }

    async initialize() {
        console.log('ElevenLabs TTS initialized with Hawaiian voice');
        await this.initIndexedDB();
        await this.loadCacheFromDB();
        return true;
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.warn('IndexedDB not available, using memory cache only');
                resolve();
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'text' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async loadCacheFromDB() {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            return new Promise((resolve) => {
                request.onsuccess = (event) => {
                    const cachedItems = event.target.result;
                    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

                    cachedItems.forEach(item => {
                        // Only load items from the last week
                        if (item.timestamp > oneWeekAgo) {
                            this.cache.set(item.text, item.blob);
                        }
                    });

                    console.log(`Loaded ${this.cache.size} cached audio items from IndexedDB`);
                    resolve();
                };

                request.onerror = () => {
                    console.warn('Failed to load cache from IndexedDB');
                    resolve();
                };
            });
        } catch (error) {
            console.warn('Error loading cache from IndexedDB:', error);
        }
    }

    async saveToDB(text, blob) {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            store.put({
                text: text,
                blob: blob,
                timestamp: Date.now()
            });

            // Clean up old entries (older than 1 week)
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const index = store.index('timestamp');
            const range = IDBKeyRange.upperBound(oneWeekAgo);

            index.openCursor(range).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
        } catch (error) {
            console.warn('Failed to save to IndexedDB:', error);
        }
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
                if (!options.silent) {
                    this.playAudioBlob(this.cache.get(normalizedText));
                }
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

            // Also save to IndexedDB for persistent storage
            await this.saveToDB(normalizedText, audioBlob);

            // Play the audio (unless silent mode for preloading)
            if (!options.silent) {
                this.playAudioBlob(audioBlob);
            }

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
            // Ensure we have a valid blob
            if (!audioBlob || !(audioBlob instanceof Blob)) {
                console.error('Invalid audio blob');
                return;
            }

            // Create audio URL from blob
            const audioUrl = URL.createObjectURL(audioBlob);

            // Create and configure audio element
            this.currentAudio = new Audio(audioUrl);
            this.isPlaying = true;

            // Track the URL for cleanup
            this.currentAudioUrl = audioUrl;

            // Set up event listeners
            this.currentAudio.addEventListener('ended', () => {
                this.isPlaying = false;
                if (this.currentAudioUrl) {
                    URL.revokeObjectURL(this.currentAudioUrl);
                    this.currentAudioUrl = null;
                }
                this.currentAudio = null;
            });

            this.currentAudio.addEventListener('error', (e) => {
                console.error('Audio playback error:', e);
                this.isPlaying = false;
                if (this.currentAudioUrl) {
                    URL.revokeObjectURL(this.currentAudioUrl);
                    this.currentAudioUrl = null;
                }
                this.currentAudio = null;
                // Fallback to browser TTS on error
                if (e.target && e.target.error && e.target.error.code === 4) {
                    console.log('Media not supported, using fallback');
                }
            });

            // Play the audio
            this.currentAudio.play().catch(error => {
                if (error.name === 'NotAllowedError') {
                    console.log('Audio autoplay blocked - user interaction required');
                } else {
                    console.error('Audio play error:', error);
                }
                this.isPlaying = false;
                if (this.currentAudioUrl) {
                    URL.revokeObjectURL(this.currentAudioUrl);
                    this.currentAudioUrl = null;
                }
                this.currentAudio = null;
            });

        } catch (error) {
            console.error('Error playing audio blob:', error);
            this.isPlaying = false;
        }
    }

    fallbackToWebSpeech(text) {
        console.log('Using browser speech synthesis (ElevenLabs unavailable)');

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.85; // Slightly slower for pidgin
            utterance.pitch = 0.95; // Slightly lower pitch
            utterance.volume = 0.9;

            // Try to find the best available voice
            const voices = speechSynthesis.getVoices();

            // Priority order for voices
            const voicePreferences = [
                voice => voice.name.includes('Samantha'), // macOS natural voice
                voice => voice.name.includes('Daniel'), // British accent
                voice => voice.name.includes('Karen'), // Australian accent
                voice => voice.name.includes('Natural'),
                voice => voice.name.includes('Enhanced'),
                voice => voice.lang === 'en-US',
                voice => voice.lang.startsWith('en')
            ];

            let selectedVoice = null;
            for (const preference of voicePreferences) {
                selectedVoice = voices.find(preference);
                if (selectedVoice) break;
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log('Using voice:', selectedVoice.name);
            }

            // Add slight pauses for better pronunciation
            const modifiedText = text
                .replace(/([.!?])/g, '$1 ')  // Add pause after punctuation
                .replace(/,/g, ', ');         // Add pause after commas

            utterance.text = modifiedText;
            speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported');
            alert('Text-to-speech is not available. Please try a different browser.');
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

        // Also clear IndexedDB
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                store.clear();
            } catch (error) {
                console.warn('Failed to clear IndexedDB cache:', error);
            }
        }

        console.log('Audio cache cleared');
    }
}

// Create global instance
const elevenLabsSpeech = new ElevenLabsSpeech();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElevenLabsSpeech;
}