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
            mediaSrc: ["'self'"],
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

// ElevenLabs Text-to-Speech API endpoint
app.post('/api/text-to-speech', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
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

        // Make request to ElevenLabs API
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
            console.error('ElevenLabs API error:', response.status, response.statusText);
            return res.status(response.status).json({ error: 'TTS service error' });
        }

        // Set appropriate headers for audio streaming
        res.set({
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        });

        // Stream the audio data back to the client
        response.body.pipe(res);

    } catch (error) {
        console.error('Text-to-speech error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
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