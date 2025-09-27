// Main JavaScript file for Pidgin Pal

// Handle browser extension errors gracefully
window.addEventListener('error', function(event) {
    // Suppress browser extension errors that don't affect our app
    if (event.message && event.message.includes('message channel closed')) {
        event.preventDefault();
        return true;
    }
});

// Handle unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', function(event) {
    // Suppress browser extension promise rejections
    if (event.reason && event.reason.message &&
        event.reason.message.includes('message channel closed')) {
        event.preventDefault();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initNavigation();
    initDailyPhrase();
    initEssentialPhrases();
    initTranslator();
    initLearningHub();
    initStoryCorner();
    initCommunity();
    initSmoothScrolling();
    initVoiceSettings();

    // Preload common phrases to minimize API calls
    preloadCommonPhrases();
});

// Preload frequently used phrases
async function preloadCommonPhrases() {
    // Only preload if ElevenLabs is available
    if (typeof elevenLabsSpeech !== 'undefined') {
        // Most common phrases from the daily phrases and essentials
        const commonPhrases = [
            "howzit", "aloha", "mahalo", "shoots", "rajah",
            "no worry beef curry", "broke da mouth", "grindz",
            "talk story", "pau hana", "da kine", "chicken skin"
        ];

        // Only preload from network if we don't have cached items
        const cachedCount = elevenLabsSpeech.cache.size;
        if (cachedCount > 0) {
            console.log(`Using ${cachedCount} cached audio items from previous sessions`);
            return;
        }

        // Preload silently in the background (only when API is available)
        console.log('Will preload phrases when API is available...');

        // Don't attempt preloading since ElevenLabs is currently blocked
        // Uncomment this when API is working:
        /*
        for (const phrase of commonPhrases) {
            try {
                // Check if already cached before preloading
                if (!elevenLabsSpeech.cache.has(phrase.toLowerCase())) {
                    // Small delay between preloads to avoid overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await elevenLabsSpeech.speak(phrase, { silent: true });
                }
            } catch (error) {
                console.warn(`Failed to preload "${phrase}":`, error);
                break; // Stop trying if API fails
            }
        }
        */
    }
}

// Navigation functionality
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}

// Daily phrase functionality
async function initDailyPhrase() {
    const phrasePidgin = document.getElementById('phrase-pidgin');
    const phraseEnglish = document.getElementById('phrase-english');
    const phraseUsage = document.getElementById('phrase-usage');
    const speakBtn = document.getElementById('speak-phrase');
    const generateBtn = document.getElementById('generate-phrase');

    if (!phrasePidgin || !phraseEnglish || !phraseUsage) {
        console.log('Daily phrase elements not found');
        return;
    }

    // Function to load and display a phrase
    async function loadPhrase(forceNew = false) {
        // Wait for phrases to load if needed
        if (typeof getDailyPhrase === 'undefined') {
            console.log('getDailyPhrase function not available yet, retrying...');
            setTimeout(() => initDailyPhrase(), 1000);
            return;
        }

        let dailyPhrase = getDailyPhrase(); // getDailyPhrase already returns random phrases

        // If phrases aren't loaded yet, wait for them
        if (!dailyPhrase && window.phrasesLoadPromise) {
            console.log('Waiting for phrases to load for daily phrase...');
            try {
                await window.phrasesLoadPromise;
                dailyPhrase = getDailyPhrase();
            } catch (error) {
                console.log('Could not load phrases for daily phrase');
                return;
            }
        }

        if (dailyPhrase) {
            console.log('✅ Setting daily phrase:', dailyPhrase.pidgin);

            // Add animation effect
            const phraseContainer = document.getElementById('daily-phrase');
            if (phraseContainer && forceNew) {
                phraseContainer.style.transform = 'scale(0.95)';
                phraseContainer.style.opacity = '0.7';

                setTimeout(() => {
                    phrasePidgin.textContent = dailyPhrase.pidgin;
                    phraseEnglish.textContent = dailyPhrase.english;
                    phraseUsage.textContent = dailyPhrase.context || dailyPhrase.usage || '';

                    phraseContainer.style.transform = 'scale(1)';
                    phraseContainer.style.opacity = '1';
                }, 200);
            } else {
                phrasePidgin.textContent = dailyPhrase.pidgin;
                phraseEnglish.textContent = dailyPhrase.english;
                phraseUsage.textContent = dailyPhrase.context || dailyPhrase.usage || '';
            }

            // Store current phrase for buttons
            window.currentDailyPhrase = dailyPhrase;
        } else {
            console.log('No daily phrase available, keeping default');
        }
    }

    // Initial load
    await loadPhrase();

    // Set up speak button
    if (speakBtn) {
        speakBtn.addEventListener('click', () => {
            if (window.currentDailyPhrase && window.currentDailyPhrase.pidgin) {
                speakText(window.currentDailyPhrase.pidgin);
            } else {
                console.warn('Daily phrase not available for speech');
            }
        });
    }

    // Set up generate new phrase button
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            // Show loading state
            const originalText = generateBtn.innerHTML;
            generateBtn.innerHTML = '⏳ Generating...';
            generateBtn.disabled = true;
            generateBtn.style.transform = 'scale(0.95)';

            await loadPhrase(true); // Force new phrase

            setTimeout(() => {
                generateBtn.innerHTML = originalText;
                generateBtn.disabled = false;
                generateBtn.style.transform = 'scale(1)';
            }, 500);
        });
    }
}

// Helper function to get a random phrase (for refresh functionality)
function getRandomPhrase() {
    if (typeof window !== 'undefined' && window.pidginPhrases && window.pidginPhrases.length > 0) {
        const randomIndex = Math.floor(Math.random() * window.pidginPhrases.length);
        return window.pidginPhrases[randomIndex];
    }
    return null;
}

// Function to save favorite phrases to localStorage
function saveFavoritePhrase(phrase) {
    try {
        let favorites = JSON.parse(localStorage.getItem('favoritePhrases') || '[]');

        // Check if phrase already exists
        const exists = favorites.some(fav => fav.pidgin === phrase.pidgin);
        if (!exists) {
            favorites.unshift({
                ...phrase,
                savedAt: new Date().toISOString()
            });

            // Keep only last 20 favorites
            favorites = favorites.slice(0, 20);

            localStorage.setItem('favoritePhrases', JSON.stringify(favorites));
            console.log('✅ Phrase saved to favorites');
        } else {
            console.log('Phrase already in favorites');
        }
    } catch (error) {
        console.error('Failed to save favorite phrase:', error);
    }
}

