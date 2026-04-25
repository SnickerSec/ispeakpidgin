const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userAuth = require('../middleware/user-auth');

/**
 * User Suggestions Routes
 */
module.exports = function(supabase, limiter, gamificationService) {

    // POST /api/suggestions - Submit a new word/phrase suggestion
    router.post('/',
        limiter,
        [
            body('pidgin').trim().notEmpty().isLength({ max: 200 }),
            body('english').trim().notEmpty().isLength({ max: 500 }),
            body('example').optional().trim().isLength({ max: 1000 }),
            body('contributor_name').optional().trim().isLength({ max: 100 })
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

                // Gamification: Award XP for submission
                let xpResult = null;
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ') && gamificationService) {
                    const token = authHeader.substring(7);
                    const decoded = userAuth.verifyToken ? userAuth.verifyToken(token) : null;
                    if (decoded) {
                        xpResult = await gamificationService.awardXP(decoded.userId, 20, 'suggestion_submitted');
                    }
                }

                res.status(201).json({ 
                    message: 'Mahalo! Your suggestion has been submitted for review.',
                    xp: xpResult
                });
            } catch (error) {
                console.error('Suggestion API error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    return router;
};
