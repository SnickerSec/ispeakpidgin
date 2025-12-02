// Pidgin Crossword Game Logic

class PidginCrossword {
    constructor() {
        this.puzzle = null;
        this.grid = [];
        this.currentCell = null;
        this.currentDirection = 'across';
        this.currentClue = null;
        this.userAnswers = {};
        this.completedWords = new Set();

        this.initElements();
        this.init();
    }

    async init() {
        await this.loadPuzzle();
        this.attachEventListeners();
        this.loadProgress();
    }

    initElements() {
        this.container = document.getElementById('crossword-container');
        this.puzzleTitle = document.getElementById('puzzle-title');
        this.puzzleDescription = document.getElementById('puzzle-description');
        this.acrossClues = document.getElementById('across-clues');
        this.downClues = document.getElementById('down-clues');
        this.mobileClues = document.getElementById('mobile-clues');

        // Buttons
        this.hintBtn = document.getElementById('hint-btn');
        this.checkBtn = document.getElementById('check-btn');
        this.revealBtn = document.getElementById('reveal-btn');
        this.shareBtn = document.getElementById('share-results-btn');
        this.closeModalBtn = document.getElementById('close-modal-btn');

        // Stats
        this.statCorrect = document.getElementById('stat-correct');
        this.statProgress = document.getElementById('stat-progress');
        this.statStreak = document.getElementById('stat-streak');
        this.statTotal = document.getElementById('stat-total');

        // Modal
        this.completionModal = document.getElementById('completion-modal');
    }

