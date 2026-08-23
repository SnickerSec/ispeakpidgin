const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const {
    applyPronunciationCorrections,
    ELEVENLABS_SYNTHESIS
} = require('../src/components/speech/elevenlabs-speech.js');

/**
 * Text-to-Speech Routes (ElevenLabs, with Supabase audio cache)
 */
module.exports = function(translationLimiter, supabase) {

    // POST /api/text-to-speech
    router.post('/text-to-speech',
        translationLimiter,
        [
            body('text')
                .trim()
                .notEmpty().withMessage('Text is required')
                .isLength({ min: 1, max: 1000 }).withMessage('Text must be between 1 and 1000 characters')
        ],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.warn('TTS validation error:', errors.array());
                return res.status(400).json({ errors: errors.array() });
            }

            try {
                const { text, originalText, voiceId: requestedVoiceId } = req.body;
                const apiKey = process.env.ELEVENLABS_API_KEY;
                if (!apiKey) {
                    console.error('ElevenLabs API key missing');
                    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
                }

                const defaultVoiceId = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic Hawaiian voice (Kimo)
                const allowedVoices = [
                    'f0ODjLMfcJmlKfs7dFCW' // Kimo / Hawaiian
                ];

                let voiceId = defaultVoiceId;
                if (requestedVoiceId && allowedVoices.includes(requestedVoiceId)) {
                    voiceId = requestedVoiceId;
                }

                // Apply phonetics HERE, at the boundary, so pronunciation no longer depends on
                // each caller remembering to do it. `originalText` is the raw string; browsers
                // also send a pre-corrected `text` for backward compatibility. Prefer the raw
                // input -- the transform is NOT idempotent (the `brah` pause rule re-fires and
                // stacks commas), so it must run exactly once, on unprocessed text.
                const rawText = originalText || text;
                const spokenText = applyPronunciationCorrections(rawText);

                // 1. Check Cache First -- keyed on the CANONICAL Pidgin text, not the phonetic
                // respelling. "ono" is the identity of the clip; "oh-noh" is an implementation
                // detail of how we coax ElevenLabs into saying it. Keying on the canonical form
                // means one entry per term per voice regardless of which caller asked, and it
                // matches how tools/audio/* already name their files (md5 of the raw text), so
                // the two namespaces finally agree.
                //
                // Trade-off to know about: because the key no longer contains the phonetics,
                // editing the pronunciation map does NOT invalidate cached audio -- old clips
                // keep serving the old pronunciation until they are regenerated. Bump a version
                // into the key, or clear the affected rows, when the map changes materially.
                const normalizedText = rawText.trim().toLowerCase();
                const textHash = crypto.createHash('md5').update(normalizedText).digest('hex');
                const BUCKET_NAME = 'audio-assets';

                if (supabase) {
                    try {
                        const { data: cached } = await supabase
                            .from('translation_cache')
                            .select('audio_filename')
                            .eq('md5_hash', textHash)
                            .eq('voice_id', voiceId)
                            .single();

                        if (cached && cached.audio_filename) {
                            console.log(`📡 Serving cached TTS for: ${textHash}`);
                            const { data: audioData, error: downloadError } = await supabase.storage
                                .from(BUCKET_NAME)
                                .download(cached.audio_filename);

                            if (!downloadError && audioData) {
                                const audioBuffer = await audioData.arrayBuffer();
                                res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.byteLength });
                                return res.send(Buffer.from(audioBuffer));
                            }
                        }
                    } catch (cacheError) {
                        console.warn('TTS Cache check failed:', cacheError.message);
                    }
                }

                // 2. Generate new audio
                const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
                console.log(`Processing NEW TTS request for voice: ${voiceId}, length: ${text.length}`);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': apiKey
                    },
                    body: JSON.stringify({
                        text: spokenText,
                        model_id: ELEVENLABS_SYNTHESIS.model_id,
                        voice_settings: ELEVENLABS_SYNTHESIS.voice_settings
                    })
                });

                if (!response.ok) {
                    const errorDetails = await response.text();
                    return res.status(response.status).json({ 
                        error: `ElevenLabs API error: ${response.status} ${response.statusText}`,
                        details: errorDetails
                    });
                }

                const audioBuffer = Buffer.from(await response.arrayBuffer());

                // 3. Save to Cache & Storage asynchronously
                if (supabase) {
                    const filename = `cached_${voiceId}_${textHash}.mp3`;
                    
                    // Upload to Storage
                    supabase.storage.from(BUCKET_NAME).upload(filename, audioBuffer, {
                        contentType: 'audio/mpeg',
                        upsert: true
                    }).then(({ error: uploadError }) => {
                        if (!uploadError) {
                            // Update database record
                            supabase.from('translation_cache').upsert({
                                original_text: originalText || text,
                                translated_text: text,
                                direction: 'tts',
                                voice_id: voiceId,
                                audio_filename: filename,
                                md5_hash: textHash
                            }).catch(err => console.error('Cache DB update failed:', err));
                        }
                    }).catch(err => console.error('Cache upload failed:', err));
                }

                res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.length });
                res.send(audioBuffer);
            } catch (error) {
                console.error('TTS API error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    return router;
};
