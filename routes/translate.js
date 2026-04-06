const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

/**
 * Translation Routes (Google Translate, Gemini LLM, TTS)
 */
module.exports = function(translate, translationLimiter, dictionaryCache) {

    // Extract relevant vocabulary from dictionary for LLM prompt injection
    function getRelevantVocabulary(text, direction, maxEntries = 35) {
        if (!dictionaryCache.data || !dictionaryCache.data.entries) return '';

        const entries = dictionaryCache.data.entries;
        const inputLower = text.toLowerCase();
        const stopWords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'am', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in',
            'for', 'on', 'with', 'at', 'by', 'from', 'it', 'its', 'this', 'that',
            'i', 'me', 'my', 'you', 'your', 'he', 'she', 'we', 'they', 'and',
            'or', 'but', 'not', 'so', 'if', 'up', 'out', 'no', 'yes'
        ]);

        // Tokenize input, filter stop words
        const inputWords = inputLower
            .replace(/[.,!?;:'"()\-]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 1 && !stopWords.has(w));

        const matched = [];

        for (const entry of entries) {
            if (matched.length >= maxEntries) break;

            const pidginLower = (entry.pidgin || '').toLowerCase();
            const englishArr = Array.isArray(entry.english) ? entry.english : [entry.english];
            const englishLower = englishArr.map(e => (e || '').toLowerCase());

            if (direction === 'eng-to-pidgin') {
                const isMatch = inputWords.some(word =>
                    englishLower.some(eng => eng === word || eng.includes(word) || word.includes(eng))
                );
                if (isMatch) matched.push(`"${englishArr[0]}" = "${entry.pidgin}"`);
            } else {
                if (inputWords.some(word => pidginLower === word || pidginLower.includes(word) || word.includes(pidginLower))) {
                    matched.push(`"${entry.pidgin}" = "${englishArr[0]}"`);
                }
            }
        }

        if (matched.length === 0) return '';
        return `\n\nCURATED DICTIONARY VOCABULARY (use these as authoritative overrides — always prefer these translations over your own when the meaning matches):\n${matched.join('\n')}`;
    }

    // POST /api/translate/text-to-speech
    router.post('/text-to-speech',
        translationLimiter,
        [
            body('text')
                .trim()
                .notEmpty().withMessage('Text is required')
                .isLength({ min: 1, max: 500 }).withMessage('Text must be between 1 and 500 characters')
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            try {
                const { text, originalText } = req.body;
                const apiKey = process.env.ELEVENLABS_API_KEY;
                if (!apiKey) return res.status(500).json({ error: 'ElevenLabs API key not configured' });

                const voiceId = 'f0ODjLMfcJmlKfs7dFCW'; // Hawaiian-sounding voice
                const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

                // Use the corrected text for pronunciation, but the model can also benefit 
                // from knowing the context of the original text if we provide it.
                // For now, we use the text as provided by the frontend (which is already phoneticized).

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': apiKey
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_flash_v2_5',
                        voice_settings: {
                            stability: 0.45, // Slightly lower stability for more natural variation
                            similarity_boost: 0.8,
                            style: 0.1, // Small style boost for more "island" expression
                            use_speaker_boost: true
                        }
                    })
                });

                if (!response.ok) {
                    console.error('ElevenLabs API error:', response.status, response.statusText);
                    return res.status(response.status).json({ error: `ElevenLabs API error: ${response.status} ${response.statusText}` });
                }

                const audioBuffer = await response.arrayBuffer();
                res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.byteLength });
                res.send(Buffer.from(audioBuffer));
            } catch (error) {
                console.error('TTS API error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    // POST /api/translate/llm
    router.post('/llm',
        translationLimiter,
        [
            body('text').trim().notEmpty().withMessage('Text is required').isLength({ min: 1, max: 1000 }),
            body('direction').optional().isIn(['eng-to-pidgin', 'pidgin-to-eng'])
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            try {
                const { text, direction } = req.body;
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

                const vocabularySection = getRelevantVocabulary(text, direction || 'eng-to-pidgin');
                const systemPrompt = direction === 'eng-to-pidgin'
                    ? `You are an expert Hawaiian Pidgin translator. 
Translate the following English text into AUTHENTIC, natural Hawaiian Pidgin (Hawaii Creole English).

CRITICAL GRAMMAR RULES:
1. Present Tense: Use "stay" for "am/is/are" when describing a state or location (e.g., "I stay hungry", "He stay home").
2. Past Tense: Use "wen" before the verb (e.g., "I wen go" for "I went", "We wen eat" for "We ate").
3. Future Tense: Use "going" or "going go" (e.g., "I going go beach" for "I will go to the beach").
4. Negations: Use "no" for "don't", "neva" for "didn't", and "no can" for "can't".
5. Questions: Use "like" for "want to" (e.g., "You like food?" for "Do you want food?").
6. Vocabulary: Use "da" for "the", "dat" for "that", "dis" for "this", "wit" for "with", and "fo" for "for".
7. Pronouns: "They" often becomes "dey".

Maintain a friendly, casual, local island style. Do not be overly formal.
${vocabularySection}`
                    : `You are an expert Hawaiian Pidgin translator. 
Translate the following Hawaiian Pidgin text into natural English.

CRITICAL RULES:
1. Capture the intended meaning and spirit, not just a literal word-for-word translation.
2. If multiple meanings are possible, choose the most likely one based on common island usage.
3. If the Pidgin uses "stay" as a verb, it usually means "am/is/are".
4. If the Pidgin uses "wen" before a verb, it indicates past tense.

${vocabularySection}`;

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `${systemPrompt}\n\nTranslate: ${text}` }] }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
                        safetySettings: [
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    return res.status(response.status).json({ error: `Gemini API error: ${response.status}`, details: errorText });
                }

                const data = await response.json();
                const translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

                res.json({ originalText: text, translatedText: translation, direction: direction, model: 'gemini-2.5-flash-lite' });
            } catch (error) {
                console.error('Gemini Translation error:', error);
                res.status(500).json({ error: 'Translation service error' });
            }
        });

    // POST /api/translate (Google Translate)
    router.post('/',
        translationLimiter,
        [
            body('text').trim().notEmpty().withMessage('Text is required').isLength({ min: 1, max: 1000 }),
            body('targetLanguage').optional().isLength({ min: 2, max: 5 }),
            body('sourceLanguage').optional().isLength({ min: 2, max: 5 })
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            try {
                const { text, targetLanguage, sourceLanguage } = req.body;
                const target = targetLanguage || 'en';
                const source = sourceLanguage || 'en';

                const [translation] = await translate.translate(text, { from: source, to: target });
                res.json({ originalText: text, translatedText: translation, sourceLanguage: source, targetLanguage: target });
            } catch (error) {
                console.error('Google Translate API error:', error);
                res.status(500).json({ error: 'Translation service error' });
            }
        });

    return router;
};
