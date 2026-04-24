#!/usr/bin/env node

/**
 * Smart Content Suggester
 * 
 * Uses Gemini AI to automatically fill in details for missing dictionary terms.
 * Takes the output from seo:loop and prepares it for ingestion.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const INPUT_PATH = path.join(__dirname, '../../docs/missing-terms.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY is not set in .env');
    process.exit(1);
}

if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌ Error: Input file not found at ${INPUT_PATH}`);
    console.log('Run "npm run seo:loop" first.');
    process.exit(1);
}

async function fillTermDetails(term) {
    console.log(`🧠 Brainstorming details for: "${term.pidgin}"...`);

    const systemPrompt = `You are a Hawaiian Pidgin (HCE) linguistics expert.
For the given Pidgin word or phrase, provide authentic local details.

RULES:
1. "english": An array of 1-3 standard English meanings.
2. "category": Choose ONE: "greetings", "expressions", "food", "descriptions", "grammar", "culture", "nature", "people".
3. "pronunciation": Uppercase phonetic guide (e.g., "AH-kah-my").
4. "examples": An array of 2 authentic local-style Pidgin example sentences.
5. "tags": An array of 3-5 relevant lowercase tags.
6. "is_junk": Set to true if the term is actually a search engine query ABOUT the site (e.g. "pidgin translator", "pidgin dictionary") or is a malformed typo/gibberish (e.g. "tuls").

RESPONSE FORMAT:
Respond ONLY with a JSON object:
{
  "english": [],
  "category": "",
  "pronunciation": "",
  "examples": [],
  "tags": [],
  "is_junk": false
}`;

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nTerm to fill: "${term.pidgin}"` }] }],
                generationConfig: { 
                    response_mime_type: "application/json",
                    temperature: 0.1
                }
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        const aiResponse = JSON.parse(data.candidates[0].content.parts[0].text);
        
        // If AI thinks it's junk, skip it
        if (aiResponse.is_junk) {
            console.log(`  🗑️ Marking as junk: "${term.pidgin}"`);
        }
        
        return {
            ...term,
            ...aiResponse,
            ai_generated: true
        };
    } catch (err) {
        console.error(`  ❌ Failed to fill "${term.pidgin}":`, err.message);
        return term;
    }
}

async function main() {
    console.log('🚀 Starting Smart Content Suggester...');
    
    const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
    const missing = data.missing || [];

    if (missing.length === 0) {
        console.log('✅ No missing terms to fill. Great job!');
        return;
    }

    const updatedMissing = [];
    for (const term of missing) {
        // Only fill if it still has the TBD marker
        if (term.english && term.english[0] === 'TBD (Add English translation)') {
            const filled = await fillTermDetails(term);
            updatedMissing.push(filled);
        } else {
            updatedMissing.push(term);
        }
    }

    data.missing = updatedMissing;
    data.last_auto_fill = new Date().toISOString();

    fs.writeFileSync(INPUT_PATH, JSON.stringify(data, null, 2));

    console.log(`\n✅ Finished! ${updatedMissing.length} terms are now ready.`);
    console.log('💡 Next steps:');
    console.log('   1. Review docs/missing-terms.json');
    console.log('   2. Run: npm run data:add-missing');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
