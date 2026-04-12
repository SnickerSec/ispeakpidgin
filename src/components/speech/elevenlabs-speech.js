// ElevenLabs Text-to-Speech Integration
class ElevenLabsSpeech {
    constructor() {
        this.isPlaying = false;
        this.currentAudio = null;
        this.cache = new Map(); // In-memory cache
        this.pregeneratedIndex = new Map(); // Index of pre-generated local audio files
        this.dbName = 'PidginAudioCache';
        this.storeName = 'audioCache';
        this.initializationPromise = this.initialize();
    }

    async initialize() {
        await Promise.all([
            this.initIndexedDB(),
            this.loadCacheFromDB(),
            this.loadPregeneratedIndex()
        ]);
        return true;
    }

    async loadPregeneratedIndex() {
        try {
            const response = await fetch('/assets/audio/index.json');
            if (response.ok) {
                const data = await response.json();
                Object.entries(data).forEach(([text, filename]) => {
                    this.pregeneratedIndex.set(text.toLowerCase(), filename);
                });
                console.log(`SW: Loaded ${this.pregeneratedIndex.size} pre-generated audio terms`);
            }
        } catch (e) {
            // Silently fail if index doesn't exist yet
        }
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
        // Optimized specifically for ElevenLabs voices
        const pronunciationMap = {
            // "kine" should rhyme with "nine"
            'kine': 'kyne',
            'da kine': 'dah kyne',
            'da': 'dah',
            'any kine': 'any kyne',
            'small kine': 'small kyne',
            'funny kine': 'funny kyne',
            'fast kine': 'fast kyne',
            'faskine': 'fas-kyne',

            // Common Hawaiian/Pidgin words with specific phonetic needs
            'pau': 'pow',
            'pau hana': 'pow hah-nah',
            'mauka': 'mow-kah',
            'makai': 'mah-kye',
            'ono': 'oh-no',
            'oe': 'oh-eh',
            'ʻoe': 'oh-eh',
            'auwe': 'ow-way',
            'wahine': 'vah-hee-nay',
            'kane': 'kah-nay',
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
            'gou': 'gow',
            'hale': 'hah-leh',
            'hele': 'heh-leh',
            'kupuna': 'koo-poo-nah',
            'lolo': 'low-low',
            'pilau': 'pee-lau',
            'puka': 'poo-kah',
            'humbug': 'hum-bug',
            'ho': 'hoh',
            'howzit': 'how-zit',
            'hana hou': 'hah-nah hoh-oo',
            'hanahou': 'hah-nah-hoh-oo',
            'wassamattayou': 'wah-sah-mah-tah-yoo',
            'whaddsdascoops': 'whah-dah-dah-skoops',
            'shaka': 'shah-kah',
            'slippahs': 'slippahz',
            'still': 'steel',
            'brah': 'brah',
            'bruddah': 'bruh-dah',
            'sistah': 'sis-tah',
            'cuz': 'kuz',
            'sole': 'so-leh',
            'pake': 'pah-keh',
            'haole': 'how-leh',
            'poke': 'poh-kay',
            'musubi': 'moo-soo-bee',
            'shoyu': 'show-yoo',
            'mochi': 'mo-chee',
            'manapua': 'mah-nah-poo-ah',
            'malasada': 'mah-lah-sah-dah',
            'kanak': 'kah-nahk',
            'grindz': 'gryndz',
            'grind': 'grynd',
            'kaukau': 'cow-cow',
            'cheehoo': 'chee-hoo!',
            'rajah': 'rah-jah',
            'shoots': 'shoots',
            'choke': 'choke',
            'bamboocha': 'bam-boo-chah',
            'akamai': 'ah-kah-my',
            'buggah': 'buh-gah',
            'niele': 'nee-eh-leh',
            'pilikia': 'pee-lee-kee-ah',
            'chee hu': 'chee-hoo!',
            'pilau': 'pee-lau',
            'bust \'em up': 'bust em up',
            'bust em up': 'bust em up',
            'ainokea': 'eye-no-kay-ah',
            'mo bettah': 'mo beh-tah',
            'kay den': 'kay den...',
            'aurite': 'ah-rye-t',
            'stink eye': 'stink eye',
            'chicken skin': 'chicken skin',
            'talk story': 'talk story',
            'broke da mouth': 'broke dah mouth',
            'kanak attack': 'kah-nahk ah-tack',
            'mālama da ʻāina': 'mah-lah-mah dah eye-nah',
            'nō ka ʻoi': 'noh kah oy',
            'a hui hou': 'ah-hoo-ee-hoh',
            'aʻole pilikia': 'ah-oh-leh pee-lee-kee-ah',
            'moopuna': 'mo-poo-nah',
            'li hing mui': 'lee hing moo-ee',
            'lilikoi': 'lee-lee-koy',
            'shave ice': 'shave ice',
            'plate lunch': 'plate lunch',
            'ballah': 'bal-lah',
            'rubbah': 'rub-bah',
            'punani': 'poo-nah-nee',
            'boto': 'boh-toh',
            'faka': 'fah-kah',
            'hamajang': 'hah-mah-jahng',
            'mayjah': 'may-jah',
            'poho': 'poh-hoh',
            'rajah dat': 'rah-jah dat',
            'yobo': 'yo-boh',
            'wit\'': 'wit',
            'wit': 'wit',
            'yesterday': 'yes-tah-deh'
        };

        let correctedText = text.toLowerCase();

        // 0. Remove emojis - ElevenLabs can sometimes error on complex emojis 
        // or treat them as characters that exceed length limits
        correctedText = correctedText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{1F170}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F321}\u{1F324}-\u{1F393}\u{1F396}-\u{1F39B}\u{1F39E}-\u{1F3F0}\u{1F3F3}-\u{1F3F5}\u{1F3F7}-\u{1F4FD}\u{1F4FF}-\u{1F53D}\u{1F549}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F56F}\u{1F570}\u{1F573}-\u{1F579}\u{1F57B}-\u{1F5A3}\u{1F5A5}-\u{1F5FA}\u{1F600}-\u{1F6D2}\u{1F6E0}-\u{1F6EC}\u{1F6F0}-\u{1F6F3}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D4}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F93A}\u{1F93C}-\u{1F945}\u{1F947}-\u{1F970}\u{1F973}-\u{1F976}\u{1F97A}\u{1F97C}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}]/gu, '');

        // Advanced Phonetic Rules for ElevenLabs
        // These rules catch patterns that the map might miss
        
        // 1. Th-fronting (th -> d or t) - very characteristic of Pidgin
        // Only apply to common words to avoid mangling actual English
        const thWords = {
            'the': 'dah',
            'that': 'daht',
            'this': 'dis',
            'them': 'dehm',
            'there': 'dea',
            'then': 'dehn',
            'their': 'dea',
            'they': 'dey',
            'with': 'wit',
            'mother': 'mah-dah',
            'father': 'fah-dah',
            'brother': 'bruh-dah'
        };
        
        Object.entries(thWords).forEach(([word, replacement]) => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            correctedText = correctedText.replace(regex, replacement);
        });

        // 2. Final 'r' dropping (non-rhoticity)
        // car -> cah, water -> wahtah
        correctedText = correctedText.replace(/(\w+)er\b/g, '$1ah');
        correctedText = correctedText.replace(/(\w+)ar\b/g, '$1ah');
        correctedText = correctedText.replace(/(\w+)or\b/g, '$1oh');

        // 3. Vowel Adjustments for Hawaiian words
        // 'ai' usually sounds like 'eye'
        // 'au' usually sounds like 'ow' (as in cow)
        
        // Helper to check if a word is likely Hawaiian/Pidgin (contains unique patterns)
        const isPidginLike = (word) => {
            // Exclude common English words that might trigger false positives
            const commonEnglish = [
                'you', 'your', 'out', 'about', 'around', 'sound', 'house', 'mouth', 'stout', 'shout',
                'friend', 'believe', 'field', 'piece', 'view', 'die', 'lie', 'tie', 'tried',
                'cousin', 'jealous', 'touch', 'enough', 'rough', 'tough', 'young', 'country', 'should', 'would', 'could',
                'lunch', 'just', 'much', 'such', 'but', 'bus', 'up', 'us', 'under', 'until', 'uncle',
                'buss', 'buggah', 'bust', 'cuz', 'humbug', 'funny', 'rub', 'rubbah', 'surf', 'brush', 'crush', 'must', 'trust',
                'chance', 'dance', 'lance', 'glance', 'france', 'stance', 'bruddah', 'laff', 'chawan', 'stay', 'broke',
                'aunty', 'going', 'nails', 'worries', 'wait', 'bait', 'shark', 'choice', 'goin', 'townie', 'point', 'noise',
                'voice', 'boil', 'oil', 'soil', 'join', 'coin', 'enjoy', 'boy', 'toy', 'joy',
                'cut', 'joke', 'um', 'them', 'then', 'than', 'that', 'this', 'there', 'their', 'they', 'with', 'jealous',
                'mout', 'bout', 'bust', 'pilau', 'up', 'em'
            ];
            if (commonEnglish.includes(word.toLowerCase())) return false;

            return /['ʻ]/.test(word) || pronunciationMap[word.replace(/['ʻ]/g, '')] || 
                   ['ka', 'la', 'ma', 'na', 'ha', 'ke', 'le', 'me', 'ne', 'he', 'oi', 'ai', 'au', 'ei', 'ie', 'ou', 'lua', 'pua', 'hua'].some(s => word.includes(s));
        };
        const words = correctedText.split(/\s+/);
        const processedWords = words.map(word => {
            // Check map with and without okinas
            const cleanWord = word.replace(/['ʻ]/g, '');
            if (pronunciationMap[word]) return pronunciationMap[word];
            if (pronunciationMap[cleanWord]) return pronunciationMap[cleanWord];
            
            if (isPidginLike(word)) {
                let w = word.replace(/['ʻ]/g, '-'); // Pause for okinas
                w = w.replace(/ai/g, 'eye');
                w = w.replace(/au/g, 'ow');
                w = w.replace(/oi/g, 'oy');
                w = w.replace(/ei/g, 'ay');
                w = w.replace(/ie/g, 'ee-eh');
                // Hawaiian 'u' sounds like 'oo' (as in hula, pupule)
                // But only if it's likely a Hawaiian word and not English/Pidgin
                if (!w.includes('oo') && !w.includes('ow')) {
                    // Only transform 'u' if it's not followed by certain consonants that usually stay 'u'
                    // Or if it's a standalone 'u'
                    w = w.replace(/\bu\b/g, 'oo');
                    w = w.replace(/u(?![nstp])/g, 'oo');
                }
                // Clean up leading/trailing hyphens from okinas
                w = w.replace(/^-/, '').replace(/-$/, '');
                return w;
            }
            return word;
        });
        
        correctedText = processedWords.join(' ');

        // 4. Apply hardcoded corrections (Multi-word and high-priority)
        // Sort keys by length descending to match longer phrases first
        const sortedKeys = Object.keys(pronunciationMap).sort((a, b) => b.length - a.length);
        
        sortedKeys.forEach(original => {
            const phonetic = pronunciationMap[original];
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            correctedText = correctedText.replace(regex, phonetic);
        });

        // 5. Add natural pauses for Pidgin rhythm
        correctedText = correctedText
            .replace(/, /g, ', ') 
            .replace(/\beh\b(?!\.\.\.)/gi, 'eh, ') 
            .replace(/\bhoh\b(?!\.\.\.)/gi, 'hoh, ') 
            .replace(/\bbrah\b(?!\.\.\.)/gi, ', brah')
            .replace(/\byeah\b\?/gi, ', yeah?')
            .replace(/\bo wat\b\?/gi, ', or wat?');

        return correctedText;
    }

    async speak(text, options = {}) {
        const maxRetries = 2; // Retry failed API calls
        let attempt = 0;

        // Prevent concurrent speak attempts
        if (this.currentSpeakPromise) {
            this.stop();
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Store current speak promise to prevent concurrent calls
        const speakPromise = (async () => {
            while (attempt <= maxRetries) {
                try {
                    // Wait for initialization
                    await this.initializationPromise;

                    // Detect if text is a direct URL (Supabase audio or pre-recorded)
                    const isUrl = text.startsWith('http') || text.startsWith('/') || text.endsWith('.mp3');
                    if (isUrl) {
                        try {
                            const response = await fetch(text);
                            if (response.ok) {
                                const audioBlob = await response.blob();
                                if (!options.silent) {
                                    const success = await this.playAudioBlobWithRetry(audioBlob, text, text);
                                    if (success) return;
                                } else {
                                    return;
                                }
                            }
                        } catch (e) {
                            console.warn('Direct URL audio fetch failed:', e);
                        }
                    }

                    // Only stop if we're going to play new audio (not during retries)
                    if (attempt === 0) {
                        this.stop();
                    }

                    // Apply pronunciation corrections for Pidgin words
                    const correctedText = this.applyPronunciationCorrections(text);

                    // Normalize text for caching (use original text for cache key)
                    const normalizedText = text.trim().toLowerCase();

                    // Check cache first
                    if (this.cache.has(normalizedText)) {
                        if (!options.silent) {
                            window.dispatchEvent(new CustomEvent('pidginSpeechStart'));
                            if (options.onStart) options.onStart();

                            // Try to play cached audio with retry fallback
                            const success = await this.playAudioBlobWithRetry(this.cache.get(normalizedText), correctedText, normalizedText);
                            
                            if (options.onEnd) options.onEnd();
                            
                            if (success) return;

                            // If cached audio failed, remove from cache and retry API
                            this.cache.delete(normalizedText);
                            // Continue to API call below
                        } else {
                            return; // Silent mode, don't play
                        }
                    }

                    // Check pre-generated index for local file
                    if (this.pregeneratedIndex.has(normalizedText)) {
                        try {
                            const filename = this.pregeneratedIndex.get(normalizedText);
                            const response = await fetch(`/assets/audio/${filename}`);
                            if (response.ok) {
                                const audioBlob = await response.blob();
                                // Cache it for next time
                                this.cache.set(normalizedText, audioBlob);
                                
                                if (!options.silent) {
                                    window.dispatchEvent(new CustomEvent('pidginSpeechStart'));
                                    const success = await this.playAudioBlobWithRetry(audioBlob, correctedText, normalizedText);
                                    if (options.onEnd) options.onEnd();
                                    if (success) return;
                                } else {
                                    return;
                                }
                            }
                        } catch (e) {
                            console.warn('Local audio fetch failed, falling back to API:', e);
                        }
                    }

                    // Show loading state if callback provided
                    if (options.onStart) options.onStart();

                    // Make request to our backend API with corrected pronunciation
                    const response = await fetch('/api/text-to-speech', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: correctedText,  // Use corrected text for better pronunciation
                            originalText: text,   // Keep original for reference
                            voiceId: options.voiceId // Pass through the requested voiceId
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
                        window.dispatchEvent(new CustomEvent('pidginSpeechStart'));
                        const success = await this.playAudioBlobWithRetry(audioBlob, correctedText, normalizedText);
                        if (options.onEnd) options.onEnd();
                        
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
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // All retries exhausted

                    if (options.onError) {
                        options.onError(error);
                    }

                    // Fallback to browser speech synthesis
                    this.fallbackToWebSpeech(text);
                    return;
                }
        }
            }
        })();

        // Store the promise to prevent concurrent calls
        this.currentSpeakPromise = speakPromise;

        try {
            await speakPromise;
        } finally {
            // Clear the promise when done
            if (this.currentSpeakPromise === speakPromise) {
                this.currentSpeakPromise = null;
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
                            window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
                            resolved = true;
                            resolve(true);
                        }
                        cleanup();
                    };

                    const onError = (e) => {
                        if (!resolved) {
                            window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
                            console.error('Audio playback error:', e);
                            resolved = true;
                            reject(e);
                        }
                        cleanup();
                    };

                    // Add listeners
                    audio.addEventListener('ended', onEnded, { once: true });
                    audio.addEventListener('error', onError, { once: true });

                    // Attempt to play
                    audio.play().catch(error => {
                        if (error.name === 'NotAllowedError') {
                            if (!resolved) {
                                resolved = true;
                                resolve(false); // Not really a failure, just blocked
                            }
                        } else if (error.name === 'AbortError') {
                            if (!resolved) {
                                resolved = true;
                                resolve(false);
                            }
                        } else {
                            console.error('Audio play error:', error);
                            if (!resolved) {
                                window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
                                resolved = true;
                                reject(error);
                            }
                        }
                        cleanup();
                    });

                    // Timeout after 60 seconds (increased from 10s for long stories/AI responses)
                    setTimeout(() => {
                        if (!resolved) {
                            const errorMsg = audio.paused ? 'Audio play timeout (never started)' : 'Audio play timeout (took too long to finish)';
                            console.warn(`SW: ${errorMsg} for key: ${cacheKey}`);
                            window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
                            resolved = true;
                            reject(new Error('Audio play timeout'));
                            cleanup();
                        }
                    }, 60000);
                });

                return playResult;

            } catch (error) {
                console.error(`Audio play attempt ${attempt + 1} failed:`, error);

                // Clean up URLs on error
                if (audioUrl) {
                    setTimeout(() => URL.revokeObjectURL(audioUrl), 100);
                }

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                } else {
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
                this.fallbackToWebSpeech(fallbackText);
            }
        }).catch(error => {
            console.error('Error playing audio blob:', error);
            if (fallbackText) {
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
        if ('speechSynthesis' in window) {
            window.dispatchEvent(new CustomEvent('pidginSpeechStart'));
            
            // Apply pronunciation corrections for better Web Speech API pronunciation
            const correctedText = this.applyPronunciationCorrections(text);
            const utterance = new SpeechSynthesisUtterance(correctedText);
            
            utterance.onend = () => window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
            utterance.onerror = () => window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));

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

    }
}

// Create global instance
const elevenLabsSpeech = new ElevenLabsSpeech();
window.elevenLabsSpeech = elevenLabsSpeech;

// Export for use in other modules (Node/Bundlers)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElevenLabsSpeech;
}