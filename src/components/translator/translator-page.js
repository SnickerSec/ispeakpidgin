// Translator Page Specific JavaScript
// Global translation engine selector
let currentTranslationEngine = 'local'; // 'local' or 'google'

document.addEventListener('DOMContentLoaded', function() {
    // Wait for translator to be available before initializing
    const initWhenReady = () => {
        if (typeof pidginTranslator !== 'undefined' && pidginTranslator && pidginTranslator.initialized) {
            initTranslatorPage();
        } else {
            // Check again in 100ms
            setTimeout(initWhenReady, 100);
        }
    };

    // Start checking after a brief delay
    setTimeout(initWhenReady, 200);

    // Also listen for the data loaded event
    window.addEventListener('pidginDataLoaded', () => {
        setTimeout(initWhenReady, 100);
    });
});

function initTranslatorPage() {
    // Prevent multiple initialization
    if (window.translatorPageInitialized) {
        console.log('Translator page already initialized, skipping...');
        return;
    }

    try {
        // Initialize components
        setupTranslationEngine();
        setupTranslationDirection();
        setupTranslationControls();
        setupExamplePhrases();
        setupTranslationHistory();
        setupCharacterCounter();
        setupVoiceInput();
        setupKeyboardShortcuts();
        setupSmoothAnimations();

        window.translatorPageInitialized = true;
        console.log('✅ Translator page initialized with enhancements');
    } catch (error) {
        console.error('Error initializing translator page:', error);
    }
}

// Translation engine toggle (Local vs Google)
function setupTranslationEngine() {
    const localEngineBtn = document.getElementById('local-engine-btn');
    const googleEngineBtn = document.getElementById('google-engine-btn');

    localEngineBtn?.addEventListener('click', () => {
        currentTranslationEngine = 'local';
        localEngineBtn.classList.add('bg-green-600', 'text-white');
        localEngineBtn.classList.remove('text-gray-600');
        googleEngineBtn.classList.remove('bg-green-600', 'text-white');
        googleEngineBtn.classList.add('text-gray-600');

        // Store engine preference
        localStorage.setItem('translationEngine', 'local');

        // Re-translate if there's text
        const inputField = document.getElementById('translator-input');
        if (inputField && inputField.value.trim()) {
            performTranslation();
        }
    });

    googleEngineBtn?.addEventListener('click', () => {
        currentTranslationEngine = 'google';
        googleEngineBtn.classList.add('bg-green-600', 'text-white');
        googleEngineBtn.classList.remove('text-gray-600');
        localEngineBtn.classList.remove('bg-green-600', 'text-white');
        localEngineBtn.classList.add('text-gray-600');

        // Store engine preference
        localStorage.setItem('translationEngine', 'google');

        // Re-translate if there's text
        const inputField = document.getElementById('translator-input');
        if (inputField && inputField.value.trim()) {
            performTranslation();
        }
    });

    // Restore saved engine preference
    const savedEngine = localStorage.getItem('translationEngine');
    if (savedEngine === 'google') {
        googleEngineBtn?.click();
    }
}

// Translation direction toggle
function setupTranslationDirection() {
    const englishToPidginBtn = document.getElementById('english-to-pidgin-btn');
    const pidginToEnglishBtn = document.getElementById('pidgin-to-english-btn');
    const inputLabel = document.getElementById('input-label');
    const outputLabel = document.getElementById('output-label');
    const inputField = document.getElementById('translator-input');

    let currentDirection = 'en-to-pid';

    englishToPidginBtn?.addEventListener('click', () => {
        currentDirection = 'en-to-pid';
        englishToPidginBtn.classList.add('bg-purple-600', 'text-white');
        englishToPidginBtn.classList.remove('text-gray-600');
        pidginToEnglishBtn.classList.remove('bg-purple-600', 'text-white');
        pidginToEnglishBtn.classList.add('text-gray-600');

        inputLabel.textContent = 'Enter English Text';
        outputLabel.textContent = 'Pidgin Translation';
        inputField.placeholder = 'Type or paste English text here...';

        // Store direction
        localStorage.setItem('translatorDirection', currentDirection);
    });

    pidginToEnglishBtn?.addEventListener('click', () => {
        currentDirection = 'pid-to-en';
        pidginToEnglishBtn.classList.add('bg-purple-600', 'text-white');
        pidginToEnglishBtn.classList.remove('text-gray-600');
        englishToPidginBtn.classList.remove('bg-purple-600', 'text-white');
        englishToPidginBtn.classList.add('text-gray-600');

        inputLabel.textContent = 'Enter Pidgin Text';
        outputLabel.textContent = 'English Translation';
        inputField.placeholder = 'Type or paste Pidgin text here...';

        // Store direction
        localStorage.setItem('translatorDirection', currentDirection);
    });

    // Restore saved direction
    const savedDirection = localStorage.getItem('translatorDirection');
    if (savedDirection === 'pid-to-en') {
        pidginToEnglishBtn?.click();
    }
}

