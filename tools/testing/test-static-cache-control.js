#!/usr/bin/env node

/**
 * Regression test: `immutable` caching of ?v= CSS/JS is granted only when v matches the
 * served file's real content hash (the same md5[0:10] build.js versionAssetUrls() stamps).
 *
 * express.static ignores the query string, so a hex-looking but wrong v (a pre-deploy probe
 * for an upcoming hash, or a request landing on a draining container mid-cutover) must not
 * pin the old bytes under the new cache key for a year at Cloudflare and in browsers.
 */

const assert = require('assert');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { assetCacheControl, IMMUTABLE, UNVERSIONED, MISMATCHED } = require('../../services/static-cache-control');

const md5_10 = (buf) => crypto.createHash('md5').update(buf).digest('hex').slice(0, 10);

function get(server, urlPath) {
    return new Promise((resolve, reject) => {
        http.get({ hostname: '127.0.0.1', port: server.address().port, path: urlPath }, (res) => {
            res.resume();
            res.on('end', () => resolve(res));
        }).on('error', reject);
    });
}

(async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'static-cc-'));
    const cssPath = path.join(dir, 'app.css');
    fs.writeFileSync(cssPath, 'body{color:red}');
    const jsPath = path.join(dir, 'app.js');
    fs.writeFileSync(jsPath, 'console.log(1)');

    const app = express();
    app.use(express.static(dir, {
        setHeaders: (res, filePath, stat) => {
            const rawUrl = (res.req && (res.req.originalUrl || res.req.url)) || '';
            res.set('Cache-Control', assetCacheControl(filePath, rawUrl, stat));
        }
    }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise((r) => server.once('listening', r));

    let failures = 0;
    const check = async (label, urlPath, expected) => {
        const res = await get(server, urlPath);
        try {
            assert.strictEqual(res.statusCode, 200, `${label}: status`);
            assert.strictEqual(res.headers['cache-control'], expected, `${label}: cache-control`);
            console.log(`  ✓ ${label}`);
        } catch (e) {
            failures++;
            console.log(`  ✗ ${label}: ${e.message}`);
        }
    };

    try {
        const cssHash = md5_10(fs.readFileSync(cssPath));
        const jsHash = md5_10(fs.readFileSync(jsPath));

        await check('matching ?v=<real md5> → immutable (css)', `/app.css?v=${cssHash}`, IMMUTABLE);
        await check('matching ?v=<real md5> → immutable (js)', `/app.js?v=${jsHash}`, IMMUTABLE);
        await check('uppercase matching hash → immutable', `/app.css?v=${cssHash.toUpperCase()}`, IMMUTABLE);
        await check('mismatched ?v=deadbeef00 → no-cache', '/app.css?v=deadbeef00', MISMATCHED);
        await check('other file\'s hash → no-cache', `/app.css?v=${jsHash}`, MISMATCHED);
        await check('hash prefix only → no-cache', `/app.css?v=${cssHash.slice(0, 6)}`, MISMATCHED);
        await check('empty ?v= → no-cache', '/app.css?v=', MISMATCHED);
        await check('unversioned → 1h', '/app.css', UNVERSIONED);
        await check('unrelated query only → 1h', '/app.css?foo=1', UNVERSIONED);

        // Deploy rewrites the file in place: the old hash must lose immutable, the new one gain it.
        fs.writeFileSync(cssPath, 'body{color:blue;margin:0}');
        const future = new Date(Date.now() + 5000);
        fs.utimesSync(cssPath, future, future);
        const newHash = md5_10(fs.readFileSync(cssPath));
        await check('stale memo invalidated: old hash → no-cache', `/app.css?v=${cssHash}`, MISMATCHED);
        await check('stale memo invalidated: new hash → immutable', `/app.css?v=${newHash}`, IMMUTABLE);

        for (const cc of [MISMATCHED, UNVERSIONED]) {
            assert.ok(!/immutable/.test(cc), `non-matching policy must not be immutable: ${cc}`);
        }
    } finally {
        server.close();
        fs.rmSync(dir, { recursive: true, force: true });
    }

    if (failures) {
        console.log(`\n❌ ${failures} static cache-control check(s) failed`);
        process.exit(1);
    }
    console.log('\n✅ Static ?v= cache-control: immutable only on verified content hash');
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
