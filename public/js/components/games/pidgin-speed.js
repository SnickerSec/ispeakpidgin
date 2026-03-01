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
        document.getElementById('stat-high-score').textContent = Math.max(this.stats.highScore30, this.stats.highScore60, this.stats.highScore90);
        document.getElementById('stat-streak').textContent = this.stats.longestStreak;
        document.getElementById('stat-total').textContent = this.stats.totalWords;
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

        await this.loadWords();

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
    }

    async loadWords() {
        try {
            const response = await fetch('/api/dictionary?limit=200&random=true');
            const data = await response.json();

            if (!data.entries || data.entries.length === 0) throw new Error('No words');

            // Filter for single-word entries with simple pidgin words
            this.words = data.entries.filter(e => {
                const word = e.pidgin.toLowerCase();
                return /^[a-z'-]+$/.test(word) && word.length >= 2 && word.length <= 15;
            });

            // Shuffle
            this.words.sort(() => Math.random() - 0.5);
        } catch (error) {
            this.showToast('Error loading words. Please refresh.');
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

        const english = Array.isArray(this.currentWord.english) ? this.currentWord.english[0] : this.currentWord.english;
        document.getElementById('english-word').textContent = english;
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        document.getElementById('feedback-area').classList.add('hidden');
    }

    checkAnswer() {
        if (!this.gameActive) return;

        const input = document.getElementById('answer-input').value.trim().toLowerCase();
        if (!input) return;

        const correctAnswer = this.currentWord.pidgin.toLowerCase();
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

            this.correctWords.push({ pidgin: this.currentWord.pidgin, english: Array.isArray(this.currentWord.english) ? this.currentWord.english[0] : this.currentWord.english });

            document.getElementById('score-value').textContent = this.score;
            this.updateComboDisplay();

            feedbackArea.innerHTML = `<span class="text-green-600 font-bold"><i class="ti ti-check"></i> +${points}</span>`;
            feedbackArea.classList.remove('hidden');

            this.showNextWord();
        } else {
            // Wrong answer
            this.combo = 0;
            this.multiplier = 1;

            this.wrongWords.push({ pidgin: this.currentWord.pidgin, english: Array.isArray(this.currentWord.english) ? this.currentWord.english[0] : this.currentWord.english, yourAnswer: input });

            this.updateComboDisplay();

            feedbackArea.innerHTML = `<span class="text-red-600 font-bold"><i class="ti ti-x"></i> ${this.currentWord.pidgin}</span>`;
            feedbackArea.classList.remove('hidden');

            // Move to next word after brief pause
            setTimeout(() => this.showNextWord(), 800);
        }
    }

    skipWord() {
        if (!this.gameActive) return;
        this.combo = 0;
        this.multiplier = 1;
        this.updateComboDisplay();

        this.wrongWords.push({ pidgin: this.currentWord.pidgin, english: Array.isArray(this.currentWord.english) ? this.currentWord.english[0] : this.currentWord.english, yourAnswer: '(skipped)' });

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
        const timerEl = document.getElementById('timer-display');
        timerEl.textContent = this.timeLeft;

        // Change color as time runs out
        if (this.timeLeft <= 5) {
            timerEl.className = 'text-5xl md:text-6xl font-bold text-red-500 animate-pulse';
        } else if (this.timeLeft <= 15) {
            timerEl.className = 'text-5xl md:text-6xl font-bold text-orange-500';
        } else {
            timerEl.className = 'text-5xl md:text-6xl font-bold text-red-600';
        }

        // Update progress ring
        const pct = (this.timeLeft / this.totalTime) * 100;
        document.getElementById('timer-bar').style.width = pct + '%';
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);

        // Update high scores
        const key = `highScore${this.totalTime}`;
        if (this.score > this.stats[key]) {
            this.stats[key] = this.score;
        }
        if (this.longestStreak > this.stats.longestStreak) {
            this.stats.longestStreak = this.longestStreak;
        }
        this.saveStats();

        // Show results
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-correct').textContent = this.correctWords.length;
        document.getElementById('final-wrong').textContent = this.wrongWords.length;
        document.getElementById('final-streak').textContent = this.longestStreak;

        // Word list
        const wordListEl = document.getElementById('word-list');
        wordListEl.innerHTML = '';

        this.correctWords.forEach(w => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-2 bg-green-50 rounded-lg';
            div.innerHTML = `<span class="font-bold text-green-700">${w.pidgin}</span><span class="text-gray-600 text-sm">${w.english}</span>`;
            wordListEl.appendChild(div);
        });

        this.wrongWords.forEach(w => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-2 bg-red-50 rounded-lg';
            div.innerHTML = `<span class="font-bold text-red-700">${w.pidgin}</span><span class="text-gray-600 text-sm">${w.english}</span>`;
            wordListEl.appendChild(div);
        });

        this.updateStatsDisplay();
    }

    showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    attachEventListeners() {
        // Time mode buttons
        document.querySelectorAll('[data-time]').forEach(btn => {
            btn.addEventListener('click', () => this.startGame(parseInt(btn.dataset.time)));
        });

        // Submit answer
        document.getElementById('submit-btn').addEventListener('click', () => this.checkAnswer());
        document.getElementById('answer-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.checkAnswer();
            }
        });

        // Skip button
        document.getElementById('skip-btn').addEventListener('click', () => this.skipWord());

        // Play again
        document.getElementById('play-again-btn').addEventListener('click', () => this.showStartScreen());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const checkAPI = setInterval(() => {
        if (window.supabaseAPI || document.readyState === 'complete') {
            clearInterval(checkAPI);
            window.speedGame = new PidginSpeed();
        }
    }, 100);
    setTimeout(() => {
        if (!window.speedGame) {
            window.speedGame = new PidginSpeed();
        }
    }, 2000);
});
