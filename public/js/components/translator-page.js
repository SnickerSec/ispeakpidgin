// Translator Page Specific JavaScript
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
    try {
        // Initialize components
        setupTranslationDirection();
        setupTranslationControls();
        setupExamplePhrases();
        setupTranslationHistory();
        setupCharacterCounter();
        setupVoiceInput();
    } catch (error) {
        console.error('Error initializing translator page:', error);
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
function performTranslation() {
    // Use global references instead of querying DOM again
    if (!inputField || !outputDiv) {
        console.error('Translation elements not found');
        return;
    }

    const text = inputField.value.trim();
    if (!text) return;

    // Determine direction
    const direction = localStorage.getItem('translatorDirection') || 'en-to-pid';

    // Use the translator module - wait for it to be available
    if (typeof pidginTranslator !== 'undefined' && pidginTranslator) {
        if (!pidginTranslator.initialized) {
            pidginTranslator.tryInitialize();
        }

        let results;
        try {
            if (direction === 'en-to-pid') {
                results = pidginTranslator.englishToPidgin(text);
            } else {
                results = pidginTranslator.pidginToEnglish(text);
            }
        } catch (error) {
            console.error('Translation error:', error);
            outputDiv.innerHTML = '<p class="text-red-500 italic">Translation error. Please try again.</p>';
            return;
        }

        if (results && results.length > 0) {
            // Display the best translation
            const bestMatch = results[0];
            outputDiv.innerHTML = `<p class="text-gray-800">${bestMatch.translation}</p>`;

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

            // Show alternative translations if available
            if (results.length > 1) {
                outputDiv.innerHTML += '<div class="mt-4 pt-4 border-t border-gray-200">';
                outputDiv.innerHTML += '<p class="text-sm text-gray-600 mb-2">Alternative translations:</p>';
                outputDiv.innerHTML += '<div class="space-y-1">';
                for (let i = 1; i < Math.min(results.length, 3); i++) {
                    outputDiv.innerHTML += `<p class="text-sm text-gray-700">• ${results[i].translation}</p>`;
                }
                outputDiv.innerHTML += '</div></div>';
            }

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

// Text-to-speech function
function speakText(text, options = {}) {
    if ('speechSynthesis' in window && typeof pidginSpeech !== 'undefined') {
        pidginSpeech.speak(text, options).catch(err => {
            console.error('Speech synthesis failed:', err);
        });
    } else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
}