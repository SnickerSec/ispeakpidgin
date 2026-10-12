#!/usr/bin/env node
/**
 * Unit Tests for Audio Cache Invalidation Tool (tools/audio/invalidate-audio.js)
 */

const assert = require('assert').strict;
const {
    parseCommandLineArgs,
    generateVariations,
    inspectTerm,
    invalidateTerm
} = require('../audio/invalidate-audio.js');

const {
    computePhoneticHashes,
    compareManifests
} = require('../audio/detect-phonetic-drift.js');

async function runTests() {
    console.log('🧪 Testing Audio Cache Invalidation Tool...\n');

    // 1. Test CLI argument parser
    console.log('1. Testing CLI argument parser...');
    const parsed1 = parseCommandLineArgs(['node', 'script.js', 'puʻuwai']);
    assert.deepStrictEqual(parsed1.terms, ['puʻuwai']);
    assert.strictEqual(parsed1.check, false);
    assert.strictEqual(parsed1.dryRun, false);

    const parsed2 = parseCommandLineArgs([
        'node', 'script.js',
        '--check',
        '--fuzzy',
        '-t', 'shoots',
        'brah',
        '--dry-run'
    ]);
    assert.strictEqual(parsed2.check, true);
    assert.strictEqual(parsed2.fuzzy, true);
    assert.strictEqual(parsed2.dryRun, true);
    assert.deepStrictEqual(parsed2.terms, ['shoots', 'brah']);

    const parsed3 = parseCommandLineArgs(['node', 'script.js', '--all', '--confirm']);
    assert.strictEqual(parsed3.all, true);
    assert.strictEqual(parsed3.confirm, true);

    const parsed4 = parseCommandLineArgs(['node', 'script.js', '-h']);
    assert.strictEqual(parsed4.help, true);

    // 2. Test generateVariations
    console.log('2. Testing generateVariations (orthography, okina & kahako)...');
    const vars1 = generateVariations('puʻuwai');
    assert.ok(vars1.texts.includes('puʻuwai'), 'Should include original with standard okina');
    assert.ok(vars1.texts.includes('puuwai'), 'Should include okina-stripped text');
    assert.ok(vars1.texts.includes("pu'uwai"), 'Should include ascii apostrophe text');
    assert.ok(vars1.hashes.length >= 2, 'Should compute distinct MD5 hashes');

    // Test kahako stripping
    const vars2 = generateVariations('kāne');
    assert.ok(vars2.texts.includes('kane'), 'Should strip macron from ā');

    // Test empty or null input
    const varsEmpty = generateVariations('');
    assert.deepStrictEqual(varsEmpty.texts, []);
    assert.deepStrictEqual(varsEmpty.hashes, []);

    // 3. Test mock DB and storage operations
    console.log('3. Testing mock cache inspection and dry-run safety...');

    // Mock Supabase client
    const mockStorageFiles = new Set(['986a931e239eef0b18fdf3cc3630def0.mp3', 'index.json']);
    const mockIndex = {
        'puʻuwai': '986a931e239eef0b18fdf3cc3630def0.mp3'
    };
    const mockDbRows = [
        {
            id: 2563,
            original_text: 'puʻuwai',
            translated_text: 'poo-oo-wye',
            direction: 'tts',
            voice_id: 'f0ODjLMfcJmlKfs7dFCW',
            audio_filename: '986a931e239eef0b18fdf3cc3630def0.mp3',
            md5_hash: '986a931e239eef0b18fdf3cc3630def0'
        }
    ];

    let deleteDbCalledWith = null;
    let removeStorageCalledWith = null;
    let uploadedIndexJson = null;

    const mockDb = {
        from: (table) => {
            assert.strictEqual(table, 'translation_cache');
            return {
                select: () => ({
                    eq: () => ({
                        in: (_col, hashes) => {
                            const matched = mockDbRows.filter(r => hashes.includes(r.md5_hash));
                            return Promise.resolve({ data: matched, error: null });
                        },
                        ilike: (_col, pattern) => {
                            const p = pattern.replace(/%/g, '').toLowerCase();
                            const matched = mockDbRows.filter(r => r.original_text.toLowerCase().includes(p));
                            return Promise.resolve({ data: matched, error: null });
                        }
                    })
                }),
                delete: () => ({
                    in: (_col, ids) => {
                        deleteDbCalledWith = ids;
                        return Promise.resolve({ error: null });
                    }
                })
            };
        },
        storage: {
            from: (bucket) => {
                assert.strictEqual(bucket, 'audio-assets');
                return {
                    download: (filename) => {
                        if (filename === 'index.json') {
                            return Promise.resolve({
                                data: {
                                    text: async () => JSON.stringify(mockIndex)
                                },
                                error: null
                            });
                        }
                        return Promise.resolve({ data: null, error: { message: 'Not found' } });
                    },
                    list: (_path, opts) => {
                        const search = opts && opts.search;
                        if (search && mockStorageFiles.has(search)) {
                            return Promise.resolve({ data: [{ name: search }], error: null });
                        }
                        return Promise.resolve({ data: [], error: null });
                    },
                    remove: (files) => {
                        removeStorageCalledWith = files;
                        return Promise.resolve({ error: null });
                    },
                    upload: (filename, buffer) => {
                        if (filename === 'index.json') {
                            uploadedIndexJson = JSON.parse(buffer.toString('utf8'));
                        }
                        return Promise.resolve({ error: null });
                    }
                };
            }
        }
    };

    // Test inspectTerm
    const inspected = await inspectTerm(mockDb, 'puʻuwai');
    assert.strictEqual(inspected.dbRows.length, 1);
    assert.strictEqual(inspected.dbRows[0].id, 2563);
    assert.strictEqual(inspected.matchedIndexKeys.length, 1);
    assert.strictEqual(inspected.matchedIndexKeys[0].key, 'puʻuwai');
    assert.ok(inspected.existingBucketFiles.includes('986a931e239eef0b18fdf3cc3630def0.mp3'));

    // Test dry-run: should NOT invoke delete methods
    const dryRunResult = await invalidateTerm(mockDb, 'puʻuwai', { dryRun: true });
    assert.strictEqual(dryRunResult.isDryRun, true);
    assert.deepStrictEqual(dryRunResult.deletedDbRowIds, [2563]);
    assert.strictEqual(deleteDbCalledWith, null, 'Dry-run must not delete from DB');
    assert.strictEqual(removeStorageCalledWith, null, 'Dry-run must not delete from Storage');

    // Test active execution: should invoke delete methods and clean index
    console.log('4. Testing active cache invalidation execution...');
    const activeResult = await invalidateTerm(mockDb, 'puʻuwai', { dryRun: false });
    assert.strictEqual(activeResult.isDryRun, false);
    assert.deepStrictEqual(deleteDbCalledWith, [2563], 'Should delete matching translation_cache row IDs');
    assert.deepStrictEqual(removeStorageCalledWith, ['986a931e239eef0b18fdf3cc3630def0.mp3'], 'Should delete matching storage files');
    // Test 5: Phonetic drift detection and manifest diff
    console.log('5. Testing phonetic drift detection & manifest comparison...');
    const testMap = {
        'ono': 'oh-noh',
        'brah': 'brah',
        'pau': 'pow'
    };
    const computed = computePhoneticHashes(testMap, (t) => testMap[t]);
    assert.strictEqual(Object.keys(computed).length, 3);
    assert.ok(computed['ono'].hash);

    const storedBaseline = {
        'ono': computed['ono'].hash,
        'brah': 'stale_hash_value', // modified
        'old_term': 'some_hash'     // removed
        // 'pau' is missing -> added
    };

    const diff = compareManifests(computed, storedBaseline);
    assert.deepStrictEqual(diff.clean, ['ono']);
    assert.deepStrictEqual(diff.modified, ['brah']);
    assert.deepStrictEqual(diff.added, ['pau']);
    assert.deepStrictEqual(diff.removed, ['old_term']);

    console.log('\n✅ All Audio Cache Invalidation & Drift unit tests passed successfully!\n');
}

if (require.main === module) {
    runTests().catch(err => {
        console.error('❌ Audio cache invalidation test failed:', err);
        process.exit(1);
    });
}

module.exports = { runTests };
