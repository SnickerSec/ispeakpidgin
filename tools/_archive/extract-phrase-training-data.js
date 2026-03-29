#!/usr/bin/env node

/**
 * Extract Phrase Training Data
 *
 * Extracts parallel phrase/sentence translations from:
 * - 1,001 phrases from phrases.json
 * - 20 pickup lines from pickup-lines.js
 * - Example sentences from dictionary entries
 *
 * Creates comprehensive training dataset for phrase-level translation
 */

const fs = require('fs');
const path = require('path');

// Load data sources
const phrasesPath = path.join(__dirname, '../data/views/phrases.json');
const masterPath = path.join(__dirname, '../data/master/pidgin-master.json');

console.log('🔍 Extracting phrase training data from multiple sources...\n');

const phrasesData = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

// Pickup lines (hardcoded from pickup-lines.js)
const pickupLines = [
    { pidgin: "You ono like da grindz!", english: "You're delicious like the food!" },
    { pidgin: "Howzit? You stay makin' my heart go buss!", english: "How's it going? You're making my heart race!" },
    { pidgin: "Eh, you mo' beautiful than da sunset at Waikiki!", english: "Hey, you're more beautiful than the sunset at Waikiki!" },
    { pidgin: "I no need da kine, I need you!", english: "I don't need anything else, I need you!" },
    { pidgin: "You stay broke da mouth good looking!", english: "You're incredibly good looking!" },
    { pidgin: "Can I take you out fo' some ono grindz?", english: "Can I take you out for some delicious food?" },
    { pidgin: "You make me feel mo' beta than pau hana time!", english: "You make me feel better than after-work time!" },
    { pidgin: "Shoots, you like go beach with me?", english: "Sure, would you like to go to the beach with me?" },
    { pidgin: "You da kine that make me like talk story all night!", english: "You're the type that makes me want to chat all night!" },
    { pidgin: "Brah, you get da most choke aloha in your smile!", english: "Friend, you have so much love in your smile!" },
    { pidgin: "Aunty, you gotta be a Kalua Pig because you make my mouth water, eh?", english: "You must be kalua pig because you make my mouth water!" },
    { pidgin: "You single? 'Cause I got one futon, we can go to Sandy's and watch the sunset, yeah?", english: "Are you single? I have a futon, we can go to Sandy's and watch the sunset!" },
    { pidgin: "Get out da way! You so pretty, you distracting my driving on the H3!", english: "Move over! You're so pretty, you're distracting my driving on the H3!" },
    { pidgin: "We should go cruisin' and get one shave ice. You know, to chill my heart down 'cause you so hot.", english: "We should go cruising and get shave ice to cool down my heart because you're so hot!" },
    { pidgin: "Ho, you one Mano? 'Cause you lookin' like the top of the food chain, sistah.", english: "Wow, are you a shark? Because you look like the top of the food chain!" },
    { pidgin: "You must be my Saimin order, 'cause you got everything I want inside.", english: "You must be my saimin order because you have everything I want!" },
    { pidgin: "I thought I was hungry, but when I see you, I forget 'bout da bentos.", english: "I thought I was hungry, but when I see you, I forget about the bentos!" },
    { pidgin: "My house not fancy, but if you come over, I can teach you how to say 'I love you' in Pidgin.", english: "My house isn't fancy, but I can teach you to say 'I love you' in Pidgin!" },
    { pidgin: "Eh, let's go throw net later... and catch one lifetime of happiness.", english: "Let's go fishing and catch a lifetime of happiness together!" },
    { pidgin: "You one Puka shell necklace? 'Cause I wanna keep you close to my heart, all da time.", english: "Are you a puka shell necklace? Because I want to keep you close to my heart!" }
];

const trainingData = [];

// 1. Extract from phrases.json (1,001 entries)
console.log('📚 Processing phrases.json...');
let phraseCount = 0;

phrasesData.phrases.forEach(phrase => {
    // Only use phrases (multi-word Pidgin)
    if (phrase.pidgin && phrase.english && phrase.pidgin.includes(' ')) {
        trainingData.push({
            pidgin: phrase.pidgin,
            english: phrase.english,
            source: 'phrases',
            category: phrase.category,
            difficulty: phrase.difficulty,
            pronunciation: phrase.pronunciation
        });
        phraseCount++;
    }
});

