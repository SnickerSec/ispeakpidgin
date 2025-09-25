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

    // Pidgin pronunciation corrections for TTS
    applyPronunciationCorrections(text) {
        // Map of Pidgin words to phonetic spelling for better TTS pronunciation
        const pronunciationMap = {
            // "kine" should rhyme with "nine"
            'kine': 'kyne',
            'da kine': 'da kyne',
            'any kine': 'any kyne',
            'small kine': 'small kyne',
            'funny kine': 'funny kyne',
            'fast kine': 'fast kyne',
            'faskine': 'fas-kyne',

            // Other common mispronunciations
            'pau': 'pow',
            'mauka': 'mow-kah',
            'makai': 'mah-kye',
            'ono': 'oh-no',
            'auwe': 'ow-weh',
            'wahine': 'vah-hee-neh',
            'kane': 'kah-neh',
            'keiki': 'kay-kee',
            'tutu': 'too-too',
            'lanai': 'lah-nye',
            'mahalo': 'mah-hah-low',
            'aloha': 'ah-low-hah',
            'ohana': 'oh-hah-nah',
            'kokua': 'koh-koo-ah',
            'malama': 'mah-lah-mah',
            'kapu': 'kah-poo',
            'wiki': 'vee-kee',
            'wikiwiki': 'vee-kee-vee-kee',
            'pupus': 'poo-poos',
            'pupu': 'poo-poo',
            'hale': 'hah-leh',
            'kupuna': 'koo-poo-nah',
            'lolo': 'low-low',
            'pilau': 'pee-lau',
            'puka': 'poo-kah'
        };

        let correctedText = text;

        // Apply corrections (case-insensitive)
        Object.entries(pronunciationMap).forEach(([original, phonetic]) => {
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            correctedText = correctedText.replace(regex, phonetic);
        });

        return correctedText;
    }

    async speak(text, options = {}) {
        const maxRetries = 2; // Retry failed API calls
        let attempt = 0;

        while (attempt <= maxRetries) {
            try {
                // Wait for initialization
                await this.initializationPromise;

                // Only stop if we're going to play new audio (not during retries)
                if (attempt === 0) {
                    this.stop();
                }

                // Apply pronunciation corrections for Pidgin words
                const correctedText = this.applyPronunciationCorrections(text);
                console.log('Original text:', text);
                console.log('Corrected for TTS:', correctedText);

                // Normalize text for caching (use original text for cache key)
                const normalizedText = text.trim().toLowerCase();

                // Check cache first
                if (this.cache.has(normalizedText)) {
                    console.log('Playing cached audio for:', text);
                    if (!options.silent) {
                        // Try to play cached audio with retry fallback
                        const success = await this.playAudioBlobWithRetry(this.cache.get(normalizedText), correctedText, normalizedText);
                        if (success) return;

                        // If cached audio failed, remove from cache and retry API
                        console.log('Cached audio failed, removing from cache and retrying API');
                        this.cache.delete(normalizedText);
                        // Continue to API call below
                    } else {
                        return; // Silent mode, don't play
                    }
                }

                if (attempt > 0) {
                    console.log(`ElevenLabs API retry attempt ${attempt} for:`, text);
                }

                console.log('Generating Hawaiian Pidgin speech for:', text);

                // Show loading state if callback provided
                if (options.onStart) {
                    options.onStart();
                }

                // Make request to our backend API with corrected pronunciation
                const response = await fetch('/api/text-to-speech', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: correctedText,  // Use corrected text for better pronunciation
                        originalText: text    // Keep original for reference
                    })
                });

                if (!response.ok) {
                    throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
                }

                // Get audio blob from response
                const audioBlob = await response.blob();

                // Validate blob
                if (!audioBlob || audioBlob.size === 0) {
                    throw new Error('Received empty audio blob from API');
                }

                // Cache the audio for future use
                this.cache.set(normalizedText, audioBlob);

                // Also save to IndexedDB for persistent storage
                await this.saveToDB(normalizedText, audioBlob);

                // Play the audio (unless silent mode for preloading)
                if (!options.silent) {
                    const success = await this.playAudioBlobWithRetry(audioBlob, correctedText, normalizedText);
                    if (!success && attempt < maxRetries) {
                        throw new Error('Audio playback failed, retrying API call');
                    }
                }

                if (options.onSuccess) {
                    options.onSuccess();
                }

                return; // Success, exit retry loop

            } catch (error) {
                console.error(`ElevenLabs TTS error (attempt ${attempt + 1}):`, error);

                attempt++;

                if (attempt <= maxRetries) {
                    // Wait before retry (exponential backoff)
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    console.log(`Retrying ElevenLabs API in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // All retries exhausted
                    console.log('All ElevenLabs retry attempts failed, falling back to browser TTS');

                    if (options.onError) {
                        options.onError(error);
                    }

                    // Fallback to browser speech synthesis
                    this.fallbackToWebSpeech(text);
                    return;
                }
            }
        }
    }

    // New method with retry logic and better error handling
    async playAudioBlobWithRetry(audioBlob, fallbackText = '', cacheKey = '', maxRetries = 1) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            let audioUrl = null;
            let audio = null;

            try {
                // Ensure we have a valid blob
                if (!audioBlob || !(audioBlob instanceof Blob)) {
                    console.error('Invalid audio blob');
                    return false;
                }

                // Create fresh audio URL from blob for each attempt
                audioUrl = URL.createObjectURL(audioBlob);
                audio = new Audio(audioUrl);

                // Don't interrupt existing audio during retries
                if (attempt === 0) {
                    // Only set current audio on first attempt
                    this.currentAudio = audio;
                    this.currentAudioUrl = audioUrl;
                    this.isPlaying = true;
                }

                // Return a promise that resolves when audio starts playing successfully
                const playResult = await new Promise((resolve, reject) => {
                    let resolved = false;
                    let cleanupDone = false;

                    const cleanup = () => {
                        if (cleanupDone) return;
                        cleanupDone = true;

                        if (audioUrl && attempt === maxRetries) {
                            // Only revoke URL on final attempt or success
                            setTimeout(() => URL.revokeObjectURL(audioUrl), 1000);
                        }

                        if (attempt === 0) {
                            // Only clean main references on first attempt
                            this.isPlaying = false;
                            if (this.currentAudio === audio) {
                                this.currentAudio = null;
                                this.currentAudioUrl = null;
                            }
                        }
                    };

                    // Set up event listeners
                    const onEnded = () => {
                        if (!resolved) {
                            resolved = true;
                            resolve(true);
                        }
                        cleanup();
                    };

                    const onError = (e) => {
                        console.error('Audio playback error:', e);
                        if (!resolved) {
                            resolved = true;
                            reject(e);
                        }
                        cleanup();
                    };

                    const onCanPlay = () => {
                        if (!resolved) {
                            resolved = true;
                            resolve(true);
                        }
                        // Don't cleanup on canplay - let audio continue
                    };

                    // Add listeners
                    audio.addEventListener('ended', onEnded, { once: true });
                    audio.addEventListener('error', onError, { once: true });
                    audio.addEventListener('canplay', onCanPlay, { once: true });

                    // Attempt to play
                    audio.play().catch(error => {
                        if (error.name === 'NotAllowedError') {
                            console.log('Audio autoplay blocked - user interaction required');
                            if (!resolved) {
                                resolved = true;
                                resolve(false); // Not really a failure, just blocked
                            }
                        } else if (error.name === 'AbortError') {
                            // Don't treat AbortError as failure if audio is playing elsewhere
                            console.log('Audio play was interrupted, but may be playing elsewhere');
                            if (!resolved) {
                                resolved = true;
                                resolve(false);
                            }
                        } else {
                            console.error('Audio play error:', error);
                            if (!resolved) {
                                resolved = true;
                                reject(error);
                            }
                        }
                        cleanup();
                    });

                    // Timeout after 3 seconds (reduced from 5)
                    setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            reject(new Error('Audio play timeout'));
                            cleanup();
                        }
                    }, 3000);
                });

                return playResult;

            } catch (error) {
                console.error(`Audio play attempt ${attempt + 1} failed:`, error);

                // Clean up URLs on error
                if (audioUrl) {
                    setTimeout(() => URL.revokeObjectURL(audioUrl), 100);
                }

                if (attempt < maxRetries) {
                    console.log(`Retrying audio playback (attempt ${attempt + 2})...`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                } else {
                    // All attempts failed
                    console.log('All audio playback attempts failed');
                    return false;
                }
            }
        }

        return false;
    }

    // Legacy method for backward compatibility
    playAudioBlob(audioBlob, fallbackText = '') {
        this.playAudioBlobWithRetry(audioBlob, fallbackText).then(success => {
            if (!success && fallbackText) {
                console.log('ElevenLabs audio failed, falling back to browser TTS');
                this.fallbackToWebSpeech(fallbackText);
            }
        }).catch(error => {
            console.error('Error playing audio blob:', error);
            if (fallbackText) {
                console.log('Blob creation failed, falling back to browser TTS');
                this.fallbackToWebSpeech(fallbackText);
            }
        });
    }

    // Helper method for cleanup
    cleanup() {
        this.isPlaying = false;
        if (this.currentAudioUrl) {
            URL.revokeObjectURL(this.currentAudioUrl);
            this.currentAudioUrl = null;
        }
        this.currentAudio = null;
    }

    fallbackToWebSpeech(text) {
        console.log('Using browser speech synthesis (ElevenLabs unavailable)');

        if ('speechSynthesis' in window) {
            // Apply pronunciation corrections for better Web Speech API pronunciation
            const correctedText = this.applyPronunciationCorrections(text);
            const utterance = new SpeechSynthesisUtterance(correctedText);
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
            const modifiedText = correctedText
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
        }

        this.cleanup();

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