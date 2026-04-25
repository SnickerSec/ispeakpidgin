const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userAuth = require('../middleware/user-auth');

/**
 * AI & Chat Routes
 */
module.exports = function(supabase, dictionaryCache, limiter, gamificationService) {

    // Simple bot protection: Ensure request comes from our own site
    const botProtection = (req, res, next) => {
        const referer = req.get('Referer');
        const origin = req.get('Origin');
        const isDev = process.env.NODE_ENV === 'development' || req.hostname === 'localhost' || req.hostname === '127.0.0.1';

        if (isDev) return next();

        const source = referer || origin;
        if (source) {
            try {
                const url = new URL(source);
                const allowedDomains = ['chokepidgin.com', 'www.chokepidgin.com'];
                if (allowedDomains.includes(url.hostname) || url.hostname.endsWith('.chokepidgin.com')) {
                    return next();
                }
            } catch (e) {
                // Ignore invalid URLs
            }
        }
        
        // If no referer/origin in production, or it doesn't match
        console.warn(`Blocked request from hostname: ${req.hostname}, referer: ${referer}, origin: ${origin}`);
        return res.status(403).json({ error: 'Direct API access not allowed' });
    };
    // Helper: Get relevant vocabulary for context injection
    function getRelevantVocabulary(text, maxEntries = 25) {
        if (!dictionaryCache.data || !dictionaryCache.data.entries) return '';

        const entries = dictionaryCache.data.entries;
        const inputLower = text.toLowerCase();
        
        // Simple matching logic
        const matched = [];
        for (const entry of entries) {
            if (matched.length >= maxEntries) break;
            
            const pidgin = (entry.pidgin || '').toLowerCase();
            const englishArr = Array.isArray(entry.english) ? entry.english : [entry.english];
            
            if (inputLower.includes(pidgin) || englishArr.some(e => inputLower.includes((e || '').toLowerCase()))) {
                matched.push(`${entry.pidgin} (${englishArr[0]})`);
            }
        }

        if (matched.length === 0) return '';
        return `\n\nContextual Pidgin Vocabulary: ${matched.join(', ')}`;
    }

    // POST /api/ai/talk-story - Interactive Pidgin Tutor
    router.post('/talk-story',
        limiter,
        botProtection,
        [
            body('message').trim().notEmpty().isLength({ max: 1000 }),
            body('history').optional().isArray(),
            body('character').optional().isIn(['kimo', 'aunty', 'braddah'])
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            try {
                const { message, history = [], character = 'kimo' } = req.body;
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

                const vocabulary = getRelevantVocabulary(message);
                
                const characters = {
                    kimo: {
                        name: "Kimo",
                        desc: "a friendly and patient Hawaiian Pidgin tutor. He likes to help people learn correctly but stay casual.",
                        voiceId: "f0ODjLMfcJmlKfs7dFCW"
                    },
                    aunty: {
                        name: "Aunty Leilani",
                        desc: "a warm, wise, and slightly sassy Hawaiian Aunty. She uses more traditional Pidgin and often talks about food, family, and respect (mana'o).",
                        voiceId: "EXAVITQu4vr4xnSDxMaL" // Sarah (mature, warm)
                    },
                    braddah: {
                        name: "Braddah Shane",
                        desc: "a young, super casual surfer braddah. He uses lots of slang (chee-hoo, rajah, shoots) and talks about the beach and good times.",
                        voiceId: "ErXwbc3VNbCc1k9An9bS" // Ethan (casual, male)
                    }
                };

                const activeChar = characters[character] || characters.kimo;

                const systemPrompt = `
You are "${activeChar.name}," ${activeChar.desc}
Your goal is to "talk story" with the user to help them practice their Pidgin while being an informative and helpful local guide.

GUIDELINES:
1. Always respond in authentic, natural Hawaiian Pidgin. 
2. Be helpful and knowledgeable. If the user asks a question or for a recommendation, provide a direct, informative answer based on local Hawaii knowledge before trying to keep the conversation going.
3. Do not answer a question with only another question. Always provide value or info first.
4. Keep your responses consistent with your specific personality (${activeChar.name}).
5. If the user makes a big mistake in their Pidgin, gently suggest the correct way to say it in your response.
6. If they speak English, respond in Pidgin but keep it simple enough for them to follow.
7. Use the provided vocabulary context to ensure accuracy.

RESPONSE FORMAT:
Respond in JSON format:
{
  "pidgin": "Your response in authentic Pidgin",
  "translation": "English translation of your response",
  "hint": "A small tip about a word or grammar point used in this exchange (optional)",
  "character": "${character}",
  "voiceId": "${activeChar.voiceId}"
}
${vocabulary}`;

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

                // Format history for Gemini
                const contents = history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));
                
                // Add system prompt and current message
                contents.unshift({
                    role: 'user',
                    parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}` }]
                });
                contents.push({
                    role: 'user',
                    parts: [{ text: message }]
                });

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: contents,
                        generationConfig: { 
                            temperature: 0.7, 
                            maxOutputTokens: 800,
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('Gemini API Error:', response.status, errText);
                    return res.status(response.status).json({ error: 'AI service currently unavailable' });
                }

                const data = await response.json();
                const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                
                try {
                    const parsed = JSON.parse(responseText);
                    
                    // Gamification: Award XP for chatting
                    let xpResult = null;
                    const authHeader = req.headers.authorization;
                    if (authHeader && authHeader.startsWith('Bearer ') && gamificationService) {
                        const token = authHeader.substring(7);
                        const decoded = userAuth.verifyToken ? userAuth.verifyToken(token) : null;
                        if (decoded) {
                            xpResult = await gamificationService.awardXP(decoded.userId, 10, 'ai_chat', 'first_chat');
                            await gamificationService.awardBadge(decoded.userId, 'talk_story_pro');
                        }
                    }
                    
                    res.json({ ...parsed, xp: xpResult });
                } catch (e) {
                    // Fallback if AI doesn't return perfect JSON
                    res.json({
                        pidgin: responseText,
                        translation: "Sorry brah, my brain wen stay freeze for one second.",
                        hint: "AI had trouble formatting the response."
                    });
                }

            } catch (error) {
                console.error('Talk Story API error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    // POST /api/ai/translate - Semantic RAG-based Translation
    router.post('/translate',
        limiter,
        botProtection,
        [
            body('text').trim().notEmpty().isLength({ max: 500 }),
            body('direction').isIn(['eng-to-pidgin', 'pidgin-to-eng']),
            body('context').optional().isArray(),
            body('tone').optional().isIn(['light', 'standard', 'heavy'])
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            try {
                const { text, direction, context = [], tone = 'standard' } = req.body;
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

                let contextStr = '';
                if (context.length > 0) {
                    contextStr = '\n\nVERIFIED VOCABULARY CONTEXT (Use these terms first):\n' + 
                        context.map(c => `- "${c.pidgin}": ${Array.isArray(c.english) ? c.english.join(', ') : c.english}${c.usage ? ' (Usage: ' + c.usage + ')' : ''}`).join('\n');
                }

                let styleGuidance = '';
                if (direction === 'eng-to-pidgin') {
                    if (tone === 'light') {
                        styleGuidance = '\nSTYLE: "Visitor Friendly / Light Pidgin" - Use standard English grammar mostly, but pepper in core local vocabulary. Keep it very easy to understand for non-locals.';
                    } else if (tone === 'heavy') {
                        styleGuidance = '\nSTYLE: "Street / Heavy Pidgin" - Use thick, authentic local grammar and heavy slang. Make it sound like a local talking to a lifelong friend. Use shortcuts like "whatchu", "buggah", "om".';
                    } else {
                        styleGuidance = '\nSTYLE: "Standard Local Pidgin" - Balanced, everyday Pidgin used in Honolulu. Natural mix of local grammar and vocabulary.';
                    }
                }

                const systemPrompt = direction === 'eng-to-pidgin' 
                    ? `You are an expert Hawaiian Pidgin translator. 
Translate the following English text into AUTHENTIC, natural Hawaiian Pidgin.${styleGuidance}

CRITICAL RULES:
1. Use the provided VERIFIED VOCABULARY if relevant.
2. Maintain local island style (e.g., use "stay" for location/state, "wen" for past tense, "da" for the).
3. Do not be overly formal or academic.
4. If the text is a question, use natural Pidgin question structures.

${contextStr}

RESPONSE FORMAT:
Respond only with a JSON object:
{
  "translation": "The Pidgin translation",
  "explanation": "Briefly explain one key Pidgin word or grammar rule used",
  "confidence": 0.95
}`
                    : `You are an expert Hawaiian Pidgin translator. 
Translate the following Hawaiian Pidgin text into natural English.

CRITICAL RULES:
1. Use the provided VERIFIED VOCABULARY if relevant.
2. Capture the intended meaning, not just a literal word-for-word translation.
3. If multiple meanings are possible, choose the most likely one based on common island usage.

${contextStr}

RESPONSE FORMAT:
Respond only with a JSON object:
{
  "translation": "The English translation",
  "explanation": "Briefly explain the origin or meaning of one key Pidgin term from the source",
  "confidence": 0.95
}`;

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}\n\nTEXT TO TRANSLATE: "${text}"` }]
                        }],
                        generationConfig: { 
                            temperature: 0.2, // Lower temperature for more accurate translation
                            maxOutputTokens: 500,
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Gemini API Error: ${response.status}`);
                }

                const data = await response.json();
                const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                
                try {
                    const parsed = JSON.parse(responseText);
                    res.json(parsed);
                } catch (e) {
                    res.status(500).json({ error: 'AI returned invalid format' });
                }

            } catch (error) {
                console.error('AI Translation error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    return router;
};
