// Pidgin Memory Match Game Logic

class PidginMemory {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.moves = 0;
        this.timer = null;
        this.seconds = 0;
        this.gameActive = false;
        this.lockBoard = false;
        this.difficulty = 'medium';
        this.stats = this.loadStats();
        this.init();
    }

    async init() {
        this.updateStatsDisplay();
        this.attachEventListeners();
        this.showStartScreen();
    }

    loadStats() {
        const saved = localStorage.getItem('pidgin-memory-stats');
        if (saved) return JSON.parse(saved);
        return { 
            gamesPlayed: 0, 
            bestTimeEasy: null, bestTimeMedium: null, bestTimeHard: null, 
            bestMovesEasy: null, bestMovesMedium: null, bestMovesHard: null 
        };
    }

    saveStats() {
        localStorage.setItem('pidgin-memory-stats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        document.getElementById('stat-played').textContent = this.stats.gamesPlayed || 0;
        const diff = this.difficulty || 'medium';
        const bestTime = this.stats[`bestTime${this.capitalize(diff)}`];
        document.getElementById('stat-best-time').textContent = bestTime ? this.formatTime(bestTime) : '--';
        const bestMoves = this.stats[`bestMoves${this.capitalize(diff)}`];
        document.getElementById('stat-best-moves').textContent = bestMoves || '--';
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
    }

    showStartScreen() {
        if (this.timer) clearInterval(this.timer);
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
    }

    async startGame(difficulty) {
        this.difficulty = difficulty;
        this.totalPairs = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 12;
        this.matchedPairs = 0;
        this.moves = 0;
        this.seconds = 0;
        this.flippedCards = [];
        this.lockBoard = false;

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        document.getElementById('moves-display').textContent = '0';
        document.getElementById('timer-display').textContent = '0:00';
        document.getElementById('pairs-display').textContent = `0 / ${this.totalPairs}`;

        try {
            await this.loadCards();
            if (this.cards.length === 0) {
                throw new Error('No cards loaded');
            }
            this.renderBoard();
            this.startTimer();
            this.gameActive = true;
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Failed to start memory game:', error);
            this.showToast('Failed to load words. Please refresh.');
            this.showStartScreen();
        }
    }

    async loadCards() {
        try {
            // My recent fix to dictionary API now supports random=true
            const response = await fetch('/api/dictionary?limit=300&random=true');
            const data = await response.json();

            if (!data.entries || data.entries.length === 0) throw new Error('No words');

            // Pick entries with short pidgin words (to fit on cards)
            const suitable = data.entries.filter(e => {
                const word = e.pidgin.toLowerCase();
                // Avoid very long words that break layout
                return word.length <= 15;
            });

            // If we don't have enough, just use what we have
            const pool = suitable.length >= this.totalPairs ? suitable : data.entries;
            
            // Shuffle pool before picking
            const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
            const selected = shuffledPool.slice(0, this.totalPairs);

            // Create card pairs: one with pidgin word, one with english meaning
            this.cards = [];
            selected.forEach((entry, i) => {
                const englishValue = entry.english;
                const english = Array.isArray(englishValue) ? englishValue[0] : englishValue;
                
                this.cards.push(
                    { id: i, type: 'pidgin', text: entry.pidgin, pairId: i },
                    { id: i + this.totalPairs, type: 'english', text: english || '???', pairId: i }
                );
            });

            // Shuffle cards
            for (let i = this.cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
            }
            
            console.log(`Loaded ${this.cards.length} cards (${this.totalPairs} pairs) for memory game`);
        } catch (error) {
            console.error('Error loading cards:', error);
            throw error;
        }
    }

    renderBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';

        // Set grid columns based on difficulty
        const cols = this.difficulty === 'easy' ? 3 : this.difficulty === 'medium' ? 4 : 4;
        board.className = `grid gap-2 md:gap-3 justify-center max-w-lg mx-auto`;
        board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        this.cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card aspect-square rounded-xl cursor-pointer shadow-md transition-all duration-300';
            cardEl.dataset.index = index;

            // Card structure with inner for flip animation if we wanted, 
            // but for now keeping it simple with hidden classes
            cardEl.innerHTML = `
                <div class="card-inner w-full h-full relative">
                    <div class="card-back absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center text-white text-2xl md:text-3xl">
                        <i class="ti ti-question-mark"></i>
                    </div>
                    <div class="card-front absolute inset-0 bg-white border-2 rounded-xl flex items-center justify-center p-2 hidden overflow-hidden ${card.type === 'pidgin' ? 'border-emerald-400 text-emerald-700' : 'border-cyan-400 text-cyan-700'}">
                        <span class="text-[10px] md:text-xs font-bold leading-tight break-words text-center uppercase">${card.text}</span>
                    </div>
                </div>
            `;

            cardEl.addEventListener('click', () => this.flipCard(index));
            board.appendChild(cardEl);
        });
    }

    flipCard(index) {
        if (this.lockBoard || !this.gameActive) return;

        const cardEl = document.querySelector(`[data-index="${index}"]`);

        // Don't flip already flipped or matched cards
        if (this.flippedCards.find(f => f.index === index)) return;
        if (cardEl.classList.contains('matched')) return;

        // Show card face
        cardEl.querySelector('.card-back').classList.add('hidden');
        cardEl.querySelector('.card-front').classList.remove('hidden');
        cardEl.classList.add('ring-2', 'ring-emerald-400');

        this.flippedCards.push({ index, card: this.cards[index] });

        if (this.flippedCards.length === 2) {
            this.moves++;
            document.getElementById('moves-display').textContent = this.moves;
            this.checkMatch();
        }
    }

    checkMatch() {
        this.lockBoard = true;
        const [first, second] = this.flippedCards;

        if (first.card.pairId === second.card.pairId) {
            // Match found
            const firstEl = document.querySelector(`[data-index="${first.index}"]`);
            const secondEl = document.querySelector(`[data-index="${second.index}"]`);
            
            setTimeout(() => {
                firstEl.classList.add('matched', 'opacity-60', 'scale-95');
                secondEl.classList.add('matched', 'opacity-60', 'scale-95');
                firstEl.classList.remove('ring-emerald-400');
                secondEl.classList.remove('ring-emerald-400');
                
                this.matchedPairs++;
                document.getElementById('pairs-display').textContent = `${this.matchedPairs} / ${this.totalPairs}`;

                this.flippedCards = [];
                this.lockBoard = false;

                if (this.matchedPairs === this.totalPairs) {
                    this.endGame();
                }
            }, 500);
        } else {
            // No match - flip back after delay
            setTimeout(() => {
                this.flippedCards.forEach(({ index }) => {
                    const el = document.querySelector(`[data-index="${index}"]`);
                    el.querySelector('.card-back').classList.remove('hidden');
                    el.querySelector('.card-front').classList.add('hidden');
                    el.classList.remove('ring-emerald-400');
                });
                this.flippedCards = [];
                this.lockBoard = false;
            }, 1000);
        }
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.seconds++;
            document.getElementById('timer-display').textContent = this.formatTime(this.seconds);
        }, 1000);
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);
        this.stats.gamesPlayed++;

        // Update High Scores
        const timeKey = `bestTime${this.capitalize(this.difficulty)}`;
        const movesKey = `bestMoves${this.capitalize(this.difficulty)}`;

        if (!this.stats[timeKey] || this.seconds < this.stats[timeKey]) {
            this.stats[timeKey] = this.seconds;
        }
        if (!this.stats[movesKey] || this.moves < this.stats[movesKey]) {
            this.stats[movesKey] = this.moves;
        }
        
        this.saveStats();

        // Show results screen
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');

        document.getElementById('final-moves').textContent = this.moves;
        document.getElementById('final-time').textContent = this.formatTime(this.seconds);
        
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
        document.querySelectorAll('[data-difficulty]').forEach(btn => {
            btn.addEventListener('click', () => this.startGame(btn.dataset.difficulty));
        });

        document.getElementById('play-again-btn')?.addEventListener('click', () => this.showStartScreen());
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.memoryGame) {
            window.memoryGame = new PidginMemory();
        }
    }, 500);
});
