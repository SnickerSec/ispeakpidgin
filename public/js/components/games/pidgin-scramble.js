// Pidgin Word Scramble Game Logic

class PidginScramble {
    constructor() {
        this.words = [];
        this.currentWord = null;
        this.currentScrambled = '';
        this.selectedLetters = [];
        this.round = 0;
        this.totalRounds = 10;
        this.score = 0;
        this.streak = 0;
        this.hintUsed = false;
        this.startTime = null;
        this.difficulty = 'medium';
        this.gameActive = false;
        this.stats = this.loadStats();
        this.init();
    }

    async init() {
        this.updateStatsDisplay();
        this.attachEventListeners();
        this.showStartScreen();
    }

    loadStats() {
        const saved = localStorage.getItem('pidgin-scramble-stats');
        if (saved) return JSON.parse(saved);
        return { gamesPlayed: 0, bestStreak: 0, wordsSolved: 0, totalTime: 0, totalWords: 0 };
    }

    saveStats() {
        localStorage.setItem('pidgin-scramble-stats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        document.getElementById('stat-played').textContent = this.stats.gamesPlayed;
        document.getElementById('stat-solved').textContent = this.stats.wordsSolved;
        document.getElementById('stat-streak').textContent = this.stats.bestStreak;
        const avg = this.stats.totalWords > 0 ? Math.round(this.stats.totalTime / this.stats.totalWords) : 0;
        document.getElementById('stat-avg-time').textContent = avg + 's';
    }

    showStartScreen() {
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
    }

    async startGame(difficulty) {
        this.difficulty = difficulty;
        this.round = 0;
        this.score = 0;
        this.streak = 0;

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        await this.loadWords();
        this.nextRound();
    }

    async loadWords() {
        try {
            const response = await fetch('/api/dictionary?limit=200&random=true');
            const data = await response.json();

            if (!data.entries || data.entries.length === 0) {
                throw new Error('No words available');
            }

            let minLen, maxLen;
            if (this.difficulty === 'easy') { minLen = 3; maxLen = 4; }
            else if (this.difficulty === 'medium') { minLen = 5; maxLen = 6; }
            else { minLen = 7; maxLen = 20; }

            this.words = data.entries.filter(entry => {
                const word = entry.pidgin.toLowerCase();
                return /^[a-z]+$/.test(word) && word.length >= minLen && word.length <= maxLen;
            });

            // If not enough words for this difficulty, relax the filter
            if (this.words.length < this.totalRounds) {
                this.words = data.entries.filter(entry => {
                    const word = entry.pidgin.toLowerCase();
                    return /^[a-z]+$/.test(word) && word.length >= 3;
                });
            }

            // Shuffle
            this.words.sort(() => Math.random() - 0.5);
        } catch (error) {
            this.showToast('Error loading words. Please refresh.');
        }
    }

    nextRound() {
        if (this.round >= this.totalRounds || this.round >= this.words.length) {
            this.endGame();
            return;
        }

        this.currentWord = this.words[this.round];
        this.hintUsed = false;
        this.selectedLetters = [];
        this.startTime = Date.now();
        this.gameActive = true;
        this.round++;

        const word = this.currentWord.pidgin.toLowerCase();
        this.currentScrambled = this.scrambleWord(word);

        // Update UI
        document.getElementById('round-num').textContent = this.round;
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('streak-display').textContent = this.streak;
        document.getElementById('hint-area').classList.add('hidden');
        document.getElementById('result-feedback').classList.add('hidden');

        this.renderLetterTiles();
        this.renderAnswerSlots();
        this.updateProgressBar();
    }

    scrambleWord(word) {
        const letters = word.split('');
        // Fisher-Yates shuffle, ensure it's actually different
        let shuffled;
        let attempts = 0;
        do {
            shuffled = [...letters];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            attempts++;
        } while (shuffled.join('') === word && attempts < 10);
        return shuffled.join('');
    }

    renderLetterTiles() {
        const container = document.getElementById('letter-tiles');
        container.innerHTML = '';

        this.currentScrambled.split('').forEach((letter, index) => {
            const tile = document.createElement('button');
            tile.className = 'letter-tile bg-white border-2 border-violet-300 text-violet-800 font-bold text-xl md:text-2xl w-12 h-12 md:w-14 md:h-14 rounded-xl shadow-md hover:shadow-lg hover:border-violet-500 hover:scale-105 transition-all uppercase';
            tile.textContent = letter;
            tile.dataset.index = index;
            tile.addEventListener('click', () => this.selectLetter(index));
            container.appendChild(tile);
        });
    }

    renderAnswerSlots() {
        const container = document.getElementById('answer-slots');
        container.innerHTML = '';
        const word = this.currentWord.pidgin.toLowerCase();

        for (let i = 0; i < word.length; i++) {
            const slot = document.createElement('div');
            slot.className = 'answer-slot w-10 h-12 md:w-12 md:h-14 border-b-4 border-violet-400 flex items-center justify-center text-xl md:text-2xl font-bold text-violet-800 uppercase transition-all';
            slot.dataset.position = i;
            slot.addEventListener('click', () => this.removeLetter(i));
            container.appendChild(slot);
        }
    }

    selectLetter(tileIndex) {
        if (!this.gameActive) return;

        const tile = document.querySelector(`[data-index="${tileIndex}"]`);
        if (!tile || tile.classList.contains('used')) return;

        tile.classList.add('used', 'opacity-30', 'scale-90');
        tile.classList.remove('hover:shadow-lg', 'hover:border-violet-500', 'hover:scale-105');

        this.selectedLetters.push({ letter: this.currentScrambled[tileIndex], tileIndex });

        // Fill next empty slot
        const slots = document.querySelectorAll('.answer-slot');
        const pos = this.selectedLetters.length - 1;
        if (pos < slots.length) {
            slots[pos].textContent = this.currentScrambled[tileIndex];
            slots[pos].classList.add('bg-violet-50', 'border-violet-600', 'cursor-pointer');
        }

        // Check if word is complete
        if (this.selectedLetters.length === this.currentWord.pidgin.length) {
            this.checkAnswer();
        }
    }

    removeLetter(position) {
        if (!this.gameActive) return;
        if (position >= this.selectedLetters.length) return;

        // Remove this letter and all after it
        const removed = this.selectedLetters.splice(position);

        // Restore tiles
        removed.forEach(({ tileIndex }) => {
            const tile = document.querySelector(`[data-index="${tileIndex}"]`);
            if (tile) {
                tile.classList.remove('used', 'opacity-30', 'scale-90');
                tile.classList.add('hover:shadow-lg', 'hover:border-violet-500', 'hover:scale-105');
            }
        });

        // Update answer slots
        const slots = document.querySelectorAll('.answer-slot');
        slots.forEach((slot, i) => {
            if (i < this.selectedLetters.length) {
                slot.textContent = this.selectedLetters[i].letter;
                slot.classList.add('bg-violet-50', 'border-violet-600', 'cursor-pointer');
            } else {
                slot.textContent = '';
                slot.classList.remove('bg-violet-50', 'border-violet-600', 'cursor-pointer');
            }
        });
    }

    checkAnswer() {
        const answer = this.selectedLetters.map(l => l.letter).join('');
        const correct = this.currentWord.pidgin.toLowerCase();
        const timeTaken = Math.round((Date.now() - this.startTime) / 1000);

        this.gameActive = false;
        const feedback = document.getElementById('result-feedback');
        feedback.classList.remove('hidden');

        if (answer === correct) {
            // Correct
            const points = this.hintUsed ? 5 : 10;
            const timeBonus = Math.max(0, 30 - timeTaken);
            this.score += points + timeBonus;
            this.streak++;

            this.stats.wordsSolved++;
            this.stats.totalTime += timeTaken;
            this.stats.totalWords++;
            this.saveStats();

            feedback.innerHTML = `<div class="text-green-600 font-bold text-lg"><i class="ti ti-check"></i> Correct! +${points + timeBonus} points</div>`;
            document.querySelectorAll('.answer-slot').forEach(s => {
                s.classList.add('border-green-500', 'text-green-700', 'bg-green-50');
            });

            this.showToast('Nice one, brah!');
        } else {
            // Wrong
            this.streak = 0;
            feedback.innerHTML = `<div class="text-red-600 font-bold text-lg"><i class="ti ti-x"></i> The word was: <span class="text-violet-700">${this.currentWord.pidgin}</span></div>`;
            document.querySelectorAll('.answer-slot').forEach(s => {
                s.classList.add('border-red-400', 'text-red-600', 'bg-red-50');
            });
        }

        document.getElementById('score-display').textContent = this.score;
        document.getElementById('streak-display').textContent = this.streak;

        // Auto advance after delay
        setTimeout(() => this.nextRound(), 2000);
    }

    showHint() {
        if (!this.gameActive || this.hintUsed) return;
        this.hintUsed = true;

        const meanings = Array.isArray(this.currentWord.english)
            ? this.currentWord.english.join(', ')
            : this.currentWord.english;

        const hintArea = document.getElementById('hint-area');
        hintArea.textContent = meanings;
        hintArea.classList.remove('hidden');

        document.getElementById('hint-btn').classList.add('opacity-50');
        this.showToast('Hint revealed! (-5 points)');
    }

    skipWord() {
        if (!this.gameActive) return;
        this.gameActive = false;
        this.streak = 0;

        const feedback = document.getElementById('result-feedback');
        feedback.classList.remove('hidden');
        feedback.innerHTML = `<div class="text-gray-600 font-bold">Skipped! The word was: <span class="text-violet-700">${this.currentWord.pidgin}</span></div>`;

        document.getElementById('streak-display').textContent = this.streak;
        setTimeout(() => this.nextRound(), 1500);
    }

    clearLetters() {
        if (!this.gameActive) return;
        const toRemove = this.selectedLetters.length;
        if (toRemove > 0) {
            this.removeLetter(0);
        }
    }

    endGame() {
        this.stats.gamesPlayed++;
        if (this.streak > this.stats.bestStreak) {
            this.stats.bestStreak = this.streak;
        }
        this.saveStats();

        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-solved').textContent = this.stats.wordsSolved;
        document.getElementById('final-streak').textContent = this.streak;

        this.updateStatsDisplay();
    }

    updateProgressBar() {
        const pct = ((this.round - 1) / this.totalRounds) * 100;
        document.getElementById('progress-bar').style.width = pct + '%';
        document.getElementById('progress-text').textContent = `${this.round} / ${this.totalRounds}`;
    }

    showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    attachEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('[data-difficulty]').forEach(btn => {
            btn.addEventListener('click', () => this.startGame(btn.dataset.difficulty));
        });

        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('skip-btn').addEventListener('click', () => this.skipWord());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearLetters());
        document.getElementById('play-again-btn').addEventListener('click', () => this.showStartScreen());

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            if (e.key === 'Backspace') {
                e.preventDefault();
                if (this.selectedLetters.length > 0) {
                    this.removeLetter(this.selectedLetters.length - 1);
                }
            }
        });
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const checkAPI = setInterval(() => {
        if (window.supabaseAPI || document.readyState === 'complete') {
            clearInterval(checkAPI);
            window.scrambleGame = new PidginScramble();
        }
    }, 100);
    setTimeout(() => {
        if (!window.scrambleGame) {
            window.scrambleGame = new PidginScramble();
        }
    }, 2000);
});
