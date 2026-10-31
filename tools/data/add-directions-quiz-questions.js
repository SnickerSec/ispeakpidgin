#!/usr/bin/env node

/**
 * add-directions-quiz-questions.js
 *
 * Adds 5 authentic island direction questions to Supabase quiz_questions
 * connected to the Learning Hub "Island Directions" scenario.
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

const QUESTIONS = [
  {
    question: "If someone in Honolulu tells you to head 'Mauka', which direction should you go?",
    question_type: "multiple_choice",
    options: ["Toward the mountains / inland", "Toward the ocean / beach", "West toward Ewa", "East toward Diamond Head"],
    correct_answer: "Toward the mountains / inland",
    explanation: "Mauka comes from Hawaiian and means toward the mountains or inland, regardless of compass north/south.",
    category: "culture",
    difficulty: "beginner",
    points: 10,
    tags: ["directions", "mauka", "geography"]
  },
  {
    question: "Your friend says, 'Da shave ice truck stay makai side of da highway.' Where is it located?",
    question_type: "multiple_choice",
    options: ["On the ocean / beach side of the road", "On the mountain side of the road", "Behind the shopping center", "Up in the valley"],
    correct_answer: "On the ocean / beach side of the road",
    explanation: "Makai means toward the ocean or sea. On coastal island highways, businesses are identified as either mauka or makai side.",
    category: "culture",
    difficulty: "beginner",
    points: 10,
    tags: ["directions", "makai", "geography"]
  },
  {
    question: "On Oahu, what does traveling 'Diamond Head side' mean?",
    question_type: "multiple_choice",
    options: ["Eastward toward the Diamond Head landmark / Waikiki", "Westward toward the Ewa plain", "Up toward the Koʻolau mountain ridge", "Out to the open ocean"],
    correct_answer: "Eastward toward the Diamond Head landmark / Waikiki",
    explanation: "Because Honolulu's coastline curves, locals use Diamond Head as the eastern directional landmark instead of saying 'east'.",
    category: "culture",
    difficulty: "intermediate",
    points: 10,
    tags: ["directions", "oahu", "diamond head"]
  },
  {
    question: "When driving on the H-1 freeway in Honolulu, what does heading 'Ewa side' indicate?",
    question_type: "multiple_choice",
    options: ["Heading westbound toward Kapolei and Waipahu", "Heading eastbound toward Hawaii Kai", "Heading directly into downtown", "Heading into Manoa Valley"],
    correct_answer: "Heading westbound toward Kapolei and Waipahu",
    explanation: "'Ewa' is used on Oahu to signify traveling west toward the historic Ewa plain, opposite of Diamond Head.",
    category: "culture",
    difficulty: "intermediate",
    points: 10,
    tags: ["directions", "oahu", "ewa"]
  },
  {
    question: "Why do Hawaii locals rarely use cardinal directions like North, South, East, and West?",
    question_type: "multiple_choice",
    options: ["Islands are circular with mountains in the center and sea all around", "Compass needles spin in the Pacific magnetic field", "Early plantation workers had no compasses", "State law requires traditional Hawaiian terms"],
    correct_answer: "Islands are circular with mountains in the center and sea all around",
    explanation: "Because Hawaiian islands are volcanic formations surrounded by ocean with interior mountain ranges, Mauka (mountain) and Makai (ocean) are far more natural and accurate than compass headings.",
    category: "culture",
    difficulty: "intermediate",
    points: 10,
    tags: ["culture", "directions", "history"]
  }
];

async function main() {
  console.log('🧭 Adding Island Directions Quiz Questions');
  console.log('==========================================');

  const { data: existing, error: exErr } = await supabase
    .from('quiz_questions')
    .select('question');

  if (exErr) throw exErr;
  const existingSet = new Set((existing || []).map(q => q.question.toLowerCase().trim()));

  const toInsert = QUESTIONS.filter(q => !existingSet.has(q.question.toLowerCase().trim()));
  console.log(`📊 Found ${existing.length} existing questions. New questions to insert: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('✨ All questions already exist in Supabase!');
    return;
  }

  const { data: inserted, error: insErr } = await supabase
    .from('quiz_questions')
    .insert(toInsert)
    .select('id, question');

  if (insErr) throw insErr;
  console.log(`🎉 Successfully inserted ${inserted.length} questions into Supabase quiz_questions!`);

  const { count: total } = await supabase.from('quiz_questions').select('*', { count: 'exact', head: true });
  console.log(`📈 Total quiz questions in DB: ${total}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
