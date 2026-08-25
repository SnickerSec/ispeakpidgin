#!/usr/bin/env node

/**
 * ElevenLabs Voice Audition Tool
 *
 * Synthesizes a standardized Hawaiian Pidgin phonetic benchmark battery
 * across multiple ElevenLabs voices to evaluate authenticity, vowel elongation,
 * and cadence.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { applyPronunciationCorrections } = require('../../src/components/speech/elevenlabs-speech.js');

const VOICES = [
    { id: 'f0ODjLMfcJmlKfs7dFCW', name: 'Uncle Kimo (Mikey)', role: 'Elder Storyteller', gender: 'Male' },
    { id: '0f4r1bLyisMv67ocsZMl', name: 'Aunty Pua (Cristina G.)', role: 'Drive-In Matriarch', gender: 'Female' },
    { id: 'jRIDd6YCznqwKHkWlpOh', name: 'Sister Hoku (Hoku)', role: 'Local Tutor', gender: 'Female' },
    { id: 'Eqw4o5WB3NXnOBL9xr97', name: 'Keanu (Brandon)', role: 'North Shore Surf Brah', gender: 'Male' },
    { id: '4P3xiZBsFtmaNelXtmvq', name: 'Cousin Kaipo (Noah)', role: 'Island Commuter', gender: 'Male' }
];

const TEST_PHRASES = [
    {
        label: 'Greeting & Food',
        raw: 'Howzit brah! Come inside, Aunty stay cooking choke ono grindz, loco moco and hot malasadas.'
    },
    {
        label: 'Surf & Excitement',
        raw: 'Chee-hoo! Waves stay pumping at Pipeline today! No drop in on Unko, brah.'
    },
    {
        label: 'Cultural & Directional',
        raw: 'We gotta malama da ʻāina and respect our kupuna. Drive mauka past da church.'
    },
    {
        label: 'Everyday Slang',
        raw: 'Broke da mouth, yeah? After pau hana, we go holoholo town-bound on H-1.'
    }
];

async function main() {
    console.log('🎙️ ElevenLabs Hawaiian Voice Audition');
    console.log('====================================\n');

    const outputDir = path.join(__dirname, '../../public/audio/audition');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = [];

    for (const voice of VOICES) {
        console.log(`\n🔊 Auditioning: ${voice.name} (${voice.id})...`);
        const voiceDir = path.join(outputDir, voice.id);
        if (!fs.existsSync(voiceDir)) {
            fs.mkdirSync(voiceDir, { recursive: true });
        }

        const voiceResults = {
            voice,
            samples: []
        };

        for (let i = 0; i < TEST_PHRASES.length; i++) {
            const test = TEST_PHRASES[i];
            const spokenText = applyPronunciationCorrections(test.raw);
            const fileName = `sample_${i + 1}.mp3`;
            const filePath = path.join(voiceDir, fileName);

            console.log(`   [${i + 1}/${TEST_PHRASES.length}] "${test.label}"...`);
            
            try {
                const cmd = `ELEVENLABS_API_KEY="" /home/chuck/.cargo/bin/elevenlabs text-to-speech convert \
                    --voice-id "${voice.id}" \
                    --text "${spokenText.replace(/"/g, '\\"')}" \
                    --model-id "eleven_flash_v2_5" \
                    --format raw > "${filePath}"`;

                execSync(cmd, { stdio: 'pipe' });
                const stats = fs.statSync(filePath);
                
                voiceResults.samples.push({
                    label: test.label,
                    rawText: test.raw,
                    spokenText: spokenText,
                    fileSize: `${Math.round(stats.size / 1024)} KB`,
                    relPath: `/audio/audition/${voice.id}/${fileName}`,
                    absPath: filePath
                });
                console.log(`      ✓ Generated (${Math.round(stats.size / 1024)} KB)`);
            } catch (err) {
                console.error(`      ❌ Generation error:`, err.message);
            }
        }

        report.push(voiceResults);
    }

    // Write JSON report
    const reportPath = path.join(outputDir, 'audition-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n🎉 Audition audio generation complete!`);
    console.log(`📂 Audio files saved to: ${outputDir}`);
    console.log(`📋 Report saved to: ${reportPath}\n`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
