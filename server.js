const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const fs = require('fs');
const { Translate } = require('@google-cloud/translate').v2;
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Admin panel imports
const settingsManager = require('./services/settings-manager');
const adminAuth = require('./middleware/admin-auth');

// Route imports
const dictionaryRoutes = require('./routes/dictionary');
const translateRoutes = require('./routes/translate');
const contentRoutes = require('./routes/content');
const gamesRoutes = require('./routes/games');
const pickupRoutes = require('./routes/pickup');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const suggestionsRoutes = require('./routes/suggestions');
const questionsRoutes = require('./routes/questions');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client initialized');

// Initialize Supabase admin client (service role) for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = null;
if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    adminAuth.initializeAuth(supabaseAdmin);
    console.log('✅ Supabase admin client initialized');
} else {
    console.warn('⚠️ SUPABASE_SERVICE_KEY not set - admin features disabled');
}

// Handle Google Cloud credentials
let credentialsPath = './google-credentials.json';

if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    try {
        const credentialsJson = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8');
        credentialsPath = '/tmp/google-credentials.json';
        fs.writeFileSync(credentialsPath, credentialsJson);
        console.log('✅ Google Cloud credentials loaded from environment variable');
    } catch (error) {
        console.error('❌ Error loading credentials from environment:', error);
    }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

// Initialize Google Translate client
const translate = new Translate({
    keyFilename: credentialsPath
});

// Shared dictionary cache (used by dictionary and translate routes)
const dictionaryCache = {
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000 // 5 minutes
};

const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy for accurate rate limiting on Railway/proxies
app.set('trust proxy', 1);

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const translationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many translation requests, please try again later.',
});

const aiChatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 messages per 15 mins is reasonable for real users but blocks bots
    message: 'You stay talking too fast, brah! Try again in one bit.',
    standardHeaders: true,
    legacyHeaders: false,
});

const pageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const dictionaryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many dictionary requests, please try again later.',
});

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

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const isDev = process.env.NODE_ENV === 'development';
        const allowedOrigins = isDev
            ? ['http://localhost:3000', 'http://localhost:8080']
            : ['https://chokepidgin.com', 'https://www.chokepidgin.com'];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://www.googletagmanager.com",
                "https://www.google-analytics.com",
                "https://cdn.jsdelivr.net"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https://*.google-analytics.com",
                "https://www.google-analytics.com",
                "https://*.googletagmanager.com",
                "https://www.googletagmanager.com",
                "https://cdn-icons-png.flaticon.com",
                "https://*.g.doubleclick.net"
            ],
            fontSrc: [
                "'self'", 
                "https://fonts.gstatic.com", 
                "https://cdn.jsdelivr.net"
            ],
            connectSrc: [
                "'self'",
                "https://*.google-analytics.com",
                "https://www.google-analytics.com",
                "https://*.analytics.google.com",
                "https://analytics.google.com",
                "https://*.g.doubleclick.net",
                "https://stats.g.doubleclick.net",
                "https://jfzgzjgdptowfbtljvyp.supabase.co",
                "https://*.googletagmanager.com",
                "https://www.googletagmanager.com",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com",
                "https://api.elevenlabs.io",
                "https://cdn.jsdelivr.net",
                "https://cdn-icons-png.flaticon.com"
            ],
            mediaSrc: [
                "'self'", 
                "blob:", 
                "data:",
                "https://jfzgzjgdptowfbtljvyp.supabase.co"
            ],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Compression middleware
app.use(compression());

// Cache headers for static API data (1 hour for data that rarely changes)
const staticDataCache = (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    next();
};

// Apply caching to static data endpoints
app.use('/api/dictionary', staticDataCache);
app.use('/api/phrases', staticDataCache);
app.use('/api/stories', staticDataCache);
app.use('/api/quiz', staticDataCache);
app.use('/api/crossword', staticDataCache);
app.use('/api/pickup-lines', staticDataCache);
app.use('/api/pickup-components', staticDataCache);
app.use('/api/wordle/words', staticDataCache);
app.use('/api/lessons', staticDataCache);

// JSON body parser for API endpoints with size limits
app.use(express.json({
    limit: '10kb',
    strict: true
}));

// URL-encoded body parser with size limits
app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Rate limiting for admin login and actions
app.use('/api/admin/login', adminLoginLimiter);
app.use('/api/admin', adminActionLimiter);

// Mount modular routes
const translateRouter = translateRoutes(translate, translationLimiter, dictionaryCache);
app.use('/api/translate', translateRouter);
// Legacy frontend paths (frontend uses /api/text-to-speech and /api/translate-llm)
app.post('/api/text-to-speech', translationLimiter, (req, res, next) => {
    req.url = '/text-to-speech';
    translateRouter(req, res, next);
});
app.post('/api/translate-llm', translationLimiter, (req, res, next) => {
    req.url = '/llm';
    translateRouter(req, res, next);
});
app.use('/api/dictionary', dictionaryRoutes(supabase, dictionaryLimiter, dictionaryCache));
app.use('/api', contentRoutes(supabase, dictionaryLimiter));
app.use('/api', gamesRoutes(supabase, dictionaryLimiter));
app.use('/api', pickupRoutes(supabase, dictionaryLimiter, translationLimiter));
app.use('/api/ai', aiRoutes(supabase, dictionaryCache, aiChatLimiter));
app.use('/api/suggestions', suggestionsRoutes(supabase, apiLimiter));
app.use('/api/questions', questionsRoutes(supabase, apiLimiter));
app.use('/api/admin', adminRoutes(supabaseAdmin, adminAuth, settingsManager, adminLoginLimiter, adminActionLimiter));

