#!/usr/bin/env node

/**
 * Regression tests for:
 * 1. Bounded normalized LRU cache on POST /api/ai/translate (KeyProxy quota protection)
 * 2. Non-blocking Iconify / Google Fonts & zero unused @tabler/icons-webfont in shared head
 */

const assert = require('assert');
const express = require('express');
const http = require('http');
const createAiRouter = require('../../routes/ai');
const geminiService = require('../../services/gemini');
const { getCommonHead } = require('../generators/shared-utils');

async function requestJson(server, path, body) {
    const addr = server.address();
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1',
            port: addr.port,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'Origin': 'https://chokepidgin.com'
            }
        }, (res) => {
            let raw = '';
            res.on('data', chunk => { raw += chunk; });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    json: JSON.parse(raw)
                });
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

(async () => {
    console.log('🧪 Testing AI translate bounded LRU cache & CWV head invariants...');

    // 1. Unit-test createTranslateCache normalization, tone isolation & LRU eviction
    const cache = createAiRouter.createTranslateCache(3, 1000);
    const k1 = cache.buildKey('eng-to-pidgin', 'standard', '  How   Are You? ', [{ pidgin: 'Howzit' }]);
    const k2 = cache.buildKey('eng-to-pidgin', 'standard', 'how are you?', [{ pidgin: 'howzit' }]);
    const kHeavy = cache.buildKey('eng-to-pidgin', 'heavy', 'how are you?', [{ pidgin: 'howzit' }]);
    assert.strictEqual(k1, k2, 'Normalized whitespace/case must produce identical cache keys');
    assert.notStrictEqual(k1, kHeavy, 'Different tone must produce distinct cache keys');

    cache.set('a', { translation: 'A' }, 100);
    cache.set('b', { translation: 'B' }, 100);
    cache.set('c', { translation: 'C' }, 100);
    assert.deepStrictEqual(cache.get('a', 200), { translation: 'A' }); // refreshes 'a'
    cache.set('d', { translation: 'D' }, 200); // should evict 'b' (oldest)
    assert.strictEqual(cache.size(), 3, 'Cache must never exceed maxEntries');
    assert.strictEqual(cache.get('b', 250), null, 'Least-recently-used entry must be evicted');
    assert.deepStrictEqual(cache.get('a', 250), { translation: 'A' }, 'Recently accessed entry must remain');
    assert.strictEqual(cache.get('a', 1500), null, 'Expired entry past TTL must return null');

    // 2. End-to-end route test verifying Gemini upstream is skipped on cache HIT
    const origGenerate = geminiService.generateContent;
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    let upstreamCalls = 0;

    geminiService.generateContent = async () => {
        upstreamCalls++;
        return {
            ok: true,
            status: 200,
            json: async () => ({
                candidates: [{
                    content: {
                        parts: [{
                            text: JSON.stringify({
                                translation: `Howzit brah #${upstreamCalls}`,
                                explanation: 'Greeting',
                                confidence: 0.96
                            })
                        }]
                    }
                }]
            })
        };
    };

    const app = express();
    app.use(express.json());
    const passLimiter = (_req, _res, next) => next();
    const routeCache = createAiRouter.createTranslateCache(10, 60_000);
    app.use('/api/ai', createAiRouter(null, { data: null }, passLimiter, null, passLimiter, routeCache));

    const server = await new Promise(resolve => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });

    try {
        const r1 = await requestJson(server, '/api/ai/translate', {
            text: 'How are you doing?',
            direction: 'eng-to-pidgin',
            tone: 'standard'
        });
        assert.strictEqual(r1.status, 200);
        assert.strictEqual(r1.headers['x-cache'], 'MISS');
        assert.strictEqual(upstreamCalls, 1);

        // Repeat with different casing/whitespace -> HIT, 0 additional upstream calls
        const r2 = await requestJson(server, '/api/ai/translate', {
            text: '  how ARE   you doing?  ',
            direction: 'eng-to-pidgin',
            tone: 'standard'
        });
        assert.strictEqual(r2.status, 200);
        assert.strictEqual(r2.headers['x-cache'], 'HIT');
        assert.strictEqual(r2.json.translation, r1.json.translation);
        assert.strictEqual(upstreamCalls, 1, 'Cache HIT must not call Gemini upstream');

        // Different tone -> MISS
        const r3 = await requestJson(server, '/api/ai/translate', {
            text: 'How are you doing?',
            direction: 'eng-to-pidgin',
            tone: 'heavy'
        });
        assert.strictEqual(r3.status, 200);
        assert.strictEqual(r3.headers['x-cache'], 'MISS');
        assert.strictEqual(upstreamCalls, 2);
    } finally {
        geminiService.generateContent = origGenerate;
        if (origKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = origKey;
        await new Promise(resolve => server.close(resolve));
    }

    // 3. Verify getCommonHead CWV invariants
    const headHtml = getCommonHead({
        title: 'Test Title',
        metaDescription: 'Test description',
        keywords: 'pidgin',
        canonicalUrl: 'https://chokepidgin.com/word/brah.html'
    });
    assert.ok(!headHtml.includes('tabler-icons'), 'Shared head must not include unused @tabler/icons-webfont');
    assert.ok(/<script\s+defer\s+src="https:\/\/code\.iconify\.design\/iconify-icon/i.test(headHtml), 'Iconify script must be deferred');
    assert.ok(/fonts\.googleapis\.com[^>]*media="print"/i.test(headHtml), 'Google Fonts must load asynchronously');

    console.log('✅ AI translate cache & CWV head tests passed!');
})().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
