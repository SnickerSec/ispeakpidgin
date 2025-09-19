// Learning Hub Lessons Data
const lessonsData = {
    beginner: [
        {
            id: 'greetings',
            title: 'Basic Greetings',
            icon: '👋',
            content: {
                vocabulary: [
                    { pidgin: 'Howzit', english: 'Hello/How are you', example: 'Howzit, brah!' },
                    { pidgin: 'Aloha', english: 'Hello/Goodbye/Love', example: 'Aloha, my friend!' },
                    { pidgin: 'Latahs', english: 'See you later', example: 'K den, latahs!' },
                    { pidgin: 'Shoots', english: 'Okay/Sounds good', example: 'You like go beach? Shoots!' },
                    { pidgin: 'Tanks', english: 'Thanks', example: 'Tanks fo\' da help!' },
                    { pidgin: 'No worries', english: "You're welcome", example: 'Tanks! No worries, brah.' }
                ],
                culturalNote: 'Pidgin greetings are casual and friendly. "Howzit" is the most common greeting and can be used any time of day.',
                practice: 'Try greeting someone with "Howzit" today!'
            }
        },
        {
            id: 'food',
            title: 'Food & Eating',
            icon: '🍽️',
            content: {
                vocabulary: [
                    { pidgin: 'Grinds', english: 'Food', example: 'Da grinds stay ono!' },
                    { pidgin: 'Grind', english: 'To eat', example: 'We go grind!' },
                    { pidgin: 'Ono', english: 'Delicious', example: 'Da poke stay ono!' },
                    { pidgin: 'Broke da mouth', english: 'Very delicious', example: 'Ho, dis kalua pig broke da mouth!' },
                    { pidgin: 'Pau', english: 'Finished/Done', example: 'I stay pau wit my plate.' },
                    { pidgin: 'Mo bettah', english: 'Better/More better', example: 'Dis place mo bettah dan da oddah one.' }
                ],
                culturalNote: 'Food is central to Hawaiian culture. "Grinds" refers to any food, and sharing meals is an important social activity.',
                practice: 'Next time you eat something delicious, say it "broke da mouth!"'
            }
        },
        {
            id: 'directions',
            title: 'Directions & Places',
            icon: '🧭',
            content: {
                vocabulary: [
                    { pidgin: 'Mauka', english: 'Toward the mountains', example: 'Da store stay mauka side.' },
                    { pidgin: 'Makai', english: 'Toward the ocean', example: 'We going makai fo\' surf.' },
                    { pidgin: 'Hale', english: 'House/Home', example: 'Come my hale!' },
                    { pidgin: 'Da kine place', english: 'That place (you know)', example: 'We go da kine place we wen go last week.' },
                    { pidgin: 'Ova dea', english: 'Over there', example: 'Da beach stay ova dea.' },
                    { pidgin: 'Wea', english: 'Where', example: 'Wea you stay?' }
                ],
                culturalNote: 'In Hawaii, directions are often given using mauka (mountains) and makai (ocean) as reference points instead of north/south.',
                practice: 'Practice using mauka and makai when giving directions.'
            }
        }
    ],

    intermediate: [
        {
            id: 'emotions',
            title: 'Emotions & Feelings',
            icon: '😊',
            content: {
                vocabulary: [
                    { pidgin: 'Stoked', english: 'Excited', example: 'I stay so stoked fo\' go beach!' },
                    { pidgin: 'Bummers', english: 'Disappointed/Sad', example: 'Bummers, da waves stay flat.' },
                    { pidgin: 'Huhu', english: 'Angry', example: 'No make him huhu!' },
                    { pidgin: 'Shame', english: 'Embarrassed', example: 'Ho, shame! I wen fall down!' },
                    { pidgin: 'Chicken skin', english: 'Goosebumps', example: 'Dat story give me chicken skin!' },
                    { pidgin: 'All buss up', english: 'Exhausted', example: 'I stay all buss up afta work.' }
                ],
                culturalNote: 'Pidgin speakers often express emotions with vivid, descriptive phrases that paint a picture of the feeling.',
                practice: 'Describe your current mood using a Pidgin expression.'
            }
        },
        {
            id: 'time',
            title: 'Time Expressions',
            icon: '⏰',
            content: {
                vocabulary: [
                    { pidgin: 'Bumbye', english: 'Later/Eventually', example: 'I do um bumbye.' },
                    { pidgin: 'Right now', english: 'Immediately', example: 'Come right now!' },
                    { pidgin: 'Long time', english: 'A long time', example: 'Long time no see!' },
                    { pidgin: 'Pau hana', english: 'After work', example: 'We go beach pau hana time.' },
                    { pidgin: 'Wen', english: 'Past tense marker', example: 'I wen go store yesterday.' },
                    { pidgin: 'Stay', english: 'Present continuous', example: 'I stay working now.' }
                ],
                culturalNote: 'Pidgin has unique ways of expressing time. "Wen" indicates past tense, while "stay" indicates ongoing action.',
                practice: 'Use "wen" to talk about something you did yesterday.'
            }
        },
        {
            id: 'slang',
            title: 'Common Slang',
            icon: '🤙',
            content: {
                vocabulary: [
                    { pidgin: 'Da kine', english: 'The thing/whatchamacallit', example: 'Pass me da kine... da kine red one!' },
                    { pidgin: 'Choke', english: 'A lot/Many', example: 'Get choke cars on da road!' },
                    { pidgin: 'Junk', english: 'Bad/Terrible', example: 'Da food stay junk.' },
                    { pidgin: 'Mean', english: 'Awesome/Cool', example: 'Dat car stay mean!' },
                    { pidgin: 'Nuts', english: 'Crazy', example: 'You nuts or wat?' },
                    { pidgin: 'Beef', english: 'Fight/Problem', example: 'No need beef, brah.' }
                ],
                culturalNote: '"Da kine" is the most versatile Pidgin word - it can mean almost anything depending on context!',
                practice: 'Try using "da kine" when you forget the name of something.'
            }
        }
    ],

    advanced: [
        {
            id: 'complex',
            title: 'Complex Expressions',
            icon: '🎯',
            content: {
                vocabulary: [
                    { pidgin: 'If can can, if no can no can', english: 'Do it if possible, if not then don\'t', example: 'You come party? If can can, if no can no can.' },
                    { pidgin: 'No make like', english: "Don't pretend", example: 'No make like you neva hear me!' },
                    { pidgin: 'Wat, like beef?', english: 'Do you want to fight?', example: 'Wat, you like beef or wat?' },
                    { pidgin: 'Geev um', english: 'Go for it/Give it your all', example: 'Surfing contest tomorrow? Geev um!' },
                    { pidgin: 'Talk story', english: 'Chat/Converse', example: 'Come, we go talk story.' },
                    { pidgin: 'Make ass', english: 'Make a fool of yourself', example: 'No go make ass at da party!' }
                ],
                culturalNote: 'Advanced Pidgin involves understanding context and local humor. Many expressions have layers of meaning.',
                practice: 'Try "talking story" with someone - just have a casual conversation.'
            }
        },
        {
            id: 'grammar',
            title: 'Pidgin Grammar Patterns',
            icon: '📝',
            content: {
                vocabulary: [
                    { pidgin: 'Stay + verb-ing', english: 'Present continuous', example: 'I stay eating.' },
                    { pidgin: 'Wen + verb', english: 'Past tense', example: 'I wen eat already.' },
                    { pidgin: 'Going + verb', english: 'Future tense', example: 'I going eat.' },
                    { pidgin: 'Get', english: 'There is/are', example: 'Get plenty fish in da ocean.' },
                    { pidgin: 'No more', english: "There isn't/aren't", example: 'No more rice.' },
                    { pidgin: 'Try', english: 'Please (softener)', example: 'Try pass da salt.' }
                ],
                culturalNote: 'Pidgin grammar is simpler than English but has its own consistent rules. Context is very important.',
                practice: 'Practice forming sentences using "stay," "wen," and "going."'
            }
        },
        {
            id: 'culture',
            title: 'Cultural Context',
            icon: '🌺',
            content: {
                vocabulary: [
                    { pidgin: 'Aloha spirit', english: 'Spirit of love and compassion', example: 'Share da aloha spirit!' },
                    { pidgin: 'Ohana', english: 'Family', example: 'Ohana means nobody gets left behind.' },
                    { pidgin: 'Malama', english: 'To care for', example: 'Malama da aina (care for the land).' },
                    { pidgin: 'Pono', english: 'Righteous/Proper', example: 'Make pono (do the right thing).' },
                    { pidgin: 'Kokua', english: 'Help/Assistance', example: 'Need kokua?' },
                    { pidgin: 'Ho brah', english: 'Expression of amazement', example: 'Ho brah, dat wave was huge!' }
                ],
                culturalNote: 'Understanding Pidgin means understanding Hawaiian values like ohana, aloha, and respect for the land.',
                practice: 'Learn about Hawaiian culture to better understand Pidgin context.'
            }
        }
    ]
};

