#!/usr/bin/env node
/**
 * Add More Quiz Questions - Simple version
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

// Questions matching exact database schema (no image field!)
const questions = [
    {
        question: "What's da proper way fo say 'thank you' in Hawaiian?",
        question_type: "multiple_choice",
        options: [
            { text: "Mahalo", points: 10, feedback: "Das right! Mahalo means thank you!" },
            { text: "Aloha", points: 5, feedback: "Aloha means hello/goodbye/love, but try again!" },
            { text: "Shoots", points: 3, feedback: "Shoots means 'okay', not thank you!" },
            { text: "Rajah", points: 0, feedback: "Rajah means 'I understand', not thank you!" }
        ],
        correct_answer: "Mahalo",
        explanation: "Mahalo is the Hawaiian word for thank you, used throughout the islands.",
        category: "language",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "hawaiian", "language"]
    },
    {
        question: "What does 'pau hana' mean?",
        question_type: "multiple_choice",
        options: [
            { text: "Done with work/after work", points: 10, feedback: "Correct! Time fo relax!" },
            { text: "Start work", points: 0, feedback: "Nah, das da opposite!" },
            { text: "Lunch break", points: 3, feedback: "Close, but pau means finished!" },
            { text: "Weekend", points: 5, feedback: "Not quite, but you on da right track!" }
        ],
        correct_answer: "Done with work/after work",
        explanation: "Pau hana literally means 'finished work' - often refers to after-work drinks or relaxation.",
        category: "language",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "work"]
    },
    {
        question: "What's 'da kine' mean?",
        question_type: "multiple_choice",
        options: [
            { text: "The thing/whatchamacallit", points: 10, feedback: "Exactly! Da most useful word!" },
            { text: "The king", points: 0, feedback: "Nah, das not it!" },
            { text: "The best", points: 5, feedback: "Sometimes, but mainly means 'the thing'!" },
            { text: "The food", points: 3, feedback: "Can mean dat, but it's more versatile!" }
        ],
        correct_answer: "The thing/whatchamacallit",
        explanation: "Da kine is the ultimate pidgin word - can mean anything based on context!",
        category: "language",
        difficulty: "intermediate",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "essential"]
    },
    {
        question: "You going beach. What you bringing fo your feet?",
        question_type: "multiple_choice",
        options: [
            { text: "Slippahs", points: 10, feedback: "Das it! Slippahs all day!" },
            { text: "Flip-flops", points: 5, feedback: "Right ting, wrong word brah!" },
            { text: "Sandals", points: 3, feedback: "Too fancy! We call 'em slippahs!" },
            { text: "Shoes", points: 0, feedback: "Shoes at da beach? You stay lost!" }
        ],
        correct_answer: "Slippahs",
        explanation: "In Hawaii, flip-flops are called 'slippahs' - essential footwear for island living!",
        category: "culture",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "beach"]
    },
    {
        question: "Someone tells you 'talk story'. What they want?",
        question_type: "multiple_choice",
        options: [
            { text: "Chat and catch up", points: 10, feedback: "Das right! Time fo talk story!" },
            { text: "Tell a fictional story", points: 3, feedback: "Nah, more casual than dat!" },
            { text: "Gossip about someone", points: 5, feedback: "Can be dat, but mainly just chatting!" },
            { text: "Give a speech", points: 0, feedback: "Too formal! Talk story is casual!" }
        ],
        correct_answer: "Chat and catch up",
        explanation: "'Talk story' means to have a casual conversation - a fundamental part of local culture!",
        category: "language",
        difficulty: "beginner",
        points: 10,
        tags: ["how_local_you_stay", "pidgin", "social"]
    }
];

async function addQuestions() {
    console.log('🎮 Adding quiz questions...\n');

    const { data, error } = await supabase
        .from('quiz_questions')
        .insert(questions)
        .select();

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`✅ Added ${data.length} questions!`);
    console.log('\nNew total:', await getTotalCount());
}

async function getTotalCount() {
    const { data } = await supabase.from('quiz_questions').select('id');
    return data ? data.length : 0;
}

addQuestions();
