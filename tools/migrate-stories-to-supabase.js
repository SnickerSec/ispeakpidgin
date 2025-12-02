#!/usr/bin/env node
/**
 * Migrate Stories to Supabase
 * Migrates all stories from pidgin-master.json to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_KEY not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateStories() {
    console.log('📚 Migrating stories to Supabase...\n');

    // Load master data
    const masterPath = path.join(__dirname, '../data/master/pidgin-master.json');
    const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

    const stories = masterData.content.stories;
    console.log(`Found ${stories.length} stories to migrate\n`);

    // Transform stories to match Supabase schema
    const storiesForDb = stories.map(story => ({
        id: story.id,
        title: story.title,
        pidgin_text: story.pidginText,
        english_translation: story.englishTranslation,
        cultural_notes: story.culturalNotes,
        vocabulary: story.vocabulary,
        difficulty: story.difficulty || 'intermediate',
        tags: story.tags || [],
        audio_example: story.audioUrl || null
    }));

    // Check if stories already exist
    const { data: existing } = await supabase
        .from('stories')
        .select('id');

    if (existing && existing.length > 0) {
        console.log(`⚠️  Found ${existing.length} existing stories in database`);
        console.log('Deleting existing stories before migration...\n');

        const { error: deleteError } = await supabase
            .from('stories')
            .delete()
            .neq('id', 0); // Delete all

        if (deleteError) {
            console.error('❌ Error deleting existing stories:', deleteError);
            return;
        }
    }

    // Insert stories
    const { data, error } = await supabase
        .from('stories')
        .insert(storiesForDb)
        .select();

    if (error) {
        console.error('❌ Error migrating stories:', error);
        return;
    }

    console.log(`✅ Successfully migrated ${data.length} stories!`);
    console.log('\nStories:');
    data.forEach(story => {
        console.log(`  - ${story.title} (${story.id})`);
    });

    // Verify
    const { data: allStories } = await supabase.from('stories').select('id');
    console.log(`\n📊 Total stories in database: ${allStories ? allStories.length : 0}`);
}

migrateStories().catch(console.error);