// Quiz questions
const quizQuestions = {
    beginner: [
        {
            question: "What does 'Howzit' mean?",
            options: ['Goodbye', 'Hello/How are you', 'Thank you', 'Excuse me'],
            correct: 1
        },
        {
            question: "How do you say 'food' in Pidgin?",
            options: ['Ono', 'Grinds', 'Pau', 'Broke'],
            correct: 1
        },
        {
            question: "What does 'shoots' mean?",
            options: ['Gun', 'Basketball', 'Okay/Sounds good', 'No way'],
            correct: 2
        }
    ],
    intermediate: [
        {
            question: "What does 'pau hana' mean?",
            options: ['Start work', 'After work', 'Lunch break', 'Weekend'],
            correct: 1
        },
        {
            question: "What does 'choke' mean in Pidgin?",
            options: ['To choke', 'A little', 'A lot/Many', 'Nothing'],
            correct: 2
        },
        {
            question: "What word indicates past tense in Pidgin?",
            options: ['Stay', 'Wen', 'Going', 'Get'],
            correct: 1
        }
    ],
    advanced: [
        {
            question: "What does 'If can can, if no can no can' mean?",
            options: [
                'Yes or no',
                'Do it if possible, if not then don\'t',
                'Can you help me',
                'I cannot do it'
            ],
            correct: 1
        },
        {
            question: "What does 'talk story' mean?",
            options: ['Tell lies', 'Read a book', 'Chat/Converse', 'Be quiet'],
            correct: 2
        },
        {
            question: "What does 'make ass' mean?",
            options: [
                'Work hard',
                'Make a fool of yourself',
                'Be successful',
                'Help someone'
            ],
            correct: 1
        }
    ]
};