#!/usr/bin/env node

/**
 * Migration script: Crossword Puzzles to Supabase
 * Migrates all 21 crossword puzzles from local JS file to Supabase
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
    console.log('3. Run: SUPABASE_SERVICE_KEY="your-key" node tools/migrate-crossword-puzzles.js');
    process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load crossword data from local file
const crosswordDataPath = path.join(__dirname, '../src/components/games/crossword/crossword-data.js');

async function migrate() {
    console.log('🧩 Starting crossword puzzle migration to Supabase...\n');

    // Read and parse the JS file
    if (!fs.existsSync(crosswordDataPath)) {
        console.error('❌ Crossword data file not found:', crosswordDataPath);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(crosswordDataPath, 'utf8');

    // Import the module dynamically
    const modulePath = path.resolve(crosswordDataPath);
    delete require.cache[modulePath]; // Clear cache
    const crosswordPuzzles = require(modulePath).crosswordPuzzles || require(modulePath);

    // Filter to only puzzle objects (puzzle1, puzzle2, etc), not helper functions
    const puzzleKeys = Object.keys(crosswordPuzzles).filter(key => key.startsWith('puzzle'));
    console.log(`📦 Found ${puzzleKeys.length} puzzles to migrate\n`);

    // Transform puzzles for Supabase
    const transformedPuzzles = puzzleKeys.map(key => {
        const puzzle = crosswordPuzzles[key];
        return {
            puzzle_id: key,
            title: puzzle.title,
            description: puzzle.description,
            theme: puzzle.theme,
            difficulty: puzzle.difficulty,
            grid_size: puzzle.size,
            grid: puzzle.grid,
            words_across: puzzle.words.across,
            words_down: puzzle.words.down,
            used_on: null // Not yet used as daily puzzle
        };
    });

    // Insert puzzles
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transformedPuzzles.length; i++) {
        const puzzle = transformedPuzzles[i];
        console.log(`📤 Uploading puzzle ${i + 1}/${transformedPuzzles.length}: "${puzzle.title}"...`);

        const { data, error } = await supabase
            .from('crossword_puzzles')
            .upsert(puzzle, { onConflict: 'puzzle_id' });

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
    console.log(`   ✅ Successfully migrated: ${successCount} puzzles`);
    if (errorCount > 0) {
        console.log(`   ❌ Failed: ${errorCount} puzzles`);
    }
    console.log('='.repeat(50));

    // Verify by counting puzzles in database
    const { count, error: countError } = await supabase
        .from('crossword_puzzles')
        .select('*', { count: 'exact', head: true });

    if (!countError) {
        console.log(`\n🔍 Verification: ${count} puzzles now in Supabase database`);
    }

    console.log('\n✨ Migration complete!\n');
}

migrate().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