console.log(`  ✅ Extracted ${phraseCount} multi-word phrases`);

// 2. Extract example sentences from dictionary
console.log('📖 Processing dictionary examples...');
let exampleCount = 0;

masterData.entries.forEach(entry => {
    if (entry.examples && entry.examples.length > 0) {
        entry.examples.forEach(example => {
            // Try to extract English equivalent
            // Most examples are in Pidgin, so we need to translate them
            // For now, we'll create basic patterns

            trainingData.push({
                pidgin: example,
                english: inferEnglishFromPidginExample(example, entry),
                source: 'dictionary_example',
                category: entry.category,
                difficulty: entry.difficulty,
                relatedWord: entry.pidgin
            });
            exampleCount++;
        });
    }
});

console.log(`  ✅ Extracted ${exampleCount} example sentences`);

// 3. Add pickup lines
console.log('💕 Processing pickup lines...');
pickupLines.forEach(line => {
    trainingData.push({
        pidgin: line.pidgin,
        english: line.english,
        source: 'pickup_lines',
        category: 'expressions',
        difficulty: 'intermediate'
    });
});

console.log(`  ✅ Added ${pickupLines.length} pickup lines`);

// 4. Generate synthetic phrase variations
console.log('🔄 Generating synthetic variations...');
const syntheticPhrases = generateSyntheticPhrases();
syntheticPhrases.forEach(phrase => trainingData.push(phrase));
console.log(`  ✅ Generated ${syntheticPhrases.length} synthetic phrases`);

// Statistics
console.log('\n📊 Training Data Statistics:');
console.log(`  Total entries: ${trainingData.length}`);

const bySource = {};
const byCategory = {};
const byDifficulty = {};

trainingData.forEach(item => {
    bySource[item.source] = (bySource[item.source] || 0) + 1;
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    byDifficulty[item.difficulty] = (byDifficulty[item.difficulty] || 0) + 1;
});

console.log('\n  By Source:');
Object.entries(bySource).forEach(([source, count]) => {
    console.log(`    ${source}: ${count}`);
});

console.log('\n  By Category:');
Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([category, count]) => {
        console.log(`    ${category}: ${count}`);
    });

console.log('\n  By Difficulty:');
Object.entries(byDifficulty).forEach(([difficulty, count]) => {
    console.log(`    ${difficulty}: ${count}`);
});

// Save output
const outputPath = path.join(__dirname, '../data/phrase-training-data.json');
fs.writeFileSync(outputPath, JSON.stringify({
    metadata: {
        version: '1.0',
        created: new Date().toISOString(),
        totalPhrases: trainingData.length,
        sources: Object.keys(bySource),
        categories: Object.keys(byCategory).length,
        description: 'Parallel phrase/sentence translations for training phrase-level translator'
    },
    data: trainingData
}, null, 2));

console.log(`\n✅ Saved training data to: ${outputPath}`);

// Also create a simple lookup map for fast phrase translation
const phraseLookup = {};
trainingData.forEach(item => {
    const englishLower = item.english.toLowerCase();
    if (!phraseLookup[englishLower]) {
        phraseLookup[englishLower] = [];
    }
    phraseLookup[englishLower].push({
        pidgin: item.pidgin,
        category: item.category,
        difficulty: item.difficulty,
        source: item.source
    });
});

const lookupPath = path.join(__dirname, '../data/phrase-lookup.json');
fs.writeFileSync(lookupPath, JSON.stringify(phraseLookup, null, 2));
console.log(`✅ Saved phrase lookup to: ${lookupPath}\n`);

