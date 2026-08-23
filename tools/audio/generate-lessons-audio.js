#!/usr/bin/env node

/**
 * Lesson Audio Generation Script
 */

require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BUCKET_NAME = 'audio-assets';
const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic local voice

if (!supabaseUrl || !supabaseServiceKey || !ELEVENLABS_API_KEY) {
    console.error('❌ Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or ELEVENLABS_API_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Shared pronunciation map (identical to elevenlabs-speech.js)
// Imported from the runtime speech engine. This file used to carry a 32-entry subset of the
// map plus its own copy of the transform, so generated clips were pronounced differently --
// and far less locally -- than what users hear live from /api/text-to-speech.
const {
    PIDGIN_PRONUNCIATION_MAP: globalPronunciationMap,
    applyPronunciationCorrections,
    ELEVENLABS_SYNTHESIS
} = require('../../src/components/speech/elevenlabs-speech.js');


async function main() {
    console.log('🎙️ Lesson Audio Generation');
    console.log('========================\n');

    try {
        const { data: indexBlob } = await supabase.storage.from(BUCKET_NAME).download('index.json');
        let index = indexBlob ? JSON.parse(await indexBlob.text()) : {};

        const { data: lessons, error } = await supabase.from('lessons').select('*');
        if (error) throw error;

        console.log(`📊 Found ${lessons.length} lessons.`);

        for (const lesson of lessons) {
            // Generate for cultural note
            if (lesson.cultural_note) {
                const key = `lesson:note:${lesson.id}`;
                if (!index[key]) {
                    process.stdout.write(`🔊 Cultural Note: "${lesson.title}"... `);
                    try {
                        index[key] = await generateAndUpload(lesson.cultural_note, `lesson_note_${lesson.id}`);
                        console.log('DONE ✨');
                    } catch (err) { console.log('FAILED ❌', err.message); }
                }
            }

            // Generate for practice
            if (lesson.practice) {
                const key = `lesson:practice:${lesson.id}`;
                if (!index[key]) {
                    process.stdout.write(`🔊 Practice: "${lesson.title}"... `);
                    try {
                        index[key] = await generateAndUpload(lesson.practice, `lesson_prac_${lesson.id}`);
                        console.log('DONE ✨');
                    } catch (err) { console.log('FAILED ❌', err.message); }
                }
            }

            // Save index incrementally
            const indexStr = JSON.stringify(index, null, 2);
            await supabase.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(indexStr), {
                contentType: 'application/json',
                upsert: true
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n✨ All lessons processed!');

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
    }
}

async function generateAndUpload(text, prefix) {
    const hash = crypto.createHash('md5').update(text.trim().toLowerCase()).digest('hex');
    const filename = `${prefix}_${hash}.mp3`;
    
    const correctedText = applyPronunciationCorrections(text);
    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text: correctedText,
            model_id: ELEVENLABS_SYNTHESIS.model_id,
            voice_settings: ELEVENLABS_SYNTHESIS.voice_settings
        })
    });

    if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, buffer, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (error) throw error;
    return filename;
}

main();
