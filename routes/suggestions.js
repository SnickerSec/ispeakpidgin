const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

/**
 * User Suggestions Routes
 */
module.exports = function(supabase, limiter) {

    // POST /api/suggestions - Submit a new word suggestion
    router.post('/',
        limiter,
        [
            body('pidgin').trim().notEmpty().isLength({ max: 100 }).escape(),
            body('english').trim().notEmpty().isLength({ max: 500 }).escape(),
            body('example').optional().trim().isLength({ max: 1000 }).escape(),
            body('contributor_name').optional().trim().isLength({ max: 100 }).escape()
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            try {
                const { pidgin, english, example, contributor_name } = req.body;

                const { data, error } = await supabase
                    .from('user_suggestions')
                    .insert([
                        { 
                            pidgin, 
                            english, 
                            example, 
                            contributor_name: contributor_name || 'Anonymous',
                            status: 'pending'
                        }
                    ]);

                if (error) {
                    console.error('Supabase suggestion error:', error);
                    return res.status(500).json({ error: 'Failed to save suggestion' });
                }

                res.status(201).json({ message: 'Mahalo! Your suggestion has been submitted for review.' });
            } catch (error) {
                console.error('Suggestion API error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    return router;
};
