// Pidgin Speed Translation Game Logic

class PidginSpeed {
    constructor() {
        this.words = [];
        this.currentWord = null;
        this.currentIndex = 0;
        this.score = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.maxMultiplier = 5;
        this.comboThreshold = 3;
        this.timeLeft = 60;
        this.totalTime = 60;
        this.timer = null;
        this.gameActive = false;
        this.correctWords = [];
        this.wrongWords = [];
        this.longestStreak = 0;
        this.stats = this.loadStats();
        this.init();
    }

    async init() {
        this.updateStatsDisplay();
        this.attachEventListeners();
        this.showStartScreen();
    }

    loadStats() {
        const saved = localStorage.getItem('pidgin-speed-stats');
        if (saved) return JSON.parse(saved);
        return { highScore30: 0, highScore60: 0, highScore90: 0, longestStreak: 0, totalWords: 0 };
    }

    saveStats() {
        localStorage.setItem('pidgin-speed-stats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        const highScore = Math.max(this.stats.highScore30 || 0, this.stats.highScore60 || 0, this.stats.highScore90 || 0);
        document.getElementById('stat-high-score').textContent = highScore;
        document.getElementById('stat-streak').textContent = this.stats.longestStreak || 0;
        document.getElementById('stat-total').textContent = this.stats.totalWords || 0;
    }

    showStartScreen() {
        if (this.timer) clearInterval(this.timer);
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
    }

    async startGame(duration) {
        this.totalTime = duration;
        this.timeLeft = duration;
        this.score = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.currentIndex = 0;
        this.correctWords = [];
        this.wrongWords = [];
        this.longestStreak = 0;

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        try {
            await this.loadWords();
            if (this.words.length === 0) {
                throw new Error('No suitable words found');
            }
            
            document.getElementById('score-value').textContent = '0';
            document.getElementById('combo-display').textContent = '';
            document.getElementById('multiplier-display').textContent = '1x';
            document.getElementById('multiplier-display').className = 'text-sm font-bold text-gray-400';

            this.updateTimerDisplay();
            this.showNextWord();
            this.startTimer();
            this.gameActive = true;

            // Focus the input
            document.getElementById('answer-input').focus();
        } catch (error) {
            console.error('Failed to start game:', error);
            this.showToast('Failed to load words. Please refresh.');
            this.showStartScreen();
        }
    }

    async loadWords() {
        try {
            // My recent fix to dictionary API now supports random=true
            const response = await fetch('/api/dictionary?limit=300&random=true');
            const data = await response.json();

            if (!data.entries || data.entries.length === 0) throw new Error('No words');

            // Filter for single-word entries with simple pidgin words
            this.words = data.entries.filter(e => {
                const word = e.pidgin.toLowerCase();
                // Speed translation works best with simple words/phrases (no crazy punctuation)
                return /^[a-z' -]+$/i.test(word) && word.length >= 2 && word.length <= 20;
            });

            // Shuffle
            this.words.sort(() => Math.random() - 0.5);
            
            console.log(`Loaded ${this.words.length} words for Speed Translation`);
        } catch (error) {
            console.error('Error loading words:', error);
            throw error;
        }
    }

    showNextWord() {
        if (this.currentIndex >= this.words.length) {
            // Reshuffle if we've run through all words
            this.words.sort(() => Math.random() - 0.5);
            this.currentIndex = 0;
        }

        this.currentWord = this.words[this.currentIndex];
        this.currentIndex++;

        // Handle english as array or string
        const englishValue = this.currentWord.english;
        const english = Array.isArray(englishValue) ? englishValue[0] : englishValue;
        
        document.getElementById('english-word').textContent = english || '???';
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        document.getElementById('feedback-area').classList.add('hidden');
    }

    checkAnswer() {
        if (!this.gameActive) return;

        const input = document.getElementById('answer-input').value.trim().toLowerCase();
        if (!input) return;

        const correctAnswer = this.currentWord.pidgin.toLowerCase();
        // Allow some flexibility with dashes/spaces if needed, but usually we want exact match
        const isCorrect = input === correctAnswer;

        const feedbackArea = document.getElementById('feedback-area');

        if (isCorrect) {
            // Correct answer
            this.combo++;
            if (this.combo > this.longestStreak) this.longestStreak = this.combo;

            // Update multiplier every comboThreshold consecutive correct answers
            if (this.combo > 0 && this.combo % this.comboThreshold === 0 && this.multiplier < this.maxMultiplier) {
                this.multiplier++;
            }

            const points = 10 * this.multiplier;
            this.score += points;
            this.stats.totalWords++;

            const englishValue = this.currentWord.english;
            const english = Array.isArray(englishValue) ? englishValue[0] : englishValue;
            this.correctWords.push({ pidgin: this.currentWord.pidgin, english: english });

            document.getElementById('score-value').textContent = this.score;
            this.updateComboDisplay();

            feedbackArea.innerHTML = `<span class="text-green-600 font-bold"><i class="ti ti-check"></i> +${points}</span>`;
            feedbackArea.classList.remove('hidden');

            this.showNextWord();
        } else {
            // Only check on enter or if they typed something of similar length?
            // Actually, Speed game usually checks on Enter. 
            // The listener handles the trigger.
        }
    }

    handleIncorrect() {
        if (!this.gameActive) return;
        
        const input = document.getElementById('answer-input').value.trim().toLowerCase();
        
        // Wrong answer
        this.combo = 0;
        this.multiplier = 1;

        const englishValue = this.currentWord.english;
        const english = Array.isArray(englishValue) ? englishValue[0] : englishValue;
        this.wrongWords.push({ 
            pidgin: this.currentWord.pidgin, 
            english: english, 
            yourAnswer: input || '(empty)' 
        });

        this.updateComboDisplay();

        const feedbackArea = document.getElementById('feedback-area');
        feedbackArea.innerHTML = `<span class="text-red-600 font-bold"><i class="ti ti-x"></i> ${this.currentWord.pidgin}</span>`;
        feedbackArea.classList.remove('hidden');

        // Move to next word after brief pause
        setTimeout(() => this.showNextWord(), 800);
    }

    skipWord() {
        if (!this.gameActive) return;
        this.combo = 0;
        this.multiplier = 1;
        this.updateComboDisplay();

        const englishValue = this.currentWord.english;
        const english = Array.isArray(englishValue) ? englishValue[0] : englishValue;
        this.wrongWords.push({ 
            pidgin: this.currentWord.pidgin, 
            english: english, 
            yourAnswer: '(skipped)' 
        });

        const feedbackArea = document.getElementById('feedback-area');
        feedbackArea.innerHTML = `<span class="text-gray-500">Skipped: <strong>${this.currentWord.pidgin}</strong></span>`;
        feedbackArea.classList.remove('hidden');

        setTimeout(() => this.showNextWord(), 600);
    }

    updateComboDisplay() {
        const comboEl = document.getElementById('combo-display');
        const multEl = document.getElementById('multiplier-display');

        if (this.combo >= this.comboThreshold) {
            comboEl.textContent = `${this.combo} combo!`;
            comboEl.className = 'text-sm font-bold text-orange-500 animate-pulse';
        } else if (this.combo > 0) {
            comboEl.textContent = `${this.combo}/${this.comboThreshold}`;
            comboEl.className = 'text-sm text-gray-500';
        } else {
            comboEl.textContent = '';
        }

        multEl.textContent = `${this.multiplier}x`;
        if (this.multiplier >= 4) {
            multEl.className = 'text-sm font-bold text-red-500';
        } else if (this.multiplier >= 2) {
            multEl.className = 'text-sm font-bold text-orange-500';
        } else {
            multEl.className = 'text-sm font-bold text-gray-400';
        }
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('timer-value');
        const progressBar = document.getElementById('timer-progress');
        
        timerEl.textContent = this.timeLeft + 's';
        
        const pct = (this.timeLeft / this.totalTime) * 100;
        progressBar.style.width = pct + '%';
        
        if (this.timeLeft <= 10) {
            timerEl.className = 'text-2xl font-bold text-red-500 animate-pulse';
            progressBar.className = 'h-full bg-red-500 transition-all duration-1000';
        } else {
            timerEl.className = 'text-2xl font-bold text-gray-700';
            progressBar.className = 'h-full bg-blue-500 transition-all duration-1000';
        }
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);

        // Update High Score
        const scoreKey = `highScore${this.totalTime}`;
        if (this.score > (this.stats[scoreKey] || 0)) {
            this.stats[scoreKey] = this.score;
        }
        if (this.longestStreak > (this.stats.longestStreak || 0)) {
            this.stats.longestStreak = this.longestStreak;
        }
        this.saveStats();

        // Show Results
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-correct').textContent = this.correctWords.length;
        document.getElementById('final-streak').textContent = this.longestStreak;

        // Render review list
        const reviewList = document.getElementById('review-list');
        reviewList.innerHTML = '';
        
        const allWords = [...this.correctWords.map(w => ({...w, correct: true})), 
                          ...this.wrongWords.map(w => ({...w, correct: false}))];
        
        allWords.slice(0, 20).forEach(word => {
            const item = document.createElement('div');
            item.className = `flex justify-between p-2 rounded ${word.correct ? 'bg-green-50' : 'bg-red-50'}`;
            item.innerHTML = `
                <span><strong>${word.pidgin}</strong>: ${word.english}</span>
                <span class="${word.correct ? 'text-green-600' : 'text-red-600'}">
                    <i class="ti ti-${word.correct ? 'check' : 'x'}"></i>
                </span>
            `;
            reviewList.appendChild(item);
        });

        this.updateStatsDisplay();
    }

    showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    attachEventListeners() {
        // Duration buttons
        document.querySelectorAll('[data-duration]').forEach(btn => {
            btn.addEventListener('click', () => this.startGame(parseInt(btn.dataset.duration)));
        });

        // Input handling
        const input = document.getElementById('answer-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim().toLowerCase();
                if (val === this.currentWord.pidgin.toLowerCase()) {
                    this.checkAnswer();
                } else {
                    this.handleIncorrect();
                }
            }
        });

        document.getElementById('skip-btn').addEventListener('click', () => this.skipWord());
        document.getElementById('play-again-btn').addEventListener('click', () => this.showStartScreen());
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure dependencies are loaded
    setTimeout(() => {
        if (!window.speedGame) {
            window.speedGame = new PidginSpeed();
        }
    }, 500);
});
