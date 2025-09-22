// Interactive Practice Session System
class PracticeSession {
    constructor() {
        this.currentWord = null;
        this.sessionWords = [];
        this.currentIndex = 0;
        this.mode = 'flashcard'; // flashcard, quiz, typing
        this.startTime = null;
        this.stats = {
            correct: 0,
            incorrect: 0,
            total: 0
        };
        // Initialize practice data if PracticeData is available
        this.practiceData = typeof PracticeData !== 'undefined' ? new PracticeData() : null;
    }

    // Start a practice session with a single word or word list
    start(wordKey, mode = 'flashcard') {
        this.mode = mode;
        this.startTime = Date.now();
        this.currentIndex = 0;
        this.stats = { correct: 0, incorrect: 0, total: 0 };

        // Get word data with retry mechanism
        const word = this.getWordData(wordKey);
        if (!word) {
            console.error('Word not found:', wordKey);
            // Try again after a short delay in case data is still loading
            setTimeout(() => {
                const retryWord = this.getWordData(wordKey);
                if (retryWord) {
                    this.sessionWords = [retryWord];
                    this.currentWord = retryWord;
                    this.createPracticeModal();
                    this.renderCurrentMode();
                } else {
                    alert('Word data not available. Please try again in a moment.');
                }
            }, 500);
            return;
        }

        this.sessionWords = [word];
        this.currentWord = word;
        this.createPracticeModal();
        this.renderCurrentMode();
    }

    // Start with multiple words (for spaced repetition or category practice)
    startMultiple(wordKeys, mode = 'flashcard') {
        this.mode = mode;
        this.startTime = Date.now();
        this.currentIndex = 0;
        this.stats = { correct: 0, incorrect: 0, total: 0 };

        this.sessionWords = wordKeys.map(key => this.getWordData(key)).filter(Boolean);
        if (this.sessionWords.length === 0) {
            alert('No valid words found for practice session');
            return;
        }

        this.currentWord = this.sessionWords[0];
        this.createPracticeModal();
        this.renderCurrentMode();
    }

    // Get word data from enhanced data system
    getWordData(wordKey) {
        let entry = null;

        if (window.pidginDictionary && window.pidginDictionary.isNewSystem) {
            // Ensure data is loaded before accessing
            if (window.pidginDictionary.dataLoader && window.pidginDictionary.dataLoader.getAllEntries().length > 0) {
                entry = window.pidginDictionary.dataLoader.getById(wordKey);
            }
        }

        if (!entry) {
            console.warn(`Entry not found for key: ${wordKey}. Enhanced data system available: ${!!window.pidginDictionary?.isNewSystem}`);
            return null;
        }

        // Normalize entry format
        return {
            id: wordKey,
            pidgin: entry.pidgin || wordKey,
            english: Array.isArray(entry.english) ? entry.english.join(', ') : entry.english,
            example: Array.isArray(entry.examples) ? entry.examples[0] : (entry.example || ''),
            category: entry.category || 'general',
            difficulty: this.practiceData ? this.practiceData.getWordDifficulty(wordKey) : 3
        };
    }

    // Create the practice modal interface
    createPracticeModal() {
        // Remove any existing practice modal
        const existing = document.getElementById('practice-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'practice-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50 animate-fadeIn';

        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl transform animate-slideUp">
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold">🎯 Practice Session</h2>
                            <p class="text-purple-100 mt-1">${this.getModeTitle()}</p>
                        </div>
                        <button id="close-practice" class="text-white hover:text-purple-200 text-3xl transition">
                            ×
                        </button>
                    </div>

                    <!-- Progress Bar -->
                    <div class="mt-4">
                        <div class="flex justify-between text-sm text-purple-100 mb-2">
                            <span>Progress</span>
                            <span>${this.currentIndex + 1} / ${this.sessionWords.length}</span>
                        </div>
                        <div class="bg-purple-700 bg-opacity-50 rounded-full h-2">
                            <div class="bg-white rounded-full h-2 transition-all duration-300"
                                 style="width: ${((this.currentIndex + 1) / this.sessionWords.length) * 100}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Content Area -->
                <div id="practice-content" class="p-6">
                    <!-- Mode-specific content will be rendered here -->
                </div>

                <!-- Navigation -->
                <div class="border-t bg-gray-50 p-4 flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        <span class="text-green-600 font-semibold">${this.stats.correct} correct</span>
                        ${this.stats.incorrect > 0 ? `• <span class="text-red-600 font-semibold">${this.stats.incorrect} incorrect</span>` : ''}
                    </div>

                    <div class="flex gap-3">
                        <button id="practice-prev" class="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition" ${this.currentIndex === 0 ? 'disabled' : ''}>
                            ← Previous
                        </button>
                        <button id="practice-skip" class="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            Skip
                        </button>
                        <button id="practice-next" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                            ${this.currentIndex === this.sessionWords.length - 1 ? 'Finish' : 'Next'} →
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.attachModalEvents();
    }

    // Get mode title for display
    getModeTitle() {
        const titles = {
            flashcard: 'Flashcard Mode',
            quiz: 'Multiple Choice Quiz',
            typing: 'Typing Practice'
        };
        return titles[this.mode] || 'Practice Mode';
    }

    // Attach event listeners to modal
    attachModalEvents() {
        const modal = document.getElementById('practice-modal');

        // Close modal
        document.getElementById('close-practice').addEventListener('click', () => {
            this.endSession();
        });

        // Navigation
        document.getElementById('practice-prev').addEventListener('click', () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.currentWord = this.sessionWords[this.currentIndex];
                this.renderCurrentMode();
                this.updateProgress();
            }
        });