// Essential phrases functionality
async function initEssentialPhrases() {
    const grid = document.getElementById('essential-phrases-grid');
    if (!grid) return;

    // Wait for phrases to load if they haven't yet
    if (typeof window.pidginPhrases === 'undefined' || window.pidginPhrases.length === 0) {
        if (window.phrasesLoadPromise) {
            console.log('Waiting for phrases to load...');
            try {
                await window.phrasesLoadPromise;
            } catch (error) {
                console.log('Could not load phrases for essential phrases');
                return;
            }
        } else {
            console.log('No phrases available for essential phrases');
            return;
        }
    }

    // Use the new pidginPhrases array format
    const allPhrases = [...window.pidginPhrases];
    if (allPhrases.length === 0) {
        console.log('No phrases loaded yet for essential phrases');
        return;
    }

    const selectedPhrases = [];

    for (let i = 0; i < 6 && allPhrases.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * allPhrases.length);
        selectedPhrases.push(allPhrases.splice(randomIndex, 1)[0]);
    }

    // Create HTML for each phrase
    grid.innerHTML = selectedPhrases.map(phrase => `
        <div class="phrase-card bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <h3 class="text-xl font-bold text-green-600 mb-2">${phrase.pidgin}</h3>
            <p class="text-gray-600 mb-2">${phrase.english}</p>
            <p class="text-sm text-gray-500">${phrase.context || phrase.usage || ''}</p>
        </div>
    `).join('');
}


// Translator functionality
function initTranslator() {
    const translatorInput = document.getElementById('translator-input');
    const translateBtn = document.getElementById('translate-btn');
    const translatorOutput = document.getElementById('translator-output');
    const speakTranslationBtn = document.getElementById('speak-translation');
    const engToPidginBtn = document.getElementById('eng-to-pidgin');
    const pidginToEngBtn = document.getElementById('pidgin-to-eng');
    const inputLabel = document.getElementById('input-label');
    const outputLabel = document.getElementById('output-label');

    // Early return if translator elements don't exist
    if (!translatorInput || !translatorOutput) {
        return;
    }

    let currentDirection = 'eng-to-pidgin';
    let autoTranslateEnabled = true; // Always enabled
    let typingTimer;
    const typingDelay = 800; // Wait 800ms after user stops typing

    // Auto-translate status display (no longer a toggle)
    function initAutoTranslateDisplay() {
        // Create auto-translate status display if it doesn't exist
        let autoStatusContainer = document.getElementById('auto-translate-container');
        if (!autoStatusContainer && translatorInput) {
            autoStatusContainer = document.createElement('div');
            autoStatusContainer.id = 'auto-translate-container';
            autoStatusContainer.className = 'flex items-center justify-center mb-4';
            autoStatusContainer.innerHTML = `
                <div class="flex items-center">
                    <div class="relative">
                        <div class="block bg-green-500 w-14 h-8 rounded-full"></div>
                        <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform translate-x-6"></div>
                    </div>
                    <span class="ml-3 text-gray-700 font-medium">Auto-translate</span>
                </div>
            `;

            // Insert before the translator input
            const translatorSection = translatorInput.closest('.mb-6');
            if (translatorSection) {
                translatorSection.parentNode.insertBefore(autoStatusContainer, translatorSection);
            }
        }
    }

    // Initialize auto-translate display
    initAutoTranslateDisplay();

    // Perform translation (shared function)
    function performTranslation() {
        const inputText = translatorInput.value.trim();
        if (!inputText) {
            translatorOutput.textContent = '';
            speakTranslationBtn.classList.add('hidden');
            return;
        }

        // Clear previous output
        translatorOutput.textContent = '';
        speakTranslationBtn.classList.add('hidden');

        // Remove any existing additional elements
        const existingElements = translatorOutput.querySelectorAll('.pronunciation-guide, .confidence-indicator, .suggestions-box');
        existingElements.forEach(el => el.remove());

        // Translate with enhanced features
        const result = translator.translate(inputText, currentDirection);
        const translatedText = typeof result === 'string' ? result : result.text;

        translatorOutput.textContent = translatedText;

        // Show pronunciation button
        if (speakTranslationBtn && translatedText) {
            speakTranslationBtn.classList.remove('hidden');
            speakTranslationBtn.onclick = () => speakText(translatedText);
        }

        // Add enhanced features if result is object
        if (typeof result === 'object') {
            // Add confidence indicator
            if (result.confidence !== undefined) {
                const confidenceEl = document.createElement('div');
                confidenceEl.className = 'confidence-indicator flex items-center mt-2 text-sm';

                const confidenceColor = result.confidence >= 80 ? 'text-green-600' :
                                      result.confidence >= 60 ? 'text-yellow-600' : 'text-red-600';

                confidenceEl.innerHTML = `
                    <span class="${confidenceColor} font-semibold">Confidence: ${result.confidence}%</span>
                    <div class="ml-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full ${result.confidence >= 80 ? 'bg-green-500' :
                                           result.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'}"
                             style="width: ${result.confidence}%"></div>
                    </div>
                `;
                translatorOutput.appendChild(confidenceEl);
            }

            // Add suggestions if available
            if (result.suggestions && result.suggestions.length > 0) {
                const suggestionsEl = document.createElement('div');
                suggestionsEl.className = 'suggestions-box mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200';
                suggestionsEl.innerHTML = `
                    <div class="text-sm font-semibold text-blue-800 mb-2">💡 Suggestions:</div>
                    ${result.suggestions.map(suggestion =>
                        `<div class="text-sm text-blue-700 mb-1">• ${suggestion}</div>`
                    ).join('')}
                `;
                translatorOutput.appendChild(suggestionsEl);
            }

            // Add pronunciation guide
            if (result.pronunciation) {
                const guideEl = document.createElement('p');
                guideEl.className = 'text-sm text-gray-600 mt-2 italic pronunciation-guide';
                guideEl.textContent = result.pronunciation;
                translatorOutput.appendChild(guideEl);
            }
        } else if (currentDirection === 'eng-to-pidgin') {
            // Fallback for old format
            const pronunciation = translator.getPronunciation(translatedText);
            if (pronunciation) {
                const guideEl = document.createElement('p');
                guideEl.className = 'text-sm text-gray-600 mt-2 italic pronunciation-guide';
                guideEl.textContent = pronunciation;
                translatorOutput.appendChild(guideEl);
            }
        }
    }

    // Add auto-translate input listener
    if (translatorInput) {
        translatorInput.addEventListener('input', () => {
            clearTimeout(typingTimer);

            if (autoTranslateEnabled) {
                typingTimer = setTimeout(() => {
                    performTranslation();
                }, typingDelay);
            }
        });
    }

    // Toggle button functionality
    if (engToPidginBtn && pidginToEngBtn) {
        engToPidginBtn.addEventListener('click', () => {
            // Don't switch if already in this mode
            if (currentDirection === 'eng-to-pidgin') return;

            currentDirection = 'eng-to-pidgin';

            // Update button styles - ensure complete class reset
            engToPidginBtn.className = 'px-6 py-2 rounded-full bg-green-500 text-white transition';
            pidginToEngBtn.className = 'px-6 py-2 rounded-full hover:bg-gray-200 transition';

            // Update labels and placeholders
            if (inputLabel) inputLabel.textContent = 'English';
            if (outputLabel) outputLabel.textContent = 'Pidgin';
            translatorInput.placeholder = 'Type English text here...';
            if (translateBtn) translateBtn.textContent = 'Translate to Pidgin';

            // Clear input field and output
            translatorInput.value = '';
            translatorOutput.textContent = '';
            if (speakTranslationBtn) speakTranslationBtn.classList.add('hidden');

            // Remove any existing additional elements
            const existingElements = translatorOutput.querySelectorAll('.pronunciation-guide, .confidence-indicator, .suggestions-box');
            existingElements.forEach(el => el.remove());
        });

        pidginToEngBtn.addEventListener('click', () => {
            // Don't switch if already in this mode
            if (currentDirection === 'pidgin-to-eng') return;

            currentDirection = 'pidgin-to-eng';

            // Update button styles - ensure complete class reset
            pidginToEngBtn.className = 'px-6 py-2 rounded-full bg-green-500 text-white transition';
            engToPidginBtn.className = 'px-6 py-2 rounded-full hover:bg-gray-200 transition';

            // Update labels and placeholders
            if (inputLabel) inputLabel.textContent = 'Pidgin';
            if (outputLabel) outputLabel.textContent = 'English';
            translatorInput.placeholder = 'Type Pidgin text here...';
            if (translateBtn) translateBtn.textContent = 'Translate to English';

            // Clear input field and output
            translatorInput.value = '';
            translatorOutput.textContent = '';
            if (speakTranslationBtn) speakTranslationBtn.classList.add('hidden');

            // Remove any existing additional elements
            const existingElements = translatorOutput.querySelectorAll('.pronunciation-guide, .confidence-indicator, .suggestions-box');
            existingElements.forEach(el => el.remove());
        });
    }


    // Remove translate button since auto-translate is always on
    if (translateBtn) {
        translateBtn.style.display = 'none';
    }
}

