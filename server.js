const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const fetch = require('node-fetch');
const fs = require('fs');
const { Translate } = require('@google-cloud/translate').v2;
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

// JSON body parser for API endpoints
app.use(express.json());

// ElevenLabs TTS API endpoint
app.post('/api/text-to-speech', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

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

// Kilo Gateway LLM Translation endpoint (Gemini Flash)
app.post('/api/translate-llm', async (req, res) => {
    try {
        const { text, direction } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const apiKey = process.env.KILO_API_KEY;
        const apiUrl = process.env.KILO_API_URL || 'https://kilocode.ai/api/openrouter';

        if (!apiKey) {
            return res.status(500).json({ error: 'Kilo API key not configured' });
        }

        // Create the prompt based on direction
        const systemPrompt = direction === 'eng-to-pidgin'
            ? `You are an expert Hawaiian Pidgin translator. Translate the following English text into authentic Hawaiian Pidgin (Hawaii Creole English). Use real Pidgin words and grammar patterns like: "stay" for "is/am/are", "wen" for past tense, "going" for future, "da" for "the", "brah/bruddah" for friend, "grindz" for food, etc. Keep it natural and authentic to how locals speak in Hawaii. Only respond with the Pidgin translation, nothing else.`
            : `You are an expert Hawaiian Pidgin translator. Translate the following Hawaiian Pidgin text into standard English. Hawaiian Pidgin uses patterns like "stay" for is/am/are, "wen" for past tense, "da" for "the", etc. Only respond with the English translation, nothing else.`;

        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Kilo API error:', response.status, errorText);
            return res.status(response.status).json({
                error: `Kilo API error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        const translation = data.choices?.[0]?.message?.content?.trim();

        if (!translation) {
            return res.status(500).json({ error: 'No translation received from LLM' });
        }

        res.json({
            originalText: text,
            translatedText: translation,
            direction: direction,
            model: 'gemini-2.0-flash-exp'
        });

    } catch (error) {
        console.error('LLM Translation error:', error);
        res.status(500).json({
            error: 'Translation service error',
            message: error.message
        });
    }
});

// Google Translate API endpoint
app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLanguage, sourceLanguage } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

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