/**
 * Gemini API Service
 * 
 * Provides robust wrapper around Gemini API with exponential backoff retries
 * and automatic fallback to alternative models on transient errors.
 */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Call Gemini API with retries and fallback models.
 * @param {string} apiKey - The Gemini API key.
 * @param {object} body - The request body (contents, system_instruction, generationConfig, etc.)
 * @param {object} options - Options (retry count, fallback list, etc.)
 * @returns {Promise<Response>} - The successful fetch Response object.
 */
async function generateContent(apiKey, body, options = {}) {
    const fallbackModels = options.fallbackModels || [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash-lite',
        'gemini-flash-latest' // 1.5 Flash fallback
    ];
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;
    const baseDelay = options.baseDelay || 500; // start with 500ms delay

    let lastError = null;
    let lastResponse = null;

    for (const model of fallbackModels) {
        let retries = 0;
        while (retries <= maxRetries) {
            // Replace the model name in the endpoint URL
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    if (model !== fallbackModels[0]) {
                        console.info(`ℹ️ Gemini API: Successfully used fallback model ${model} after failures.`);
                    }
                    return response;
                }

                // Parse status and check if transient
                const status = response.status;
                const isTransient = status === 503 || status === 429 || status >= 500;
                
                const errText = await response.text();
                console.warn(`⚠️ Gemini API call to ${model} failed with status ${status}: ${errText}. Attempt ${retries + 1}/${maxRetries + 1}`);

                // Reconstruct the response so the caller can still read the error body if needed
                lastResponse = new Response(errText, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });

                if (!isTransient || retries === maxRetries) {
                    // Non-transient error (e.g. 400 bad request, 403 forbidden)
                    // or ran out of retries for this model.
                    // Break out of the retry loop to try the next fallback model.
                    break;
                }

                // Wait with exponential backoff before retrying
                const delay = baseDelay * Math.pow(2, retries);
                await sleep(delay);
                retries++;
            } catch (err) {
                console.error(`❌ Network error calling Gemini API with model ${model}:`, err.message);
                lastError = err;
                
                if (retries === maxRetries) {
                    break;
                }
                const delay = baseDelay * Math.pow(2, retries);
                await sleep(delay);
                retries++;
            }
        }
    }

    if (lastResponse) {
        return lastResponse;
    }
    throw lastError || new Error('Failed to generate content from all Gemini models');
}

// Embeddings for dictionary semantic search. text-embedding-004 was retired (404 by 2026-10).
// EMBEDDING_DIMENSIONS must match vector(768) in public.dictionary_embeddings (migration 016).
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;
const EMBED_BATCH_LIMIT = 100;

/**
 * Embed texts with the dictionary embedding model.
 * @param {string} apiKey - The Gemini API key.
 * @param {string[]} texts - Texts to embed.
 * @param {string} taskType - 'RETRIEVAL_QUERY' for searches, 'RETRIEVAL_DOCUMENT' for entries.
 * @returns {Promise<number[][]>} - One vector per text, in order.
 */
async function embedTexts(apiKey, texts, taskType) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;
    const vectors = [];
    for (let i = 0; i < texts.length; i += EMBED_BATCH_LIMIT) {
        const requests = texts.slice(i, i + EMBED_BATCH_LIMIT).map(text => ({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text }] },
            taskType,
            outputDimensionality: EMBEDDING_DIMENSIONS
        }));
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests })
        });
        if (!response.ok) {
            throw new Error(`Gemini embedding error ${response.status}: ${(await response.text()).slice(0, 200)}`);
        }
        const { embeddings } = await response.json();
        if (!embeddings || embeddings.length !== requests.length) {
            throw new Error('Gemini returned a different number of embeddings than requested');
        }
        vectors.push(...embeddings.map(e => e.values));
    }
    return vectors;
}

module.exports = {
    generateContent,
    embedTexts,
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSIONS
};
