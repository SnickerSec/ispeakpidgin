#!/usr/bin/env node

/**
 * add-island-directions-lesson.js
 *
 * Adds the new conversational scenario lesson:
 * "Island Directions: Mauka, Makai & Landmarks"
 * into Supabase lessons and lesson_vocabulary tables.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🌺 Adding Island Directions Lesson...');

  // 1. Check if lesson already exists
  const { data: existingLesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('lesson_key', 'island-directions')
    .maybeSingle();

  let lessonId;

  if (existingLesson) {
    lessonId = existingLesson.id;
    console.log(`ℹ️ Lesson already exists with ID ${lessonId}, updating...`);
    const { error: updErr } = await supabase
      .from('lessons')
      .update({
        title: 'Island Directions: Mauka, Makai & Landmarks',
        level: 'intermediate',
        icon: '🧭',
        cultural_note: 'In Hawaii, locals never say north, south, east, or west. Mauka means toward the mountains, makai means toward the ocean. On Oahu, you also hear Diamond Head (toward Waikiki) and Ewa (toward the west).',
        practice: 'Practice giving directions from Waikiki: "Go makai toward da surf, den head Diamond Head side!"',
        sort_order: 6
      })
      .eq('id', lessonId);
    if (updErr) throw updErr;
  } else {
    console.log('✨ Inserting new lesson...');
    const { data: newLesson, error: insErr } = await supabase
      .from('lessons')
      .insert({
        lesson_key: 'island-directions',
        title: 'Island Directions: Mauka, Makai & Landmarks',
        level: 'intermediate',
        icon: '🧭',
        cultural_note: 'In Hawaii, locals never say north, south, east, or west. Mauka means toward the mountains, makai means toward the ocean. On Oahu, you also hear Diamond Head (toward Waikiki) and Ewa (toward the west).',
        practice: 'Practice giving directions from Waikiki: "Go makai toward da surf, den head Diamond Head side!"',
        sort_order: 6
      })
      .select('id')
      .single();
    if (insErr) throw insErr;
    lessonId = newLesson.id;
    console.log(`✅ Created lesson with ID ${lessonId}`);
  }

  // 2. Clear old vocabulary for this lesson if updating
  await supabase.from('lesson_vocabulary').delete().eq('lesson_id', lessonId);

  // 3. Insert vocabulary items
  const vocabItems = [
    {
      lesson_id: lessonId,
      pidgin: 'Mauka',
      english: 'Toward the mountains / Inland',
      example: 'Turn mauka at da traffic light by da mountain.',
      sort_order: 0
    },
    {
      lesson_id: lessonId,
      pidgin: 'Makai',
      english: 'Toward the ocean / Sea',
      example: 'Da gas station stay makai side of da highway.',
      sort_order: 1
    },
    {
      lesson_id: lessonId,
      pidgin: 'Ewa',
      english: 'Westward toward the Ewa plain (Oahu)',
      example: 'Head Ewa on da H-1 freeway fo get Pearl City.',
      sort_order: 2
    },
    {
      lesson_id: lessonId,
      pidgin: 'Diamond Head',
      english: 'Eastward toward Diamond Head crater (Oahu)',
      example: 'Stay cruising Diamond Head side past Waikiki.',
      sort_order: 3
    }
  ];

  const { data: insertedVocab, error: vErr } = await supabase
    .from('lesson_vocabulary')
    .insert(vocabItems)
    .select('id, pidgin');

  if (vErr) throw vErr;
  console.log(`✅ Inserted ${insertedVocab.length} vocabulary terms for lesson ${lessonId}`);

  console.log('🎉 Island Directions lesson setup complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
