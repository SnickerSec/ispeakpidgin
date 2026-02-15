const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const fs = require('fs');
const { Translate } = require('@google-cloud/translate').v2;
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Admin panel imports
const settingsManager = require('./services/settings-manager');
const adminAuth = require('./middleware/admin-auth');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmemd6amdkcHRvd2ZidGxqdnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzk0OTMsImV4cCI6MjA3OTk1NTQ5M30.xPubHKR0PFEic52CffEBVCwmfPz-AiqbwFk39ulwydM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client initialized');

// Initialize Supabase admin client (service role) for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
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

// Rate limiter for general page requests (more permissive than API)
const pageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 page requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
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
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
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
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            connectSrc: [
                "'self'",
                "https://api.elevenlabs.io",
                "https://www.google-analytics.com",
                "https://analytics.google.com",
                "https://stats.g.doubleclick.net",
                "https://jfzgzjgdptowfbtljvyp.supabase.co"
            ],
            mediaSrc: ["'self'", "blob:", "data:", "https:"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
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

        // Get relevant vocabulary from our curated dictionary
        const vocabularySection = getRelevantVocabulary(text, direction || 'eng-to-pidgin');

        // Create the prompt based on direction
        const systemPrompt = direction === 'eng-to-pidgin'
            ? `You are a Hawaiian Pidgin translator for an educational dictionary website (ChokePidgin.com). This is a linguistic and cultural preservation project. You MUST translate accurately using real Pidgin vocabulary — never censor, euphemize, or substitute polite alternatives. Crude, vulgar, and slang words have authentic Pidgin equivalents that MUST be used.

Key Pidgin patterns you MUST use:
- Greetings: "hello" → "howzit" or "aloha", "hi" → "howzit", "hey" → "eh"
- To be: "am/is/are" → "stay", Example: "I am tired" → "I stay tired"
- Past tense: add "wen" before verb, Example: "I went" → "I wen go"
- Future: "will/going to" → "going", Example: "I will eat" → "I going grind"
- Articles: "the" → "da", "a/an" → "one"
- Pronouns: "they" → "dey", "them" → "dem", "that" → "dat", "this" → "dis"
- Common words: "food" → "grindz", "eat" → "grind", "friend" → "brah/bruddah", "yes" → "yeah", "okay" → "shoots", "thank you" → "tanks/mahalo", "delicious" → "ono", "finished" → "pau"
- Negation: "don't" → "no", "didn't" → "neva", "can't" → "no can"
- Body/slang: "penis" → "boto", "butt/buttocks" → "okole", "fart" → "poot", "poop" → "doodoo", "crazy" → "pupule", "angry" → "huhu", "boobs/breasts" → "chi-chis", "drunk" → "hamajang", "ugly" → "makapiapia", "stupid" → "lolo"

CRITICAL: This is a language education tool. Accuracy is required. Do NOT sanitize, soften, or replace words with English euphemisms. Use the actual Pidgin term every time. For example "penis" is "boto" — not "cock", "ding", or any English substitute.
Only respond with the Pidgin translation, nothing else.${vocabularySection}`
            : `You are an expert Hawaiian Pidgin translator. Translate Hawaiian Pidgin to standard English. Hawaiian Pidgin uses: "stay" for is/am/are, "wen" for past tense, "da" for "the", "brah" for friend, "grindz" for food, "howzit" for how are you, etc. Only respond with the English translation, nothing else.${vocabularySection}`;

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
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
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
        body('style').optional().isIn(['romantic', 'funny', 'sweet', 'bold', 'classic', 'cringe']),
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
                classic: "Make it timeless, smooth, and traditional. Use tried-and-true charm.",
                cringe: "Make it MAXIMUM CRINGE! Use the absolute corniest, cheesiest, most awkward puns and wordplay possible. Think terrible dad jokes meets desperate pickup attempts. The more eye-roll inducing, the better!"
            };

            const genderLabel = gender === 'wahine' ? 'Wahine (Female)' : 'Kāne (Male)';
            const styleGuide = styleGuides[style] || styleGuides.romantic;

            const systemPrompt = `You are a Hawaiian Pidgin pickup line generator. Create one intentionally CORNY and CHEESY ${style} pickup line to say TO a ${genderLabel} using authentic Hawaiian Pidgin mixed with exaggerated romantic clichés.

STYLE: ${styleGuide}

TONE: Make it SUPER DUPER CORNY, ULTRA CHEESY, and gloriously awkward! Mix genuine Pidgin with the most over-the-top, eye-rolling romantic setups you can imagine. Think the worst dad jokes crossed with desperate rom-com lines, Hawaiian edition. The more cringe-worthy, the better! We want people to laugh AND groan at the same time!

REQUIREMENTS:
1. Start with a Pidgin greeting (Howzit, Ho Brah, Hey Sistah, etc.) or a corny question
2. Include this compliment naturally: "${prettyPhrase}"
3. Incorporate these contexts: ${contexts.join(', ')}
4. Use Hawaiian Pidgin words mixed with English: 'ono, pau, akamai, choke, mo' bettah, shoots, bumbai, grindz, holo holo, hammajang (messed up), kolohe (mischievous), try look (check it out), da kine, brah, sistah, stay, wen, mahalo, kama'aina
5. Combine Pidgin with super cheesy English pickup line setups (like "Is your name...", "Are you...", "Did you...")
6. Make exaggerated comparisons to Hawaiian things (beaches, waves, mountains, food, sunshine, etc.)
7. End with a question, suggestion, or cheesy punchline
8. Keep it ${style}, respectful, intentionally corny, and fun!

EXAMPLES OF THE SUPER CORNY VIBE:
- "Is your name Kama'āina? Because you just moved into my heart and I wanna stay here forever, rent-free!"
- "My love for you is like a broken ukulele—it's hammajang, but it still makes sweet music. Wanna tune me up?"
- "You must be the secret ingredient in my pūpū platter, because you're the only thing I wanna snack on tonight. Can I get extra you on da side?"
- "I thought I needed to go up to Mauna Kea for a good view, but now that I've seen you, try look! You're the highest point of beauty in Hawaii. And I'm not just saying that because the altitude makes me dizzy!"
- "Are you Hawaiian Electric? Because you just lit up my whole island! And unlike them, you nevah go out during storms."
- "Is your dad a fisherman? Because you da biggest catch I evah seen, and I'm ready to get hooked!"
- "You must be from Foodland, because you got all da ingredients for my perfect recipe of love. Aisle 3, my heart!"
- "Are you Zippy's chili? Because you stay making me all warm inside and I can nevah get enough!"

Return ONLY a JSON object with this exact format:
{
  "pidgin": "the pickup line in Hawaiian Pidgin",
  "pronunciation": "how to pronounce it (use caps for stressed syllables)",
  "english": "English translation"
}

Example for a Wahine (Female) - CORNY STYLE:
{
  "pidgin": "Eh sistah! Is your name Zippy's chili? Because you so 'ono lookin', you got me feeling all hammajang inside! Every time I cruise down Pali Highway, I t'ink about you mo' den da view. Can we holo holo together an make some kolohe memories? Shoots!",
  "pronunciation": "EH SIS-tah! Is your NAME ZIP-pees CHILI? Because you so OH-no LOOK-in, you got me FEEL-ing all hah-mah-JAHNG in-SIDE! Every TIME I cruise down PAH-lee HIGH-way, I TINK about you MO den dah VIEW. Can we HO-lo HO-lo together an make some ko-LOH-heh MEM-ories? SHOOTS!",
  "english": "Hey sister! Is your name Zippy's chili? Because you look so delicious, you got me feeling all messed up inside! Every time I drive down Pali Highway, I think about you more than the view. Can we hang out together and make some mischievous memories? Okay!"
}

Example for a Kāne (Male) - CORNY STYLE:
{
  "pidgin": "Brah! You so handsome, you make climbing Koko Head look easy! Are you da secret ingredient in Leonard's malasada? Because one look at you an I stay all pau—my heart wen stop! Try look at you! Mo' bettah den any view from Diamond Head. Can I be da pūpū to your plate lunch?",
  "pronunciation": "BRAH! You so HAND-sum, you make CLIMB-ing KO-ko HEAD look EE-zee! Are you dah SEE-cret in-GREE-dee-ent in LEH-nards mah-lah-SAH-dah? Because ONE look at you an I stay all PAU—my HEART wen STOP! Try LOOK at you! MO BET-tah den any VIEW from DYE-mond HEAD. Can I be dah POO-poo to your PLATE LUNCH?",
  "english": "Man! You're so handsome, you make climbing Koko Head look easy! Are you the secret ingredient in Leonard's malasada? Because one look at you and I'm done—my heart stopped! Check you out! Better than any view from Diamond Head. Can I be the appetizer to your plate lunch?"
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

// ============================================
// SUPABASE DICTIONARY API ENDPOINTS
// ============================================

// Rate limiter for dictionary endpoints (more generous than translation)
const dictionaryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes
    message: 'Too many dictionary requests, please try again later.',
});

// In-memory cache for dictionary bulk endpoint (refreshes every 5 minutes)
let dictionaryCache = {
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000 // 5 minutes
};

// Pre-warm dictionary cache at startup so it's ready for translation vocabulary injection
async function prewarmDictionaryCache() {
    try {
        const { data, error, count } = await supabase
            .from('dictionary_entries')
            .select('*', { count: 'exact' })
            .order('pidgin', { ascending: true })
            .limit(1000);

        if (error) {
            console.error('❌ Failed to pre-warm dictionary cache:', error.message);
            return;
        }

        const categoryCounts = data.reduce((acc, item) => {
            const cat = item.category || 'uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});

        dictionaryCache.data = {
            entries: data,
            stats: {
                totalEntries: count || data.length,
                byCategory: categoryCounts,
                lastUpdated: new Date().toISOString()
            }
        };
        dictionaryCache.timestamp = Date.now();
        console.log(`✅ Pre-warmed dictionary cache with ${data.length} entries`);
    } catch (err) {
        console.error('❌ Dictionary pre-warm error:', err.message);
    }
}

// Extract relevant vocabulary from dictionary for LLM prompt injection
function getRelevantVocabulary(text, direction, maxEntries = 35) {
    if (!dictionaryCache.data || !dictionaryCache.data.entries) return '';

    const entries = dictionaryCache.data.entries;
    const inputLower = text.toLowerCase();
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'am', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in',
        'for', 'on', 'with', 'at', 'by', 'from', 'it', 'its', 'this', 'that',
        'i', 'me', 'my', 'you', 'your', 'he', 'she', 'we', 'they', 'and',
        'or', 'but', 'not', 'so', 'if', 'up', 'out', 'no', 'yes'
    ]);

    // Tokenize input, filter stop words
    const inputWords = inputLower
        .replace(/[.,!?;:'"()\-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !stopWords.has(w));

    const matched = [];

    for (const entry of entries) {
        if (matched.length >= maxEntries) break;

        const pidginLower = (entry.pidgin || '').toLowerCase();
        const englishArr = Array.isArray(entry.english) ? entry.english : [entry.english];
        const englishLower = englishArr.map(e => (e || '').toLowerCase());

        if (direction === 'eng-to-pidgin') {
            // Check if any input word matches an English definition
            const isMatch = inputWords.some(word =>
                englishLower.some(eng => eng === word || eng.includes(word) || word.includes(eng))
            );
            if (isMatch) {
                matched.push(`"${englishArr[0]}" = "${entry.pidgin}"`);
            }
        } else {
            // pidgin-to-eng: check if input contains a Pidgin word
            if (inputWords.some(word => pidginLower === word || pidginLower.includes(word) || word.includes(pidginLower))) {
                matched.push(`"${entry.pidgin}" = "${englishArr[0]}"`);
            }
        }
    }

    if (matched.length === 0) return '';

    return `\n\nCURATED DICTIONARY VOCABULARY (use these as authoritative overrides — always prefer these translations over your own when the meaning matches):\n${matched.join('\n')}`;
}

// GET /api/dictionary/all - Get ALL dictionary entries in single request (optimized for initial load)
app.get('/api/dictionary/all',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const now = Date.now();

            // Check cache
            if (dictionaryCache.data && (now - dictionaryCache.timestamp) < dictionaryCache.ttl) {
                res.set('X-Cache', 'HIT');
                res.set('Cache-Control', 'public, max-age=300'); // Browser cache 5 min
                return res.json(dictionaryCache.data);
            }

            // Fetch all entries in single query (Supabase allows up to 1000 per request)
            const { data, error, count } = await supabase
                .from('dictionary_entries')
                .select('*', { count: 'exact' })
                .order('pidgin', { ascending: true })
                .limit(1000);

            if (error) {
                console.error('Supabase bulk query error:', error);
                return res.status(500).json({ error: 'Database query failed', details: error.message });
            }

            // Get category counts for stats
            const categoryCounts = data.reduce((acc, item) => {
                const cat = item.category || 'uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});

            const response = {
                entries: data,
                stats: {
                    totalEntries: count || data.length,
                    byCategory: categoryCounts,
                    lastUpdated: new Date().toISOString()
                }
            };

            // Update cache
            dictionaryCache.data = response;
            dictionaryCache.timestamp = now;

            res.set('X-Cache', 'MISS');
            res.set('Cache-Control', 'public, max-age=300');
            res.json(response);

        } catch (error) {
            console.error('Dictionary bulk API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/dictionary - Get all dictionary entries with pagination
app.get('/api/dictionary',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                category,
                difficulty,
                sort = 'pidgin',
                order = 'asc'
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const validOrders = ['asc', 'desc'];
            const sortOrder = validOrders.includes(order) ? order === 'asc' : true;

            let query = supabase
                .from('dictionary_entries')
                .select('*', { count: 'exact' });

            // Apply filters
            if (category) {
                query = query.eq('category', category);
            }
            if (difficulty) {
                query = query.eq('difficulty', difficulty);
            }

            // Apply sorting and pagination
            query = query
                .order(sort, { ascending: sortOrder })
                .range(offset, offset + parseInt(limit) - 1);

            const { data, error, count } = await query;

            if (error) {
                console.error('Supabase query error:', error);
                return res.status(500).json({ error: 'Database query failed', details: error.message });
            }

            res.json({
                entries: data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            });

        } catch (error) {
            console.error('Dictionary API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/dictionary/search - Full-text search
app.get('/api/dictionary/search',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { q, limit = 20 } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({ error: 'Search query must be at least 2 characters' });
            }

            const searchTerm = q.trim().toLowerCase();

            // Use Supabase full-text search
            const { data, error } = await supabase
                .from('dictionary_entries')
                .select('*')
                .or(`pidgin.ilike.%${searchTerm}%,english.cs.{${searchTerm}}`)
                .limit(parseInt(limit));

            if (error) {
                console.error('Supabase search error:', error);
                return res.status(500).json({ error: 'Search failed', details: error.message });
            }

            res.json({
                query: q,
                results: data,
                count: data.length
            });

        } catch (error) {
            console.error('Search API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/dictionary/categories - Get all unique categories
app.get('/api/dictionary/categories',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('dictionary_entries')
                .select('category')
                .not('category', 'is', null);

            if (error) {
                console.error('Supabase categories error:', error);
                return res.status(500).json({ error: 'Failed to fetch categories' });
            }

            // Get unique categories with counts
            const categoryCounts = data.reduce((acc, item) => {
                if (item.category) {
                    acc[item.category] = (acc[item.category] || 0) + 1;
                }
                return acc;
            }, {});

            res.json({
                categories: Object.entries(categoryCounts).map(([name, count]) => ({
                    name,
                    count
                })).sort((a, b) => a.name.localeCompare(b.name))
            });

        } catch (error) {
            console.error('Categories API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/dictionary/random - Get random entries
app.get('/api/dictionary/random',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { count = 5, difficulty } = req.query;
            const limit = Math.min(parseInt(count), 20); // Cap at 20

            // Get total count first
            let countQuery = supabase
                .from('dictionary_entries')
                .select('*', { count: 'exact', head: true });

            if (difficulty) {
                countQuery = countQuery.eq('difficulty', difficulty);
            }

            const { count: total } = await countQuery;

            // Generate random offset
            const maxOffset = Math.max(0, total - limit);
            const randomOffset = Math.floor(Math.random() * maxOffset);

            let query = supabase
                .from('dictionary_entries')
                .select('*')
                .range(randomOffset, randomOffset + limit - 1);

            if (difficulty) {
                query = query.eq('difficulty', difficulty);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase random error:', error);
                return res.status(500).json({ error: 'Failed to fetch random entries' });
            }

            // Shuffle the results for more randomness
            const shuffled = data.sort(() => Math.random() - 0.5);

            res.json({
                entries: shuffled,
                count: shuffled.length
            });

        } catch (error) {
            console.error('Random API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/dictionary/stats - Get dictionary statistics (must be before :id route)
app.get('/api/dictionary/stats',
    dictionaryLimiter,
    async (req, res) => {
        try {
            // Get total count
            const { count: totalCount } = await supabase
                .from('dictionary_entries')
                .select('*', { count: 'exact', head: true });

            // Get difficulty counts
            const { data: difficultyData } = await supabase
                .from('dictionary_entries')
                .select('difficulty');

            const difficultyCounts = difficultyData.reduce((acc, item) => {
                const diff = item.difficulty || 'unspecified';
                acc[diff] = (acc[diff] || 0) + 1;
                return acc;
            }, {});

            // Get category counts
            const { data: categoryData } = await supabase
                .from('dictionary_entries')
                .select('category');

            const categoryCounts = categoryData.reduce((acc, item) => {
                const cat = item.category || 'uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});

            res.json({
                totalEntries: totalCount,
                byDifficulty: difficultyCounts,
                byCategory: categoryCounts,
                lastUpdated: new Date().toISOString()
            });

        } catch (error) {
            console.error('Stats API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/dictionary/word/:pidgin - Get entry by Pidgin word (must be before :id route)
app.get('/api/dictionary/word/:pidgin',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { pidgin } = req.params;

            const { data, error } = await supabase
                .from('dictionary_entries')
                .select('*')
                .ilike('pidgin', pidgin)
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Word not found' });
                }
                console.error('Supabase word lookup error:', error);
                return res.status(500).json({ error: 'Failed to fetch word' });
            }

            res.json(data);

        } catch (error) {
            console.error('Word lookup API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/dictionary/:id - Get single entry by ID (must be last due to wildcard)
app.get('/api/dictionary/:id',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('dictionary_entries')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Entry not found' });
                }
                console.error('Supabase get error:', error);
                return res.status(500).json({ error: 'Failed to fetch entry' });
            }

            res.json(data);

        } catch (error) {
            console.error('Get entry API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// PHRASES API ENDPOINTS
// ============================================

// GET /api/phrases - Get phrases with pagination and filters
// Cache for phrases (refreshes every 10 minutes)
let phrasesCache = {
    data: null,
    timestamp: 0,
    ttl: 10 * 60 * 1000
};

app.get('/api/phrases',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { page = 1, limit = 50, category, difficulty } = req.query;
            const requestedLimit = Math.min(parseInt(limit), 1000); // Cap at 1000
            const offset = (parseInt(page) - 1) * requestedLimit;

            // Use cache for large requests without filters
            const now = Date.now();
            if (!category && !difficulty && requestedLimit >= 100 && offset === 0) {
                if (phrasesCache.data && (now - phrasesCache.timestamp) < phrasesCache.ttl) {
                    const cachedPhrases = phrasesCache.data.slice(0, requestedLimit);
                    res.set('X-Cache', 'HIT');
                    return res.json({
                        phrases: cachedPhrases,
                        pagination: {
                            page: 1,
                            limit: requestedLimit,
                            total: phrasesCache.data.length,
                            totalPages: Math.ceil(phrasesCache.data.length / requestedLimit)
                        }
                    });
                }
            }

            let query = supabase
                .from('phrases')
                .select('*', { count: 'exact' });

            if (category) query = query.eq('category', category);
            if (difficulty) query = query.eq('difficulty', difficulty);

            query = query.range(offset, offset + requestedLimit - 1);

            const { data, error, count } = await query;

            if (error) {
                return res.status(500).json({ error: 'Database query failed' });
            }

            // Update cache if this was a large unfiltered request
            if (!category && !difficulty && requestedLimit >= 100 && offset === 0) {
                phrasesCache.data = data;
                phrasesCache.timestamp = now;
            }

            res.set('X-Cache', 'MISS');
            res.json({
                phrases: data,
                pagination: {
                    page: parseInt(page),
                    limit: requestedLimit,
                    total: count,
                    totalPages: Math.ceil(count / requestedLimit)
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/phrases/random - Get random phrases
app.get('/api/phrases/random',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { count = 5, category } = req.query;
            const limit = Math.min(parseInt(count), 20);

            // Use database function for efficient random selection
            const { data, error } = await supabase.rpc('get_random_phrases', {
                p_count: limit,
                p_category: category || null
            });

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch phrases' });
            }

            res.json({ phrases: data, count: data.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// STORIES API ENDPOINTS
// ============================================

// GET /api/stories - Get all stories
app.get('/api/stories',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { difficulty } = req.query;

            let query = supabase.from('stories').select('*');
            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch stories' });
            }

            res.json({ stories: data, count: data.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/stories/:id - Get single story
app.get('/api/stories/:id',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('stories')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Story not found' });
                }
                return res.status(500).json({ error: 'Failed to fetch story' });
            }

            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// CROSSWORD API ENDPOINTS
// ============================================

// GET /api/crossword/words - Get crossword words
app.get('/api/crossword/words',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { category, difficulty, minLength, maxLength } = req.query;

            let query = supabase.from('crossword_words').select('*');

            if (category) query = query.eq('category', category);
            if (difficulty) query = query.eq('difficulty', difficulty);
            if (minLength) query = query.gte('length', parseInt(minLength));
            if (maxLength) query = query.lte('length', parseInt(maxLength));

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch crossword words' });
            }

            res.json({ words: data, count: data.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/crossword/random - Get random crossword words for puzzle generation
app.get('/api/crossword/random',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { count = 20, difficulty } = req.query;

            let query = supabase.from('crossword_words').select('*');
            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch words' });
            }

            const shuffled = data.sort(() => Math.random() - 0.5).slice(0, parseInt(count));
            res.json({ words: shuffled, count: shuffled.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// PICKUP LINES API ENDPOINTS
// ============================================

// GET /api/pickup-lines - Get pickup lines
app.get('/api/pickup-lines',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { category, maxSpiciness } = req.query;

            let query = supabase.from('pickup_lines').select('*');

            if (category) query = query.eq('category', category);
            if (maxSpiciness) query = query.lte('spiciness', parseInt(maxSpiciness));

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch pickup lines' });
            }

            res.json({ lines: data, count: data.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/pickup-lines/random - Get random pickup line
app.get('/api/pickup-lines/random',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { maxSpiciness = 5 } = req.query;

            const { data, error } = await supabase
                .from('pickup_lines')
                .select('*')
                .lte('spiciness', parseInt(maxSpiciness));

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch pickup line' });
            }

            const randomLine = data[Math.floor(Math.random() * data.length)];
            res.json(randomLine);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// QUIZ API ENDPOINTS
// ============================================

// GET /api/quiz/questions - Get quiz questions
app.get('/api/quiz/questions',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { category, difficulty, count = 10 } = req.query;

            let query = supabase.from('quiz_questions').select('*');

            if (category) query = query.eq('category', category);
            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch questions' });
            }

            // Shuffle and limit
            const shuffled = data.sort(() => Math.random() - 0.5).slice(0, parseInt(count));
            res.json({ questions: shuffled, count: shuffled.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// LESSONS API ENDPOINTS
// ============================================

// In-memory cache for lessons
const lessonsCache = { data: null, timestamp: 0, ttl: 300000 }; // 5 min cache

// GET /api/lessons - Get all lessons organized by level
app.get('/api/lessons',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { level } = req.query;
            const now = Date.now();

            // Check cache for full lessons request
            if (!level && lessonsCache.data && (now - lessonsCache.timestamp) < lessonsCache.ttl) {
                res.set('X-Cache', 'HIT');
                return res.json(lessonsCache.data);
            }

            // Build query
            let query = supabase
                .from('lessons')
                .select(`
                    id,
                    lesson_key,
                    level,
                    title,
                    icon,
                    cultural_note,
                    practice,
                    sort_order,
                    lesson_vocabulary (
                        pidgin,
                        english,
                        example,
                        sort_order
                    )
                `)
                .order('sort_order', { ascending: true });

            if (level) {
                query = query.eq('level', level);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Lessons fetch error:', error);
                return res.status(500).json({ error: 'Failed to fetch lessons' });
            }

            // Transform data to match frontend expected format
            const lessonsByLevel = { beginner: [], intermediate: [], advanced: [] };

            data.forEach(lesson => {
                const formattedLesson = {
                    id: lesson.lesson_key,
                    title: lesson.title,
                    icon: lesson.icon,
                    content: {
                        vocabulary: (lesson.lesson_vocabulary || [])
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map(v => ({
                                pidgin: v.pidgin,
                                english: v.english,
                                example: v.example
                            })),
                        culturalNote: lesson.cultural_note,
                        practice: lesson.practice
                    }
                };
                lessonsByLevel[lesson.level].push(formattedLesson);
            });

            const result = level ? { [level]: lessonsByLevel[level] } : lessonsByLevel;

            // Cache full response
            if (!level) {
                lessonsCache.data = result;
                lessonsCache.timestamp = now;
            }

            res.json(result);
        } catch (error) {
            console.error('Lessons API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/lessons/:lessonKey - Get a specific lesson by key
app.get('/api/lessons/:lessonKey',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { lessonKey } = req.params;

            const { data, error } = await supabase
                .from('lessons')
                .select(`
                    id,
                    lesson_key,
                    level,
                    title,
                    icon,
                    cultural_note,
                    practice,
                    lesson_vocabulary (
                        pidgin,
                        english,
                        example,
                        sort_order
                    )
                `)
                .eq('lesson_key', lessonKey)
                .single();

            if (error || !data) {
                return res.status(404).json({ error: 'Lesson not found' });
            }

            const formattedLesson = {
                id: data.lesson_key,
                level: data.level,
                title: data.title,
                icon: data.icon,
                content: {
                    vocabulary: (data.lesson_vocabulary || [])
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map(v => ({
                            pidgin: v.pidgin,
                            english: v.english,
                            example: v.example
                        })),
                    culturalNote: data.cultural_note,
                    practice: data.practice
                }
            };

            res.json(formattedLesson);
        } catch (error) {
            console.error('Lesson fetch error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// WORDLE API ENDPOINTS
// ============================================

// GET /api/wordle/daily - Get daily wordle word
app.get('/api/wordle/daily',
    dictionaryLimiter,
    async (req, res) => {
        try {
            // Get today's date in Hawaii timezone
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });

            // First check if there's a word already assigned for today
            const { data: usedWord, error: usedError } = await supabase
                .from('wordle_words')
                .select('*')
                .eq('used_on', today)
                .single();

            if (usedWord && !usedError) {
                return res.json({
                    word: usedWord.word,
                    meaning: usedWord.meaning,
                    pronunciation: usedWord.pronunciation,
                    difficulty: usedWord.difficulty,
                    date: today
                });
            }

            // If no word for today, get a random unused solution word
            const { data: availableWords, error } = await supabase
                .from('wordle_words')
                .select('*')
                .eq('is_solution', true)
                .is('used_on', null);

            if (error || !availableWords || availableWords.length === 0) {
                // Fallback: get any solution word if all have been used
                const { data: anyWord } = await supabase
                    .from('wordle_words')
                    .select('*')
                    .eq('is_solution', true)
                    .limit(1)
                    .single();

                if (anyWord) {
                    return res.json({
                        word: anyWord.word,
                        meaning: anyWord.meaning,
                        pronunciation: anyWord.pronunciation,
                        difficulty: anyWord.difficulty,
                        date: today,
                        recycled: true
                    });
                }
                return res.status(500).json({ error: 'No wordle words available' });
            }

            // Pick a random word from available
            const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];

            // Mark it as used (optional - comment out if you don't want to track usage)
            // await supabase.from('wordle_words').update({ used_on: today }).eq('id', randomWord.id);

            res.json({
                word: randomWord.word,
                meaning: randomWord.meaning,
                pronunciation: randomWord.pronunciation,
                difficulty: randomWord.difficulty,
                date: today
            });
        } catch (error) {
            console.error('Wordle daily API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/wordle/validate - Check if a word is valid for guessing
app.get('/api/wordle/validate/:word',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { word } = req.params;

            if (!word || word.length !== 5) {
                return res.json({ valid: false, reason: 'Word must be exactly 5 letters' });
            }

            const { data, error } = await supabase
                .from('wordle_words')
                .select('word, is_valid_guess')
                .ilike('word', word.toLowerCase())
                .single();

            if (error || !data) {
                return res.json({ valid: false, reason: 'Word not in dictionary' });
            }

            res.json({
                valid: data.is_valid_guess,
                word: data.word
            });
        } catch (error) {
            console.error('Wordle validate API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/wordle/words - Get all wordle words (for debugging/admin)
app.get('/api/wordle/words',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { solutions_only, valid_guesses_only, difficulty } = req.query;

            let query = supabase.from('wordle_words').select('word, is_solution, is_valid_guess, difficulty');

            if (solutions_only === 'true') query = query.eq('is_solution', true);
            if (valid_guesses_only === 'true') query = query.eq('is_valid_guess', true);
            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch wordle words' });
            }

            res.json({
                words: data.map(w => w.word),
                count: data.length,
                solutions: data.filter(w => w.is_solution).length,
                validGuesses: data.filter(w => w.is_valid_guess).length
            });
        } catch (error) {
            console.error('Wordle words API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// CROSSWORD PUZZLES API ENDPOINTS
// ============================================

// GET /api/crossword/puzzles - Get all crossword puzzles
app.get('/api/crossword/puzzles',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { difficulty, theme } = req.query;

            let query = supabase.from('crossword_puzzles').select('*');

            if (difficulty) query = query.eq('difficulty', difficulty);
            if (theme) query = query.ilike('theme', `%${theme}%`);

            query = query.order('puzzle_id', { ascending: true });

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch crossword puzzles' });
            }

            res.json({ puzzles: data, count: data.length });
        } catch (error) {
            console.error('Crossword puzzles API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/crossword/puzzles/:id - Get single crossword puzzle by puzzle_id
app.get('/api/crossword/puzzles/:puzzleId',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { puzzleId } = req.params;

            const { data, error } = await supabase
                .from('crossword_puzzles')
                .select('*')
                .eq('puzzle_id', puzzleId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Puzzle not found' });
                }
                return res.status(500).json({ error: 'Failed to fetch puzzle' });
            }

            res.json(data);
        } catch (error) {
            console.error('Crossword puzzle API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/crossword/daily - Get daily crossword puzzle
app.get('/api/crossword/daily',
    dictionaryLimiter,
    async (req, res) => {
        try {
            // Get today's date in Hawaii timezone
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });

            // Check if there's a puzzle assigned for today
            const { data: todayPuzzle, error: todayError } = await supabase
                .from('crossword_puzzles')
                .select('*')
                .eq('used_on', today)
                .single();

            if (todayPuzzle && !todayError) {
                return res.json(todayPuzzle);
            }

            // Otherwise, rotate through puzzles based on day of year
            const { data: allPuzzles, error } = await supabase
                .from('crossword_puzzles')
                .select('*')
                .order('puzzle_id', { ascending: true });

            if (error || !allPuzzles || allPuzzles.length === 0) {
                return res.status(500).json({ error: 'No crossword puzzles available' });
            }

            // Use day of year to pick a puzzle (rotates through all puzzles)
            const startOfYear = new Date(new Date().getFullYear(), 0, 0);
            const diff = new Date() - startOfYear;
            const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
            const puzzleIndex = dayOfYear % allPuzzles.length;

            res.json({
                ...allPuzzles[puzzleIndex],
                date: today
            });
        } catch (error) {
            console.error('Crossword daily API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// PICKUP LINE COMPONENTS API ENDPOINTS
// ============================================

// GET /api/pickup-components - Get pickup line components
app.get('/api/pickup-components',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { type, category } = req.query;

            let query = supabase.from('pickup_line_components').select('*');

            if (type) query = query.eq('component_type', type);
            if (category) query = query.eq('category', category);

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch pickup line components' });
            }

            // Group by component type for easier use
            const grouped = data.reduce((acc, item) => {
                const type = item.component_type;
                if (!acc[type]) acc[type] = [];
                acc[type].push(item);
                return acc;
            }, {});

            res.json({
                components: data,
                grouped: grouped,
                count: data.length
            });
        } catch (error) {
            console.error('Pickup components API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/pickup-components/random - Get random components for generator
app.get('/api/pickup-components/random',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('pickup_line_components')
                .select('*');

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch components' });
            }

            // Group and pick one random from each type
            const byType = data.reduce((acc, item) => {
                const type = item.component_type;
                if (!acc[type]) acc[type] = [];
                acc[type].push(item);
                return acc;
            }, {});

            const randomPick = {};
            for (const [type, items] of Object.entries(byType)) {
                randomPick[type] = items[Math.floor(Math.random() * items.length)];
            }

            res.json(randomPick);
        } catch (error) {
            console.error('Pickup components random API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// 808 MODE LOCATIONS API ENDPOINTS (Legacy)
// ============================================

// GET /api/locations-808 - Get all 808 Mode locations (places, landmarks, trails)
app.get('/api/locations-808',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { type } = req.query;

            let query = supabase.from('locations_808').select('*');

            if (type) query = query.eq('location_type', type);

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch 808 locations' });
            }

            // Group by location type for easier use
            const grouped = data.reduce((acc, item) => {
                const locType = item.location_type;
                if (!acc[locType]) acc[locType] = [];
                acc[locType].push({
                    name: item.name,
                    description: item.description,
                    pronunciation: item.pronunciation
                });
                return acc;
            }, {});

            res.json({
                locations: data,
                grouped: grouped,
                count: data.length
            });
        } catch (error) {
            console.error('808 locations API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// 808 CRINGE GENERATOR API ENDPOINTS
// ============================================

// GET /api/cringe/activities - Get all activities with their locations
app.get('/api/cringe/activities',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('cringe_activities')
                .select(`
                    id,
                    activity_key,
                    activity_name,
                    emoji,
                    locations:cringe_locations(id, location_key, location_name)
                `);

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch activities' });
            }

            res.json({ activities: data });
        } catch (error) {
            console.error('Cringe activities API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// GET /api/cringe/generate - Generate a cringe pickup line using Gemini AI
app.get('/api/cringe/generate',
    translationLimiter,
    async (req, res) => {
        try {
            const { target_style, location_key, activity } = req.query;

            if (!target_style || !location_key) {
                return res.status(400).json({ error: 'target_style and location_key are required' });
            }

            // Get location info
            const { data: locationData, error: locationError } = await supabase
                .from('cringe_locations')
                .select(`
                    id,
                    location_name,
                    activity:cringe_activities(activity_name, activity_key)
                `)
                .eq('location_key', location_key)
                .single();

            if (locationError || !locationData) {
                return res.status(400).json({ error: 'Invalid location_key' });
            }

            const locationName = locationData.location_name;
            const activityName = locationData.activity?.activity_name || activity || 'local spot';
            const activityKey = locationData.activity?.activity_key || 'grindz';

            // Get sample metaphors for this location for context
            const { data: metaphors } = await supabase
                .from('cringe_metaphors')
                .select('metaphor')
                .eq('location_id', locationData.id)
                .limit(3);

            const sampleMetaphors = metaphors?.map(m => m.metaphor).join('; ') || '';

            // Get sample greetings for this target style
            const { data: greetings } = await supabase
                .from('cringe_greetings')
                .select('greeting')
                .eq('gender', target_style);

            const sampleGreetings = greetings?.map(g => g.greeting).join(', ') || 'Howzit';

            // Get sample payoffs
            const { data: payoffs } = await supabase
                .from('cringe_payoffs')
                .select('payoff')
                .limit(5);

            const samplePayoffs = payoffs?.map(p => p.payoff).join('; ') || '';

            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                // Fallback to database-assembled line if no API key
                const greeting = greetings?.[Math.floor(Math.random() * greetings.length)]?.greeting || 'Howzit';
                const metaphor = metaphors?.[Math.floor(Math.random() * metaphors.length)]?.metaphor || `you stay beautiful like ${locationName}`;
                const payoff = payoffs?.[Math.floor(Math.random() * payoffs.length)]?.payoff || 'Like go out wit me?';

                return res.json({
                    pickup_line: `${greeting}, ${metaphor}. ${payoff}`,
                    components: { greeting, metaphor, payoff, location: locationName },
                    source: 'database'
                });
            }

            const styleLabel = target_style === 'wahine' ? 'wahine (woman)' : 'kane (man)';

            // Activity-specific context
            const activityContexts = {
                grindz: `This is a famous food spot. Reference the food, atmosphere, or experience of eating there.`,
                beach: `This is a beach/surf spot. Reference the waves, sand, water, surfing, swimming, or beach vibes.`,
                hiking: `This is a hiking trail/nature spot. Reference the views, the climb, the nature, or the adventure.`
            };

            const activityContext = activityContexts[activityKey] || activityContexts.grindz;

            const prompt = `Generate ONE SHORT, punchy Hawaiian Pidgin pickup line for a ${styleLabel} about "${locationName}".