// Learning Hub functionality
function initLearningHub() {
    const levelBtns = document.querySelectorAll('.level-btn');
    const lessonsContainer = document.getElementById('lessons-container');
    const quizSection = document.getElementById('quiz-section');

    // Return early if no level buttons found
    if (!levelBtns.length) return;

    let currentLevel = 'beginner';

    // Level switching
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLevel = btn.dataset.level;

            // First reset ALL buttons to inactive state - completely clear className
            levelBtns.forEach(b => {
                // Start fresh with base classes only
                b.className = 'level-btn px-4 sm:px-8 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base';

                // Add hover effects based on level
                const level = b.dataset.level;
                if (level === 'beginner') {
                    b.className += ' hover:bg-gradient-to-r hover:from-green-400 hover:to-emerald-500 hover:text-white';
                } else if (level === 'intermediate') {
                    b.className += ' hover:bg-gradient-to-r hover:from-orange-400 hover:to-orange-500 hover:text-white';
                } else if (level === 'advanced') {
                    b.className += ' hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white';
                }
            });

            // Set active button styles for clicked button
            const level = btn.dataset.level;
            btn.className = 'level-btn px-4 sm:px-8 py-3 rounded-xl text-white font-bold shadow-lg transform hover:scale-105 transition-all text-sm sm:text-base';

            // Add the appropriate gradient background for active state
            if (level === 'beginner') {
                btn.className += ' bg-gradient-to-r from-green-500 to-emerald-600';
            } else if (level === 'intermediate') {
                btn.className += ' bg-gradient-to-r from-orange-500 to-orange-600';
            } else if (level === 'advanced') {
                btn.className += ' bg-gradient-to-r from-red-500 to-pink-600';
            }

            // Load lessons for selected level
            loadLessons(currentLevel);
        });
    });

    // Initialize button states on page load - use setTimeout to ensure DOM is ready
    setTimeout(() => {
        levelBtns.forEach(b => {
            const level = b.dataset.level;
            if (level === currentLevel) {
                // Set active state for the current level (beginner by default)
                if (level === 'beginner') {
                    b.className = 'level-btn px-4 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg transform hover:scale-105 transition-all text-sm sm:text-base';
                } else if (level === 'intermediate') {
                    b.className = 'level-btn px-4 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg transform hover:scale-105 transition-all text-sm sm:text-base';
                } else if (level === 'advanced') {
                    b.className = 'level-btn px-4 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold shadow-lg transform hover:scale-105 transition-all text-sm sm:text-base';
                }
            } else {
                // Set inactive state for other buttons
                if (level === 'beginner') {
                    b.className = 'level-btn px-4 sm:px-8 py-3 rounded-xl hover:bg-gradient-to-r hover:from-green-400 hover:to-emerald-500 hover:text-white font-semibold transition-all text-sm sm:text-base';
                } else if (level === 'intermediate') {
                    b.className = 'level-btn px-4 sm:px-8 py-3 rounded-xl hover:bg-gradient-to-r hover:from-orange-400 hover:to-orange-500 hover:text-white font-semibold transition-all text-sm sm:text-base';
                } else if (level === 'advanced') {
                    b.className = 'level-btn px-4 sm:px-8 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white font-semibold transition-all text-sm sm:text-base';
                }
            }
        });
    }, 100); // Small delay to ensure DOM and CSS are ready

    // Load initial lessons (only if lessons container exists)
    if (lessonsContainer) {
        loadLessons(currentLevel);
    }

    function loadLessons(level) {
        if (!lessonsContainer) return;

        const lessons = lessonsData[level];
        lessonsContainer.innerHTML = '';

        lessons.forEach(lesson => {
            const lessonCard = createLessonCard(lesson);
            lessonsContainer.appendChild(lessonCard);
        });
    }

    function createLessonCard(lesson) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer';

        card.innerHTML = `
            <div class="text-4xl mb-3">${lesson.icon}</div>
            <h3 class="text-xl font-bold mb-3 text-gray-800">${lesson.title}</h3>
            <p class="text-gray-600 mb-4">Learn essential ${lesson.title.toLowerCase()} in Pidgin</p>
            <button class="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition">
                Start Lesson →
            </button>
        `;

        card.addEventListener('click', () => {
            showLessonDetail(lesson, currentLevel);
        });

        return card;
    }

    function showLessonDetail(lesson, level) {
        // Create modal for lesson detail
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';

        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8';

        modalContent.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-bold text-gray-800">
                    <span class="text-4xl mr-3">${lesson.icon}</span>
                    ${lesson.title}
                </h2>
                <button class="close-modal text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
            </div>

            <div class="mb-6">
                <h3 class="text-xl font-bold mb-4 text-green-600">Vocabulary</h3>
                <div class="space-y-4">
                    ${lesson.content.vocabulary.map(item => `
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-lg font-bold text-gray-800">${item.pidgin}</span>
                                <span class="text-gray-600">${item.english}</span>
                            </div>
                            <p class="text-gray-700 italic">"${item.example}"</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="mb-6 bg-blue-50 rounded-lg p-4">
                <h3 class="text-lg font-bold mb-2 text-blue-800">Cultural Note</h3>
                <p class="text-gray-700">${lesson.content.culturalNote}</p>
            </div>

            <div class="mb-6 bg-green-50 rounded-lg p-4">
                <h3 class="text-lg font-bold mb-2 text-green-800">Practice</h3>
                <p class="text-gray-700">${lesson.content.practice}</p>
            </div>

            <button class="quiz-btn bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition" data-level="${level}" data-lesson-id="${lesson.id}">
                Take Quiz on This Topic →
            </button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modalContent.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Quiz button
        const quizBtn = modalContent.querySelector('.quiz-btn');
        quizBtn.addEventListener('click', () => {
            const lessonId = quizBtn.getAttribute('data-lesson-id');
            document.body.removeChild(modal);
            startLessonQuiz(lesson);
        });
    }

    // Generate quiz questions dynamically from lesson vocabulary
    function generateLessonQuiz(lesson) {
        const questions = [];
        const vocab = lesson.content.vocabulary;

        // Shuffle vocabulary to randomize questions
        const shuffledVocab = [...vocab].sort(() => Math.random() - 0.5);

        // Generate 5-6 questions from the lesson vocabulary
        const numQuestions = Math.min(6, vocab.length);

        for (let i = 0; i < numQuestions; i++) {
            const currentWord = shuffledVocab[i];

            // Type 1: What does this Pidgin word mean?
            if (i % 3 === 0) {
                // Create wrong options from other vocabulary items
                const wrongOptions = vocab
                    .filter(v => v.pidgin !== currentWord.pidgin)
                    .map(v => v.english)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);

                // If not enough wrong options, add generic ones
                while (wrongOptions.length < 3) {
                    const genericWrong = ['Something else', 'Not sure', 'Different meaning', 'Other'];
                    wrongOptions.push(genericWrong[wrongOptions.length]);
                }

                const allOptions = [currentWord.english, ...wrongOptions].sort(() => Math.random() - 0.5);

                questions.push({
                    question: `What does "${currentWord.pidgin}" mean?`,
                    options: allOptions,
                    correct: allOptions.indexOf(currentWord.english)
                });
            }
            // Type 2: How do you say this in Pidgin?
            else if (i % 3 === 1) {
                const wrongOptions = vocab
                    .filter(v => v.pidgin !== currentWord.pidgin)
                    .map(v => v.pidgin)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);

                while (wrongOptions.length < 3) {
                    const genericWrong = ['Da kine', 'Someting', 'Dat one', 'Oddah one'];
                    wrongOptions.push(genericWrong[wrongOptions.length]);
                }

                const allOptions = [currentWord.pidgin, ...wrongOptions].sort(() => Math.random() - 0.5);

                questions.push({
                    question: `How do you say "${currentWord.english}" in Pidgin?`,
                    options: allOptions,
                    correct: allOptions.indexOf(currentWord.pidgin)
                });
            }
            // Type 3: Complete the sentence
            else {
                if (currentWord.example) {
                    // Replace the Pidgin word in the example with a blank
                    const blankedExample = currentWord.example.replace(
                        new RegExp(currentWord.pidgin, 'i'),
                        '_____'
                    );

                    const wrongOptions = vocab
                        .filter(v => v.pidgin !== currentWord.pidgin)
                        .map(v => v.pidgin)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3);

                    while (wrongOptions.length < 3) {
                        const genericWrong = ['Da kine', 'Someting', 'Dat one', 'Oddah one'];
                        wrongOptions.push(genericWrong[wrongOptions.length]);
                    }

                    const allOptions = [currentWord.pidgin, ...wrongOptions].sort(() => Math.random() - 0.5);

                    questions.push({
                        question: `Complete the sentence: "${blankedExample}"`,
                        options: allOptions,
                        correct: allOptions.indexOf(currentWord.pidgin)
                    });
                }
            }
        }

        return questions;
    }

    // Start a quiz for a specific lesson
    function startLessonQuiz(lesson) {
        if (!quizSection) return;

        quizSection.classList.remove('hidden');

        // Generate questions specific to this lesson
        const questions = generateLessonQuiz(lesson);

        // Smooth scroll to quiz section for better mobile UX
        setTimeout(() => {
            const quizSectionTop = quizSection.getBoundingClientRect().top + window.pageYOffset;
            const offset = 100;

            window.scrollTo({
                top: quizSectionTop - offset,
                behavior: 'smooth'
            });

            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    quizSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300);
            }

            // Add a subtle highlight effect to draw attention
            quizSection.style.transition = 'box-shadow 0.3s ease';
            quizSection.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.5)';

            setTimeout(() => {
                quizSection.style.boxShadow = '';
            }, 2000);
        }, 100);

        const quizContent = document.getElementById('quiz-content');
        let currentQuestion = 0;
        let score = 0;

        function showQuestion() {
            if (currentQuestion >= questions.length) {
                showResults();
                return;
            }

            const q = questions[currentQuestion];
            quizContent.innerHTML = `
                <div class="mb-6">
                    <h3 class="text-xl font-bold mb-2">Question ${currentQuestion + 1} of ${questions.length}</h3>
                    <p class="text-lg mb-4">${q.question}</p>
                    <div class="space-y-2">
                        ${q.options.map((option, index) => `
                            <button class="quiz-option w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition" data-index="${index}">
                                ${option}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;

            const optionBtns = quizContent.querySelectorAll('.quiz-option');
            optionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const selectedIndex = parseInt(btn.dataset.index);
                    if (selectedIndex === q.correct) {
                        score++;
                        btn.classList.add('bg-green-100', 'border-green-500');
                    } else {
                        btn.classList.add('bg-red-100', 'border-red-500');
                        optionBtns[q.correct].classList.add('bg-green-100', 'border-green-500');
                    }

                    setTimeout(() => {
                        currentQuestion++;
                        showQuestion();
                    }, 1500);
                });
            });
        }

        function showResults() {
            const percentage = Math.round((score / questions.length) * 100);
            quizContent.innerHTML = `
                <div class="text-center">
                    <h3 class="text-2xl font-bold mb-4">Lesson Quiz Complete!</h3>
                    <p class="text-4xl font-bold mb-4 ${percentage >= 70 ? 'text-green-600' : 'text-orange-600'}">
                        ${percentage}%
                    </p>
                    <p class="text-lg mb-6">You got ${score} out of ${questions.length} questions correct!</p>
                    <p class="text-md mb-6 text-gray-600">This quiz tested your knowledge of: <strong>${lesson.title}</strong></p>
                    <div class="space-y-3">
                        <button id="try-another-quiz" class="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition">
                            Try This Quiz Again
                        </button>
                        <br>
                        <button id="close-quiz" class="bg-gray-500 text-white px-6 py-3 rounded-full hover:bg-gray-600 transition">
                            Close Quiz
                        </button>
                    </div>
                </div>
            `;

            // Add event listeners for the new buttons
            const tryAnotherBtn = document.getElementById('try-another-quiz');
            const closeQuizBtn = document.getElementById('close-quiz');

            if (tryAnotherBtn) {
                tryAnotherBtn.addEventListener('click', () => {
                    // Restart the same lesson quiz
                    startLessonQuiz(level, lessonId, lesson);
                });
            }

            if (closeQuizBtn) {
                closeQuizBtn.addEventListener('click', () => {
                    // Hide the quiz section
                    quizSection.classList.add('hidden');
                });
            }
        }

        showQuestion();
    }

    // Keep the old startQuiz function for backward compatibility
    function startQuiz(level) {
        if (!quizSection) return;

        quizSection.classList.remove('hidden');

        // Smooth scroll to quiz section for better mobile UX
        setTimeout(() => {
            // Get the quiz section position
            const quizSectionTop = quizSection.getBoundingClientRect().top + window.pageYOffset;
            // Add a small offset to ensure the quiz header is visible
            const offset = 100;

            // Smooth scroll to the quiz section
            window.scrollTo({
                top: quizSectionTop - offset,
                behavior: 'smooth'
            });

            // For mobile devices, ensure the quiz content is in view
            if (window.innerWidth <= 768) {
                // Additional focus for mobile to ensure visibility
                setTimeout(() => {
                    quizSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300);
            }

            // Add a subtle highlight effect to draw attention
            quizSection.style.transition = 'box-shadow 0.3s ease';
            quizSection.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.5)';

            // Remove the highlight after a moment
            setTimeout(() => {
                quizSection.style.boxShadow = '';
            }, 2000);
        }, 100); // Small delay to ensure quiz is rendered

        const quizContent = document.getElementById('quiz-content');
        const questions = generateLessonQuiz(lesson);
        let currentQuestion = 0;
        let score = 0;

        function showQuestion() {
            if (currentQuestion >= questions.length) {
                showResults();
                return;
            }

            const q = questions[currentQuestion];
            quizContent.innerHTML = `
                <div class="mb-6">
                    <p class="text-lg font-semibold mb-2">Question ${currentQuestion + 1} of ${questions.length}</p>
                    <p class="text-sm text-gray-600 mb-4">Lesson: ${lesson.title}</p>
                    <p class="text-xl mb-6">${q.question}</p>
                    <div class="space-y-3">
                        ${q.options.map((option, index) => `
                            <button class="quiz-option w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition" data-index="${index}">
                                ${option}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;

            const optionBtns = quizContent.querySelectorAll('.quiz-option');
            optionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const selectedIndex = parseInt(btn.dataset.index);
                    if (selectedIndex === q.correct) {
                        score++;
                        btn.classList.add('bg-green-100', 'border-green-500');
                    } else {
                        btn.classList.add('bg-red-100', 'border-red-500');
                        optionBtns[q.correct].classList.add('bg-green-100', 'border-green-500');
                    }

                    setTimeout(() => {
                        currentQuestion++;
                        showQuestion();
                    }, 1500);
                });
            });
        }

        function showResults() {
            const percentage = Math.round((score / questions.length) * 100);
            quizContent.innerHTML = `
                <div class="text-center">
                    <h3 class="text-2xl font-bold mb-4">Quiz Complete!</h3>
                    <p class="text-sm text-gray-600 mb-2">Lesson: ${lesson.title}</p>
                    <p class="text-4xl font-bold mb-4 ${percentage >= 70 ? 'text-green-600' : 'text-orange-600'}">
                        ${percentage}%
                    </p>
                    <p class="text-lg mb-6">You got ${score} out of ${questions.length} questions correct!</p>
                    <div class="space-y-3">
                        <button id="try-another-quiz" class="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition">
                            Try Another Quiz
                        </button>
                        <br>
                        <button id="close-quiz" class="bg-gray-500 text-white px-6 py-3 rounded-full hover:bg-gray-600 transition">
                            Close Quiz
                        </button>
                    </div>
                </div>
            `;

            // Add event listeners for the new buttons
            const tryAnotherBtn = document.getElementById('try-another-quiz');
            const closeQuizBtn = document.getElementById('close-quiz');

            if (tryAnotherBtn) {
                tryAnotherBtn.addEventListener('click', () => {
                    // Reset quiz state
                    currentQuestion = 0;
                    score = 0;
                    // Restart the quiz
                    showQuestion();
                });
            }

            if (closeQuizBtn) {
                closeQuizBtn.addEventListener('click', () => {
                    // Hide the quiz section
                    quizSection.classList.add('hidden');
                });
            }
        }

        showQuestion();
    }
}

// Community functionality
function initCommunity() {
    const askForm = document.getElementById('ask-form');

    if (askForm) {
        askForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const textarea = askForm.querySelector('textarea');
            if (textarea.value.trim()) {
                // In a real app, this would send to a backend
                alert('Tanks fo\' your question! We going answer you soon!');
                textarea.value = '';
            }
        });
    }

    // Initialize story functionality
    initStories();
}

// Story functionality
function initStories() {
    // Read More button functionality for individual stories
    const readMoreBtns = document.querySelectorAll('.read-more-btn');
    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const storyPreview = btn.closest('.story-preview');
            const storyId = storyPreview.dataset.story;
            showFullStory(storyId);
        });
    });

    // Show More Stories button
    const showMoreBtn = document.getElementById('show-more-stories');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            showAllStories();
        });
    }
}

// Show full story in modal
function showFullStory(storyId) {
    const story = getStoryById(storyId);
    if (!story) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <!-- Header -->
            <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 rounded-t-2xl">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-4xl mb-2 block">📖</span>
                        <h2 class="text-3xl font-bold mb-2">${story.title}</h2>
                        <p class="text-orange-100 text-lg">Hawaiian Pidgin Short Story</p>
                    </div>
                    <button class="close-modal text-white hover:text-orange-200 text-3xl font-bold">×</button>
                </div>
            </div>

            <!-- Story Content -->
            <div class="p-8">
                <div class="prose prose-lg max-w-none">
                    <div class="text-gray-800 leading-relaxed text-lg whitespace-pre-line">${story.pidginText}</div>
                </div>
            </div>

            <!-- Actions -->
            <div class="p-8 border-t bg-gray-50 rounded-b-2xl">
                <div class="flex gap-4 justify-center flex-wrap">
                    <button class="px-8 py-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition font-semibold listen-story">
                        🔊 Listen to Story
                    </button>
                    <button class="px-8 py-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition font-semibold share-story">
                        📤 Share Story
                    </button>
                    <button class="px-8 py-4 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition font-semibold close-btn">
                        ✓ Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    const closeBtn = modal.querySelector('.close-modal');
    const closeBtnBottom = modal.querySelector('.close-btn');
    const listenBtn = modal.querySelector('.listen-story');
    const shareBtn = modal.querySelector('.share-story');

    // Close modal
    [closeBtn, closeBtnBottom].forEach(btn => {
        btn.addEventListener('click', () => document.body.removeChild(modal));
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    });

    // Listen to story
    listenBtn.addEventListener('click', () => {
        speakText(story.pidginText);
        listenBtn.innerHTML = '🔊 Playing...';
        setTimeout(() => {
            listenBtn.innerHTML = '🔊 Listen to Story';
        }, 3000);
    });

    // Share story
    shareBtn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: story.title,
                text: story.preview,
                url: window.location.href
            });
        } else {
            // Fallback for browsers without Web Share API
            navigator.clipboard.writeText(`${story.title}\n\n${story.pidginText}\n\nFrom ChokePidgin.com`).then(() => {
                shareBtn.innerHTML = '✓ Copied!';
                setTimeout(() => {
                    shareBtn.innerHTML = '📤 Share Story';
                }, 2000);
            });
        }
    });
}

// Show all stories in expanded view
function showAllStories() {
    const storiesContainer = document.getElementById('stories-container');
    const remainingStories = getRemainingStories();
    const showMoreBtn = document.getElementById('show-more-stories');

    // Remove show more button
    if (showMoreBtn && showMoreBtn.parentElement) {
        showMoreBtn.parentElement.remove();
    }

    // Add remaining stories
    remainingStories.forEach(storyId => {
        const story = getStoryById(storyId);
        const article = document.createElement('article');
        article.className = 'mb-6 pb-6 border-b story-preview';
        article.dataset.story = storyId;

        article.innerHTML = `
            <h4 class="text-lg font-bold mb-2">${story.title}</h4>
            <p class="text-gray-700 mb-2 italic">${story.preview}</p>
            <button class="read-more-btn text-green-600 hover:underline">Read More →</button>
        `;

        storiesContainer.appendChild(article);

        // Add event listener to new read more button
        const readMoreBtn = article.querySelector('.read-more-btn');
        readMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showFullStory(storyId);
        });
    });

    // Add "Back to Top" button for stories section
    const backToTopDiv = document.createElement('div');
    backToTopDiv.className = 'text-center mt-6';
    backToTopDiv.innerHTML = `
        <button class="bg-orange-400 text-white px-6 py-3 rounded-full hover:bg-orange-500 transition font-semibold" onclick="document.getElementById('community').scrollIntoView({behavior: 'smooth'})">
            ⬆️ Back to Top
        </button>
    `;
    storiesContainer.appendChild(backToTopDiv);
}

// Initialize Story Corner with randomized stories
async function initStoryCorner() {
    const storyCorner = document.getElementById('story-corner');
    if (!storyCorner) return;

    // Try to get stories from various sources (prioritize consolidated data)
    let stories = [];

    // First try from pidginDataLoader (consolidated data system)
    if (typeof pidginDataLoader !== 'undefined' && pidginDataLoader.masterData && pidginDataLoader.masterData.content && pidginDataLoader.masterData.content.stories) {
        stories = pidginDataLoader.masterData.content.stories;
        console.log('✅ Using stories from consolidated data system');
    }
    // Then try from window.pidginStories (array from stories-data.js)
    else if (typeof window !== 'undefined' && window.pidginStories && Array.isArray(window.pidginStories)) {
        stories = window.pidginStories;
        console.log('✅ Using stories from stories-data.js');
    }
    // Also check the global storiesData
    else if (typeof window !== 'undefined' && window.storiesData && window.storiesData.stories) {
        stories = window.storiesData.stories;
        console.log('✅ Using stories from storiesData');
    }

    if (!stories || stories.length === 0) {
        storyCorner.innerHTML = '<p class="text-gray-500 text-center col-span-full">Stories are loading...</p>';
        console.log('No stories found, will retry in 2 seconds...');
        setTimeout(() => initStoryCorner(), 2000);
        return;
    }

    console.log(`Found ${stories.length} stories for story corner`);

    // Randomize stories array and show 3 random ones
    const shuffledStories = shuffleArray([...stories]);
    const storiesToShow = shuffledStories.slice(0, 3);

    storyCorner.innerHTML = '';

    storiesToShow.forEach((story, index) => {

        const storyCard = document.createElement('div');
        storyCard.className = 'bg-white/95 backdrop-blur rounded-lg shadow-lg p-6 transform hover:scale-105 transition-all duration-200 cursor-pointer';
        storyCard.dataset.storyId = story.id;

        // Create a preview from the pidgin text (first ~100 chars)
        const preview = story.pidginText ? story.pidginText.substring(0, 100) + '...' : 'Click to read this Hawaiian Pidgin story...';

        storyCard.innerHTML = `
            <div class="mb-4">
                <span class="text-3xl">📖</span>
            </div>
            <h4 class="text-xl font-bold text-gray-800 mb-2">${story.title}</h4>
            <p class="text-gray-600 italic line-clamp-3">${preview}</p>
            <button class="mt-4 text-green-600 font-semibold hover:text-green-700 transition">
                Read Story →
            </button>
        `;

        // Add click event to show full story
        storyCard.addEventListener('click', () => {
            showStoryModal(story);
        });

        storyCorner.appendChild(storyCard);
    });

    // Add refresh button
    const refreshButton = document.createElement('div');
    refreshButton.className = 'col-span-full text-center mt-6';
    refreshButton.innerHTML = `
        <button id="refresh-stories" class="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition font-semibold shadow-lg">
            🔄 Show Different Stories
        </button>
    `;
    storyCorner.appendChild(refreshButton);

    // Add refresh functionality
    document.getElementById('refresh-stories').addEventListener('click', () => {
        initStoryCorner(); // Reinitialize with new random stories
    });
}

// Show story in modal
function showStoryModal(story) {
    if (!story) return;

    // Debug logging
    console.log('🔍 Story modal opened for:', story.title);
    console.log('📚 Story object:', story);
    console.log('📝 Story pidginText:', story.pidginText);
    console.log('📝 Story keys:', Object.keys(story));

    // Get the story content with fallbacks
    const storyContent = story.pidginText || story.content || story.text ||
                        (story.englishTranslation && `English: ${story.englishTranslation}`) ||
                        'Story content not available. Please try refreshing the page.';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.style.animation = 'fadeIn 0.3s ease';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" style="animation: slideUp 0.3s ease">
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-500 to-teal-500 text-white p-8 rounded-t-2xl">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-4xl mb-2 block">📚</span>
                        <h2 class="text-3xl font-bold mb-2">${story.title || 'Hawaiian Pidgin Story'}</h2>
                        <p class="text-green-100 text-lg">Pidgin Story Corner</p>
                    </div>
                    <button class="close-modal text-white hover:text-green-200 text-3xl font-bold transition">×</button>
                </div>
            </div>

            <!-- Story Content -->
            <div class="p-8">
                <div class="prose prose-lg max-w-none">
                    <div class="text-gray-800 leading-relaxed text-lg whitespace-pre-line">${storyContent}</div>
                </div>

                <!-- Story Actions -->
                <div class="mt-8 pt-6 border-t flex justify-between items-center">
                    <button class="speak-story bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition">
                        🔊 Listen to Story
                    </button>
                    <button class="close-btn bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    const closeModal = () => {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Speak story functionality
    modal.querySelector('.speak-story').addEventListener('click', () => {
        if (window.speechModule && window.speechModule.speakText) {
            window.speechModule.speakText(story.pidginText);
        }
    });
}

// Utility function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                e.preventDefault();
                const offsetTop = targetSection.offsetTop - 80; // Account for sticky nav
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Enhanced text-to-speech functionality using PidginSpeech
// Predictively cache nearby phrases when user shows interest
function predictiveCache(element) {
    if (typeof elevenLabsSpeech === 'undefined') return;

    // Find nearby speakable elements
    const parent = element.closest('.phrase-card, .term-item, .translation-output');
    if (!parent) return;

    const speakableElements = parent.querySelectorAll('[data-pidgin], .pidgin-text');
    speakableElements.forEach(async (el) => {
        const text = el.dataset.pidgin || el.textContent.trim();
        const normalizedText = text.toLowerCase();

        // Only preload if not already cached
        if (!elevenLabsSpeech.cache.has(normalizedText)) {
            // Delay to avoid overwhelming the server
            setTimeout(async () => {
                try {
                    await elevenLabsSpeech.speak(text, { silent: true });
                } catch (error) {
                    // Silent fail for predictive loading
                }
            }, Math.random() * 2000); // Random delay 0-2 seconds
        }
    });
}

function speakText(text, options = {}) {
    if ('speechSynthesis' in window) {
        // Get user preferences from sliders if they exist
        const rateSlider = document.getElementById('rate-slider');
        const pitchSlider = document.getElementById('pitch-slider');

        if (rateSlider) {
            options.rate = options.rate || parseFloat(rateSlider.value);
        }
        if (pitchSlider) {
            options.pitch = options.pitch || parseFloat(pitchSlider.value);
        }

        // Use the enhanced Pidgin speech synthesizer (handles all fallbacks internally)
        pidginSpeech.speak(text, options).catch(err => {
            console.error('All speech methods failed:', err);
            alert('Sorry, speech synthesis is not available right now.');
        });
    } else {
        alert('Sorry, your browser doesn\'t support text-to-speech!');
    }
}

// Voice settings functionality
function initVoiceSettings() {
    const voiceSettingsBtn = document.getElementById('voice-settings-btn');
    const voiceSettingsModal = document.getElementById('voice-settings-modal');
    const closeVoiceSettings = document.getElementById('close-voice-settings');
    const voiceSelect = document.getElementById('voice-select');
    const rateSlider = document.getElementById('rate-slider');
    const pitchSlider = document.getElementById('pitch-slider');
    const rateValue = document.getElementById('rate-value');
    const pitchValue = document.getElementById('pitch-value');
    const testVoiceBtn = document.getElementById('test-voice-btn');
    const debugMode = document.getElementById('debug-mode');
    const voiceInstallGuideBtn = document.getElementById('voice-install-guide-btn');
    const voiceInstallModal = document.getElementById('voice-install-modal');
    const closeVoiceInstall = document.getElementById('close-voice-install');
    const closeVoiceInstallBtn = document.getElementById('close-voice-install-btn');

    if (!voiceSettingsBtn || !voiceSettingsModal) return;

    // Load voices into dropdown
    function loadVoiceOptions() {
        setTimeout(() => {
            const voices = pidginSpeech.getAvailableVoices();

            console.log('🎙️ Available voices:', voices.length);
            console.log('Voice details:', voices.map(v => ({ name: v.name, lang: v.lang })));

            if (voices.length > 0) {
                voiceSelect.innerHTML = '';

                // Group voices by language
                const groupedVoices = {};
                voices.forEach(voice => {
                    const lang = voice.lang.substring(0, 2);
                    if (!groupedVoices[lang]) {
                        groupedVoices[lang] = [];
                    }
                    groupedVoices[lang].push(voice);
                });

                console.log('Grouped voices:', groupedVoices);

                // Add English voices first, grouped by accent type
                if (groupedVoices['en']) {
                    // List of known non-rhotic voice names
                    const nonRhoticNames = [
                        'karen', 'lee', 'james', 'catherine', 'ryan', 'hayley',  // Australian
                        'hazel', 'william',  // New Zealand
                        'nicole', 'russell'  // Additional Australian
                    ];

                    // Separate by accent type for better recommendations
                    const nonRhoticVoices = groupedVoices['en'].filter(v => {
                        const hasAuNz = v.lang.includes('AU') || v.lang.includes('NZ');
                        const hasCountryName = v.name.toLowerCase().includes('australia') || v.name.toLowerCase().includes('new zealand');
                        const hasVoiceName = nonRhoticNames.some(name => v.name.toLowerCase().includes(name.toLowerCase()));

                        console.log(`Voice ${v.name} (${v.lang}): AU/NZ=${hasAuNz}, Country=${hasCountryName}, Name=${hasVoiceName}`);

                        return hasAuNz || hasCountryName || hasVoiceName;
                    });

                    const usVoices = groupedVoices['en'].filter(v =>
                        v.lang.includes('US') && !nonRhoticVoices.includes(v));

                    const otherEnglish = groupedVoices['en'].filter(v =>
                        !nonRhoticVoices.includes(v) && !usVoices.includes(v));

                    console.log('Non-rhotic voices found:', nonRhoticVoices.map(v => `${v.name} (${v.lang})`));
                    console.log('US voices found:', usVoices.map(v => `${v.name} (${v.lang})`));
                    console.log('Other voices found:', otherEnglish.map(v => `${v.name} (${v.lang})`));

                    // Helper function to identify voice accent type
                    function getVoiceAccentType(voice) {
                        const name = voice.name.toLowerCase();
                        const lang = voice.lang.toLowerCase();

                        if (lang.includes('au') || name.includes('australia') ||
                            ['karen', 'lee', 'james', 'catherine', 'ryan', 'hayley', 'nicole', 'russell'].some(n => name.includes(n))) {
                            return 'Australian';
                        }
                        if (lang.includes('nz') || name.includes('new zealand') ||
                            ['hazel', 'william'].some(n => name.includes(n))) {
                            return 'New Zealand';
                        }
                        return null;
                    }

                    // Non-rhotic voices first (best for Pidgin)
                    if (nonRhoticVoices.length > 0) {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = '🌟 Best for Pidgin (Non-rhotic Accents)';

                        // Sort by quality score
                        nonRhoticVoices.sort((a, b) => {
                            const scoreA = getVoiceScore(a);
                            const scoreB = getVoiceScore(b);
                            return scoreB - scoreA;
                        });

                        nonRhoticVoices.forEach(voice => {
                            const option = document.createElement('option');
                            option.value = voice.name;
                            const accentType = getVoiceAccentType(voice);
                            const localText = voice.local ? 'Local' : 'Online';
                            option.textContent = `${voice.name} (${accentType} • ${localText})`;
                            if (pidginSpeech.preferredVoice?.name === voice.name) {
                                option.selected = true;
                            }
                            optgroup.appendChild(option);
                        });
                        voiceSelect.appendChild(optgroup);
                        console.log(`✅ Added ${nonRhoticVoices.length} non-rhotic voices to dropdown`);
                    } else {
                        console.log('❌ No Australian/NZ voices found on this system');

                        // Add a message about missing voices
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = '⚠️ No Australian/NZ voices available';
                        const option = document.createElement('option');
                        option.value = '';
                        option.textContent = 'Install Microsoft Voices for better Pidgin pronunciation';
                        option.disabled = true;
                        optgroup.appendChild(option);
                        voiceSelect.appendChild(optgroup);
                    }

                    // Helper function to calculate voice quality score
                    function getVoiceScore(voice) {
                        const name = voice.name.toLowerCase();
                        const lang = voice.lang.toLowerCase();

                        if (name.includes('karen') || name.includes('lee')) return 95;
                        if (name.includes('hazel') || name.includes('william')) return 90;
                        if (name.includes('james') || name.includes('catherine')) return 85;
                        if (lang.includes('au')) return 80;
                        if (lang.includes('nz')) return 78;
                        if (lang.includes('us')) return 70;
                        return 50;
                    }

                    // US voices second
                    if (usVoices.length > 0) {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = '👍 Good (US English)';
                        usVoices.forEach(voice => {
                            const option = document.createElement('option');
                            option.value = voice.name;
                            option.textContent = `${voice.name} ${voice.local ? '(Local)' : '(Online)'}`;
                            if (pidginSpeech.preferredVoice?.name === voice.name) {
                                option.selected = true;
                            }
                            optgroup.appendChild(option);
                        });
                        voiceSelect.appendChild(optgroup);
                    }

                    // Other English voices
                    if (otherEnglish.length > 0) {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = '⚠️ Other English';
                        otherEnglish.forEach(voice => {
                            const option = document.createElement('option');
                            option.value = voice.name;
                            option.textContent = `${voice.name} ${voice.local ? '(Local)' : '(Online)'}`;
                            if (pidginSpeech.preferredVoice?.name === voice.name) {
                                option.selected = true;
                            }
                            optgroup.appendChild(option);
                        });
                        voiceSelect.appendChild(optgroup);
                    }
                }

                // Add other voices
                Object.keys(groupedVoices).forEach(lang => {
                    if (lang !== 'en') {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = `Other (${lang})`;
                        groupedVoices[lang].forEach(voice => {
                            const option = document.createElement('option');
                            option.value = voice.name;
                            option.textContent = voice.name;
                            optgroup.appendChild(option);
                        });
                        voiceSelect.appendChild(optgroup);
                    }
                });
            } else {
                // Retry if voices aren't loaded yet
                setTimeout(loadVoiceOptions, 500);
            }
        }, 100);
    }

    // Show modal
    voiceSettingsBtn.addEventListener('click', () => {
        voiceSettingsModal.classList.remove('hidden');
        loadVoiceOptions();
    });

    // Close modal
    closeVoiceSettings.addEventListener('click', () => {
        voiceSettingsModal.classList.add('hidden');
    });

    // Close modal on background click
    voiceSettingsModal.addEventListener('click', (e) => {
        if (e.target === voiceSettingsModal) {
            voiceSettingsModal.classList.add('hidden');
        }
    });

    // Voice selection
    voiceSelect.addEventListener('change', () => {
        pidginSpeech.setVoice(voiceSelect.value);
    });

    // Rate slider
    rateSlider.addEventListener('input', () => {
        rateValue.textContent = `${rateSlider.value}x`;
    });

    // Pitch slider
    pitchSlider.addEventListener('input', () => {
        pitchValue.textContent = `${pitchSlider.value}x`;
    });

    // Test voice button with debug mode
    testVoiceBtn.addEventListener('click', () => {
        const testPhrases = [
            "Howzit brah! Da waves stay pumping today!",
            "Eh, we go grind! The food is broke da mouth!",
            "Ho brah, that sunset is beautiful tonight, yeah?",
            "Shoots! Thanks for the help, sister!",
            "No worries, brah. Everything is good, they asked about it.",
            "More better if you come over there with them, brother."
        ];
        const randomPhrase = testPhrases[Math.floor(Math.random() * testPhrases.length)];

        const isDebugMode = debugMode && debugMode.checked;

        speakText(randomPhrase, {
            rate: parseFloat(rateSlider.value),
            pitch: parseFloat(pitchSlider.value),
            debug: isDebugMode
        });

        // Show debug information if enabled
        if (isDebugMode) {
            setTimeout(() => {
                const phoneticText = pidginSpeech.applyPhoneticTransform(randomPhrase);
                const ssmlText = pidginSpeech.applySSMLMarkup(phoneticText);

                alert(`🎙️ Debug Info:

Original: "${randomPhrase}"

Phonetic: "${phoneticText}"

SSML: "${ssmlText}"

Voice: ${pidginSpeech.preferredVoice?.name || 'Default'}
Accent: ${pidginSpeech.preferredVoice?.lang || 'Unknown'}`);
            }, 500);
        }
    });

    // Add a test button to check available voices
    if (debugMode) {
        debugMode.addEventListener('change', () => {
            if (debugMode.checked) {
                console.log('🎙️ Debug mode enabled - Voice information:');
                console.log('All available voices:', speechSynthesis.getVoices());
                console.log('Pidgin speech voices:', pidginSpeech.getAvailableVoices());
                console.log('Preferred voice:', pidginSpeech.preferredVoice);
            }
        });
    }

    // Voice installation guide modal
    if (voiceInstallGuideBtn && voiceInstallModal) {
        voiceInstallGuideBtn.addEventListener('click', () => {
            voiceInstallModal.classList.remove('hidden');
        });

        closeVoiceInstall.addEventListener('click', () => {
            voiceInstallModal.classList.add('hidden');
        });

        closeVoiceInstallBtn.addEventListener('click', () => {
            voiceInstallModal.classList.add('hidden');
        });

        voiceInstallModal.addEventListener('click', (e) => {
            if (e.target === voiceInstallModal) {
                voiceInstallModal.classList.add('hidden');
            }
        });
    }
}