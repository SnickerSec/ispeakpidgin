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
        },
        {
            id: 'family',
            title: 'Family & People',
            icon: '👨‍👩‍👧‍👦',
            content: {
                vocabulary: [
                    { pidgin: 'Ohana', english: 'Family', example: 'My ohana stay coming fo\' dinner.' },
                    { pidgin: 'Keiki', english: 'Child/Children', example: 'Da keiki stay playing at da beach.' },
                    { pidgin: 'Tutu', english: 'Grandparent', example: 'My tutu make da best cookies.' },
                    { pidgin: 'Aunty', english: 'Elder woman (respectful)', example: 'Aunty, can you help me?' },
                    { pidgin: 'Uncle', english: 'Elder man (respectful)', example: 'Uncle stay fixing da car.' },
                    { pidgin: 'Bruddah', english: 'Brother/Close friend', example: 'Dis my bruddah from school.' }
                ],
                culturalNote: 'In Hawaiian culture, "Aunty" and "Uncle" are terms of respect for any elder, not just blood relatives. Ohana extends beyond blood family.',
                practice: 'Use "Aunty" and "Uncle" when talking to elders you meet.'
            }
        },
        {
            id: 'weather',
            title: 'Weather & Nature',
            icon: '🌞',
            content: {
                vocabulary: [
                    { pidgin: 'Stay hot', english: 'It\'s hot', example: 'Ho, stay hot today!' },
                    { pidgin: 'Stay raining', english: 'It\'s raining', example: 'Stay raining mauka side.' },
                    { pidgin: 'Nice day', english: 'Beautiful day', example: 'What one nice day fo\' beach!' },
                    { pidgin: 'Da sun stay out', english: 'The sun is shining', example: 'Da sun stay out, let\'s go surf!' },
                    { pidgin: 'Trade winds', english: 'Cooling breeze', example: 'Lucky we get trade winds today.' },
                    { pidgin: 'Vog', english: 'Volcanic smog', example: 'Da vog stay thick on Big Island.' }
                ],
                culturalNote: 'Weather talk is important in Hawaii. Trade winds bring relief from heat, and vog (volcanic smog) affects air quality on Big Island.',
                practice: 'Start conversations by commenting on the weather Hawaiian style!'
            }
        },
        {
            id: 'numbers-time',
            title: 'Numbers & Time',
            icon: '⏰',
            content: {
                vocabulary: [
                    { pidgin: 'One', english: 'A/An/One', example: 'I like one plate lunch.' },
                    { pidgin: 'Two-two', english: 'Two each', example: 'Give everybody two-two cookies.' },
                    { pidgin: 'Plenny', english: 'A lot/Many', example: 'Get plenny fish in da ocean.' },
                    { pidgin: 'Small kine', english: 'A little bit', example: 'Just put small kine salt.' },
                    { pidgin: 'Long time', english: 'A long time', example: 'I no see you fo\' long time!' },
                    { pidgin: 'Right now', english: 'Immediately', example: 'Come here right now!' }
                ],
                culturalNote: 'Pidgin uses "one" where English uses "a" or "an". Time expressions are often more relaxed and approximate.',
                practice: 'Try using "one" instead of "a" when you speak.'
            }
        }
    ],

    intermediate: [
        {
            id: 'exclamations',
            title: 'Exclamations & Expressions',
            icon: '🎉',
            content: {
                vocabulary: [
                    { pidgin: 'Chee hoo!', english: 'Expression of joy/excitement', example: 'Chee hoo! We going beach!' },
                    { pidgin: 'Ho!', english: 'Wow! (expression of surprise)', example: 'Ho! Look at dat sunset!' },
                    { pidgin: 'Eh!', english: 'Hey! (to get attention)', example: 'Eh! Come here!' },
                    { pidgin: 'Rajah dat!', english: 'Roger that!/I agree!', example: 'We go eat? Rajah dat!' },
                    { pidgin: 'Hana hou!', english: 'Do it again!/Encore!', example: 'Dat song was good! Hana hou!' },
                    { pidgin: 'K den', english: 'Okay then', example: 'You no like come? K den.' }
                ],
                culturalNote: 'These expressions add emotion and energy to Pidgin conversations. They are often used to show enthusiasm or agreement.',
                practice: 'Use "Chee hoo!" when you are excited and "Rajah dat!" when you agree.'
            }
        },
        {
            id: 'descriptions',
            title: 'Describing Things & People',
            icon: '👀',
            content: {
                vocabulary: [
                    { pidgin: 'Lolo', english: 'Crazy/Silly/Dumb', example: 'You stay so lolo today!' },
                    { pidgin: 'Mean', english: 'Awesome/Cool', example: 'Dat car stay mean!' },
                    { pidgin: 'Hamajang', english: 'Messed up/Broken', example: 'Da TV stay all hamajang.' },
                    { pidgin: 'Chicken skin', english: 'Goosebumps', example: 'Dat story give me chicken skin.' },
                    { pidgin: 'Stoked', english: 'Excited/Happy', example: 'I stay so stoked for da party!' },
                    { pidgin: 'Ono', english: 'Delicious', example: 'Dis poke stay ono!' }
                ],
                culturalNote: 'Pidgin uses vivid, descriptive words that paint a picture. "Chicken skin" literally refers to the bumpy texture of skin when you get goosebumps.',
                practice: 'Describe your feelings using these colorful Pidgin expressions.'
            }
        },
        {
            id: 'activities',
            title: 'Activities & Actions',
            icon: '🏄‍♂️',
            content: {
                vocabulary: [
                    { pidgin: 'Talk story', english: 'Chat/Gossip/Catch up', example: 'Come talk story with me!' },
                    { pidgin: 'Holo holo', english: 'Cruise around/Leisurely drive', example: 'We go holo holo around da island.' },
                    { pidgin: 'Chance um', english: 'Try it/Take a chance', example: 'You scared? Chance um!' },
                    { pidgin: 'Grind', english: 'Eat', example: 'Time to grind! I stay hungry.' },
                    { pidgin: 'Like beef?', english: 'Want to fight?', example: 'You get problem? Like beef?' },
                    { pidgin: 'No can', english: 'Cannot/Unable to', example: 'I like help but I no can today.' }
                ],
                culturalNote: 'These action words reflect the laid-back island lifestyle. "Talk story" is a beloved Hawaiian tradition of sharing stories and connecting.',
                practice: 'Use "talk story" when inviting someone to chat, and "holo holo" for casual outings.'
            }
        },
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
            id: 'local-culture',
            title: 'Local Culture & Lifestyle',
            icon: '🌺',
            content: {
                vocabulary: [
                    { pidgin: 'Kanak attack', english: 'Sleepiness after eating', example: 'Ho! I get kanak attack after dat plate lunch.' },
                    { pidgin: 'Hawaiian time', english: 'Running late/Relaxed time', example: 'Sorry I stay late, I was on Hawaiian time.' },
                    { pidgin: 'Green bottles', english: 'Heineken beer', example: 'Pau hana! Time for green bottles!' },
                    { pidgin: 'Slippahs', english: 'Flip-flops/Sandals', example: 'No forget your slippahs!' },
                    { pidgin: 'Da haps', english: 'What happened/Events', example: 'Tell me da haps from last night!' },
                    { pidgin: 'Side', english: 'Area/Direction', example: 'We going town side or country side?' }
                ],
                culturalNote: 'These terms reflect unique aspects of Hawaiian island life, from the post-meal drowsiness to the relaxed approach to punctuality.',
                practice: 'Use these cultural terms to sound like a true local when describing daily island life.'
            }
        },
        {
            id: 'hawaiian-words',
            title: 'Hawaiian Words in Pidgin',
            icon: '🏝️',
            content: {
                vocabulary: [
                    { pidgin: 'Kapu', english: 'Forbidden/Sacred/Off-limits', example: 'Dis area stay kapu, no go there.' },
                    { pidgin: 'Keiki', english: 'Child/Children', example: 'Da keiki stay playing at da beach.' },
                    { pidgin: 'Lānai', english: 'Porch/Patio/Balcony', example: 'Come sit on da lānai and talk story.' },
                    { pidgin: 'Pūpū', english: 'Appetizers/Snacks', example: 'Get plenty pūpū at da party tonight.' },
                    { pidgin: 'Mahalo', english: 'Thank you', example: 'Mahalo for da help, bruddah!' },
                    { pidgin: 'Aloha', english: 'Hello/Goodbye/Love', example: 'Aloha! Nice to meet you!' }
                ],
                culturalNote: 'Many Hawaiian words are seamlessly integrated into Pidgin. These words carry deep cultural meaning and respect for the native Hawaiian language.',
                practice: 'Learn the cultural significance of these Hawaiian words - they are not just vocabulary but carry spiritual meaning.'
            }
        },
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
        },
        {
            id: 'advanced-conversation',
            title: 'Advanced Conversation Skills',
            icon: '🗣️',
            content: {
                vocabulary: [
                    { pidgin: 'You know wat I mean or wat?', english: 'Do you understand what I\'m saying?', example: 'Da waves was so big, you know wat I mean or wat?' },
                    { pidgin: 'Ass why hard', english: 'That\'s why it\'s difficult', example: 'No more money, ass why hard fo\' go vacation.' },
                    { pidgin: 'How you figga?', english: 'What makes you think that?', example: 'How you figga I like go work today?' },
                    { pidgin: 'What da scoop?', english: 'What\'s the situation/news?', example: 'Eh brah, what da scoop wit da party tonight?' },
                    { pidgin: 'No act', english: 'Don\'t show off/Don\'t pretend', example: 'No act like you no hear me calling you.' },
                    { pidgin: 'Yeah, but still...', english: 'Yes, but nevertheless...', example: 'Yeah, but still, we gotta try fo\' do \'em right.' }
                ],
                culturalNote: 'Advanced Pidgin involves subtle conversational patterns and implied meanings. These phrases help you navigate complex social situations with local flair.',
                practice: 'Practice these phrases in real conversations to sound more natural and connected to local culture.'
            }
        }
    ]
};

