// Pidgin Wordle Game Logic

class PidginWordle {
    constructor() {
        this.currentRow = 0;
        this.currentCol = 0;
        this.currentGuess = '';
        this.guesses = [];
        this.gameOver = false;
        this.dailyWord = null;
        this.wordData = null; // Store full word data including dayNumber
        this.keyStates = {}; // Track keyboard key states

        this.init();
    }

    async init() {
        await this.initGame();
        this.initElements();
        this.attachEventListeners();
        this.loadGameState();
        this.startCountdown();
    }

    async initGame() {
        try {
            // Get today's daily word from Supabase API
            this.wordData = await window.supabaseAPI.getDailyWordleWord();

            if (!this.wordData || !this.wordData.word) {
                throw new Error('No daily word available');
            }

            this.dailyWord = this.wordData.word;

            // Update UI with day number
            const dayNumberEl = document.getElementById('day-number');
            if (dayNumberEl) {
                dayNumberEl.textContent = this.wordData.dayNumber;
            }

        } catch (error) {
            console.error('Error loading daily word:', error);
            this.showError('Failed to load today\'s puzzle. Please refresh the page.');
        }
    }

    showError(message) {
        this.showToast(message, 3000);
    }

    async isValidGuess(word) {
        // Use Supabase API to validate word
        return await window.supabaseAPI.validateWordleWord(word);
    }

    checkGuess(guess, solution) {
        // Check each letter in the guess against the solution
        const result = [];
        const solutionLetters = solution.split('');
        const guessLetters = guess.split('');
        const letterCounts = {};

        // Count letters in solution
        solutionLetters.forEach(letter => {
            letterCounts[letter] = (letterCounts[letter] || 0) + 1;
        });

        // First pass: mark correct letters (green)
        guessLetters.forEach((letter, i) => {
            if (letter === solutionLetters[i]) {
                result[i] = 'correct';
                letterCounts[letter]--;
            }
        });

        // Second pass: mark present letters (yellow) and absent (gray)
        guessLetters.forEach((letter, i) => {
            if (result[i] === 'correct') return; // Already marked correct

            if (solutionLetters.includes(letter) && letterCounts[letter] > 0) {
                result[i] = 'present';
                letterCounts[letter]--;
            } else {
                result[i] = 'absent';
            }
        });

        return result;
    }

    initElements() {
        // Tiles
        this.tiles = document.querySelectorAll('.wordle-tile');

        // Keyboard
        this.keys = document.querySelectorAll('.key');

        // Modals
        this.helpModal = document.getElementById('help-modal');
        this.statsModal = document.getElementById('stats-modal');

        // Buttons
        this.helpBtn = document.getElementById('help-btn');
        this.statsBtn = document.getElementById('stats-btn');
        this.shareBtn = document.getElementById('share-btn');

        // Close modal buttons
        this.closeModalBtns = document.querySelectorAll('.close-modal');

        // Toast
        this.toast = document.getElementById('toast');

        // Stats elements
        this.statPlayed = document.getElementById('stat-played');
        this.statWinRate = document.getElementById('stat-win-rate');
        this.statStreak = document.getElementById('stat-streak');
        this.statMaxStreak = document.getElementById('stat-max-streak');
        this.shareSection = document.getElementById('share-section');
        this.countdownTimer = document.getElementById('countdown-timer');
    }

