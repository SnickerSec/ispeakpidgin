#!/usr/bin/env node

/**
 * Generate Embeddings for Dictionary Entries
 * Uses Gemini text-embedding-004 to create 768-dimension vectors
 * for semantic search.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration
const BATCH_SIZE = 100;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateEmbeddings() {
    console.log('🚀 Starting Dictionary Embedding Generation...');

    // 1. Fetch entries that need embeddings
    const { data: entries, error: fetchError } = await supabase
        .from('dictionary_entries')
        .select('id, pidgin, english, usage, category')
        .or('embedding.is.null,last_embedded_at.lt.updated_at')
        .limit(BATCH_SIZE);

    if (fetchError) {
        console.error('❌ Error fetching entries:', fetchError.message);
        return;
    }

    if (!entries || entries.length === 0) {
        console.log('✅ All entries already have up-to-date embeddings.');
        return;
    }

    console.log(`📦 Found ${entries.length} entries to process.`);

    // 2. Prepare text for embedding
    // We combine pidgin, english meanings, and usage for a rich semantic representation
    const requests = entries.map(entry => {
        const englishStr = Array.isArray(entry.english) ? entry.english.join(', ') : entry.english;
        const text = `Pidgin: ${entry.pidgin}. English: ${englishStr}. Category: ${entry.category || 'general'}. Usage: ${entry.usage || ''}`;
        return {
            content: { parts: [{ text }] },
            task_type: 'RETRIEVAL_DOCUMENT',
            title: entry.pidgin
        };
    });

    // 3. Call Gemini Embeddings API (Batch)
    console.log(`🧠 Generating embeddings via Gemini...`);
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Gemini API Error: ${JSON.stringify(err)}`);
        }

        const result = await response.json();
        const embeddings = result.embeddings;

        if (!embeddings || embeddings.length !== entries.length) {
            throw new Error('Mismatch in embeddings returned');
        }

        // 4. Update Supabase
        console.log(`💾 Saving ${embeddings.length} embeddings to Supabase...`);
        const updates = entries.map((entry, index) => ({
            id: entry.id,
            embedding: embeddings[index].values,
            last_embedded_at: new Date().toISOString()
        }));

        const { error: updateError } = await supabase
            .from('dictionary_entries')
            .upsert(updates, { onConflict: 'id' });

        if (updateError) {
            throw new Error(`Supabase update error: ${updateError.message}`);
        }

        console.log(`✨ Successfully processed ${entries.length} entries.`);
        
        // If we hit the limit, there might be more
        if (entries.length === BATCH_SIZE) {
            console.log('🔄 More entries remaining, continuing in next batch...');
            return generateEmbeddings(); 
        }

    } catch (error) {
        console.error('❌ Embedding process failed:', error.message);
    }
}

generateEmbeddings().catch(console.error);
