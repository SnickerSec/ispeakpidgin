// Enhanced Translator Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const initWhenReady = () => {
        if (typeof pidginTranslator !== 'undefined' && pidginTranslator && pidginTranslator.initialized) {
            initEnhancedTranslatorPage();
        } else {
            setTimeout(initWhenReady, 100);
        }
    };

    setTimeout(initWhenReady, 200);
    window.addEventListener('pidginDataLoaded', () => {
        setTimeout(initWhenReady, 100);
    });
});

function initEnhancedTranslatorPage() {
    if (window.translatorPageInitialized) {
        console.log('Translator page already initialized, skipping...');
        return;
    }

    try {
        setupTranslationDirection();
        setupEnhancedTranslationControls();
        setupExamplePhrases();
        setupTranslationHistory();
        setupCharacterCounter();
        setupVoiceInput();
        setupKeyboardShortcuts();

        window.translatorPageInitialized = true;
        console.log('✅ Enhanced translator initialized successfully');
    } catch (error) {
        console.error('Error initializing enhanced translator:', error);
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
        updateDirectionUI('en-to-pid');
        localStorage.setItem('translatorDirection', currentDirection);

        // Clear and retranslate if there's text
        if (inputField.value.trim()) {
            performTranslation();
        }
    });

    pidginToEnglishBtn?.addEventListener('click', () => {
        currentDirection = 'pid-to-en';
        updateDirectionUI('pid-to-en');
        localStorage.setItem('translatorDirection', currentDirection);

        // Clear and retranslate if there's text
        if (inputField.value.trim()) {
            performTranslation();
        }
    });

    function updateDirectionUI(direction) {
        if (direction === 'en-to-pid') {
            englishToPidginBtn.classList.add('bg-purple-600', 'text-white');
            englishToPidginBtn.classList.remove('text-gray-600');
            pidginToEnglishBtn.classList.remove('bg-purple-600', 'text-white');
            pidginToEnglishBtn.classList.add('text-gray-600');

            inputLabel.textContent = 'Enter English Text';
            outputLabel.textContent = 'Pidgin Translation';
            inputField.placeholder = 'Type English here... (e.g., "How are you?")';
        } else {
            pidginToEnglishBtn.classList.add('bg-purple-600', 'text-white');
            pidginToEnglishBtn.classList.remove('text-gray-600');
            englishToPidginBtn.classList.remove('bg-purple-600', 'text-white');
            englishToPidginBtn.classList.add('text-gray-600');

            inputLabel.textContent = 'Enter Pidgin Text';
            outputLabel.textContent = 'English Translation';
            inputField.placeholder = 'Type Pidgin here... (e.g., "Howzit, brah?")';
        }
    }

    // Restore saved direction
    const savedDirection = localStorage.getItem('translatorDirection');
    if (savedDirection === 'pid-to-en') {
        pidginToEnglishBtn?.click();
    }
}

// Enhanced translation controls with real-time translation
let translateBtn, inputField, outputDiv, clearBtn, pasteBtn, copyBtn, speakBtn;
let confidenceIndicator, confidenceBar, confidenceText, suggestionsDiv;
let translationTimer;

function setupEnhancedTranslationControls() {
    // Get DOM elements
    translateBtn = document.getElementById('translate-btn');
    inputField = document.getElementById('translator-input');
    outputDiv = document.getElementById('translation-output');
    clearBtn = document.getElementById('clear-btn');
    pasteBtn = document.getElementById('paste-btn');
    copyBtn = document.getElementById('copy-btn');
    speakBtn = document.getElementById('speak-btn');
    confidenceIndicator = document.getElementById('confidence-indicator');
    confidenceBar = document.getElementById('confidence-bar');
    confidenceText = document.getElementById('confidence-text');
    suggestionsDiv = document.getElementById('translation-suggestions');

    if (!inputField || !outputDiv) {
        console.error('Required translator elements not found');
        return;
    }

    // Real-time translation with debounce
    inputField.addEventListener('input', () => {
        clearTimeout(translationTimer);

        if (inputField.value.trim().length > 0) {
            // Show loading state
            showLoadingState();

            // Debounce translation (wait 500ms after user stops typing)
            translationTimer = setTimeout(() => {
                performTranslation();
            }, 500);
        } else {
            // Clear output if input is empty
            outputDiv.textContent = '';
            hideConfidenceIndicator();
            clearSuggestions();
        }
    });

    // Translate button
    translateBtn?.addEventListener('click', () => {
        clearTimeout(translationTimer);
        performTranslation();
    });

    // Enter key to translate
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            clearTimeout(translationTimer);
            performTranslation();
        }
    });

    // Clear button
    clearBtn?.addEventListener('click', () => {
        inputField.value = '';
        outputDiv.textContent = '';
        hideConfidenceIndicator();
        clearSuggestions();
        inputField.focus();
    });

    // Paste button
    pasteBtn?.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputField.value = text;
            inputField.dispatchEvent(new Event('input'));
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    });

    // Copy button
    copyBtn?.addEventListener('click', () => {
        const text = outputDiv.textContent;
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                // Visual feedback
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✓ Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            });
        }
    });

    // Speak button
    speakBtn?.addEventListener('click', () => {
        const text = outputDiv.textContent;
        if (text && typeof speakText === 'function') {
            speakText(text);
        }
    });
}

