const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

/**
 * Admin Routes (Login, Settings, Audit Logs, Tests)
 */
module.exports = function(supabaseAdmin, adminAuth, settingsManager, adminLoginLimiter) {

    // POST /api/admin/login
    router.post('/login', adminLoginLimiter, [
        body('username').trim().notEmpty().isLength({ min: 3, max: 50 }),
        body('password').notEmpty().isLength({ min: 12, max: 128 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    ], async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { username, password } = req.body;
            const user = await adminAuth.getUserByUsername(username);
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            if (adminAuth.isAccountLocked(user)) {
                const lockRemaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
                return res.status(423).json({ error: `Account locked. Try again in ${lockRemaining} minutes.` });
            }

            const validPassword = await adminAuth.verifyPassword(password, user.password_hash);
            if (!validPassword) {
                await adminAuth.incrementFailedAttempts(user.id);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            await adminAuth.resetFailedAttempts(user.id);
            const token = adminAuth.generateToken(user);
            await adminAuth.createSession(user.id, token, req);
            await adminAuth.logAuditAction({ userId: user.id, username: user.username, action: 'LOGIN', req });

            res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    });

    // POST /api/admin/logout
    router.post('/logout', adminAuth.requireAdminAuth, async (req, res) => {
        try {
            await adminAuth.revokeSession(req.adminToken);
            await adminAuth.logAuditAction({ userId: req.adminUser.id, username: req.adminUser.username, action: 'LOGOUT', req });
            res.json({ success: true });
        } catch (error) {
            console.error('Admin logout error:', error);
            res.status(500).json({ error: 'Logout failed' });
        }
    });

    // POST /api/admin/users/setup
    router.post('/users/setup', adminLoginLimiter, [
        body('username').trim().notEmpty().isLength({ min: 3, max: 50 }),
        body('password').notEmpty().isLength({ min: 12, max: 128 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/),
        body('setupSecret').notEmpty()
    ], async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { username, password, setupSecret } = req.body;
            const expectedSecret = process.env.ADMIN_SETUP_SECRET;
            if (!expectedSecret) return res.status(403).json({ error: 'Invalid setup secret' });

            const a = Buffer.from(setupSecret);
            const b = Buffer.from(expectedSecret);
            if (a.length !== b.length || !require('crypto').timingSafeEqual(a, b)) return res.status(403).json({ error: 'Invalid setup secret' });

            if (await adminAuth.hasAdminUsers()) return res.status(400).json({ error: 'Admin user already exists' });

            const user = await adminAuth.createAdminUser(username, password, 'super_admin');
            await adminAuth.logAuditAction({ username: username, action: 'ADMIN_SETUP', details: { created_user: username }, req });

            res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
        } catch (error) {
            console.error('Admin setup error:', error);
            res.status(500).json({ error: 'Setup failed' });
        }
    });

    // Settings API
    router.get('/settings', adminAuth.requireAdminAuth, async (req, res) => {
        try {
            if (!settingsManager.isInitialized() && supabaseAdmin) await settingsManager.initialize(supabaseAdmin);
            res.json(settingsManager.getAllGrouped(true));
        } catch (error) {
            res.status(500).json({ error: 'Failed to get settings' });
        }
    });

    router.put('/settings', adminAuth.requireAdminAuth, [body('key').trim().notEmpty(), body('value').exists()], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        try {
            const { key, value } = req.body;
            const updated = await settingsManager.set(key, String(value));
            await adminAuth.logAuditAction({ userId: req.adminUser.id, username: req.adminUser.username, action: 'UPDATE_SETTING', resource: key, details: { new_value: value.toString().substring(0, 50) }, req });
            res.json({ success: true, setting: updated });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update setting' });
        }
    });

    router.put('/settings/bulk', adminAuth.requireAdminAuth, async (req, res) => {
        try {
            const updates = req.body;
            const count = await settingsManager.setBulk(updates);
            await adminAuth.logAuditAction({ userId: req.adminUser.id, username: req.adminUser.username, action: 'BULK_UPDATE_SETTINGS', details: { count, keys: Object.keys(updates) }, req });
            res.json({ success: true, updated: count });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update settings' });
        }
    });

    router.post('/settings/refresh', adminAuth.requireAdminAuth, async (req, res) => {
        try {
            await settingsManager.refresh();
            await adminAuth.logAuditAction({ userId: req.adminUser.id, username: req.adminUser.username, action: 'REFRESH_SETTINGS', req });
            res.json({ success: true, message: 'Settings refreshed' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to refresh settings' });
        }
    });

    // Audit Log and Tests
    router.get('/audit-log', adminAuth.requireAdminAuth, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        try {
            const { limit = 50, offset = 0 } = req.query;
            const { data, error } = await supabaseAdmin.from('admin_audit_log').select('*').order('created_at', { ascending: false }).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
            if (error) throw error;
            res.json({ logs: data });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get audit log' });
        }
    });

    router.post('/test/elevenlabs', adminAuth.requireAdminAuth, [body('apiKey').notEmpty()], async (req, res) => {
        try {
            const { apiKey } = req.body;
            const response = await fetch('https://api.elevenlabs.io/v1/user', { headers: { 'xi-api-key': apiKey } });
            if (response.ok) {
                const data = await response.json();
                res.json({ success: true, message: `Connected as ${data.subscription?.tier || 'user'}`, charactersRemaining: data.subscription?.character_count });
            } else res.json({ success: false, error: 'Invalid API key' });
        } catch (error) {
            res.json({ success: false, error: 'Service test failed' });
        }
    });

    router.post('/test/gemini', adminAuth.requireAdminAuth, [body('apiKey').notEmpty()], async (req, res) => {
        try {
            const { apiKey } = req.body;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (response.ok) {
                const data = await response.json();
                res.json({ success: true, message: `API key valid. ${data.models?.length || 0} models available.` });
            } else res.json({ success: false, error: 'Invalid API key' });
        } catch (error) {
            res.json({ success: false, error: 'Service test failed' });
        }
    });

    // User Suggestions API
    router.get('/suggestions', adminAuth.requireAdminAuth, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        try {
            const { status = 'pending', limit = 50 } = req.query;
            const { data, error } = await supabaseAdmin
                .from('user_suggestions')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));
            
            if (error) throw error;
            res.json({ suggestions: data });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get suggestions' });
        }
    });

    router.put('/suggestions/:id', adminAuth.requireAdminAuth, [
        body('status').isIn(['approved', 'rejected'])
    ], async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { id } = req.params;
            const { status } = req.body;

            // If approved, we can optionally add it to the dictionary automatically
            if (status === 'approved') {
                const { data: suggestion, error: fetchErr } = await supabaseAdmin
                    .from('user_suggestions')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (fetchErr) throw fetchErr;

                // Add to dictionary_entries
                const { error: dictErr } = await supabaseAdmin
                    .from('dictionary_entries')
                    .insert([{
                        pidgin: suggestion.pidgin,
                        english: [suggestion.english], // Store as array
                        examples: suggestion.example ? [suggestion.example] : [],
                        category: 'community',
                        difficulty: 'beginner',
                        frequency: 'medium'
                    }]);
                
                if (dictErr) console.warn('Failed to auto-add to dictionary:', dictErr.message);
            }

            const { data, error } = await supabaseAdmin
                .from('user_suggestions')
                .update({ status })
                .eq('id', id)
                .select();

            if (error) throw error;

            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'UPDATE_SUGGESTION', 
                resource: id, 
                details: { status }, 
                req 
            });

            res.json({ success: true, suggestion: data[0] });
        } catch (error) {
            console.error('Update suggestion error:', error);
            res.status(500).json({ error: 'Failed to update suggestion' });
        }
    });

    return router;
};
