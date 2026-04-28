const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Define rate limiters explicitly for CodeQL detection
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const adminActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    message: 'Too many admin actions, please slow down, brah.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Shared pronunciation map for admin audio generation
const globalPronunciationMap = {
    'kine': 'kyne', 'da kine': 'dah kyne', 'da': 'dah', 'any kine': 'any kyne',
    'small kine': 'small kyne', 'funny kine': 'funny kyne', 'fast kine': 'fast kyne',
    'faskine': 'fas-kyne', 'pau': 'pow', 'pau hana': 'pow hah-nah', 'mauka': 'mow-kah',
    'makai': 'mah-kye', 'ono': 'oh-no', 'oe': 'oh-eh', 'ʻoe': 'oh-eh', 'auwe': 'ow-way',
    'wahine': 'vah-hee-nay', 'kane': 'kah-nay', 'keiki': 'kay-kee', 'tutu': 'too-too',
    'lanai': 'lah-nye', 'mahalo': 'mah-hah-low', 'aloha': 'ah-low-hah', 'ohana': 'oh-hah-nah',
    'kokua': 'koh-koo-ah', 'malama': 'mah-lah-mah', 'kapu': 'kah-poo', 'wiki': 'vee-kee',
    'wikiwiki': 'vee-kee-vee-kee', 'pupus': 'poo-poos', 'pupu': 'poo-poo', 'gou': 'gow',
    'hale': 'hah-leh', 'hele': 'heh-leh', 'kupuna': 'koo-poo-nah', 'lolo': 'low-low',
    'pilau': 'pee-lau', 'puka': 'poo-kah', 'humbug': 'hum-bug', 'ho': 'hoh',
    'howzit': 'how-zit', 'hana hou': 'hah-nah hoh-oo', 'hanahou': 'hah-nah-hoh-oo',
    'wassamattayou': 'wah-sah-mah-tah-yoo', 'whaddsdascoops': 'whah-dah-dah-skoops',
    'shaka': 'shah-kah', 'slippahs': 'slippahz', 'still': 'steel', 'brah': 'brah',
    'bruddah': 'bruh-dah', 'sistah': 'sis-tah', 'cuz': 'kuz', 'sole': 'so-leh',
    'pake': 'pah-keh', 'haole': 'how-leh', 'poke': 'poh-kay', 'musubi': 'moo-soo-bee',
    'shoyu': 'show-yoo', 'mochi': 'mo-chee', 'manapua': 'mah-nah-poo-ah',
    'malasada': 'mah-lah-sah-dah', 'kanak': 'kah-nahk', 'grindz': 'gryndz',
    'grind': 'grynd', 'kaukau': 'cow-cow', 'cheehoo': 'chee-hoo!', 'rajah': 'rah-jah',
    'shoots': 'shoots', 'choke': 'choke', 'bamboocha': 'bam-boo-chah',
    'akamai': 'ah-kah-my', 'buggah': 'buh-gah', 'niele': 'nee-eh-leh',
    'pilikia': 'pee-lee-kee-ah', 'chee hu': 'chee-hoo!', 'pilau': 'pee-lau',
    'bust \'em up': 'bust em up', 'bust em up': 'bust em up', 'ainokea': 'eye-no-kay-ah',
    'mo bettah': 'mo beh-tah', 'kay den': 'kay den...', 'aurite': 'ah-rye-t',
    'stink eye': 'stink eye', 'chicken skin': 'chicken skin', 'talk story': 'talk story',
    'broke da mouth': 'broke dah mouth', 'kanak attack': 'kah-nahk ah-tack',
    'mālama da ʻāina': 'mah-lah-mah dah eye-nah', 'nō ka ʻoi': 'noh kah oy',
    'a hui hou': 'ah-hoo-ee-oh', 'aʻole pilikia': 'ah-oh-leh pee-lee-kee-ah',
    'moopuna': 'mo-poo-nah', 'li hing mui': 'lee hing moo-ee', 'lilikoi': 'lee-lee-koy',
    'shave ice': 'shave ice', 'plate lunch': 'plate lunch', 'ballah': 'bal-lah',
    'rubbah': 'rub-bah', 'punani': 'poo-nah-nee', 'boto': 'boh-toh', 'faka': 'fah-kah',
    'hamajang': 'hah-mah-jahng', 'mayjah': 'may-jah', 'poho': 'poh-hoh',
    'rajah dat': 'rah-jah dat', 'yobo': 'yo-boh', 'wit\'': 'wit', 'wit': 'wit',
    'yesterday': 'yes-tah-deh'
};

