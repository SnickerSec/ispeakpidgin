const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const {
    applyPronunciationCorrections,
    setPronunciationGuides,
    ELEVENLABS_SYNTHESIS
} = require('../src/components/speech/elevenlabs-speech.js');

/**
 * Text-to-Speech Routes (ElevenLabs, with Supabase audio cache)
 */
let warnedNoAdminClient = false;

// translation_cache is shared with the text-translation cache, and its unique index includes
// `direction`. TTS rows are tagged with this so they cannot collide with eng<->pidgin rows that
// happen to hash the same text.
const TTS_DIRECTION = 'tts';

// dictionary_entries.pronunciation carries an authored respelling for most terms. Loading it
// here means every TTS caller gets it, not just whoever remembered to look it up. Refreshed on
// a TTL rather than per request: it is one query for the whole dictionary.
const GUIDE_TTL_MS = 5 * 60 * 1000;
let guidesLoadedAt = 0;
let guidesLoading = null;

async function ensurePronunciationGuides(db) {
    if (!db) return;
    if (Date.now() - guidesLoadedAt < GUIDE_TTL_MS) return;
    if (guidesLoading) return guidesLoading;
    guidesLoading = (async () => {
        try {
            const { data, error } = await db
                .from('dictionary_entries')
                .select('pidgin, pronunciation')
                .not('pronunciation', 'is', null);
            if (error) throw new Error(error.message);
            const count = setPronunciationGuides(data || []);
            guidesLoadedAt = Date.now();
            console.log(`🗣️  Loaded ${count} dictionary pronunciation guides`);
        } catch (e) {
            // Non-fatal: the transform falls back to its algorithmic path.
            console.warn('Pronunciation guide load failed:', e.message);
        } finally {
            guidesLoading = null;
        }
    })();
    return guidesLoading;
}

// server.js passes the SERVICE-ROLE client here (`ttsRoutes(translationLimiter, supabaseAdmin)`),
// not the anon one, so cache reads and writes already run with RLS bypassed. It is null when no
// service key is configured, which disables the whole cache block -- hence the explicit guard and
// the one-time warning below. Naming the parameter accurately because reading it as the anon
// client sends you chasing an RLS problem that does not exist.
module.exports = function(translationLimiter, supabaseAdmin) {

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

                const defaultVoiceId = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic Hawaiian voice (Uncle Kimo)
                const allowedVoices = [
                    'f0ODjLMfcJmlKfs7dFCW', // Uncle Kimo (Mikey - Elder Hawaiian Male)
                    '0f4r1bLyisMv67ocsZMl', // Aunty Pua (Cristina G. - Hawaiian Female)
                    'jRIDd6YCznqwKHkWlpOh', // Sister Hoku (Hoku - Hawaiian Female)
                    'Eqw4o5WB3NXnOBL9xr97', // Keanu (Brandon - Surf Brah Male)
                    '4P3xiZBsFtmaNelXtmvq'  // Cousin Kaipo (Noah - Island Male)
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
                await ensurePronunciationGuides(supabaseAdmin);
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

                if (supabaseAdmin) {
                    try {
                        const { data: cached } = await supabaseAdmin
                            .from('translation_cache')
                            .select('audio_filename')
                            .eq('md5_hash', textHash)
                            .eq('voice_id', voiceId)
                            .eq('direction', TTS_DIRECTION)
                            .maybeSingle();

                        if (cached && cached.audio_filename) {
                            console.log(`📡 Serving cached TTS for: ${textHash}`);
                            const { data: audioData, error: downloadError } = await supabaseAdmin.storage
                                .from(BUCKET_NAME)
                                .download(cached.audio_filename);

                            if (!downloadError && audioData) {
                                const audioBuffer = await audioData.arrayBuffer();
                                res.set({
                                    'Content-Type': 'audio/mpeg',
                                    'Content-Length': audioBuffer.byteLength,
                                    'X-Cache': 'HIT'
                                });
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

                // 3. Save to Cache & Storage asynchronously.
                // Guarded on supabaseAdmin, not supabase: without a service-role key this
                // client is null, and dereferencing it here would throw inside the request
                // handler and 500 the endpoint for every local/CI caller.
                if (supabaseAdmin) {
                    const filename = `cached_${voiceId}_${textHash}.mp3`;

                    // Cache writes use the service-role client: the anon client's Storage
                    // upload and translation_cache upsert are rejected by RLS, which is what
                    // silently disabled this cache and re-billed every playback.
                    supabaseAdmin.storage.from(BUCKET_NAME).upload(filename, audioBuffer, {
                        contentType: 'audio/mpeg',
                        upsert: true
                    }).then(({ error: uploadError }) => {
                        if (uploadError) {
                            console.error('Cache upload failed:', uploadError.message);
                            return;
                        }
                        supabaseAdmin.from('translation_cache').upsert({
                            // original_text, translated_text and direction are NOT NULL in
                            // migration 012. The previous payload omitted all three, so every
                            // insert would have failed even once the table existed.
                            original_text: rawText,
                            translated_text: spokenText,
                            direction: TTS_DIRECTION,
                            audio_filename: filename,
                            voice_id: voiceId,
                            md5_hash: textHash
                        }, { onConflict: 'md5_hash,direction,voice_id' }).then(({ error: upsertError }) => {
                            if (upsertError) console.error('Cache DB update failed:', upsertError.message);
                        }).catch(err => console.error('Cache DB update failed:', err.message));
                    }).catch(err => console.error('Cache upload failed:', err.message));
                } else if (!warnedNoAdminClient) {
                    // Say it once, loudly. This being silent is why the cache stayed broken.
                    warnedNoAdminClient = true;
                    console.warn(
                        '⚠️  TTS audio cache disabled: no service-role Supabase client. ' +
                        'Set SUPABASE_SERVICE_ROLE_KEY or every request will be billed by ElevenLabs.'
                    );
                }

                res.set({
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': audioBuffer.length,
                    'X-Cache': supabaseAdmin ? 'MISS' : 'DISABLED'
                });
                res.send(audioBuffer);
            } catch (error) {
                console.error('TTS API error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    return router;
};
