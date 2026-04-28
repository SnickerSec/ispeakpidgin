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
        
        // Leaderboard elements
        this.leaderboardBody = document.getElementById('leaderboard-body');
        this.leaderboardContainer = document.getElementById('leaderboard-container');
        this.scoreSubmitContainer = document.getElementById('score-submit-container');
        this.playerNameInput = document.getElementById('player-name');
        this.submitScoreBtn = document.getElementById('submit-score-btn');
        this.leaderboardDiff = document.getElementById('leaderboard-difficulty');

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

        try {
            await this.loadWords();
            if (this.words.length === 0) {
                throw new Error('No suitable words found');
            }
            this.nextRound();
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

            if (this.words.length < this.totalRounds) {
                this.words = data.entries.filter(entry => {
                    const word = entry.pidgin.toLowerCase();
                    return /^[a-z]+$/.test(word) && word.length >= 3;
                });
            }

            this.words.sort(() => Math.random() - 0.5);
        } catch (error) {
            console.error('Error loading words:', error);
            throw error;
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

        document.getElementById('score-display').textContent = this.score;
        document.getElementById('streak-display').textContent = this.streak;
        document.getElementById('hint-area').classList.add('hidden');
        document.getElementById('result-feedback').classList.add('hidden');
        document.getElementById('hint-btn').classList.remove('opacity-50');

        this.renderLetterTiles();
        this.renderAnswerSlots();
        this.updateProgressBar();
    }

    scrambleWord(word) {
        const letters = word.split('');
        let shuffled;
        let attempts = 0;
        do {
            shuffled = [...letters];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            attempts++;
        } while (shuffled.join('') === word && attempts < 10 && word.length > 1);
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
            tile.dataset.letter = letter;
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

        const slots = document.querySelectorAll('.answer-slot');
        const pos = this.selectedLetters.length - 1;
        if (pos < slots.length) {
            slots[pos].textContent = this.currentScrambled[tileIndex];
            slots[pos].classList.add('bg-violet-50', 'border-violet-600', 'cursor-pointer');
        }

        if (this.selectedLetters.length === this.currentWord.pidgin.length) {
            this.checkAnswer();
        }
    }

    removeLetter(position) {
        if (!this.gameActive) return;
        if (position >= this.selectedLetters.length) return;

        const removed = this.selectedLetters.splice(position);

        removed.forEach(({ tileIndex }) => {
            const tile = document.querySelector(`[data-index="${tileIndex}"]`);
            if (tile) {
                tile.classList.remove('used', 'opacity-30', 'scale-90');
                tile.classList.add('hover:shadow-lg', 'hover:border-violet-500', 'hover:scale-105');
            }
        });

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
            this.streak = 0;
            feedback.innerHTML = `<div class="text-red-600 font-bold text-lg"><i class="ti ti-x"></i> The word was: <span class="text-violet-700">${this.currentWord.pidgin}</span></div>`;
            document.querySelectorAll('.answer-slot').forEach(s => {
                s.classList.add('border-red-400', 'text-red-600', 'bg-red-50');
            });
        }

        document.getElementById('score-display').textContent = this.score;
        document.getElementById('streak-display').textContent = this.streak;
        setTimeout(() => this.nextRound(), 2000);
    }

    showHint() {
        if (!this.gameActive || this.hintUsed) return;
        this.hintUsed = true;
        const englishValue = this.currentWord.english;
        const meanings = Array.isArray(englishValue) ? englishValue.join(', ') : englishValue;
        const hintArea = document.getElementById('hint-area');
        hintArea.textContent = meanings || 'No hint available';
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
        if (toRemove > 0) this.removeLetter(0);
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
                    game_type: `scramble-${this.difficulty}`,
                    streak: this.stats.bestStreak
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
        this.leaderboardDiff.textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        this.leaderboardBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-400">Loading rankings...</td></tr>';

        try {
            const response = await fetch(`/api/games/leaderboard?game_type=scramble-${this.difficulty}&limit=10`);
            const data = await response.json();

            if (data.scores && data.scores.length > 0) {
                this.leaderboardBody.innerHTML = data.scores.map((s, i) => `
                    <tr class="${s.username === this.playerNameInput.value ? 'bg-violet-50 font-bold' : ''}">
                        <td class="px-4 py-3">${i + 1}</td>
                        <td class="px-4 py-3">${this.escapeHtml(s.username)}</td>
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
        this.stats.gamesPlayed++;
        if (this.streak > this.stats.bestStreak) this.stats.bestStreak = this.streak;
        this.saveStats();

        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');
        this.scoreSubmitContainer.classList.remove('hidden');
        this.loadLeaderboard();

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
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    attachEventListeners() {
        document.querySelectorAll('[data-difficulty]').forEach(btn => {
            btn.addEventListener('click', () => this.startGame(btn.dataset.difficulty));
        });

        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('skip-btn').addEventListener('click', () => this.skipWord());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearLetters());
        document.getElementById('play-again-btn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('share-results-btn')?.addEventListener('click', () => this.shareResults());
        this.submitScoreBtn?.addEventListener('click', () => this.submitScore());

        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            if (/^[a-z]$/i.test(e.key)) {
                const letter = e.key.toLowerCase();
                const availableTiles = Array.from(document.querySelectorAll('.letter-tile:not(.used)'));
                const tile = availableTiles.find(t => t.dataset.letter === letter);
                if (tile) this.selectLetter(parseInt(tile.dataset.index));
            }
            if (e.key === 'Backspace') {
                e.preventDefault();
                if (this.selectedLetters.length > 0) this.removeLetter(this.selectedLetters.length - 1);
            }
            if (e.key === 'Escape') this.clearLetters();
        });
    }

    shareResults() {
        const streak = this.streak;
        const emoji = streak >= 8 ? '🔥' : (streak >= 5 ? '🌺' : '🏝️');
        const shareText = `Pidgin Word Scramble (${this.difficulty})\nScore: ${this.score}\nSolved: ${this.stats.wordsSolved}\nStreak: ${emoji} ${streak}\n\nCan you beat my score? Play at ChokePidgin.com! 🤙`;
        const shareUrl = window.location.href;
        if (navigator.share) {
            navigator.share({ title: 'Pidgin Word Scramble Results', text: shareText, url: shareUrl })
                .catch(() => this.fallbackShare(shareText, shareUrl));
        } else {
            this.fallbackShare(shareText, shareUrl);
        }
    }

    fallbackShare(text, url) {
        const fullText = `${text}\n\n${url}`;
        navigator.clipboard.writeText(fullText).then(() => {
            this.showToast('Results copied to clipboard! 📋');
        }).catch(() => alert(fullText));
    }

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.scrambleGame) window.scrambleGame = new PidginScramble();
    }, 500);
});
