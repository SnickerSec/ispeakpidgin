#!/usr/bin/env node

/**
 * Dictionary Search Regression Tests
 *
 * Headwords carry kahakō and ʻokina (tūtū, lūʻau, ʻōkole) but people type them plain.
 * Both matchers must find them:
 *   - the browser's fuzzySearch (src/components/shared/supabase-data-loader.js), used by the
 *     dictionary page and the nav quick-search
 *   - services/dictionary-search.js, used by GET /api/dictionary/search and the
 *     POST /api/dictionary/search-gap "already in the dictionary" check
 * The same cases run through both so the two copies cannot drift apart, and the routes are
 * exercised over HTTP against a Supabase stand-in that fails the way Postgres did when
 * GET /search returned 500 on every query.
 */

const assert = require('assert').strict;
const fs = require('fs');
const http = require('http');
const path = require('path');
const vm = require('vm');
const express = require('express');

// Keep the route's semantic-search fallback (a live Gemini call) out of the test
delete process.env.GEMINI_API_KEY;

const { searchEntries, foldForSearch } = require('../../services/dictionary-search');
const dictionaryRoutes = require('../../routes/dictionary');

const ENTRIES = [
    { id: 'tutu', pidgin: 'tūtū', english: ['grandmother', 'grandfather', 'grandparent'] },
    { id: 'aue', pidgin: 'auē', english: ['oh dear', 'alas'] },
    { id: 'luau', pidgin: 'lūʻau', english: ['feast', 'party'] },
    { id: 'kokua', pidgin: 'kōkua', english: ['help', 'assistance'] },
    { id: 'okole', pidgin: "'ōkole", english: ['butt', 'buttocks'] },
    { id: 'letsgo', pidgin: "let's go", english: ["let's go"] },
    { id: 'aloha', pidgin: 'aloha', english: ['hello', 'goodbye', 'love'] },
    { id: 'lolo', pidgin: 'lolo', english: ['crazy', 'stupid'] },
    { id: 'dakine', pidgin: 'da kine', english: ['whatchamacallit', 'the kind'] }
];

// [query, id expected as the top result]
const TOP_HIT = [
    ['tutu', 'tutu'],
    ['tūtū', 'tutu'],
    ['TUTU', 'tutu'],
    ['aue', 'aue'],
    ['luau', 'luau'],
    ["lu'au", 'luau'],
    ['kokua', 'kokua'],
    ['okole', 'okole'],
    ['ʻōkole', 'okole'],
    ['lets go', 'letsgo'],
    ["let's go", 'letsgo'],
    ['let’s go', 'letsgo'],
    ['aloha', 'aloha'],
    ['grandmother', 'tutu'],
    ['crazy', 'lolo'],
    ['da  kine', 'dakine']
];
const NO_HIT = ['xyzzy', 'zz'];

let passed = 0;
const failures = [];
function check(name, fn) {
    try {
        fn();
        passed++;
        console.log(`   ✅ ${name}`);
    } catch (err) {
        failures.push(name);
        console.log(`   ❌ ${name}\n      ${err.message}`);
    }
}

// Load the browser loader in a sandbox, without letting it auto-load from the network
function loadClientLoader() {
    const src = fs.readFileSync(path.join(__dirname, '../../src/components/shared/supabase-data-loader.js'), 'utf8');
    const sandbox = {
        window: {},
        document: { readyState: 'loading', addEventListener() {} },
        console
    };
    vm.createContext(sandbox);
    vm.runInContext(`${src}\n;globalThis.__Loader = SupabaseDataLoader;`, sandbox);
    const loader = new sandbox.__Loader();
    loader.entries = ENTRIES;
    return { loader, Loader: sandbox.__Loader };
}

// Minimal Supabase stand-in: serves ENTRIES for dictionary_entries, records search_gaps writes.
// Like real Postgres, it rejects an ilike on the text[] english column (error 42883, observed
// live on 2026-10-02), which is how GET /search failed on every query.
function fakeSupabase(gapWrites) {
    return {
        from(table) {
            const calls = [];
            const resolveQuery = () => {
                if (calls.some(([prop, args]) => (prop === 'or' || prop === 'ilike') && /english\.ilike|^english$/.test(String(args[0])))) {
                    return { data: null, error: { code: '42883', message: 'operator does not exist: text[] ~~* unknown' } };
                }
                return table === 'dictionary_entries'
                    ? { data: ENTRIES, error: null, count: ENTRIES.length }
                    : { data: null, error: null };
            };
            const chain = new Proxy({}, {
                get(_, prop) {
                    if (prop === 'then') return (resolve, reject) => Promise.resolve(resolveQuery()).then(resolve, reject);
                    return (...args) => {
                        calls.push([prop, args]);
                        if (table === 'search_gaps' && (prop === 'insert' || prop === 'update')) gapWrites.push({ prop, args });
                        return chain;
                    };
                }
            });
            return chain;
        }
    };
}

