#!/usr/bin/env node

/**
 * Unified Test Runner for ChokePidgin
 * 
 * Runs all validation and integrity tests:
 * 1. Master Translator Validation (run-validation.js)
 * 2. Phase 2 & 3 Grammar/Stories (validate-phase-2-3.js)
 * 3. Phrase-level Accuracy (validate-phrase-translator.js)
 * 4. Sentence Chunking (validate-sentence-improvements.js)
 * 5. Phonetics/Pronunciation Audit (pronunciation-audit.js)
 * 6. Site Link & SEO Integrity (audit-site.js) - runs a quick build first if needed
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('============================================================');
console.log('🌺 ChokePidgin Unified Test Suite');
console.log('============================================================\n');

const testSuites = [
    {
        name: 'Master Translator Validation',
        script: 'run-validation.js',
        requiredEnv: false
    },
    {
        name: 'Phase 2 & 3 (Grammar & Stories)',
        script: 'validate-phase-2-3.js',
        requiredEnv: false
    },
    {
        name: 'Phrase Translator Accuracy',
        script: 'validate-phrase-translator.js',
        requiredEnv: false
    },
    {
        name: 'Sentence Translation Improvements',
        script: 'validate-sentence-improvements.js',
        requiredEnv: false
    },
    {
        name: 'Pronunciation / Phonetics Audit',
        script: 'pronunciation-audit.js',
        requiredEnv: false
    },
    {
        name: 'Site Integrity & SEO Link Audit',
        script: 'audit-site.js',
        preRunBuild: true
    }
];

const results = [];
let overallPassed = true;

// Ensure public directory is built for the site audit
const publicDir = path.join(__dirname, '../../public');
const hasPublicDir = fs.existsSync(publicDir);

for (const suite of testSuites) {
    console.log(`\n🏃 Running: ${suite.name} (${suite.script})...`);
    console.log('-'.repeat(50));

    if (suite.preRunBuild && !hasPublicDir) {
        console.log('🏗️  Public directory not found. Triggering a quick build first...');
        const buildResult = spawnSync('node', [path.join(__dirname, '../../build.js'), '--quick'], {
            stdio: 'inherit',
            cwd: path.join(__dirname, '../..')
        });
        if (buildResult.status !== 0) {
            console.error('❌ Quick build failed! Skipping site audit.');
            results.push({ name: suite.name, status: 'SKIPPED (Build Failed)', code: buildResult.status });
            overallPassed = false;
            continue;
        }
    }

    const scriptPath = path.join(__dirname, suite.script);
    const start = Date.now();
    const processResult = spawnSync('node', [scriptPath], {
        stdio: 'inherit',
        cwd: __dirname
    });
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    const passed = processResult.status === 0;
    if (!passed) {
        overallPassed = false;
    }

    results.push({
        name: suite.name,
        status: passed ? 'PASSED ✅' : 'FAILED ❌',
        code: processResult.status,
        duration: `${duration}s`
    });
    console.log('-'.repeat(50));
}

console.log('\n============================================================');
console.log('📊 OVERALL TEST RUN SUMMARY');
console.log('============================================================');
console.log(`Date: ${new Date().toLocaleString()}`);
console.log('-'.repeat(60));
console.log(`${'Test Suite'.padEnd(35)} | ${'Status'.padEnd(10)} | Duration`);
console.log('-'.repeat(60));

for (const res of results) {
    console.log(`${res.name.padEnd(35)} | ${res.status.padEnd(10)} | ${res.duration || 'N/A'}`);
}
console.log('-'.repeat(60));

if (overallPassed) {
    console.log('\n🎉 ALL TEST SUITES PASSED SUCCESSFULLY! 🌺\n');
    process.exit(0);
} else {
    console.error('\n❌ SOME TEST SUITES FAILED. Please review the output above.\n');
    process.exit(1);
}
