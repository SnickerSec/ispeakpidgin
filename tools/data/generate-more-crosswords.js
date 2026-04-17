#!/usr/bin/env node

/**
 * AI Crossword Generation Script
 * Uses AI to create valid crossword grids from dictionary terms
 * and saves them to Supabase.
 */

require('dotenv').config();
const { supabase } = require('../../config/supabase');
const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-lite';

async function main() {
    console.log('🧩 AI Crossword Generator');
    console.log('========================\n');

    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found.');
        process.exit(1);
    }

    try {
        // 1. Fetch random words for the puzzle
        console.log('🎲 Fetching candidate words...');
        const { data: entries, error: fetchErr } = await supabase
            .from('dictionary_entries')
            .select('pidgin, english, usage')
            .not('usage', 'is', null)
            .limit(100); // Get a pool of 100 to choose from

        if (fetchErr) throw fetchErr;

        // Shuffle and take 30 potential words (AI will pick the best fit)
        const candidates = entries
            .sort(() => 0.5 - Math.random())
            .slice(0, 30)
            .map(e => ({
                word: e.pidgin.toUpperCase().replace(/[^A-Z]/g, ''),
                display: e.pidgin,
                clue: Array.isArray(e.english) ? e.english[0] : e.english
            }))
            .filter(e => e.word.length >= 3 && e.word.length <= 10);

        console.log(`📡 Sending ${candidates.length} candidates to AI to build a grid...`);

        // 2. Ask AI to build a valid grid
        const puzzleData = await generateGridWithAI(candidates);
        
        if (puzzleData) {
            // 3. Save to Supabase
            console.log(`💾 Saving puzzle: "${puzzleData.title}"...`);
            const { error: insertErr } = await supabase
                .from('crossword_puzzles')
                .insert([
                    {
                        puzzle_id: `ai_puzzle_${Date.now()}`,
                        title: puzzleData.title,
                        description: puzzleData.description,
                        theme: puzzleData.theme,
                        difficulty: puzzleData.difficulty,
                        grid_size: puzzleData.grid_size,
                        grid: puzzleData.grid,
                        words_across: puzzleData.words_across,
                        words_down: puzzleData.words_down,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (insertErr) throw insertErr;
            console.log('✅ Puzzle successfully generated and saved!');
        }

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    }
}

async function generateGridWithAI(candidates) {
    const systemPrompt = `You are an expert crossword puzzle designer. 
Your task is to create a valid, interconnected crossword puzzle grid (10x10) using some of the provided Hawaiian Pidgin terms.

RULES:
1. Grid must be exactly 10 rows by 10 columns.
2. Words must interconnect (share letters at intersections).
3. Provide "words_across" and "words_down" arrays with: row, col, number, word, clue, answer.
4. "number" should be unique per starting cell (if Across and Down start at same cell, they share a number).
5. "grid" must be a 2D array [10][10] where each cell is a single letter or " " (space for black cells).
6. Use between 8 to 12 words in total.

RETURN ONLY A JSON OBJECT:
{
  "title": "Fun Title",
  "description": "Short description",
  "theme": "general",
  "difficulty": "intermediate",
  "grid_size": { "rows": 10, "cols": 10 },
  "grid": [["A"," "," ",...], ...],
  "words_across": [{"row": 0, "col": 0, "number": 1, "word": "ALOHA", "answer": "ALOHA", "clue": "Hello/Goodbye"}],
  "words_down": [...]
}`;

    const userPrompt = `Candidate words:\n${candidates.map(c => `${c.word} (${c.clue})`).join('\n')}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                role: 'user',
                parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}\n\n${userPrompt}` }]
            }],
            generationConfig: { 
                temperature: 0.7,
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(`AI Service error: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("❌ Failed to parse AI response as JSON");
        return null;
    }
}

main();
