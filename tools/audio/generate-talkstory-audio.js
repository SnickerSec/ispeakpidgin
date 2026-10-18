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
const { createClient } = require('@supabase/supabase-js');
const { applyPronunciationCorrections, ELEVENLABS_SYNTHESIS } = require('../../src/components/speech/elevenlabs-speech.js');

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

// CLI options
const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes('--dry-run') || args.includes('--audit');
const VOICE_FILTER = args.find(a => a.startsWith('--voices='))?.split('=')[1]?.split(',')
    || (args.indexOf('--voices') !== -1 ? args[args.indexOf('--voices') + 1]?.split(',') : null);

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
    "Hop in da truck, brah! We going holoholo today! You like head mauka towards da mountains or cruise makai along da coastline?",
    "E komo mai! Grab one stool and tune up your ukulele! We get da pupus on da table and uncle tuning his slack key. What song you like play, cuz?",
    "Howzit! Saturday morning at da farmers market is da best! Da papaya and sweet mango stay ripe, and unko get fresh poi and apple bananas. What you looking for today?",
    "Howzit! Welcome to da poke counter! We just got fresh local ahi straight from Honolulu fish auction. What kind poke you like today? Shoyu ahi, spicy mayo, or Hawaiian style with limu kohu?"
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
    "Teach me one authentic local phrase!",
    "Can I get one loco moco with two eggs sunny side up?",
    "Pau hana! Grab one cold drink, brah.",
    "No worry, beef curry, we talk story all night.",
    "Mahalo for da beautiful lei, brah!",
    "We go check out North Shore surf spots!",
    "Which poke you recommend that stay super fresh today?"
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

    if (IS_DRY_RUN) {
        return { status: 'missing-dry-run', filename, hash };
    }

    // 2. Synthesize via ElevenLabs API
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY');

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const response = await fetch(url, {
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
        throw new Error(`ElevenLabs API error (${response.status}): ${await response.text()}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

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

    return { status: 'generated', filename, hash, sizeKb: Math.round(buffer.length / 1024) };
}

async function main() {
    console.log('🎙️ Talk Story Multi-Voice Audio Pregeneration');
    console.log('============================================\n');

    let totalCached = 0;
    let totalGenerated = 0;

    const activeVoices = VOICE_FILTER
        ? VOICES.filter(v => VOICE_FILTER.includes(v.charKey) || VOICE_FILTER.includes(v.id) || VOICE_FILTER.some(f => v.name.toLowerCase().includes(f.toLowerCase())))
        : VOICES;

    // 1. Pregenerate character welcomes
    console.log('🗣️ 1. Pregenerating Character Welcomes...');
    const activeWelcomes = CHARACTER_WELCOMES.filter(item => activeVoices.some(v => v.id === item.voiceId));
    for (const item of activeWelcomes) {
        const voiceObj = VOICES.find(v => v.id === item.voiceId);
        process.stdout.write(`   [${voiceObj.name}] "${item.text.slice(0, 40)}..." `);
        try {
            const res = await generateClip(item.text, item.voiceId);
            if (res.status === 'cached') {
                console.log(`[CACHED ⚡]`);
                totalCached++;
            } else if (res.status === 'missing-dry-run') {
                console.log(`[MISSING (dry-run) 🔍]`);
            } else {
                console.log(`[GENERATED ✨ ${res.sizeKb}KB]`);
                totalGenerated++;
            }
        } catch (e) {
            console.log(`[FAILED ❌ ${e.message}]`);
        }
    }

    // 2. Pregenerate scenario welcomes & common phrases across active voices
    console.log(`\n🗣️ 2. Pregenerating Scenario Welcomes & Common Phrases across ${activeVoices.length} voice(s)...`);
    const allPhrases = [...SCENARIO_WELCOMES, ...COMMON_PHRASES];

    for (const voice of activeVoices) {
        console.log(`\n🔊 Voice: ${voice.name} (${voice.id})`);
        for (let i = 0; i < allPhrases.length; i++) {
            const phrase = allPhrases[i];
            process.stdout.write(`   [${i + 1}/${allPhrases.length}] "${phrase.slice(0, 35)}..." `);
            try {
                const res = await generateClip(phrase, voice.id);
                if (res.status === 'cached') {
                    console.log(`[CACHED ⚡]`);
                    totalCached++;
                } else if (res.status === 'missing-dry-run') {
                    console.log(`[MISSING (dry-run) 🔍]`);
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
