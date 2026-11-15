#!/usr/bin/env node
/**
 * Regression: /api/ai/translate request body must fit server.js's 10kb express.json limit.
 * On 2026-11-15 a real user's request was 413'd (11.4KB) because aiTranslate() sent full
 * dictionary rows (examples, fts, timestamps) as RAG context. Offline; no Supabase needed.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const LIMIT = 10 * 1024;
const serverSrc = fs.readFileSync(path.join(__dirname, '../../server.js'), 'utf8');
assert.match(serverSrc, /express\.json\(\{\s*limit:\s*'10kb'/, 'server.js JSON limit changed; update LIMIT here');

const code = fs.readFileSync(path.join(__dirname, '../../src/components/translator/translator.js'), 'utf8');
const lines = code.split('\n');
let end = lines.findIndex(l => l.includes('const translator = new PidginTranslator()'));
if (end === -1) end = lines.length;
const ctx = { window: {}, console };
new vm.Script(lines.slice(0, end).join('\n') + '\nthis.PidginTranslator = PidginTranslator;').runInNewContext(ctx);
const proto = ctx.PidginTranslator.prototype;

// Worst-case-ish full Supabase rows, shaped like /api/dictionary output.
const longText = 'x'.repeat(400);
const fullRow = i => ({
    id: `00000000-0000-0000-0000-00000000000${i}`, pidgin: `word${i}`,
    english: ['meaning one', 'meaning two', 'meaning three'], category: 'expressions',
    pronunciation: 'WURD', examples: [longText, longText, longText], usage: longText,
    origin: longText, difficulty: 'beginner', frequency: 'high', tags: ['a', 'b'],
    audio_example: longText, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    fts: `'meaning':1,2,3 ${longText}`, source_language: 'english', spelling_variants: ['w1', 'w2']
});
const rows = Array.from({ length: 15 }, (_, i) => fullRow(i));

// Sanity: the old payload (full rows) really did exceed the limit.
const text = 'y'.repeat(500);
const oldBody = JSON.stringify({ text, direction: 'eng-to-pidgin', context: rows.slice(0, 10), tone: 'standard' });
assert.ok(Buffer.byteLength(oldBody) > LIMIT, 'fixture no longer reproduces the 413');

const payload = proto.toContextPayload(rows);
const body = JSON.stringify({ text, direction: 'eng-to-pidgin', context: payload, tone: 'standard' });
assert.ok(Buffer.byteLength(body) < LIMIT, `payload ${Buffer.byteLength(body)}B >= ${LIMIT}B`);
assert.strictEqual(payload.length, 10, 'context capped at 10 (server rejects more)');
assert.deepStrictEqual(Object.keys(payload[0]).sort(), ['english', 'pidgin', 'usage']);
assert.strictEqual(payload[0].pidgin, 'word0');
assert.deepStrictEqual(payload[0].english, ['meaning one', 'meaning two', 'meaning three']);

// Tolerates string english, missing usage, empty/undefined context.
assert.deepStrictEqual(JSON.parse(JSON.stringify(proto.toContextPayload([{ pidgin: 'da kine', english: 'thing' }]))),
    [{ pidgin: 'da kine', english: ['thing'] }]);
assert.strictEqual(proto.toContextPayload(undefined).length, 0);

// aiTranslate must send the slimmed context, not the raw rows.
assert.match(code, /context:\s*this\.toContextPayload\(context\)/, 'aiTranslate no longer slims context');
// Server must reject oversized context arrays.
const aiRoute = fs.readFileSync(path.join(__dirname, '../../routes/ai.js'), 'utf8');
assert.match(aiRoute, /body\('context'\)\.optional\(\)\.isArray\(\{\s*max:\s*10\s*\}\)/);

console.log(`✅ translate payload ${Buffer.byteLength(body)}B < ${LIMIT}B (was ${Buffer.byteLength(oldBody)}B)`);
