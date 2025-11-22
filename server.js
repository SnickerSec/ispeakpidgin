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

// Hawaiian Pidgin Pickup Line Generator API - AI Enhanced
app.post('/api/generate-pickup-line',
    translationLimiter,
    [
        body('context')
            .optional()
            .isIn(['romantic', 'funny', 'sweet', 'bold', 'classic'])
            .withMessage('Invalid context')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { context = 'romantic' } = req.body;
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                return res.status(500).json({ error: 'Gemini API key not configured' });
            }

            // Contextual prompts for different styles
            const contextPrompts = {
                romantic: 'romantic and sweet',
                funny: 'funny and playful',
                sweet: 'genuinely sweet and heartfelt',
                bold: 'bold and confident',
                classic: 'classic and charming'
            };

            const systemPrompt = `You are a Hawaiian Pidgin expert and creative writer. Generate an original, ${contextPrompts[context]} Hawaiian Pidgin pickup line.

REQUIREMENTS:
1. Use authentic Hawaiian Pidgin grammar and vocabulary
2. Include cultural references (food, places, lifestyle)
3. Be ${context} but respectful
4. Use common Pidgin words like: da kine, choke, ono, pau, grindz, brah, sistah, stay, wen

RESPONSE FORMAT (JSON only):
{
  "pidgin": "the pickup line in Hawaiian Pidgin",
  "pronunciation": "phonetic guide (e.g., 'EH, you dah KYNE')",
  "english": "English translation",
  "cultural_note": "brief explanation of any cultural references"
}

Examples of good Pidgin pickup lines:
- "Eh, you da only kine wave I wanna catch"
- "Ho, if you was one musubi, you'd be da special kine"
- "You stay shine brighter den da tiki torches"

Generate ONE original pickup line now.`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.9, // Higher creativity
                        maxOutputTokens: 300
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API error:', response.status, errorText);
                return res.status(response.status).json({
                    error: `Gemini API error: ${response.status}`
                });
            }

            const data = await response.json();
            let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (!aiResponse) {
                return res.status(500).json({ error: 'No response from AI' });
            }

            // Extract JSON from response (might be wrapped in markdown)
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResponse = jsonMatch[0];
            }

            const pickupLine = JSON.parse(aiResponse);

            res.json({
                pidgin: pickupLine.pidgin,
                pronunciation: pickupLine.pronunciation || pickupLine.pidgin,
                english: pickupLine.english,
                culturalNote: pickupLine.cultural_note,
                context: context,
                aiGenerated: true
            });

        } catch (error) {
            console.error('Pickup line generation error:', error);
            res.status(500).json({
                error: 'Generation service error',
                message: error.message
            });
        }
    });

