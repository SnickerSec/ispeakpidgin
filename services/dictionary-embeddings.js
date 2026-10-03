/**
 * Dictionary embeddings for semantic search (public.dictionary_embeddings, migration 016).
 *
 * Shared by tools/data/generate-embeddings.js (backfill / re-embed changed entries) and the
 * admin add route (embed a new entry immediately), so both store the same text and hash.
 */

const crypto = require('crypto');
const { embedTexts, EMBEDDING_MODEL } = require('./gemini');

// Pidgin headword, English meanings and usage give the richest semantic representation
function embeddingText(entry) {
    const english = Array.isArray(entry.english) ? entry.english.join(', ') : (entry.english || '');
    return `Pidgin: ${entry.pidgin}. English: ${english}. Category: ${entry.category || 'general'}. Usage: ${entry.usage || ''}`;
}

// Includes the model, so switching models marks every row for re-embedding
function contentHash(text) {
    return crypto.createHash('md5').update(`${EMBEDDING_MODEL}\n${text}`).digest('hex');
}

/**
 * Embed entries and upsert their vectors.
 * @param {object} supabaseAdmin - service-role client (RLS hides the table from anon)
 * @param {string} apiKey - Gemini API key
 * @param {Array<object>} entries - rows with id, pidgin, english, category, usage
 * @returns {Promise<number>} - rows written
 */
async function embedEntries(supabaseAdmin, apiKey, entries) {
    if (!entries.length) return 0;
    const texts = entries.map(embeddingText);
    const vectors = await embedTexts(apiKey, texts, 'RETRIEVAL_DOCUMENT');
    const rows = entries.map((entry, i) => ({
        entry_id: entry.id,
        // pgvector's text form: '[0.1,0.2,...]'
        embedding: `[${vectors[i].join(',')}]`,
        content_hash: contentHash(texts[i]),
        model: EMBEDDING_MODEL,
        embedded_at: new Date().toISOString()
    }));
    for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabaseAdmin.from('dictionary_embeddings').upsert(rows.slice(i, i + 200), { onConflict: 'entry_id' });
        if (error) throw new Error(`Saving embeddings: ${error.message}`);
    }
    return rows.length;
}

module.exports = { embeddingText, contentHash, embedEntries };
