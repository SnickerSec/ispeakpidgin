// Audio Pre-generation Script
// This script can be run periodically to pre-generate audio for common phrases
// Run with: node js/audio-pregeneration.js

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Common phrases to pre-generate
const COMMON_PHRASES = [
    // Greetings
    "howzit", "aloha", "mahalo", "a hui hou", "laters",

    // Essential phrases
    "shoots", "rajah", "no worry beef curry", "broke da mouth",
    "grindz", "ono", "pau hana", "da kine", "chicken skin",

    // Common expressions
    "talk story", "stink eye", "hanabata days", "small kid time",
    "false crack", "geev um", "hele on", "kapu", "make",

    // Directions and responses
    "mauka", "makai", "try wait", "bumbye", "fo real",
    "no can", "can", "yeah no", "no yeah", "aurite"
];

async function generateAudioFile(text) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        console.error('ELEVENLABS_API_KEY not configured');
        return false;
    }

    const normalizedText = text.trim().toLowerCase();
    const filename = crypto.createHash('md5').update(normalizedText).digest('hex') + '.mp3';
    const filepath = path.join(__dirname, '..', 'audio', 'cache', filename);

    // Check if file already exists
    try {
        await fs.access(filepath);
        console.log(`✓ Already exists: ${text}`);
        return true;
    } catch {
        // File doesn't exist, generate it
    }

    const voiceId = 'f0ODjLMfcJmlKfs7dFCW'; // Hawaiian voice ID
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_flash_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            console.error(`✗ Failed to generate: ${text} (${response.status})`);
            return false;
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(filepath, audioBuffer);
        console.log(`✓ Generated: ${text} -> ${filename}`);
        return true;
    } catch (error) {
        console.error(`✗ Error generating ${text}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('Starting audio pre-generation...');
    console.log(`Generating ${COMMON_PHRASES.length} phrases`);

    let success = 0;
    let failed = 0;

    for (const phrase of COMMON_PHRASES) {
        const result = await generateAudioFile(phrase);
        if (result) {
            success++;
        } else {
            failed++;
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\nComplete! Generated: ${success}, Failed: ${failed}`);

    // Create an index file
    const indexFile = path.join(__dirname, '..', 'audio', 'cache', 'index.json');
    const index = {};

    for (const phrase of COMMON_PHRASES) {
        const normalizedText = phrase.trim().toLowerCase();
        const filename = crypto.createHash('md5').update(normalizedText).digest('hex') + '.mp3';
        index[normalizedText] = filename;
    }

    await fs.writeFile(indexFile, JSON.stringify(index, null, 2));
    console.log('Index file created');
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateAudioFile, COMMON_PHRASES };