function applyPronunciationCorrections(text) {
    if (!text) return '';
    let correctedText = text.toLowerCase();
    const thWords = {
        'the': 'dah', 'that': 'daht', 'this': 'dis', 'them': 'dehm',
        'there': 'dea', 'then': 'dehn', 'their': 'dea', 'they': 'dey',
        'with': 'wit', 'mother': 'mah-dah', 'father': 'fah-dah', 'brother': 'bruh-dah'
    };
    Object.entries(thWords).forEach(([word, replacement]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        correctedText = correctedText.replace(regex, replacement);
    });
    correctedText = correctedText.replace(/(\w+)er\b/g, '$1ah');
    correctedText = correctedText.replace(/(\w+)ar\b/g, '$1ah');
    correctedText = correctedText.replace(/(\w+)or\b/g, '$1oh');
    
    const sortedKeys = Object.keys(globalPronunciationMap).sort((a, b) => b.length - a.length);
    sortedKeys.forEach(original => {
        const phonetic = globalPronunciationMap[original];
        const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        correctedText = correctedText.replace(regex, phonetic);
    });
    return correctedText;
}

/**
 * Shared ElevenLabs + Supabase Storage generation logic
 */
async function generateAndUploadAudio(supabaseAdmin, text, filenamePrefix) {
    const crypto = require('crypto');
    const BUCKET_NAME = 'audio-assets';
    const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic local voice
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) throw new Error('ElevenLabs API key not configured');

    const hash = crypto.createHash('md5').update(text.trim().toLowerCase()).digest('hex');
    const filename = `${filenamePrefix}_${hash}.mp3`;
    const correctedText = applyPronunciationCorrections(text);
    
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    const elRes = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
        },
        body: JSON.stringify({
            text: correctedText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
            }
        })
    });

    if (!elRes.ok) {
        const errData = await elRes.json().catch(() => ({}));
        throw new Error(`ElevenLabs error: ${errData.detail?.message || elRes.statusText}`);
    }

    const audioBuffer = await elRes.arrayBuffer();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin
        .storage
        .from(BUCKET_NAME)
        .upload(filename, Buffer.from(audioBuffer), {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (uploadError) throw uploadError;

    // Update index.json in bucket
    try {
        const { data: indexBlob } = await supabaseAdmin.storage.from(BUCKET_NAME).download('index.json');
        let index = {};
        if (indexBlob) {
            index = JSON.parse(await indexBlob.text());
        }
        
        // Add entry to index
        // If it starts with dict_, strip it for the key (dictionary terms use plain text as key)
        const indexKey = filenamePrefix === 'dict' ? text.trim().toLowerCase() : `${filenamePrefix}:${text.trim().toLowerCase()}`;
        index[indexKey] = filename;

        await supabaseAdmin.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(JSON.stringify(index, null, 2)), {
            contentType: 'application/json',
            upsert: true
        });
    } catch (e) {
        console.warn('Failed to update index.json in admin route:', e.message);
    }

    return filename;
}

// Configure multer for audio uploads using memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Increased to 5MB for high-quality audio
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) cb(null, true);
        else cb(new Error('Only audio files are allowed'));
    }
});

/**
 * Admin Routes (Login, Settings, Audit Logs, Tests)
 */
