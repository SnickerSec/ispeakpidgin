#!/usr/bin/env node

/**
 * Migration script: Quiz Questions to Supabase
 * Migrates all quiz questions from local JS file to Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
    console.log('\nTo get your service key:');
    console.log('1. Go to Supabase Dashboard → Project Settings → API');
    console.log('2. Copy the "service_role" key (NOT the anon key)');
    console.log('3. Run: SUPABASE_SERVICE_KEY="your-key" node tools/migrate-quiz-questions.js');
    process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load quiz data from local file
const quizDataPath = path.join(__dirname, '../src/components/games/quiz/quiz-data.js');

async function migrate() {
    console.log('❓ Starting quiz questions migration to Supabase...\n');

    // Read and parse the JS file
    if (!fs.existsSync(quizDataPath)) {
        console.error('❌ Quiz data file not found:', quizDataPath);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(quizDataPath, 'utf8');

    // Import the module dynamically
    const modulePath = path.resolve(quizDataPath);
    delete require.cache[modulePath]; // Clear cache
    const localQuizData = require(modulePath).localQuizData || require(modulePath);

    const questions = localQuizData.questions;
    console.log(`📦 Found ${questions.length} quiz questions to migrate\n`);

    // Transform questions for Supabase
    const transformedQuestions = questions.map(q => {
        return {
            question: q.question,
            question_type: 'multiple_choice',
            options: q.options.map(opt => ({
                text: opt.text,
                points: opt.points,
                feedback: opt.feedback
            })),
            correct_answer: q.options.find(opt => opt.points === 10)?.text || q.options[0].text,
            explanation: q.description,
            category: 'local_culture',
            difficulty: q.options.some(opt => opt.points === 10 && opt.points === Math.max(...q.options.map(o => o.points))) ? 'beginner' : 'intermediate',
            points: 10,
            tags: ['how_local_you_stay', 'culture', 'quiz']
        };
    });

    // Insert questions
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transformedQuestions.length; i++) {
        const question = transformedQuestions[i];
        console.log(`📤 Uploading question ${i + 1}/${transformedQuestions.length}: "${question.question.substring(0, 50)}..."...`);

        const { data, error } = await supabase
            .from('quiz_questions')
            .insert(question);

        if (error) {
            console.error(`   ❌ Failed:`, error.message);
            errorCount++;
        } else {
            console.log(`   ✅ Success`);
            successCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount} questions`);
    if (errorCount > 0) {
        console.log(`   ❌ Failed: ${errorCount} questions`);
    }
    console.log('='.repeat(50));

    // Verify by counting questions in database
    const { count, error: countError } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true });

    if (!countError) {
        console.log(`\n🔍 Verification: ${count} questions now in Supabase database`);
    }

    console.log('\n✨ Migration complete!\n');
}

migrate().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