CRITICAL: Keep it SHORT - maximum 15-20 words total. One or two sentences max.

STRUCTURE (pick one):
- Greeting + short comparison + question: "Eh sistah, you mo' sweet than malasadas. Like go out?"
- Direct corny line: "Ho, I tink I wen' pau. Can I borrow your digits?"
- Simple metaphor + payoff: "You stay hot like Leonard's fryer. Shoots, gimme your numba?"

EXAMPLES OF GOOD LENGTH:
- "Eh, you mo' ono than ${locationName} grindz. We go cruise?"
- "Ho sistah, you stay gorgeous like ${locationName} sunset. Like holo holo?"
- "Brah, I'd wait in line fo' you longer than ${locationName}. What you say?"

USE PIDGIN: da kine, stay, mo', fo', wen, shoots, bumbye, holo holo, grindz, brah/sistah, ono, pau

${activityContext}

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{"pidgin": "short pickup line here", "english": "brief translation"}`;

            // Call Gemini API
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

            const geminiResponse = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.85,
                        maxOutputTokens: 150
                    }
                })
            });

            if (!geminiResponse.ok) {
                throw new Error(`Gemini API error: ${geminiResponse.status}`);
            }

            const geminiData = await geminiResponse.json();
            const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Parse the JSON response
            let parsed;
            try {
                // Try to extract JSON from the response
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('Failed to parse Gemini response:', responseText);
                // Fallback to database
                const greeting = greetings?.[Math.floor(Math.random() * greetings.length)]?.greeting || 'Howzit';
                const metaphor = metaphors?.[Math.floor(Math.random() * metaphors.length)]?.metaphor || `you stay beautiful like ${locationName}`;
                const payoff = payoffs?.[Math.floor(Math.random() * payoffs.length)]?.payoff || 'Like go out wit me?';

                return res.json({
                    pickup_line: `${greeting}, ${metaphor}. ${payoff}`,
                    components: { greeting, metaphor, payoff, location: locationName },
                    source: 'database-fallback'
                });
            }

            res.json({
                pickup_line: parsed.pidgin,
                english: parsed.english,
                components: {
                    location: locationName,
                    activity: activityName
                },
                source: 'gemini'
            });

        } catch (error) {
            console.error('Cringe generate API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

// ============================================
// SEO: Spelling Variant Redirects
// Redirects common misspellings to correct word pages
// ============================================
const spellingRedirects = {
    // Chee hoo variants (21+ impressions)
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

    // Buss up variants (72+ impressions)
    'bus-up': 'buss-up',
    'busup': 'buss-up',
    'bussup': 'buss-up',

    // Ainokea variants
    'ai-no-kea': 'ainokea',
    'ainokea': 'ainokea',

    // A hui hou variants (9+ impressions)
    'a-hui-ho': 'a-hui-hou',
    'a-hoi-hou': 'a-hui-hou',
    'a-hui-hoa': 'a-hui-hou',
    'a-hui-hoi': 'a-hui-hou',
    'ahuihou': 'a-hui-hou',

    // Aole pilikia variants (11+ impressions)
    'a-ole-pilikia': 'aole-pilikia',
    'aole-pilikia': 'aole-pilikia',

    // Bumbai variants
    'bumbye': 'bumbai',

    // Da kine variants
    'dakine': 'da-kine',

    // Bumboocha variants
    'bombucha': 'bumboocha',
    'bumbucha': 'bumboocha',

    // Ackshun variant
    'acshun': 'ackshun',

    // Chocho lips variant
    'cholips': 'cho-cho-lips',
    'chocholips': 'cho-cho-lips'
};

// Redirect middleware for spelling variants
app.use('/word/:slug', (req, res, next) => {
    const slug = req.params.slug.replace('.html', '').toLowerCase();
    const correctSlug = spellingRedirects[slug];

    if (correctSlug && correctSlug !== slug) {
        // 301 permanent redirect for SEO
        return res.redirect(301, `/word/${correctSlug}.html`);
    }
    next();
});

// ============================================
// ADMIN PANEL API ENDPOINTS
// ============================================

// Admin rate limiter (strict for login attempts)
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per window
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// POST /api/admin/login - Authenticate admin user
app.post('/api/admin/login',
    adminLoginLimiter,
    [
        body('username').trim().notEmpty().isLength({ min: 3, max: 50 }),
        body('password').notEmpty().isLength({ min: 8, max: 128 })
    ],
    async (req, res) => {
        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'Admin features not available' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, password } = req.body;

            // Get user
            const user = await adminAuth.getUserByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if account is locked
            if (adminAuth.isAccountLocked(user)) {
                const lockRemaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
                return res.status(423).json({
                    error: `Account locked. Try again in ${lockRemaining} minutes.`
                });
            }

            // Verify password
            const validPassword = await adminAuth.verifyPassword(password, user.password_hash);
            if (!validPassword) {
                await adminAuth.incrementFailedAttempts(user.id);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Reset failed attempts and generate token
            await adminAuth.resetFailedAttempts(user.id);
            const token = adminAuth.generateToken(user);
            await adminAuth.createSession(user.id, token, req);

            // Log the login
            await adminAuth.logAuditAction({
                userId: user.id,
                username: user.username,
                action: 'LOGIN',
                req
            });

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    });

// POST /api/admin/logout - Revoke admin session
app.post('/api/admin/logout',
    adminAuth.requireAdminAuth,
    async (req, res) => {
        try {
            await adminAuth.revokeSession(req.adminToken);

            await adminAuth.logAuditAction({
                userId: req.adminUser.id,
                username: req.adminUser.username,
                action: 'LOGOUT',
                req
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Admin logout error:', error);
            res.status(500).json({ error: 'Logout failed' });
        }
    });

// POST /api/admin/users/setup - Create first admin user (one-time setup)
app.post('/api/admin/users/setup',
    adminLoginLimiter,
    [
        body('username').trim().notEmpty().isLength({ min: 3, max: 50 }),
        body('password').notEmpty().isLength({ min: 8, max: 128 }),
        body('setupSecret').notEmpty()
    ],
    async (req, res) => {
        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'Admin features not available' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, password, setupSecret } = req.body;

            // Verify setup secret
            const expectedSecret = process.env.ADMIN_SETUP_SECRET;
            if (!expectedSecret || setupSecret !== expectedSecret) {
                return res.status(403).json({ error: 'Invalid setup secret' });
            }

            // Check if admin users already exist
            const hasAdmins = await adminAuth.hasAdminUsers();
            if (hasAdmins) {
                return res.status(400).json({ error: 'Admin user already exists. Use login instead.' });
            }

            // Create the first admin user as super_admin
            const user = await adminAuth.createAdminUser(username, password, 'super_admin');

            // Log the creation
            await adminAuth.logAuditAction({
                username: username,
                action: 'ADMIN_SETUP',
                details: { created_user: username },
                req
            });

            res.json({
                success: true,
                message: 'Admin user created successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Admin setup error:', error);
            res.status(500).json({ error: 'Setup failed: ' + error.message });
        }
    });

// GET /api/admin/settings - Get all settings grouped by category
app.get('/api/admin/settings',
    adminAuth.requireAdminAuth,
    async (req, res) => {
        try {
            // Ensure settings are loaded
            if (!settingsManager.isInitialized() && supabaseAdmin) {
                await settingsManager.initialize(supabaseAdmin);
            }

            const settings = settingsManager.getAllGrouped(true); // Mask secrets
            res.json(settings);
        } catch (error) {
            console.error('Get settings error:', error);
            res.status(500).json({ error: 'Failed to get settings' });
        }
    });

// PUT /api/admin/settings - Update a single setting
app.put('/api/admin/settings',
    adminAuth.requireAdminAuth,
    [
        body('key').trim().notEmpty(),
        body('value').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { key, value } = req.body;
            const updated = await settingsManager.set(key, String(value));

            await adminAuth.logAuditAction({
                userId: req.adminUser.id,
                username: req.adminUser.username,
                action: 'UPDATE_SETTING',
                resource: key,
                details: { new_value: value.toString().substring(0, 50) },
                req
            });

            res.json({ success: true, setting: updated });
        } catch (error) {
            console.error('Update setting error:', error);
            res.status(500).json({ error: 'Failed to update setting' });
        }
    });

// PUT /api/admin/settings/bulk - Update multiple settings at once
app.put('/api/admin/settings/bulk',
    adminAuth.requireAdminAuth,
    async (req, res) => {
        try {
            const updates = req.body;

            if (!updates || typeof updates !== 'object') {
                return res.status(400).json({ error: 'Invalid updates object' });
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
            console.error('Bulk update error:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    });

// POST /api/admin/settings/refresh - Force reload settings from database
app.post('/api/admin/settings/refresh',
    adminAuth.requireAdminAuth,
    async (req, res) => {
        try {
            await settingsManager.refresh();

            await adminAuth.logAuditAction({
                userId: req.adminUser.id,
                username: req.adminUser.username,
                action: 'REFRESH_SETTINGS',
                req
            });

            res.json({ success: true, message: 'Settings refreshed' });
        } catch (error) {
            console.error('Refresh settings error:', error);
            res.status(500).json({ error: 'Failed to refresh settings' });
        }
    });

// GET /api/admin/audit-log - Get audit log entries
app.get('/api/admin/audit-log',
    adminAuth.requireAdminAuth,
    async (req, res) => {
        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'Admin features not available' });
        }

        try {
            const { limit = 50, offset = 0 } = req.query;

            const { data, error } = await supabaseAdmin
                .from('admin_audit_log')
                .select('*')
                .order('created_at', { ascending: false })
                .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

            if (error) throw error;

            res.json({ logs: data });
        } catch (error) {
            console.error('Get audit log error:', error);
            res.status(500).json({ error: 'Failed to get audit log' });
        }
    });

// POST /api/admin/test/elevenlabs - Test ElevenLabs API key
app.post('/api/admin/test/elevenlabs',
    adminAuth.requireAdminAuth,
    [body('apiKey').notEmpty()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { apiKey } = req.body;

            // Test the API key by getting user info
            const response = await fetch('https://api.elevenlabs.io/v1/user', {
                headers: { 'xi-api-key': apiKey }
            });

            if (response.ok) {
                const data = await response.json();
                res.json({
                    success: true,
                    message: `Connected as ${data.subscription?.tier || 'user'}`,
                    charactersRemaining: data.subscription?.character_count
                });
            } else {
                res.json({ success: false, error: 'Invalid API key' });
            }
        } catch (error) {
            console.error('ElevenLabs test error:', error);
            res.json({ success: false, error: error.message });
        }
    });

// POST /api/admin/test/gemini - Test Gemini API key
app.post('/api/admin/test/gemini',
    adminAuth.requireAdminAuth,
    [body('apiKey').notEmpty()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { apiKey } = req.body;

            // Test the API key with a simple request
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );

            if (response.ok) {
                const data = await response.json();
                res.json({
                    success: true,
                    message: `API key valid. ${data.models?.length || 0} models available.`
                });
            } else {
                const error = await response.json();
                res.json({ success: false, error: error.error?.message || 'Invalid API key' });
            }
        } catch (error) {
            console.error('Gemini test error:', error);
            res.json({ success: false, error: error.message });
        }
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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Cache static files for 1 day
    etag: true
}));

// Handle SPA routing - serve index.html for any non-file requests
app.get('/{*splat}', pageLimiter, (req, res) => {
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

    // Pre-warm dictionary cache for translation vocabulary injection
    prewarmDictionaryCache();
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