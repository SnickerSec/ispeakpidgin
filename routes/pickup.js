const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');

/**
 * Pickup Line Routes (Standard, 808 Mode, Cringe Generator)
 */
module.exports = function(supabase, dictionaryLimiter, translationLimiter) {

    // Helper to handle validation errors
    const validate = (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    };

    // ============================================
    // PICKUP LINES API
    // ============================================

    router.get('/pickup-lines', dictionaryLimiter, [
        query('category').optional().trim().isLength({ max: 50 }),
        query('maxSpiciness').optional().isInt({ min: 1, max: 5 }).toInt()
    ], validate, async (req, res) => {
        try {
            const { category, maxSpiciness } = req.query;
            let query = supabase.from('pickup_lines').select('*');
            if (category) query = query.eq('category', category);
            if (maxSpiciness) query = query.lte('spiciness', maxSpiciness);

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch pickup lines' });
            res.json({ lines: data, count: data.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/pickup-lines/random', dictionaryLimiter, [
        query('maxSpiciness').optional().isInt({ min: 1, max: 5 }).toInt()
    ], validate, async (req, res) => {
        try {
            const { maxSpiciness = 5 } = req.query;
            const { data, error } = await supabase.from('pickup_lines').select('*').lte('spiciness', maxSpiciness);
            if (error) return res.status(500).json({ error: 'Failed to fetch pickup line' });

            const randomLine = data[Math.floor(Math.random() * data.length)];
            res.json(randomLine);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // PICKUP LINE COMPONENTS API
    // ============================================

    router.get('/pickup-components', dictionaryLimiter, async (req, res) => {
        try {
            const { type, category } = req.query;
            let query = supabase.from('pickup_line_components').select('*');
            if (type) query = query.eq('component_type', type);
            if (category) query = query.eq('category', category);

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch pickup line components' });

            const grouped = data.reduce((acc, item) => {
                const type = item.component_type;
                if (!acc[type]) acc[type] = [];
                acc[type].push(item);
                return acc;
            }, {});

            res.json({ components: data, grouped: grouped, count: data.length });
        } catch (error) {
            console.error('Pickup components API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/pickup-components/random', dictionaryLimiter, async (req, res) => {
        try {
            const { data, error } = await supabase.from('pickup_line_components').select('*');
            if (error) return res.status(500).json({ error: 'Failed to fetch components' });

            const byType = data.reduce((acc, item) => {
                const type = item.component_type;
                if (!acc[type]) acc[type] = [];
                acc[type].push(item);
                return acc;
            }, {});

            const randomPick = {};
            for (const [type, items] of Object.entries(byType)) {
                randomPick[type] = items[Math.floor(Math.random() * items.length)];
            }
            res.json(randomPick);
        } catch (error) {
            console.error('Pickup components random API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // 808 MODE LOCATIONS API
    // ============================================

    router.get('/locations-808', dictionaryLimiter, async (req, res) => {
        try {
            const { type } = req.query;
            let query = supabase.from('locations_808').select('*');
            if (type) query = query.eq('location_type', type);

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch 808 locations' });

            const grouped = data.reduce((acc, item) => {
                const locType = item.location_type;
                if (!acc[locType]) acc[locType] = [];
                acc[locType].push({ name: item.name, description: item.description, pronunciation: item.pronunciation });
                return acc;
            }, {});

            res.json({ locations: data, grouped: grouped, count: data.length });
        } catch (error) {
            console.error('808 locations API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // 808 CRINGE GENERATOR API
    // ============================================

    router.get('/cringe/activities', dictionaryLimiter, async (req, res) => {
        try {
            const { data, error } = await supabase.from('cringe_activities').select(`id, activity_key, activity_name, emoji, locations:cringe_locations(id, location_key, location_name)`);
            if (error) return res.status(500).json({ error: 'Failed to fetch activities' });
            res.json({ activities: data });
        } catch (error) {
            console.error('Cringe activities API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/cringe/generate', translationLimiter, async (req, res) => {
        try {
            const { target_style, location_key, activity } = req.query;
            if (!target_style || !location_key) return res.status(400).json({ error: 'target_style and location_key are required' });

            const { data: locationData, error: locationError } = await supabase.from('cringe_locations').select(`id, location_name, activity:cringe_activities(activity_name, activity_key)`).eq('location_key', location_key).single();
            if (locationError || !locationData) return res.status(400).json({ error: 'Invalid location_key' });

            const locationName = locationData.location_name;
            const activityName = locationData.activity?.activity_name || activity || 'local spot';
            const activityKey = locationData.activity?.activity_key || 'grindz';

            const { data: metaphors } = await supabase.from('cringe_metaphors').select('metaphor').eq('location_id', locationData.id).limit(3);
            const { data: greetings } = await supabase.from('cringe_greetings').select('greeting').eq('gender', target_style);
            const { data: payoffs } = await supabase.from('cringe_payoffs').select('payoff').limit(5);

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                const greeting = greetings?.[Math.floor(Math.random() * greetings.length)]?.greeting || 'Howzit';
                const metaphor = metaphors?.[Math.floor(Math.random() * metaphors.length)]?.metaphor || `you stay beautiful like ${locationName}`;
                const payoff = payoffs?.[Math.floor(Math.random() * payoffs.length)]?.payoff || 'Like go out wit me?';
                return res.json({ pickup_line: `${greeting}, ${metaphor}. ${payoff}`, components: { greeting, metaphor, payoff, location: locationName }, source: 'database' });
            }

            const styleLabel = target_style === 'wahine' ? 'wahine (woman)' : 'kane (man)';
            const activityContexts = { grindz: `This is a famous food spot...`, beach: `This is a beach/surf spot...`, hiking: `This is a hiking trail/nature spot...` };
            const activityContext = activityContexts[activityKey] || activityContexts.grindz;

            const prompt = `Generate ONE SHORT, punchy Hawaiian Pidgin pickup line for a ${styleLabel} about "${locationName}"...`;
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

            const geminiResponse = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.85, maxOutputTokens: 150 }
                })
            });

            if (!geminiResponse.ok) throw new Error(`Gemini API error: ${geminiResponse.status}`);
            const geminiData = await geminiResponse.json();
            const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

            let parsed;
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
                else throw new Error('No JSON found in response');
            } catch (parseError) {
                const greeting = greetings?.[Math.floor(Math.random() * greetings.length)]?.greeting || 'Howzit';
                const metaphor = metaphors?.[Math.floor(Math.random() * metaphors.length)]?.metaphor || `you stay beautiful like ${locationName}`;
                const payoff = payoffs?.[Math.floor(Math.random() * payoffs.length)]?.payoff || 'Like go out wit me?';
                return res.json({ pickup_line: `${greeting}, ${metaphor}. ${payoff}`, components: { greeting, metaphor, payoff, location: locationName }, source: 'database-fallback' });
            }

            res.json({ pickup_line: parsed.pidgin, english: parsed.english, components: { location: locationName, activity: activityName }, source: 'gemini' });
        } catch (error) {
            console.error('Cringe generate API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // AI PICKUP LINE GENERATOR
    // ============================================

    router.post('/generate-pickup-line', translationLimiter, [
        body('context').optional().isIn(['romantic', 'funny', 'sweet', 'bold', 'classic']).withMessage('Invalid context')
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { context = 'romantic' } = req.body;
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

            const contextPrompts = {
                romantic: 'romantic and sweet',
                funny: 'funny and playful',
                sweet: 'genuinely sweet and heartfelt',
                bold: 'bold and confident',
                classic: 'classic and charming'
            };

            const systemPrompt = `You are a Hawaiian Pidgin expert and creative writer. Generate an original, ${contextPrompts[context]} Hawaiian Pidgin pickup line.

REQUIREMENTS:
1. Use authentic Hawaiian Pidgin grammar and vocabulary
2. Include cultural references (food, places, lifestyle)
3. Be ${context} but respectful
4. Use common Pidgin words like: da kine, choke, ono, pau, grindz, brah, sistah, stay, wen

RESPONSE FORMAT (JSON only):
{
  "pidgin": "the pickup line in Hawaiian Pidgin",
  "pronunciation": "phonetic guide (e.g., 'EH, you dah KYNE')",
  "english": "English translation",
  "cultural_note": "brief explanation of any cultural references"
}

Generate ONE original pickup line now.`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { temperature: 0.9, maxOutputTokens: 300 }
                })
            });

            if (!response.ok) {
                console.error('Gemini API error:', response.status);
                return res.status(response.status).json({ error: `Gemini API error: ${response.status}` });
            }

            const data = await response.json();
            let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (!aiResponse) return res.status(500).json({ error: 'No response from AI' });

            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) aiResponse = jsonMatch[0];

            const pickupLine = JSON.parse(aiResponse);
            res.json({
                pidgin: pickupLine.pidgin,
                pronunciation: pickupLine.pronunciation || pickupLine.pidgin,
                english: pickupLine.english,
                culturalNote: pickupLine.cultural_note,
                context: context,
                aiGenerated: true
            });
        } catch (error) {
            console.error('Pickup line generation error:', error);
            res.status(500).json({ error: 'Generation service error' });
        }
    });

    // ============================================
    // AI PICKUP LINE ENHANCER
    // ============================================

    router.post('/enhance-pickup-line', translationLimiter, [
        body('pidgin').trim().notEmpty().withMessage('Pidgin text is required').isLength({ max: 200 }).withMessage('Text too long'),
        body('english').optional().trim().isLength({ max: 200 })
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { pidgin, english } = req.body;
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

            const systemPrompt = `You are a Hawaiian Pidgin expert. Given this pickup line, provide 3 enhanced variations that are more creative, culturally rich, or impactful.

Original line:
Pidgin: "${pidgin}"
${english ? `English: "${english}"` : ''}

Provide 3 variations in JSON format:
{
  "variations": [
    {
      "pidgin": "enhanced version 1",
      "pronunciation": "phonetic guide",
      "english": "English translation",
      "improvement": "what makes this better"
    }
  ]
}`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 500 }
                })
            });

            if (!response.ok) {
                console.error('Gemini API error:', response.status);
                return res.status(response.status).json({ error: `Gemini API error: ${response.status}` });
            }

            const data = await response.json();
            let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (!aiResponse) return res.status(500).json({ error: 'No response from AI' });

            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) aiResponse = jsonMatch[0];

            const enhanced = JSON.parse(aiResponse);
            res.json({ original: { pidgin, english }, variations: enhanced.variations || [] });
        } catch (error) {
            console.error('Enhancement error:', error);
            res.status(500).json({ error: 'Enhancement service error' });
        }
    });

    return router;
};
