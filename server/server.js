require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "blob:"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// Compression middleware for better performance
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Cache control for static assets
app.use((req, res, next) => {
    // Cache static assets for 1 day
    if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    next();
});

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Dictionary page route
app.get('/dictionary', (req, res) => {
    res.sendFile(path.join(__dirname, 'dictionary.html'));
});

app.get('/dictionary.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dictionary.html'));
});

// Ask a Local page route
app.get('/ask-local.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'ask-local.html'));
});

// Simple in-memory cache for TTS responses
const ttsCache = new Map();
const crypto = require('crypto');

// ElevenLabs Text-to-Speech API endpoint
app.post('/api/text-to-speech', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Create cache key based on normalized text
        const normalizedText = text.trim().toLowerCase();
        const cacheKey = crypto.createHash('md5').update(normalizedText).digest('hex');

        // Check if we have a pre-generated audio file
        const preGeneratedPath = path.join(__dirname, 'audio', 'cache', `${cacheKey}.mp3`);
        if (require('fs').existsSync(preGeneratedPath)) {
            console.log('Serving pre-generated audio for:', text);
            const audioBuffer = require('fs').readFileSync(preGeneratedPath);

            res.set({
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
                'ETag': `"${cacheKey}"`,
                'X-Cache': 'PRE-GENERATED'
            });

            return res.send(audioBuffer);
        }

        // Check if we have this audio cached
        if (ttsCache.has(cacheKey)) {
            const cached = ttsCache.get(cacheKey);
            console.log('Serving cached TTS for:', text);

            // Set strong cache headers
            res.set({
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=604800, immutable', // Cache for 1 week
                'ETag': `"${cacheKey}"`,
                'X-Cache': 'HIT'
            });

            return res.send(cached.buffer);
        }

        // Check if ElevenLabs API key is configured
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            console.error('ELEVENLABS_API_KEY environment variable not set');
            return res.status(500).json({ error: 'TTS service not configured' });
        }

        // ElevenLabs API configuration
        const voiceId = 'f0ODjLMfcJmlKfs7dFCW'; // Hawaiian voice ID
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

        const requestBody = {
            text: text,
            model_id: 'eleven_flash_v2_5',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        };

        // Make request to ElevenLabs API using fetch (Node.js 18+)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs API error:', response.status, errorText);
            return res.status(response.status).json({ error: 'TTS service error', details: errorText });
        }

        // Get the audio buffer
        const audioBuffer = Buffer.from(await response.arrayBuffer());

        // Cache the audio buffer (limit cache size to prevent memory issues)
        if (ttsCache.size < 100) { // Keep max 100 cached items
            ttsCache.set(cacheKey, {
                buffer: audioBuffer,
                timestamp: Date.now()
            });
        } else {
            // Remove oldest entry
            const oldestKey = ttsCache.keys().next().value;
            ttsCache.delete(oldestKey);
            ttsCache.set(cacheKey, {
                buffer: audioBuffer,
                timestamp: Date.now()
            });
        }

        console.log('Generated and cached TTS for:', text);

        // Set appropriate headers for audio streaming
        res.set({
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=604800, immutable', // Cache for 1 week
            'ETag': `"${cacheKey}"`,
            'X-Cache': 'MISS'
        });

        res.send(audioBuffer);

    } catch (error) {
        console.error('Text-to-speech error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Favicon handlers
app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(__dirname, 'favicon.ico');
    if (require('fs').existsSync(faviconPath)) {
        res.sendFile(faviconPath);
    } else {
        res.status(204).end();
    }
});

app.get('/favicon.svg', (req, res) => {
    res.sendFile(path.join(__dirname, 'favicon.svg'));
});

// Handle 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🌺 ChokePidgin.com is running on port ${PORT}`);
    console.log(`🌊 Visit http://localhost:${PORT} to start learning Hawaiian Pidgin!`);
});