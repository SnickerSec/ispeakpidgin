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
                            <h2 class="text-2xl font-bold"><i class="ti ti-target"></i> Practice Session</h2>
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
                <div id="assessment-buttons" class="hidden flex justify-center items-center gap-4 mb-4">
                    <button id="know-it" class="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-semibold flex items-center gap-2">
                        ✓ I know this!
                    </button>
                    <button id="need-practice" class="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-semibold flex items-center gap-2">
                        <i class="ti ti-books"></i> Need practice
                    </button>
                </div>

                <!-- Flip Button -->
                <button id="flip-card" class="mx-auto block px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold">
                    <i class="ti ti-refresh"></i> Flip Card
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
                <i class="ti ti-volume"></i> Hear pronunciation
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
                <div class="text-6xl mb-4"><i class="ti ti-confetti"></i></div>
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
                        <i class="ti ti-refresh"></i> Practice Again
                    </button>
                    <button id="view-stats" class="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
                        <i class="ti ti-chart-bar"></i> View Statistics
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
        if (!this.practiceData) {
            alert('Statistics are not available.\n\nNo practice data storage system found.');
            return;
        }

        const stats = this.calculateDetailedStats();
        this.renderStatisticsView(stats);
    }

    // Calculate detailed statistics from practice data
    calculateDetailedStats() {
        const data = this.practiceData.data;
        const now = new Date();
        const today = now.toDateString();

        // Current session stats
        const currentSession = {
            correct: this.stats.correct,
            incorrect: this.stats.incorrect,
            total: this.stats.total,
            accuracy: this.stats.total > 0 ? Math.round((this.stats.correct / this.stats.total) * 100) : 0,
            duration: Math.round((Date.now() - this.startTime) / 1000)
        };

        // All-time stats
        const allTime = {
            totalSessions: data.stats.totalSessions,
            totalWordsLearned: data.stats.totalWordsLearned,
            totalTimeSpent: data.stats.totalTimeSpent,
            averageAccuracy: Math.round(data.stats.averageAccuracy),
            currentStreak: data.stats.currentStreak,
            longestStreak: data.stats.longestStreak,
            lastPracticeDate: data.stats.lastPracticeDate
        };

        // Recent sessions (last 7 days)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentSessions = data.sessions.filter(session =>
            new Date(session.timestamp) >= weekAgo
        ).slice(-10); // Last 10 sessions

        // Today's stats
        const todaySessions = data.sessions.filter(session =>
            new Date(session.timestamp).toDateString() === today
        );

        const todayStats = {
            sessions: todaySessions.length,
            wordsStudied: todaySessions.reduce((sum, session) => sum + (session.wordsStudied || 0), 0),
            timeSpent: todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0),
            avgAccuracy: todaySessions.length > 0 ?
                Math.round(todaySessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) / todaySessions.length) : 0
        };

        // Word-level progress
        const wordProgress = Object.keys(data.words).length;
        const masteredWords = Object.values(data.words).filter(word => word.masteryLevel >= 4).length;

        // Category breakdown
        const categoryStats = this.calculateCategoryStats(data.words);

        return {
            currentSession,
            allTime,
            todayStats,
            recentSessions,
            wordProgress,
            masteredWords,
            categoryStats
        };
    }

    // Calculate statistics by category
    calculateCategoryStats(words) {
        const categories = {};

        for (const [wordId, wordData] of Object.entries(words)) {
            // Get word info to determine category
            const wordInfo = this.getWordData(wordId);
            const category = wordInfo?.category || 'unknown';

            if (!categories[category]) {
                categories[category] = {
                    practiced: 0,
                    mastered: 0,
                    accuracy: 0,
                    totalAttempts: 0,
                    correctAttempts: 0
                };
            }

            categories[category].practiced++;
            if (wordData.masteryLevel >= 4) categories[category].mastered++;
            categories[category].totalAttempts += wordData.timesCorrect + wordData.timesIncorrect;
            categories[category].correctAttempts += wordData.timesCorrect;
        }

        // Calculate accuracy for each category
        for (const category of Object.values(categories)) {
            category.accuracy = category.totalAttempts > 0 ?
                Math.round((category.correctAttempts / category.totalAttempts) * 100) : 0;
        }

        return categories;
    }

    // Render comprehensive statistics view
    renderStatisticsView(stats) {
        const content = document.getElementById('practice-content');
        content.innerHTML = `
            <div class="statistics-dashboard">
                <div class="mb-6">
                    <h3 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-chart-bar"></i> Practice Statistics</h3>

                    <!-- Current Session Stats -->
                    <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6">
                        <h4 class="text-lg font-semibold text-gray-700 mb-3">Current Session</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-green-600">${stats.currentSession.correct}</div>
                                <div class="text-sm text-gray-600">Correct</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-red-600">${stats.currentSession.incorrect}</div>
                                <div class="text-sm text-gray-600">Incorrect</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-purple-600">${stats.currentSession.accuracy}%</div>
                                <div class="text-sm text-gray-600">Accuracy</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600">${stats.currentSession.duration}s</div>
                                <div class="text-sm text-gray-600">Duration</div>
                            </div>
                        </div>
                    </div>

                    <!-- Today's Progress -->
                    <div class="bg-green-50 rounded-xl p-4 mb-6">
                        <h4 class="text-lg font-semibold text-gray-700 mb-3">Today's Progress</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-green-600">${stats.todayStats.sessions}</div>
                                <div class="text-sm text-gray-600">Sessions</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600">${stats.todayStats.wordsStudied}</div>
                                <div class="text-sm text-gray-600">Words Studied</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-purple-600">${Math.round(stats.todayStats.timeSpent / 60)}m</div>
                                <div class="text-sm text-gray-600">Time Spent</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-orange-600">${stats.todayStats.avgAccuracy}%</div>
                                <div class="text-sm text-gray-600">Avg Accuracy</div>
                            </div>
                        </div>
                    </div>

                    <!-- All-Time Stats -->
                    <div class="bg-blue-50 rounded-xl p-4 mb-6">
                        <h4 class="text-lg font-semibold text-gray-700 mb-3">All-Time Statistics</h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600">${stats.allTime.totalSessions}</div>
                                <div class="text-sm text-gray-600">Total Sessions</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-green-600">${stats.wordProgress}</div>
                                <div class="text-sm text-gray-600">Words Practiced</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-purple-600">${stats.masteredWords}</div>
                                <div class="text-sm text-gray-600">Words Mastered</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-orange-600">${Math.round(stats.allTime.totalTimeSpent / 3600)}h</div>
                                <div class="text-sm text-gray-600">Total Time</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-red-600">${stats.allTime.currentStreak}</div>
                                <div class="text-sm text-gray-600">Current Streak</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-indigo-600">${stats.allTime.averageAccuracy}%</div>
                                <div class="text-sm text-gray-600">Avg Accuracy</div>
                            </div>
                        </div>
                    </div>

                    <!-- Category Breakdown -->
                    ${this.renderCategoryStats(stats.categoryStats)}

                    <!-- Recent Sessions -->
                    ${this.renderRecentSessions(stats.recentSessions)}

                    <!-- Action Buttons -->
                    <div class="flex gap-3 mt-6">
                        <button id="stats-back" class="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition font-semibold">
                            ← Back to Results
                        </button>
                        <button id="stats-export" class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
                            <i class="ti ti-share"></i> Export Data
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.attachStatisticsEvents();
    }

    // Render category statistics
    renderCategoryStats(categoryStats) {
        const categories = Object.entries(categoryStats);
        if (categories.length === 0) {
            return '<div class="bg-gray-50 rounded-xl p-4 mb-6 text-center text-gray-500">No category data available yet.</div>';
        }

        return `
            <div class="bg-orange-50 rounded-xl p-4 mb-6">
                <h4 class="text-lg font-semibold text-gray-700 mb-3">Progress by Category</h4>
                <div class="space-y-3">
                    ${categories.map(([category, data]) => `
                        <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div class="flex-1">
                                <div class="font-medium text-gray-700 capitalize">${category}</div>
                                <div class="text-sm text-gray-500">${data.practiced} words practiced • ${data.mastered} mastered</div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-orange-600">${data.accuracy}%</div>
                                <div class="text-sm text-gray-500">accuracy</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Render recent sessions
    renderRecentSessions(recentSessions) {
        if (recentSessions.length === 0) {
            return '<div class="bg-gray-50 rounded-xl p-4 mb-6 text-center text-gray-500">No recent sessions found.</div>';
        }

        return `
            <div class="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 class="text-lg font-semibold text-gray-700 mb-3">Recent Sessions</h4>
                <div class="space-y-2">
                    ${recentSessions.slice(-5).reverse().map(session => {
                        const date = new Date(session.timestamp);
                        const dateStr = date.toLocaleDateString();
                        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return `
                            <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                                <div>
                                    <div class="font-medium text-gray-700">${session.mode || 'Practice'} Session</div>
                                    <div class="text-sm text-gray-500">${dateStr} at ${timeStr}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-sm font-semibold text-purple-600">${session.accuracy || 0}% accuracy</div>
                                    <div class="text-sm text-gray-500">${session.wordsStudied || 0} words • ${session.duration || 0}s</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Attach event listeners for statistics view
    attachStatisticsEvents() {
        document.getElementById('stats-back').addEventListener('click', () => {
            this.showResults(); // Go back to results view
        });

        document.getElementById('stats-export').addEventListener('click', () => {
            this.exportStatistics();
        });
    }

    // Export statistics as JSON
    exportStatistics() {
        try {
            const stats = this.calculateDetailedStats();
            const exportData = {
                exportDate: new Date().toISOString(),
                currentSession: stats.currentSession,
                allTimeStats: stats.allTime,
                todayStats: stats.todayStats,
                wordProgress: {
                    totalPracticed: stats.wordProgress,
                    totalMastered: stats.masteredWords
                },
                categoryBreakdown: stats.categoryStats,
                recentSessions: stats.recentSessions
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `pidgin-practice-stats-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            // Show confirmation
            const exportBtn = document.getElementById('stats-export');
            const originalText = exportBtn.textContent;
            exportBtn.innerHTML = '<i class="ti ti-circle-check"></i> Exported!';
            exportBtn.classList.add('bg-green-600');
            exportBtn.classList.remove('bg-blue-600');

            setTimeout(() => {
                exportBtn.textContent = originalText;
                exportBtn.classList.remove('bg-green-600');
                exportBtn.classList.add('bg-blue-600');
            }, 2000);

        } catch (error) {
            console.error('Error exporting statistics:', error);
            alert('Error exporting statistics. Please try again.');
        }
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