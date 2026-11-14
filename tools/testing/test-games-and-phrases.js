#!/usr/bin/env node

/**
 * Regression guards for Daily Games determinism, Honolulu calendar rollover,
 * /api/phrases multi-page cache non-poisoning, and /phrases.html ElevenLabs speech routing.
 */

const assert = require('assert').strict;
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const gamesRoutes = require('../../routes/games');
const contentRoutes = require('../../routes/content');
const dictionaryRoutes = require('../../routes/dictionary');
const { speakPhrase } = require('../../src/components/phrases/phrases-page');

function requestJson(server, reqPath) {
    return new Promise((resolve, reject) => {
        const { port } = server.address();
        http.get(`http://127.0.0.1:${port}${reqPath}`, res => {
            let raw = '';
            res.on('data', chunk => { raw += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(raw)
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function postJson(server, reqPath, payload) {
    return new Promise((resolve, reject) => {
        const { port } = server.address();
        const bodyStr = JSON.stringify(payload);
        const req = http.request({
            hostname: '127.0.0.1',
            port,
            path: reqPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr)
            }
        }, res => {
            let raw = '';
            res.on('data', chunk => { raw += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(raw)
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

function makeFakeSupabase({ wordleWords, crosswordPuzzles, phrases, lessons = [], dictionaryEntries = [], searchGaps = [] }) {
    const tables = {
        wordle_words: wordleWords,
        crossword_puzzles: crosswordPuzzles,
        phrases,
        lessons,
        dictionary_entries: dictionaryEntries,
        search_gaps: searchGaps
    };

    return {
        from(table) {
            let rows = [...(tables[table] || [])];
            const builder = {
                select() { return builder; },
                not(col, op, val) {
                    if (op === 'is' && val === null) {
                        rows = rows.filter(r => r[col] !== null && r[col] !== undefined);
                    }
                    return builder;
                },
                eq(col, val) {
                    rows = rows.filter(r => r[col] === val);
                    return builder;
                },
                is(col, val) {
                    rows = rows.filter(r => (r[col] ?? null) === val);
                    return builder;
                },
                order(col, { ascending = true } = {}) {
                    rows.sort((a, b) => {
                        if (a[col] < b[col]) return ascending ? -1 : 1;
                        if (a[col] > b[col]) return ascending ? 1 : -1;
                        return 0;
                    });
                    return builder;
                },
                limit(n) {
                    rows = rows.slice(0, n);
                    return builder;
                },
                range(from, to) {
                    // Emulate PostgREST 1,000-row max-rows cap!
                    const cappedEnd = Math.min(to + 1, from + 1000);
                    return Promise.resolve({ data: rows.slice(from, cappedEnd), error: null });
                },
                insert(items) {
                    tables[table].push(...items);
                    return Promise.resolve({ data: items, error: null });
                },
                single() {
                    if (rows.length === 1) return Promise.resolve({ data: rows[0], error: null });
                    return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
                },
                then(resolve, reject) {
                    return Promise.resolve({ data: rows, error: null, count: rows.length }).then(resolve, reject);
                }
            };
            return builder;
        }
    };
}

async function main() {
    console.log('🎲 Testing Daily Games Determinism, Phrase Cache & Speech Wiring...\n');

    const passLimiter = (req, res, next) => next();

    // Build 1,154 synthetic phrases (> 1,000 PostgREST page cap), 10 Wordle solutions, 5 Crosswords
    const wordleWords = [
        'ALOHA', 'PONO!', 'SHAKA', 'GRIND', 'MAUKA',
        'MAKAI', 'KEIKI', 'OHANA', 'HOWZT', 'CHEEH'
    ].map((w, i) => ({
        id: i + 1,
        word: w.replace('!', 'S'),
        meaning: `Meaning ${i + 1}`,
        pronunciation: `pro-${i + 1}`,
        difficulty: 'easy',
        is_solution: true,
        is_valid_guess: true,
        used_on: null
    }));

    const crosswordPuzzles = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        puzzle_id: `puz-${i + 1}`,
        title: `Puzzle ${i + 1}`,
        used_on: null
    }));

    const phrases = Array.from({ length: 1154 }, (_, i) => ({
        id: i + 1,
        pidgin: `Phrase ${i + 1}`,
        english: `English ${i + 1}`,
        category: i % 2 === 0 ? 'greetings' : 'food',
        difficulty: 'beginner'
    }));

    const lessons = [
        {
            id: 1,
            lesson_key: 'directions-101',
            level: 'beginner',
            title: 'Directions',
            icon: '🧭',
            cultural_note: 'Mauka means toward the mountain.',
            practice_title: 'Practice',
            practice_text: 'Go mauka two blocks.',
            sort_order: 1,
            lesson_vocabulary: [
                { pidgin: 'Mauka', english: 'Toward the mountain', example: 'Head mauka.', sort_order: 1 },
                { pidgin: 'Unlisted Multiword Phrase', english: 'No dict entry', example: 'Test.', sort_order: 2 }
            ]
        }
    ];

    const dictionaryEntries = [
        {
            id: '00000000-0000-4000-8000-000000000001',
            pidgin: 'Mauka',
            english: ['toward the mountain', 'inland'],
            pronunciation: 'MOW-kah',
            category: 'directions',
            difficulty: 'beginner',
            spelling_variants: ['mauka']
        }
    ];

    const searchGaps = [];
    const dictionaryCache = { data: null, timestamp: 0, ttl: 300000 };

    const fakeSupabase = makeFakeSupabase({ wordleWords, crosswordPuzzles, phrases, lessons, dictionaryEntries, searchGaps });
    const app = express();
    app.use(express.json());
    app.use('/api', gamesRoutes(fakeSupabase, passLimiter, null));
    app.use('/api', contentRoutes(fakeSupabase, passLimiter));
    app.use('/api/dictionary', dictionaryRoutes(fakeSupabase, passLimiter, dictionaryCache, passLimiter));

    const server = await new Promise(resolve => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });

    try {
        // 1. Daily Wordle determinism across repeated requests on the same Honolulu date
        console.log('1. Verifying GET /api/wordle/daily determinism...');
        const calls = await Promise.all(
            Array.from({ length: 6 }, () => requestJson(server, '/api/wordle/daily'))
        );
        const firstWord = calls[0].body.word;
        const expectedHstDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });
        assert.ok(firstWord, 'Daily Wordle should return a word');
        for (const res of calls) {
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.word, firstWord, 'Every player on the same day must receive the exact same Daily Wordle');
            assert.strictEqual(res.body.date, expectedHstDate, 'Daily Wordle date must match Pacific/Honolulu calendar date');
        }
        console.log(`   ✅ 6/6 calls returned "${firstWord}" for Honolulu date ${expectedHstDate}`);

        // 2. Daily Crossword uses Honolulu calendar date (not UTC midnight rollover at 2 PM HST)
        console.log('2. Verifying GET /api/crossword/daily Honolulu date alignment...');
        const cwRes = await requestJson(server, '/api/crossword/daily');
        assert.strictEqual(cwRes.status, 200);
        assert.strictEqual(cwRes.body.date, expectedHstDate);
        assert.ok(cwRes.body.puzzle_id, 'Daily Crossword should return a puzzle');
        console.log(`   ✅ Daily Crossword returned "${cwRes.body.puzzle_id}" for Honolulu date ${cwRes.body.date}`);

        // 3. /api/phrases loads all >1,000 rows across PostgREST pages AND never poisons cache across limits
        console.log('3. Verifying GET /api/phrases multi-page fetch & cache non-poisoning...');
        const p500 = await requestJson(server, '/api/phrases?limit=500');
        assert.strictEqual(p500.status, 200);
        assert.strictEqual(p500.headers['x-cache'], 'MISS');
        assert.strictEqual(p500.body.phrases.length, 500);
        assert.strictEqual(p500.body.pagination.total, 1154, 'Total count must reflect all 1,154 rows across PostgREST pages');

        const p2000 = await requestJson(server, '/api/phrases?limit=2000');
        assert.strictEqual(p2000.status, 200);
        assert.strictEqual(p2000.headers['x-cache'], 'HIT', 'Second call should hit warm phrasesCache');
        assert.strictEqual(p2000.body.phrases.length, 1154, 'limit=2000 must return all 1,154 rows without being poisoned by prior limit=500 call');
        console.log('   ✅ /api/phrases returned 500 on limit=500 (total=1154) and 1,154 on limit=2000 (X-Cache: HIT)');

        // 4. Verify phrases.html loads elevenlabs-speech.js and speakPhrase routes through pidginSpeech.speak
        console.log('4. Verifying /phrases.html ElevenLabs speech wiring...');
        const phrasesHtml = fs.readFileSync(path.join(__dirname, '../../src/pages/phrases.html'), 'utf8');
        assert.match(phrasesHtml, /elevenlabs-speech\.js/, 'src/pages/phrases.html must load elevenlabs-speech.js');

        let spokenText = null;
        global.pidginSpeech = {
            speak(text) {
                spokenText = text;
                return Promise.resolve();
            }
        };
        speakPhrase('Howzit brah!');
        delete global.pidginSpeech;
        assert.strictEqual(spokenText, 'Howzit brah!', 'speakPhrase() must route through pidginSpeech.speak() when available');

        const dictJs = fs.readFileSync(path.join(__dirname, '../../src/components/dictionary/dictionary-page.js'), 'utf8');
        assert.ok(
            !/'speechSynthesis'\s+in\s+window\s*&&\s*typeof\s+pidginSpeech/.test(dictJs),
            'dictionary-page.js must not gate pidginSpeech behind window.speechSynthesis'
        );
        console.log('   ✅ speakPhrase() routes to pidginSpeech.speak() and dictionary-page.js has no speechSynthesis gate');

        // 5. Verify GET /api/lessons enriches real dictionary pronunciations & Learning Hub / main.js speech guards
        console.log('5. Verifying GET /api/lessons pronunciation enrichment & Learning Hub speech guards...');
        const lessonsRes = await requestJson(server, '/api/lessons');
        assert.strictEqual(lessonsRes.status, 200);
        const dirLesson = lessonsRes.body.beginner[0];
        assert.strictEqual(dirLesson.content.vocabulary[0].pidgin, 'Mauka');
        assert.strictEqual(dirLesson.content.vocabulary[0].pronunciation, 'MOW-kah', 'Dictionary headword in lesson_vocabulary must receive real phonetic guide');
        assert.strictEqual(dirLesson.content.vocabulary[1].pronunciation, null, 'Unlisted phrase without dictionary pronunciation must be null (never uppercase echo)');

        const learningHubJs = fs.readFileSync(path.join(__dirname, '../../src/components/learning/learning-hub.js'), 'utf8');
        assert.ok(
            !/pronunciation:\s*v\.pidgin\.toUpperCase\(\)/.test(learningHubJs),
            'learning-hub.js must never synthesize fake uppercase pronunciation brackets'
        );
        const mainJs = fs.readFileSync(path.join(__dirname, '../../src/components/shared/main.js'), 'utf8');
        assert.ok(
            !/'speechSynthesis'\s+in\s+window\s*&&\s*typeof\s+pidginSpeech/.test(mainJs),
            'main.js speakText() must not gate ElevenLabs pidginSpeech behind window.speechSynthesis'
        );
        console.log('   ✅ /api/lessons enriches real phonetic guides and learning-hub.js / main.js are clean');

        // 6. Verify POST /api/dictionary/search-gap filters numeric & sentence-fragment noise
        console.log('6. Verifying POST /api/dictionary/search-gap noise filtering...');
        const gapNumeric = await postJson(server, '/api/dictionary/search-gap', { term: '544' });
        assert.strictEqual(gapNumeric.status, 200);
        assert.strictEqual(gapNumeric.body.status, 'ignored');
        assert.strictEqual(gapNumeric.body.reason, 'noise_filtered');

        const gapFragment = await postJson(server, '/api/dictionary/search-gap', { term: 'i need my' });
        assert.strictEqual(gapFragment.status, 200);
        assert.strictEqual(gapFragment.body.status, 'ignored');
        assert.strictEqual(gapFragment.body.reason, 'noise_filtered');

        const gapValid = await postJson(server, '/api/dictionary/search-gap', { term: 'kanakaveli' });
        assert.strictEqual(gapValid.status, 200);
        assert.strictEqual(gapValid.body.status, 'logged');
        assert.strictEqual(searchGaps.length, 1);
        assert.strictEqual(searchGaps[0].term, 'kanakaveli');
        console.log('   ✅ Numeric ("544") and fragment ("i need my") noise ignored; valid unknown term ("kanakaveli") logged');

        // 7. Verify all routes/*.js instantiate express.Router() inside their factory function
        console.log('7. Verifying routes/*.js factory-scoped router instantiation...');
        const routesDir = path.join(__dirname, '../../routes');
        const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
        assert.ok(routeFiles.length >= 10, 'Expected at least 10 route modules');
        for (const file of routeFiles) {
            const src = fs.readFileSync(path.join(routesDir, file), 'utf8');
            const exportIdx = src.indexOf('module.exports');
            const routerIdx = src.indexOf('express.Router()');
            assert.ok(exportIdx !== -1 && routerIdx > exportIdx, `routes/${file} must instantiate express.Router() inside module.exports factory`);
        }
        // Double-confirm invoking gamesRoutes twice returns distinct Router instances
        const r1 = gamesRoutes(fakeSupabase, passLimiter, null);
        const r2 = gamesRoutes(fakeSupabase, passLimiter, null);
        assert.notStrictEqual(r1, r2, 'Route factory must return a fresh Router instance per call');
        console.log(`   ✅ All ${routeFiles.length} routes/*.js modules return fresh factory-scoped Router instances`);

        console.log('\n🎉 All Daily Games, Phrase Cache, Lesson Phonetics, Search-Gap & Router guards passed!');
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
