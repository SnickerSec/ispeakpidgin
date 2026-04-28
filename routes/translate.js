const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

/**
 * Translation Routes (Google Translate, Gemini LLM, TTS)
 */
module.exports = function(translate, translationLimiter, dictionaryCache, supabase) {

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
                .isLength({ min: 1, max: 1000 }).withMessage('Text must be between 1 and 1000 characters')
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.warn('TTS validation error:', errors.array());
                return res.status(400).json({ errors: errors.array() });
            }

            try {
                const { text, originalText, voiceId: requestedVoiceId } = req.body;
                const apiKey = process.env.ELEVENLABS_API_KEY;
                if (!apiKey) {
                    console.error('ElevenLabs API key missing');
                    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
                }

                const defaultVoiceId = 'f0ODjLMfcJmlKfs7dFCW'; // Hawaiian-sounding voice
                const allowedVoices = [
                    'f0ODjLMfcJmlKfs7dFCW', // Kimo / Hawaiian
                    'EXAVITQu4vr4xnSDxMaL', // Sarah / Aunty
                    'ErXwbc3VNbCc1k9An9bS'  // Ethan / Braddah
                ];

                let voiceId = defaultVoiceId;
                if (requestedVoiceId && allowedVoices.includes(requestedVoiceId)) {
                    voiceId = requestedVoiceId;
                }

                // 1. Check Cache First
                const normalizedText = text.trim().toLowerCase();
                const textHash = crypto.createHash('md5').update(normalizedText).digest('hex');
                const BUCKET_NAME = 'audio-assets';

                if (supabase) {
                    try {
                        const { data: cached } = await supabase
                            .from('translation_cache')
                            .select('audio_filename')
                            .eq('md5_hash', textHash)
                            .eq('voice_id', voiceId)
                            .single();

                        if (cached && cached.audio_filename) {
                            console.log(`📡 Serving cached TTS for: ${textHash}`);
                            const { data: audioData, error: downloadError } = await supabase.storage
                                .from(BUCKET_NAME)
                                .download(cached.audio_filename);

                            if (!downloadError && audioData) {
                                const audioBuffer = await audioData.arrayBuffer();
                                res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.byteLength });
                                return res.send(Buffer.from(audioBuffer));
                            }
                        }
                    } catch (cacheError) {
                        console.warn('TTS Cache check failed:', cacheError.message);
                    }
                }

                // 2. Generate new audio
                const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
                console.log(`Processing NEW TTS request for voice: ${voiceId}, length: ${text.length}`);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': apiKey
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                            style: 0.0,
                            use_speaker_boost: true
                        }
                    })
                });

                if (!response.ok) {
                    const errorDetails = await response.text();
                    return res.status(response.status).json({ 
                        error: `ElevenLabs API error: ${response.status} ${response.statusText}`,
                        details: errorDetails
                    });
                }

                const audioBuffer = Buffer.from(await response.arrayBuffer());

                // 3. Save to Cache & Storage asynchronously
                if (supabase) {
                    const filename = `cached_${voiceId}_${textHash}.mp3`;
                    
                    // Upload to Storage
                    supabase.storage.from(BUCKET_NAME).upload(filename, audioBuffer, {
                        contentType: 'audio/mpeg',
                        upsert: true
                    }).then(({ error: uploadError }) => {
                        if (!uploadError) {
                            // Update database record
                            supabase.from('translation_cache').upsert({
                                original_text: originalText || text,
                                translated_text: text,
                                direction: 'tts',
                                voice_id: voiceId,
                                audio_filename: filename,
                                md5_hash: textHash
                            }).catch(err => console.error('Cache DB update failed:', err));
                        }
                    }).catch(err => console.error('Cache upload failed:', err));
                }

                res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.length });
                res.send(audioBuffer);
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
            body('direction').optional().isIn(['eng-to-pidgin', 'pidgin-to-eng']),
            body('tone').optional().isIn(['light', 'standard', 'heavy'])
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            try {
                const { text, direction, tone = 'standard' } = req.body;
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

                // Add tone to hash to ensure unique caching for different styles
                const textHash = crypto.createHash('md5').update(`${text.trim().toLowerCase()}_${tone}`).digest('hex');
                const transDirection = direction || 'eng-to-pidgin';

                // 1. Check Cache
                if (supabase) {
                    try {
                        const { data: cached } = await supabase
                            .from('translation_cache')
                            .select('translated_text')
                            .eq('md5_hash', textHash)
                            .eq('direction', transDirection)
                            .single();

                        if (cached && cached.translated_text) {
                            console.log(`📡 Serving cached translation for: ${textHash} [${tone}]`);
                            return res.json({ 
                                originalText: text, 
                                translatedText: cached.translated_text, 
                                direction: transDirection, 
                                tone,
                                model: 'cache',
                                cached: true
                            });
                        }
                    } catch (e) {
                        console.warn('Translation cache check failed:', e.message);
                    }
                }

                // 2. Generate new translation
                const vocabularySection = getRelevantVocabulary(text, transDirection);
                
                let toneGuidance = '';
                if (tone === 'light') {
                    toneGuidance = `STYLE: "Visitor Friendly / Light Pidgin"
- Use standard English grammar mostly, but pepper in core local vocabulary (da, stay, brah).
- Keep it very easy to understand for someone not from Hawaii.
- Avoid heavy sentence structure changes.`;
                } else if (tone === 'heavy') {
                    toneGuidance = `STYLE: "Street / Heavy Pidgin"
- Use thick, authentic local grammar and heavy slang.
- Maximize use of "stay" (stative), "wen" (past), "om" (them), "buggah", etc.
- Use local contractions and shortcuts (e.g., "Whatchu" instead of "What you").
- Make it sound like a local talking to a lifelong friend in the country.`;
                } else {
                    toneGuidance = `STYLE: "Standard Local Pidgin"
- Balanced, everyday Pidgin used in Honolulu.
- Natural mix of HCE grammar and local vocabulary.`;
                }

                const systemPrompt = transDirection === 'eng-to-pidgin'
                    ? `You are an expert Hawaiian Pidgin translator.
Translate the following English text into AUTHENTIC Hawaiian Pidgin (Hawaii Creole English).

${toneGuidance}

CRITICAL GRAMMAR RULES:
1. Present Tense: Use "stay" for "am/is/are" when describing a state or location (e.g., "I stay hungry", "He stay home").
2. Past Tense: Use "wen" before the verb (e.g., "I wen go" for "I went", "We wen eat" for "We ate").
3. Future Tense: Use "going" or "going go" (e.g., "I going go beach" for "I will go to the beach").
4. Negations: Use "no" for "don't", "neva" for "didn't", and "no can" for "can't".
5. Questions: Use "like" for "want to" (e.g., "You like food?" for "Do you want food?").
6. Vocabulary: Use "da" for "the", "dat" for "that", "dis" for "this", "wit" for "with", and "fo" for "for".
7. Pronouns: "They" often becomes "dey", "them" becomes "om" or "dehm".

Maintain a friendly, casual, local island style. 
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
                        system_instruction: {
                            parts: [{ text: systemPrompt }]
                        },
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: `Translate this text: "${text}"` }]
                            }
                        ],
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

                // 3. Save to Cache
                if (supabase && translation) {
                    supabase.from('translation_cache').upsert({
                        original_text: text,
                        translated_text: translation,
                        direction: transDirection,
                        md5_hash: textHash
                    }).catch(err => console.error('Translation cache save failed:', err));
                }

                res.json({ originalText: text, translatedText: translation, direction: transDirection, model: 'gemini-2.5-flash-lite', cached: false });
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
