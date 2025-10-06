// Learning Hub Component
class LearningHub {
    constructor() {
        this.progress = this.loadProgress();
        this.lessons = this.initializeLessons();
        this.currentLevel = 'beginner';
        this.init();
    }

    initializeLessons() {
        // Use lessons data from lessons.js if available
        if (typeof lessonsData !== 'undefined') {
            // Map lessonsData structure to match LearningHub format
            const mapLesson = (lesson, index, level) => {
                const idPrefix = level === 'beginner' ? 'b' : level === 'intermediate' ? 'i' : 'a';
                return {
                    id: lesson.id || `${idPrefix}${index + 1}`,
                    title: lesson.title,
                    description: lesson.content?.culturalNote || 'Learn essential Pidgin vocabulary and expressions',
                    duration: '10-15 min',
                    points: 10 + (index * 2),
                    content: lesson.content ? {
                        vocabulary: lesson.content.vocabulary?.map(v => ({
                            pidgin: v.pidgin,
                            english: v.english,
                            pronunciation: v.pidgin.toUpperCase()
                        })) || [],
                        examples: lesson.content.vocabulary?.map(v => v.example).filter(e => e) || [],
                        culturalNote: lesson.content.culturalNote,
                        practice: lesson.content.practice
                    } : null
                };
            };

            return {
                beginner: lessonsData.beginner.map((lesson, i) => mapLesson(lesson, i, 'beginner')),
                intermediate: lessonsData.intermediate.map((lesson, i) => mapLesson(lesson, i, 'intermediate')),
                advanced: lessonsData.advanced.map((lesson, i) => mapLesson(lesson, i, 'advanced'))
            };
        }

        // Fallback to original hardcoded data if lessonsData is not available
        return {
            beginner: [
                {
                    id: 'b1',
                    title: 'Basic Greetings',
                    description: 'Learn how to say hello, goodbye, and basic pleasantries',
                    duration: '10 min',
                    points: 10,
                    content: {
                        vocabulary: [
                            { pidgin: 'Howzit', english: 'Hello/How are you', pronunciation: 'HOW-zit' },
                            { pidgin: 'Aloha', english: 'Hello/Goodbye/Love', pronunciation: 'ah-LOH-hah' }
                        ],
                        examples: ['Howzit braddah! - Hey brother, how are you!']
                    }
                }
            ],
            intermediate: [],
            advanced: []
        };
    }

    init() {
        this.setupEventListeners();
        this.loadLessons();
        this.updateProgress();
        this.loadDailyChallenge();
        this.updateAchievements();
    }