// Helper functions
function inferEnglishFromPidginExample(pidginExample, entry) {
    // Basic inference - replace Pidgin word with English equivalent
    let english = pidginExample;

    // Replace the main Pidgin word with English
    entry.english.forEach(eng => {
        const pidginWord = entry.pidgin;
        english = english.replace(new RegExp(pidginWord, 'gi'), eng);
    });

    // Basic Pidgin→English substitutions
    const substitutions = {
        'da': 'the',
        'dat': 'that',
        'dis': 'this',
        'dey': 'they',
        'dem': 'them',
        'fo': 'for',
        'wit': 'with',
        'wuz': 'was',
        'wuz': 'were',
        'goin': 'going',
        'gonna': 'going to',
        'wanna': 'want to',
        'gotta': 'got to',
        'stay': 'am/is/are',
        'no': 'don\'t',
        'mo\'': 'more'
    };

    Object.entries(substitutions).forEach(([pidgin, eng]) => {
        english = english.replace(new RegExp(`\\b${pidgin}\\b`, 'gi'), eng);
    });

    return english;
}

function generateSyntheticPhrases() {
    const synthetic = [];

    // Common phrase patterns
    const patterns = [
        { english: "How are you?", pidgin: "Howzit?", category: "greetings", difficulty: "beginner" },
        { english: "How are you doing?", pidgin: "Howzit goin'?", category: "greetings", difficulty: "beginner" },
        { english: "What's up?", pidgin: "Wassup?", category: "greetings", difficulty: "beginner" },
        { english: "See you later", pidgin: "Latahs", category: "greetings", difficulty: "beginner" },
        { english: "See you later", pidgin: "Catch you latahs", category: "greetings", difficulty: "beginner" },
        { english: "I don't know", pidgin: "I dunno", category: "expressions", difficulty: "beginner" },
        { english: "I don't know", pidgin: "No can tell", category: "expressions", difficulty: "intermediate" },
        { english: "Let's go", pidgin: "We go", category: "expressions", difficulty: "beginner" },
        { english: "Let's go eat", pidgin: "We go grindz", category: "food", difficulty: "intermediate" },
        { english: "I'm hungry", pidgin: "I stay hungry", category: "food", difficulty: "beginner" },
        { english: "That's delicious", pidgin: "Dass ono", category: "food", difficulty: "beginner" },
        { english: "That's really good", pidgin: "Dass broke da mouth", category: "expressions", difficulty: "intermediate" },
        { english: "That's really good", pidgin: "Dass one", category: "expressions", difficulty: "intermediate" },
        { english: "No problem", pidgin: "No worries", category: "expressions", difficulty: "beginner" },
        { english: "No problem", pidgin: "'A'ole pilikia", category: "expressions", difficulty: "intermediate" },
        { english: "Thank you very much", pidgin: "Mahalo nui loa", category: "greetings", difficulty: "intermediate" },
        { english: "I'm going home", pidgin: "I going home", category: "actions", difficulty: "beginner" },
        { english: "I'm finished with work", pidgin: "I pau hana", category: "actions", difficulty: "intermediate" },
        { english: "Be careful", pidgin: "Watch out", category: "expressions", difficulty: "beginner" },
        { english: "Be careful", pidgin: "No make ass", category: "expressions", difficulty: "intermediate" },
        { english: "That's broken", pidgin: "Dass buss", category: "descriptions", difficulty: "beginner" },
        { english: "That's really broken", pidgin: "Dass all hamajang", category: "descriptions", difficulty: "intermediate" },
        { english: "I'm tired", pidgin: "I stay tired", category: "emotions", difficulty: "beginner" },
        { english: "I'm very tired", pidgin: "I all poho", category: "emotions", difficulty: "intermediate" },
        { english: "What do you want?", pidgin: "What you like?", category: "questions", difficulty: "beginner" },
        { english: "Do you want to go?", pidgin: "You like go?", category: "questions", difficulty: "beginner" },
        { english: "Where are you going?", pidgin: "Wea you going?", category: "questions", difficulty: "beginner" },
        { english: "What is that?", pidgin: "What dat?", category: "questions", difficulty: "beginner" },
        { english: "Who is that?", pidgin: "Who dat?", category: "questions", difficulty: "beginner" }
    ];

    patterns.forEach(pattern => {
        synthetic.push({
            ...pattern,
            source: 'synthetic'
        });
    });

    return synthetic;
}

console.log('✅ Done!\n');
