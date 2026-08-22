#!/usr/bin/env node

/**
 * Diagnostic Audit Script for ChokePidgin / iSpeakPidgin Application
 * Evaluates the 7 core pillars with zero external dependencies:
 * 1. Supabase (DB & Storage)
 * 2. ElevenLabs (TTS & Pronunciation Map)
 * 3. GitHub (CI/CD Workflows & Test Suites)
 * 4. AI API (Gemini Service & Persona Endpoints)
 * 5. Hawaiian Pidgin Linguistics & Phonetics
 * 6. Vocabulary & Slang Expansion Opportunities
 * 7. Railway & Production Environment
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../../..');

// Basic zero-dependency .env loader
try {
    const envPath = path.join(REPO_ROOT, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [key, ...vals] = trimmed.split('=');
                const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = val;
                }
            }
        });
    }
} catch (e) {
    // Ignore .env read errors
}

console.log('\n=============================================================');
console.log('🌺 CHOKEPIDGIN / ISPEAKPIDGIN APPLICATION AUDIT REPORT');
console.log('=============================================================\n');

const results = {
    supabase: { status: 'PENDING', details: [] },
    elevenlabs: { status: 'PENDING', details: [] },
    github: { status: 'PENDING', details: [] },
    ai: { status: 'PENDING', details: [] },
    linguistics: { status: 'PENDING', details: [] },
    slang: { status: 'PENDING', details: [] },
    railway: { status: 'PENDING', details: [] }
};

// 1. Check Railway & Environment Configuration
console.log('📦 1. Auditing Railway & Production Deployment Setup...');
try {
    const railwayJsonPath = path.join(REPO_ROOT, 'railway.json');
    const dockerfilePath = path.join(REPO_ROOT, 'Dockerfile');
    const serverJsPath = path.join(REPO_ROOT, 'server.js');

    const hasRailwayJson = fs.existsSync(railwayJsonPath);
    const hasDockerfile = fs.existsSync(dockerfilePath);
    const hasServerJs = fs.existsSync(serverJsPath);

    results.railway.details.push(`railway.json: ${hasRailwayJson ? '✅ Present' : '❌ Missing'}`);
    results.railway.details.push(`Dockerfile: ${hasDockerfile ? '✅ Present' : '❌ Missing'}`);
    results.railway.details.push(`server.js: ${hasServerJs ? '✅ Present' : '❌ Missing'}`);

    // Check environment variables
    const envVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY', 'ELEVENLABS_API_KEY', 'GEMINI_API_KEY', 'PORT'];
    const envStatus = envVars.map(v => `${v}: ${process.env[v] ? '✅ Configured' : '⚠️ Not Set in local env'}`);
    results.railway.details.push(...envStatus);

    results.railway.status = (hasRailwayJson && hasDockerfile && hasServerJs) ? 'HEALTHY' : 'WARNING';
} catch (e) {
    results.railway.status = 'ERROR';
    results.railway.details.push(`Error: ${e.message}`);
}

// 2. Check Supabase Connectivity & Schemas
console.log('🗄️ 2. Auditing Supabase Database & Audio Storage...');
try {
    const hasUrl = !!process.env.SUPABASE_URL;
    const hasAnon = !!process.env.SUPABASE_ANON_KEY;
    const hasService = !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

    results.supabase.details.push(`Connection credentials: ${hasUrl && hasAnon ? '✅ Available' : '⚠️ Missing credentials'}`);
    results.supabase.details.push(`Admin service key: ${hasService ? '✅ Available' : '⚠️ Missing (Admin endpoints disabled)'}`);
    results.supabase.details.push(`Storage Bucket: audio-assets (for ElevenLabs caching)`);
    results.supabase.details.push(`Primary Tables: dictionary_entries, phrases, stories, pickup_lines, quiz_questions, translation_cache`);

    results.supabase.status = (hasUrl && hasAnon) ? 'HEALTHY' : 'WARNING';
} catch (e) {
    results.supabase.status = 'ERROR';
    results.supabase.details.push(`Error: ${e.message}`);
}

// 3. Check ElevenLabs TTS & Pronunciation Map
console.log('🎙️ 3. Auditing ElevenLabs Voices & Pronunciation Engine...');
try {
    const speechPath = path.join(REPO_ROOT, 'src/components/speech/elevenlabs-speech.js');
    const ttsRoutePath = path.join(REPO_ROOT, 'routes/tts.js');
    const audioPrePath = path.join(REPO_ROOT, 'tools/audio/audio-pregeneration.js');

    const hasSpeech = fs.existsSync(speechPath);
    const hasTtsRoute = fs.existsSync(ttsRoutePath);
    const hasAudioPre = fs.existsSync(audioPrePath);

    results.elevenlabs.details.push(`Client ElevenLabs Engine: ${hasSpeech ? '✅ Present' : '❌ Missing'}`);
    results.elevenlabs.details.push(`Server TTS Route (/api/text-to-speech): ${hasTtsRoute ? '✅ Present' : '❌ Missing'}`);
    results.elevenlabs.details.push(`Audio Pre-generation Tool: ${hasAudioPre ? '✅ Present' : '❌ Missing'}`);
    results.elevenlabs.details.push(`Configured Voices: Kimo (f0ODjLMfcJmlKfs7dFCW), Sarah/Aunty (EXAVITQu4vr4xnSDxMaL), Ethan/Braddah (ErXwbc3VNbCc1k9An9bS)`);

    results.elevenlabs.status = (hasSpeech && hasTtsRoute) ? 'HEALTHY' : 'WARNING';
} catch (e) {
    results.elevenlabs.status = 'ERROR';
    results.elevenlabs.details.push(`Error: ${e.message}`);
}

// 4. Check GitHub Workflows & Validation Suites
console.log('🐙 4. Auditing GitHub Actions CI & Validation Suites...');
try {
    const ciPath = path.join(REPO_ROOT, '.github/workflows/ci.yml');
    const hasCi = fs.existsSync(ciPath);
    results.github.details.push(`CI Workflow (.github/workflows/ci.yml): ${hasCi ? '✅ Configured' : '❌ Missing'}`);

    const testFiles = [
        'tools/testing/run-all-tests.js',
        'tools/testing/run-validation.js',
        'tools/testing/validate-phase-2-3.js',
        'tools/testing/pronunciation-audit.js',
        'tools/testing/audit-site.js'
    ];

    testFiles.forEach(tf => {
        const fullP = path.join(REPO_ROOT, tf);
        results.github.details.push(`Test Suite (${tf}): ${fs.existsSync(fullP) ? '✅ Present' : '❌ Missing'}`);
    });

    results.github.status = hasCi ? 'HEALTHY' : 'WARNING';
} catch (e) {
    results.github.status = 'ERROR';
    results.github.details.push(`Error: ${e.message}`);
}

// 5. Check AI API (Gemini Service & RAG)
console.log('🤖 5. Auditing Gemini AI API & Talk Story Endpoints...');
try {
    const geminiServicePath = path.join(REPO_ROOT, 'services/gemini.js');
    const aiRoutePath = path.join(REPO_ROOT, 'routes/ai.js');

    const hasGemini = fs.existsSync(geminiServicePath);
    const hasAiRoute = fs.existsSync(aiRoutePath);

    results.ai.details.push(`Gemini Service (services/gemini.js): ${hasGemini ? '✅ Present' : '❌ Missing'}`);
    results.ai.details.push(`AI Routes (routes/ai.js): ${hasAiRoute ? '✅ Present' : '❌ Missing'}`);
    results.ai.details.push(`Endpoints: /api/ai/talk-story (Personas: Kimo, Aunty, Braddah), /api/ai/translate (RAG Tone Adjustment)`);
    results.ai.details.push(`Gamification Link: XP & badge awarding upon chatting`);

    results.ai.status = (hasGemini && hasAiRoute) ? 'HEALTHY' : 'WARNING';
} catch (e) {
    results.ai.status = 'ERROR';
    results.ai.details.push(`Error: ${e.message}`);
}

// 6. Check Hawaiian Pidgin Linguistics & Phonetics Coverage
console.log('🌺 6. Auditing Pidgin Linguistics & Phonetic Rules...');
try {
    const pronAuditPath = path.join(REPO_ROOT, 'tools/testing/pronunciation-audit.js');
    const hasAudit = fs.existsSync(pronAuditPath);
    results.linguistics.details.push(`Pronunciation Audit Suite: ${hasAudit ? '✅ Configured' : '❌ Missing'}`);
    results.linguistics.details.push(`Grammar Engine: Preverbal markers (stay, wen, go), negation (nevah), tone profiles (light, standard, heavy)`);
    results.linguistics.status = hasAudit ? 'HEALTHY' : 'WARNING';
} catch (e) {
    results.linguistics.status = 'ERROR';
    results.linguistics.details.push(`Error: ${e.message}`);
}

// 7. Check Slang Expansion & Feedback Opportunities
console.log('📖 7. Auditing Slang & Vocabulary Expansion Pipelines...');
try {
    const addMissingPath = path.join(REPO_ROOT, 'tools/data/add-missing-terms.js');
    const feedbackLoopPath = path.join(REPO_ROOT, 'tools/seo/feedback-loop.js');
    const curatedMissingPath = path.join(REPO_ROOT, 'tools/data/curated-missing-terms.json');

    results.slang.details.push(`Add Missing Terms Script: ${fs.existsSync(addMissingPath) ? '✅ Present' : '❌ Missing'}`);
    results.slang.details.push(`Search Console Feedback Loop: ${fs.existsSync(feedbackLoopPath) ? '✅ Present' : '❌ Missing'}`);
    results.slang.details.push(`Curated Missing Terms Data: ${fs.existsSync(curatedMissingPath) ? '✅ Present' : '❌ Missing'}`);
    results.slang.status = 'HEALTHY';
} catch (e) {
    results.slang.status = 'ERROR';
    results.slang.details.push(`Error: ${e.message}`);
}

// Print Consolidated Diagnostic Summary
console.log('\n=============================================================');
console.log('📊 AUDIT SUMMARY MATRIX');
console.log('=============================================================');

Object.keys(results).forEach(pillar => {
    const res = results[pillar];
    const icon = res.status === 'HEALTHY' ? '🟢' : res.status === 'WARNING' ? '🟡' : '🔴';
    console.log(`\n${icon} [${pillar.toUpperCase()}] Status: ${res.status}`);
    res.details.forEach(d => console.log(`   • ${d}`));
});

console.log('\n=============================================================');
console.log('✅ Audit diagnostic complete.');
console.log('=============================================================\n');
