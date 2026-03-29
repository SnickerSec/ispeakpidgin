#!/usr/bin/env node
/**
 * LLM Training Data Exporter
 * Exports verified dictionary entries and phrases from Supabase
 * into JSONL format for LLM fine-tuning or few-shot prompting.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { supabase } = require('../../config/supabase');

const OUTPUT_DIR = path.join(__dirname, '../../data/training');
const DICTIONARY_FILE = path.join(OUTPUT_DIR, 'dictionary_training.jsonl');
const PHRASES_FILE = path.join(OUTPUT_DIR, 'phrases_training.jsonl');

async function exportData() {
    console.log('🤖 Starting LLM Training Data Export...');
    console.log('======================================\n');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    try {
        // 1. Export Dictionary
        console.log('📚 Fetching dictionary entries...');
        const { data: entries, error: dictError } = await supabase
            .from('dictionary_entries')
            .select('pidgin, english, examples, usage')
            .order('pidgin');

        if (dictError) throw dictError;

        const dictStream = fs.createWriteStream(DICTIONARY_FILE);
        entries.forEach(entry => {
            const english = Array.isArray(entry.english) ? entry.english.join(', ') : entry.english;
            const record = {
                prompt: `What does the Hawaiian Pidgin word "${entry.pidgin}" mean?`,
                completion: `${entry.pidgin} means ${english}. ${entry.usage ? 'Usage: ' + entry.usage : ''} ${entry.examples && entry.examples[0] ? 'Example: "' + entry.examples[0] + '"' : ''}`,
                metadata: { type: 'dictionary', word: entry.pidgin }
            };
            dictStream.write(JSON.stringify(record) + '\n');
        });
        dictStream.end();
        console.log(`✅ Exported ${entries.length} dictionary entries to ${DICTIONARY_FILE}`);

        // 2. Export Phrases
        console.log('🗣️ Fetching phrases...');
        const { data: phrases, error: phraseError } = await supabase
            .from('phrases')
            .select('pidgin, english, category')
            .order('category');

        if (phraseError) throw phraseError;

        const phraseStream = fs.createWriteStream(PHRASES_FILE);
        phrases.forEach(phrase => {
            const record = {
                prompt: `Translate to Hawaiian Pidgin: "${phrase.english}"`,
                completion: phrase.pidgin,
                metadata: { type: 'phrase', category: phrase.category }
            };
            phraseStream.write(JSON.stringify(record) + '\n');
            
            // Add reverse mapping
            const reverseRecord = {
                prompt: `Translate this Hawaiian Pidgin to English: "${phrase.pidgin}"`,
                completion: phrase.english,
                metadata: { type: 'phrase_reverse', category: phrase.category }
            };
            phraseStream.write(JSON.stringify(reverseRecord) + '\n');
        });
        phraseStream.end();
        console.log(`✅ Exported ${phrases.length * 2} phrase mappings to ${PHRASES_FILE}`);

        console.log('\n✨ Export Complete! Data ready for LLM processing.');

    } catch (err) {
        console.error('\n❌ Export failed:', err.message);
        process.exit(1);
    }
}

exportData();
