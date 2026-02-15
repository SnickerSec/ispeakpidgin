// Learning Hub Lessons Data Loader
// Fetches lessons from Supabase API with fallback to static data

// Lessons cache
let lessonsCache = null;
let lessonsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Async loader function
async function loadLessonsFromAPI() {
    const now = Date.now();

    // Return cached data if valid
    if (lessonsCache && (now - lessonsCacheTime) < CACHE_TTL) {
        return lessonsCache;
    }

    try {
        const response = await fetch('/api/lessons');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        lessonsCache = data;
        lessonsCacheTime = now;
        return data;
    } catch (error) {
        console.warn('Failed to load lessons from API, using fallback:', error.message);
        return getFallbackLessonsData();
    }
}

// Synchronous getter (returns cached or fallback)
function getLessonsData() {
    if (lessonsCache) {
        return lessonsCache;
    }
    return getFallbackLessonsData();
}

// Fallback static data (subset for offline/error cases)
function getFallbackLessonsData() {
    return {
        beginner: [
            {
                id: 'greetings',
                title: 'Basic Greetings',
                icon: '<i class="ti ti-hand-wave"></i>',
                content: {
                    vocabulary: [
                        { pidgin: 'Howzit', english: 'Hello/How are you', example: 'Howzit, brah!' },
                        { pidgin: 'Aloha', english: 'Hello/Goodbye/Love', example: 'Aloha, my friend!' },
                        { pidgin: 'Shoots', english: 'Okay/Sounds good', example: 'You like go beach? Shoots!' },
                        { pidgin: 'Tanks', english: 'Thanks', example: "Tanks fo' da help!" }
                    ],
                    culturalNote: 'Pidgin greetings are casual and friendly.',
                    practice: 'Try greeting someone with "Howzit" today!'
                }
            },
            {
                id: 'food',
                title: 'Food & Eating',
                icon: '<i class="ti ti-tools-kitchen-2"></i>',
                content: {
                    vocabulary: [
                        { pidgin: 'Grinds', english: 'Food', example: 'Da grinds stay ono!' },
                        { pidgin: 'Ono', english: 'Delicious', example: 'Da poke stay ono!' },
                        { pidgin: 'Broke da mouth', english: 'Very delicious', example: 'Dis kalua pig broke da mouth!' }
                    ],
                    culturalNote: 'Food is central to Hawaiian culture.',
                    practice: 'Say it "broke da mouth" when food is delicious!'
                }
            }
        ],
        intermediate: [
            {
                id: 'exclamations',
                title: 'Exclamations & Expressions',
                icon: '<i class="ti ti-confetti"></i>',
                content: {
                    vocabulary: [
                        { pidgin: 'Chee hoo!', english: 'Expression of joy', example: 'Chee hoo! We going beach!' },
                        { pidgin: 'Ho!', english: 'Wow!', example: 'Ho! Look at dat sunset!' },
                        { pidgin: 'Rajah dat!', english: 'Roger that!', example: 'We go eat? Rajah dat!' }
                    ],
                    culturalNote: 'These expressions add energy to conversations.',
                    practice: 'Use "Chee hoo!" when excited!'
                }
            }
        ],
        advanced: [
            {
                id: 'complex',
                title: 'Complex Expressions',
                icon: '<i class="ti ti-target"></i>',
                content: {
                    vocabulary: [
                        { pidgin: 'If can can, if no can no can', english: "Do it if possible", example: 'If can can, if no can no can.' },
                        { pidgin: 'Da kine', english: 'The thing/whatchamacallit', example: 'Pass me da kine!' }
                    ],
                    culturalNote: 'Advanced Pidgin involves context and humor.',
                    practice: 'Use "da kine" when you forget a word!'
                }
            }
        ]
    };
}

// Initialize lessonsData global for backward compatibility
let lessonsData = getFallbackLessonsData();

// Auto-load from API when script loads
(async function initLessons() {
    try {
        const data = await loadLessonsFromAPI();
        lessonsData = data;
        // Dispatch event to notify components that lessons are loaded
        window.dispatchEvent(new CustomEvent('lessonsLoaded', { detail: data }));
    } catch (error) {
        console.warn('Lessons initialization error:', error);
    }
})();

// Quiz questions are now loaded from /api/quiz/questions
// The quizQuestions variable is kept for backward compatibility but should use the API
const quizQuestions = {
    beginner: [],
    intermediate: [],
    advanced: []
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadLessonsFromAPI, getLessonsData, getFallbackLessonsData };
}
