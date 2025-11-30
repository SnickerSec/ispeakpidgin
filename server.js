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
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmemd6amdkcHRvd2ZidGxqdnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzk0OTMsImV4cCI6MjA3OTk1NTQ5M30.xPubHKR0PFEic52CffEBVCwmfPz-AiqbwFk39ulwydM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client initialized');

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
                "https://stats.g.doubleclick.net",
                "https://jfzgzjgdptowfbtljvyp.supabase.co"
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
app.get('/api/phrases',
    dictionaryLimiter,
    async (req, res) => {
        try {
            const { page = 1, limit = 50, category, difficulty } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            let query = supabase
                .from('phrases')
                .select('*', { count: 'exact' });

            if (category) query = query.eq('category', category);
            if (difficulty) query = query.eq('difficulty', difficulty);

            query = query.range(offset, offset + parseInt(limit) - 1);

            const { data, error, count } = await query;

            if (error) {
                return res.status(500).json({ error: 'Database query failed' });
            }

            res.json({
                phrases: data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limit))
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

            let query = supabase.from('phrases').select('*');
            if (category) query = query.eq('category', category);

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: 'Failed to fetch phrases' });
            }

            // Shuffle and take requested count
            const shuffled = data.sort(() => Math.random() - 0.5).slice(0, limit);
            res.json({ phrases: shuffled, count: shuffled.length });
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