module.exports = function(supabaseAdmin, adminAuth, settingsManager) {

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
    router.post('/logout', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
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
    router.get('/settings', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
        try {
            if (!settingsManager.isInitialized() && supabaseAdmin) {
                await settingsManager.initialize(supabaseAdmin);
            }
            res.json(settingsManager.getAllGrouped(true));
        } catch (error) {
            res.status(500).json({ error: 'Failed to get settings' });
        }
    });

    router.put('/settings', adminActionLimiter, adminAuth.requireAdminAuth, [
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

    router.put('/settings/bulk', adminActionLimiter, adminAuth.requireAdminAuth, [
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

    router.post('/settings/refresh', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
        try {
            await settingsManager.refresh();
            await adminAuth.logAuditAction({ userId: req.adminUser.id, username: req.adminUser.username, action: 'REFRESH_SETTINGS', req });
            res.json({ success: true, message: 'Settings refreshed' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to refresh settings' });
        }
    });

    // Audit Log and Tests
    router.get('/audit-log', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
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

    router.post('/test/elevenlabs', adminActionLimiter, adminAuth.requireAdminAuth, [body('apiKey').notEmpty()], async (req, res) => {
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

    router.post('/test/gemini', adminActionLimiter, adminAuth.requireAdminAuth, [body('apiKey').notEmpty()], async (req, res) => {
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
    router.get('/suggestions', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
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

    router.put('/suggestions/:id', adminActionLimiter, adminAuth.requireAdminAuth, [
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
    router.get('/seo/gaps', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
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
    router.post('/seo/suggest', adminActionLimiter, adminAuth.requireAdminAuth, [
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
                   system_instruction: {
                       parts: [{ text: systemPrompt }]
                   },
                   contents: [{
                       role: 'user',
                       parts: [{ text: `PIDGIN TERM: "${pidgin}"` }]
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
    router.post('/dictionary/add', adminActionLimiter, adminAuth.requireAdminAuth, [
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

    // POST /api/admin/dictionary/:id/audio/generate - Auto-generate audio via ElevenLabs
    router.post('/dictionary/:id/audio/generate', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const { id } = req.params;
        
        try {
            // 1. Get the word from DB
            const { data: entry, error: fetchErr } = await supabaseAdmin
                .from('dictionary_entries')
                .select('pidgin, pronunciation')
                .eq('id', id)
                .single();
            
            if (fetchErr || !entry) throw new Error('Entry not found');

            // 2. Generate and Upload
            const filename = await generateAndUploadAudio(supabaseAdmin, entry.pidgin, 'dict');

            // 3. Update database
            const { error: dbError } = await supabaseAdmin
                .from('dictionary_entries')
                .update({ 
                    audio: filename, 
                    audio_url: filename 
                })
                .eq('id', id);

            if (dbError) throw dbError;

            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'AUTO_GENERATE_AUDIO_V2', 
                resource: entry.pidgin, 
                details: { filename },
                req 
            });

            res.json({ success: true, filename });
        } catch (error) {
            console.error('Auto-generate audio error:', error);
            res.status(500).json({ error: 'Failed to auto-generate audio: ' + error.message });
        }
    });

    // POST /api/admin/dictionary/:id/audio - Upload Audio for Dictionary Entry
    router.post('/dictionary/:id/audio', adminActionLimiter, adminAuth.requireAdminAuth, upload.single('audio'), async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const { id } = req.params;
        const { pidgin } = req.body;
        const BUCKET_NAME = 'audio-assets';
        
        if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
        if (!pidgin) return res.status(400).json({ error: 'Pidgin word required' });

        try {
            const crypto = require('crypto');
            const hash = crypto.createHash('md5').update(pidgin.trim().toLowerCase()).digest('hex');
            const finalFilename = `dict_${hash}.mp3`;

            // 1. Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from(BUCKET_NAME)
                .upload(finalFilename, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 2. Update index.json in bucket
            try {
                const { data: indexBlob } = await supabaseAdmin.storage.from(BUCKET_NAME).download('index.json');
                let index = {};
                if (indexBlob) index = JSON.parse(await indexBlob.text());
                index[pidgin.trim().toLowerCase()] = finalFilename;
                await supabaseAdmin.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(JSON.stringify(index, null, 2)), {
                    contentType: 'application/json',
                    upsert: true
                });
            } catch (e) { console.warn('Index sync failed:', e.message); }

            // 3. Update database
            const { error: dbError } = await supabaseAdmin
                .from('dictionary_entries')
                .update({ 
                    audio: finalFilename, 
                    audio_url: finalFilename 
                })
                .eq('id', id);

            if (dbError) throw dbError;

            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'UPLOAD_AUDIO_V2', 
                resource: pidgin, 
                details: { filename: finalFilename },
                req 
            });

            res.json({ success: true, filename: finalFilename });
        } catch (error) {
            console.error('Audio upload error:', error);
            res.status(500).json({ error: 'Failed to upload audio: ' + error.message });
        }
    });

    // POST /api/admin/dictionary/audio/generate-missing - Batch generate missing audio
    router.post('/dictionary/audio/generate-missing', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        
        try {
            // Get current index from storage
            const BUCKET_NAME = 'audio-assets';
            const { data: indexBlob } = await supabaseAdmin.storage.from(BUCKET_NAME).download('index.json');
            let index = {};
            if (indexBlob) {
                const text = await indexBlob.text();
                index = JSON.parse(text);
            }

            // Find entries without audio in index
            const { data: entries, error: fetchErr } = await supabaseAdmin
                .from('dictionary_entries')
                .select('id, pidgin');
            
            if (fetchErr) throw fetchErr;

            const missing = entries.filter(e => !index[e.pidgin.trim().toLowerCase()]);
            
            res.json({ success: true, entries: missing.slice(0, 10) });
        } catch (error) {
            console.error('Batch missing audio error:', error);
            res.status(500).json({ error: 'Batch search failed: ' + error.message });
        }
    });

    // Get Dashboard Stats
    router.get('/stats', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
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

    // GET /api/admin/gaps - Get pending search gaps from DB, with optional Google Sync
    router.get('/gaps', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        
        try {
            const { sync = 'false' } = req.query;

            // If sync is requested, fetch from GSC and update DB first
            if (sync === 'true') {
                const { GoogleAuth } = require('google-auth-library');
                const KEY_PATH = process.env.GOOGLE_SEARCH_CONSOLE_KEY_PATH || './google-search-console-key.json';
                const SITE_URL = process.env.SITE_URL || 'sc-domain:chokepidgin.com';

                if (fs.existsSync(KEY_PATH)) {
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

                    // Get existing dictionary terms to filter out
                    const { data: existingDict } = await supabaseAdmin.from('dictionary_entries').select('pidgin');
                    const existingSet = new Set(existingDict.map(item => item.pidgin.toLowerCase()));
                    
                    // Patterns to clean/filter
                    const meanRegex = /what does (.*) mean/i;
                    const meaningRegex = /(.*) meaning/i;

                    const gapsToUpsert = [];
                    scQueries.forEach(row => {
                        const query = row.keys[0].toLowerCase();
                        let term = query;
                        if (meanRegex.test(query)) term = query.match(meanRegex)[1];
                        else if (meaningRegex.test(query)) term = query.match(meaningRegex)[1];
                        term = term.trim().replace(/[?!]/g, '');

                        if (term.length > 2 && !existingSet.has(term) && row.impressions > 5) {
                            gapsToUpsert.push({
                                term,
                                count: row.impressions,
                                status: 'pending',
                                last_searched_at: new Date()
                            });
                        }
                    });

                    // Upsert in batches to DB
                    if (gapsToUpsert.length > 0) {
                        // Use a simple loop or bulk upsert if supported by your schema/policies
                        // Here we'll do a few at a time for safety
                        for (let i = 0; i < Math.min(gapsToUpsert.length, 100); i++) {
                            const gap = gapsToUpsert[i];
                            await supabaseAdmin.from('search_gaps').upsert([gap], { onConflict: 'term' });
                        }
                    }
                }
            }

            // Fetch pending gaps from DB
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
    router.put('/gaps/:id', adminActionLimiter, adminAuth.requireAdminAuth, [
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
    router.post('/questions/:id/answer', adminActionLimiter, adminAuth.requireAdminAuth, [
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
    router.put('/questions/:id/status', adminActionLimiter, adminAuth.requireAdminAuth, [
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

    // DELETE /api/admin/dictionary/:id - Delete dictionary entry
    router.delete('/dictionary/:id', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const { id } = req.params;

        try {
            // Get entry name for audit log
            const { data: entry } = await supabaseAdmin
                .from('dictionary_entries')
                .select('pidgin')
                .eq('id', id)
                .single();

            const { error } = await supabaseAdmin
                .from('dictionary_entries')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await adminAuth.logAuditAction({ 
                userId: req.adminUser.id, 
                username: req.adminUser.username, 
                action: 'DELETE_DICTIONARY_ENTRY', 
                resource: entry?.pidgin || id, 
                req 
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Delete entry error:', error);
            res.status(500).json({ error: 'Failed to delete entry' });
        }
    });

    // ============================================
    // Universal Content Voicing (One-Click)
    // ============================================

    // GET /api/admin/audio/missing - Find missing audio across all tables
    router.get('/audio/missing', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        
        try {
            const BUCKET_NAME = 'audio-assets';
            const { data: indexBlob } = await supabaseAdmin.storage.from(BUCKET_NAME).download('index.json');
            let index = {};
            if (indexBlob) index = JSON.parse(await indexBlob.text());

            const [dictRes, phrasesRes, storiesRes, lessonsRes] = await Promise.all([
                supabaseAdmin.from('dictionary_entries').select('id, pidgin'),
                supabaseAdmin.from('phrases').select('id, pidgin'),
                supabaseAdmin.from('stories').select('id, title, pidgin_text'),
                supabaseAdmin.from('lessons').select('id, title, cultural_note, practice')
            ]);

            const missing = {
                dictionary: (dictRes.data || []).filter(e => !index[e.pidgin.trim().toLowerCase()]).map(e => ({ id: e.id, text: e.pidgin, type: 'dict' })),
                phrases: (phrasesRes.data || []).filter(e => !index[`phrase:${e.pidgin.trim().toLowerCase()}`]).map(e => ({ id: e.id, text: e.pidgin, type: 'phrase' })),
                stories: (storiesRes.data || []).filter(e => !index[`story:${e.id}`]).map(e => ({ id: e.id, text: e.title, type: 'story' })),
                lessons: []
            };

            // Lesson notes/practice
            (lessonsRes.data || []).forEach(l => {
                if (l.cultural_note && !index[`lesson:note:${l.id}`]) {
                    missing.lessons.push({ id: l.id, text: `${l.title} (Note)`, type: 'lesson_note' });
                }
                if (l.practice && !index[`lesson:practice:${l.id}`]) {
                    missing.lessons.push({ id: l.id, text: `${l.title} (Practice)`, type: 'lesson_practice' });
                }
            });

            res.json({ success: true, missing });
        } catch (error) {
            console.error('Find missing audio error:', error);
            res.status(500).json({ error: 'Failed to find missing audio' });
        }
    });

    // POST /api/admin/audio/generate - Universal generation endpoint
    router.post('/audio/generate', adminActionLimiter, adminAuth.requireAdminAuth, async (req, res) => {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Admin features not available' });
        const { id, type } = req.body;

        try {
            let textToVoice = '';
            let prefix = '';
            let table = '';
            let updateField = 'audio_url';

            if (type === 'dict') {
                const { data } = await supabaseAdmin.from('dictionary_entries').select('pidgin').eq('id', id).single();
                textToVoice = data.pidgin;
                prefix = 'dict';
                table = 'dictionary_entries';
            } else if (type === 'phrase') {
                const { data } = await supabaseAdmin.from('phrases').select('pidgin').eq('id', id).single();
                textToVoice = data.pidgin;
                prefix = 'phrase';
                table = 'phrases';
            } else if (type === 'story') {
                const { data } = await supabaseAdmin.from('stories').select('pidgin_text').eq('id', id).single();
                textToVoice = data.pidgin_text;
                prefix = 'story';
                table = 'stories';
                updateField = 'audio_example';
            } else if (type === 'lesson_note') {
                const { data } = await supabaseAdmin.from('lessons').select('cultural_note').eq('id', id).single();
                textToVoice = data.cultural_note;
                prefix = `lesson:note:${id}`; // Special handling in helper
                table = 'lessons';
                // No audio field in lessons table yet, just update storage/index
            } else if (type === 'lesson_practice') {
                const { data } = await supabaseAdmin.from('lessons').select('practice').eq('id', id).single();
                textToVoice = data.practice;
                prefix = `lesson:practice:${id}`;
                table = 'lessons';
            }

            if (!textToVoice) throw new Error('Content not found');

            const filename = await generateAndUploadAudio(supabaseAdmin, textToVoice, prefix);

            // Update DB if table/field exists
            if (table && updateField && type !== 'lesson_note' && type !== 'lesson_practice') {
                await supabaseAdmin.from(table).update({ [updateField]: filename }).eq('id', id);
            }

            res.json({ success: true, filename });
        } catch (error) {
            console.error('Universal generation error:', error);
            res.status(500).json({ error: 'Generation failed: ' + error.message });
        }
    });

    return router;
};
