const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const userAuth = require('../middleware/user-auth');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client();

const rl = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = function(supabaseAdmin, gamificationService) {
    userAuth.initializeAuth(supabaseAdmin);

    // POST /api/user/register
    router.post('/register', rl, [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('display_name').trim().notEmpty().withMessage('Display name is required').custom(value => {
            if (/[<>]/.test(value)) {
                throw new Error('Display name cannot contain < or > characters');
            }
            return true;
        })
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
        }

        const { email, password, display_name } = req.body;

        try {
            // Check if user exists
            const { data: existing } = await supabaseAdmin
                .from('user_profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();
            
            if (existing) {
                return res.status(400).json({ error: 'Email already registered. Try logging in!' });
            }

            const hash = await userAuth.hashPassword(password);
            
            const { data: user, error } = await supabaseAdmin
                .from('user_profiles')
                .insert([{
                    email,
                    password_hash: hash,
                    display_name: display_name.trim(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select('id, email, display_name, current_rank, total_xp')
                .single();

            if (error) {
                console.error('Registration insert error:', error);
                return res.status(500).json({ error: 'Failed to create user profile: ' + error.message });
            }

            // Gamification: Award registration XP and badge
            if (gamificationService) {
                try {
                    await gamificationService.awardXP(user.id, 50, 'registration');
                    await gamificationService.awardBadge(user.id, 'malahini_arrival');
                } catch (gameErr) {
                    console.error('Gamification award error:', gameErr.message);
                }
            }

            const token = userAuth.generateToken(user);
            await userAuth.createSession(user.id, token, req);

            res.status(201).json({ 
                user: { 
                    id: user.id, 
                    email: user.email, 
                    display_name: user.display_name,
                    current_rank: user.current_rank || 'Malahini',
                    total_xp: user.total_xp || 50
                }, 
                token 
            });
        } catch (error) {
            console.error('Registration exception:', error);
            res.status(500).json({ error: error.message || 'Registration failed' });
        }
    });

    // POST /api/user/login
    router.post('/login', rl, async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        try {
            const { data: user, error } = await supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('email', email.trim().toLowerCase())
                .maybeSingle();

            if (error || !user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            if (!user.password_hash) {
                return res.status(401).json({ error: 'This account was created with Google Sign-In. Please sign in with Google.' });
            }

            const isValid = await userAuth.verifyPassword(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Update last_login
            await supabaseAdmin
                .from('user_profiles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', user.id);

            const token = userAuth.generateToken(user);
            await userAuth.createSession(user.id, token, req);

            res.json({ 
                user: { 
                    id: user.id, 
                    email: user.email, 
                    display_name: user.display_name,
                    avatar_url: user.avatar_url,
                    current_rank: user.current_rank || 'Malahini',
                    total_xp: user.total_xp || 0
                }, 
                token 
            });
        } catch (error) {
            console.error('Login exception:', error);
            res.status(500).json({ error: error.message || 'Login failed' });
        }
    });

    // POST /api/user/google-auth
    // Handles Google Sign-In with either ID token or verified Google profile
    router.post('/google-auth', rl, async (req, res) => {
        const { credential, email, name, picture, sub } = req.body;

        try {
            let googleEmail = email;
            let googleName = name;
            let googlePicture = picture;
            let googleSub = sub;

            // If a Google credential JWT is provided, verify or decode it
            if (credential) {
                try {
                    // If GOOGLE_CLIENT_ID is configured, verify signature
                    if (process.env.GOOGLE_CLIENT_ID) {
                        const ticket = await googleClient.verifyIdToken({
                            idToken: credential,
                            audience: process.env.GOOGLE_CLIENT_ID
                        });
                        const payload = ticket.getPayload();
                        googleEmail = payload.email;
                        googleName = payload.name;
                        googlePicture = payload.picture;
                        googleSub = payload.sub;
                    } else {
                        // Decode token payload (base64)
                        const parts = credential.split('.');
                        if (parts.length === 3) {
                            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                            googleEmail = payload.email;
                            googleName = payload.name;
                            googlePicture = payload.picture;
                            googleSub = payload.sub;
                        }
                    }
                } catch (verifyErr) {
                    console.error('Google token verification error:', verifyErr);
                    return res.status(400).json({ error: 'Invalid Google authentication token' });
                }
            }

            if (!googleEmail) {
                return res.status(400).json({ error: 'Google authentication failed: missing email' });
            }

            // Check if user already exists
            let { data: user } = await supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('email', googleEmail.toLowerCase())
                .maybeSingle();

            if (!user && googleSub) {
                const { data: userByGoogleId } = await supabaseAdmin
                    .from('user_profiles')
                    .select('*')
                    .eq('google_id', googleSub)
                    .maybeSingle();
                user = userByGoogleId;
            }

            let isNewUser = false;

            if (user) {
                // Existing user: update last login and picture
                await supabaseAdmin
                    .from('user_profiles')
                    .update({ 
                        last_login: new Date().toISOString(),
                        google_id: googleSub || user.google_id,
                        avatar_url: googlePicture || user.avatar_url,
                        display_name: user.display_name || googleName
                    })
                    .eq('id', user.id);
            } else {
                // New user: create account
                isNewUser = true;
                const { data: newUser, error: createError } = await supabaseAdmin
                    .from('user_profiles')
                    .insert([{
                        email: googleEmail.toLowerCase(),
                        display_name: (googleName || 'Local Legend').trim(),
                        avatar_url: googlePicture || null,
                        google_id: googleSub || null,
                        total_xp: 50,
                        current_rank: 'Malahini',
                        last_login: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.error('Google user creation error:', createError);
                    return res.status(500).json({ error: 'Failed to create user account' });
                }
                user = newUser;

                if (gamificationService) {
                    try {
                        await gamificationService.awardXP(user.id, 50, 'registration');
                        await gamificationService.awardBadge(user.id, 'malahini_arrival');
                    } catch (e) {}
                }
            }

            const token = userAuth.generateToken(user);
            await userAuth.createSession(user.id, token, req);

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    display_name: user.display_name,
                    avatar_url: user.avatar_url,
                    current_rank: user.current_rank || 'Malahini',
                    total_xp: user.total_xp || 50
                },
                token,
                isNewUser
            });
        } catch (error) {
            console.error('Google auth exception:', error);
            res.status(500).json({ error: error.message || 'Google authentication failed' });
        }
    });

    // GET /api/user/me
    router.get('/me', rl, userAuth.requireUserAuth, async (req, res) => {
        try {
            const { data: user, error } = await supabaseAdmin
                .from('user_profiles')
                .select('id, email, display_name, avatar_url, total_xp, current_level, current_rank')
                .eq('id', req.user.id)
                .single();

            if (error || !user) return res.status(404).json({ error: 'User not found' });
            res.json({ user });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch user profile' });
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
            res.json({ favorites: data || [] });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch favorites' });
        }
    });

    // GET /api/user/gamification
    router.get('/gamification', rl, userAuth.requireUserAuth, async (req, res) => {
        try {
            if (!gamificationService) return res.status(501).json({ error: 'Gamification service not available' });
            const data = await gamificationService.getUserGamification(req.user.id);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch gamification data' });
        }
    });

    // POST /api/user/favorites/toggle
    router.post('/favorites/toggle', rl, userAuth.requireUserAuth, async (req, res) => {
        const { item_type = 'word', item_id = 0, pidgin } = req.body;

        if (!pidgin) {
            return res.status(400).json({ error: 'Pidgin word/phrase is required' });
        }

        try {
            // Check if exists
            const { data: existing } = await supabaseAdmin
                .from('user_favorites')
                .select('id')
                .eq('user_id', req.user.id)
                .eq('item_type', item_type)
                .eq('pidgin', pidgin)
                .maybeSingle();

            if (existing) {
                await supabaseAdmin.from('user_favorites').delete().eq('id', existing.id);
                res.json({ status: 'removed', pidgin });
            } else {
                await supabaseAdmin.from('user_favorites').insert([{
                    user_id: req.user.id,
                    item_type,
                    item_id,
                    pidgin
                }]);

                // Gamification: Award XP for favoriting
                if (gamificationService) {
                    try {
                        await gamificationService.awardXP(req.user.id, 10, 'word_favorite', `fav_${item_type}_${pidgin}`);
                        await gamificationService.awardBadge(req.user.id, 'first_shaka');
                    } catch (e) {}
                }

                res.json({ status: 'added', pidgin });
            }
        } catch (error) {
            console.error('Toggle favorite error:', error);
            res.status(500).json({ error: 'Toggle favorite failed' });
        }
    });

    return router;
};
