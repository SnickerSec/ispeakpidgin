const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userAuth = require('../middleware/user-auth');

/**
 * Local Questions API (Ask a Local)
 */
module.exports = function(supabase, limiter, gamificationService, dictionaryCache) {

    // Helper: Generate AI Response for a question
    async function generateAIResponse(questionId, questionText) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;

        try {
            // Get some context from dictionary
            let vocabContext = '';
            if (dictionaryCache.data && dictionaryCache.data.entries) {
                const entries = dictionaryCache.data.entries;
                const matched = entries
                    .filter(e => questionText.toLowerCase().includes(e.pidgin.toLowerCase()))
                    .slice(0, 10)
                    .map(e => `${e.pidgin}: ${Array.isArray(e.english) ? e.english[0] : e.english}`)
                    .join(', ');
                if (matched) vocabContext = `\n\nRelevant Pidgin Terms: ${matched}`;
            }

            const systemPrompt = `You are "Kimo," a helpful and friendly Hawaiian local expert. 
A user has asked a question about Hawaiian Pidgin or local culture. 
Provide a helpful, authentic answer in natural Pidgin.

CRITICAL RULES:
1. Respond in authentic Hawaiian Pidgin.
2. Be respectful and accurate about local culture.
3. If you don't know something specific (like a specific business's hours), give general local advice instead.
4. Keep it relatively concise (1-3 sentences).
5. Always mention that this is an "AI Suggestion" while they wait for a human expert.

FORMAT:
Respond with a JSON object:
{
  "response": "Your answer in Pidgin",
  "translation": "English translation"
}
${vocabContext}`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}\n\nQUESTION: "${questionText}"` }]
                    }],
                    generationConfig: { 
                        temperature: 0.7, 
                        responseMimeType: "application/json"
                    }
                })
            });

            if (!response.ok) return null;

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) return null;

            const parsed = JSON.parse(responseText);
            
            // Insert AI response
            const { data: aiRes, error } = await supabase
                .from('local_responses')
                .insert({
                    question_id: questionId,
                    responder_name: 'Kimo (AI)',
                    response_text: `${parsed.response}\n\n*English: ${parsed.translation}*`,
                    is_ai: true,
                    responder_avatar: '🏝️'
                })
                .select();

            if (!error) {
                // Update question status
                await supabase
                    .from('local_questions')
                    .update({ status: 'ai_suggested' })
                    .eq('id', questionId);
            }

            return aiRes;
        } catch (err) {
            console.error('AI Response Generation Error:', err);
            return null;
        }
    }

    // GET /api/questions - Fetch answered and pending questions
    router.get('/', async (req, res) => {
        try {
            const { status = 'all', limit = 20 } = req.query;
            
            let query = supabase
                .from('local_questions')
                .select(`
                    *,
                    responses:local_responses(*)
                `);

            if (status !== 'all') {
                query = query.eq('status', status);
            } else {
                query = query.in('status', ['pending', 'answered', 'ai_suggested']);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));

            if (error) throw error;
            res.json({ questions: data });
        } catch (error) {
            console.error('Fetch questions error:', error);
            res.status(500).json({ error: 'Failed to fetch questions' });
        }
    });

    // POST /api/questions - Submit a new question
    router.post('/',
        limiter,
        [
            body('user_name').optional().trim().isLength({ max: 100 }),
            body('question_text').trim().notEmpty().isLength({ min: 10, max: 2000 })
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            try {
                const { user_name, question_text } = req.body;

                const { data, error } = await supabase
                    .from('local_questions')
                    .insert([
                        { 
                            user_name: user_name || 'Anonymous', 
                            question_text, 
                            status: 'pending' 
                        }
                    ])
                    .select();

                if (error) throw error;

                // Trigger AI response generation in the background (don't await for faster response)
                // but we might want to return it immediately if possible for "Instant" feel
                const aiResponse = await generateAIResponse(data[0].id, question_text);

                // Gamification: Award XP for asking a question
                let xpResult = null;
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ') && gamificationService) {
                    const token = authHeader.substring(7);
                    const decoded = userAuth.verifyToken ? userAuth.verifyToken(token) : null;
                    if (decoded) {
                        xpResult = await gamificationService.awardXP(decoded.userId, 15, 'question_asked', data[0].id);
                    }
                }

                res.status(201).json({ 
                    message: 'Your question has been submitted! Our local experts will respond soon.',
                    question: data[0],
                    ai_response: aiResponse ? aiResponse[0] : null,
                    xp: xpResult
                });
            } catch (error) {
                console.error('Submit question error:', error);
                res.status(500).json({ error: 'Failed to submit question' });
            }
        });

    return router;
};