async function startServer(gapWrites) {
    const app = express();
    app.use(express.json());
    const passThrough = (req, res, next) => next();
    const cache = { data: null, timestamp: 0, ttl: 5 * 60 * 1000 };
    app.use('/api/dictionary', dictionaryRoutes(fakeSupabase(gapWrites), passThrough, cache, passThrough));
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return { server, base: `http://127.0.0.1:${server.address().port}/api/dictionary` };
}

(async () => {
    console.log('🔎 Dictionary Search Regression Tests\n');

    console.log('1. Folding');
    check('strips kahakō, ʻokina and apostrophes, collapses spaces', () => {
        assert.equal(foldForSearch('  ʻŌkole  Lūʻau '), 'okole luau');
        assert.equal(foldForSearch('let’s go'), 'lets go');
    });
    const { loader, Loader } = loadClientLoader();
    check('client and server fold identically', () => {
        for (const s of ['tūtū', 'ʻĀina', "Let's  Go", 'kōkua', 'MĀHŪ']) {
            assert.equal(typeof Loader.foldForSearch, 'function', 'SupabaseDataLoader.foldForSearch is missing');
            assert.equal(Loader.foldForSearch(s), foldForSearch(s), s);
        }
    });

    console.log('\n2. Matchers');
    for (const [label, search] of [
        ['client fuzzySearch', q => loader.search(q)],
        ['server searchEntries', q => searchEntries(ENTRIES, q)]
    ]) {
        check(`${label}: plain spellings reach their headwords`, () => {
            for (const [q, id] of TOP_HIT) {
                const results = search(q);
                assert.ok(results.length > 0, `"${q}" found nothing`);
                assert.equal(results[0].id, id, `"${q}" ranked ${results[0].pidgin} first`);
            }
        });
        check(`${label}: no false hits`, () => {
            for (const q of NO_HIT) assert.equal(search(q).length, 0, `"${q}" should find nothing`);
        });
    }
    check('client and server return the same ranking', () => {
        for (const [q] of TOP_HIT) {
            // Array.from: arrays built inside the vm sandbox carry that realm's prototype
            assert.deepEqual(Array.from(loader.search(q), e => e.id), searchEntries(ENTRIES, q).map(e => e.id), q);
        }
    });

    console.log('\n3. Routes');
    const gapWrites = [];
    const { server, base } = await startServer(gapWrites);
    try {
        for (const q of ['aloha', 'tutu', 'luau', 'grandmother']) {
            const res = await fetch(`${base}/search?q=${encodeURIComponent(q)}`);
            const body = await res.json().catch(() => ({}));
            check(`GET /search?q=${q} → 200 with results`, () => {
                assert.equal(res.status, 200, JSON.stringify(body));
                assert.ok(body.count > 0, `no results for ${q}`);
            });
        }
        const limited = await (await fetch(`${base}/search?q=a&limit=1`)).json();
        check('GET /search rejects a one-letter query', () => assert.ok(limited.errors));

        const capped = await (await fetch(`${base}/search?q=al&limit=1`)).json();
        check('GET /search honours limit', () => assert.equal(capped.results?.length, 1));

        const post = term => fetch(`${base}/search-gap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term })
        }).then(r => r.json());

        gapWrites.length = 0;
        const known = await post('tutu');
        check('POST /search-gap ignores a plain spelling of an existing headword', () => {
            assert.equal(known.status, 'ignored');
            assert.equal(gapWrites.length, 0);
        });

        const unknown = await post('happy birthday');
        check('POST /search-gap still logs a genuine gap', () => {
            assert.equal(unknown.status, 'logged');
            assert.ok(gapWrites.some(w => w.prop === 'insert'));
        });
    } finally {
        server.close();
    }

    if (failures.length) {
        console.error(`\n❌ ${failures.length} of ${passed + failures.length} dictionary search checks failed`);
        process.exit(1);
    }
    console.log(`\n🎉 All ${passed} dictionary search checks passed! 🌺`);
})().catch(err => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
});
