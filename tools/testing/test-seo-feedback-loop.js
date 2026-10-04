#!/usr/bin/env node

/**
 * Unit Tests for SEO Feedback Loop & Offline GSC Intake Tool
 */

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
    parseCsvQueries,
    parseJsonQueries,
    loadQueriesFromFile,
    normalizeQueryTerm,
    cleanQueryTerm,
    categorizeQuery,
    findMissingTerms,
    coveredBy,
    buildCoverageIndex,
    parseCommandLineArgs,
    findOfflineQueryFile,
    resolveKeyPath,
    CANDIDATE_OFFLINE_PATHS,
    SAMPLE_DATA_PATH
} = require('../seo/feedback-loop.js');
const { coverage, closeResolvedGaps, credentialsFromEnv } = require('../../services/search-gaps');
const { fetchAllRows } = require('../../services/fetch-all-rows');

async function runTests() {
    console.log('🧪 Testing SEO Feedback Loop & Offline Intake Tool...\n');

    // 1. Test CLI argument parser
    console.log('1. Testing CLI argument parser...');
    const args1 = parseCommandLineArgs(['-f', 'data/queries.csv', '-m', '50', '-o', '/tmp/out.json']);
    assert.strictEqual(args1.inputFile, 'data/queries.csv');
    assert.strictEqual(args1.minImpressions, 50);
    assert.strictEqual(args1.outputPath, '/tmp/out.json');

    const args2 = parseCommandLineArgs(['--help']);
    assert.strictEqual(args2.help, true);

    // 2. Test CSV query parser
    console.log('2. Testing CSV query parsing...');
    const sampleCsv = `Top queries,Clicks,Impressions,CTR,Position
"what does poke bowl mean",45,"1,200",3.75%,1.2
"ono grindz",10,500,2.00%,3.4
"how to say shoots in hawaiian",8,320,2.50%,4.1
"unknown slang word",2,80,2.50%,8.2
`;
    const parsedCsv = parseCsvQueries(sampleCsv);
    assert.strictEqual(parsedCsv.length, 4);
    assert.strictEqual(parsedCsv[0].keys[0], 'what does poke bowl mean');
    assert.strictEqual(parsedCsv[0].impressions, 1200);
    assert.strictEqual(parsedCsv[0].clicks, 45);
    assert.ok(Math.abs(parsedCsv[0].ctr - 0.0375) < 0.0001);
    assert.strictEqual(parsedCsv[0].position, 1.2);

    // CSV with UTF-8 BOM
    const bomCsv = '\uFEFFTop queries,Clicks,Impressions\n"choke meaning",5,100';
    const parsedBom = parseCsvQueries(bomCsv);
    assert.strictEqual(parsedBom.length, 1);
    assert.strictEqual(parsedBom[0].keys[0], 'choke meaning');

    // 3. Test JSON query parser
    console.log('3. Testing JSON query parsing...');
    // Standard GSC API response
    const gscApiJson = JSON.stringify({
        rows: [
            { keys: ['what does akamai mean'], clicks: 50, impressions: 800, ctr: 0.0625, position: 1.5 }
        ]
    });
    const parsedGsc = parseJsonQueries(gscApiJson);
    assert.strictEqual(parsedGsc.length, 1);
    assert.strictEqual(parsedGsc[0].keys[0], 'what does akamai mean');
    assert.strictEqual(parsedGsc[0].impressions, 800);

    // Flat array format
    const flatJson = JSON.stringify([
        { query: 'hapa haole', impressions: 350, clicks: 12 },
        { pidgin: 'buss up', impressions: 150, clicks: 5 }
    ]);
    const parsedFlat = parseJsonQueries(flatJson);
    assert.strictEqual(parsedFlat.length, 2);
    assert.strictEqual(parsedFlat[0].keys[0], 'hapa haole');
    assert.strictEqual(parsedFlat[1].keys[0], 'buss up');

    // Array of strings
    const stringArrayJson = JSON.stringify(['shaka', 'da kine']);
    const parsedStringArr = parseJsonQueries(stringArrayJson);
    assert.strictEqual(parsedStringArr.length, 2);
    assert.strictEqual(parsedStringArr[0].keys[0], 'shaka');

    // 4. Test query term cleaning & extraction
    console.log('4. Testing query term extraction & stripping...');
    assert.strictEqual(cleanQueryTerm('what does pau hana mean'), 'pau hana');
    assert.strictEqual(cleanQueryTerm('how to say delicious in hawaiian'), 'delicious');
    assert.strictEqual(cleanQueryTerm('meaning of holoholo in chat'), 'holoholo');
    assert.strictEqual(cleanQueryTerm('is chaminade a real word'), 'chaminade');
    assert.strictEqual(cleanQueryTerm('hawaiian word for grandmother'), 'grandmother');

    // Reduplication check with existing dictionary
    const existingSet = new Set(['kokua', 'ono', 'pau']);
    const normalizedExisting = new Set(['kokua', 'ono', 'pau']);
    assert.strictEqual(cleanQueryTerm('kokua kokua', normalizedExisting), 'kokua');

    // 5. Test categorization
    console.log('5. Testing query categorization...');
    assert.strictEqual(categorizeQuery('poke bowl'), 'food');
    assert.strictEqual(categorizeQuery('howzit brah'), 'greetings');
    assert.strictEqual(categorizeQuery('mean buggah'), 'slang');
    assert.strictEqual(categorizeQuery('cute girl'), 'romance');
    assert.strictEqual(categorizeQuery('mauka direction'), 'locations');
    assert.strictEqual(categorizeQuery('random query'), 'general');

    // 6. Test missing terms discovery against dictionary
    console.log('6. Testing gap discovery & filtering against dictionary...');
    const mockDictionary = new Set(['aloha', 'mahalo', 'howzit', 'ono', 'pau hana']);
    const testQueries = [
        { keys: ['what does aloha mean'], impressions: 1000, clicks: 100, ctr: 0.1, position: 1.0 }, // In dictionary -> skip
        { keys: ['how to translate english to pidgin'], impressions: 500, clicks: 20, ctr: 0.04, position: 2.0 }, // Blacklisted -> skip
        { keys: ['what does choke mean'], impressions: 450, clicks: 35, ctr: 0.07, position: 1.5 }, // Missing! (slang)
        { keys: ['kalua pork recipe meaning'], impressions: 300, clicks: 15, ctr: 0.05, position: 3.0 }, // Missing! (food)
        { keys: ['rare low impression term'], impressions: 5, clicks: 0, ctr: 0.0, position: 12.0 } // Under threshold (20) -> skip
    ];

    const missing = findMissingTerms(testQueries, mockDictionary, 20);
    assert.strictEqual(missing.length, 2);
    assert.strictEqual(missing[0].pidgin, 'choke');
    assert.strictEqual(missing[0].impressions, 450);
    assert.strictEqual(missing[1].pidgin, 'kalua pork recipe');
    assert.strictEqual(missing[1].category, 'food');

    // 7. Test file loading (loadQueriesFromFile) with temporary files
    console.log('7. Testing file loading from disk...');
    const tmpDir = os.tmpdir();
    const tempCsvPath = path.join(tmpDir, 'test-gsc-queries.csv');
    const tempJsonPath = path.join(tmpDir, 'test-gsc-queries.json');

    fs.writeFileSync(tempCsvPath, sampleCsv, 'utf8');
    fs.writeFileSync(tempJsonPath, flatJson, 'utf8');

    try {
        const loadedFromCsv = loadQueriesFromFile(tempCsvPath);
        assert.strictEqual(loadedFromCsv.length, 4);

        const loadedFromJson = loadQueriesFromFile(tempJsonPath);
        assert.strictEqual(loadedFromJson.length, 2);
    } finally {
        if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
        if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
    }

    // 8. Test offline query auto-discovery
    console.log('8. Testing offline query auto-discovery & demo flags...');
    assert.ok(!CANDIDATE_OFFLINE_PATHS.includes(SAMPLE_DATA_PATH),
        'The packaged sample must never be auto-discovered: it would pass for real search demand');
    const csvCandidate = path.join(tmpDir, 'Queries.csv');
    fs.writeFileSync(csvCandidate, sampleCsv, 'utf8');
    try {
        assert.strictEqual(findOfflineQueryFile([path.join(tmpDir, 'nope.csv'), csvCandidate]), csvCandidate);
        assert.strictEqual(findOfflineQueryFile([path.join(tmpDir, 'nope.csv')]), null);

        // Key resolution: explicit > GOOGLE_SEARCH_CONSOLE_KEY_PATH > ./google-search-console-key.json > GA4_KEY_FILE
        const missingKey = path.join(tmpDir, 'missing-key.json');
        assert.strictEqual(resolveKeyPath(null, { GA4_KEY_FILE: csvCandidate }), csvCandidate);
        assert.strictEqual(resolveKeyPath(missingKey, { GOOGLE_SEARCH_CONSOLE_KEY_PATH: csvCandidate }), csvCandidate);
        assert.strictEqual(resolveKeyPath(null, { GA4_KEY_FILE: missingKey }), null);

        // Production has no key file: the service account arrives base64-encoded in the env
        const sa = { type: 'service_account', client_email: 'sa@example.iam.gserviceaccount.com', private_key: 'k' };
        const b64 = s => Buffer.from(s).toString('base64');
        assert.deepStrictEqual(credentialsFromEnv({ GOOGLE_CREDENTIALS_BASE64: b64(JSON.stringify(sa)) }), sa);
        assert.strictEqual(credentialsFromEnv({ GOOGLE_CREDENTIALS_BASE64: b64('not json') }), null);
        assert.strictEqual(credentialsFromEnv({ GOOGLE_CREDENTIALS_BASE64: b64('{"client_id":"x"}') }), null);
        assert.strictEqual(credentialsFromEnv({}), null);
    } finally {
        fs.unlinkSync(csvCandidate);
    }

    const demoArgs = parseCommandLineArgs(['--demo']);
    assert.ok(demoArgs.inputFile && demoArgs.inputFile.endsWith('gsc-sample-performance.csv'));

    const sampleArgs = parseCommandLineArgs(['--sample']);
    assert.ok(sampleArgs.inputFile && sampleArgs.inputFile.endsWith('gsc-sample-performance.csv'));

    // 9. Coverage: variants of existing headwords are not gaps (real GSC queries, 2026-10)
    console.log('9. Testing headword coverage for spelling variants & filler...');
    const idx = buildCoverageIndex(['brah', 'kamaʻāina', 'kuru-kuru', 'e komo mai', 'a hui hou', 'keiki', 'pau', 'howzit']);
    for (const q of ['brah def', 'brah meaing', 'brahmeaning', 'whats a brah', 'brahhh', 'brahs', 'bro vs brah',
                     'brah urban', 'meaning if brah', 'meanings of brah',
                     'kamaina', 'kamaiana', 'kuru kuru', 'komo mai', 'hui hou', 'keikei', 'keikis', 'a pau', 'howzit brah']) {
        assert.ok(coveredBy(q, idx), `"${q}" should resolve to an existing headword`);
    }
    for (const q of ['blalah', 'tantadan', 'das cherreh', 'daikon legs', 'live pono', 'bro']) {
        assert.strictEqual(coveredBy(q, idx), null, `"${q}" is a real gap`);
    }
    const rows = [{ keys: ['"shoots with fabian"'], impressions: 50 }, { keys: ['da jesus book pdf'], impressions: 50 },
                  { keys: ['brah meaning'], impressions: 50 }, { keys: ['how do you say daikon legs'], impressions: 50 },
                  { keys: ['list of words in pidgin'], impressions: 50 }];
    assert.deepStrictEqual(findMissingTerms(rows, new Set(['brah']), 20).map(m => m.pidgin), ['daikon legs']);

    // 10. English meanings are coverage: before services/search-gaps.js the CLI reported these
    // real GSC queries (2026-10) as missing Pidgin words, and ingesting them made duplicates
    console.log('10. Testing English-meaning coverage (shared with the admin sync)...');
    const entries = [
        { pidgin: 'braddah', english: ['brother', 'bro', 'friend'] },
        { pidgin: 'keiki', english: ['child', 'children', 'kid', 'kids', 'baby'] },
        { pidgin: 'mahalo', english: ['thank you', 'appreciate'] },
        { pidgin: "fa'afetai", english: ['thank you (Samoan)'] },
        { pidgin: 'moe moe', english: ['sleepy', 'go to sleep (said to kids)'] },
        { pidgin: 'minors', english: ['no problem'] },
        { pidgin: 'uku pau', english: ['to pay off completely'] },
        { pidgin: 'huhu', english: ['angry; upset'] },
        { pidgin: 'mauka', english: ['towards the mountain'] },
        { pidgin: 'kamaʻāina', spelling_variants: ['kamaaina'], english: ['local resident'] }
    ];
    const eidx = buildCoverageIndex(entries);
    for (const [q, via] of [['brother', 'english'], ['kids', 'english'], ['children', 'english'], ['thank you', 'english'],
                            ['go to sleep', 'english'], ['pay off completely', 'english'], ['upset', 'english'],
                            ['brothers', 'english'], ['towards mountain', 'english'], ['kamaaina', 'headword'], ['kamaiana', 'near']]) {
        assert.strictEqual(coverage(q, eidx)?.via, via, `"${q}" should be covered via ${via}`);
    }
    assert.strictEqual(coveredBy('thank you', eidx), 'mahalo', 'An unqualified gloss outranks "thank you (Samoan)"');
    // Only whole glosses: words inside one are not coverage ("problems" is not "no problem")
    for (const q of ['problems', 'said', 'pay', 'local', 'painful']) {
        assert.strictEqual(coveredBy(q, eidx), null, `"${q}" is a real gap`);
    }
    const gscRows = ['brother', 'thank you', 'kids', 'painful'].map(q => ({ keys: [q], impressions: 50 }));
    assert.deepStrictEqual(findMissingTerms(gscRows, entries, 20).map(m => m.pidgin), ['painful']);

    // 11. Closing resolved search_gaps rows: 'near' matches stay pending for a person to judge
    console.log('11. Testing closeResolvedGaps against a mock search_gaps table...');
    const gapRows = [{ id: 1, term: 'brother' }, { id: 2, term: 'kamaiana' }, { id: 3, term: 'painful' },
                     { id: 4, term: 'what does keiki mean' },
                     // escaped by express-validator before 37fd9f68
                     { id: 5, term: '&#x27;brother&#x27;' }];
    const updates = [];
    const mockDb = {
        from: table => {
            assert.strictEqual(table, 'search_gaps');
            const q = {
                select: () => q, eq: () => q, order: () => q,
                range: async (from) => ({ data: from === 0 ? gapRows : [], error: null }),
                update: patch => ({ in: async (col, ids) => { updates.push({ patch, ids }); return { error: null }; } })
            };
            return q;
        }
    };
    const dry = await closeResolvedGaps(mockDb, { entries, dryRun: true });
    assert.strictEqual(dry.pending, 5);
    assert.deepStrictEqual(dry.closed.map(g => g.id), [1, 4, 5]);
    assert.strictEqual(updates.length, 0, 'A dry run writes nothing');
    await closeResolvedGaps(mockDb, { entries });
    assert.deepStrictEqual(updates, [{ patch: { status: 'added' }, ids: [1, 4, 5] }]);

    // 12. Paging: PostgREST stops at 1,000 rows, and unordered pages can skip or repeat rows
    console.log('12. Testing fetchAllRows paging past 1,000 rows...');
    const table = Array.from({ length: 2345 }, (_, i) => ({ id: i }));
    const calls = [];
    const pagingDb = {
        from: () => {
            const q = { ordered: null };
            q.select = () => q;
            q.eq = () => q;
            q.order = (col) => { q.ordered = col; return q; };
            q.range = async (from, to) => { calls.push({ from, to, ordered: q.ordered }); return { data: table.slice(from, to + 1), error: null }; };
            return q;
        }
    };
    const all = await fetchAllRows(pagingDb, 'dictionary_entries', 'id');
    assert.strictEqual(all.length, 2345);
    assert.deepStrictEqual(calls.map(c => [c.from, c.to]), [[0, 999], [1000, 1999], [2000, 2999]]);
    assert.ok(calls.every(c => c.ordered === 'id'), 'Every page must be ordered by a unique column');

    console.log('\n🎉 All SEO Feedback Loop tests passed successfully!\n');
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
