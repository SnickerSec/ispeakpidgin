// Translator Page Specific JavaScript
// Global translation engine selector - AI (Gemini) is default
let currentTranslationEngine = 'google'; // 'local' or 'google' (AI fallback to local)

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
        return;
    }

    try {
        // Initialize components (AI engine is always default now)
        setupTranslationDirection();
        setupTranslationControls();
        setupExamplePhrases();
        setupTranslationHistory();
        setupCharacterCounter();
        setupVoiceInput();
        setupKeyboardShortcuts();
        setupSmoothAnimations();
        setupDiscoveryUI();

        window.translatorPageInitialized = true;
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

    // Add translate button listener (manual translation only to save API costs)
    translateBtn?.addEventListener('click', () => {
        performTranslation();
    });

    // Clear output when input is empty (manual translation only to save API costs)
    inputField?.addEventListener('input', () => {
        if (!inputField.value.trim()) {
            outputDiv.innerHTML = '<p class="text-gray-400 italic">Translation will appear here...</p>';
            confidenceIndicator?.classList.add('hidden');
            copyBtn?.classList.add('hidden');
            speakBtn?.classList.add('hidden');
        }
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

    // Paste button (manual translation only)
    pasteBtn?.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputField.value = text;
            updateCharacterCount();
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

    // Show loading indicator
    outputDiv.innerHTML = '<p class="text-gray-400 italic animate-pulse"><i class="ti ti-refresh animate-spin"></i> Translating with AI...</p>';
    confidenceIndicator?.classList.add('hidden');

    // Determine direction
    const directionStr = localStorage.getItem('translatorDirection') || 'en-to-pid';
    const direction = directionStr === 'en-to-pid' ? 'eng-to-pidgin' : 'pidgin-to-eng';

    try {
        if (typeof pidginTranslator !== 'undefined' && pidginTranslator) {
            if (!pidginTranslator.initialized) {
                pidginTranslator.tryInitialize();
            }

            const result = await pidginTranslator.translate(text, direction);
            
            if (result && result.text) {
                displayTranslationResult(result, text, directionStr);
            } else {
                throw new Error('No translation found');
            }
        } else {
            throw new Error('Translator not loaded');
        }
    } catch (error) {
        console.error('Translation error:', error);
        outputDiv.innerHTML = '<p class="text-red-500 italic">Translation error. Please try again.</p>';
    }
}

// Display translation result
function displayTranslationResult(result, originalText, direction) {
    // Apply Deep Dive Highlighting for Pidgin results
    const highlightedText = direction === 'en-to-pid' 
        ? highlightDictionaryWords(result.text) 
        : escapeHtml(result.text);

    let outputHTML = `<div class="text-2xl font-semibold text-gray-800 mb-3">${highlightedText}</div>`;

    // Show confidence
    const confidence = result.confidence || 80;
    confidenceIndicator?.classList.remove('hidden');
    
    // ... existing confidence bar logic ...
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

    // Show AI Explanation/Metadata if available
    if (result.metadata) {
        const meta = result.metadata;
        outputHTML += '<div class="mt-4 pt-4 border-t border-gray-200">';

        // Method tag
        const methodColor = meta.method?.includes('AI') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
        outputHTML += `<span class="inline-block px-2 py-0.5 ${methodColor} rounded-full text-[10px] font-bold uppercase tracking-tighter mb-3">
            Method: ${escapeHtml(meta.method)}
        </span>`;

        if (meta.explanation) {
            outputHTML += `<div class="mb-3 bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400">
                <p class="text-xs font-bold text-indigo-800 mb-1 uppercase tracking-wider"><i class="ti ti-info-circle"></i> AI Breakdown:</p>
                <p class="text-sm text-indigo-900 leading-relaxed">${escapeHtml(meta.explanation)}</p>
            </div>`;
        }

        // ... rest of metadata ...
        if (meta.usage) {
            outputHTML += `<div class="mb-3">
                <span class="text-xs font-semibold text-blue-800"><i class="ti ti-bulb"></i> Usage Note:</span>
                <p class="text-sm text-gray-700 mt-1">${escapeHtml(meta.usage)}</p>
            </div>`;
        }

        if (meta.examples && meta.examples.length > 0) {
            outputHTML += '<div class="mt-3">';
            outputHTML += '<p class="text-xs font-semibold text-purple-800 mb-2"><i class="ti ti-note"></i> Examples:</p>';
            meta.examples.slice(0, 2).forEach(example => {
                outputHTML += `<p class="text-sm italic text-gray-600 mb-1">"${escapeHtml(example)}"</p>`;
            });
            outputHTML += '</div>';
        }

        outputHTML += '</div>';
    }

    // Add Grammar/Local Tip (Engagement Feature)
    const grammarTips = [
        { title: "Present Tense Tip", text: 'Use "stay" for "am/is/are" when describing a state or location. Example: "I stay hungry" means "I am hungry".', icon: "ti-info-circle" },
        { title: "Past Tense Tip", text: 'Use "wen" before a verb for past tense. Example: "I wen go beach" means "I went to the beach".', icon: "ti-history" },
        { title: "Future Tense Tip", text: 'Use "going" or "going go" for future tense. Example: "I going eat" means "I will eat".', icon: "ti-arrow-forward" },
        { title: "The Magic Word", text: '"Da kine" is the most versatile word in Pidgin! Use it for "the thing" when you forget the specific name.', icon: "ti-sparkles" },
        { title: "Island Respect", text: 'Always say "Mahalo" to show gratitude. It\'s a key part of the aloha spirit!', icon: "ti-hand-love-you" },
        { title: "Negation Tip", text: 'Use "no" for "don\'t" and "neva" for "didn\'t". Example: "I neva see \'em" means "I didn\'t see it".', icon: "ti-circle-x" },
        { title: "Pronunciation Tip", text: 'Try dropping the "r" sound at the end of words. "Brother" becomes "Brah", "Sister" becomes "Sistah".', icon: "ti-microphone" }
    ];

    const randomTip = grammarTips[Math.floor(Math.random() * grammarTips.length)];
    const escapedTipTitle = escapeHtml(randomTip.title);
    const escapedTipText = escapeHtml(randomTip.text);
    const escapedTipIcon = escapeHtml(randomTip.icon);
    
    outputHTML += `
        <div class="mt-6 pt-4 border-t-2 border-dashed border-gray-100 animate-fade-in">
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <div class="text-blue-600 mt-1 text-xl"><i class="ti ${escapedTipIcon}"></i></div>
                <div>
                    <h4 class="text-sm font-bold text-blue-800 uppercase tracking-wider">${escapedTipTitle}</h4>
                    <p class="text-sm text-blue-900 mt-0.5">${escapedTipText}</p>
                    <a href="learning-hub.html" class="text-xs text-blue-600 font-bold hover:underline mt-2 inline-block">Learn more in the Hub →</a>
                </div>
            </div>
        </div>
    `;

    outputDiv.innerHTML = outputHTML;

    // Attach click listeners to highlights
    outputDiv.querySelectorAll('.dict-highlight').forEach(el => {
        el.addEventListener('click', (e) => {
            const wordId = e.target.dataset.id;
            showWordDiscovery(wordId);
        });
    });

    // Show buttons
    copyBtn?.classList.remove('hidden');
    speakBtn?.classList.remove('hidden');

    // Add to history
    addToHistory(originalText, result.text, direction);
}

// Deep Dive: Highlight words found in dictionary
function highlightDictionaryWords(text) {
    if (typeof pidginDataLoader === 'undefined' || !pidginDataLoader.loaded) return escapeHtml(text);

    const entries = pidginDataLoader.getAllEntries();
    // Sort by length descending to match longer phrases first
    const sortedEntries = [...entries].sort((a, b) => b.pidgin.length - a.pidgin.length);
    
    let highlighted = escapeHtml(text);

    // We use a placeholder approach to prevent nested highlights
    const placeholders = [];
    
    sortedEntries.forEach((entry, idx) => {
        const word = entry.pidgin;
        if (word.length < 3) return; // Skip very short words

        // Match word boundaries, case insensitive
        const regex = new RegExp(`\\b(${word})\\b`, 'gi');
        
        if (regex.test(highlighted)) {
            highlighted = highlighted.replace(regex, (match) => {
                const placeholder = `__DICT_HL_${placeholders.length}__`;
                placeholders.push({
                    placeholder,
                    html: `<span class="dict-highlight text-purple-700 font-bold" data-id="${entry.id || entry.key}">${match}</span>`
                });
                return placeholder;
            });
        }
    });

    // Replace placeholders with actual HTML
    placeholders.forEach(p => {
        highlighted = highlighted.replace(p.placeholder, p.html);
    });

    return highlighted;
}

// Show Word Discovery details
function showWordDiscovery(wordId) {
    const panel = document.getElementById('word-discovery-panel');
    const content = document.getElementById('word-discovery-content');
    
    if (!panel || !content || !pidginDataLoader) return;

    const entry = pidginDataLoader.getById(wordId);
    if (!entry) return;

    const english = Array.isArray(entry.english) ? entry.english.join(', ') : entry.english;
    const example = Array.isArray(entry.examples) ? entry.examples[0] : (entry.example || '');

    const escapedPidgin = escapeHtml(entry.pidgin);
    const escapedCategory = escapeHtml(entry.category);
    const escapedEnglish = escapeHtml(english);
    const escapedPronunciation = entry.pronunciation ? escapeHtml(entry.pronunciation) : null;
    const escapedExample = example ? escapeHtml(example) : null;

    content.innerHTML = `
        <div class="flex flex-col gap-2">
            <div class="flex justify-between items-baseline">
                <span class="text-3xl font-black text-purple-700">${escapedPidgin}</span>
                <span class="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full font-bold uppercase">${escapedCategory}</span>
            </div>
            <p class="text-lg text-gray-700 font-medium">${escapedEnglish}</p>
            ${escapedPronunciation ? `<p class="text-sm text-gray-500 italic">[${escapedPronunciation}]</p>` : ''}
            ${escapedExample ? `
                <div class="mt-4 bg-gray-50 p-4 rounded-xl border-l-4 border-gray-200">
                    <p class="text-xs font-bold text-gray-400 uppercase mb-1">Example</p>
                    <p class="text-gray-700 italic">"${escapedExample}"</p>
                </div>
            ` : ''}
        </div>
    `;

    // Configure buttons
    const practiceBtn = document.getElementById('discovery-practice-btn');
    const listenBtn = document.getElementById('discovery-listen-btn');

    if (practiceBtn) {
        practiceBtn.onclick = () => {
            if (typeof window.practiceSession !== 'undefined') {
                window.practiceSession.start(wordId, 'quiz');
            } else {
                window.location.href = `/learning-hub.html?word=${wordId}`;
            }
        };
    }

    if (listenBtn) {
        listenBtn.onclick = () => {
            if (typeof speakText === 'function') {
                speakText(entry.audioExample || entry.pidgin);
            }
        };
    }

    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Initialize Discovery UI
function setupDiscoveryUI() {
    const closeBtn = document.getElementById('close-discovery-btn');
    const panel = document.getElementById('word-discovery-panel');

    closeBtn?.addEventListener('click', () => {
        panel?.classList.add('hidden');
    });
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

            // Set text (manual translation only)
            inputField.value = text;
            updateCharacterCount();

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
            const escapedOriginal = escapeHtml(item.original);
            const escapedTranslation = escapeHtml(item.translation);
            const escapedDirectionLabel = escapeHtml(direction);
            const escapedTime = escapeHtml(time);
            const escapedDirectionKey = escapeHtml(item.direction);

            return `
                <div class="border-l-4 border-purple-400 pl-4 py-2 hover:bg-gray-50 transition cursor-pointer history-item"
                     data-original="${escapedOriginal}" data-translation="${escapedTranslation}" data-direction="${escapedDirectionKey}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <p class="text-gray-700">${escapedOriginal}</p>
                            <p class="text-purple-600 font-medium">→ ${escapedTranslation}</p>
                        </div>
                        <div class="text-xs text-gray-500 ml-4">
                            <div>${escapedDirectionLabel}</div>
                            <div>${escapedTime}</div>
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

                // Set text (manual translation only)
                inputField.value = original;
                updateCharacterCount();

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
            micBtn.innerHTML = '<i class="ti ti-circle-filled"></i> Listening...';
        } else {
            recognition.stop();
            isListening = false;
            micBtn.classList.remove('text-red-600', 'animate-pulse');
            micBtn.innerHTML = '<i class="ti ti-microphone"></i> Voice Input';
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
        } else if (interimTranscript) {
            inputField.value = interimTranscript;
            updateCharacterCount();
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        micBtn.classList.remove('text-red-600', 'animate-pulse');
        micBtn.innerHTML = '<i class="ti ti-microphone"></i> Voice Input';

        if (event.error === 'not-allowed') {
            alert('Please allow microphone access to use voice input');
        }
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('text-red-600', 'animate-pulse');
        micBtn.innerHTML = '<i class="ti ti-microphone"></i> Voice Input';
    };
}

// Mobile menu functionality is handled by the shared navigation component
// (src/components/shared/navigation.html) - do not duplicate here

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

// Helper function to escape HTML entities to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}