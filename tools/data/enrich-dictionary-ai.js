#!/usr/bin/env node

/**
 * Bulk AI Dictionary Content Enrichment Script
 * Identifies entries with thin content and uses AI to generate
 * more examples, detailed usage, and cultural origin info in BULK.
 */

require('dotenv').config();
const { supabase } = require('../../config/supabase');
const fetch = require('node-fetch');

// Configuration
const BATCH_SIZE = 300; // Total per run
const SUB_BATCH_SIZE = 20; // Number of words per AI call
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-lite';

async function main() {
    console.log('🚀 Bulk AI Dictionary Content Enrichment');
    console.log('======================================\n');

    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in environment variables.');
        process.exit(1);
    }

    // 1. Identify "thin" entries
    console.log('🔍 Identifying entries with thin content...');
    
    const { data: allEntries, error: fetchError } = await supabase
        .from('dictionary_entries')
        .select('*')
        .order('created_at', { ascending: false });

    if (fetchError) {
        console.error('❌ Error fetching entries:', fetchError.message);
        process.exit(1);
    }

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

    console.log(`📋 Found ${candidates.length} total entries to enrich in this run.`);
    console.log(`⚡ Processing in sub-batches of ${SUB_BATCH_SIZE} for maximum speed...\n`);

    for (let i = 0; i < candidates.length; i += SUB_BATCH_SIZE) {
        const subBatch = candidates.slice(i, i + SUB_BATCH_SIZE);
        const subBatchNames = subBatch.map(e => e.pidgin).join(', ');
        
        console.log(`📦 [Batch ${Math.floor(i/SUB_BATCH_SIZE) + 1}] Processing: ${subBatchNames}...`);
        
        try {
            const enrichedResults = await getBulkAiEnrichment(subBatch);
            if (enrichedResults) {
                await updateEntriesInSupabase(subBatch, enrichedResults);
            }
        } catch (error) {
            console.error(`   ❌ Failed to enrich batch:`, error.message);
        }

        // Add a small delay between AI calls
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✨ Enrichment process complete!');
}

async function getBulkAiEnrichment(entries) {
    const systemPrompt = `You are an expert Hawaiian Pidgin linguist and cultural historian.
Enrich these ${entries.length} dictionary entries with authentic examples and cultural context.

For EACH entry, provide:
1. Two additional natural example sentences in authentic Hawaiian Pidgin.
2. A detailed "Usage & Context" explanation in English (2-3 sentences).
3. A brief "Cultural Origin" explanation in English (1-2 sentences).

RETURN ONLY A JSON OBJECT where keys are the EXACT Pidgin terms:
{
  "pidgin_term_1": {
    "additional_examples": ["Ex 1", "Ex 2"],
    "usage": "Usage details...",
    "origin": "Origin info...",
    "audio_example": "Best for TTS"
  },
  ...
}`;

    const userPrompt = entries.map(entry => `
TERM: "${entry.pidgin}"
ENGLISH: "${Array.isArray(entry.english) ? entry.english.join(', ') : entry.english}"
CURRENT USAGE: "${entry.usage || 'None'}"
`).join('\n---');

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
                maxOutputTokens: 4000,
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
    
    try {
        const parsed = JSON.parse(text);
        // Create a lowercase map for easier matching
        const normalized = {};
        Object.keys(parsed).forEach(key => {
            normalized[key.toLowerCase().trim()] = parsed[key];
        });
        return normalized;
    } catch (e) {
        console.error("❌ Failed to parse AI JSON response");
        return null;
    }
}

async function updateEntriesInSupabase(originalEntries, enrichedMap) {
    const updates = originalEntries.map(entry => {
        const pidginKey = entry.pidgin.toLowerCase().trim();
        const enriched = enrichedMap[pidginKey];
        
        if (!enriched) {
            console.log(`   ⚠️  No AI data found for "${entry.pidgin}"`);
            return null;
        }

        const existingExamples = entry.examples || [];
        const additional = enriched.additional_examples || enriched.examples || [];
        const allExamples = [...new Set([...existingExamples, ...additional])];

        const updateData = {
            id: entry.id,
            pidgin: entry.pidgin,
            english: entry.english,
            category: entry.category,
            examples: allExamples,
            usage: enriched.usage,
            origin: enriched.origin,
            updated_at: new Date().toISOString()
        };

        if (enriched.audio_example) {
            updateData.audio_example = enriched.audio_example;
        }

        return updateData;
    }).filter(Boolean);

    if (updates.length === 0) {
        console.log('   ⚠️  No updates to perform for this batch.');
        return;
    }

    // Use upsert to update multiple rows at once
    const { error } = await supabase
        .from('dictionary_entries')
        .upsert(updates, { onConflict: 'id' });

    if (error) {
        throw new Error(`Supabase bulk update failed: ${error.message}`);
    }
    
    console.log(`   ✅ Successfully updated ${updates.length} entries.`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
