// Learning Hub Component
class LearningHub {
    constructor() {
        this.progress = this.loadProgress();
        this.lessons = this.initializeLessons();
        this.currentLevel = 'beginner';
        this.init();
    }

    initializeLessons() {
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
                            { pidgin: 'Aloha', english: 'Hello/Goodbye/Love', pronunciation: 'ah-LOH-hah' },
                            { pidgin: 'A hui hou', english: 'See you later', pronunciation: 'ah HOO-ee ho' },
                            { pidgin: 'Mahalo', english: 'Thank you', pronunciation: 'mah-HAH-loh' },
                            { pidgin: 'No worries', english: "You're welcome", pronunciation: 'no WOR-eez' }
                        ],
                        examples: [
                            'Howzit braddah! - Hey brother, how are you!',
                            'Mahalo plenty - Thank you very much',
                            'A hui hou, yeah? - See you later, okay?'
                        ]
                    }
                },
                {
                    id: 'b2',
                    title: 'Common Expressions',
                    description: 'Essential everyday phrases you\'ll hear in Hawaii',
                    duration: '15 min',
                    points: 15,
                    content: {
                        vocabulary: [
                            { pidgin: 'Da kine', english: 'The thing/stuff', pronunciation: 'dah KYNE' },
                            { pidgin: 'Broke da mouth', english: 'Delicious', pronunciation: 'broke dah mowt' },
                            { pidgin: 'Pau hana', english: 'After work', pronunciation: 'pow HAH-nah' },
                            { pidgin: 'Grindz', english: 'Food', pronunciation: 'GRINDZ' },
                            { pidgin: 'Shoots', english: 'Okay/Sure', pronunciation: 'SHOOTS' }
                        ]
                    }
                },
                {
                    id: 'b3',
                    title: 'Basic Questions',
                    description: 'How to ask simple questions in Pidgin',
                    duration: '12 min',
                    points: 12,
                    content: {
                        vocabulary: [
                            { pidgin: 'Wea you stay?', english: 'Where are you?', pronunciation: 'WAY-ah you stay' },
                            { pidgin: 'You like?', english: 'Do you want?', pronunciation: 'you LIKE' },
                            { pidgin: 'How much?', english: 'What\'s the price?', pronunciation: 'how MUCH' },
                            { pidgin: 'Wat dat?', english: 'What is that?', pronunciation: 'wot DAT' }
                        ]
                    }
                },
                {
                    id: 'b4',
                    title: 'Numbers and Counting',
                    description: 'Learn to count and use numbers in Pidgin context',
                    duration: '10 min',
                    points: 10
                },
                {
                    id: 'b5',
                    title: 'Family Terms',
                    description: 'Words for family members and relationships',
                    duration: '12 min',
                    points: 12
                },
                {
                    id: 'b6',
                    title: 'Directions',
                    description: 'Navigate like a local with mauka and makai',
                    duration: '15 min',
                    points: 15
                },
                {
                    id: 'b7',
                    title: 'Food and Dining',
                    description: 'Essential vocabulary for eating out',
                    duration: '15 min',
                    points: 15
                },
                {
                    id: 'b8',
                    title: 'Time Expressions',
                    description: 'Talk about time the local way',
                    duration: '10 min',
                    points: 10
                },
                {
                    id: 'b9',
                    title: 'Basic Emotions',
                    description: 'Express feelings in Pidgin',
                    duration: '12 min',
                    points: 12
                },
                {
                    id: 'b10',
                    title: 'Weather Talk',
                    description: 'Discuss the weather island style',
                    duration: '10 min',
                    points: 10
                }
            ],
            intermediate: [
                {
                    id: 'i1',
                    title: 'Complex Sentences',
                    description: 'Build longer, more natural sentences',
                    duration: '20 min',
                    points: 20,
                    content: {
                        vocabulary: [
                            { pidgin: 'No can', english: 'Cannot/Unable to', pronunciation: 'no CAN' },
                            { pidgin: 'Bumbye', english: 'Later/Eventually', pronunciation: 'BUM-bye' },
                            { pidgin: 'Fo real', english: 'Really/Seriously', pronunciation: 'foh REEL' },
                            { pidgin: 'Planny', english: 'Plenty/A lot', pronunciation: 'PLAN-ee' }
                        ]
                    }
                },
                {
                    id: 'i2',
                    title: 'Local Slang',
                    description: 'Contemporary slang and youth expressions',
                    duration: '18 min',
                    points: 18
                },
                {
                    id: 'i3',
                    title: 'Storytelling Basics',
                    description: 'Learn to tell stories Pidgin style',
                    duration: '25 min',
                    points: 25
                },
                {
                    id: 'i4',
                    title: 'Workplace Pidgin',
                    description: 'Professional contexts and office talk',
                    duration: '20 min',
                    points: 20
                },
                {
                    id: 'i5',
                    title: 'Sports and Activities',
                    description: 'Talk about surfing, hiking, and island sports',
                    duration: '18 min',
                    points: 18
                },
                {
                    id: 'i6',
                    title: 'Island Geography',
                    description: 'Place names and locations',
                    duration: '15 min',
                    points: 15
                },
                {
                    id: 'i7',
                    title: 'Cultural Events',
                    description: 'Vocabulary for luaus, festivals, and gatherings',
                    duration: '22 min',
                    points: 22
                },
                {
                    id: 'i8',
                    title: 'Humor and Jokes',
                    description: 'Understanding local humor',
                    duration: '20 min',
                    points: 20
                },
                {
                    id: 'i9',
                    title: 'Arguments and Debates',
                    description: 'Express disagreement respectfully',
                    duration: '18 min',
                    points: 18
                },
                {
                    id: 'i10',
                    title: 'Music and Entertainment',
                    description: 'Talk about local music and shows',
                    duration: '15 min',
                    points: 15
                }
            ],
            advanced: [
                {
                    id: 'a1',
                    title: 'Cultural Nuances',
                    description: 'Deep dive into cultural context and respect',
                    duration: '30 min',
                    points: 30,
                    content: {
                        vocabulary: [
                            { pidgin: 'Kapu', english: 'Forbidden/Sacred', pronunciation: 'KAH-poo' },
                            { pidgin: 'Kokua', english: 'Help/Cooperation', pronunciation: 'koh-KOO-ah' },
                            { pidgin: 'Pono', english: 'Righteousness/Balance', pronunciation: 'POH-noh' },
                            { pidgin: 'Ohana', english: 'Family', pronunciation: 'oh-HAH-nah' }
                        ]
                    }
                },
                {
                    id: 'a2',
                    title: 'Historical Context',
                    description: 'Evolution of Hawaiian Pidgin',
                    duration: '35 min',
                    points: 35
                },
                {
                    id: 'a3',
                    title: 'Code Switching',
                    description: 'When to use Pidgin vs Standard English',
                    duration: '28 min',
                    points: 28
                },
                {
                    id: 'a4',
                    title: 'Regional Variations',
                    description: 'Differences between islands',
                    duration: '25 min',
                    points: 25
                },
                {
                    id: 'a5',
                    title: 'Literary Pidgin',
                    description: 'Reading and writing in Pidgin',
                    duration: '32 min',
                    points: 32
                },
                {
                    id: 'a6',
                    title: 'Media and Pop Culture',
                    description: 'Pidgin in movies, music, and social media',
                    duration: '28 min',
                    points: 28
                },
                {
                    id: 'a7',
                    title: 'Business Communication',
                    description: 'Professional use of Pidgin',
                    duration: '30 min',
                    points: 30
                },
                {
                    id: 'a8',
                    title: 'Teaching Pidgin',
                    description: 'How to help others learn',
                    duration: '35 min',
                    points: 35
                },
                {
                    id: 'a9',
                    title: 'Language Preservation',
                    description: 'The future of Hawaiian Pidgin',
                    duration: '30 min',
                    points: 30
                },
                {
                    id: 'a10',
                    title: 'Master Certification',
                    description: 'Final comprehensive assessment',
                    duration: '45 min',
                    points: 50
                }
            ]
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
        // First lesson of each level is always unlocked
        if (index === 0) return false;

        // Check if previous lesson is completed
        const previousLesson = this.lessons[level][index - 1];
        return !this.isLessonCompleted(previousLesson.id);
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
        // Get random vocabulary from completed lessons
        const completedVocab = [];
        this.progress.completedLessons.forEach(lessonId => {
            Object.values(this.lessons).forEach(levelLessons => {
                const lesson = levelLessons.find(l => l.id === lessonId);
                if (lesson && lesson.content && lesson.content.vocabulary) {
                    completedVocab.push(...lesson.content.vocabulary);
                }
            });
        });

        if (completedVocab.length === 0) {
            this.showNotification('Complete some lessons first to unlock practice sessions!');
            return;
        }

        // Create practice modal
        const randomWord = completedVocab[Math.floor(Math.random() * completedVocab.length)];
        this.showPracticeQuestion(randomWord);
    }

    showPracticeQuestion(word) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-md w-full p-6">
                <h3 class="text-xl font-bold mb-4">Quick Practice</h3>
                <p class="mb-4">What does "<span class="font-bold text-purple-600">${word.pidgin}</span>" mean?</p>

                <div class="space-y-2 mb-4">
                    <button class="quiz-option w-full text-left" data-answer="${word.english}">${word.english}</button>
                    <button class="quiz-option w-full text-left" data-answer="wrong1">Something else</button>
                    <button class="quiz-option w-full text-left" data-answer="wrong2">Another thing</button>
                </div>

                <button class="close-practice w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Skip</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle answer selection
        modal.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const isCorrect = e.target.dataset.answer === word.english;
                e.target.classList.add(isCorrect ? 'correct' : 'incorrect');

                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.showNotification(isCorrect ? 'Correct! Well done!' : 'Not quite, keep practicing!');
                }, 1000);
            });
        });

        // Close button
        modal.querySelector('.close-practice').addEventListener('click', () => {
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