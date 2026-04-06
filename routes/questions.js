const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

/**
 * Local Questions API (Ask a Local)
 */
module.exports = function(supabase, limiter) {

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
                query = query.in('status', ['pending', 'answered']);
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

                res.status(201).json({ 
                    message: 'Your question has been submitted! Our local experts will respond soon.',
                    question: data[0]
                });
            } catch (error) {
                console.error('Submit question error:', error);
                res.status(500).json({ error: 'Failed to submit question' });
            }
        });

    return router;
};