// Show loading state during real-time translation
function showLoadingState() {
    if (outputDiv) {
        outputDiv.innerHTML = '<span class="text-gray-400 animate-pulse">Translating...</span>';
    }
}

// Perform translation with enhanced features
function performTranslation() {
    const text = inputField.value.trim();
    if (!text) return;

    const direction = localStorage.getItem('translatorDirection') || 'en-to-pid';
    const translationDirection = direction === 'en-to-pid' ? 'eng-to-pidgin' : 'pidgin-to-eng';

    try {
        const result = pidginTranslator.translate(text, translationDirection);

        // Display translation with animation
        displayTranslation(result.text);

        // Show confidence score
        if (result.confidence !== undefined) {
            showConfidenceScore(result.confidence);
        }

        // Show suggestions if available
        if (result.suggestions && result.suggestions.length > 0) {
            showSuggestions(result.suggestions);
        } else {
            clearSuggestions();
        }

        // Show pronunciation if available
        if (result.pronunciation) {
            showPronunciation(result.pronunciation);
        }

        // Add to history
        addToHistory(text, result.text, direction);

    } catch (error) {
        console.error('Translation error:', error);
        outputDiv.textContent = 'Translation error. Please try again.';
        outputDiv.classList.add('text-red-500');
    }
}

// Display translation with smooth animation
function displayTranslation(text) {
    if (!outputDiv) return;

    // Remove any error styling
    outputDiv.classList.remove('text-red-500');

    // Fade out
    outputDiv.style.opacity = '0';

    setTimeout(() => {
        outputDiv.textContent = text;
        // Fade in
        outputDiv.style.opacity = '1';
    }, 150);
}

// Show confidence score with visual indicator
function showConfidenceScore(confidence) {
    if (!confidenceIndicator || !confidenceBar || !confidenceText) return;

    confidenceIndicator.classList.remove('hidden');

    // Update bar width and color
    const percentage = Math.min(100, Math.max(0, confidence));
    confidenceBar.style.width = `${percentage}%`;

    // Color based on confidence level
    if (percentage >= 80) {
        confidenceBar.className = 'h-full bg-green-500 rounded-full transition-all duration-500';
    } else if (percentage >= 60) {
        confidenceBar.className = 'h-full bg-yellow-500 rounded-full transition-all duration-500';
    } else {
        confidenceBar.className = 'h-full bg-orange-500 rounded-full transition-all duration-500';
    }

    confidenceText.textContent = `${percentage}% confident`;
}

// Hide confidence indicator
function hideConfidenceIndicator() {
    if (confidenceIndicator) {
        confidenceIndicator.classList.add('hidden');
    }
}

// Show translation suggestions
function showSuggestions(suggestions) {
    if (!suggestionsDiv) return;

    suggestionsDiv.innerHTML = '';
    suggestionsDiv.classList.remove('hidden');

    const title = document.createElement('p');
    title.className = 'text-sm font-semibold text-gray-700 mb-2';
    title.textContent = '💡 Suggestions:';
    suggestionsDiv.appendChild(title);

    suggestions.forEach(suggestion => {
        const suggestionEl = document.createElement('p');
        suggestionEl.className = 'text-sm text-gray-600 mb-1';
        suggestionEl.textContent = `• ${suggestion}`;
        suggestionsDiv.appendChild(suggestionEl);
    });
}

// Clear suggestions
function clearSuggestions() {
    if (suggestionsDiv) {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.classList.add('hidden');
    }
}

// Show pronunciation guide
function showPronunciation(pronunciation) {
    const pronunciationDiv = document.getElementById('pronunciation-guide');
    if (pronunciationDiv && pronunciation) {
        pronunciationDiv.textContent = pronunciation;
        pronunciationDiv.classList.remove('hidden');
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            inputField?.focus();
        }

        // Ctrl/Cmd + Enter to translate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            performTranslation();
        }

        // Escape to clear
        if (e.key === 'Escape') {
            clearBtn?.click();
        }
    });
}

// Keep existing functions from original file
// (setupExamplePhrases, setupTranslationHistory, etc. remain unchanged)
