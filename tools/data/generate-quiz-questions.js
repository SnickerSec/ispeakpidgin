#!/usr/bin/env node

/**
 * Quiz Questions Generator
 * Generates verified, authentic Hawaiian Pidgin quiz questions from dictionary terms and phrases
 * and saves them directly to Supabase.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const geminiService = require('../../services/gemini');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !GEMINI_API_KEY) {
    console.error('❌ Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or GEMINI_API_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateBatchQuestions(candidates) {
    const systemPrompt = `You are an expert Hawaiian Pidgin linguist and educational quiz creator.
Generate 5 high-quality, authentic multiple choice quiz questions based on the provided Hawaiian Pidgin terms.

REQUIREMENTS:
1. Each question must test comprehension, usage, or cultural context of Hawaiian Pidgin.
2. "options": Array of exactly 4 strings. Distractors must be plausible but unambiguously wrong.
3. "correct_answer": Must EXACTLY match one of the 4 items in "options".
4. "explanation": 1-2 sentence explanation of why the answer is correct with cultural usage context.
5. "category": One of "vocabulary", "expressions", "culture", "grammar".
6. "difficulty": One of "beginner", "intermediate", "advanced".
7. "points": 10 for beginner, 15 for intermediate, 20 for advanced.
8. "tags": Array of 1-3 lowercase keywords.

RESPONSE FORMAT (JSON ONLY):
{
  "questions": [
    {
      "question": "What does 'broke da mouth' describe in Hawaii?",
      "question_type": "multiple_choice",
      "options": ["Extremely delicious food", "A dental injury", "Loud yelling", "Broken surfboard"],
      "correct_answer": "Extremely delicious food",
      "explanation": "'Broke da mouth' is an enthusiastic compliment for food that tastes extraordinarily good.",
      "category": "expressions",
      "difficulty": "beginner",
      "points": 10,
      "tags": ["food", "slang", "expressions"]
    }
  ]
}`;

    const userPrompt = `Source Words Pool:\n${candidates.map(c => `- ${c.pidgin}: ${c.english} (Category: ${c.category || 'general'}, Usage: ${c.usage || 'none'})`).join('\n')}`;

    const response = await geminiService.generateContent(GEMINI_API_KEY, {
        system_instruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [{
            role: 'user',
            parts: [{ text: userPrompt }]
        }],
        generationConfig: {
            temperature: 0.6,
            responseMimeType: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);
    return parsed.questions || [];
}

async function main() {
    const TARGET_COUNT = 28; // 74 + 28 = 102 questions
    console.log(`📝 Generating ${TARGET_COUNT} New Hawaiian Pidgin Quiz Questions...`);
    console.log('==============================================================\n');

    // 1. Fetch dictionary terms and phrases
    const [dictRes, phrasesRes] = await Promise.all([
        supabase.from('dictionary_entries').select('pidgin, english, category, usage').not('english', 'is', null),
        supabase.from('phrases').select('pidgin, english, category').not('english', 'is', null)
    ]);

    const allEntries = [
        ...(dictRes.data || []),
        ...(phrasesRes.data || [])
    ];

    console.log(`📚 Pool of ${allEntries.length} source entries ready.\n`);

    let saved = 0;
    while (saved < TARGET_COUNT) {
        const pool = allEntries
            .sort(() => 0.5 - Math.random())
            .slice(0, 15);

        process.stdout.write(`Generating batch of questions (${saved}/${TARGET_COUNT})... `);

        try {
            const questions = await generateBatchQuestions(pool);
            let batchSaved = 0;

            for (const q of questions) {
                if (saved >= TARGET_COUNT) break;

                // Validate question
                if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) continue;
                if (!q.options.includes(q.correct_answer)) continue;
                if (!q.explanation) continue;

                const { error: insertErr } = await supabase
                    .from('quiz_questions')
                    .insert([{
                        question: q.question,
                        question_type: 'multiple_choice',
                        options: q.options,
                        correct_answer: q.correct_answer,
                        explanation: q.explanation,
                        category: q.category || 'vocabulary',
                        difficulty: q.difficulty || 'beginner',
                        points: q.points || (q.difficulty === 'advanced' ? 20 : (q.difficulty === 'intermediate' ? 15 : 10)),
                        tags: q.tags || ['pidgin'],
                        created_at: new Date().toISOString()
                    }]);

                if (!insertErr) {
                    saved++;
                    batchSaved++;
                }
            }

            console.log(`✅ Saved ${batchSaved} questions (Total: ${saved}/${TARGET_COUNT})`);
        } catch (err) {
            console.log(`❌ Error: ${err.message}`);
        }

        // Slight rate pacing
        await new Promise(r => setTimeout(r, 600));
    }

    console.log(`\n🎉 Successfully generated and saved ${saved} new quiz questions!`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