    attachEventListeners() {
        // Physical keyboard
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // On-screen keyboard
        this.keys.forEach(key => {
            key.addEventListener('click', () => {
                const keyValue = key.dataset.key;
                this.handleKeyInput(keyValue);
            });
        });

        // Help modal
        this.helpBtn.addEventListener('click', () => this.openModal('help-modal'));

        // Stats modal
        this.statsBtn.addEventListener('click', () => {
            this.updateStatsDisplay();
            this.openModal('stats-modal');
        });

        // Close modals
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                this.closeModal(modalId);
            });
        });

        // Close modal on outside click
        [this.helpModal, this.statsModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Share button
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', () => this.shareResults());
        }
    }

    handleKeyPress(e) {
        if (this.gameOver) return;

        const key = e.key;

        if (key === 'Enter') {
            this.handleKeyInput('ENTER');
        } else if (key === 'Backspace') {
            this.handleKeyInput('BACKSPACE');
        } else if (/^[a-zA-Z]$/.test(key)) {
            this.handleKeyInput(key.toUpperCase());
        }
    }

    handleKeyInput(key) {
        if (this.gameOver) return;

        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === 'BACKSPACE') {
            this.deleteLetter();
        } else if (this.currentCol < 5) {
            this.addLetter(key);
        }
    }

    addLetter(letter) {
        if (this.currentCol >= 5) return;

        const tile = this.getTile(this.currentRow, this.currentCol);
        tile.textContent = letter;
        tile.classList.add('filled');

        this.currentGuess += letter;
        this.currentCol++;
    }

    deleteLetter() {
        if (this.currentCol === 0) return;

        this.currentCol--;
        const tile = this.getTile(this.currentRow, this.currentCol);
        tile.textContent = '';
        tile.classList.remove('filled');

        this.currentGuess = this.currentGuess.slice(0, -1);
    }

    async submitGuess() {
        // Check if guess is complete
        if (this.currentGuess.length !== 5) {
            this.showToast('Not enough letters!');
            this.shakeRow(this.currentRow);
            return;
        }

        // Check if guess is valid
        const isValid = await this.isValidGuess(this.currentGuess);
        if (!isValid) {
            this.showToast('Not in word list!');
            this.shakeRow(this.currentRow);
            return;
        }

        // Check the guess against the solution
        const result = this.checkGuess(this.currentGuess, this.dailyWord);

        // Animate and color the tiles
        await this.revealTiles(result);

        // Update keyboard colors
        this.updateKeyboard(this.currentGuess, result);

        // Store the guess
        this.guesses.push({
            word: this.currentGuess,
            result: result
        });

        // Check if won
        if (this.currentGuess === this.dailyWord) {
            this.gameOver = true;
            this.handleWin();
            return;
        }

        // Check if lost (used all 6 guesses)
        if (this.currentRow === 5) {
            this.gameOver = true;
            this.handleLoss();
            return;
        }

        // Move to next row
        this.currentRow++;
        this.currentCol = 0;
        this.currentGuess = '';

        // Save game state
        this.saveGameState();
    }

    async revealTiles(result) {
        const tiles = [];
        for (let i = 0; i < 5; i++) {
            tiles.push(this.getTile(this.currentRow, i));
        }

        // Reveal tiles with delay for animation effect
        for (let i = 0; i < 5; i++) {
            await this.delay(300);
            tiles[i].classList.add(result[i]);
        }

        await this.delay(500);
    }

    updateKeyboard(guess, result) {
        const letters = guess.split('');

        letters.forEach((letter, i) => {
            const state = result[i];
            const key = document.querySelector(`[data-key="${letter}"]`);

            if (!key) return;

            // Only update if the new state is better than the old state
            // Priority: correct > present > absent
            const currentState = this.keyStates[letter] || 'none';

            if (state === 'correct') {
                this.keyStates[letter] = 'correct';
                key.classList.remove('present', 'absent');
                key.classList.add('correct');
            } else if (state === 'present' && currentState !== 'correct') {
                this.keyStates[letter] = 'present';
                key.classList.remove('absent');
                key.classList.add('present');
            } else if (state === 'absent' && currentState === 'none') {
                this.keyStates[letter] = 'absent';
                key.classList.add('absent');
            }
        });
    }

    handleWin() {
        const messages = [
            'Chee hoo! <i class="ti ti-flower"></i>',
            'Rajah! You got em! <i class="ti ti-hand-love-you"></i>',
            'Das it! You da champion! <i class="ti ti-trophy"></i>',
            'Broke da mouth! <i class="ti ti-number-100-small"></i>',
            'You stay local! <i class="ti ti-palm-tree"></i>'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        setTimeout(() => {
            this.showToast(randomMessage);
            this.bounceRow(this.currentRow);
        }, 1500);

        // Update stats
        this.updateStats(true, this.currentRow + 1);

        // Save game state
        this.saveGameState();

        // Show stats modal after delay
        setTimeout(() => {
            this.updateStatsDisplay();
            this.shareSection.classList.remove('hidden');
            this.openModal('stats-modal');
        }, 3000);
    }

    handleLoss() {
        setTimeout(() => {
            this.showToast(`Da word was: ${this.dailyWord}`);
        }, 1500);

        // Update stats
        this.updateStats(false, 0);

        // Save game state
        this.saveGameState();

        // Show stats modal after delay
        setTimeout(() => {
            this.updateStatsDisplay();
            this.shareSection.classList.remove('hidden');
            this.openModal('stats-modal');
        }, 3000);
    }

    getTile(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    shakeRow(row) {
        const tiles = [];
        for (let i = 0; i < 5; i++) {
            tiles.push(this.getTile(row, i));
        }

        tiles.forEach(tile => {
            tile.classList.add('shake');
            setTimeout(() => tile.classList.remove('shake'), 500);
        });
    }

    bounceRow(row) {
        const tiles = [];
        for (let i = 0; i < 5; i++) {
            tiles.push(this.getTile(row, i));
        }

        tiles.forEach((tile, i) => {
            setTimeout(() => {
                tile.classList.add('bounce');
                setTimeout(() => tile.classList.remove('bounce'), 1000);
            }, i * 100);
        });
    }

    showToast(message) {
        this.toast.innerHTML = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2000);
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Stats and Storage
    saveGameState() {
        const gameState = {
            dayNumber: this.wordData.dayNumber,
            guesses: this.guesses,
            currentRow: this.currentRow,
            gameOver: this.gameOver,
            keyStates: this.keyStates
        };

        localStorage.setItem('pidginWordleGame', JSON.stringify(gameState));
    }

    loadGameState() {
        const saved = localStorage.getItem('pidginWordleGame');
        if (!saved) return;

        const gameState = JSON.parse(saved);

        // Check if it's the same day
        if (gameState.dayNumber !== this.wordData.dayNumber) {
            // New day, start fresh
            localStorage.removeItem('pidginWordleGame');
            return;
        }

        // Restore game state
        this.guesses = gameState.guesses || [];
        this.currentRow = gameState.currentRow || 0;
        this.gameOver = gameState.gameOver || false;
        this.keyStates = gameState.keyStates || {};

        // Restore tiles and keyboard
        this.guesses.forEach((guess, row) => {
            const letters = guess.word.split('');
            letters.forEach((letter, col) => {
                const tile = this.getTile(row, col);
                tile.textContent = letter;
                tile.classList.add('filled', guess.result[col]);
            });

            // Update keyboard
            this.updateKeyboard(guess.word, guess.result);
        });

        // If game is over, show share section
        if (this.gameOver) {
            this.shareSection.classList.remove('hidden');
        }
    }

    updateStats(won, guessCount) {
        let stats = this.getStats();

        stats.gamesPlayed++;
        if (won) {
            stats.gamesWon++;
            stats.currentStreak++;
            stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

            // Track guess distribution
            if (!stats.guessDistribution[guessCount]) {
                stats.guessDistribution[guessCount] = 0;
            }
            stats.guessDistribution[guessCount]++;
        } else {
            stats.currentStreak = 0;
        }

        stats.winRate = Math.round((stats.gamesWon / stats.gamesPlayed) * 100);

        localStorage.setItem('pidginWordleStats', JSON.stringify(stats));
    }

    getStats() {
        const saved = localStorage.getItem('pidginWordleStats');
        if (!saved) {
            return {
                gamesPlayed: 0,
                gamesWon: 0,
                currentStreak: 0,
                maxStreak: 0,
                winRate: 0,
                guessDistribution: {}
            };
        }
        return JSON.parse(saved);
    }

    updateStatsDisplay() {
        const stats = this.getStats();

        this.statPlayed.textContent = stats.gamesPlayed;
        this.statWinRate.textContent = stats.winRate;
        this.statStreak.textContent = stats.currentStreak;
        this.statMaxStreak.textContent = stats.maxStreak;
    }

    shareResults() {
        const guessCount = this.guesses.length;
        const won = this.gameOver && this.guesses[this.guesses.length - 1].word === this.dailyWord;

        // Create emoji grid
        let emojiGrid = '';
        this.guesses.forEach(guess => {
            guess.result.forEach(state => {
                if (state === 'correct') {
                    emojiGrid += '🟩';
                } else if (state === 'present') {
                    emojiGrid += '🟨';
                } else {
                    emojiGrid += '⬜';
                }
            });
            emojiGrid += '\n';
        });

        const resultText = won ? `${guessCount}/6` : 'X/6';
        const shareText = `Pidgin Wordle #${this.wordData.dayNumber} ${resultText}\n\n${emojiGrid}\nPlay at ChokePidgin.com! 🌺`;

        // Try native share API first (mobile)
        if (navigator.share) {
            navigator.share({
                title: 'Pidgin Wordle Results',
                text: shareText
            }).catch(() => {
                this.fallbackShare(shareText);
            });
        } else {
            this.fallbackShare(shareText);
        }
    }

    fallbackShare(text) {
        // Copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Results copied to clipboard! <i class="ti ti-clipboard"></i>');
        }).catch(err => {
            // If clipboard fails, show the text in an alert
            alert(text);
        });
    }

    startCountdown() {
        this.updateCountdown();
        setInterval(() => this.updateCountdown(), 1000);
    }

    updateCountdown() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const diff = tomorrow - now;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const countdownStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (this.countdownTimer) {
            this.countdownTimer.textContent = countdownStr;
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new PidginWordle();

    // Show help modal on first visit
    const hasVisited = localStorage.getItem('pidginWordleVisited');
    if (!hasVisited) {
        setTimeout(() => {
            game.openModal('help-modal');
            localStorage.setItem('pidginWordleVisited', 'true');
        }, 500);
    }
});
