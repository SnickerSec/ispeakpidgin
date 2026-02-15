// Practice Data Management and Local Storage
class PracticeData {
    constructor() {
        this.storageKey = 'chokepidgin_practice_data';
        this.data = this.loadData();
    }

    // Load practice data from localStorage
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure data structure exists
                return {
                    words: parsed.words || {},
                    sessions: parsed.sessions || [],
                    achievements: parsed.achievements || [],
                    settings: parsed.settings || this.getDefaultSettings(),
                    stats: parsed.stats || this.getDefaultStats(),
                    version: parsed.version || '1.0'
                };
            }
        } catch (error) {
            console.error('Error loading practice data:', error);
        }

        // Return default structure
        return {
            words: {},
            sessions: [],
            achievements: [],
            settings: this.getDefaultSettings(),
            stats: this.getDefaultStats(),
            version: '1.0'
        };
    }

    // Get default settings
    getDefaultSettings() {
        return {
            sessionLength: 10, // number of words per session
            autoAdvance: false, // auto advance after correct answer
            showExamples: true, // show example sentences
            audioAutoplay: false, // automatically play audio
            practiceReminders: true, // daily practice reminders
            difficultyMode: 'adaptive', // adaptive, easy, medium, hard
            preferredModes: ['flashcard', 'quiz'], // preferred practice modes
            theme: 'light' // light, dark
        };
    }

    // Get default stats
    getDefaultStats() {
        return {
            totalWordsLearned: 0,
            totalSessions: 0,
            totalTimeSpent: 0, // in seconds
            longestStreak: 0,
            currentStreak: 0,
            lastPracticeDate: null,
            averageAccuracy: 0,
            categoriesCompleted: [],
            achievements: []
        };
    }

    // Save data to localStorage
    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving practice data:', error);
        }
    }

    // Record practice attempt for a word
    recordPractice(wordId, correct, difficulty = 'medium') {
        if (!this.data.words[wordId]) {
            this.data.words[wordId] = {
                firstPracticed: new Date().toISOString(),
                lastPracticed: null,
                timesCorrect: 0,
                timesIncorrect: 0,
                difficulty: 3, // 1-5 scale
                nextReview: null,
                masteryLevel: 0, // 0-5 scale
                streakCount: 0,
                averageTime: 0,
                practiceHistory: []
            };
        }

        const wordData = this.data.words[wordId];
        const now = new Date().toISOString();

        // Update practice stats
        wordData.lastPracticed = now;
        if (correct) {
            wordData.timesCorrect++;
            wordData.streakCount++;
            // Decrease difficulty if getting easier
            if (wordData.streakCount >= 3 && wordData.difficulty > 1) {
                wordData.difficulty = Math.max(1, wordData.difficulty - 0.5);
            }
        } else {
            wordData.timesIncorrect++;
            wordData.streakCount = 0;
            // Increase difficulty if struggling
            wordData.difficulty = Math.min(5, wordData.difficulty + 0.5);
        }

        // Calculate mastery level (0-5)
        const totalAttempts = wordData.timesCorrect + wordData.timesIncorrect;
        const accuracy = totalAttempts > 0 ? wordData.timesCorrect / totalAttempts : 0;

        if (accuracy >= 0.9 && wordData.timesCorrect >= 3) {
            wordData.masteryLevel = 5; // Mastered
        } else if (accuracy >= 0.8 && wordData.timesCorrect >= 2) {
            wordData.masteryLevel = 4; // Strong
        } else if (accuracy >= 0.7) {
            wordData.masteryLevel = 3; // Good
        } else if (accuracy >= 0.5) {
            wordData.masteryLevel = 2; // Learning
        } else if (totalAttempts > 0) {
            wordData.masteryLevel = 1; // Struggling
        } else {
            wordData.masteryLevel = 0; // New
        }

        // Calculate next review date (spaced repetition)
        wordData.nextReview = this.calculateNextReview(wordData.difficulty, correct);

        // Add to practice history
        wordData.practiceHistory.push({
            date: now,
            correct: correct,
            difficulty: difficulty,
            timeTaken: null // TODO: implement timing
        });

        // Keep only last 50 practice attempts
        if (wordData.practiceHistory.length > 50) {
            wordData.practiceHistory = wordData.practiceHistory.slice(-50);
        }

        this.saveData();
    }

    // Calculate next review date using simplified spaced repetition
    calculateNextReview(difficulty, correct) {
        const now = new Date();
        let daysToAdd;

        if (correct) {
            // Success: longer intervals based on difficulty (easier = longer gap)
            switch(Math.floor(difficulty)) {
                case 1: daysToAdd = 7; break;   // Easy: 1 week
                case 2: daysToAdd = 5; break;   // Medium-easy: 5 days
                case 3: daysToAdd = 3; break;   // Medium: 3 days
                case 4: daysToAdd = 2; break;   // Medium-hard: 2 days
                case 5: daysToAdd = 1; break;   // Hard: 1 day
                default: daysToAdd = 3; break;
            }
        } else {
            // Failure: review sooner
            daysToAdd = 0.5; // 12 hours
        }

        const nextReview = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        return nextReview.toISOString();
    }

    // Get word difficulty (1-5 scale)
    getWordDifficulty(wordId) {
        return this.data.words[wordId]?.difficulty || 3;
    }

    // Get word mastery level (0-5 scale)
    getWordMastery(wordId) {
        return this.data.words[wordId]?.masteryLevel || 0;
    }

    // Get words that need review
    getWordsForReview(limit = 10) {
        const now = new Date();
        const reviewWords = [];

        for (const [wordId, wordData] of Object.entries(this.data.words)) {
            if (wordData.nextReview && new Date(wordData.nextReview) <= now) {
                reviewWords.push({
                    id: wordId,
                    ...wordData,
                    priority: this.calculateReviewPriority(wordData)
                });
            }
        }

        // Sort by priority (higher = more urgent)
        reviewWords.sort((a, b) => b.priority - a.priority);

        return reviewWords.slice(0, limit).map(word => word.id);
    }

    // Calculate review priority for spaced repetition
    calculateReviewPriority(wordData) {
        const now = new Date();
        const nextReview = new Date(wordData.nextReview);
        const overdueDays = (now - nextReview) / (24 * 60 * 60 * 1000);

        // Higher priority for:
        // - Overdue words
        // - Words with low mastery
        // - Words frequently incorrect
        let priority = 0;

        // Overdue bonus
        if (overdueDays > 0) {
            priority += overdueDays * 10;
        }

        // Mastery penalty (lower mastery = higher priority)
        priority += (5 - wordData.masteryLevel) * 5;

        // Difficulty bonus (harder words = higher priority)
        priority += wordData.difficulty * 2;

        // Recent failures bonus
        const recentFailures = wordData.practiceHistory
            .slice(-5)
            .filter(h => !h.correct).length;
        priority += recentFailures * 3;

        return Math.max(0, priority);
    }

    // Record a completed practice session
    recordSession(sessionData) {
        this.data.sessions.push({
            ...sessionData,
            id: Date.now(),
            timestamp: new Date().toISOString()
        });

        // Update global stats
        this.updateGlobalStats(sessionData);

        // Check for achievements
        this.checkAchievements();

        this.saveData();
    }

    // Update global statistics
    updateGlobalStats(sessionData) {
        const stats = this.data.stats;

        stats.totalSessions++;
        stats.totalTimeSpent += sessionData.duration || 0;

        // Update streak
        const today = new Date().toDateString();
        const lastPractice = stats.lastPracticeDate ? new Date(stats.lastPracticeDate).toDateString() : null;

        if (lastPractice === today) {
            // Already practiced today, don't change streak
        } else if (lastPractice === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()) {
            // Practiced yesterday, continue streak
            stats.currentStreak++;
            stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
        } else {
            // Missed a day, reset streak
            stats.currentStreak = 1;
        }

        stats.lastPracticeDate = new Date().toISOString();

        // Update average accuracy
        const accuracies = this.data.sessions
            .filter(s => s.accuracy !== undefined)
            .map(s => s.accuracy);

        if (accuracies.length > 0) {
            stats.averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
        }

        // Count mastered words
        stats.totalWordsLearned = Object.values(this.data.words)
            .filter(word => word.masteryLevel >= 4).length;
    }

    // Check and award achievements
    checkAchievements() {
        const stats = this.data.stats;
        const newAchievements = [];

        const achievements = [
            {
                id: 'first_session',
                name: 'Getting Started',
                description: 'Complete your first practice session',
                icon: '<i class="ti ti-plant"></i>',
                condition: () => stats.totalSessions >= 1
            },
            {
                id: 'streak_3',
                name: 'Building Habits',
                description: 'Practice for 3 days in a row',
                icon: '<i class="ti ti-flame"></i>',
                condition: () => stats.currentStreak >= 3
            },
            {
                id: 'streak_7',
                name: 'Week Warrior',
                description: 'Practice for 7 days in a row',
                icon: '<i class="ti ti-bolt"></i>',
                condition: () => stats.currentStreak >= 7
            },
            {
                id: 'words_10',
                name: 'Vocabulary Builder',
                description: 'Master 10 words',
                icon: '<i class="ti ti-books"></i>',
                condition: () => stats.totalWordsLearned >= 10
            },
            {
                id: 'words_50',
                name: 'Word Wizard',
                description: 'Master 50 words',
                icon: '🧙‍♂️',
                condition: () => stats.totalWordsLearned >= 50
            },
            {
                id: 'accuracy_90',
                name: 'Precision Master',
                description: 'Maintain 90% average accuracy',
                icon: '<i class="ti ti-target"></i>',
                condition: () => stats.averageAccuracy >= 90
            },
            {
                id: 'sessions_100',
                name: 'Dedicated Learner',
                description: 'Complete 100 practice sessions',
                icon: '<i class="ti ti-trophy"></i>',
                condition: () => stats.totalSessions >= 100
            }
        ];

        achievements.forEach(achievement => {
            const alreadyEarned = stats.achievements.includes(achievement.id);
            if (!alreadyEarned && achievement.condition()) {
                stats.achievements.push(achievement.id);
                newAchievements.push(achievement);
            }
        });

        // Show achievement notifications
        newAchievements.forEach(achievement => {
            this.showAchievementNotification(achievement);
        });
    }

    // Show achievement notification
    showAchievementNotification(achievement) {
        // Create achievement toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-yellow-400 text-black p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-2xl">${achievement.icon}</div>
                <div>
                    <div class="font-bold">Achievement Unlocked!</div>
                    <div class="text-sm">${achievement.name}</div>
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Animate out after 4 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Get practice statistics for display
    getStatistics() {
        return {
            ...this.data.stats,
            totalWords: Object.keys(this.data.words).length,
            masteredWords: Object.values(this.data.words).filter(w => w.masteryLevel >= 4).length,
            strugglingWords: Object.values(this.data.words).filter(w => w.masteryLevel <= 2 && w.timesIncorrect > 0).length,
            recentSessions: this.data.sessions.slice(-10)
        };
    }

    // Export practice data for backup
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    // Import practice data from backup
    importData(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            // Validate structure
            if (imported.words && imported.sessions && imported.stats) {
                this.data = {
                    ...this.getDefaultSettings(),
                    ...imported
                };
                this.saveData();
                return true;
            }
        } catch (error) {
            console.error('Error importing practice data:', error);
        }
        return false;
    }

    // Clear all practice data
    clearData() {
        this.data = {
            words: {},
            sessions: [],
            achievements: [],
            settings: this.getDefaultSettings(),
            stats: this.getDefaultStats(),
            version: '1.0'
        };
        this.saveData();
    }
}

// Initialize global practice data manager
window.PracticeData = PracticeData;