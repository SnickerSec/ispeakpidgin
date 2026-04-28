/**
 * Pidgin Ear Trainer Game
 * Tests listening comprehension using high-quality ElevenLabs audio
 */

class PidginEarTrainer {
    constructor() {
        this.allWords = [];
        this.filteredWords = [];
        this.currentRound = null;
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.totalQuestions = 0;
        this.questionsAttempted = 0;
        this.gameMode = 'relaxed'; // relaxed, blitz, marathon
        this.difficulty = 'all'; // beginner, intermediate, expert, all
        this.timeLeft = 60;
        this.timer = null;
        this.isGameOver = false;
        
        // Cache DOM elements
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            results: document.getElementById('results-screen')
        };
        
        this.elements = {
            score: document.getElementById('current-score'),
            streak: document.getElementById('current-streak'),
            streakContainer: document.getElementById('streak-container'),
            timer: document.getElementById('time-left'),
            timerContainer: document.getElementById('timer-container'),
            progressBar: document.getElementById('progress-bar'),
            optionsGrid: document.getElementById('options-grid'),
            playBtn: document.getElementById('play-audio-btn'),
            playIcon: document.getElementById('play-icon'),
            audioRing: document.getElementById('audio-ring'),
            skipBtn: document.getElementById('skip-btn'),
            
            // Leaderboard elements
            scoreSubmitContainer: document.getElementById('score-submit-container'),
            leaderboardContainer: document.getElementById('leaderboard-container'),
            leaderboardBody: document.getElementById('leaderboard-body'),
            playerNameInput: document.getElementById('player-name'),
            submitScoreBtn: document.getElementById('submit-score-btn')
        };

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        
        // Pre-fill name from local storage if available
        const savedName = localStorage.getItem('pidgin_player_name');
        if (savedName && this.elements.playerNameInput) {
            this.elements.playerNameInput.value = savedName;
        }
    }

    async loadData() {
        try {
            // Load dictionary and phrases for a huge pool of questions
            if (!window.supabaseAPI) {
                console.error('Supabase API not found');
                return;
            }

            const [dict, phrases] = await Promise.all([
                window.supabaseAPI.loadDictionaryEntries(),
                window.supabaseAPI.loadPhrases()
            ]);

            // Combine only entries that HAVE pre-generated audio
            const audioIndex = window.elevenLabsSpeech?.pregeneratedIndex || new Map();
            
            const dictEntries = (dict.entries || []).filter(e => audioIndex.has(e.pidgin.toLowerCase()));
            const phraseEntries = (phrases.phrases || []).filter(e => audioIndex.has(e.pidgin.toLowerCase()));

            this.allWords = [
                ...dictEntries.map(e => ({ pidgin: e.pidgin, english: e.english, type: 'word' })),
                ...phraseEntries.map(e => ({ pidgin: e.pidgin, english: e.english, type: 'phrase' }))
            ];

            console.log(`Loaded ${this.allWords.length} audio-ready terms for Ear Trainer`);
            
            if (this.allWords.length < 10) {
                alert('Not enough audio assets loaded yet. Please try again later!');
            }
        } catch (error) {
            console.error('Failed to load game data:', error);
        }
    }

    setupEventListeners() {
        // Start buttons
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => this.startGame(btn.dataset.mode));
        });

        // Audio button
        this.elements.playBtn.addEventListener('click', () => this.playCurrentAudio());
        document.getElementById('replay-btn').addEventListener('click', () => this.playCurrentAudio());

        // Skip button
        this.elements.skipBtn.addEventListener('click', () => this.skipQuestion());

        // Leaderboard submission
        this.elements.submitScoreBtn.addEventListener('click', () => this.submitScore());

        // Navigation
        document.getElementById('exit-game').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('play-again-btn').addEventListener('click', () => this.showScreen('start'));
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        this.screens[screenName].classList.remove('hidden');
        
        if (screenName === 'start') {
            this.resetGame();
        }
    }

    resetGame() {
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.questionsAttempted = 0;
        this.isGameOver = false;
        if (this.timer) clearInterval(this.timer);
        this.elements.progressBar.style.width = '0%';
        this.elements.timerContainer.classList.add('hidden');
        this.elements.streakContainer.classList.add('hidden');
        this.elements.scoreSubmitContainer.classList.remove('hidden');
        this.elements.leaderboardContainer.classList.add('hidden');
    }

    startGame(mode) {
        this.gameMode = mode;
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.questionsAttempted = 0;
        this.totalQuestions = (mode === 'relaxed') ? 10 : 999;
        this.isGameOver = false;
        
        this.filteredWords = [...this.allWords];
        
        this.showScreen('game');
        
        if (mode === 'blitz') {
            this.startTimer(60);
        } else {
            this.elements.timerContainer.classList.add('hidden');
        }

        this.nextQuestion();
    }

    startTimer(seconds) {
        this.timeLeft = seconds;
        this.elements.timerContainer.classList.remove('hidden');
        this.elements.timer.textContent = this.timeLeft;
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.elements.timer.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    nextQuestion() {
        if (this.isGameOver) return;

        // Pick a random word from filtered pool
        const correctEntry = this.filteredWords[Math.floor(Math.random() * this.filteredWords.length)];
        
        // Pick 3 distractors
        const distractors = [];
        while (distractors.length < 3) {
            const random = this.allWords[Math.floor(Math.random() * this.allWords.length)];
            if (random.pidgin !== correctEntry.pidgin && !distractors.find(d => d.pidgin === random.pidgin)) {
                distractors.push(random);
            }
        }

        // Shuffle options
        const options = [correctEntry, ...distractors].sort(() => Math.random() - 0.5);
        
        this.currentRound = {
            correct: correctEntry,
            options: options
        };

        this.renderQuestion();
        
        // Auto-play audio
        setTimeout(() => this.playCurrentAudio(), 500);
    }

    renderQuestion() {
        this.elements.score.textContent = this.score;
        this.elements.streak.textContent = this.streak;
        
        if (this.streak > 1) {
            this.elements.streakContainer.classList.remove('hidden');
            this.elements.streakContainer.classList.remove('animate-bounce');
            void this.elements.streakContainer.offsetWidth; 
            this.elements.streakContainer.classList.add('animate-bounce');
        } else {
            this.elements.streakContainer.classList.add('hidden');
        }

        // Progress bar
        if (this.gameMode === 'relaxed') {
            const progress = (this.questionsAttempted / this.totalQuestions) * 100;
            this.elements.progressBar.style.width = `${progress}%`;
        } else {
            this.elements.progressBar.style.width = '100%';
        }

        // Render options
        this.elements.optionsGrid.innerHTML = this.currentRound.options.map((opt, i) => `
            <button class="option-btn w-full p-4 text-left border-2 border-gray-100 rounded-2xl font-semibold text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center gap-4" 
                    data-index="${i}">
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-400 group-hover:bg-indigo-200">${String.fromCharCode(65 + i)}</div>
                <div class="flex-1">${this.formatEnglish(opt.english)}</div>
            </button>
        `).join('');

        this.elements.optionsGrid.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleAnswer(parseInt(btn.dataset.index), btn));
        });

        this.elements.skipBtn.disabled = false;
        this.elements.skipBtn.classList.remove('opacity-50');
    }

    formatEnglish(english) {
        const text = Array.isArray(english) ? english[0] : english;
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    playCurrentAudio() {
        if (!window.elevenLabsSpeech || !this.currentRound) return;

        this.elements.playIcon.className = 'ti ti-player-pause';
        this.elements.audioRing.classList.remove('hidden');
        this.elements.playBtn.classList.add('playing');

        window.elevenLabsSpeech.speak(this.currentRound.correct.pidgin, {
            onEnd: () => {
                this.elements.playIcon.className = 'ti ti-player-play';
                this.elements.audioRing.classList.add('hidden');
                this.elements.playBtn.classList.remove('playing');
            }
        });
    }

    skipQuestion() {
        if (this.isGameOver || !this.currentRound) return;
        
        this.streak = 0;
        this.questionsAttempted++;
        
        this.elements.optionsGrid.querySelectorAll('.option-btn').forEach(b => {
            const opt = this.currentRound.options[parseInt(b.dataset.index)];
            if (opt.pidgin === this.currentRound.correct.pidgin) {
                b.classList.add('correct');
            }
            b.disabled = true;
        });

        this.elements.skipBtn.disabled = true;
        this.elements.skipBtn.classList.add('opacity-50');

        setTimeout(() => {
            if (this.gameMode === 'relaxed' && this.questionsAttempted >= this.totalQuestions) {
                this.endGame();
            } else {
                this.nextQuestion();
            }
        }, 1000);
    }

    handleAnswer(index, btn) {
        if (this.isGameOver) return;
        
        const selected = this.currentRound.options[index];
        const isCorrect = selected.pidgin === this.currentRound.correct.pidgin;
        
        this.questionsAttempted++;
        this.elements.optionsGrid.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        this.elements.skipBtn.disabled = true;

        if (isCorrect) {
            this.streak++;
            if (this.streak > this.maxStreak) this.maxStreak = this.streak;
            const points = 1 + Math.floor(this.streak / 5);
            this.score += points;
            btn.classList.add('correct');
        } else {
            this.streak = 0;
            btn.classList.add('wrong');
            this.elements.optionsGrid.querySelectorAll('.option-btn').forEach(b => {
                const opt = this.currentRound.options[parseInt(b.dataset.index)];
                if (opt.pidgin === this.currentRound.correct.pidgin) {
                    b.classList.add('correct');
                }
            });

            if (this.gameMode === 'marathon') {
                setTimeout(() => this.endGame(), 1500);
                return;
            }
        }

        if (this.gameMode === 'relaxed' && this.questionsAttempted >= this.totalQuestions) {
            setTimeout(() => this.endGame(), 1500);
        } else {
            setTimeout(() => this.nextQuestion(), 1500);
        }
    }

    async submitScore() {
        const username = this.elements.playerNameInput.value.trim() || 'Anonymous';
        this.elements.submitScoreBtn.disabled = true;
        this.elements.submitScoreBtn.innerHTML = '<i class="ti ti-loader animate-spin"></i> Saving...';

        try {
            const response = await fetch('/api/games/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    score: this.score,
                    game_type: 'ear-trainer',
                    streak: this.maxStreak
                })
            });

            if (response.ok) {
                localStorage.setItem('pidgin_player_name', username);
                this.elements.scoreSubmitContainer.classList.add('hidden');
                await this.loadLeaderboard();
            } else {
                alert('Failed to save score. Try again!');
                this.elements.submitScoreBtn.disabled = false;
                this.elements.submitScoreBtn.textContent = 'Save';
            }
        } catch (err) {
            console.error('Score submission error:', err);
            this.elements.submitScoreBtn.disabled = false;
            this.elements.submitScoreBtn.textContent = 'Save';
        }
    }

    async loadLeaderboard() {
        this.elements.leaderboardContainer.classList.remove('hidden');
        this.elements.leaderboardBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-400">Loading rankings...</td></tr>';

        try {
            const response = await fetch('/api/games/leaderboard?game_type=ear-trainer&limit=10');
            const data = await response.json();

            if (data.scores && data.scores.length > 0) {
                this.elements.leaderboardBody.innerHTML = data.scores.map((s, i) => `
                    <tr class="${s.username === this.elements.playerNameInput.value ? 'bg-blue-50 font-bold' : ''}">
                        <td class="px-4 py-3">${i + 1}</td>
                        <td class="px-4 py-3">${this.escapeHtml(s.username)}</td>
                        <td class="px-4 py-3 text-right">${s.score}</td>
                    </tr>
                `).join('');

            } else {
                this.elements.leaderboardBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-400">No scores yet. Be da first!</td></tr>';
            }
        } catch (err) {
            console.error('Leaderboard load error:', err);
            this.elements.leaderboardBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-red-400">Failed to load.</td></tr>';
        }
    }

    endGame() {
        this.isGameOver = true;
        if (this.timer) clearInterval(this.timer);
        
        this.showScreen('results');
        this.loadLeaderboard(); // Show it even if they don't submit
        
        const accuracy = Math.round((this.score / Math.max(1, this.questionsAttempted)) * 100);
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('accuracy-rate').textContent = `${accuracy}%`;
        
        const title = document.getElementById('result-title');
        const text = document.getElementById('result-text');
        const emoji = document.getElementById('result-emoji');
        
        if (accuracy >= 90) {
            title.textContent = "Certified Local! 🌺";
            text.textContent = `Your ears stay sharp, brah. Max streak: ${this.maxStreak}!`;
            emoji.textContent = "🤙";
        } else if (accuracy >= 70) {
            title.textContent = "Good Job, Brah! 👍";
            text.textContent = `You getting da hang of it. Best streak: ${this.maxStreak}.`;
            emoji.textContent = "🌴";
        } else {
            title.textContent = "Try Again! 🌊";
            text.textContent = "No worry, beef stew. Practice make perfect.";
            emoji.textContent = "🛶";
        }
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

window.addEventListener('load', () => {
    if (window.elevenLabsSpeech) {
        const checkReady = setInterval(() => {
            if (window.elevenLabsSpeech.pregeneratedIndex.size > 0) {
                clearInterval(checkReady);
                window.earTrainer = new PidginEarTrainer();
            }
        }, 500);
    }
});
