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
    parseCommandLineArgs
} = require('../seo/feedback-loop.js');

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

    console.log('\n🎉 All SEO Feedback Loop tests passed successfully!\n');
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