// Global DOM element references for translator page
let translateBtn, inputField, outputDiv, clearBtn, pasteBtn, copyBtn, speakBtn;
let confidenceIndicator, confidenceBar, confidenceText;

// Translation controls
function setupTranslationControls() {
    // Get all DOM elements and store them globally for this module
    translateBtn = document.getElementById('translate-btn');
    inputField = document.getElementById('translator-input');
    outputDiv = document.getElementById('translation-output');
    clearBtn = document.getElementById('clear-input-btn');
    pasteBtn = document.getElementById('paste-btn');
    copyBtn = document.getElementById('copy-btn');
    speakBtn = document.getElementById('speak-btn');
    confidenceIndicator = document.getElementById('confidence-indicator');
    confidenceBar = document.getElementById('confidence-bar');
    confidenceText = document.getElementById('confidence-text');

    // Remove translate button listener since it's gone
    // translateBtn?.addEventListener('click', performTranslation);

    // Keep Enter key to force re-translate if needed
    inputField?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            performTranslation();
        }
    });

    // Auto-translate on input (with debounce)
    let translateTimeout;
    inputField?.addEventListener('input', () => {
        clearTimeout(translateTimeout);

        // Show typing indicator
        if (inputField.value.trim()) {
            outputDiv.innerHTML = '<p class="text-gray-400 italic animate-pulse">Translating...</p>';
        }

        translateTimeout = setTimeout(() => {
            if (inputField.value.trim()) {
                performTranslation();
            } else {
                // Clear output when input is empty
                outputDiv.innerHTML = '<p class="text-gray-400 italic">Translation will appear here...</p>';
                confidenceIndicator?.classList.add('hidden');
                copyBtn?.classList.add('hidden');
                speakBtn?.classList.add('hidden');
            }
        }, 300); // Reduced from 500ms to 300ms for faster response
    });

    // Clear button
    clearBtn?.addEventListener('click', () => {
        inputField.value = '';
        outputDiv.innerHTML = '<p class="text-gray-400 italic">Translation will appear here...</p>';
        confidenceIndicator?.classList.add('hidden');
        copyBtn?.classList.add('hidden');
        speakBtn?.classList.add('hidden');
        updateCharacterCount();
    });

    // Paste button
    pasteBtn?.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputField.value = text;
            updateCharacterCount();
            performTranslation();
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            alert('Please allow clipboard access to use this feature');
        }
    });

    // Copy button
    copyBtn?.addEventListener('click', () => {
        const text = outputDiv.textContent;
        navigator.clipboard.writeText(text).then(() => {
            // Visual feedback
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    });

    // Speak button
    speakBtn?.addEventListener('click', () => {
        const text = outputDiv.textContent;
        if (text && typeof speakText === 'function') {
            speakText(text);
            // Visual feedback
            speakBtn.classList.add('animate-pulse');
            setTimeout(() => {
                speakBtn.classList.remove('animate-pulse');
            }, 3000);
        }
    });
}

// Perform translation
async function performTranslation() {
    // Use global references instead of querying DOM again
    if (!inputField || !outputDiv) {
        console.error('Translation elements not found');
        return;
    }

    const text = inputField.value.trim();
    if (!text) return;

    // Determine direction
    const direction = localStorage.getItem('translatorDirection') || 'en-to-pid';

    let results;

    try {
        // Use Google Translate or local translator based on selection
        if (currentTranslationEngine === 'google' && typeof googleTranslateService !== 'undefined') {
            // Show loading indicator
            outputDiv.innerHTML = '<p class="text-gray-400 italic animate-pulse">Translating with Google...</p>';

            // Call Google Translate API
            if (direction === 'en-to-pid') {
                results = await googleTranslateService.englishToPidgin(text);
            } else {
                results = await googleTranslateService.pidginToEnglish(text);
            }
        } else {
            // Use local translator
            if (typeof pidginTranslator !== 'undefined' && pidginTranslator) {
                if (!pidginTranslator.initialized) {
                    pidginTranslator.tryInitialize();
                }

                if (direction === 'en-to-pid') {
                    results = pidginTranslator.englishToPidgin(text);
                } else {
                    results = pidginTranslator.pidginToEnglish(text);
                }
            }
        }
    } catch (error) {
        console.error('Translation error:', error);
        outputDiv.innerHTML = '<p class="text-red-500 italic">Translation error. Please try again.</p>';
        return;
    }

    if (results && results.length > 0) {
            // Display the best translation
            const bestMatch = results[0];
            let outputHTML = `<p class="text-2xl font-semibold text-gray-800 mb-3">${bestMatch.translation}</p>`;

            // Show confidence
            const confidence = Math.round(bestMatch.confidence * 100);
            confidenceIndicator?.classList.remove('hidden');

            // Update confidence bar
            confidenceBar.style.width = `${confidence}%`;
            if (confidence >= 80) {
                confidenceBar.className = 'h-2 rounded-full transition-all duration-300 bg-green-500';
                confidenceText.textContent = `${confidence}% - High`;
                confidenceText.className = 'text-sm font-medium confidence-high';
            } else if (confidence >= 50) {
                confidenceBar.className = 'h-2 rounded-full transition-all duration-300 bg-yellow-500';
                confidenceText.textContent = `${confidence}% - Medium`;
                confidenceText.className = 'text-sm font-medium confidence-medium';
            } else {
                confidenceBar.className = 'h-2 rounded-full transition-all duration-300 bg-red-500';
                confidenceText.textContent = `${confidence}% - Low`;
                confidenceText.className = 'text-sm font-medium confidence-low';
            }

            // Show pronunciation with audio button
            if (bestMatch.pronunciation) {
                outputHTML += `<div class="mt-3 p-3 bg-yellow-50 rounded-lg flex items-center justify-between">
                    <div>
                        <span class="text-xs text-yellow-800 font-semibold">Pronunciation:</span>
                        <span class="text-sm text-yellow-700 ml-2">${bestMatch.pronunciation}</span>
                    </div>
                    <button onclick="speakPronunciation('${bestMatch.translation}')"
                            class="px-3 py-1 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition text-sm">
                        🔊 Listen
                    </button>
                </div>`;
            }

            // Show alternative translations if available
            if (results.length > 1) {
                outputHTML += '<div class="mt-4 pt-4 border-t border-gray-200">';
                outputHTML += '<p class="text-sm font-semibold text-gray-700 mb-3">📚 Alternative Translations:</p>';
                outputHTML += '<div class="space-y-2">';
                for (let i = 1; i < Math.min(results.length, 3); i++) {
                    const altConf = Math.round(results[i].confidence * 100);
                    outputHTML += `<div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span class="text-gray-700">${results[i].translation}</span>
                        <span class="text-xs text-gray-500">${altConf}%</span>
                    </div>`;
                }
                outputHTML += '</div></div>';
            }

            // Show metadata if available (examples, usage, etc.)
            if (bestMatch.metadata) {
                const meta = bestMatch.metadata;
                if (meta.usage || meta.examples?.length > 0 || meta.difficulty) {
                    outputHTML += '<div class="mt-4 pt-4 border-t border-gray-200">';

                    if (meta.usage) {
                        outputHTML += `<div class="mb-3">
                            <span class="text-xs font-semibold text-blue-800">💡 Usage:</span>
                            <span class="text-sm text-gray-700 ml-2">${meta.usage}</span>
                        </div>`;
                    }

                    if (meta.difficulty) {
                        const difficultyColors = {
                            'beginner': 'bg-green-100 text-green-700',
                            'intermediate': 'bg-yellow-100 text-yellow-700',
                            'advanced': 'bg-red-100 text-red-700'
                        };
                        const colorClass = difficultyColors[meta.difficulty] || 'bg-gray-100 text-gray-700';
                        outputHTML += `<span class="inline-block px-2 py-1 ${colorClass} rounded text-xs font-medium mb-3">
                            Level: ${meta.difficulty}
                        </span>`;
                    }

                    if (meta.examples && meta.examples.length > 0) {
                        outputHTML += '<div class="mt-3">';
                        outputHTML += '<p class="text-xs font-semibold text-purple-800 mb-2">📝 Examples:</p>';
                        meta.examples.slice(0, 2).forEach(example => {
                            outputHTML += `<p class="text-sm italic text-gray-600 mb-1">"${example}"</p>`;
                        });
                        outputHTML += '</div>';
                    }

                    outputHTML += '</div>';
                }
            }

            outputDiv.innerHTML = outputHTML;

            // Show buttons
            copyBtn?.classList.remove('hidden');
            speakBtn?.classList.remove('hidden');

            // Add to history
            addToHistory(text, bestMatch.translation, direction);
        } else {
            outputDiv.innerHTML = '<p class="text-gray-500 italic">No translation found. Try different words or check spelling.</p>';
            confidenceIndicator?.classList.add('hidden');
            copyBtn?.classList.add('hidden');
            speakBtn?.classList.add('hidden');
        }
    } else {
        outputDiv.innerHTML = '<p class="text-red-500 italic">Translation service is loading. Please try again.</p>';
    }
}

