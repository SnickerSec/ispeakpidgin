const express = require('express');
const router = express.Router();
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

    // GET /api/user/auth-config
    // Exposes the public OAuth client ID so the login page can render the Google button.
    router.get('/auth-config', (req, res) => {
        res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null });
    });

    // POST /api/user/google-auth
    // Google Sign-In is the only way to sign in. The client sends the ID token (credential)
    // from Google Identity Services; identity comes solely from its verified payload.
    router.post('/google-auth', rl, async (req, res) => {
        const { credential } = req.body || {};

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('Google auth attempted but GOOGLE_CLIENT_ID is not configured');
            return res.status(503).json({ error: 'Google Sign-In is not configured' });
        }

        if (!credential || typeof credential !== 'string') {
            return res.status(400).json({ error: 'Missing Google credential' });
        }

        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch (verifyErr) {
            console.error('Google token verification error:', verifyErr.message);
            return res.status(401).json({ error: 'Invalid Google authentication token' });
        }

        if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) {
            return res.status(401).json({ error: 'Google account email is not verified' });
        }

        const googleSub = payload.sub;
        const googleEmail = payload.email.toLowerCase();
        const googleName = payload.name;
        const googlePicture = payload.picture;

        try {
            // Match by Google ID first; fall back to email so accounts created before
            // Google-only sign-in (email + password) are linked rather than duplicated.
            let { data: user } = await supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('google_id', googleSub)
                .maybeSingle();

            if (!user) {
                const { data: userByEmail } = await supabaseAdmin
                    .from('user_profiles')
                    .select('*')
                    .eq('email', googleEmail)
                    .maybeSingle();
                user = userByEmail;
            }

            let isNewUser = false;

            if (user) {
                await supabaseAdmin
                    .from('user_profiles')
                    .update({
                        last_login: new Date().toISOString(),
                        google_id: googleSub,
                        avatar_url: googlePicture || user.avatar_url,
                        display_name: user.display_name || googleName
                    })
                    .eq('id', user.id);
            } else {
                isNewUser = true;
                const { data: newUser, error: createError } = await supabaseAdmin
                    .from('user_profiles')
                    .insert([{
                        email: googleEmail,
                        display_name: (googleName || 'Local Legend').trim(),
                        avatar_url: googlePicture || null,
                        google_id: googleSub,
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
                    display_name: user.display_name || googleName,
                    avatar_url: googlePicture || user.avatar_url,
                    current_rank: user.current_rank || 'Malahini',
                    total_xp: user.total_xp || 50
                },
                token,
                isNewUser
            });
        } catch (error) {
            console.error('Google auth exception:', error);
            res.status(500).json({ error: 'Google authentication failed' });
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
