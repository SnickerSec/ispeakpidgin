#!/usr/bin/env node
/**
 * Add 25 New Quiz Questions - Diverse Topics
 * Covers food, culture, greetings, expressions, and local knowledge
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_KEY not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const questions = [
    // Food & Grindz (5 questions)
    {
        question: "What's 'broke da mouth' mean when talking about food?",
        question_type: "multiple_choice",
        options: [
            { text: "So delicious it's amazing", points: 10, feedback: "Das right! When food broke da mouth, it's da best!" },
            { text: "Too spicy to eat", points: 3, feedback: "Nah, broke da mouth means super ono!" },
            { text: "Food is too expensive", points: 0, feedback: "Not about price brah!" },
            { text: "Bad quality food", points: 0, feedback: "Actually da opposite - it's super good!" }
        ],
        correct_answer: "So delicious it's amazing",
        explanation: "'Broke da mouth' means the food is so delicious it's incredible - one of the highest compliments for food!",
        category: "food",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "food", "expressions"]
    },
    {
        question: "What's a 'plate lunch' consist of?",
        question_type: "multiple_choice",
        options: [
            { text: "Two scoops rice, mac salad, and main dish", points: 10, feedback: "Perfect! Das da classic plate lunch setup!" },
            { text: "Just rice and chicken", points: 3, feedback: "You missing da mac salad brah!" },
            { text: "Sandwich and chips", points: 0, feedback: "Nah, das mainland style!" },
            { text: "Salad and vegetables only", points: 0, feedback: "Where's da carbs?! Not plate lunch!" }
        ],
        correct_answer: "Two scoops rice, mac salad, and main dish",
        explanation: "A classic Hawaiian plate lunch has two scoops of white rice, macaroni salad, and your choice of main dish (like kalua pork, teriyaki chicken, etc.)",
        category: "food",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "food", "culture"]
    },
    {
        question: "What's 'ono kine grindz'?",
        question_type: "multiple_choice",
        options: [
            { text: "Delicious food", points: 10, feedback: "Correct! Ono means delicious, kine means kind/type, grindz means food!" },
            { text: "One kind of food", points: 5, feedback: "Close, but ono means delicious, not 'one'!" },
            { text: "Spicy food", points: 0, feedback: "Nah, ono means delicious!" },
            { text: "Free food", points: 3, feedback: "Not quite - it's about how good da food is!" }
        ],
        correct_answer: "Delicious food",
        explanation: "Ono = delicious, kine = kind/type, grindz = food. So 'ono kine grindz' means delicious food!",
        category: "food",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "food"]
    },
    {
        question: "If someone says 'choke grindz', what they mean?",
        question_type: "multiple_choice",
        options: [
            { text: "Plenty food/a lot of food", points: 10, feedback: "Das it! Choke means plenty!" },
            { text: "Food that makes you choke", points: 0, feedback: "Nah brah, choke means plenty!" },
            { text: "Spicy food", points: 0, feedback: "Wrong kine spicy!" },
            { text: "Bad food", points: 0, feedback: "Actually means get plenty food!" }
        ],
        correct_answer: "Plenty food/a lot of food",
        explanation: "'Choke' in pidgin means 'a lot' or 'plenty'. So 'choke grindz' means there's plenty of food!",
        category: "food",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "expressions"]
    },
    {
        question: "What's 'loco moco'?",
        question_type: "multiple_choice",
        options: [
            { text: "Rice, hamburger patty, fried egg, and gravy", points: 10, feedback: "Correct! Classic local comfort food!" },
            { text: "A crazy person", points: 5, feedback: "Loco means crazy, but loco moco is food!" },
            { text: "Spicy chicken dish", points: 0, feedback: "Nah, it's beef, not chicken!" },
            { text: "Hawaiian dessert", points: 0, feedback: "It's a main dish, not dessert!" }
        ],
        correct_answer: "Rice, hamburger patty, fried egg, and gravy",
        explanation: "Loco moco is a beloved Hawaiian comfort food: white rice topped with a hamburger patty, fried egg, and brown gravy!",
        category: "food",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "food", "culture"]
    },

    // Greetings & Social (5 questions)
    {
        question: "What's da proper response to 'Howzit'?",
        question_type: "multiple_choice",
        options: [
            { text: "Good, you?", points: 10, feedback: "Das right! Keep it casual!" },
            { text: "What do you mean?", points: 0, feedback: "Howzit means 'How are you?'!" },
            { text: "Ignore them", points: 0, feedback: "No be rude brah!" },
            { text: "Say your name", points: 0, feedback: "Nah, just say you're good!" }
        ],
        correct_answer: "Good, you?",
        explanation: "'Howzit' is short for 'How is it?' or 'How are you?' - a casual greeting. Just respond with how you're doing!",
        category: "greetings",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "greetings", "social"]
    },
    {
        question: "If someone says 'Rajah dat', what they saying?",
        question_type: "multiple_choice",
        options: [
            { text: "I understand/I got it", points: 10, feedback: "Correct! Rajah means understand!" },
            { text: "I disagree", points: 0, feedback: "Nah, means you understand!" },
            { text: "What did you say?", points: 0, feedback: "Rajah means you got it!" },
            { text: "I'm confused", points: 0, feedback: "Actually da opposite - means clear!" }
        ],
        correct_answer: "I understand/I got it",
        explanation: "'Rajah' (from 'roger that') means 'I understand' or 'I got it'. Common way to acknowledge you heard and understood something.",
        category: "expressions",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "communication"]
    },
    {
        question: "What does 'No act' mean?",
        question_type: "multiple_choice",
        options: [
            { text: "Don't show off/Don't be fake", points: 10, feedback: "Das it! Stay humble brah!" },
            { text: "Don't do anything", points: 3, feedback: "Close, but it means don't show off!" },
            { text: "Don't perform", points: 0, feedback: "Not about performing - about being real!" },
            { text: "Don't move", points: 0, feedback: "Nah, means don't be fake!" }
        ],
        correct_answer: "Don't show off/Don't be fake",
        explanation: "'No act' means don't show off, don't be fake, or don't pretend to be something you're not. Stay humble and real!",
        category: "expressions",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "social"]
    },
    {
        question: "Someone says 'Shoots den'. What's that mean?",
        question_type: "multiple_choice",
        options: [
            { text: "Okay then/Sounds good", points: 10, feedback: "Correct! Shoots is like 'okay' or 'cool'!" },
            { text: "Start shooting", points: 0, feedback: "Nothing to do with shooting brah!" },
            { text: "I disagree", points: 0, feedback: "Nah, shoots means agreement!" },
            { text: "Goodbye", points: 5, feedback: "Can be used when leaving, but means 'okay then'!" }
        ],
        correct_answer: "Okay then/Sounds good",
        explanation: "'Shoots' means okay, sounds good, or alright. 'Shoots den' means 'okay then' - agreeing to plans or acknowledging something.",
        category: "expressions",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "common"]
    },
    {
        question: "What's 'beef' mean in local slang?",
        question_type: "multiple_choice",
        options: [
            { text: "Having a problem with someone", points: 10, feedback: "Das right! You get beef means you got issues!" },
            { text: "Type of meat", points: 3, feedback: "Can mean that, but in slang it's about problems!" },
            { text: "Being strong", points: 0, feedback: "Nah, it's about conflict!" },
            { text: "Eating food", points: 0, feedback: "Beef means you get issues with someone!" }
        ],
        correct_answer: "Having a problem with someone",
        explanation: "'Beef' means having a problem, conflict, or issue with someone. 'You get beef with him?' = 'Do you have a problem with him?'",
        category: "slang",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "slang", "social"]
    },

    // Culture & Places (5 questions)
    {
        question: "What's a 'Tutu'?",
        question_type: "multiple_choice",
        options: [
            { text: "Grandparent (Tutu Kane = grandpa, Tutu Wahine = grandma)", points: 10, feedback: "Perfect! Tutu is how we talk about grandparents!" },
            { text: "A type of skirt", points: 3, feedback: "Das a tutu (ballet), but Tutu is grandparent!" },
            { text: "Uncle or Auntie", points: 5, feedback: "Close to family, but Tutu specifically means grandparent!" },
            { text: "A friend", points: 0, feedback: "Nah, Tutu is grandparent!" }
        ],
        correct_answer: "Grandparent (Tutu Kane = grandpa, Tutu Wahine = grandma)",
        explanation: "'Tutu' is Hawaiian for grandparent. Tutu Kane is grandfather, Tutu Wahine is grandmother. Shows respect for elders!",
        category: "family",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "hawaiian", "family"]
    },
    {
        question: "What's 'da808'?",
        question_type: "multiple_choice",
        options: [
            { text: "Hawaii's area code/refers to Hawaii", points: 10, feedback: "Das it! 808 pride!" },
            { text: "A type of drum machine", points: 5, feedback: "That's a Roland TR-808, but 808 also means Hawaii!" },
            { text: "Highway number", points: 0, feedback: "Nah, it's da area code brah!" },
            { text: "Police code", points: 0, feedback: "808 is Hawaii's area code!" }
        ],
        correct_answer: "Hawaii's area code/refers to Hawaii",
        explanation: "808 is Hawaii's area code, and locals use it to represent Hawaii and Hawaiian pride. 'Da 808' = Hawaii!",
        category: "culture",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "culture", "hawaii"]
    },
    {
        question: "What's 'mauka' and 'makai'?",
        question_type: "multiple_choice",
        options: [
            { text: "Mauka = toward mountains, Makai = toward ocean", points: 10, feedback: "Perfect! Local directions!" },
            { text: "Left and right", points: 0, feedback: "Nah, it's about mountains and ocean!" },
            { text: "North and south", points: 5, feedback: "Close, but it's mountain side vs ocean side!" },
            { text: "Two Hawaiian foods", points: 0, feedback: "These are directions, not food!" }
        ],
        correct_answer: "Mauka = toward mountains, Makai = toward ocean",
        explanation: "Mauka means toward the mountains (inland), makai means toward the ocean. Used for giving directions instead of north/south/east/west!",
        category: "culture",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "hawaiian", "directions"]
    },
    {
        question: "What's 'shaka'?",
        question_type: "multiple_choice",
        options: [
            { text: "Hand gesture - hang loose/aloha spirit", points: 10, feedback: "Das right! 🤙 Shaka brah!" },
            { text: "A type of dance", points: 0, feedback: "Nah, it's a hand sign!" },
            { text: "Hawaiian greeting word", points: 5, feedback: "It is a greeting, but it's a hand gesture!" },
            { text: "Type of wave", points: 0, feedback: "Shaka is da hand sign!" }
        ],
        correct_answer: "Hand gesture - hang loose/aloha spirit",
        explanation: "The shaka is the iconic Hawaii hand gesture (thumb and pinky extended) meaning hang loose, hello, goodbye, thanks, or aloha spirit! 🤙",
        category: "culture",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "culture", "gestures"]
    },
    {
        question: "What's an 'Aunty' or 'Uncle' in Hawaii?",
        question_type: "multiple_choice",
        options: [
            { text: "Respectful term for any elder, not just relatives", points: 10, feedback: "Correct! Show respect to elders!" },
            { text: "Only your parent's siblings", points: 5, feedback: "Can be, but also for any respected elder!" },
            { text: "Your grandparents", points: 0, feedback: "That's Tutu! Aunty/Uncle is for other elders!" },
            { text: "Your friends", points: 0, feedback: "Friends are bradahs, not Aunty/Uncle!" }
        ],
        correct_answer: "Respectful term for any elder, not just relatives",
        explanation: "In Hawaii, 'Aunty' and 'Uncle' are respectful terms for elders, even if they're not related to you. Shows the importance of respecting kupuna (elders)!",
        category: "culture",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "culture", "respect"]
    },

    // Advanced Pidgin (5 questions)
    {
        question: "What's 'any kine' mean?",
        question_type: "multiple_choice",
        options: [
            { text: "Anything/whatever", points: 10, feedback: "Das it! Any kine works!" },
            { text: "Only one type", points: 0, feedback: "Nah, means anything!" },
            { text: "Nothing", points: 0, feedback: "Actually means anything/everything!" },
            { text: "Something specific", points: 0, feedback: "Any kine means whatever/anything!" }
        ],
        correct_answer: "Anything/whatever",
        explanation: "'Any kine' means anything, whatever, or any type. Very versatile phrase! 'You like any kine?' = 'Do you want anything?'",
        category: "expressions",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "versatile"]
    },
    {
        question: "What does 'stink eye' mean?",
        question_type: "multiple_choice",
        options: [
            { text: "Dirty look/mean glare", points: 10, feedback: "Correct! Better not give me stink eye!" },
            { text: "Pink eye infection", points: 3, feedback: "Nah, it's about da look someone gives!" },
            { text: "Smelly eyes", points: 0, feedback: "Nothing to do with smell brah!" },
            { text: "Crying", points: 0, feedback: "Stink eye is when someone glare at you!" }
        ],
        correct_answer: "Dirty look/mean glare",
        explanation: "'Stink eye' is a dirty look or mean glare someone gives you when they're upset or disapproving. Watch out for da stink eye!",
        category: "expressions",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "expressions"]
    },
    {
        question: "If something is 'hana hou', what does that mean?",
        question_type: "multiple_choice",
        options: [
            { text: "One more time/encore/again", points: 10, feedback: "Perfect! Hana hou means do it again!" },
            { text: "Finished/done", points: 0, feedback: "Nah, pau means finished. Hana hou means again!" },
            { text: "First time", points: 0, feedback: "Hana hou means one more time!" },
            { text: "Never", points: 0, feedback: "Hana hou means encore/again!" }
        ],
        correct_answer: "One more time/encore/again",
        explanation: "'Hana hou' is Hawaiian for 'do it again' or 'one more time'. Often yelled at concerts for an encore!",
        category: "hawaiian",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "hawaiian", "expressions"]
    },
    {
        question: "What's 'chicken skin'?",
        question_type: "multiple_choice",
        options: [
            { text: "Goosebumps", points: 10, feedback: "Das it! When something gives you da chills!" },
            { text: "Actual chicken skin", points: 3, feedback: "Can be, but in pidgin means goosebumps!" },
            { text: "Sunburn", points: 0, feedback: "Nah, chicken skin is goosebumps!" },
            { text: "Dry skin", points: 0, feedback: "Chicken skin means goosebumps brah!" }
        ],
        correct_answer: "Goosebumps",
        explanation: "'Chicken skin' is the pidgin term for goosebumps - when you get emotional chills or scared and your skin gets bumpy!",
        category: "expressions",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "physical"]
    },
    {
        question: "What's 'li dat' or 'lidat' mean?",
        question_type: "multiple_choice",
        options: [
            { text: "Like that/that's how it is", points: 10, feedback: "Correct! It stay li dat!" },
            { text: "Little that", points: 0, feedback: "Nah, li dat means 'like that'!" },
            { text: "Lie down", points: 0, feedback: "Li dat means like that!" },
            { text: "List of items", points: 0, feedback: "Li dat means like that/that's how it is!" }
        ],
        correct_answer: "Like that/that's how it is",
        explanation: "'Li dat' or 'lidat' is short for 'like that' - means that's how it is or that's the way. 'It stay li dat' = 'That's how it is'",
        category: "pidgin",
        difficulty: "advanced",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "common"]
    },

    // Bonus Mixed Difficulty (5 questions)
    {
        question: "What you going do when you 'pau work'?",
        question_type: "multiple_choice",
        options: [
            { text: "Go home/relax - you're done!", points: 10, feedback: "Das right! Time fo pau hana!" },
            { text: "Work harder", points: 0, feedback: "Pau means finished brah!" },
            { text: "Take a break", points: 5, feedback: "Close, but pau means completely done!" },
            { text: "Start new work", points: 0, feedback: "Nah, pau means finished!" }
        ],
        correct_answer: "Go home/relax - you're done!",
        explanation: "'Pau' means finished or done. 'Pau work' means done with work - time to go home and relax!",
        category: "expressions",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "work"]
    },
    {
        question: "What's 'bumbye'?",
        question_type: "multiple_choice",
        options: [
            { text: "Later/by and by/in a while", points: 10, feedback: "Correct! I do 'um bumbye!" },
            { text: "Goodbye", points: 5, feedback: "Can use when leaving, but means 'later'!" },
            { text: "Buy something", points: 0, feedback: "Bumbye means later, not buy!" },
            { text: "Right now", points: 0, feedback: "Nah, bumbye means later!" }
        ],
        correct_answer: "Later/by and by/in a while",
        explanation: "'Bumbye' (from 'by and by') means later, in a while, or eventually. 'I do 'um bumbye' = 'I'll do it later'",
        category: "expressions",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "time"]
    },
    {
        question: "Someone says 'No make ass'. What they mean?",
        question_type: "multiple_choice",
        options: [
            { text: "Don't embarrass yourself/me", points: 10, feedback: "Das it! No shame da family!" },
            { text: "Don't create something", points: 0, feedback: "Make ass means embarrass!" },
            { text: "Don't be lazy", points: 5, feedback: "Close to shame, but means don't embarrass!" },
            { text: "Don't work hard", points: 0, feedback: "Make ass means embarrass yourself!" }
        ],
        correct_answer: "Don't embarrass yourself/me",
        explanation: "'Make ass' or 'make ass' means to embarrass yourself or others. 'No make ass' = 'Don't embarrass yourself/me/us'!",
        category: "expressions",
        difficulty: "advanced",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "social"]
    },
    {
        question: "What's 'geev um'?",
        question_type: "multiple_choice",
        options: [
            { text: "Go for it!/Give it your all!", points: 10, feedback: "Das right! Geev um full power!" },
            { text: "Give someone something", points: 5, feedback: "Can mean that, but usually means go for it!" },
            { text: "Be gentle", points: 0, feedback: "Nah, geev um means go hard!" },
            { text: "Stop trying", points: 0, feedback: "Geev um means give it your all!" }
        ],
        correct_answer: "Go for it!/Give it your all!",
        explanation: "'Geev um' (give 'em) means go for it, give it your all, or put in maximum effort! Encouragement to do your best!",
        category: "expressions",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "motivation"]
    },
    {
        question: "What's 'kokua'?",
        question_type: "multiple_choice",
        options: [
            { text: "Help/assistance/cooperation", points: 10, feedback: "Perfect! Mahalo for your kokua!" },
            { text: "Coconut", points: 0, feedback: "Nah, kokua means help!" },
            { text: "Coffee", points: 0, feedback: "Kope is coffee, kokua is help!" },
            { text: "Confusion", points: 0, feedback: "Kokua means help/cooperation!" }
        ],
        correct_answer: "Help/assistance/cooperation",
        explanation: "'Kokua' is Hawaiian for help, assistance, or cooperation. Often seen on signs: 'Please kokua' = 'Please help/cooperate'",
        category: "hawaiian",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "hawaiian", "helpful"]
    }
];

async function addQuestions() {
    console.log('🎮 Adding 25 new quiz questions...\n');

    const { data, error } = await supabase
        .from('quiz_questions')
        .insert(questions)
        .select();

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`✅ Added ${data.length} questions!`);

    // Show breakdown by category
    const byCategory = {};
    data.forEach(q => {
        byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    });

    console.log('\n📊 Questions by category:');
    Object.entries(byCategory).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} questions`);
    });

    // Get new total
    const { data: allQuestions } = await supabase.from('quiz_questions').select('id');
    console.log(`\n🎯 New total: ${allQuestions ? allQuestions.length : 0} questions`);
}

addQuestions();
