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
        
        // Leaderboard elements
        this.leaderboardBody = document.getElementById('leaderboard-body');
        this.leaderboardContainer = document.getElementById('leaderboard-container');
        this.scoreSubmitContainer = document.getElementById('score-submit-container');
        this.playerNameInput = document.getElementById('player-name');
        this.submitScoreBtn = document.getElementById('submit-score-btn');
        this.leaderboardTime = document.getElementById('leaderboard-time');

        this.init();
    }

    async init() {
        this.updateStatsDisplay();
        this.attachEventListeners();
        this.showStartScreen();

        // Pre-fill name
        const savedName = localStorage.getItem('pidgin_player_name');
        if (savedName && this.playerNameInput) {
            this.playerNameInput.value = savedName;
        }
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
            const response = await fetch('/api/dictionary?limit=300&random=true');
            const data = await response.json();
            if (!data.entries || data.entries.length === 0) throw new Error('No words');
            this.words = data.entries.filter(e => {
                const word = e.pidgin.toLowerCase();
                return /^[a-z' -]+$/i.test(word) && word.length >= 2 && word.length <= 20;
            });
            this.words.sort(() => Math.random() - 0.5);
        } catch (error) {
            console.error('Error loading words:', error);
            throw error;
        }
    }

    showNextWord() {
        if (this.currentIndex >= this.words.length) {
            this.words.sort(() => Math.random() - 0.5);
            this.currentIndex = 0;
        }
        this.currentWord = this.words[this.currentIndex];
        this.currentIndex++;
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
        const isCorrect = input === correctAnswer;

        if (isCorrect) {
            this.combo++;
            if (this.combo > this.longestStreak) this.longestStreak = this.combo;
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
            const feedbackArea = document.getElementById('feedback-area');
            feedbackArea.textContent = `+${points}`;
            feedbackArea.className = 'text-green-600 font-bold animate-bounce-in';
            feedbackArea.classList.remove('hidden');
            this.showNextWord();
        }
    }

    handleIncorrect() {
        if (!this.gameActive) return;
        const input = document.getElementById('answer-input').value.trim().toLowerCase();
        this.combo = 0;
        this.multiplier = 1;
        const englishValue = this.currentWord.english;
        const english = Array.isArray(englishValue) ? englishValue[0] : englishValue;
        this.wrongWords.push({ pidgin: this.currentWord.pidgin, english: english, yourAnswer: input || '(empty)' });
        this.updateComboDisplay();
        const feedbackArea = document.getElementById('feedback-area');
        feedbackArea.textContent = this.currentWord.pidgin;
        feedbackArea.className = 'text-red-600 font-bold animate-bounce-in';
        feedbackArea.classList.remove('hidden');
        setTimeout(() => this.showNextWord(), 800);
    }

    skipWord() {
        if (!this.gameActive) return;
        this.combo = 0;
        this.multiplier = 1;
        this.updateComboDisplay();
        const englishValue = this.currentWord.english;
        const english = Array.isArray(englishValue) ? englishValue[0] : englishValue;
        this.wrongWords.push({ pidgin: this.currentWord.pidgin, english: english, yourAnswer: '(skipped)' });
        const feedbackArea = document.getElementById('feedback-area');
        feedbackArea.textContent = `Skipped: ${this.currentWord.pidgin}`;
        feedbackArea.className = 'text-gray-500 font-medium animate-pulse';
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
        } else comboEl.textContent = '';
        multEl.textContent = `${this.multiplier}x`;
        if (this.multiplier >= 4) multEl.className = 'text-sm font-bold text-red-500';
        else if (this.multiplier >= 2) multEl.className = 'text-sm font-bold text-orange-500';
        else multEl.className = 'text-sm font-bold text-gray-400';
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) this.endGame();
        }, 1000);
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('timer-value');
        const progressBar = document.getElementById('timer-progress');
        timerEl.textContent = this.timeLeft + 's';
        const pct = (this.timeLeft / this.totalTime) * 100;
        progressBar.style.width = pct + '%';
        if (this.timeLeft <= 10) {
            timerEl.className = 'text-5xl md:text-6xl font-bold text-red-500 animate-pulse';
            progressBar.className = 'h-full bg-red-500 transition-all duration-1000';
        } else {
            timerEl.className = 'text-5xl md:text-6xl font-bold text-red-600';
            progressBar.className = 'h-full bg-red-500 transition-all duration-1000';
        }
    }

    async submitScore() {
        const username = this.playerNameInput.value.trim() || 'Anonymous';
        this.submitScoreBtn.disabled = true;
        this.submitScoreBtn.innerHTML = '<i class="ti ti-loader animate-spin"></i> Saving...';

        try {
            const response = await fetch('/api/games/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    score: this.score,
                    game_type: `speed-${this.totalTime}`,
                    streak: this.longestStreak
                })
            });

            if (response.ok) {
                localStorage.setItem('pidgin_player_name', username);
                this.scoreSubmitContainer.classList.add('hidden');
                await this.loadLeaderboard();
            } else {
                alert('Failed to save score. Try again!');
                this.submitScoreBtn.disabled = false;
                this.submitScoreBtn.textContent = 'Save';
            }
        } catch (err) {
            console.error('Score submission error:', err);
            this.submitScoreBtn.disabled = false;
            this.submitScoreBtn.textContent = 'Save';
        }
    }

    async loadLeaderboard() {
        this.leaderboardContainer.classList.remove('hidden');
        this.leaderboardTime.textContent = this.totalTime + 's';
        this.leaderboardBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-400">Loading rankings...</td></tr>';

        try {
            const response = await fetch(`/api/games/leaderboard?game_type=speed-${this.totalTime}&limit=10`);
            const data = await response.json();
            if (data.scores && data.scores.length > 0) {
                this.leaderboardBody.innerHTML = data.scores.map((s, i) => `
                    <tr class="${s.username === this.playerNameInput.value ? 'bg-red-50 font-bold' : ''}">
                        <td class="px-4 py-3">${i + 1}</td>
                        <td class="px-4 py-3">${s.username}</td>
                        <td class="px-4 py-3 text-right">${s.score}</td>
                    </tr>
                `).join('');
            } else {
                this.leaderboardBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-400 italic">No scores yet. Be da first!</td></tr>';
            }
        } catch (err) {
            console.error('Leaderboard load error:', err);
            this.leaderboardBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-red-400">Failed to load.</td></tr>';
        }
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);
        const scoreKey = `highScore${this.totalTime}`;
        if (this.score > (this.stats[scoreKey] || 0)) this.stats[scoreKey] = this.score;
        if (this.longestStreak > (this.stats.longestStreak || 0)) this.stats.longestStreak = this.longestStreak;
        this.saveStats();

        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');
        this.scoreSubmitContainer.classList.remove('hidden');
        this.loadLeaderboard();

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-correct').textContent = this.correctWords.length;
        document.getElementById('final-wrong').textContent = this.wrongWords.length;
        document.getElementById('final-streak').textContent = this.longestStreak;

        const reviewList = document.getElementById('word-list');
        reviewList.innerHTML = '';
        const allWords = [...this.correctWords.map(w => ({...w, correct: true})), ...this.wrongWords.map(w => ({...w, correct: false}))];
        allWords.slice(0, 20).forEach(word => {
            const item = document.createElement('div');
            item.className = `flex justify-between p-2 rounded ${word.correct ? 'bg-green-50' : 'bg-red-50'}`;
            item.innerHTML = `<span><strong>${word.pidgin}</strong>: ${word.english}</span><span class="${word.correct ? 'text-green-600' : 'text-red-600'}"><i class="ti ti-${word.correct ? 'check' : 'x'}"></i></span>`;
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
        document.querySelectorAll('[data-duration]').forEach(btn => {
            btn.addEventListener('click', () => this.startGame(parseInt(btn.dataset.duration)));
        });
        const input = document.getElementById('answer-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim().toLowerCase();
                if (val === this.currentWord.pidgin.toLowerCase()) this.checkAnswer();
                else this.handleIncorrect();
            }
        });
        document.getElementById('skip-btn').addEventListener('click', () => this.skipWord());
        document.getElementById('play-again-btn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('share-results-btn')?.addEventListener('click', () => this.shareResults());
        this.submitScoreBtn?.addEventListener('click', () => this.submitScore());
    }

    shareResults() {
        const emoji = this.longestStreak >= 10 ? '🔥' : (this.longestStreak >= 5 ? '⚡' : '🌺');
        const shareText = `Pidgin Speed Translation (${this.totalTime}s)\nScore: ${this.score}\nCorrect: ${this.correctWords.length}\nStreak: ${emoji} ${this.longestStreak}\n\nThink you stay fast? Play at ChokePidgin.com! 🤙`;
        const shareUrl = window.location.href;
        if (navigator.share) {
            navigator.share({ title: 'Pidgin Speed Translation Results', text: shareText, url: shareUrl })
                .catch(() => this.fallbackShare(shareText, shareUrl));
        } else this.fallbackShare(shareText, shareUrl);
    }

    fallbackShare(text, url) {
        const fullText = `${text}\n\n${url}`;
        navigator.clipboard.writeText(fullText).then(() => this.showToast('Results copied to clipboard! 📋')).catch(() => alert(fullText));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.speedGame) window.speedGame = new PidginSpeed();
    }, 500);
});
