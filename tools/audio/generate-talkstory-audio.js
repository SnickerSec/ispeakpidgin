#!/usr/bin/env node

/**
 * Talk Story Multi-Voice Audio Pre-generation Script
 *
 * Pre-generates high-frequency Talk Story welcome messages, scenario prompts,
 * and conversational affirmations across all 5 Hawaiian ElevenLabs voices,
 * saving them to Supabase Storage ('audio-assets') and indexing them into 'translation_cache'.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const { applyPronunciationCorrections } = require('../../src/components/speech/elevenlabs-speech.js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'audio-assets';
const DIRECTION = 'tts';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VOICES = [
    { id: 'f0ODjLMfcJmlKfs7dFCW', name: 'Uncle Kimo', charKey: 'kimo' },
    { id: '0f4r1bLyisMv67ocsZMl', name: 'Aunty Pua', charKey: 'aunty_pua' },
    { id: 'jRIDd6YCznqwKHkWlpOh', name: 'Sister Hoku', charKey: 'hoku' },
    { id: 'Eqw4o5WB3NXnOBL9xr97', name: 'Keanu', charKey: 'keanu' },
    { id: '4P3xiZBsFtmaNelXtmvq', name: 'Cousin Kaipo', charKey: 'kaipo' }
];

// Character-specific opening greetings
const CHARACTER_WELCOMES = [
    {
        voiceId: 'f0ODjLMfcJmlKfs7dFCW',
        text: "Aloha! I stay Uncle Kimo. Like talk story? I can help you practice your Pidgin. Just type someting below or use da mic!"
    },
    {
        voiceId: '0f4r1bLyisMv67ocsZMl',
        text: "Aloha my keiki! Come inside, grab one plate lunch! Aunty Pua stay cooking choke ono grindz today. What you like talk about?"
    },
    {
        voiceId: 'jRIDd6YCznqwKHkWlpOh',
        text: "Aloha mai kākou! I stay Sister Hoku. I love sharing island culture and authentic Pidgin words. How can I kokua you today?"
    },
    {
        voiceId: 'Eqw4o5WB3NXnOBL9xr97',
        text: "Chee-hoo! Howzit brah, I stay Keanu! Da swell stay pumping out on da North Shore today! What's da scoops?"
    },
    {
        voiceId: '4P3xiZBsFtmaNelXtmvq',
        text: "Shoots! Cousin Kaipo here. Cruising through town after one long day on H-1. What stay on your mind, cuz?"
    }
];

// Scenario opening lines (shared across voices)
const SCENARIO_WELCOMES = [
    "Aloha! Like talk story? I can help you practice your Pidgin. Just type someting below or use da mic!",
    "Howzit! Welcome to Rainbow Drive-In! What can I get for you today, brah? We got loco moco, fresh poke bowl, and hot manapua!",
    "Shoots brah! Da swell stay pumping today at Bowls! Da heavies stay rolling in on da outside. How was your session?",
    "Chee-hoo! Pau hana time alreadah! Work was one humbug today. What you doing dis weekend, brah? We go holoholo!",
    "Aloha and welcome to Hawaii! Here is one fresh pikake lei fo' you! Long flight across da ocean, yeah? Where we going grind first?",
    "Hop in da truck, brah! We going holoholo today! You like head mauka towards da mountains or cruise makai along da coastline?"
];

// High-frequency island affirmations & common responses
const COMMON_PHRASES = [
    "Shoots, rajah dat!",
    "Broke da mouth, yeah?",
    "Chee-hoo, aurite!",
    "No worry, beef curry!",
    "Kay den, see you bumbye!",
    "Mahalo nui loa, take care!",
    "Stay humble, stay aloha!",
    "Howzit, how stay you today?",
    "What stay da meaning of da kine?",
    "Teach me one authentic local phrase!"
];

async function generateClip(text, voiceId) {
    const normalizedText = text.trim().toLowerCase();
    const hash = crypto.createHash('md5').update(normalizedText).digest('hex');
    const filename = `${hash}.mp3`;
    const spokenText = applyPronunciationCorrections(text);

    // 1. Check if already in translation_cache
    const { data: cached } = await supabase
        .from('translation_cache')
        .select('audio_filename')
        .eq('md5_hash', hash)
        .eq('voice_id', voiceId)
        .eq('direction', DIRECTION)
        .maybeSingle();

    if (cached && cached.audio_filename) {
        return { status: 'cached', filename: cached.audio_filename, hash };
    }

    // 2. Synthesize via ElevenLabs CLI
    const tempFile = path.join('/tmp', `tts_${voiceId}_${hash}.mp3`);
    const cmd = `ELEVENLABS_API_KEY="" /home/chuck/.cargo/bin/elevenlabs text-to-speech convert \
        --voice-id "${voiceId}" \
        --text "${spokenText.replace(/"/g, '\\"')}" \
        --model-id "eleven_flash_v2_5" \
        --format raw > "${tempFile}"`;

    execSync(cmd, { stdio: 'pipe' });
    const buffer = fs.readFileSync(tempFile);

    // 3. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, buffer, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (uploadError) throw uploadError;

    // 4. Index in translation_cache
    const { error: indexError } = await supabase
        .from('translation_cache')
        .upsert({
            original_text: text,
            translated_text: spokenText,
            direction: DIRECTION,
            voice_id: voiceId,
            audio_filename: filename,
            md5_hash: hash
        }, { onConflict: 'md5_hash,direction,voice_id' });

    if (indexError) throw indexError;

    // Cleanup temp
    try { fs.unlinkSync(tempFile); } catch (e) {}

    return { status: 'generated', filename, hash, sizeKb: Math.round(buffer.length / 1024) };
}

async function main() {
    console.log('🎙️ Talk Story Multi-Voice Audio Pregeneration');
    console.log('============================================\n');

    let totalCached = 0;
    let totalGenerated = 0;

    // 1. Pregenerate character welcomes
    console.log('🗣️ 1. Pregenerating Character Welcomes...');
    for (const item of CHARACTER_WELCOMES) {
        const voiceObj = VOICES.find(v => v.id === item.voiceId);
        process.stdout.write(`   [${voiceObj.name}] "${item.text.slice(0, 40)}..." `);
        try {
            const res = await generateClip(item.text, item.voiceId);
            if (res.status === 'cached') {
                console.log(`[CACHED ⚡]`);
                totalCached++;
            } else {
                console.log(`[GENERATED ✨ ${res.sizeKb}KB]`);
                totalGenerated++;
            }
        } catch (e) {
            console.log(`[FAILED ❌ ${e.message}]`);
        }
    }

    // 2. Pregenerate scenario welcomes & common phrases across all 5 voices
    console.log('\n🗣️ 2. Pregenerating Scenario Welcomes & Common Phrases across all 5 voices...');
    const allPhrases = [...SCENARIO_WELCOMES, ...COMMON_PHRASES];

    for (const voice of VOICES) {
        console.log(`\n🔊 Voice: ${voice.name} (${voice.id})`);
        for (let i = 0; i < allPhrases.length; i++) {
            const phrase = allPhrases[i];
            process.stdout.write(`   [${i + 1}/${allPhrases.length}] "${phrase.slice(0, 35)}..." `);
            try {
                const res = await generateClip(phrase, voice.id);
                if (res.status === 'cached') {
                    console.log(`[CACHED ⚡]`);
                    totalCached++;
                } else {
                    console.log(`[GENERATED ✨ ${res.sizeKb}KB]`);
                    totalGenerated++;
                }
            } catch (e) {
                console.log(`[FAILED ❌ ${e.message}]`);
            }
        }
    }

    console.log('\n============================================');
    console.log(`🎉 Pregeneration complete!`);
    console.log(`   Generated: ${totalGenerated}`);
    console.log(`   Cached:    ${totalCached}`);
    console.log(`   Total:     ${totalGenerated + totalCached}`);
    console.log('============================================\n');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
