#!/usr/bin/env node

/**
 * generate-wordle-audio.js
 *
 * Pre-generates authentic Uncle Kimo audio clips for all 5-letter Pidgin & slang
 * terms in wordle_words that lack a cached clip in translation_cache.
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { ELEVENLABS_BASE_URL } = require('../../services/ai-upstreams');
const { loadPronunciationGuides } = require('../../services/pronunciation');
const {
  applyPronunciationCorrections,
  ELEVENLABS_SYNTHESIS
} = require('../../src/components/speech/elevenlabs-speech.js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BUCKET_NAME = 'audio-assets';
const VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW'; // Uncle Kimo
const DIRECTION = 'tts';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ELEVENLABS_API_KEY) {
  console.error('❌ Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or ELEVENLABS_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🎙️ Wordle Slang Audio Pre-generation');
  console.log('====================================\n');

  await loadPronunciationGuides(supabase, { required: true });

  // 1. Fetch wordle words with meanings
  const { data: words, error } = await supabase
    .from('wordle_words')
    .select('id, word, meaning, pronunciation')
    .not('meaning', 'is', null);

  if (error) throw error;
  console.log(`📊 Found ${words.length} wordle words with definitions.`);

  // 2. Determine which ones are missing from translation_cache
  const hashes = words.map(w => crypto.createHash('md5').update(w.word.toLowerCase()).digest('hex'));
  const { data: cachedRows } = await supabase
    .from('translation_cache')
    .select('md5_hash')
    .eq('voice_id', VOICE_ID)
    .eq('direction', DIRECTION)
    .in('md5_hash', hashes);

  const cachedSet = new Set((cachedRows || []).map(r => r.md5_hash));
  const missing = words.filter(w => !cachedSet.has(crypto.createHash('md5').update(w.word.toLowerCase()).digest('hex')));

  console.log(`🔍 Missing from cache: ${missing.length} / ${words.length}\n`);

  if (missing.length === 0) {
    console.log('🎉 All Wordle words are already cached with Uncle Kimo audio!');
    return;
  }

  let generated = 0;
  for (let i = 0; i < missing.length; i++) {
    const item = missing[i];
    const text = item.word.toLowerCase();
    const spokenText = applyPronunciationCorrections(text);
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const filename = `${hash}.mp3`;

    process.stdout.write(`  [${i + 1}/${missing.length}] "${item.word}" → "${spokenText}"... `);

    try {
      const url = `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${VOICE_ID}`;
      const response = await fetch(url, {
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

      if (!response.ok) {
        console.log(`FAILED (${response.status}) ❌`);
        continue;
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) {
        console.log(`UPLOAD ERROR: ${uploadError.message} ❌`);
        continue;
      }

      // Upsert into translation_cache
      const { error: cacheError } = await supabase.from('translation_cache').upsert({
        original_text: text,
        translated_text: spokenText,
        direction: DIRECTION,
        voice_id: VOICE_ID,
        audio_filename: filename,
        md5_hash: hash
      }, { onConflict: 'md5_hash,direction,voice_id' });

      if (cacheError) {
        console.log(`CACHE ERROR: ${cacheError.message} ❌`);
        continue;
      }

      console.log('DONE ✨');
      generated++;
      await new Promise(r => setTimeout(r, 250)); // Gentle rate pace
    } catch (err) {
      console.log(`ERROR: ${err.message} ❌`);
    }
  }

  console.log(`\n====================================`);
  console.log(`🎉 Audio pre-generation complete! Generated ${generated} clips.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
