#!/usr/bin/env node

/**
 * Generate Embeddings for Dictionary Entries
 *
 * Fills public.dictionary_embeddings (migration 016) for semantic search, using the model
 * declared in services/gemini.js. Each row stores an md5 of the text it embedded, so a run
 * re-embeds only entries that are new or whose text changed; safe to run after every
 * dictionary edit. Rows for deleted entries go with them (ON DELETE CASCADE).
 *
 *   node tools/data/generate-embeddings.js            # embed new/changed entries
 *   node tools/data/generate-embeddings.js --dry-run  # report what would be embedded
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { fetchAllRows } = require('../../services/fetch-all-rows');
const { EMBEDDING_MODEL } = require('../../services/gemini');
const { embeddingText, contentHash, embedEntries } = require('../../services/dictionary-embeddings');

const DRY_RUN = process.argv.includes('--dry-run');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing GEMINI_API_KEY, SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const selectAll = (table, columns, orderBy) => fetchAllRows(supabase, table, columns, { orderBy });

async function main() {
    console.log(`🚀 Dictionary embeddings (${EMBEDDING_MODEL})${DRY_RUN ? ' — dry run' : ''}`);

    const entries = await selectAll('dictionary_entries', 'id, pidgin, english, usage, category');
    const existing = new Map((await selectAll('dictionary_embeddings', 'entry_id, content_hash', 'entry_id'))
        .map(r => [r.entry_id, r.content_hash]));

    const stale = entries.filter(entry => existing.get(entry.id) !== contentHash(embeddingText(entry)));

    console.log(`📦 ${entries.length} entries, ${existing.size} embedded, ${stale.length} new or changed`);
    if (!stale.length || DRY_RUN) return;

    const written = await embedEntries(supabase, GEMINI_API_KEY, stale);
    console.log(`✨ Embedded ${written} entries`);
}

main().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
});
