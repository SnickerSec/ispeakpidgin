#!/usr/bin/env node

/**
 * Lesson Audio Generation & Audit Script
 * 
 * Supports:
 *   node tools/audio/generate-lessons-audio.js --audit      # Audit coverage without generating
 *   node tools/audio/generate-lessons-audio.js              # Generate & index missing lesson audio
 *   node tools/audio/generate-lessons-audio.js --force      # Force regeneration
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

async function processLessonClip(lesson, type, text, index) {
    const prefix = type === 'note' ? `lesson_note_${lesson.id}` : `lesson_prac_${lesson.id}`;
    const key = `lesson:${type}:${lesson.id}`;
    const normalized = text.trim().toLowerCase();
    const hash = crypto.createHash('md5').update(normalized).digest('hex');
    const filename = `${prefix}_${hash}.mp3`;
    const spokenText = applyPronunciationCorrections(text);

    // 1. Check translation_cache
    const { data: cacheRow } = await supabase
        .from('translation_cache')
        .select('audio_filename')
        .eq('md5_hash', hash)
        .eq('voice_id', VOICE_ID)
        .eq('direction', DIRECTION)
        .maybeSingle();

    // 2. Check storage
    const { data: bucketFiles } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { search: prefix });
    const match = bucketFiles?.find(f => f.name.includes(hash) || f.name.startsWith(prefix));
    const existsInBucket = Boolean(match);
    const existingFilename = match ? match.name : filename;

    if (IS_AUDIT) {
        const status = (existsInBucket && cacheRow) ? '🟢 OK' : (existsInBucket ? '🟡 STORAGE ONLY' : '🔴 MISSING');
        console.log(`    ${type.toUpperCase()}: ${status} (file=${existingFilename}, cached=${Boolean(cacheRow)})`);
        return { existsInBucket, inCache: Boolean(cacheRow), generated: false };
    }

    if (existsInBucket && (!cacheRow || FORCE_REGEN)) {
        process.stdout.write(`    ${type.toUpperCase()}: 🔗 Indexing existing audio... `);
        await supabase.from('translation_cache').upsert({
            original_text: text,
            translated_text: spokenText,
            direction: DIRECTION,
            voice_id: VOICE_ID,
            audio_filename: existingFilename,
            md5_hash: hash
        }, { onConflict: 'md5_hash,direction,voice_id' });
        index[key] = existingFilename;
        console.log('INDEXED ✨');
        return { existsInBucket: true, inCache: true, generated: false };
    }

    if (existsInBucket && cacheRow && !FORCE_REGEN) {
        index[key] = existingFilename;
        return { existsInBucket: true, inCache: true, generated: false };
    }

    // Generate new audio
    process.stdout.write(`    ${type.toUpperCase()}: 🔊 Generating audio... `);
    try {
        const uploadedFilename = await generateAndUpload(text, spokenText, prefix, hash);
        index[key] = uploadedFilename;
        await supabase.from('translation_cache').upsert({
            original_text: text,
            translated_text: spokenText,
            direction: DIRECTION,
            voice_id: VOICE_ID,
            audio_filename: uploadedFilename,
            md5_hash: hash
        }, { onConflict: 'md5_hash,direction,voice_id' });
        console.log('DONE ✨');
        await new Promise(resolve => setTimeout(resolve, 800));
        return { existsInBucket: true, inCache: true, generated: true };
    } catch (err) {
        console.log('FAILED ❌', err.message);
        return { existsInBucket: false, inCache: false, generated: false };
    }
}

async function main() {
    console.log(`🎙️ Lesson Audio ${IS_AUDIT ? 'Audit' : 'Generation & Cache Sync'}`);
    console.log('===================================================\n');

    try {
        const { data: indexBlob } = await supabase.storage.from(BUCKET_NAME).download('index.json');
        let index = indexBlob ? JSON.parse(await indexBlob.text()) : {};

        const { data: lessons, error } = await supabase
            .from('lessons')
            .select('*')
            .order('id');
        if (error) throw error;

        console.log(`📊 Found ${lessons.length} lessons in database.\n`);

        let totalClips = 0;
        let inBucketCount = 0;
        let inCacheCount = 0;
        let generatedCount = 0;

        for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            console.log(`  [${i + 1}/${lessons.length}] Lesson ${lesson.id}: "${lesson.title}"`);

            if (lesson.cultural_note) {
                totalClips++;
                const res = await processLessonClip(lesson, 'note', lesson.cultural_note, index);
                if (res.existsInBucket) inBucketCount++;
                if (res.inCache) inCacheCount++;
                if (res.generated) generatedCount++;
            }

            if (lesson.practice) {
                totalClips++;
                const res = await processLessonClip(lesson, 'prac', lesson.practice, index);
                if (res.existsInBucket) inBucketCount++;
                if (res.inCache) inCacheCount++;
                if (res.generated) generatedCount++;
            }
        }

        if (!IS_AUDIT) {
            const indexStr = JSON.stringify(index, null, 2);
            await supabase.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(indexStr), {
                contentType: 'application/json',
                upsert: true
            });
        }

        console.log('\n===================================================');
        console.log(`📊 Lesson Audio Summary:`);
        console.log(`   Total lesson clips:    ${totalClips}`);
        console.log(`   In Storage bucket:     ${inBucketCount}/${totalClips} (${((inBucketCount / totalClips) * 100).toFixed(1)}%)`);
        console.log(`   In translation_cache:  ${inCacheCount}/${totalClips} (${((inCacheCount / totalClips) * 100).toFixed(1)}%)`);
        if (!IS_AUDIT) {
            console.log(`   Newly generated:       ${generatedCount}`);
        }
        console.log('===================================================\n');

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    }
}

async function generateAndUpload(text, spokenText, prefix, hash) {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY required for audio generation');
    }

    const filename = `${prefix}_${hash}.mp3`;
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
