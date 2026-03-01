// Pidgin Fill in the Blank Game Logic

class PidginFillBlank {
    constructor() {
        this.words = [];
        this.currentQuestion = null;
        this.round = 0;
        this.totalRounds = 10;
        this.score = 0;
        this.streak = 0;
        this.longestStreak = 0;
        this.gameActive = false;
        this.answered = false;
        this.stats = this.loadStats();
        this.init();
    }

    async init() {
        this.updateStatsDisplay();
        this.attachEventListeners();
        await this.loadWords();
        this.showStartScreen();
    }

    loadStats() {
        const saved = localStorage.getItem('pidgin-fill-blank-stats');
        if (saved) return JSON.parse(saved);
        return { gamesPlayed: 0, bestStreak: 0, totalCorrect: 0, totalAttempts: 0 };
    }

    saveStats() {
        localStorage.setItem('pidgin-fill-blank-stats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        document.getElementById('stat-played').textContent = this.stats.gamesPlayed;
        document.getElementById('stat-streak').textContent = this.stats.bestStreak;
        document.getElementById('stat-correct').textContent = this.stats.totalCorrect;
        const pct = this.stats.totalAttempts > 0 ? Math.round((this.stats.totalCorrect / this.stats.totalAttempts) * 100) : 0;
        document.getElementById('stat-accuracy').textContent = pct + '%';
    }

    showStartScreen() {
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
    }

    async loadWords() {
        try {
            const response = await fetch('/api/dictionary?limit=300&random=true');
            const data = await response.json();

            if (!data.entries || data.entries.length === 0) throw new Error('No words');

            // Filter entries that have examples
            this.words = data.entries.filter(entry => {
                return entry.examples && entry.examples.length > 0 &&
                    entry.examples.some(ex => ex.pidgin && ex.pidgin.length > 0);
            });

            // Also keep all entries for wrong options
            this.allWords = data.entries;
        } catch (error) {
            this.showToast('Error loading words. Please refresh.');
        }
    }

    startGame() {
        this.round = 0;
        this.score = 0;
        this.streak = 0;
        this.longestStreak = 0;

        // Shuffle words
        this.words.sort(() => Math.random() - 0.5);

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        this.nextRound();
    }

    nextRound() {
        if (this.round >= this.totalRounds || this.round >= this.words.length) {
            this.endGame();
            return;
        }

        this.answered = false;
        this.gameActive = true;
        this.round++;

        const entry = this.words[this.round - 1];
        const example = entry.examples.find(ex => ex.pidgin && ex.pidgin.length > 0);

        // Create the blank sentence
        const pidginWord = entry.pidgin;
        const sentence = example.pidgin;

        // Create regex to find the word in the sentence (case insensitive)
        const regex = new RegExp(`\\b${this.escapeRegex(pidginWord)}\\b`, 'i');
        const blankSentence = sentence.replace(regex, '________');

        // If we couldn't blank it (word not in example), try simple replacement
        const displaySentence = blankSentence.includes('________')
            ? blankSentence
            : sentence.replace(new RegExp(this.escapeRegex(pidginWord), 'i'), '________');

        // Get 3 wrong options from other words
        const wrongOptions = this.allWords
            .filter(w => w.pidgin.toLowerCase() !== pidginWord.toLowerCase())
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(w => w.pidgin);

        // All 4 options shuffled
        const options = [pidginWord, ...wrongOptions].sort(() => Math.random() - 0.5);

        this.currentQuestion = {
            correctAnswer: pidginWord,
            sentence: displaySentence,
            translation: example.english || '',
            options: options,
            meaning: Array.isArray(entry.english) ? entry.english[0] : entry.english
        };

        // Update UI
        document.getElementById('round-num').textContent = this.round;
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('streak-indicator').textContent = this.streak > 0 ? `${this.streak} streak` : '';

        // Display sentence
        document.getElementById('sentence-display').innerHTML = displaySentence.replace(
            '________',
            '<span class="inline-block bg-amber-200 text-amber-900 px-3 py-1 rounded-lg font-bold mx-1">?????</span>'
        );

        // Display translation hint if available
        const translationEl = document.getElementById('translation-hint');
        if (this.currentQuestion.translation) {
            translationEl.textContent = this.currentQuestion.translation;
            translationEl.classList.remove('hidden');
        } else {
            translationEl.classList.add('hidden');
        }

        // Render options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 font-semibold text-gray-800 transition-all';
            btn.textContent = option;
            btn.addEventListener('click', () => this.selectAnswer(option, btn));
            optionsContainer.appendChild(btn);
        });

        document.getElementById('next-btn').classList.add('hidden');
        this.updateProgressBar();
    }

    selectAnswer(answer, btnEl) {
        if (this.answered) return;
        this.answered = true;
        this.gameActive = false;
        this.stats.totalAttempts++;

        const correct = answer.toLowerCase() === this.currentQuestion.correctAnswer.toLowerCase();

        // Highlight all buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.add('pointer-events-none');
            if (btn.textContent.toLowerCase() === this.currentQuestion.correctAnswer.toLowerCase()) {
                btn.classList.add('border-green-500', 'bg-green-50', 'text-green-800');
                btn.classList.remove('border-gray-200');
            } else if (btn === btnEl && !correct) {
                btn.classList.add('border-red-400', 'bg-red-50', 'text-red-800');
                btn.classList.remove('border-gray-200');
            }
        });

        // Update sentence to show the answer
        document.getElementById('sentence-display').innerHTML = this.currentQuestion.sentence.replace(
            '________',
            `<span class="inline-block ${correct ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'} px-3 py-1 rounded-lg font-bold mx-1">${this.currentQuestion.correctAnswer}</span>`
        );

        if (correct) {
            this.score += 10;
            this.streak++;
            if (this.streak > this.longestStreak) this.longestStreak = this.streak;
            this.stats.totalCorrect++;
            this.showToast('Correct!');
        } else {
            this.streak = 0;
            this.showToast(`The answer was: ${this.currentQuestion.correctAnswer}`);
        }

        this.saveStats();
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('streak-indicator').textContent = this.streak > 0 ? `${this.streak} streak` : '';
        document.getElementById('next-btn').classList.remove('hidden');
    }

    endGame() {
        this.stats.gamesPlayed++;
        if (this.longestStreak > this.stats.bestStreak) {
            this.stats.bestStreak = this.longestStreak;
        }
        this.saveStats();

        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-correct').textContent = this.stats.totalCorrect;
        document.getElementById('final-streak').textContent = this.longestStreak;

        const pct = this.totalRounds > 0 ? Math.round((this.score / 10 / this.totalRounds) * 100) : 0;
        document.getElementById('final-accuracy').textContent = pct + '%';

        this.updateStatsDisplay();
    }

    updateProgressBar() {
        const pct = ((this.round - 1) / this.totalRounds) * 100;
        document.getElementById('progress-bar').style.width = pct + '%';
        document.getElementById('progress-text').textContent = `${this.round} / ${this.totalRounds}`;
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    attachEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('next-btn').addEventListener('click', () => this.nextRound());
        document.getElementById('play-again-btn').addEventListener('click', () => this.showStartScreen());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const checkAPI = setInterval(() => {
        if (window.supabaseAPI || document.readyState === 'complete') {
            clearInterval(checkAPI);
            window.fillBlankGame = new PidginFillBlank();
        }
    }, 100);
    setTimeout(() => {
        if (!window.fillBlankGame) {
            window.fillBlankGame = new PidginFillBlank();
        }
    }, 2000);
});