// 808 Mode - Contextual Pickup Line Generator with Local Spots
app.post('/api/generate-808-pickup-line',
    translationLimiter,
    [
        body('gender').optional().isIn(['wahine', 'kane']),
        body('style').optional().isIn(['romantic', 'funny', 'sweet', 'bold', 'classic']),
        body('grindz').optional().trim().isLength({ max: 100 }),
        body('landmark').optional().trim().isLength({ max: 100 }),
        body('trail').optional().trim().isLength({ max: 100 }),
        body('prettyPhrase').optional().trim().isLength({ max: 100 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const {
                gender = 'wahine',
                style = 'romantic',
                grindz,
                landmark,
                trail,
                prettyPhrase = 'You so pretty'
            } = req.body;

            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                return res.status(500).json({ error: 'Gemini API key not configured' });
            }

            // Build context list
            const contexts = [];
            if (grindz) contexts.push(`food spot: ${grindz}`);
            if (landmark) contexts.push(`landmark: ${landmark}`);
            if (trail) contexts.push(`hiking trail: ${trail}`);

            if (contexts.length === 0) {
                return res.status(400).json({ error: 'At least one context (grindz, landmark, or trail) is required' });
            }

            // Style descriptions
            const styleGuides = {
                romantic: "Make it sweet, heartfelt, and sincere. Focus on genuine affection and connection.",
                funny: "Make it humorous, playful, and witty. Use clever wordplay and light-hearted humor.",
                sweet: "Make it charming, gentle, and endearing. Keep it warm and friendly.",
                bold: "Make it confident, direct, and assertive. Show strength while staying respectful.",
                classic: "Make it timeless, smooth, and traditional. Use tried-and-true charm."
            };

            const genderLabel = gender === 'wahine' ? 'Wahine (Female)' : 'Kāne (Male)';
            const styleGuide = styleGuides[style] || styleGuides.romantic;

            const systemPrompt = `You are a Hawaiian Pidgin pickup line generator. Create one ${style} pickup line to say TO a ${genderLabel} using authentic Hawaiian Pidgin.

STYLE: ${styleGuide}

REQUIREMENTS:
1. Start with a Pidgin greeting (Howzit, Ho Brah, Hey Sistah, etc.)
2. Include this compliment: "${prettyPhrase}"
3. Incorporate these contexts naturally: ${contexts.join(', ')}
4. Use Hawaiian Pidgin words like: 'ono (delicious), pau (finished), akamai (smart), choke (a lot), mo' bettah (better), shoots (okay), bumbai (later), grindz (food), holo holo (cruise around)
5. End with a question or suggestion (the "ask")
6. Keep it ${style}, respectful, and culturally authentic

Return ONLY a JSON object with this exact format:
{
  "pidgin": "the pickup line in Hawaiian Pidgin",
  "pronunciation": "how to pronounce it (use caps for stressed syllables)",
  "english": "English translation"
}

Example for a Wahine (Female):
{
  "pidgin": "Howzit wahine! You so pretty, you make dis garlic shrimp look junk. Like go holo holo down Pali Highway and grab one coconut? Shoots!",
  "pronunciation": "HOW-zit wah-HEE-neh! You so PRET-tee, you make DIS GAR-lic shrimp look JUNK. Like go HO-lo HO-lo down PAH-lee HIGH-way and grab one CO-co-nut? SHOOTS!",
  "english": "Hey woman! You're so pretty, you make this garlic shrimp look bad. Want to drive down Pali Highway and get a coconut? Okay!"
}

Example for a Kāne (Male):
{
  "pidgin": "Ho brah! You so handsome, even after climbing Koko Head you still look mo' bettah than da view. Like go get some broke da mouth grindz?",
  "pronunciation": "HO BRAH! You so HAND-sum, even AF-tah CLIMB-ing KO-ko HEAD you still look MO BET-tah than dah VIEW. Like go get some BROKE dah MOUTH GRINDZ?",
  "english": "Wow man! You're so handsome, even after climbing Koko Head stairs you still look better than the view. Want to get some delicious food?"
}`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.9,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API error:', response.status, errorText);
                return res.status(response.status).json({
                    error: `Gemini API error: ${response.status}`
                });
            }

            const data = await response.json();
            let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (!aiResponse) {
                return res.status(500).json({ error: 'No response from AI' });
            }

            // Extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResponse = jsonMatch[0];
            }

            const pickupLine = JSON.parse(aiResponse);

            res.json({
                pidgin: pickupLine.pidgin,
                pronunciation: pickupLine.pronunciation || pickupLine.pidgin,
                english: pickupLine.english,
                type: '808-mode',
                aiGenerated: true,
                contexts: { grindz, landmark, trail },
                style: style,
                gender: gender
            });

        } catch (error) {
            console.error('808 Mode generation error:', error);
            res.status(500).json({
                error: 'Generation service error',
                message: error.message
            });
        }
    });

// Enhance existing pickup line with AI suggestions
app.post('/api/enhance-pickup-line',
    translationLimiter,
    [
        body('pidgin')
            .trim()
            .notEmpty().withMessage('Pidgin text is required')
            .isLength({ max: 200 }).withMessage('Text too long'),
        body('english')
            .optional()
            .trim()
            .isLength({ max: 200 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { pidgin, english } = req.body;
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                return res.status(500).json({ error: 'Gemini API key not configured' });
            }

            const systemPrompt = `You are a Hawaiian Pidgin expert. Given this pickup line, provide 3 enhanced variations that are more creative, culturally rich, or impactful.

Original line:
Pidgin: "${pidgin}"
${english ? `English: "${english}"` : ''}

Provide 3 variations in JSON format:
{
  "variations": [
    {
      "pidgin": "enhanced version 1",
      "pronunciation": "phonetic guide",
      "english": "English translation",
      "improvement": "what makes this better"
    },
    // ... 2 more variations
  ]
}`;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 500
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API error:', response.status, errorText);
                return res.status(response.status).json({
                    error: `Gemini API error: ${response.status}`
                });
            }

            const data = await response.json();
            let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (!aiResponse) {
                return res.status(500).json({ error: 'No response from AI' });
            }

            // Extract JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResponse = jsonMatch[0];
            }

            const enhanced = JSON.parse(aiResponse);

            res.json({
                original: { pidgin, english },
                variations: enhanced.variations || []
            });

        } catch (error) {
            console.error('Enhancement error:', error);
            res.status(500).json({
                error: 'Enhancement service error',
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