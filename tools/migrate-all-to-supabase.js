#!/usr/bin/env node

/**
 * Complete Migration Script: All Data to Supabase
 * Migrates phrases, stories, crossword words, pickup lines, and quiz data
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
    console.log('\nRun: SUPABASE_SERVICE_KEY="your-key" node tools/migrate-all-to-supabase.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// MIGRATION FUNCTIONS
// ============================================

async function migratePhrases() {
    console.log('\n📝 Migrating Phrases...');

    const phrasesPath = path.join(__dirname, '../data/views/phrases.json');
    if (!fs.existsSync(phrasesPath)) {
        console.log('   ⚠️ Phrases file not found, skipping');
        return 0;
    }

    const data = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
    const phrases = data.phrases || [];

    const transformed = phrases.map((p, i) => ({
        pidgin: p.pidgin,
        english: p.english,
        category: p.category || null,
        context: p.context || null,
        pronunciation: p.pronunciation || null,
        source: p.source || null,
        difficulty: p.difficulty || 'beginner',
        tags: p.tags || []
    }));

    // Insert in batches
    const batchSize = 100;
    let successCount = 0;

    for (let i = 0; i < transformed.length; i += batchSize) {
        const batch = transformed.slice(i, i + batchSize);
        const { error } = await supabase.from('phrases').upsert(batch, {
            onConflict: 'pidgin,english',
            ignoreDuplicates: true
        });

        if (error) {
            // Try inserting one by one to skip duplicates
            for (const item of batch) {
                const { error: singleError } = await supabase.from('phrases').insert(item);
                if (!singleError) successCount++;
            }
        } else {
            successCount += batch.length;
        }
    }

    console.log(`   ✅ Migrated ${successCount} phrases`);
    return successCount;
}

async function migrateStories() {
    console.log('\n📚 Migrating Stories...');

    // Try to load from stories-data.js
    const storiesPath = path.join(__dirname, '../data/content/stories-data.js');
    let stories = [];

    if (fs.existsSync(storiesPath)) {
        const content = fs.readFileSync(storiesPath, 'utf8');
        // Extract stories array from JS file
        const match = content.match(/stories:\s*\[([\s\S]*?)\]\s*,\s*metadata/);
        if (match) {
            try {
                // This is a bit hacky but works for this format
                const storiesJs = 'module.exports = ' + content;
                const tempPath = '/tmp/stories-temp.js';
                fs.writeFileSync(tempPath, content);
                const storiesModule = require(tempPath);
                stories = storiesModule.stories || [];
                fs.unlinkSync(tempPath);
            } catch (e) {
                console.log('   ⚠️ Could not parse stories JS, trying manual extraction');
            }
        }
    }

    // Fallback: try master data
    if (stories.length === 0) {
        const masterPath = path.join(__dirname, '../data/master/pidgin-master.json');
        if (fs.existsSync(masterPath)) {
            const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
            stories = masterData.content?.stories || [];
        }
    }

    if (stories.length === 0) {
        console.log('   ⚠️ No stories found, skipping');
        return 0;
    }

    const transformed = stories.map(s => ({
        id: s.id,
        title: s.title,
        pidgin_text: s.pidginText,
        english_translation: s.englishTranslation,
        cultural_notes: s.culturalNotes || null,
        vocabulary: s.vocabulary || [],
        audio_example: s.audioExample || null,
        tags: s.tags || [],
        difficulty: s.difficulty || 'intermediate'
    }));

    const { error } = await supabase.from('stories').upsert(transformed, { onConflict: 'id' });

    if (error) {
        console.error('   ❌ Stories migration error:', error.message);
        return 0;
    }

    console.log(`   ✅ Migrated ${transformed.length} stories`);
    return transformed.length;
}

async function migrateCrosswordWords() {
    console.log('\n🎮 Migrating Crossword Words...');

    const crosswordPath = path.join(__dirname, '../data/games/crossword-words.json');
    if (!fs.existsSync(crosswordPath)) {
        console.log('   ⚠️ Crossword words file not found, skipping');
        return 0;
    }

    const data = JSON.parse(fs.readFileSync(crosswordPath, 'utf8'));
    const words = data.words || [];

    const transformed = words.map(w => ({
        word: w.word,
        display_word: w.displayWord,
        clue: w.clue,
        clue_pidgin: w.cluePidgin || null,
        category: w.category || null,
        difficulty: w.difficulty || 'beginner',
        length: w.length || w.word.length,
        pronunciation: w.pronunciation || null,
        example: w.example || null
    }));

    // Insert in batches
    const batchSize = 100;
    let successCount = 0;

    for (let i = 0; i < transformed.length; i += batchSize) {
        const batch = transformed.slice(i, i + batchSize);
        const { error } = await supabase.from('crossword_words').insert(batch);

        if (error) {
            console.error(`   ⚠️ Batch error: ${error.message}`);
        } else {
            successCount += batch.length;
        }
    }

    console.log(`   ✅ Migrated ${successCount} crossword words`);
    return successCount;
}

async function migratePickupLines() {
    console.log('\n💕 Migrating Pickup Lines...');

    // Try to load from pickup-lines-data.js or comprehensive data
    const pickupPath = path.join(__dirname, '../data/content/pickup-lines-data.js');
    let pickupLines = [];

    if (fs.existsSync(pickupPath)) {
        try {
            const content = fs.readFileSync(pickupPath, 'utf8');
            // Try to extract the data
            const tempPath = '/tmp/pickup-temp.js';
            fs.writeFileSync(tempPath, content);
            const module = require(tempPath);
            pickupLines = module.pickupLines || module.lines || [];
            fs.unlinkSync(tempPath);
        } catch (e) {
            console.log('   ⚠️ Could not parse pickup lines JS');
        }
    }

    // Try master data
    if (pickupLines.length === 0) {
        const masterPath = path.join(__dirname, '../data/master/pidgin-master.json');
        if (fs.existsSync(masterPath)) {
            const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
            pickupLines = masterData.content?.pickupLines || [];
        }
    }

    if (pickupLines.length === 0) {
        // Hardcode some default pickup lines
        pickupLines = [
            { pidgin: "Eh, you so ono, you broke da mouth!", english: "Hey, you're so delicious, you broke my mouth!", category: "food", spiciness: 2 },
            { pidgin: "You must be one sunset, cuz you stay making my heart stay all warm inside", english: "You must be a sunset, because you're making my heart feel all warm inside", category: "romantic", spiciness: 1 },
            { pidgin: "Brah, if you was one wave, I'd ride you all day", english: "Bro, if you were a wave, I'd ride you all day", category: "surf", spiciness: 4 },
            { pidgin: "You stay so fine, even da menehune would come out fo' see you", english: "You're so beautiful, even the little Hawaiian spirits would come out to see you", category: "cultural", spiciness: 2 },
            { pidgin: "My heart stay going boom boom like one Taiko drum wen I see you", english: "My heart is beating like a Taiko drum when I see you", category: "romantic", spiciness: 1 },
            { pidgin: "Eh girl, you like go grind? I know one good kaukau place", english: "Hey girl, want to go eat? I know a good food place", category: "food", spiciness: 2 },
            { pidgin: "You da poke to my bowl", english: "You're the poke to my bowl", category: "food", spiciness: 1 },
            { pidgin: "If loving you was wrong, I no like be right, brah", english: "If loving you was wrong, I don't want to be right, bro", category: "romantic", spiciness: 2 },
            { pidgin: "You must be from da Big Island, cuz you stay erupting in my heart", english: "You must be from the Big Island, because you're erupting in my heart", category: "cultural", spiciness: 3 },
            { pidgin: "You stay mo' refreshing than one shave ice on one hot day", english: "You're more refreshing than a shave ice on a hot day", category: "food", spiciness: 1 }
        ];
    }

    const transformed = pickupLines.map(p => ({
        pidgin: p.pidgin,
        english: p.english,
        category: p.category || 'romantic',
        spiciness: p.spiciness || 2,
        context: p.context || null,
        tags: p.tags || []
    }));

    const { error } = await supabase.from('pickup_lines').insert(transformed);

    if (error) {
        console.error('   ❌ Pickup lines migration error:', error.message);
        return 0;
    }

    console.log(`   ✅ Migrated ${transformed.length} pickup lines`);
    return transformed.length;
}

async function migrateQuizQuestions() {
    console.log('\n❓ Migrating Quiz Questions...');

    // Try to load quiz data
    const quizPath = path.join(__dirname, '../public/js/data/local-quiz-data.js');
    let questions = [];

    if (fs.existsSync(quizPath)) {
        try {
            const content = fs.readFileSync(quizPath, 'utf8');
            const tempPath = '/tmp/quiz-temp.js';
            // Add module wrapper
            const wrappedContent = content + '\nmodule.exports = { localQuizQuestions: typeof localQuizQuestions !== "undefined" ? localQuizQuestions : [] };';
            fs.writeFileSync(tempPath, wrappedContent);
            const module = require(tempPath);
            questions = module.localQuizQuestions || [];
            fs.unlinkSync(tempPath);
        } catch (e) {
            console.log('   ⚠️ Could not parse quiz data:', e.message);
        }
    }

    if (questions.length === 0) {
        // Default quiz questions
        questions = [
            {
                question: "What does 'Howzit' mean?",
                question_type: "multiple_choice",
                options: ["How are you?", "Where is it?", "What time?", "Who is it?"],
                correct_answer: "How are you?",
                explanation: "'Howzit' is a common Hawaiian Pidgin greeting meaning 'How's it going?' or 'How are you?'",
                category: "greetings",
                difficulty: "beginner"
            },
            {
                question: "What does 'da kine' mean?",
                question_type: "multiple_choice",
                options: ["The thing/whatchamacallit", "The king", "The kind", "The car"],
                correct_answer: "The thing/whatchamacallit",
                explanation: "'Da kine' is a versatile Hawaiian Pidgin term used as a placeholder for any noun you can't remember",
                category: "expressions",
                difficulty: "beginner"
            },
            {
                question: "What does 'broke da mouth' mean?",
                question_type: "multiple_choice",
                options: ["Extremely delicious", "Broke your jaw", "Can't speak", "Loud noise"],
                correct_answer: "Extremely delicious",
                explanation: "'Broke da mouth' describes food so delicious it figuratively broke your mouth",
                category: "food",
                difficulty: "beginner"
            },
            {
                question: "What is 'pau hana'?",
                question_type: "multiple_choice",
                options: ["After work", "Before work", "Lunch break", "Vacation"],
                correct_answer: "After work",
                explanation: "'Pau' means finished and 'hana' means work, so 'pau hana' refers to after-work time",
                category: "expressions",
                difficulty: "beginner"
            },
            {
                question: "What does 'ono' mean?",
                question_type: "multiple_choice",
                options: ["Delicious", "Hungry", "Full", "Tired"],
                correct_answer: "Delicious",
                explanation: "'Ono' is Hawaiian for delicious or tasty",
                category: "food",
                difficulty: "beginner"
            }
        ];
    }

    const transformed = questions.map(q => ({
        question: q.question,
        question_type: q.question_type || 'multiple_choice',
        options: q.options || [],
        correct_answer: q.correct_answer || q.answer,
        explanation: q.explanation || null,
        category: q.category || 'general',
        difficulty: q.difficulty || 'beginner',
        points: q.points || 10,
        tags: q.tags || []
    }));

    const { error } = await supabase.from('quiz_questions').insert(transformed);

    if (error) {
        console.error('   ❌ Quiz questions migration error:', error.message);
        return 0;
    }

    console.log(`   ✅ Migrated ${transformed.length} quiz questions`);
    return transformed.length;
}

// ============================================
// MAIN MIGRATION
// ============================================

async function migrateAll() {
    console.log('🚀 Starting Complete Migration to Supabase...');
    console.log('='.repeat(50));

    const results = {
        phrases: 0,
        stories: 0,
        crosswordWords: 0,
        pickupLines: 0,
        quizQuestions: 0
    };

    try {
        results.phrases = await migratePhrases();
        results.stories = await migrateStories();
        results.crosswordWords = await migrateCrosswordWords();
        results.pickupLines = await migratePickupLines();
        results.quizQuestions = await migrateQuizQuestions();
    } catch (error) {
        console.error('\n❌ Migration error:', error);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   📝 Phrases: ${results.phrases}`);
    console.log(`   📚 Stories: ${results.stories}`);
    console.log(`   🎮 Crossword Words: ${results.crosswordWords}`);
    console.log(`   💕 Pickup Lines: ${results.pickupLines}`);
    console.log(`   ❓ Quiz Questions: ${results.quizQuestions}`);
    console.log('='.repeat(50));

    const total = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`\n✨ Total items migrated: ${total}`);
}

migrateAll().catch(console.error);