// ============================================
// SEO: Spelling Variant Redirects
// ============================================
const spellingRedirects = {
    'stop-da-mempachi-eye': '../what-does-menpachi-eyes-mean.html',
    'menpachi-eyes': '../what-does-menpachi-eyes-mean.html',
    'no-ka-oi': '../what-does-no-ka-oi-mean.html',
    'no-ka-oy': '../what-does-no-ka-oi-mean.html',
    'nokaoi': '../what-does-no-ka-oi-mean.html',
    'akamai': '../what-does-akamai-mean.html',
    'ah-kah-my': '../what-does-akamai-mean.html',
    'chee-woo': 'chee-hoo',
    'cheewoo': 'chee-hoo',
    'che-hu': 'chee-hoo',
    'chehu': 'chee-hoo',
    'chee-hu': 'chee-hoo',
    'cheehu': 'chee-hoo',
    'chee-huh': 'chee-hoo',
    'cheehuh': 'chee-hoo',
    'cheehoo': 'chee-hoo',
    'cheehuuu': 'chee-hoo',
    'bus-up': 'buss-up',
    'busup': 'buss-up',
    'bussup': 'buss-up',
    'ai-no-kea': 'ainokea',
    'a-hui-ho': 'a-hui-hou',
    'a-hoi-hou': 'a-hui-hou',
    'a-hui-hoa': 'a-hui-hou',
    'a-hui-hoi': 'a-hui-hou',
    'ahuihou': 'a-hui-hou',
    'a-ole-pilikia': 'aole-pilikia',
    'aole-pilikia': 'aole-pilikia',
    'bumbye': 'bumbai',
    'dakine': 'da-kine',
    'bombucha': 'bumboocha',
    'bumbucha': 'bumboocha',
    'acshun': 'ackshun',
    'cholips': 'cho-cho-lips',
    'chocholips': 'cho-cho-lips',
    'mempachi': 'menpachi',
    'mempachi-eyes': 'menpachi-eyes',
    'mempachi eyes': 'menpachi eyes'
};

// SEO: Spelling Variant Redirects for Words
app.use('/word/:slug', (req, res, next) => {
    if (!req.params.slug) return next();
    
    const slug = req.params.slug.replace('.html', '').toLowerCase();
    const correctSlug = spellingRedirects[slug];

    if (correctSlug && correctSlug !== slug) {
        return res.redirect(301, `/word/${correctSlug}.html`);
    }
    
    // Explicitly check for file existence to avoid 5xx or SPA issues
    const filePath = path.join(__dirname, 'public', 'word', req.params.slug.endsWith('.html') ? req.params.slug : `${req.params.slug}.html`);
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    
    next();
});

// SEO: Spelling Variant Redirects for Phrases
app.use('/phrase/:slug', (req, res, next) => {
    if (!req.params.slug) return next();

    const slug = req.params.slug.replace('.html', '').toLowerCase();
    const correctSlug = spellingRedirects[slug];

    if (correctSlug && correctSlug !== slug) {
        return res.redirect(301, `/phrase/${correctSlug}.html`);
    }

    // Explicitly check for file existence
    const filePath = path.join(__dirname, 'public', 'phrase', req.params.slug.endsWith('.html') ? req.params.slug : `${req.params.slug}.html`);
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }

    next();
});

// Initialize settings manager at startup
(async () => {
    if (supabaseAdmin) {
        try {
            await settingsManager.initialize(supabaseAdmin);
        } catch (error) {
            console.error('Failed to initialize settings manager:', error.message);
        }
    }
})();

// ============================================
// SEO: Redirect index.html to /
// ============================================
app.get(['/index.html', '/index'], (req, res) => {
    res.redirect(301, '/');
});

// Serve static files from public directory with smarter caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h', // Default 1 hour for assets
    etag: true,
    dotfiles: 'deny',
    setHeaders: (res, path) => {
        // HTML files should always be revalidated (Cache-Busting)
        if (path.endsWith('.html')) {
            res.set('Cache-Control', 'public, no-cache, must-revalidate');
        }
        // CSS/JS can be cached longer if versioned, but for now 1 hour is safe
        if (path.endsWith('.css') || path.endsWith('.js')) {
            res.set('Cache-Control', 'public, max-age=3600');
        }
        // Images can stay cached longer
        if (/\.(jpg|jpeg|png|gif|ico|svg|webp)$/.test(path)) {
            res.set('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// Handle SPA routing - serve index.html for any non-file requests
// Use app.use() without a path to avoid path-to-regexp issues in Express 5
app.use(pageLimiter, (req, res, next) => {
    // Only handle GET requests for SPA routing that haven't been handled by static/api
    if (req.method !== 'GET') return next();
    
    // If it looks like a file (has an extension), it's a 404
    if (path.extname(req.path)) {
        return res.status(404).send('File not found');
    }
    
    // Serve index.html for all other clean URLs
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🌺 ChokePidgin server running on port ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
});

// Server timeouts
server.setTimeout(30000);
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);

    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});
