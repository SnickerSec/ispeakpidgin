#!/usr/bin/env node

/**
 * Story Audio Generation & Audit Script
 * Voicing the "Talk Story" stories section using ElevenLabs
 * 
 * Supports:
 *   node tools/audio/generate-stories-audio.js --audit      # Audit coverage without generating
 *   node tools/audio/generate-stories-audio.js              # Generate & index missing story audio
 *   node tools/audio/generate-stories-audio.js --force      # Force regeneration
 */

require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BUCKET_NAME = 'audio-assets';
const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic local voice (Kimo)
const DIRECTION = 'tts';

const args = process.argv.slice(2);
const IS_AUDIT = args.includes('--audit') || args.includes('--dry-run');
const FORCE_REGEN = args.includes('--force');

if (!supabaseUrl || (!supabaseServiceKey && !IS_AUDIT)) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.SUPABASE_ANON_KEY);

const {
    applyPronunciationCorrections,
    ELEVENLABS_SYNTHESIS
} = require('../../src/components/speech/elevenlabs-speech.js');

async function main() {
    console.log(`🎙️ Story Audio ${IS_AUDIT ? 'Audit' : 'Generation & Cache Sync'}`);
    console.log('===================================================\n');

    try {
        // 1. Load index from Supabase
        const { data: indexBlob } = await supabase.storage.from(BUCKET_NAME).download('index.json');
        let index = indexBlob ? JSON.parse(await indexBlob.text()) : {};

        // 2. Fetch all stories
        const { data: stories, error } = await supabase
            .from('stories')
            .select('id, title, pidgin_text, audio_example')
            .order('title');
        if (error) throw error;

        console.log(`📊 Found ${stories.length} stories in database.\n`);

        let inBucketCount = 0;
        let inCacheCount = 0;
        let generatedCount = 0;
        let missingCount = 0;

        for (let i = 0; i < stories.length; i++) {
            const story = stories[i];
            const normalized = story.pidgin_text.trim().toLowerCase();
            const hash = crypto.createHash('md5').update(normalized).digest('hex');
            const expectedFilename = `story_${hash}.mp3`;
            const spokenText = applyPronunciationCorrections(story.pidgin_text);

            // Check translation_cache
            const { data: cacheRow } = await supabase
                .from('translation_cache')
                .select('audio_filename')
                .eq('md5_hash', hash)
                .eq('voice_id', VOICE_ID)
                .eq('direction', DIRECTION)
                .maybeSingle();

            // Check bucket existence
            const filename = story.audio_example || cacheRow?.audio_filename || expectedFilename;
            const { data: bucketFiles } = await supabase.storage
                .from(BUCKET_NAME)
                .list('', { search: filename });
            const existsInBucket = bucketFiles && bucketFiles.length > 0;

            if (existsInBucket) inBucketCount++;
            if (cacheRow) inCacheCount++;

            if (IS_AUDIT) {
                const status = (existsInBucket && cacheRow) ? '🟢 OK' : (existsInBucket ? '🟡 STORAGE ONLY' : '🔴 MISSING');
                console.log(`  [${i + 1}/${stories.length}] ${status} "${story.title}" (file=${filename}, cached=${Boolean(cacheRow)})`);
                if (!existsInBucket) missingCount++;
                continue;
            }

            // If audio exists in bucket but not in cache, index it immediately
            if (existsInBucket && (!cacheRow || FORCE_REGEN)) {
                process.stdout.write(`  [${i + 1}/${stories.length}] 🔗 Indexing existing audio for "${story.title}"... `);
                await supabase.from('translation_cache').upsert({
                    original_text: story.pidgin_text,
                    translated_text: spokenText,
                    direction: DIRECTION,
                    voice_id: VOICE_ID,
                    audio_filename: filename,
                    md5_hash: hash
                }, { onConflict: 'md5_hash,direction,voice_id' });

                if (story.audio_example !== filename) {
                    await supabase.from('stories').update({ audio_example: filename }).eq('id', story.id);
                }

                index[`story:${story.id}`] = filename;
                console.log('INDEXED ✨');
                continue;
            }

            if (existsInBucket && cacheRow && !FORCE_REGEN) {
                console.log(`  [${i + 1}/${stories.length}] ⏭️  Skipping "${story.title}" (Already cached & indexed)`);
                continue;
            }

            // Generate audio if missing
            process.stdout.write(`  [${i + 1}/${stories.length}] 🔊 Generating audio for: "${story.title}"... `);
            try {
                const newFilename = await generateAndUpload(story.pidgin_text, spokenText, hash);
                index[`story:${story.id}`] = newFilename;

                await supabase.from('stories').update({ audio_example: newFilename }).eq('id', story.id);
                await supabase.from('translation_cache').upsert({
                    original_text: story.pidgin_text,
                    translated_text: spokenText,
                    direction: DIRECTION,
                    voice_id: VOICE_ID,
                    audio_filename: newFilename,
                    md5_hash: hash
                }, { onConflict: 'md5_hash,direction,voice_id' });

                generatedCount++;
                console.log('DONE ✨');
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.log('FAILED ❌', err.message);
            }
        }

        // Save index
        if (!IS_AUDIT) {
            const indexStr = JSON.stringify(index, null, 2);
            await supabase.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(indexStr), {
                contentType: 'application/json',
                upsert: true
            });
        }

        console.log('\n===================================================');
        console.log(`📊 Story Audio Summary:`);
        console.log(`   Total stories:         ${stories.length}`);
        console.log(`   In Storage bucket:     ${inBucketCount}/${stories.length} (${((inBucketCount / stories.length) * 100).toFixed(1)}%)`);
        console.log(`   In translation_cache:  ${inCacheCount}/${stories.length} (${((inCacheCount / stories.length) * 100).toFixed(1)}%)`);
        if (!IS_AUDIT) {
            console.log(`   Newly generated:       ${generatedCount}`);
        } else {
            console.log(`   Missing from storage:  ${missingCount}`);
        }
        console.log('===================================================\n');

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    }
}

async function generateAndUpload(text, spokenText, hash) {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY required for audio generation');
    }

    const filename = `story_${hash}.mp3`;
    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text: spokenText,
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