    setupEventListeners() {
        // Level tab switching
        document.querySelectorAll('.level-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const level = e.currentTarget.dataset.level;
                this.switchLevel(level);
            });
        });

        // Start practice button
        const startPracticeBtn = document.getElementById('startPractice');
        if (startPracticeBtn) {
            startPracticeBtn.addEventListener('click', () => this.startPracticeSession());
        }
    }

    switchLevel(level) {
        this.currentLevel = level;

        // Update tabs
        document.querySelectorAll('.level-tab').forEach(tab => {
            tab.classList.remove('active-tab', 'border-green-500', 'border-yellow-500', 'border-purple-500', 'text-green-600', 'text-yellow-600', 'text-purple-600');
            tab.classList.add('border-transparent', 'text-gray-600');
        });

        const activeTab = document.querySelector(`[data-level="${level}"]`);
        activeTab.classList.remove('border-transparent', 'text-gray-600');

        const colors = {
            beginner: ['border-green-500', 'text-green-600'],
            intermediate: ['border-yellow-500', 'text-yellow-600'],
            advanced: ['border-purple-500', 'text-purple-600']
        };

        activeTab.classList.add('active-tab', ...colors[level]);

        // Update content
        document.querySelectorAll('.level-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${level}-content`).classList.remove('hidden');
    }

    loadLessons() {
        ['beginner', 'intermediate', 'advanced'].forEach(level => {
            const container = document.getElementById(`${level}Lessons`);
            if (!container) return;

            container.innerHTML = '';
            const lessons = this.lessons[level];

            lessons.forEach((lesson, index) => {
                const isCompleted = this.isLessonCompleted(lesson.id);
                const isLocked = this.isLessonLocked(level, index);

                const lessonCard = document.createElement('div');
                lessonCard.className = `lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;

                lessonCard.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex-1">
                            <h4 class="font-semibold text-lg mb-1">${lesson.title}</h4>
                            <p class="text-gray-600 text-sm">${lesson.description}</p>
                        </div>
                        <div class="ml-4 text-right">
                            ${isCompleted ?
                                '<span class="text-green-500 text-2xl">✓</span>' :
                                isLocked ?
                                '<span class="text-gray-400 text-2xl">🔒</span>' :
                                '<span class="text-gray-400 text-2xl">○</span>'
                            }
                        </div>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500">⏱ ${lesson.duration}</span>
                        <span class="text-gray-500">+${lesson.points} points</span>
                    </div>
                `;

                if (!isLocked) {
                    lessonCard.addEventListener('click', () => this.startLesson(lesson, level));
                }

                container.appendChild(lessonCard);
            });
        });
    }

    startLesson(lesson, level) {
        // Create modal for lesson
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

        const content = lesson.content || { vocabulary: [], examples: [] };

        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">${lesson.title}</h2>
                        <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                    </div>

                    ${content.vocabulary && content.vocabulary.length > 0 ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold mb-3">Vocabulary</h3>
                            <div class="space-y-2">
                                ${content.vocabulary.map(item => `
                                    <div class="bg-gray-50 rounded-lg p-3">
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <span class="font-bold text-purple-600">${item.pidgin}</span>
                                                <span class="mx-2">→</span>
                                                <span>${item.english}</span>
                                            </div>
                                            <span class="text-sm text-gray-500">[${item.pronunciation}]</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${content.examples && content.examples.length > 0 ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold mb-3">Examples</h3>
                            <div class="space-y-2">
                                ${content.examples.map(ex => `
                                    <div class="bg-blue-50 rounded-lg p-3">
                                        <p class="italic">${ex}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${content.culturalNote ? `
                        <div class="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                            <h3 class="text-sm font-semibold text-yellow-800 mb-1">🌺 Cultural Note</h3>
                            <p class="text-sm text-yellow-700">${content.culturalNote}</p>
                        </div>
                    ` : ''}

                    ${content.practice ? `
                        <div class="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                            <h3 class="text-sm font-semibold text-green-800 mb-1">✨ Practice Tip</h3>
                            <p class="text-sm text-green-700">${content.practice}</p>
                        </div>
                    ` : ''}

                    <div class="flex justify-end gap-3">
                        <button class="close-modal px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Close</button>
                        <button class="complete-lesson px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            ${this.isLessonCompleted(lesson.id) ? 'Review Complete' : 'Complete Lesson'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal handlers
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });

        // Complete lesson handler
        modal.querySelector('.complete-lesson').addEventListener('click', () => {
            this.completeLesson(lesson.id, level);
            document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    completeLesson(lessonId, level) {
        if (!this.progress.completedLessons.includes(lessonId)) {
            this.progress.completedLessons.push(lessonId);

            // Find lesson to get points
            const lesson = this.lessons[level].find(l => l.id === lessonId);
            if (lesson) {
                this.progress.totalPoints += lesson.points;
            }

            // Update streak
            const today = new Date().toDateString();
            if (this.progress.lastActivity !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (this.progress.lastActivity === yesterday.toDateString()) {
                    this.progress.streak++;
                } else {
                    this.progress.streak = 1;
                }
            }
            this.progress.lastActivity = today;

            this.saveProgress();
            this.loadLessons();
            this.updateProgress();
            this.updateAchievements();

            // Show success message
            this.showNotification('Lesson completed! +' + (lesson ? lesson.points : 10) + ' points');
        }
    }

    isLessonCompleted(lessonId) {
        return this.progress.completedLessons.includes(lessonId);
    }

    isLessonLocked(level, index) {
        // All lessons are unlocked - users can choose what they want to learn
        return false;
    }

    updateProgress() {
        const totalLessons = Object.values(this.lessons).flat().length;
        const completedCount = this.progress.completedLessons.length;
        const overallPercentage = Math.round((completedCount / totalLessons) * 100);

        // Update overall progress
        document.getElementById('overallProgress').textContent = `${overallPercentage}%`;
        document.getElementById('lessonsCompleted').textContent = `${completedCount}/${totalLessons}`;

        // Update user level
        let userLevel = 'Beginner';
        if (completedCount >= 20) userLevel = 'Advanced';
        else if (completedCount >= 10) userLevel = 'Intermediate';
        document.getElementById('userLevel').textContent = userLevel;

        // Update progress bars for each level
        ['beginner', 'intermediate', 'advanced'].forEach(level => {
            const levelLessons = this.lessons[level];
            const completed = levelLessons.filter(l => this.isLessonCompleted(l.id)).length;
            const percentage = Math.round((completed / levelLessons.length) * 100);

            const progressBar = document.getElementById(`${level}Progress`);
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
        });
    }

    loadDailyChallenge() {
        const challenges = [
            'Translate "How are you doing today?" to Pidgin',
            'Use "da kine" correctly in a sentence',
            'Practice greetings with 5 different expressions',
            'Learn 3 new food-related Pidgin words',
            'Master the pronunciation of "Mahalo nui loa"'
        ];

        const today = new Date().getDate();
        const challenge = challenges[today % challenges.length];

        const challengeElement = document.getElementById('dailyChallenge');
        if (challengeElement) {
            challengeElement.textContent = challenge;
        }
    }

    startPracticeSession() {
        // Show level selection modal first
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-md w-full p-6">
                <h3 class="text-2xl font-bold mb-4">Choose Practice Level</h3>
                <p class="text-gray-600 mb-6">Select a difficulty level for your 5-question practice session</p>

                <div class="space-y-3">
                    <button class="level-btn w-full p-4 bg-green-100 hover:bg-green-200 rounded-lg text-left transition" data-level="beginner">
                        <div class="font-bold text-green-700">🌱 Beginner</div>
                        <div class="text-sm text-green-600">Basic greetings, food, and everyday phrases</div>
                    </button>
                    <button class="level-btn w-full p-4 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-left transition" data-level="intermediate">
                        <div class="font-bold text-yellow-700">⭐ Intermediate</div>
                        <div class="text-sm text-yellow-600">Complex sentences and local slang</div>
                    </button>
                    <button class="level-btn w-full p-4 bg-purple-100 hover:bg-purple-200 rounded-lg text-left transition" data-level="advanced">
                        <div class="font-bold text-purple-700">🏆 Advanced</div>
                        <div class="text-sm text-purple-600">Cultural nuances and grammar patterns</div>
                    </button>
                </div>

                <button class="close-practice w-full mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle level selection
        modal.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.currentTarget.dataset.level;
                document.body.removeChild(modal);
                this.startQuiz(level);
            });
        });

        // Close button
        modal.querySelector('.close-practice').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    startQuiz(level) {
        // Get vocabulary from selected level
        const levelVocab = [];
        this.lessons[level].forEach(lesson => {
            if (lesson.content && lesson.content.vocabulary) {
                levelVocab.push(...lesson.content.vocabulary.map(v => ({
                    ...v,
                    level: level
                })));
            }
        });

        if (levelVocab.length < 5) {
            this.showNotification('Not enough vocabulary for this level. Try another level!');
            return;
        }

        // Select 5 random questions
        const questions = [];
        const usedIndices = new Set();
        while (questions.length < 5) {
            const randomIndex = Math.floor(Math.random() * levelVocab.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                questions.push(levelVocab[randomIndex]);
            }
        }

        this.showQuizModal(questions, level);
    }

    showQuizModal(questions, level) {
        let currentQuestion = 0;
        let score = 0;
        let modal;

        const showQuestion = () => {
            if (currentQuestion >= questions.length) {
                this.showQuizResults(score, questions.length, level, modal);
                return;
            }

            const word = questions[currentQuestion];
            const allVocab = Object.values(this.lessons).flat()
                .filter(l => l.content && l.content.vocabulary)
                .flatMap(l => l.content.vocabulary);

            // Generate wrong answers
            const wrongAnswers = [];
            while (wrongAnswers.length < 3) {
                const randomVocab = allVocab[Math.floor(Math.random() * allVocab.length)];
                if (randomVocab.english !== word.english && !wrongAnswers.includes(randomVocab.english)) {
                    wrongAnswers.push(randomVocab.english);
                }
            }

            // Combine and shuffle answers
            const answers = [word.english, ...wrongAnswers].sort(() => Math.random() - 0.5);

            if (modal) {
                document.body.removeChild(modal);
            }

            modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

            const levelColors = {
                beginner: 'green',
                intermediate: 'yellow',
                advanced: 'purple'
            };
            const color = levelColors[level];

            modal.innerHTML = `
                <div class="bg-white rounded-lg max-w-md w-full p-6">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm font-semibold text-${color}-600 uppercase">${level}</span>
                        <span class="text-sm text-gray-500">Question ${currentQuestion + 1}/5</span>
                    </div>

                    <div class="mb-2">
                        <div class="flex gap-1 mb-4">
                            ${questions.map((_, i) => `
                                <div class="flex-1 h-2 rounded ${i < currentQuestion ? 'bg-green-500' : i === currentQuestion ? 'bg-' + color + '-500' : 'bg-gray-200'}"></div>
                            `).join('')}
                        </div>
                    </div>

                    <h3 class="text-xl font-bold mb-2">What does this mean?</h3>
                    <p class="text-3xl font-bold text-${color}-600 mb-6 text-center py-4">${word.pidgin}</p>

                    <div class="space-y-2 mb-4">
                        ${answers.map(answer => `
                            <button class="quiz-option w-full text-left px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-${color}-500 hover:bg-${color}-50 transition" data-answer="${answer}" data-correct="${word.english}">
                                ${answer}
                            </button>
                        `).join('')}
                    </div>

                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">Score: ${score}/${currentQuestion}</span>
                        <button class="close-quiz px-4 py-2 text-gray-500 hover:text-gray-700">Exit Quiz</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Handle answer selection
            modal.querySelectorAll('.quiz-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const selected = e.target.dataset.answer;
                    const correct = e.target.dataset.correct;
                    const isCorrect = selected === correct;

                    if (isCorrect) {
                        score++;
                        e.target.classList.add('bg-green-500', 'text-white', 'border-green-500');
                    } else {
                        e.target.classList.add('bg-red-500', 'text-white', 'border-red-500');
                        // Show correct answer
                        modal.querySelectorAll('.quiz-option').forEach(b => {
                            if (b.dataset.answer === correct) {
                                b.classList.add('bg-green-500', 'text-white', 'border-green-500');
                            }
                        });
                    }

                    // Disable all buttons
                    modal.querySelectorAll('.quiz-option').forEach(b => {
                        b.disabled = true;
                        b.classList.add('cursor-not-allowed');
                    });

                    // Next question after delay
                    setTimeout(() => {
                        currentQuestion++;
                        showQuestion();
                    }, 1500);
                });
            });

            // Close button
            modal.querySelector('.close-quiz').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        };

        showQuestion();
    }

    showQuizResults(score, total, level, quizModal) {
        if (quizModal) {
            document.body.removeChild(quizModal);
        }

        const percentage = Math.round((score / total) * 100);
        let message = '';
        let emoji = '';

        if (percentage >= 80) {
            message = 'Excellent work!';
            emoji = '🎉';
        } else if (percentage >= 60) {
            message = 'Good job!';
            emoji = '👍';
        } else {
            message = 'Keep practicing!';
            emoji = '💪';
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-md w-full p-8 text-center">
                <div class="text-6xl mb-4">${emoji}</div>
                <h3 class="text-2xl font-bold mb-2">${message}</h3>
                <p class="text-4xl font-bold text-purple-600 mb-4">${score}/${total}</p>
                <p class="text-gray-600 mb-6">${percentage}% correct</p>

                <div class="space-y-2">
                    <button class="retry-quiz w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
                        Practice Again
                    </button>
                    <button class="close-results w-full px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.retry-quiz').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.startPracticeSession();
        });

        modal.querySelector('.close-results').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    updateAchievements() {
        const achievements = document.getElementById('achievements');
        if (!achievements) return;

        const completedCount = this.progress.completedLessons.length;

        // Update achievement states
        const achievementStates = [
            { threshold: 1, element: 0 },    // First Steps
            { threshold: 10, element: 1 },   // Local Speaker
            { threshold: 30, element: 2 },   // Da Kine Master
            { threshold: -1, element: 3 }    // Pidgin Pro (special condition)
        ];

        achievementStates.forEach(({ threshold, element }) => {
            if (threshold > 0 && completedCount >= threshold) {
                achievements.children[element].classList.remove('opacity-50');
                achievements.children[element].classList.add('achievement-badge', 'earned');
            }
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('animate-fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    loadProgress() {
        const saved = localStorage.getItem('learningHubProgress');
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            completedLessons: [],
            totalPoints: 0,
            streak: 0,
            lastActivity: null,
            achievements: []
        };
    }

    saveProgress() {
        localStorage.setItem('learningHubProgress', JSON.stringify(this.progress));
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new LearningHub();
    });
} else {
    new LearningHub();
}

// Add animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-up {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    @keyframes fade-out {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    .animate-slide-up {
        animation: slide-up 0.3s ease-out;
    }

    .animate-fade-out {
        animation: fade-out 0.3s ease-out;
    }
`;
document.head.appendChild(style);