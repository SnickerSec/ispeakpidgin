#!/usr/bin/env node

/**
 * AI Dictionary Content Enrichment Script
 * Identifies entries with thin content and uses AI to generate
 * more examples, detailed usage, and cultural origin info.
 */

require('dotenv').config();
const { supabase } = require('../../config/supabase');
const fetch = require('node-fetch');

// Configuration
const BATCH_SIZE = 50; // Increased for bulk processing
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-lite';

async function main() {
    console.log('🤖 AI Dictionary Content Enrichment');
    console.log('==================================\n');

    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in environment variables.');
        process.exit(1);
    }

    // 1. Identify "thin" entries
    // Criteria: missing usage, missing origin, or < 2 examples
    console.log('🔍 Identifying entries with thin content...');
    
    // Fetch all entries to filter locally - this is more robust than the .or() query
    const { data: allEntries, error: fetchError } = await supabase
        .from('dictionary_entries')
        .select('*')
        .order('created_at', { ascending: false });

    if (fetchError) {
        console.error('❌ Error fetching entries:', fetchError.message);
        process.exit(1);
    }

    // Filter locally to find the best candidates (ones that really need it)
    const candidates = allEntries.filter(entry => {
        const needsUsage = !entry.usage || entry.usage.length < 10;
        const needsOrigin = !entry.origin || entry.origin.length < 5;
        const needsExamples = !entry.examples || (Array.isArray(entry.examples) && entry.examples.length < 2);
        return needsUsage || needsOrigin || needsExamples;
    }).slice(0, BATCH_SIZE);

    if (candidates.length === 0) {
        console.log('✅ No thin entries found. Dictionary is already rich!');
        return;
    }

    console.log(`📋 Found ${candidates.length} entries to enrich.\n`);

    for (let i = 0; i < candidates.length; i++) {
        const entry = candidates[i];
        console.log(`[${i+1}/${candidates.length}] Enriching: "${entry.pidgin}"...`);
        
        try {
            const enrichedData = await getAiEnrichment(entry);
            if (enrichedData) {
                await updateEntryInSupabase(entry.id, entry.pidgin, enrichedData);
            }
        } catch (error) {
            console.error(`   ❌ Failed to enrich "${entry.pidgin}":`, error.message);
        }
        
        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✨ Enrichment process complete!');
}

async function getAiEnrichment(entry) {
    const systemPrompt = `You are an expert Hawaiian Pidgin linguist and cultural historian.
Your task is to enrich a dictionary entry with authentic examples and cultural context.

Provide:
1. Two additional natural example sentences in authentic Hawaiian Pidgin.
2. A detailed "Usage & Context" explanation in English (2-3 sentences).
3. A brief "Cultural Origin" explanation in English (1-2 sentences).

RETURN ONLY A JSON OBJECT:
{
  "additional_examples": ["Example 1", "Example 2"],
  "usage": "Detailed usage explanation...",
  "origin": "Cultural origin info...",
  "audio_example": "One of the new examples that is best for text-to-speech"
}`;

    const userPrompt = `TERM: "${entry.pidgin}"
CURRENT ENGLISH: "${Array.isArray(entry.english) ? entry.english.join(', ') : entry.english}"
CURRENT EXAMPLES: ${JSON.stringify(entry.examples || [])}
CURRENT USAGE: "${entry.usage || 'None'}"
CURRENT ORIGIN: "${entry.origin || 'None'}"`;

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
                temperature: 0.4,
                maxOutputTokens: 500,
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
    
    if (!text) return null;
    
    return JSON.parse(text);
}

async function updateEntryInSupabase(id, pidgin, enriched) {
    // Merge examples
    // We'll fetch the current entry again to be safe on concurrency, 
    // but for a script we can just use our local copy.
    const { data: current } = await supabase.from('dictionary_entries').select('examples').eq('id', id).single();
    
    const existingExamples = current?.examples || [];
    const allExamples = [...new Set([...existingExamples, ...enriched.additional_examples])];

    const updateData = {
        examples: allExamples,
        usage: enriched.usage,
        origin: enriched.origin,
        updated_at: new Date().toISOString()
    };

    // Only update audio_example if it was missing or we have a better one
    if (enriched.audio_example) {
        updateData.audio_example = enriched.audio_example;
    }

    const { error } = await supabase
        .from('dictionary_entries')
        .update(updateData)
        .eq('id', id);

    if (error) {
        throw new Error(`Supabase update failed: ${error.message}`);
    }

    console.log(`   ✅ Successfully enriched "${pidgin}"`);
    console.log(`      - Added ${enriched.additional_examples.length} examples`);
    console.log(`      - Updated usage and origin info`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
