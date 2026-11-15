#!/usr/bin/env node
/**
 * Live production functional, SSR, SEO & cache-header smoke gate for ChokePidgin.com.
 *
 * Zero extra runtime dependencies (uses Node 20+ native fetch). Safe for post-deploy
 * verification (`Verify-After`), CI workflows, and weekly CWV/smoke monitoring
 * (`pidgin-perf-watch`). Never triggers paid ElevenLabs TTS or LLM endpoints.
 *
 * Usage:
 *   node tools/testing/live-smoke.js
 *   BASE_URL=https://chokepidgin.com node tools/testing/live-smoke.js --json
 */

'use strict';

const BASE = (process.env.BASE_URL || 'https://chokepidgin.com').replace(/\/$/, '');
const WWW_HOST = 'https://www.chokepidgin.com';
const JSON_OUT = process.argv.includes('--json');
const MAX_TTFB_MS = Number(process.env.SMOKE_MAX_MS || 4500);
const UA = 'ChokePidgin-LiveSmoke/1.0 (+https://chokepidgin.com)';

const HTML_PAGES = [
    { path: '/', expectCanonical: `${BASE}/`, requireJsonLd: true },
    { path: '/translator.html', expectCanonical: `${BASE}/translator.html`, requireJsonLd: true },
    { path: '/what-does-da-kine-mean.html', expectCanonical: `${BASE}/what-does-da-kine-mean.html`, requireJsonLd: true },
    { path: '/word/aloha.html', expectCanonical: null, requireJsonLd: true },
    { path: '/phrases.html', expectCanonical: `${BASE}/phrases.html`, requireJsonLd: false },
    { path: '/games.html', expectCanonical: `${BASE}/games.html`, requireJsonLd: false }
];

const API_CHECKS = [
    {
        path: '/api/health',
        expectCache: false,
        validate: (body) => body && body.status === 'healthy'
    },
    {
        path: '/api/dictionary?limit=5',
        expectCache: true,
        validate: (body) => {
            const list = Array.isArray(body) ? body : (body && (body.entries || body.data));
            return Array.isArray(list) && list.length >= 3 && Boolean(list[0].pidgin);
        }
    },
    {
        path: '/api/dictionary/daily',
        expectCache: true,
        validate: (body) => Boolean(body && (body.pidgin || (body.word && body.word.pidgin) || (body.entry && body.entry.pidgin)))
    },
    {
        path: '/api/dictionary/search?q=brah',
        expectCache: true,
        validate: (body) => {
            const list = Array.isArray(body) ? body : (body && (body.results || body.entries || body.data));
            return Array.isArray(list) && list.length >= 1;
        }
    },
    {
        path: '/api/phrases?limit=5',
        expectCache: true,
        validate: (body) => {
            const list = Array.isArray(body) ? body : (body && (body.phrases || body.data));
            return Array.isArray(list) && list.length >= 3;
        }
    },
    {
        path: '/api/pickup-lines?limit=3',
        expectCache: true,
        validate: (body) => {
            const list = Array.isArray(body) ? body : (body && (body.pickupLines || body.lines || body.data));
            return Array.isArray(list) && list.length >= 1;
        }
    },
    {
        path: '/api/wordle/daily',
        expectCache: false,
        validate: (body) => Boolean(body && typeof body.word === 'string' && body.word.length === 5)
    },
    {
        path: '/api/crossword/puzzles',
        expectCache: true,
        validate: (body) => Boolean(body && Array.isArray(body.puzzles) && body.puzzles.length >= 1)
    }
];

async function timedFetch(url, opts = {}) {
    const t0 = performance.now();
    const res = await fetch(url, {
        ...opts,
        headers: {
            'user-agent': UA,
            'accept-encoding': 'gzip, br',
            ...(opts.headers || {})
        },
        signal: AbortSignal.timeout(12000)
    });
    const ms = Math.round(performance.now() - t0);
    return { res, ms };
}

function extractCanonical(html) {
    const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
    if (!m) return null;
    const href = m[0].match(/href=["']([^"']+)["']/i);
    return href ? href[1].trim() : null;
}

function extractJsonLdBlocks(html) {
    const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const blocks = [];
    let m;
    while ((m = re.exec(html)) !== null) {
        blocks.push(m[1].trim());
    }
    return blocks;
}