        document.getElementById('practice-skip').addEventListener('click', () => {
            this.nextWord();
        });

        document.getElementById('practice-next').addEventListener('click', () => {
            this.nextWord();
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.endSession();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    // Handle keyboard shortcuts
    handleKeyboard(e) {
        if (!document.getElementById('practice-modal')) return;

        switch(e.key) {
            case 'Escape':
                this.endSession();
                break;
            case 'ArrowLeft':
                if (this.currentIndex > 0) {
                    document.getElementById('practice-prev').click();
                }
                break;
            case 'ArrowRight':
            case ' ':
                e.preventDefault();
                if (this.mode === 'flashcard') {
                    // Space flips card or advances
                    const flipBtn = document.getElementById('flip-card');
                    if (flipBtn && !flipBtn.style.display) {
                        flipBtn.click();
                    } else {
                        document.getElementById('practice-next').click();
                    }
                } else {
                    document.getElementById('practice-next').click();
                }
                break;
        }
    }

    // Render content based on current mode
    renderCurrentMode() {
        const content = document.getElementById('practice-content');
        if (!content) return;

        switch(this.mode) {
            case 'flashcard':
                this.renderFlashcard(content);
                break;
            case 'quiz':
                this.renderQuiz(content);
                break;
            case 'typing':
                this.renderTyping(content);
                break;
        }
    }

    // Render flashcard mode
    renderFlashcard(container) {
        const word = this.currentWord;

        container.innerHTML = `
            <div class="text-center">
                <div class="mb-6">
                    <span class="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        ${word.category}
                    </span>
                </div>

                <!-- Flashcard -->
                <div id="flashcard" class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-6 min-h-[200px] flex flex-col justify-center relative cursor-pointer transform transition-all duration-300 hover:scale-105">
                    <div id="card-front" class="card-side">
                        <div class="text-4xl font-bold text-gray-800 mb-4">${word.pidgin}</div>
                        <div class="text-gray-500 text-lg">Tap to see meaning</div>
                    </div>

                    <div id="card-back" class="card-side hidden">
                        <div class="text-3xl font-bold text-blue-600 mb-4">${word.english}</div>
                        ${word.example ? `<div class="text-gray-600 italic text-lg">"${word.example}"</div>` : ''}
                        <div class="text-sm text-gray-400 mt-4">Tap to flip back</div>
                    </div>
                </div>

                <!-- Action Buttons (shown after flip) -->
                <div id="assessment-buttons" class="hidden space-x-4">
                    <button id="know-it" class="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-semibold flex items-center gap-2">
                        ✓ I know this!
                    </button>
                    <button id="need-practice" class="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-semibold flex items-center gap-2">
                        📚 Need practice
                    </button>
                </div>

                <!-- Flip Button -->
                <button id="flip-card" class="mx-auto block px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold">
                    🔄 Flip Card
                </button>

                <!-- Audio Button -->
                ${this.renderAudioButton(word.pidgin)}
            </div>
        `;

        this.attachFlashcardEvents();
    }

    // Attach flashcard-specific events
    attachFlashcardEvents() {
        const flashcard = document.getElementById('flashcard');
        const flipBtn = document.getElementById('flip-card');
        const assessmentBtns = document.getElementById('assessment-buttons');

        // Add speak event listener
        this.addSpeakEventListener(this.currentWord.pidgin);

        // Flip functionality
        const flip = () => {
            const front = document.getElementById('card-front');
            const back = document.getElementById('card-back');

            if (front.classList.contains('hidden')) {
                // Show front
                front.classList.remove('hidden');
                back.classList.add('hidden');
                flipBtn.style.display = 'block';
                assessmentBtns.classList.add('hidden');
            } else {
                // Show back
                front.classList.add('hidden');
                back.classList.remove('hidden');
                flipBtn.style.display = 'none';
                assessmentBtns.classList.remove('hidden');
            }
        };

        flashcard.addEventListener('click', flip);
        flipBtn.addEventListener('click', flip);

        // Assessment buttons
        document.getElementById('know-it').addEventListener('click', () => {
            this.recordAnswer(true, 'easy');
            this.nextWord();
        });

        document.getElementById('need-practice').addEventListener('click', () => {
            this.recordAnswer(false, 'hard');
            this.nextWord();
        });
    }

    // Render audio button if speech is available
    renderAudioButton(text) {
        return `
            <button id="speak-word" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                🔊 Hear pronunciation
            </button>
        `;
    }

    // Add event listener for speak button
    addSpeakEventListener(text) {
        const speakBtn = document.getElementById('speak-word');
        if (speakBtn) {
            speakBtn.addEventListener('click', () => {
                if (typeof speakText === 'function') {
                    speakText(text);
                } else if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 0.8;
                    speechSynthesis.speak(utterance);
                }
            });
        }
    }

    // Record practice answer
    recordAnswer(correct, difficulty) {
        this.stats.total++;
        if (correct) {
            this.stats.correct++;
        } else {
            this.stats.incorrect++;
        }

        // Store in practice data if available
        if (this.practiceData) {
            this.practiceData.recordPractice(this.currentWord.id, correct, difficulty);
        }
    }

    // Move to next word
    nextWord() {
        if (this.currentIndex < this.sessionWords.length - 1) {
            this.currentIndex++;
            this.currentWord = this.sessionWords[this.currentIndex];
            this.renderCurrentMode();
            this.updateProgress();
        } else {
            this.showResults();
        }
    }

    // Update progress bar
    updateProgress() {
        const progressBar = document.querySelector('#practice-modal .bg-white');
        const progressText = document.querySelector('#practice-modal .flex.justify-between span:last-child');

        if (progressBar) {
            progressBar.style.width = `${((this.currentIndex + 1) / this.sessionWords.length) * 100}%`;
        }
        if (progressText) {
            progressText.textContent = `${this.currentIndex + 1} / ${this.sessionWords.length}`;
        }

        // Update navigation buttons
        const prevBtn = document.getElementById('practice-prev');
        const nextBtn = document.getElementById('practice-next');

        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
        }
        if (nextBtn) {
            nextBtn.textContent = this.currentIndex === this.sessionWords.length - 1 ? 'Finish →' : 'Next →';
        }
    }

