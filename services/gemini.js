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

module.exports = {
    generateContent
};
