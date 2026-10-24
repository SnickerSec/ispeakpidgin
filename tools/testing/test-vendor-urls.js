#!/usr/bin/env node
/**
 * AI vendor calls must go through services/ai-upstreams.js (or GEMINI_BASE_URL /
 * ELEVENLABS_BASE_URL). On Railway those point at keyproxy and the API keys are scoped proxy
 * tokens, which the vendors reject: once the keys were rotated to proxy tokens (2026-10-24),
 * every tool that hardcoded api.elevenlabs.io or generativelanguage.googleapis.com got 401/400.
 */
const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const DIRS = ['routes', 'services', 'middleware', 'tools', 'src/components', '.claude/skills/pidgin-review-advisor/scripts'];
const VENDOR = /https:\/\/(api\.elevenlabs\.io|generativelanguage\.googleapis\.com)/;
// The single place the defaults live; `process.env.X_BASE_URL || '<vendor>'` fallbacks are fine too.
const ALLOWED = new Set(['services/ai-upstreams.js']);

function walk(dir) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap(e => {
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(rel);
        return e.name.endsWith('.js') ? [rel] : [];
    });
}

const offenders = [];
for (const rel of DIRS.flatMap(walk)) {
    if (ALLOWED.has(rel) || rel === 'tools/testing/test-vendor-urls.js') continue;
    fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n').forEach((line, i) => {
        if (VENDOR.test(line) && !/process\.env\.(GEMINI|ELEVENLABS)_BASE_URL\s*\|\|/.test(line)) {
            offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
        }
    });
}
assert.deepEqual(offenders, [],
    `Hardcoded AI vendor URLs (use ELEVENLABS_BASE_URL / GEMINI_BASE_URL from services/ai-upstreams.js, ` +
    `or services/gemini.js for Gemini):\n  ${offenders.join('\n  ')}`);
console.log('✅ No hardcoded AI vendor URLs outside services/ai-upstreams.js');