// Example phrases
function setupExamplePhrases() {
    const exampleBtns = document.querySelectorAll('.example-phrase');
    const inputField = document.getElementById('translator-input');

    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text;
            const direction = btn.dataset.direction;

            // Set direction
            if (direction === 'en-to-pid') {
                document.getElementById('english-to-pidgin-btn')?.click();
            } else {
                document.getElementById('pidgin-to-english-btn')?.click();
            }

            // Set text and translate
            inputField.value = text;
            updateCharacterCount();
            performTranslation();

            // Scroll to translation
            inputField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
}

// Translation history
function setupTranslationHistory() {
    const historyDiv = document.getElementById('translation-history');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Load history from localStorage
    loadHistory();

    // Clear history button
    clearHistoryBtn?.addEventListener('click', () => {
        localStorage.removeItem('translationHistory');
        loadHistory();
    });
}

// Add translation to history
function addToHistory(original, translation, direction) {
    let history = JSON.parse(localStorage.getItem('translationHistory') || '[]');

    // Check if this exact translation already exists in recent history (prevent duplicates)
    const isDuplicate = history.some(entry =>
        entry.original === original &&
        entry.translation === translation &&
        entry.direction === direction
    );

    // Only add if it's not a duplicate
    if (!isDuplicate) {
        // Add new translation to beginning
        history.unshift({
            original,
            translation,
            direction,
            timestamp: new Date().toISOString()
        });

        // Keep only last 5 translations
        history = history.slice(0, 5);

        // Save to localStorage
        localStorage.setItem('translationHistory', JSON.stringify(history));

        // Update display
        loadHistory();
    }
}