    async loadPuzzle() {
        try {
            // Get daily puzzle from Supabase API
            this.puzzle = await window.supabaseAPI.getDailyCrosswordPuzzle();

            if (!this.puzzle) {
                throw new Error('No puzzle available');
            }

            // Update UI
            this.puzzleTitle.textContent = this.puzzle.title;
            this.puzzleDescription.textContent = this.puzzle.description;

            // Build grid
            this.buildGrid();
            this.buildClues();
        } catch (error) {
            console.error('Error loading puzzle:', error);
            this.showError('Failed to load puzzle. Please refresh the page.');
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p class="text-red-800">${message}</p>
            </div>
        `;
    }

    buildGrid() {
        // Create a simple grid based on words
        // For now, use a basic 10x10 grid
        const gridSize = 10;
        this.grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));

        // Place words on grid (simplified version)
        this.placeWords();

        // Render grid HTML
        this.renderGrid();
    }

    placeWords() {
        // Simple word placement algorithm
        // For the initial version, manually position words

        const words = [...this.puzzle.words.across, ...this.puzzle.words.down];

        words.forEach(wordData => {
            const row = wordData.row || 0;
            const col = wordData.col || 0;
            const word = wordData.word;
            const isAcross = this.puzzle.words.across.includes(wordData);

            for (let i = 0; i < word.length; i++) {
                const r = isAcross ? row : row + i;
                const c = isAcross ? col + i : col;

                if (r < this.grid.length && c < this.grid[0].length) {
                    if (!this.grid[r][c]) {
                        this.grid[r][c] = {
                            letter: word[i],
                            number: i === 0 ? wordData.number : null,
                            words: []
                        };
                    }
                    this.grid[r][c].words.push({
                        number: wordData.number,
                        direction: isAcross ? 'across' : 'down',
                        index: i
                    });
                }
            }
        });
    }

    renderGrid() {
        const gridEl = document.createElement('div');
        gridEl.className = 'crossword-grid';
        gridEl.style.gridTemplateColumns = `repeat(${this.grid[0].length}, 1fr)`;

        this.grid.forEach((row, rowIdx) => {
            row.forEach((cell, colIdx) => {
                const cellEl = document.createElement('div');
                cellEl.className = 'crossword-cell';
                cellEl.dataset.row = rowIdx;
                cellEl.dataset.col = colIdx;

                if (cell === null) {
                    cellEl.classList.add('black');
                } else {
                    // Add cell number
                    if (cell.number) {
                        const numberEl = document.createElement('span');
                        numberEl.className = 'cell-number';
                        numberEl.textContent = cell.number;
                        cellEl.appendChild(numberEl);
                    }

                    // Add input
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.dataset.row = rowIdx;
                    input.dataset.col = colIdx;
                    input.dataset.answer = cell.letter;

                    // Load saved answer
                    const savedAnswer = this.userAnswers[`${rowIdx}-${colIdx}`];
                    if (savedAnswer) {
                        input.value = savedAnswer;
                    }

                    cellEl.appendChild(input);
                }

                gridEl.appendChild(cellEl);
            });
        });

        this.container.innerHTML = '';
        this.container.appendChild(gridEl);
    }

    buildClues() {
        // Build across clues
        this.acrossClues.innerHTML = '';
        this.puzzle.words.across.forEach(word => {
            const clueEl = document.createElement('div');
            clueEl.className = 'clue-item';
            clueEl.dataset.number = word.number;
            clueEl.dataset.direction = 'across';
            clueEl.innerHTML = `<strong>${word.number}.</strong> ${word.clue}`;
            this.acrossClues.appendChild(clueEl);
        });

        // Build down clues
        this.downClues.innerHTML = '';
        this.puzzle.words.down.forEach(word => {
            const clueEl = document.createElement('div');
            clueEl.className = 'clue-item';
            clueEl.dataset.number = word.number;
            clueEl.dataset.direction = 'down';
            clueEl.innerHTML = `<strong>${word.number}.</strong> ${word.clue}`;
            this.downClues.appendChild(clueEl);
        });

        // Mobile clues (combined)
        if (this.mobileClues) {
            this.mobileClues.innerHTML = `
                <div class="mb-4">
                    <h4 class="font-bold mb-2">Across</h4>
                    ${this.acrossClues.innerHTML}
                </div>
                <div>
                    <h4 class="font-bold mb-2">Down</h4>
                    ${this.downClues.innerHTML}
                </div>
            `;
        }
    }

    attachEventListeners() {
        // Cell click and input
        this.container.addEventListener('click', (e) => this.handleCellClick(e));
        this.container.addEventListener('input', (e) => this.handleInput(e));
        this.container.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Clue clicks
        this.acrossClues.addEventListener('click', (e) => this.handleClueClick(e));
        this.downClues.addEventListener('click', (e) => this.handleClueClick(e));

        // Buttons
        this.hintBtn.addEventListener('click', () => this.showHint());
        this.checkBtn.addEventListener('click', () => this.checkAnswers());
        this.revealBtn.addEventListener('click', () => this.revealAnswers());
        this.shareBtn.addEventListener('click', () => this.shareResults());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
    }

    handleCellClick(e) {
        const cell = e.target.closest('.crossword-cell');
        if (!cell || cell.classList.contains('black')) return;

        const input = cell.querySelector('input');
        if (input) {
            // Remove previous active cell
            document.querySelectorAll('.crossword-cell.active').forEach(el => {
                el.classList.remove('active');
            });

            cell.classList.add('active');
            input.focus();
            this.currentCell = input;
        }
    }

    handleInput(e) {
        if (e.target.tagName !== 'INPUT') return;

        const input = e.target;
        const value = input.value.toUpperCase();
        input.value = value;

        // Save answer
        const key = `${input.dataset.row}-${input.dataset.col}`;
        this.userAnswers[key] = value;
        this.saveProgress();

        // Move to next cell
        if (value) {
            this.moveToNextCell(input);
        }

        // Update stats
        this.updateStats();
    }

    handleKeydown(e) {
        if (e.target.tagName !== 'INPUT') return;

        const input = e.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);

        if (e.key === 'Backspace' && !input.value) {
            this.moveToPreviousCell(input);
        } else if (e.key === 'ArrowLeft') {
            this.moveCell(row, col, 0, -1);
        } else if (e.key === 'ArrowRight') {
            this.moveCell(row, col, 0, 1);
        } else if (e.key === 'ArrowUp') {
            this.moveCell(row, col, -1, 0);
        } else if (e.key === 'ArrowDown') {
            this.moveCell(row, col, 1, 0);
        }
    }

    handleClueClick(e) {
        const clueItem = e.target.closest('.clue-item');
        if (!clueItem) return;

        // Remove previous active clue
        document.querySelectorAll('.clue-item.active').forEach(el => {
            el.classList.remove('active');
        });

        clueItem.classList.add('active');

        // Find and focus first cell of this word
        const number = parseInt(clueItem.dataset.number);
        const direction = clueItem.dataset.direction;
        this.focusWord(number, direction);
    }

    focusWord(number, direction) {
        // Find the word data
        const words = direction === 'across' ? this.puzzle.words.across : this.puzzle.words.down;
        const wordData = words.find(w => w.number === number);

        if (wordData) {
            const row = wordData.row || 0;
            const col = wordData.col || 0;
            const input = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);

            if (input) {
                input.focus();
                input.closest('.crossword-cell').classList.add('active');
            }
        }
    }

    moveToNextCell(currentInput) {
        const row = parseInt(currentInput.dataset.row);
        const col = parseInt(currentInput.dataset.col);

        // Try to move in current direction (default: across)
        this.moveCell(row, col, 0, 1);
    }

    moveToPreviousCell(currentInput) {
        const row = parseInt(currentInput.dataset.row);
        const col = parseInt(currentInput.dataset.col);

        this.moveCell(row, col, 0, -1);
    }

    moveCell(row, col, rowDelta, colDelta) {
        let newRow = row + rowDelta;
        let newCol = col + colDelta;

        // Find next valid cell
        while (newRow >= 0 && newRow < this.grid.length &&
               newCol >= 0 && newCol < this.grid[0].length) {
            const cell = this.grid[newRow][newCol];
            if (cell !== null) {
                const input = document.querySelector(`input[data-row="${newRow}"][data-col="${newCol}"]`);
                if (input) {
                    input.focus();
                    input.closest('.crossword-cell').classList.add('active');
                    return;
                }
            }
            newRow += rowDelta;
            newCol += colDelta;
        }
    }

    showHint() {
        // Find first empty cell
        const inputs = document.querySelectorAll('.crossword-cell input');
        for (const input of inputs) {
            if (!input.value) {
                input.value = input.dataset.answer;
                const key = `${input.dataset.row}-${input.dataset.col}`;
                this.userAnswers[key] = input.dataset.answer;
                this.saveProgress();
                this.updateStats();
                return;
            }
        }

        alert('No empty cells to hint!');
    }

    checkAnswers() {
        const inputs = document.querySelectorAll('.crossword-cell input');
        let allCorrect = true;
        let hasAny = false;

        inputs.forEach(input => {
            if (input.value) {
                hasAny = true;
                const cell = input.closest('.crossword-cell');
                cell.classList.remove('correct', 'incorrect');

                if (input.value.toUpperCase() === input.dataset.answer) {
                    cell.classList.add('correct');
                } else {
                    cell.classList.add('incorrect');
                    allCorrect = false;
                }
            }
        });

        if (!hasAny) {
            alert('Fill in some answers first!');
            return;
        }

        if (allCorrect) {
            this.handleCompletion();
        }
    }

    revealAnswers() {
        if (!confirm('Are you sure you want to reveal all answers?')) return;

        const inputs = document.querySelectorAll('.crossword-cell input');
        inputs.forEach(input => {
            input.value = input.dataset.answer;
            const key = `${input.dataset.row}-${input.dataset.col}`;
            this.userAnswers[key] = input.dataset.answer;
        });

        this.saveProgress();
        this.updateStats();
        this.checkAnswers();
    }

    updateStats() {
        const inputs = document.querySelectorAll('.crossword-cell input');
        const total = inputs.length;
        let filled = 0;
        let correct = 0;

        inputs.forEach(input => {
            if (input.value) {
                filled++;
                if (input.value.toUpperCase() === input.dataset.answer) {
                    correct++;
                }
            }
        });

        this.statCorrect.textContent = correct;
        this.statProgress.textContent = Math.round((filled / total) * 100) + '%';

        // Load streak and total from localStorage
        const stats = this.getStats();
        this.statStreak.textContent = stats.streak;
        this.statTotal.textContent = stats.total;
    }

    handleCompletion() {
        // Update stats
        const stats = this.getStats();
        stats.total++;
        stats.streak++;
        stats.lastCompleted = new Date().toISOString().split('T')[0];
        this.saveStats(stats);

        // Show modal
        this.completionModal.classList.remove('hidden');

        // Update stats display
        this.updateStats();
    }

    closeModal() {
        this.completionModal.classList.add('hidden');
    }

    shareResults() {
        const shareText = `I just completed the Pidgin Crossword "${this.puzzle.title}"! 🧩\n\nTheme: ${this.puzzle.theme}\nDifficulty: ${this.puzzle.difficulty}\n\nPlay daily Pidgin Crosswords at ChokePidgin.com! 🌺`;

        if (navigator.share) {
            navigator.share({
                title: 'Pidgin Crossword Results',
                text: shareText
            }).catch(err => console.log('Share failed:', err));
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Results copied to clipboard! 📋');
            });
        }
    }

    saveProgress() {
        const progressData = {
            puzzleId: this.puzzle.id,
            date: new Date().toISOString().split('T')[0],
            answers: this.userAnswers
        };
        localStorage.setItem('pidginCrosswordProgress', JSON.stringify(progressData));
    }

    loadProgress() {
        const saved = localStorage.getItem('pidginCrosswordProgress');
        if (!saved) return;

        const progressData = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];

        // Only load if same day and same puzzle
        if (progressData.date === today && progressData.puzzleId === this.puzzle.id) {
            this.userAnswers = progressData.answers || {};
        }
    }

    getStats() {
        const saved = localStorage.getItem('pidginCrosswordStats');
        if (!saved) {
            return { total: 0, streak: 0, lastCompleted: null };
        }
        return JSON.parse(saved);
    }

    saveStats(stats) {
        localStorage.setItem('pidginCrosswordStats', JSON.stringify(stats));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new PidginCrossword();
});
