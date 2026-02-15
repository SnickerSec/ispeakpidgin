// Pidgin Hangman Game Logic

class PidginHangman {
    constructor() {
        this.currentWord = null;
        this.currentWordData = null;
        this.guessedLetters = new Set();
        this.wrongGuesses = 0;
        this.maxWrong = 6;
        this.gameOver = false;
        this.hintsUsed = 0;
        this.maxHints = 2;

        // Stats
        this.stats = this.loadStats();

        // Body parts in order they appear
        this.bodyParts = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];

        this.init();
    }

    async init() {
        this.updateStatsDisplay();
        await this.startNewGame();
        this.attachEventListeners();
    }

    loadStats() {
        const saved = localStorage.getItem('pidgin-hangman-stats');
        if (saved) {
            return JSON.parse(saved);
        }
        return { wins: 0, losses: 0, streak: 0 };
    }

    saveStats() {
        localStorage.setItem('pidgin-hangman-stats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        document.getElementById('wins').textContent = this.stats.wins;
        document.getElementById('losses').textContent = this.stats.losses;
        document.getElementById('streak').textContent = this.stats.streak;
    }

    async startNewGame() {
        // Reset game state
        this.guessedLetters.clear();
        this.wrongGuesses = 0;
        this.gameOver = false;
        this.hintsUsed = 0;

        // Hide result card
        document.getElementById('result-card').classList.add('hidden');

        // Reset hangman drawing
        this.bodyParts.forEach(part => {
            const el = document.getElementById(part);
            if (el) el.classList.remove('visible');
        });

        // Reset keyboard
        document.querySelectorAll('.keyboard-key').forEach(key => {
            key.disabled = false;
            key.classList.remove('correct', 'wrong');
            key.classList.add('bg-gray-200', 'hover:bg-gray-300');
        });

        // Update wrong count
        document.getElementById('wrong-count').textContent = '0';

        // Get a random word from dictionary
        await this.getRandomWord();

        // Display the word
        this.displayWord();
    }

    async getRandomWord() {
        try {
            // Fetch random words from the dictionary API
            const response = await fetch('/api/dictionary?limit=100&random=true');
            const data = await response.json();

            if (!data.entries || data.entries.length === 0) {
                throw new Error('No words available');
            }

            // Filter for words that are suitable for hangman (3-10 letters, only a-z)
            const suitableWords = data.entries.filter(entry => {
                const word = entry.pidgin.toLowerCase();
                // Only letters a-z, no special characters or spaces
                return /^[a-z]{3,10}$/.test(word);
            });

            if (suitableWords.length === 0) {
                throw new Error('No suitable words found');
            }

            // Pick a random word
            const randomIndex = Math.floor(Math.random() * suitableWords.length);
            this.currentWordData = suitableWords[randomIndex];
            this.currentWord = this.currentWordData.pidgin.toLowerCase();

            // Update category badge
            const categoryBadge = document.getElementById('category-badge');
            categoryBadge.textContent = this.currentWordData.category || 'pidgin';

            // Set hint text (use the English meaning)
            const meanings = Array.isArray(this.currentWordData.english)
                ? this.currentWordData.english
                : [this.currentWordData.english];
            document.getElementById('hint-text').textContent = `Hint: ${meanings[0]}`;

        } catch (error) {
            console.error('Error fetching word:', error);
            this.showToast('Error loading word. Please refresh.');
        }
    }

    displayWord() {
        const wordDisplay = document.getElementById('word-display');
        wordDisplay.innerHTML = '';

        for (const letter of this.currentWord) {
            const slot = document.createElement('span');
            slot.className = 'letter-slot';
            slot.dataset.letter = letter;

            if (this.guessedLetters.has(letter)) {
                slot.textContent = letter;
                slot.classList.add('revealed');
            } else {
                slot.textContent = '';
            }

            wordDisplay.appendChild(slot);
        }
    }

    guessLetter(letter) {
        if (this.gameOver || this.guessedLetters.has(letter)) {
            return;
        }

        letter = letter.toLowerCase();
        this.guessedLetters.add(letter);

        // Update keyboard
        const keyBtn = document.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        if (keyBtn) {
            keyBtn.disabled = true;
            keyBtn.classList.remove('bg-gray-200', 'hover:bg-gray-300');
        }

        if (this.currentWord.includes(letter)) {
            // Correct guess
            if (keyBtn) keyBtn.classList.add('correct');
            this.displayWord();
            this.checkWin();
        } else {
            // Wrong guess
            if (keyBtn) keyBtn.classList.add('wrong');
            this.wrongGuesses++;
            document.getElementById('wrong-count').textContent = this.wrongGuesses;

            // Show body part
            if (this.wrongGuesses <= this.bodyParts.length) {
                const part = document.getElementById(this.bodyParts[this.wrongGuesses - 1]);
                if (part) part.classList.add('visible');
            }

            // Shake the hangman
            document.querySelector('.hangman-svg').classList.add('shake');
            setTimeout(() => {
                document.querySelector('.hangman-svg').classList.remove('shake');
            }, 300);

            this.checkLose();
        }
    }

    checkWin() {
        const allRevealed = [...this.currentWord].every(letter =>
            this.guessedLetters.has(letter)
        );

        if (allRevealed) {
            this.gameOver = true;
            this.stats.wins++;
            this.stats.streak++;
            this.saveStats();
            this.updateStatsDisplay();
            this.showResult(true);
        }
    }

    checkLose() {
        if (this.wrongGuesses >= this.maxWrong) {
            this.gameOver = true;
            this.stats.losses++;
            this.stats.streak = 0;
            this.saveStats();
            this.updateStatsDisplay();

            // Reveal the word
            for (const letter of this.currentWord) {
                this.guessedLetters.add(letter);
            }
            this.displayWord();

            this.showResult(false);
        }
    }

    showResult(won) {
        const resultCard = document.getElementById('result-card');
        const resultTitle = document.getElementById('result-title');
        const resultWord = document.getElementById('result-word');
        const resultMeaning = document.getElementById('result-meaning');
        const resultLink = document.getElementById('result-link');

        resultTitle.innerHTML = won ? '<i class="ti ti-confetti"></i> You Got It!' : '<i class="ti ti-mood-sad"></i> Game Over';
        resultTitle.className = `text-2xl font-bold mb-2 ${won ? 'text-green-600' : 'text-red-600'}`;

        resultWord.textContent = this.currentWordData.pidgin;

        const meanings = Array.isArray(this.currentWordData.english)
            ? this.currentWordData.english.join(', ')
            : this.currentWordData.english;
        resultMeaning.textContent = `Meaning: ${meanings}`;

        // Create slug for link
        const slug = this.currentWordData.pidgin.toLowerCase()
            .replace(/['']/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        resultLink.href = `/word/${slug}.html`;

        resultCard.classList.remove('hidden');
        resultCard.classList.add('bounce');
        setTimeout(() => resultCard.classList.remove('bounce'), 500);
    }

    useHint() {
        if (this.gameOver) return;

        if (this.hintsUsed >= this.maxHints) {
            this.showToast('No more hints available!');
            return;
        }

        // Find an unrevealed letter
        const unrevealedLetters = [...this.currentWord].filter(
            letter => !this.guessedLetters.has(letter)
        );

        if (unrevealedLetters.length === 0) {
            this.showToast('All letters revealed!');
            return;
        }

        // Reveal a random unrevealed letter
        const randomLetter = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
        this.hintsUsed++;

        // Highlight the hint letter differently
        this.guessedLetters.add(randomLetter);
        this.displayWord();

        // Mark the keyboard key
        const keyBtn = document.querySelector(`[data-key="${randomLetter.toUpperCase()}"]`);
        if (keyBtn) {
            keyBtn.disabled = true;
            keyBtn.classList.remove('bg-gray-200', 'hover:bg-gray-300');
            keyBtn.classList.add('correct');
        }

        // Add hint class to the slots
        document.querySelectorAll('.letter-slot').forEach(slot => {
            if (slot.dataset.letter === randomLetter) {
                slot.classList.add('hint');
            }
        });

        this.showToast(`Hint used! (${this.maxHints - this.hintsUsed} remaining)`);
        this.checkWin();
    }

    showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    attachEventListeners() {
        // Keyboard clicks
        document.querySelectorAll('.keyboard-key').forEach(key => {
            key.addEventListener('click', () => {
                const letter = key.dataset.key;
                if (letter) {
                    this.guessLetter(letter);
                }
            });
        });

        // Physical keyboard
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;

            const key = e.key.toUpperCase();
            if (/^[A-Z]$/.test(key)) {
                this.guessLetter(key);
            }
        });

        // New game button
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });

        // Hint button
        document.getElementById('hint-btn').addEventListener('click', () => {
            this.useHint();
        });
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase API to be ready
    const checkAPI = setInterval(() => {
        if (window.supabaseAPI || document.readyState === 'complete') {
            clearInterval(checkAPI);
            window.hangmanGame = new PidginHangman();
        }
    }, 100);

    // Fallback - start after 2 seconds regardless
    setTimeout(() => {
        if (!window.hangmanGame) {
            window.hangmanGame = new PidginHangman();
        }
    }, 2000);
});
