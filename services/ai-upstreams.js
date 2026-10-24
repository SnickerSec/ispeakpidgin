/**
 * Base URLs for AI vendors. On Railway these point at keyproxy, and
 * GEMINI_API_KEY / ELEVENLABS_API_KEY hold scoped proxy tokens rather than
 * the real vendor keys. Unset, they default to the vendors directly.
 */
module.exports = {
    GEMINI_BASE_URL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com',
    ELEVENLABS_BASE_URL: process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io',
};
