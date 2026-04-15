const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userAuth = require('../middleware/user-auth');

module.exports = function(supabaseAdmin, limiter) {
    userAuth.initializeAuth(supabaseAdmin);
    const rl = limiter || ((req, res, next) => next());

    // POST /api/user/register
    router.post('/register', rl, [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('display_name').trim().notEmpty()
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password, display_name } = req.body;

        try {
            // Check if user exists
            const { data: existing } = await supabaseAdmin
                .from('user_profiles')
                .select('id')
                .eq('email', email)
                .single();
            
            if (existing) return res.status(400).json({ error: 'Email already registered' });

            const hash = await userAuth.hashPassword(password);
            
            const { data: user, error } = await supabaseAdmin
                .from('user_profiles')
                .insert([{ email, password_hash: hash, display_name }])
                .select('id, email, display_name')
                .single();

            if (error) throw error;

            const token = userAuth.generateToken(user);
            await userAuth.createSession(user.id, token, req);

            res.status(201).json({ user, token });
        } catch (error) {
            res.status(500).json({ error: 'Registration failed' });
        }
    });

    // POST /api/user/login
    router.post('/login', rl, async (req, res) => {
        const { email, password } = req.body;

        try {
            const { data: user, error } = await supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !user || !(await userAuth.verifyPassword(password, user.password_hash))) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = userAuth.generateToken(user);
            await userAuth.createSession(user.id, token, req);

            res.json({ 
                user: { id: user.id, email: user.email, display_name: user.display_name }, 
                token 
            });
        } catch (error) {
            res.status(500).json({ error: 'Login failed' });
        }
    });

    // GET /api/user/favorites
    router.get('/favorites', rl, userAuth.requireUserAuth, async (req, res) => {
        try {
            const { data, error } = await supabaseAdmin
                .from('user_favorites')
                .select('*')
                .eq('user_id', req.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json({ favorites: data });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch favorites' });
        }
    });

    // POST /api/user/favorites/toggle
    router.post('/favorites/toggle', rl, userAuth.requireUserAuth, async (req, res) => {
        const { item_type, item_id, pidgin } = req.body;

        try {
            // Check if exists
            const { data: existing } = await supabaseAdmin
                .from('user_favorites')
                .select('id')
                .eq('user_id', req.user.id)
                .eq('item_type', item_type)
                .eq('item_id', item_id)
                .single();

            if (existing) {
                await supabaseAdmin.from('user_favorites').delete().eq('id', existing.id);
                res.json({ status: 'removed' });
            } else {
                await supabaseAdmin.from('user_favorites').insert([{
                    user_id: req.user.id,
                    item_type,
                    item_id,
                    pidgin
                }]);
                res.json({ status: 'added' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Toggle favorite failed' });
        }
    });

    return router;
};
