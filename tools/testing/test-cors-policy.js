#!/usr/bin/env node

/**
 * Regression test: a request from a disallowed Origin gets a quiet 403, not a 500.
 *
 * The old origin callback passed `new Error('Not allowed by CORS')` to `cors`, so Express's
 * default error handler answered 500 and logged a stack trace for every foreign-origin request
 * (2026-11-17 error-watch alert). Allowed and Origin-less requests must be unaffected.
 */

const assert = require('assert');
const express = require('express');
const http = require('http');
const { corsPolicy } = require('../../services/cors-policy');

function request(server, { method = 'GET', path = '/api/ping', headers = {} } = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: '127.0.0.1', port: server.address().port, method, path, headers }, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', reject);
        req.end();
    });
}

(async () => {
    const loggedErrors = [];
    const origError = console.error;
    console.error = (...a) => { loggedErrors.push(a.join(' ')); };

    let reached = 0;
    const app = express();
    app.use(corsPolicy({ isDev: false }));
    app.get('/api/ping', (req, res) => { reached++; res.json({ ok: true }); });
    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));

    let failures = 0;
    const check = async (label, fn) => {
        try { await fn(); console.log(`  ✓ ${label}`); }
        catch (e) { failures++; console.log(`  ✗ ${label}: ${e.message}`); }
    };

    try {
        await check('foreign origin → 403, handler not reached, nothing logged', async () => {
            const before = reached;
            const r = await request(server, { headers: { Origin: 'https://evil.example' } });
            assert.strictEqual(r.status, 403);
            assert.strictEqual(r.headers['access-control-allow-origin'], undefined);
            assert.strictEqual(reached, before, 'route handler must not run');
            assert.deepStrictEqual(loggedErrors, [], 'no stack trace may be logged');
        });

        await check('foreign origin preflight → 403', async () => {
            const r = await request(server, {
                method: 'OPTIONS',
                headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' },
            });
            assert.strictEqual(r.status, 403);
        });

        await check('allowed origin → 200 with credentialed CORS headers', async () => {
            const r = await request(server, { headers: { Origin: 'https://chokepidgin.com' } });
            assert.strictEqual(r.status, 200);
            assert.strictEqual(r.headers['access-control-allow-origin'], 'https://chokepidgin.com');
            assert.strictEqual(r.headers['access-control-allow-credentials'], 'true');
        });

        await check('allowed origin preflight → 200', async () => {
            const r = await request(server, {
                method: 'OPTIONS',
                headers: { Origin: 'https://www.chokepidgin.com', 'Access-Control-Request-Method': 'POST' },
            });
            assert.strictEqual(r.status, 200);
        });

        await check('no Origin (same-origin GET, curl, crawlers) → 200', async () => {
            const r = await request(server);
            assert.strictEqual(r.status, 200);
        });

        await check('dev origins rejected in production', async () => {
            const r = await request(server, { headers: { Origin: 'http://localhost:3000' } });
            assert.strictEqual(r.status, 403);
        });
    } finally {
        server.close();
        console.error = origError;
    }

    if (failures) {
        console.log(`\n❌ ${failures} CORS policy check(s) failed`);
        process.exit(1);
    }
    console.log('\n✅ CORS: disallowed origins get a quiet 403, allowed origins unaffected');
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