// Quiz questions - expanded with multiple questions per lesson topic
const quizQuestions = {
    beginner: [
        // Basic Greetings Questions
        {
            question: "What does 'Howzit' mean?",
            options: ['Goodbye', 'Hello/How are you', 'Thank you', 'Excuse me'],
            correct: 1
        },
        {
            question: "How do you say 'See you later' in Pidgin?",
            options: ['Aloha', 'Latahs', 'Shoots', 'Tanks'],
            correct: 1
        },
        {
            question: "What does 'shoots' mean?",
            options: ['Gun', 'Basketball', 'Okay/Sounds good', 'No way'],
            correct: 2
        },
        {
            question: "How do you say 'Thank you' in Pidgin?",
            options: ['Shoots', 'Howzit', 'Tanks', 'Latahs'],
            correct: 2
        },
        {
            question: "What does 'No worries' mean?",
            options: ['Don\'t worry', 'You\'re welcome', 'Be careful', 'I\'m sorry'],
            correct: 1
        },
        {
            question: "Which greeting can mean hello, goodbye, AND love?",
            options: ['Howzit', 'Shoots', 'Aloha', 'Latahs'],
            correct: 2
        },
        // Food & Eating Questions
        {
            question: "How do you say 'food' in Pidgin?",
            options: ['Ono', 'Grinds', 'Pau', 'Broke'],
            correct: 1
        },
        {
            question: "What does 'ono' mean?",
            options: ['Bad', 'Expensive', 'Delicious', 'Spicy'],
            correct: 2
        },
        {
            question: "What does 'broke da mouth' mean?",
            options: ['Hurt your teeth', 'Very delicious', 'Too spicy', 'Bad taste'],
            correct: 1
        },
        {
            question: "What does 'pau' mean in relation to eating?",
            options: ['Start eating', 'Hungry', 'Finished/Done', 'More food'],
            correct: 2
        },
        {
            question: "How do you say 'to eat' in Pidgin?",
            options: ['Grinds', 'Grind', 'Ono', 'Pau'],
            correct: 1
        },
        {
            question: "What does 'mo bettah' mean?",
            options: ['More food', 'Better/More better', 'Mother', 'Maybe'],
            correct: 1
        },
        // Directions & Places Questions
        {
            question: "What does 'mauka' mean?",
            options: ['Toward the ocean', 'Toward the mountains', 'Left side', 'Right side'],
            correct: 1
        },
        {
            question: "What does 'makai' mean?",
            options: ['Toward the mountains', 'Toward the ocean', 'North', 'South'],
            correct: 1
        },
        {
            question: "What does 'hale' mean?",
            options: ['Street', 'Beach', 'House/Home', 'Store'],
            correct: 2
        },
        {
            question: "How do you say 'over there' in Pidgin?",
            options: ['Wea dea', 'Ova dea', 'Da kine', 'Dis place'],
            correct: 1
        },
        {
            question: "What does 'wea' mean?",
            options: ['Who', 'What', 'Where', 'When'],
            correct: 2
        },
        {
            question: "What does 'da kine place' mean?",
            options: ['A nice place', 'That place (you know)', 'The beach', 'The store'],
            correct: 1
        },
        // Family & People Questions
        {
            question: "What does 'Ohana' mean?",
            options: ['Friend', 'Family', 'House', 'Food'],
            correct: 1
        },
        {
            question: "What does 'keiki' mean?",
            options: ['Adult', 'Elder', 'Child/Children', 'Parent'],
            correct: 2
        },
        {
            question: "What does 'tutu' mean?",
            options: ['Child', 'Parent', 'Grandparent', 'Friend'],
            correct: 2
        },
        {
            question: "In Hawaiian culture, who do you call 'Aunty'?",
            options: ['Only your mother\'s sister', 'Only blood relatives', 'Any respected elder woman', 'Young women'],
            correct: 2
        },
        {
            question: "What does 'bruddah' mean?",
            options: ['Only blood brother', 'Brother or close friend', 'Father', 'Cousin'],
            correct: 1
        },
        {
            question: "Who would you respectfully call 'Uncle'?",
            options: ['Only father\'s brother', 'Any respected elder man', 'Young men', 'Only family members'],
            correct: 1
        },
        // Weather & Nature Questions
        {
            question: "What does 'Stay hot' mean?",
            options: ['It\'s spicy', 'It\'s popular', 'It\'s hot (weather)', 'It\'s angry'],
            correct: 2
        },
        {
            question: "How do you say 'It\'s raining' in Pidgin?",
            options: ['Get rain', 'Stay raining', 'Was rain', 'Going rain'],
            correct: 1
        },
        {
            question: "What are 'trade winds'?",
            options: ['Storm winds', 'Cooling breeze', 'Hot winds', 'No wind'],
            correct: 1
        },
        {
            question: "What is 'vog'?",
            options: ['Fog', 'Rain cloud', 'Volcanic smog', 'Morning mist'],
            correct: 2
        },
        {
            question: "How would you say 'The sun is shining'?",
            options: ['Sun stay hot', 'Da sun stay out', 'Sun going shine', 'Get sun'],
            correct: 1
        },
        {
            question: "What does 'nice day' mean in Pidgin context?",
            options: ['Cold day', 'Rainy day', 'Beautiful day', 'Cloudy day'],
            correct: 2
        },
        // Numbers & Time Questions
        {
            question: "How do you say 'a little bit' in Pidgin?",
            options: ['Plenny', 'Small kine', 'Long time', 'Two-two'],
            correct: 1
        },
        {
            question: "What does 'plenny' mean?",
            options: ['A little', 'None', 'A lot/Many', 'Two'],
            correct: 2
        },
        {
            question: "What does 'two-two' mean?",
            options: ['Twenty-two', 'Two each', 'Twice', 'Second'],
            correct: 1
        },
        {
            question: "In Pidgin, 'one' is often used instead of:",
            options: ['Two', 'The', 'A/An', 'Some'],
            correct: 2
        },
        {
            question: "What does 'long time' mean?",
            options: ['A few minutes', 'Yesterday', 'A long time', 'Never'],
            correct: 2
        },
        {
            question: "How do you say 'immediately' in Pidgin?",
            options: ['Bumbye', 'Right now', 'Small kine', 'Long time'],
            correct: 1
        }
    ],
    intermediate: [
        // Exclamations & Expressions Questions
        {
            question: "What does 'Chee hoo!' express?",
            options: ['Anger', 'Fear', 'Joy/Excitement', 'Sadness'],
            correct: 2
        },
        {
            question: "What does 'Ho!' mean?",
            options: ['Stop', 'Wow/Surprise', 'Come here', 'Go away'],
            correct: 1
        },
        {
            question: "What does 'Rajah dat!' mean?",
            options: ['No way!', 'Roger that/I agree', 'Stop that', 'Look at that'],
            correct: 1
        },
        {
            question: "When would you say 'Hana hou'?",
            options: ['When leaving', 'When arriving', 'Asking for an encore', 'When eating'],
            correct: 2
        },
        {
            question: "What does 'K den' mean?",
            options: ['Okay then', 'Not okay', 'Maybe', 'Never'],
            correct: 0
        },
        {
            question: "How is 'Eh!' typically used?",
            options: ['To say goodbye', 'To get attention', 'To show anger', 'To express love'],
            correct: 1
        },
        // Describing Things & People Questions
        {
            question: "What does 'lolo' mean?",
            options: ['Smart', 'Crazy/Silly', 'Tall', 'Strong'],
            correct: 1
        },
        {
            question: "In Pidgin, 'mean' means:",
            options: ['Average', 'Cruel', 'Awesome/Cool', 'Small'],
            correct: 2
        },
        {
            question: "What does 'hamajang' describe?",
            options: ['Perfect', 'Messed up/Broken', 'Beautiful', 'New'],
            correct: 1
        },
        {
            question: "What does 'chicken skin' mean?",
            options: ['Food', 'Goosebumps', 'Coward', 'Thin'],
            correct: 1
        },
        {
            question: "What does 'stoked' mean?",
            options: ['Tired', 'Angry', 'Excited/Happy', 'Confused'],
            correct: 2
        },
        {
            question: "If something is 'ono', it is:",
            options: ['Ugly', 'Delicious', 'Expensive', 'Cold'],
            correct: 1
        },
        // Activities & Actions Questions
        {
            question: "What does 'talk story' mean?",
            options: ['Tell lies', 'Read a book', 'Chat/Converse', 'Be quiet'],
            correct: 2
        },
        {
            question: "What does 'holo holo' mean?",
            options: ['Run fast', 'Cruise around leisurely', 'Work hard', 'Sleep'],
            correct: 1
        },
        {
            question: "What does 'chance um' mean?",
            options: ['Give up', 'Wait', 'Try it/Take a chance', 'Stop'],
            correct: 2
        },
        {
            question: "What does 'like beef?' mean?",
            options: ['Want meat?', 'Want to fight?', 'Are you hungry?', 'Do you like steak?'],
            correct: 1
        },
        {
            question: "What does 'no can' mean?",
            options: ['No container', 'Cannot/Unable to', 'Don\'t want to', 'Not allowed'],
            correct: 1
        },
        {
            question: "How do you say 'eat' in Pidgin?",
            options: ['Ono', 'Pau', 'Grind', 'Broke'],
            correct: 2
        },
        // Emotions & Feelings Questions
        {
            question: "What does 'bummers' express?",
            options: ['Happiness', 'Disappointment', 'Anger', 'Fear'],
            correct: 1
        },
        {
            question: "What does 'huhu' mean?",
            options: ['Happy', 'Sleepy', 'Angry', 'Excited'],
            correct: 2
        },
        {
            question: "What does 'shame' mean in Pidgin?",
            options: ['Proud', 'Embarrassed', 'Angry', 'Happy'],
            correct: 1
        },
        {
            question: "What does 'all buss up' mean?",
            options: ['Broken', 'Exhausted', 'Happy', 'Rich'],
            correct: 1
        },
        {
            question: "If you're 'stoked', you are:",
            options: ['Sad', 'Tired', 'Excited', 'Sick'],
            correct: 2
        },
        {
            question: "Getting 'chicken skin' means you have:",
            options: ['A rash', 'Goosebumps', 'Sunburn', 'Dry skin'],
            correct: 1
        },
        // Time Expressions Questions
        {
            question: "What does 'pau hana' mean?",
            options: ['Start work', 'After work', 'Lunch break', 'Weekend'],
            correct: 1
        },
        {
            question: "What does 'bumbye' mean?",
            options: ['Never', 'Right now', 'Later/Eventually', 'Yesterday'],
            correct: 2
        },
        {
            question: "What word indicates past tense in Pidgin?",
            options: ['Stay', 'Wen', 'Going', 'Get'],
            correct: 1
        },
        {
            question: "What does 'stay' indicate in Pidgin grammar?",
            options: ['Stop', 'Remain', 'Present continuous action', 'Past action'],
            correct: 2
        },
        {
            question: "How would you say 'I went to the store yesterday'?",
            options: ['I stay go store', 'I wen go store yesterday', 'I going store', 'I go store wen'],
            correct: 1
        },
        {
            question: "What does 'long time no see' mean?",
            options: ['I can\'t see', 'Haven\'t seen you in a while', 'See you later', 'I don\'t want to see you'],
            correct: 1
        },
        // Common Slang Questions
        {
            question: "What does 'da kine' mean?",
            options: ['The best', 'The worst', 'The thing/whatchamacallit', 'The person'],
            correct: 2
        },
        {
            question: "What does 'choke' mean in Pidgin?",
            options: ['To choke', 'A little', 'A lot/Many', 'Nothing'],
            correct: 2
        },
        {
            question: "What does 'junk' mean?",
            options: ['Treasure', 'Bad/Terrible', 'Good', 'New'],
            correct: 1
        },
        {
            question: "If a car is 'mean', it is:",
            options: ['Broken', 'Ugly', 'Awesome/Cool', 'Slow'],
            correct: 2
        },
        {
            question: "What does 'nuts' mean?",
            options: ['Food', 'Crazy', 'Smart', 'Strong'],
            correct: 1
        },
        {
            question: "What does 'beef' mean in Pidgin slang?",
            options: ['Meat', 'Fight/Problem', 'Friend', 'Money'],
            correct: 1
        }
    ],
    advanced: [
        // Local Culture & Lifestyle Questions
        {
            question: "What is a 'kanak attack'?",
            options: ['A fight', 'Sleepiness after eating', 'Sunburn', 'Headache'],
            correct: 1
        },
        {
            question: "What does 'Hawaiian time' mean?",
            options: ['Exact time', 'Running late/Relaxed time', 'Early arrival', 'Time zone'],
            correct: 1
        },
        {
            question: "What are 'green bottles'?",
            options: ['Medicine', 'Heineken beer', 'Soda', 'Wine'],
            correct: 1
        },
        {
            question: "What are 'slippahs'?",
            options: ['Slippers for bed', 'Flip-flops/Sandals', 'Shoes', 'Socks'],
            correct: 1
        },
        {
            question: "What does 'da haps' mean?",
            options: ['Happiness', 'What happened/Events', 'Music', 'Food'],
            correct: 1
        },
        {
            question: "In directions, what does 'side' mean?",
            options: ['Next to', 'Area/Direction', 'Wrong way', 'Beside someone'],
            correct: 1
        },
        // Hawaiian Words in Pidgin Questions
        {
            question: "What does 'kapu' mean?",
            options: ['Welcome', 'Forbidden/Sacred', 'Beautiful', 'Large'],
            correct: 1
        },
        {
            question: "What is a 'lānai'?",
            options: ['Island', 'Beach', 'Porch/Patio', 'Garden'],
            correct: 2
        },
        {
            question: "What are 'pūpū'?",
            options: ['Drinks', 'Appetizers/Snacks', 'Main course', 'Dessert'],
            correct: 1
        },
        {
            question: "What does 'mahalo' mean?",
            options: ['Hello', 'Goodbye', 'Thank you', 'Excuse me'],
            correct: 2
        },
        {
            question: "What does 'keiki' mean?",
            options: ['Adult', 'Elder', 'Child/Children', 'Teacher'],
            correct: 2
        },
        {
            question: "What does 'aloha' NOT mean?",
            options: ['Hello', 'Goodbye', 'Love', 'Money'],
            correct: 3
        },
        // Complex Expressions Questions
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
            question: "What does 'no make like' mean?",
            options: ['Don\'t make it', 'Don\'t pretend', 'Don\'t like it', 'Don\'t go'],
            correct: 1
        },
        {
            question: "What does 'Wat, like beef?' mean?",
            options: ['Want some meat?', 'Do you want to fight?', 'Are you hungry?', 'Want to eat?'],
            correct: 1
        },
        {
            question: "What does 'geev um' mean?",
            options: ['Give it to me', 'Take it away', 'Go for it/Give it your all', 'Stop it'],
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
        },
        {
            question: "What does 'talk story' mean?",
            options: ['Tell lies', 'Read a book', 'Chat/Converse', 'Be quiet'],
            correct: 2
        },
        // Grammar Patterns Questions
        {
            question: "In Pidgin, 'stay + verb-ing' indicates:",
            options: ['Past tense', 'Present continuous', 'Future tense', 'Command'],
            correct: 1
        },
        {
            question: "What does 'wen + verb' indicate?",
            options: ['Future', 'Present', 'Past', 'Maybe'],
            correct: 2
        },
        {
            question: "How do you express future tense in Pidgin?",
            options: ['Stay + verb', 'Wen + verb', 'Going + verb', 'Get + verb'],
            correct: 2
        },
        {
            question: "What does 'get' mean in 'Get plenty fish'?",
            options: ['To obtain', 'There is/are', 'To catch', 'To buy'],
            correct: 1
        },
        {
            question: "What does 'no more' mean in Pidgin?",
            options: ['Don\'t want more', 'There isn\'t/aren\'t', 'Stop', 'Finished'],
            correct: 1
        },
        {
            question: "In Pidgin, 'try' is often used as:",
            options: ['Attempt', 'Test', 'Please (softener)', 'Maybe'],
            correct: 2
        },
        // Cultural Context Questions
        {
            question: "What is 'aloha spirit'?",
            options: ['A drink', 'Spirit of love and compassion', 'Ghost story', 'Party mood'],
            correct: 1
        },
        {
            question: "What does 'ohana' represent in Hawaiian culture?",
            options: ['Just blood relatives', 'Friends only', 'Family (including extended)', 'Neighbors'],
            correct: 2
        },
        {
            question: "What does 'malama' mean?",
            options: ['To destroy', 'To care for', 'To ignore', 'To sell'],
            correct: 1
        },
        {
            question: "What does 'pono' mean?",
            options: ['Wrong', 'Righteous/Proper', 'Maybe', 'Never'],
            correct: 1
        },
        {
            question: "What does 'kokua' mean?",
            options: ['Problem', 'Help/Assistance', 'Food', 'Money'],
            correct: 1
        },
        {
            question: "What does 'Ho brah' express?",
            options: ['Anger', 'Amazement', 'Sadness', 'Fear'],
            correct: 1
        },
        // Advanced Conversation Skills Questions
        {
            question: "What does 'You know wat I mean or wat?' mean?",
            options: [
                'Are you listening?',
                'Do you understand what I\'m saying?',
                'What do you mean?',
                'I don\'t understand'
            ],
            correct: 1
        },
        {
            question: "What does 'Ass why hard' mean?",
            options: [
                'It\'s easy',
                'That\'s why it\'s difficult',
                'Work harder',
                'Don\'t be difficult'
            ],
            correct: 1
        },
        {
            question: "What does 'How you figga?' mean?",
            options: [
                'How are you?',
                'What\'s your figure?',
                'What makes you think that?',
                'How do you calculate?'
            ],
            correct: 2
        },
        {
            question: "What does 'What da scoop?' mean?",
            options: [
                'Where is the ice cream?',
                'What\'s the news/situation?',
                'How much does it cost?',
                'When are we leaving?'
            ],
            correct: 1
        },
        {
            question: "What does 'No act' mean?",
            options: [
                'Don\'t perform',
                'Don\'t show off/pretend',
                'No action',
                'Stop moving'
            ],
            correct: 1
        },
        {
            question: "What does 'Yeah, but still...' imply?",
            options: [
                'Complete agreement',
                'Yes, but nevertheless...',
                'Total disagreement',
                'Maybe later'
            ],
            correct: 1
        }
    ]
};