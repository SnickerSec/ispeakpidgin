#!/usr/bin/env node

/**
 * Lesson Audio Generation & Audit Script
 *
 * Covers all 4 playable clip types on /learning-hub.html:
 *   - lessons.cultural_note
 *   - lessons.practice
 *   - lesson_vocabulary.pidgin
 *   - lesson_vocabulary.example
 *
 * Supports:
 *   node tools/audio/generate-lessons-audio.js --audit      # Audit coverage without generating
 *   node tools/audio/generate-lessons-audio.js              # Generate & index missing lesson audio
 *   node tools/audio/generate-lessons-audio.js --force      # Force regeneration
 */

require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { ELEVENLABS_BASE_URL } = require('../../services/ai-upstreams');
const { fetchAllRows } = require('../../services/fetch-all-rows');
const { loadPronunciationGuides } = require('../../services/pronunciation');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BUCKET_NAME = 'audio-assets';
const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Authentic local voice (Uncle Kimo)
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

async function loadCacheMap() {
    const rows = await fetchAllRows(
        supabase,
        'translation_cache',
        'md5_hash, audio_filename',
        { filter: q => q.eq('voice_id', VOICE_ID).eq('direction', DIRECTION) }
    );
    const map = new Map();
    for (const r of rows) {
        if (r.md5_hash && r.audio_filename) {
            map.set(r.md5_hash.toLowerCase(), r.audio_filename);
        }
    }
    return map;
}

function prefixForType(lessonId, type) {
    switch (type) {
        case 'note': return `lesson_note_${lessonId}`;
        case 'prac': return `lesson_prac_${lessonId}`;
        case 'vocab': return `lesson_vocab_${lessonId}`;
        case 'ex': return `lesson_ex_${lessonId}`;
        default: return `lesson_${type}_${lessonId}`;
    }
}

async function processLessonClip(lesson, type, text, cacheMap, verbose = true) {
    const prefix = prefixForType(lesson.id, type);
    const normalized = text.trim().toLowerCase();
    const hash = crypto.createHash('md5').update(normalized).digest('hex');
    const filename = `${prefix}_${hash}.mp3`;
    const spokenText = applyPronunciationCorrections(text);

    // 1. Check preloaded translation_cache map (ensuring embedded hash matches if lesson/story prefixed)
    let cachedFilename = cacheMap.get(hash) || null;
    if (cachedFilename) {
        const lessonStoryHash = cachedFilename.match(/^(?:lesson|story)_[a-z]+_\d+_([a-f0-9]{32})\.mp3$/i);
        if (lessonStoryHash && lessonStoryHash[1].toLowerCase() !== hash) {
            // Corrupted cross-wired row (e.g. prefix collision without delimiter)
            cachedFilename = null;
        }
    }

    if (cachedFilename && !FORCE_REGEN) {
        if (IS_AUDIT && verbose) {
            console.log(`    ${type.toUpperCase()}: 🟢 OK (file=${cachedFilename}, cached=true)`);
        }
        return { existsInBucket: true, inCache: true, generated: false };
    }

    // 2. Check storage strictly by content hash (never prefix-without-delimiter, which cross-wired lesson 3 -> 37)
    const { data: bucketFiles } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { search: hash });
    const match = bucketFiles?.find(f =>
        f.name === filename ||
        f.name === `${hash}.mp3` ||
        f.name === `cached_${VOICE_ID}_${hash}.mp3` ||
        f.name.endsWith(`_${hash}.mp3`)
    );
    const existsInBucket = Boolean(match);
    const existingFilename = match ? match.name : filename;

    if (IS_AUDIT) {
        if (verbose) {
            const status = existsInBucket ? '🟡 STORAGE ONLY' : '🔴 MISSING';
            console.log(`    ${type.toUpperCase()}: ${status} (file=${existingFilename}, cached=false)`);
        }
        return { existsInBucket, inCache: false, generated: false };
    }

    if (existsInBucket && !FORCE_REGEN) {
        process.stdout.write(`    ${type.toUpperCase()} ("${text.slice(0, 40)}"): 🔗 Indexing existing audio... `);
        await supabase.from('translation_cache').upsert({
            original_text: text,
            translated_text: spokenText,
            direction: DIRECTION,
            voice_id: VOICE_ID,
            audio_filename: existingFilename,
            md5_hash: hash
        }, { onConflict: 'md5_hash,direction,voice_id' });
        cacheMap.set(hash, existingFilename);
        console.log('INDEXED ✨');
        return { existsInBucket: true, inCache: true, generated: false };
    }

    // Generate new audio
    process.stdout.write(`    ${type.toUpperCase()} ("${text.slice(0, 40)}"): 🔊 Generating audio... `);
    try {
        const uploadedFilename = await generateAndUpload(spokenText, prefix, hash);
        await supabase.from('translation_cache').upsert({
            original_text: text,
            translated_text: spokenText,
            direction: DIRECTION,
            voice_id: VOICE_ID,
            audio_filename: uploadedFilename,
            md5_hash: hash
        }, { onConflict: 'md5_hash,direction,voice_id' });
        cacheMap.set(hash, uploadedFilename);
        console.log('DONE ✨');
        await new Promise(resolve => setTimeout(resolve, 650));
        return { existsInBucket: true, inCache: true, generated: true };
    } catch (err) {
        console.log('FAILED ❌', err.message);
        return { existsInBucket: false, inCache: false, generated: false };
    }
}

