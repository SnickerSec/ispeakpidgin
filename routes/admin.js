const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for audio uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/assets/audio';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'temp-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) cb(null, true);
        else cb(new Error('Only audio files are allowed'));
    }
});

/**
 * Admin Routes (Login, Settings, Audit Logs, Tests)
 */
module.exports = function(supabaseAdmin, adminAuth, settingsManager, adminLoginLimiter, adminActionLimiter) {

    // Helper to ensure adminActionLimiter is available (fallback if not passed)
    const actionLimiter = adminActionLimiter || ((req, res, next) => next());

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
    router.post('/logout', adminAuth.requireAdminAuth, actionLimiter, async (req, res) => {
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
            
            if (!expectedSecret) {
                console.error('ADMIN_SETUP_SECRET not configured in environment');
                return res.status(403).json({ error: 'Admin setup is not enabled' });
            }

            // Timing-safe comparison for setup secret
            const crypto = require('crypto');
            try {
                const setupSecretBuffer = Buffer.from(setupSecret);
                const expectedSecretBuffer = Buffer.from(expectedSecret);
                
                if (setupSecretBuffer.length !== expectedSecretBuffer.length || 
                    !crypto.timingSafeEqual(setupSecretBuffer, expectedSecretBuffer)) {
                    return res.status(403).json({ error: 'Invalid setup secret' });
                }
            } catch (err) {
                return res.status(403).json({ error: 'Invalid setup secret' });
            }

            if (await adminAuth.hasAdminUsers()) {
                return res.status(400).json({ error: 'Admin user already exists. Use login instead.' });
            }

            const user = await adminAuth.createAdminUser(username, password, 'super_admin');
            await adminAuth.logAuditAction({ 
                username: username, 
                action: 'ADMIN_SETUP', 
                details: { created_user: username }, 
                req 
            });

            res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
        } catch (error) {
            console.error('Admin setup error:', error);
            res.status(500).json({ error: 'Setup failed' });
        }
    });

    // Settings API
    router.get('/settings', adminAuth.requireAdminAuth, async (req, res) => {
        try {
            if (!settingsManager.isInitialized() && supabaseAdmin) {
                await settingsManager.initialize(supabaseAdmin);
            }
            res.json(settingsManager.getAllGrouped(true));
        } catch (error) {
            res.status(500).json({ error: 'Failed to get settings' });
        }
    });

    router.put('/settings', adminAuth.requireAdminAuth, [
        body('key').trim().notEmpty().isLength({ max: 100 }),
        body('value').exists()
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        
        try {
            const { key, value } = req.body;
            const updated = await settingsManager.set(key, String(value));
            
            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'UPDATE_SETTING', 
                resource: key, 
                details: { new_value: String(value).substring(0, 100) }, 
                req 
            });
            
            res.json({ success: true, setting: updated });
        } catch (error) {
            console.error('Update setting error:', error);
            res.status(500).json({ error: 'Failed to update setting' });
        }
    });

    router.put('/settings/bulk', adminAuth.requireAdminAuth, [
        body().isObject().withMessage('Body must be an object of key-value pairs')
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const updates = req.body;
            // Additional basic validation of keys and values
            for (const key in updates) {
                if (typeof key !== 'string' || key.length > 100) {
                    return res.status(400).json({ error: `Invalid key: ${key}` });
                }
            }

            const count = await settingsManager.setBulk(updates);
            
            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'BULK_UPDATE_SETTINGS', 
                details: { count, keys: Object.keys(updates) }, 
                req 
            });
            
            res.json({ success: true, updated: count });
        } catch (error) {
            console.error('Bulk update settings error:', error);
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

    // SEO Content Gaps API
    router.get('/seo/gaps', adminAuth.requireAdminAuth, actionLimiter, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        
        try {
            // Logic adapted from feedback-loop.js
            const { GoogleAuth } = require('google-auth-library');
            const fs = require('fs');
            const KEY_PATH = process.env.GOOGLE_SEARCH_CONSOLE_KEY_PATH || './google-search-console-key.json';
            const SITE_URL = process.env.SITE_URL || 'sc-domain:chokepidgin.com';

            if (!fs.existsSync(KEY_PATH)) {
                return res.status(500).json({ error: 'Search Console key file missing' });
            }

            const auth = new GoogleAuth({
                keyFile: KEY_PATH,
                scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
            });

            const client = await auth.getClient();
            const encodedSiteUrl = encodeURIComponent(SITE_URL);
            const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

            const endDate = new Date();
            endDate.setDate(endDate.getDate() - 3);
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 28);

            const requestBody = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                dimensions: ['query'],
                rowLimit: 1000,
                orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }]
            };

            const scRes = await client.request({ url, method: 'POST', data: requestBody });
            const scQueries = scRes.data.rows || [];

            // Get existing terms
            const { data: existing, error: dictErr } = await supabaseAdmin
                .from('dictionary_entries')
                .select('pidgin');
            
            if (dictErr) throw dictErr;
            const existingSet = new Set(existing.map(item => item.pidgin.toLowerCase()));

            const gaps = [];
            scQueries.forEach(row => {
                const query = row.keys[0].toLowerCase();
                let term = query;
                const meanRegex = /what does (.*) mean/i;
                const meaningRegex = /(.*) meaning/i;

                if (meanRegex.test(query)) term = query.match(meanRegex)[1];
                else if (meaningRegex.test(query)) term = query.match(meaningRegex)[1];

                term = term.trim().replace(/[?!]/g, '');

                if (term.length > 2 && !existingSet.has(term) && row.impressions > 10) {
                    gaps.push({
                        pidgin: term,
                        impressions: row.impressions,
                        clicks: row.clicks,
                        ctr: (row.ctr * 100).toFixed(1) + '%',
                        position: row.position.toFixed(1)
                    });
                }
            });

            res.json({ gaps: gaps.slice(0, 50) });
        } catch (error) {
            console.error('SEO gaps error:', error);
            res.status(500).json({ error: 'Failed to fetch SEO gaps' });
        }
    });

    // AI Suggestion for Dictionary Entry
    router.post('/seo/suggest', adminAuth.requireAdminAuth, actionLimiter, [
        body('pidgin').trim().notEmpty()
    ], async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { pidgin } = req.body;
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

            const systemPrompt = `You are an expert Hawaiian Pidgin dictionary editor.
Provide a clear, accurate English translation and a natural example sentence for the following Pidgin term.

RESPONSE FORMAT:
Respond only with a JSON object:
{
  "english": "The primary English translation",
  "category": "One of: general, slang, food, greetings, locations, culture",
  "example": "A natural example sentence in Pidgin",
  "pronunciation": "Phonetic pronunciation guide"
}`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}\n\nTERM: "${pidgin}"` }]
                    }],
                    generationConfig: { 
                        temperature: 0.3,
                        maxOutputTokens: 300,
                        responseMimeType: "application/json"
                    }
                })
            });

            if (!response.ok) throw new Error('AI Service error');

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            
            res.json(JSON.parse(responseText));
        } catch (error) {
            console.error('AI suggestion error:', error);
            res.status(500).json({ error: 'Failed to generate suggestion' });
        }
    });

    // Quick Add Dictionary Entry
    router.post('/dictionary/add', adminAuth.requireAdminAuth, [
        body('pidgin').trim().notEmpty(),
        body('english').trim().notEmpty(),
        body('category').trim().notEmpty()
    ], async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { pidgin, english, category, examples = [], pronunciation = '' } = req.body;
            const crypto = require('crypto');

            const { data, error } = await supabaseAdmin
                .from('dictionary_entries')
                .insert([{
                    id: crypto.randomUUID(),
                    pidgin,
                    english: [english],
                    category,
                    examples: examples.length > 0 ? examples : [`${pidgin} stay ${english}`],
                    pronunciation,
                    difficulty: 'beginner',
                    frequency: 'medium'
                }])
                .select();

            if (error) throw error;

            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'ADD_DICTIONARY_ENTRY', 
                resource: pidgin, 
                req 
            });

            res.json({ success: true, entry: data[0] });
        } catch (error) {
            console.error('Add entry error:', error);
            res.status(500).json({ error: 'Failed to add entry' });
        }
    });

    // Upload Audio for Dictionary Entry
    router.post('/dictionary/:id/audio', adminAuth.requireAdminAuth, actionLimiter, upload.single('audio'), async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const { id } = req.params;
        const { pidgin } = req.body;
        
        if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
        if (!pidgin) return res.status(400).json({ error: 'Pidgin word required' });

        try {
            // 1. Create slug for filename
            const slug = pidgin.toLowerCase()
                .replace(/['ʻ`‘’]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            
            const finalFilename = `${path.basename(slug)}.mp3`;
            const finalPath = path.resolve('public/assets/audio', finalFilename);
            
            // Ensure the path is still within our intended directory (prevent traversal)
            if (!finalPath.startsWith(path.resolve('public/assets/audio'))) {
                throw new Error('Invalid file path');
            }

            // 2. Rename temp file to final slugified name
            if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
            fs.renameSync(req.file.path, finalPath);

            // 3. Update database
            const audioUrl = `assets/audio/${finalFilename}`;
            const { error } = await supabaseAdmin
                .from('dictionary_entries')
                .update({ audio: audioUrl, audio_url: audioUrl })
                .eq('id', id);

            if (error) throw error;

            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'UPLOAD_AUDIO', 
                resource: pidgin, 
                req 
            });

            res.json({ success: true, audioUrl });
        } catch (error) {
            console.error('Audio upload error:', error);
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(500).json({ error: 'Failed to upload audio' });
        }
    });

    // Get Dashboard Stats
    router.get('/stats', adminAuth.requireAdminAuth, actionLimiter, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        try {
            // Fetch counts in parallel
            const [suggestions, questions, gaps] = await Promise.all([
                supabaseAdmin.from('user_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabaseAdmin.from('local_questions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabaseAdmin.from('search_gaps').select('id', { count: 'exact', head: true }).eq('status', 'pending')
            ]);

            res.json({
                pendingSuggestions: suggestions.count || 0,
                pendingQuestions: questions.count || 0,
                pendingGaps: gaps.count || 0
            });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    });

    // Get Search Gaps
    router.get('/gaps', adminAuth.requireAdminAuth, actionLimiter, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        try {
            const { data, error } = await supabaseAdmin
                .from('search_gaps')
                .select('*')
                .eq('status', 'pending')
                .order('count', { ascending: false })
                .limit(100);

            if (error) throw error;
            res.json({ gaps: data });
        } catch (error) {
            console.error('Fetch gaps error:', error);
            res.status(500).json({ error: 'Failed to fetch gaps' });
        }
    });

    // Update Search Gap Status
    router.put('/gaps/:id', adminAuth.requireAdminAuth, actionLimiter, [
        body('status').isIn(['pending', 'added', 'ignored'])
    ], async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const { id } = req.params;
        const { status } = req.body;

        try {
            const { error } = await supabaseAdmin
                .from('search_gaps')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'UPDATE_GAP_STATUS', 
                resource: id, 
                details: { status },
                req 
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Update gap status error:', error);
            res.status(500).json({ error: 'Failed to update status' });
        }
    });

    // Answer a Local Question
    router.post('/questions/:id/answer', adminAuth.requireAdminAuth, actionLimiter, [
        body('response_text').trim().notEmpty()
    ], async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const { id } = req.params;
        const { response_text } = req.body;

        try {
            // 1. Upsert the response
            const { error: respErr } = await supabaseAdmin
                .from('local_responses')
                .upsert([
                    { 
                        question_id: id, 
                        response_text,
                        responder_name: 'Local Expert'
                    }
                ], { onConflict: 'question_id' }); // Assuming one response for now

            if (respErr) throw respErr;

            // 2. Update question status to answered
            const { error: questErr } = await supabaseAdmin
                .from('local_questions')
                .update({ status: 'answered', updated_at: new Date() })
                .eq('id', id);

            if (questErr) throw questErr;

            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'ANSWER_QUESTION', 
                resource: id, 
                req 
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Answer question error:', error);
            res.status(500).json({ error: 'Failed to save answer' });
        }
    });

    // Update Question Status
    router.put('/questions/:id/status', adminAuth.requireAdminAuth, actionLimiter, [
        body('status').isIn(['pending', 'answered', 'rejected'])
    ], async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const { id } = req.params;
        const { status } = req.body;

        try {
            const { error } = await supabaseAdmin
                .from('local_questions')
                .update({ status, updated_at: new Date() })
                .eq('id', id);

            if (error) throw error;

            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'UPDATE_QUESTION_STATUS', 
                resource: id, 
                details: { status },
                req 
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Update question status error:', error);
            res.status(500).json({ error: 'Failed to update status' });
        }
    });

    return router;
};