    // Show session results
    showResults() {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const accuracy = this.stats.total > 0 ? Math.round((this.stats.correct / this.stats.total) * 100) : 0;

        const content = document.getElementById('practice-content');
        content.innerHTML = `
            <div class="text-center">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-3xl font-bold text-gray-800 mb-6">Session Complete!</h3>

                <div class="bg-gray-50 rounded-xl p-6 mb-6">
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div class="text-3xl font-bold text-green-600">${this.stats.correct}</div>
                            <div class="text-gray-600">Correct</div>
                        </div>
                        <div>
                            <div class="text-3xl font-bold text-purple-600">${accuracy}%</div>
                            <div class="text-gray-600">Accuracy</div>
                        </div>
                        <div>
                            <div class="text-3xl font-bold text-blue-600">${this.stats.total}</div>
                            <div class="text-gray-600">Total Words</div>
                        </div>
                        <div>
                            <div class="text-3xl font-bold text-orange-600">${duration}s</div>
                            <div class="text-gray-600">Duration</div>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <button id="practice-again" class="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold">
                        🔄 Practice Again
                    </button>
                    <button id="view-stats" class="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
                        📊 View Statistics
                    </button>
                </div>
            </div>
        `;

        // Hide navigation
        document.querySelector('#practice-modal .border-t').style.display = 'none';

        // Attach result events
        document.getElementById('practice-again').addEventListener('click', () => {
            this.restart();
        });

        document.getElementById('view-stats').addEventListener('click', () => {
            this.showStatistics();
        });

        // Record session if practice data is available
        if (this.practiceData) {
            this.practiceData.recordSession({
                date: new Date(),
                duration: duration,
                wordsStudied: this.stats.total,
                accuracy: accuracy,
                mode: this.mode
            });
        }
    }

    // Restart current session
    restart() {
        this.currentIndex = 0;
        this.currentWord = this.sessionWords[0];
        this.stats = { correct: 0, incorrect: 0, total: 0 };
        this.startTime = Date.now();

        // Recreate modal to reset state
        this.createPracticeModal();
        this.renderCurrentMode();
    }

    // Show detailed statistics
    showStatistics() {
        // TODO: Implement detailed statistics view
        alert('📊 Statistics view coming soon!\n\nYour session data has been saved and will be available in the statistics dashboard.');
    }

    // End session and cleanup
    endSession() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyboard.bind(this));

        // Remove modal
        const modal = document.getElementById('practice-modal');
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            setTimeout(() => modal.remove(), 200);
        }
    }
}

// Initialize global practice session
window.practiceSession = new PracticeSession();