// Load and display history
function loadHistory() {
    const historyDiv = document.getElementById('translation-history');
    const history = JSON.parse(localStorage.getItem('translationHistory') || '[]');

    if (history.length === 0) {
        historyDiv.innerHTML = '<p class="text-gray-400 italic text-center py-8">No translations yet. Start translating above!</p>';
    } else {
        historyDiv.innerHTML = history.map(item => {
            const direction = item.direction === 'en-to-pid' ? 'EN → PID' : 'PID → EN';
            const time = new Date(item.timestamp).toLocaleTimeString();

            return `
                <div class="border-l-4 border-purple-400 pl-4 py-2 hover:bg-gray-50 transition cursor-pointer history-item"
                     data-original="${item.original}" data-translation="${item.translation}" data-direction="${item.direction}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <p class="text-gray-700">${item.original}</p>
                            <p class="text-purple-600 font-medium">→ ${item.translation}</p>
                        </div>
                        <div class="text-xs text-gray-500 ml-4">
                            <div>${direction}</div>
                            <div>${time}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers to history items
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const original = item.dataset.original;
                const direction = item.dataset.direction;
                const inputField = document.getElementById('translator-input');

                // Set direction
                if (direction === 'en-to-pid') {
                    document.getElementById('english-to-pidgin-btn')?.click();
                } else {
                    document.getElementById('pidgin-to-english-btn')?.click();
                }

                // Set text and translate
                inputField.value = original;
                updateCharacterCount();
                performTranslation();

                // Scroll to translation
                inputField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    }
}

// Character counter
function setupCharacterCounter() {
    const inputField = document.getElementById('translator-input');
    inputField?.addEventListener('input', updateCharacterCount);
}

function updateCharacterCount() {
    const inputField = document.getElementById('translator-input');
    const charCount = document.getElementById('char-count');

    if (inputField && charCount) {
        const count = inputField.value.length;
        charCount.textContent = `${count} / 500 characters`;

        if (count > 500) {
            charCount.classList.add('text-red-500');
            inputField.value = inputField.value.substring(0, 500);
        } else {
            charCount.classList.remove('text-red-500');
        }
    }
}

// Voice input
function setupVoiceInput() {
    const micBtn = document.getElementById('mic-input-btn');
    const inputField = document.getElementById('translator-input');

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        micBtn?.classList.add('hidden');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isListening = false;

    micBtn?.addEventListener('click', () => {
        if (!isListening) {
            recognition.start();
            isListening = true;
            micBtn.classList.add('text-red-600', 'animate-pulse');
            micBtn.textContent = '🔴 Listening...';
        } else {
            recognition.stop();
            isListening = false;
            micBtn.classList.remove('text-red-600', 'animate-pulse');
            micBtn.textContent = '🎤 Voice Input';
        }
    });

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            inputField.value = finalTranscript.trim();
            updateCharacterCount();
            performTranslation();
        } else if (interimTranscript) {
            inputField.value = interimTranscript;
            updateCharacterCount();
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        micBtn.classList.remove('text-red-600', 'animate-pulse');
        micBtn.textContent = '🎤 Voice Input';

        if (event.error === 'not-allowed') {
            alert('Please allow microphone access to use voice input');
        }
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('text-red-600', 'animate-pulse');
        micBtn.textContent = '🎤 Voice Input';
    };
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
}

// Initialize mobile menu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const inputField = document.getElementById('translator-input');
        const clearBtn = document.getElementById('clear-input-btn');

        // Ctrl/Cmd + K to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            inputField?.focus();
        }

        // Ctrl/Cmd + L to clear
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            clearBtn?.click();
        }

        // Escape to clear and blur
        if (e.key === 'Escape' && document.activeElement === inputField) {
            clearBtn?.click();
            inputField?.blur();
        }
    });

    // Show keyboard shortcut hints
    console.log('⌨️ Keyboard shortcuts enabled:');
    console.log('  Ctrl/Cmd + K: Focus input');
    console.log('  Ctrl/Cmd + L: Clear translation');
    console.log('  Enter: Translate');
    console.log('  Escape: Clear and blur');
}

// Smooth animations for better UX
function setupSmoothAnimations() {
    const outputDiv = document.getElementById('translation-output');

    if (outputDiv) {
        // Add transition for smooth opacity changes
        outputDiv.style.transition = 'opacity 0.3s ease-in-out';
    }

    // Add subtle hover effects to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.style.transition = 'all 0.2s ease';
    });
}

// Pronunciation audio using ElevenLabs integration
function speakPronunciation(text) {
    // Use global speakText function from main.js which handles ElevenLabs integration
    if (typeof speakText === 'function') {
        speakText(text);
    } else {
        console.warn('Speech synthesis not available');
    }
}

// Make function globally available for inline onclick handlers
window.speakPronunciation = speakPronunciation;

// Text-to-speech function - use global speakText from main.js
// (removed duplicate function to prevent dual audio playback)