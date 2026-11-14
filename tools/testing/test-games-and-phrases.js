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

function makeFakeSupabase({ wordleWords, crosswordPuzzles, phrases }) {
    const tables = {
        wordle_words: wordleWords,
        crossword_puzzles: crosswordPuzzles,
        phrases
    };

    return {
        from(table) {
            let rows = [...(tables[table] || [])];
            const builder = {
                select() { return builder; },
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
                range(from, to) {
                    // Emulate PostgREST 1,000-row max-rows cap!
                    const cappedEnd = Math.min(to + 1, from + 1000);
                    return Promise.resolve({ data: rows.slice(from, cappedEnd), error: null });
                },
                single() {
                    if (rows.length === 1) return Promise.resolve({ data: rows[0], error: null });
                    return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
                },
                then(resolve, reject) {
                    return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
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

    const fakeSupabase = makeFakeSupabase({ wordleWords, crosswordPuzzles, phrases });
    const app = express();
    app.use('/api', gamesRoutes(fakeSupabase, passLimiter, null));
    app.use('/api', contentRoutes(fakeSupabase, passLimiter));

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

        console.log('\n🎉 All Daily Games, Phrase Cache & Speech guards passed!');
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
