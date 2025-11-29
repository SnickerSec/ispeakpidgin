#!/usr/bin/env node

/**
 * Migrate Missing Data to Supabase
 * Adds the actual pickup lines and quiz questions from local JS files
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
    console.log('\nRun: SUPABASE_SERVICE_KEY="your-key" node tools/migrate-missing-data.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// ACTUAL PICKUP LINES FROM pickup-lines-data.js
// ============================================
const pickupLines = [
    {
        pidgin: "You ono like da grindz!",
        english: "You're delicious like the food!",
        category: "food",
        spiciness: 2
    },
    {
        pidgin: "Howzit? You stay makin' my heart go buss!",
        english: "How's it going? You're making my heart race!",
        category: "romantic",
        spiciness: 2
    },
    {
        pidgin: "Eh, you mo' beautiful than da sunset at Waikiki!",
        english: "Hey, you're more beautiful than the sunset at Waikiki!",
        category: "romantic",
        spiciness: 1
    },
    {
        pidgin: "I no need da kine, I need you!",
        english: "I don't need anything else, I need you!",
        category: "romantic",
        spiciness: 2
    },
    {
        pidgin: "You stay broke da mouth good looking!",
        english: "You're incredibly good looking!",
        category: "romantic",
        spiciness: 2
    },
    {
        pidgin: "Can I take you out fo' some ono grindz?",
        english: "Can I take you out for some delicious food?",
        category: "food",
        spiciness: 1
    },
    {
        pidgin: "You make me feel mo' beta than pau hana time!",
        english: "You make me feel better than after-work time!",
        category: "romantic",
        spiciness: 1
    },
    {
        pidgin: "Shoots, you like go beach with me?",
        english: "Sure, would you like to go to the beach with me?",
        category: "classic",
        spiciness: 1
    },
    {
        pidgin: "You da kine that make me like talk story all night!",
        english: "You're the type that makes me want to chat all night!",
        category: "romantic",
        spiciness: 2
    },
    {
        pidgin: "Brah, you get da most choke aloha in your smile!",
        english: "Friend, you have so much love in your smile!",
        category: "sweet",
        spiciness: 1
    },
    {
        pidgin: "Aunty, you gotta be a Kalua Pig because you make my mouth water, eh?",
        english: "You must be kalua pig because you make my mouth water!",
        category: "food",
        spiciness: 3
    },
    {
        pidgin: "You single? 'Cause I got one futon, we can go to Sandy's and watch the sunset, yeah?",
        english: "Are you single? I have a futon, we can go to Sandy's and watch the sunset!",
        category: "bold",
        spiciness: 3
    },
    {
        pidgin: "Get out da way! You so pretty, you distracting my driving on the H3!",
        english: "Move over! You're so pretty, you're distracting my driving on the H3!",
        category: "funny",
        spiciness: 2
    },
    {
        pidgin: "We should go cruisin' and get one shave ice. You know, to chill my heart down 'cause you so hot.",
        english: "We should go cruising and get shave ice to cool down my heart because you're so hot!",
        category: "sweet",
        spiciness: 2
    },
    {
        pidgin: "Ho, you one Mano? 'Cause you lookin' like the top of the food chain, sistah.",
        english: "Wow, are you a shark? Because you look like the top of the food chain!",
        category: "bold",
        spiciness: 3
    },
    {
        pidgin: "You must be my Saimin order, 'cause you got everything I want inside.",
        english: "You must be my saimin order because you have everything I want!",
        category: "food",
        spiciness: 3
    },
    {
        pidgin: "I thought I was hungry, but when I see you, I forget 'bout da bentos.",
        english: "I thought I was hungry, but when I see you, I forget about the bentos!",
        category: "food",
        spiciness: 2
    },
    {
        pidgin: "My house not fancy, but if you come over, I can teach you how to say 'I love you' in Pidgin.",
        english: "My house isn't fancy, but I can teach you to say 'I love you' in Pidgin!",
        category: "romantic",
        spiciness: 3
    },
    {
        pidgin: "Eh, let's go throw net later... and catch one lifetime of happiness.",
        english: "Let's go fishing and catch a lifetime of happiness together!",
        category: "romantic",
        spiciness: 2
    },
    {
        pidgin: "You one Puka shell necklace? 'Cause I wanna keep you close to my heart, all da time.",
        english: "Are you a puka shell necklace? Because I want to keep you close to my heart!",
        category: "sweet",
        spiciness: 2
    }
];

// ============================================
// ACTUAL QUIZ QUESTIONS FROM local-quiz-data.js
// ============================================
const quizQuestions = [
    {
        question: "What you call this? 🍧",
        question_type: "multiple_choice",
        options: ["Snow Cone", "Shaved Ice", "Shave Ice", "Ice Kona"],
        correct_answer: "Shave Ice",
        explanation: "In Hawaii, we call it 'Shave Ice' (not 'Shaved Ice') - it's a local tradition!",
        category: "food",
        difficulty: "beginner",
        points: 10
    },
    {
        question: "When somebody says 'Howzit?' what you say back?",
        question_type: "multiple_choice",
        options: ["I'm fine, how are you?", "Howzit!", "Hello, good morning!", "Shoots!"],
        correct_answer: "Howzit!",
        explanation: "Keep it simple - just say 'Howzit!' back. Das da local way!",
        category: "greetings",
        difficulty: "beginner",
        points: 10
    },
    {
        question: "What's the proper way to take off your slippers before entering a house?",
        question_type: "multiple_choice",
        options: ["Leave them on", "Take them off at the door", "Take them off if asked", "Kick them off anywhere"],
        correct_answer: "Take them off at the door",
        explanation: "Always take off slippers at the door - any local auntie will tell you that!",
        category: "culture",
        difficulty: "beginner",
        points: 10
    },
    {
        question: "What time is 'pau hana'?",
        question_type: "multiple_choice",
        options: ["Breakfast time", "Lunch break", "After work/End of work day", "Bedtime"],
        correct_answer: "After work/End of work day",
        explanation: "'Pau' means finished and 'hana' means work. Pau hana = time to relax!",
        category: "expressions",
        difficulty: "beginner",
        points: 10
    },
    {
        question: "Somebody brings a cooler to the beach. What's inside?",
        question_type: "multiple_choice",
        options: ["Water bottles", "Beer and poke", "Sandwiches", "Soda"],
        correct_answer: "Beer and poke",
        explanation: "Das how local do 'em! Beach day means cold drinks and poke!",
        category: "culture",
        difficulty: "intermediate",
        points: 10
    },
    {
        question: "What you call flip-flops in Hawaii?",
        question_type: "multiple_choice",
        options: ["Flip-flops", "Sandals", "Slippers", "Thongs"],
        correct_answer: "Slippers",
        explanation: "In Hawaii, we call them slippers - not flip-flops!",
        category: "vocabulary",
        difficulty: "beginner",
        points: 10
    },
    {
        question: "What's the best place for plate lunch?",
        question_type: "multiple_choice",
        options: ["Panda Express", "The local lunch wagon", "McDonald's", "Any place with AC"],
        correct_answer: "The local lunch wagon",
        explanation: "Local lunch wagons have da best grindz! Support local!",
        category: "food",
        difficulty: "beginner",
        points: 10
    },
    {
        question: "How you give directions in Hawaii?",
        question_type: "multiple_choice",
        options: ["Turn left on Main Street", "Go mauka by da old Zippy's", "Use GPS coordinates", "It's 2.5 miles north"],
        correct_answer: "Go mauka by da old Zippy's",
        explanation: "Locals use landmarks and mauka/makai (mountain/ocean) for directions!",
        category: "culture",
        difficulty: "intermediate",
        points: 10
    },
    {
        question: "Somebody says 'We go beach'. When you leaving?",
        question_type: "multiple_choice",
        options: ["Right now", "In about an hour... or two... or whenever", "At exactly 2:00 PM", "Tomorrow"],
        correct_answer: "In about an hour... or two... or whenever",
        explanation: "Island time! 'We go' means today, but no rush - relax!",
        category: "culture",
        difficulty: "intermediate",
        points: 10
    },
    {
        question: "What's 'da kine'?",
        question_type: "multiple_choice",
        options: ["I don't know", "That thing, you know, da kine!", "A specific item", "Broken English"],
        correct_answer: "That thing, you know, da kine!",
        explanation: "'Da kine' can mean anything - it's the ultimate pidgin placeholder word!",
        category: "expressions",
        difficulty: "beginner",
        points: 10
    },
    {
        question: "How you eat your musubi?",
        question_type: "multiple_choice",
        options: ["With a fork and knife", "Just bite 'em", "Cut into small pieces", "What's a musubi?"],
        correct_answer: "Just bite 'em",
        explanation: "No need fancy - just grab and bite! Das da local way!",
        category: "food",
        difficulty: "beginner",
        points: 10
    },
    {
        question: "Traffic on H-1. What you do?",
        question_type: "multiple_choice",
        options: ["Honk and get mad", "Just wait, listen music, no stress", "Take a different route", "Call in sick"],
        correct_answer: "Just wait, listen music, no stress",
        explanation: "Das da local way! Get aloha spirit - no can rush anyway!",
        category: "culture",
        difficulty: "intermediate",
        points: 10
    }
];

// ============================================
// MIGRATION FUNCTIONS
// ============================================

async function migratePickupLines() {
    console.log('\n💕 Migrating Actual Pickup Lines...');

    // First, clear existing (to avoid duplicates from the hardcoded fallback)
    const { error: deleteError } = await supabase
        .from('pickup_lines')
        .delete()
        .neq('id', 0); // Delete all

    if (deleteError) {
        console.error('   ⚠️ Could not clear existing pickup lines:', deleteError.message);
    }

    // Insert actual pickup lines
    const { error, data } = await supabase
        .from('pickup_lines')
        .insert(pickupLines.map(line => ({
            pidgin: line.pidgin,
            english: line.english,
            category: line.category,
            spiciness: line.spiciness,
            context: null,
            tags: []
        })));

    if (error) {
        console.error('   ❌ Error inserting pickup lines:', error.message);
        return 0;
    }

    console.log(`   ✅ Migrated ${pickupLines.length} pickup lines`);
    return pickupLines.length;
}

async function migrateQuizQuestions() {
    console.log('\n❓ Migrating Actual Quiz Questions...');

    // First, clear existing (to avoid duplicates from the hardcoded fallback)
    const { error: deleteError } = await supabase
        .from('quiz_questions')
        .delete()
        .neq('id', 0); // Delete all

    if (deleteError) {
        console.error('   ⚠️ Could not clear existing quiz questions:', deleteError.message);
    }

    // Insert actual quiz questions
    const { error } = await supabase
        .from('quiz_questions')
        .insert(quizQuestions.map(q => ({
            question: q.question,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            category: q.category,
            difficulty: q.difficulty,
            points: q.points,
            tags: []
        })));

    if (error) {
        console.error('   ❌ Error inserting quiz questions:', error.message);
        return 0;
    }

    console.log(`   ✅ Migrated ${quizQuestions.length} quiz questions`);
    return quizQuestions.length;
}

async function showCurrentCounts() {
    console.log('\n📊 Current Supabase Data Counts:');

    const tables = ['dictionary_entries', 'phrases', 'stories', 'crossword_words', 'pickup_lines', 'quiz_questions'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`   ${table}: Error - ${error.message}`);
        } else {
            console.log(`   ${table}: ${count} records`);
        }
    }
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('🚀 Migrating Missing Data to Supabase...');
    console.log('='.repeat(50));

    await showCurrentCounts();

    const pickupCount = await migratePickupLines();
    const quizCount = await migrateQuizQuestions();

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   💕 Pickup Lines: ${pickupCount}`);
    console.log(`   ❓ Quiz Questions: ${quizCount}`);
    console.log('='.repeat(50));

    await showCurrentCounts();

    console.log('\n✨ Migration complete!');
}

main().catch(console.error);
