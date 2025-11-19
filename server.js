const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const fetch = require('node-fetch');
const fs = require('fs');
const { Translate } = require('@google-cloud/translate').v2;
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Handle Google Cloud credentials
let credentialsPath = './google-credentials.json';

// If base64 credentials are provided via environment variable (for Railway deployment)
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

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limit for translation endpoints
const translationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 translation requests per windowMs
    message: 'Too many translation requests, please try again later.',
});

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'https://chokepidgin.com',
            'https://www.chokepidgin.com',
            'http://localhost:3000',
            'http://localhost:8080'
        ];

        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

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
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.tailwindcss.com",
                "https://www.googletagmanager.com",
                "https://www.google-analytics.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "https://www.google-analytics.com",
                "https://www.googletagmanager.com"
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: [
                "'self'",
                "https://api.elevenlabs.io",
                "https://www.google-analytics.com",
                "https://analytics.google.com",
                "https://stats.g.doubleclick.net"
            ],
            mediaSrc: ["'self'", "blob:", "data:", "https:"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"]
        }
    }
}));

// Compression middleware
app.use(compression());

// JSON body parser for API endpoints with size limits
app.use(express.json({
    limit: '10kb', // Limit request body size to 10kb
    strict: true // Only accept arrays and objects
}));

// URL-encoded body parser with size limits
app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// ElevenLabs TTS API endpoint with validation
app.post('/api/text-to-speech',
    translationLimiter,
    [
        body('text')
            .trim()
            .notEmpty().withMessage('Text is required')
            .isLength({ min: 1, max: 500 }).withMessage('Text must be between 1 and 500 characters')
            .escape() // Sanitize HTML entities
    ],
    async (req, res) => {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { text } = req.body;

        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'ElevenLabs API key not configured' });
        }

        // ElevenLabs API configuration
        const voiceId = 'f0ODjLMfcJmlKfs7dFCW'; // Hawaiian voice ID
        const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_flash_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8,
                    style: 0.0,
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            console.error('ElevenLabs API error:', response.status, response.statusText);
            return res.status(response.status).json({
                error: `ElevenLabs API error: ${response.status} ${response.statusText}`
            });
        }

        // Stream the audio response
        const audioBuffer = await response.arrayBuffer();

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength
        });

        res.send(Buffer.from(audioBuffer));

        } catch (error) {
            console.error('TTS API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// Google Gemini LLM Translation endpoint with validation
app.post('/api/translate-llm',
    translationLimiter,
    [
        body('text')
            .trim()
            .notEmpty().withMessage('Text is required')
            .isLength({ min: 1, max: 1000 }).withMessage('Text must be between 1 and 1000 characters')
            .escape(),
        body('direction')
            .optional()
            .isIn(['eng-to-pidgin', 'pidgin-to-eng']).withMessage('Invalid direction')
    ],
    async (req, res) => {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { text, direction } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        // Create the prompt based on direction
        const systemPrompt = direction === 'eng-to-pidgin'
            ? `You are an expert Hawaiian Pidgin translator. Translate English into authentic Hawaiian Pidgin (Hawaii Creole English).

Key Pidgin patterns you MUST use:
- Greetings: "hello" → "howzit" or "aloha", "hi" → "howzit", "hey" → "eh"
- To be: "am/is/are" → "stay", Example: "I am tired" → "I stay tired"
- Past tense: add "wen" before verb, Example: "I went" → "I wen go"
- Future: "will/going to" → "going", Example: "I will eat" → "I going grind"
- Articles: "the" → "da", "a/an" → "one"
- Pronouns: "they" → "dey", "them" → "dem", "that" → "dat", "this" → "dis"
- Common words: "food" → "grindz", "eat" → "grind", "friend" → "brah/bruddah", "yes" → "yeah", "okay" → "shoots", "thank you" → "tanks/mahalo", "delicious" → "ono", "finished" → "pau"
- Negation: "don't" → "no", "didn't" → "neva", "can't" → "no can"

Be authentic to how locals in Hawaii actually speak. Only respond with the Pidgin translation, nothing else.`
            : `You are an expert Hawaiian Pidgin translator. Translate Hawaiian Pidgin to standard English. Hawaiian Pidgin uses: "stay" for is/am/are, "wen" for past tense, "da" for "the", "brah" for friend, "grindz" for food, "howzit" for how are you, etc. Only respond with the English translation, nothing else.`;

        // Google Gemini API endpoint - using Gemini 2.5 Flash Lite for cost efficiency
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nTranslate: ${text}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', response.status, errorText);
            return res.status(response.status).json({
                error: `Gemini API error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        const translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!translation) {
            return res.status(500).json({ error: 'No translation received from LLM' });
        }

        res.json({
            originalText: text,
            translatedText: translation,
            direction: direction,
            model: 'gemini-2.5-flash-lite'
        });

        } catch (error) {
            console.error('Gemini Translation error:', error);
            res.status(500).json({
                error: 'Translation service error',
                message: error.message
            });
        }
    });

// Google Translate API endpoint with validation
app.post('/api/translate',
    translationLimiter,
    [
        body('text')
            .trim()
            .notEmpty().withMessage('Text is required')
            .isLength({ min: 1, max: 1000 }).withMessage('Text must be between 1 and 1000 characters')
            .escape(),
        body('targetLanguage')
            .optional()
            .isLength({ min: 2, max: 5 }).withMessage('Invalid language code'),
        body('sourceLanguage')
            .optional()
            .isLength({ min: 2, max: 5 }).withMessage('Invalid language code')
    ],
    async (req, res) => {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { text, targetLanguage, sourceLanguage } = req.body;

        // Default to English if not specified
        const target = targetLanguage || 'en';
        const source = sourceLanguage || 'en';

        // Perform translation
        const [translation] = await translate.translate(text, {
            from: source,
            to: target
        });

        res.json({
            originalText: text,
            translatedText: translation,
            sourceLanguage: source,
            targetLanguage: target
        });

        } catch (error) {
            console.error('Google Translate API error:', error);
            res.status(500).json({
                error: 'Translation service error',
                message: error.message
            });
        }
    });

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Cache static files for 1 day
    etag: true
}));

// Handle SPA routing - serve index.html for any non-file requests
app.get('*', (req, res) => {
    // If request is for a file extension, return 404
    if (path.extname(req.path)) {
        return res.status(404).send('File not found');
    }

    // Otherwise serve index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🌺 ChokePidgin server running on port ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);

    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});