async function run() {
    const results = [];
    const failures = [];
    const record = (name, ok, ms, detail) => {
        results.push({ name, ok, ms, detail });
        if (!ok) failures.push(`${name}: ${detail}`);
    };

    // 1. Canonical www -> apex 301 check (only when probing production chokepidgin.com)
    if (BASE === 'https://chokepidgin.com') {
        try {
            const { res, ms } = await timedFetch(`${WWW_HOST}/translator.html`, { redirect: 'manual' });
            const loc = res.headers.get('location') || '';
            const ok = res.status === 301 && loc === 'https://chokepidgin.com/translator.html';
            record('redirect:www->apex', ok, ms, `status=${res.status} location=${loc}`);
        } catch (err) {
            record('redirect:www->apex', false, 0, err.message);
        }
    }

    // 2. Word landing redirect check (/word/brah.html -> /what-does-brah-mean.html)
    try {
        const { res, ms } = await timedFetch(`${BASE}/word/brah.html`, { redirect: 'manual' });
        const loc = res.headers.get('location') || '';
        const ok = (res.status === 301 || res.status === 302) && loc.includes('what-does-brah-mean.html');
        record('redirect:/word/brah.html', ok, ms, `status=${res.status} location=${loc}`);
    } catch (err) {
        record('redirect:/word/brah.html', false, 0, err.message);
    }

    // 3. HTML SSR, SEO & security header checks
    for (const p of HTML_PAGES) {
        const url = `${BASE}${p.path}`;
        try {
            const { res, ms } = await timedFetch(url, { redirect: 'follow' });
            const html = await res.text();
            const problems = [];
            if (res.status !== 200) problems.push(`HTTP ${res.status}`);
            if (ms > MAX_TTFB_MS) problems.push(`slow response ${ms}ms > ${MAX_TTFB_MS}ms`);
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('text/html')) problems.push(`unexpected content-type ${ct}`);
            if ((res.headers.get('x-content-type-options') || '').toLowerCase() !== 'nosniff') {
                problems.push('missing x-content-type-options: nosniff');
            }
            const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
            if (!titleMatch || titleMatch[1].trim().length < 8) problems.push('missing/short <title>');
            if (!/<h1[\s>]/i.test(html)) problems.push('missing <h1>');
            const canonical = extractCanonical(html);
            if (!canonical) {
                problems.push('missing <link rel="canonical">');
            } else if (p.expectCanonical && canonical !== p.expectCanonical) {
                problems.push(`canonical=${canonical} expected=${p.expectCanonical}`);
            }
            const ldBlocks = extractJsonLdBlocks(html);
            if (p.requireJsonLd && ldBlocks.length === 0) {
                problems.push('missing application/ld+json block');
            }
            for (const raw of ldBlocks) {
                try {
                    JSON.parse(raw);
                } catch (e) {
                    problems.push(`invalid JSON-LD: ${e.message}`);
                }
            }
            record(`html:${p.path}`, problems.length === 0, ms, problems.join('; ') || `ok (${html.length} chars)`);
        } catch (err) {
            record(`html:${p.path}`, false, 0, err.message);
        }
    }

    // 4. API functional & cache-header checks
    for (const a of API_CHECKS) {
        const url = `${BASE}${a.path}`;
        try {
            const { res, ms } = await timedFetch(url);
            const text = await res.text();
            const problems = [];
            if (res.status !== 200) problems.push(`HTTP ${res.status}`);
            if (ms > MAX_TTFB_MS) problems.push(`slow response ${ms}ms > ${MAX_TTFB_MS}ms`);
            if (a.expectCache) {
                const cc = res.headers.get('cache-control') || '';
                if (!cc.includes('max-age=3600') || cc.includes('no-store')) {
                    problems.push(`bad cache-control: ${cc || '(missing)'}`);
                }
            }
            let parsed = null;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                problems.push(`invalid JSON: ${e.message}`);
            }
            if (parsed !== null && !a.validate(parsed)) {
                problems.push('payload validation failed');
            }
            record(`api:${a.path}`, problems.length === 0, ms, problems.join('; ') || 'ok');
        } catch (err) {
            record(`api:${a.path}`, false, 0, err.message);
        }
    }

    const summary = {
        base: BASE,
        checkedAt: new Date().toISOString(),
        total: results.length,
        passed: results.length - failures.length,
        failed: failures.length,
        failures,
        results
    };

    if (JSON_OUT) {
        console.log(JSON.stringify(summary, null, 2));
    } else {
        for (const r of results) {
            console.log(`${r.ok ? 'PASS' : 'FAIL'} [${String(r.ms).padStart(4)}ms] ${r.name} — ${r.detail}`);
        }
        console.log(`\nLive smoke summary (${BASE}): ${summary.passed}/${summary.total} passed`);
    }

    process.exit(failures.length === 0 ? 0 : 1);
}

run().catch((err) => {
    console.error('Fatal smoke error:', err);
    process.exit(1);
});