async function main() {
    console.log(`🎙️ Lesson Audio ${IS_AUDIT ? 'Audit' : 'Generation & Cache Sync'}`);
    console.log('===================================================\n');
    await loadPronunciationGuides(supabase, { required: true });

    try {
        const cacheMap = await loadCacheMap();
        const { data: lessons, error } = await supabase
            .from('lessons')
            .select('*, lesson_vocabulary(id, pidgin, example, sort_order)')
            .order('id');
        if (error) throw error;

        console.log(`📊 Found ${lessons.length} lessons in database.\n`);

        const stats = {
            notesAndPractice: { total: 0, cached: 0 },
            vocabWords: { total: 0, cached: 0 },
            vocabExamples: { total: 0, cached: 0 },
            generated: 0
        };

        for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            console.log(`  [${i + 1}/${lessons.length}] Lesson ${lesson.id}: "${lesson.title}"`);

            if (lesson.cultural_note) {
                stats.notesAndPractice.total++;
                const res = await processLessonClip(lesson, 'note', lesson.cultural_note, cacheMap, true);
                if (res.inCache) stats.notesAndPractice.cached++;
                if (res.generated) stats.generated++;
            }

            if (lesson.practice) {
                stats.notesAndPractice.total++;
                const res = await processLessonClip(lesson, 'prac', lesson.practice, cacheMap, true);
                if (res.inCache) stats.notesAndPractice.cached++;
                if (res.generated) stats.generated++;
            }

            const vocab = (lesson.lesson_vocabulary || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            let vocabCachedForLesson = 0;
            let exCachedForLesson = 0;
            let exTotalForLesson = 0;

            for (const v of vocab) {
                if (v.pidgin && v.pidgin.trim()) {
                    stats.vocabWords.total++;
                    const res = await processLessonClip(lesson, 'vocab', v.pidgin, cacheMap, false);
                    if (res.inCache) {
                        stats.vocabWords.cached++;
                        vocabCachedForLesson++;
                    }
                    if (res.generated) stats.generated++;
                }
                if (v.example && v.example.trim()) {
                    stats.vocabExamples.total++;
                    exTotalForLesson++;
                    const res = await processLessonClip(lesson, 'ex', v.example, cacheMap, false);
                    if (res.inCache) {
                        stats.vocabExamples.cached++;
                        exCachedForLesson++;
                    }
                    if (res.generated) stats.generated++;
                }
            }

            if (IS_AUDIT) {
                const vStatus = vocabCachedForLesson === vocab.length ? '🟢' : '🔴';
                const eStatus = exCachedForLesson === exTotalForLesson ? '🟢' : '🔴';
                console.log(`    VOCAB: ${vStatus} ${vocabCachedForLesson}/${vocab.length} | EXAMPLES: ${eStatus} ${exCachedForLesson}/${exTotalForLesson}`);
            }
        }

        const totalClips = stats.notesAndPractice.total + stats.vocabWords.total + stats.vocabExamples.total;
        const inCacheCount = stats.notesAndPractice.cached + stats.vocabWords.cached + stats.vocabExamples.cached;

        console.log('\n===================================================');
        console.log('📊 Lesson Audio Summary:');
        console.log(`   Notes & Practice:      ${stats.notesAndPractice.cached}/${stats.notesAndPractice.total}`);
        console.log(`   Vocabulary words:      ${stats.vocabWords.cached}/${stats.vocabWords.total}`);
        console.log(`   Vocabulary examples:   ${stats.vocabExamples.cached}/${stats.vocabExamples.total}`);
        console.log(`   Total in cache:        ${inCacheCount}/${totalClips} (${((inCacheCount / totalClips) * 100).toFixed(1)}%)`);
        if (!IS_AUDIT) {
            console.log(`   Newly generated:       ${stats.generated}`);
        }
        console.log('===================================================\n');
    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    }
}

async function generateAndUpload(spokenText, prefix, hash) {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY required for audio generation');
    }

    const filename = `${prefix}_${hash}.mp3`;
    const apiUrl = `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${VOICE_ID}`;

    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
        response = await fetch(apiUrl, {
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
        if (response.ok) break;
        if ((response.status === 429 || response.status >= 500) && attempt < 3) {
            await new Promise(r => setTimeout(r, 1500 * attempt));
            continue;
        }
        throw new Error(`ElevenLabs error: ${response.status}`);
    }
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
