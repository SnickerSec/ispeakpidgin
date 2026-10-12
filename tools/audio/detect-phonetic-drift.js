#!/usr/bin/env node

/**
 * Phonetic Drift Detection & Audio Cache Synchronizer
 *
 * Tracks changes in PIDGIN_PRONUNCIATION_MAP and identifies terms where
 * modified phonetic transformations make cached audio stale.
 *
 * Usage:
 *   node tools/audio/detect-phonetic-drift.js                  # Inspect drift against manifest
 *   node tools/audio/detect-phonetic-drift.js --sync           # Invalidate drifted cache & update manifest
 *   node tools/audio/detect-phonetic-drift.js --init           # Initialize/reset manifest from current map
 *   node tools/audio/detect-phonetic-drift.js --json           # Machine-readable output
 *   node tools/audio/detect-phonetic-drift.js --strict         # Exit 1 if any drift detected
 *
 * NPM scripts:
 *   npm run audio:drift       -> detect-phonetic-drift.js
 *   npm run audio:sync-map    -> detect-phonetic-drift.js --sync
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const {
    PIDGIN_PRONUNCIATION_MAP,
    applyPronunciationCorrections
} = require('../../src/components/speech/elevenlabs-speech.js');

const { invalidateTerm } = require('./invalidate-audio.js');

const MANIFEST_PATH = path.join(__dirname, 'phonetic-manifest.json');

/**
 * Compute MD5 hash of target spoken phonetics for every term in the map.
 * @param {Record<string, string>} map - Pronunciation map
 * @param {(text: string) => string} [transformFn] - Phonetic correction function
 * @returns {Record<string, { spoken: string, hash: string }>}
 */
function computePhoneticHashes(map = PIDGIN_PRONUNCIATION_MAP, transformFn = applyPronunciationCorrections) {
    const hashes = {};
    for (const [term, respelling] of Object.entries(map)) {
        const spoken = transformFn ? transformFn(term) : respelling;
        const hash = crypto.createHash('md5').update(spoken.trim().toLowerCase()).digest('hex');
        hashes[term] = { spoken, hash };
    }
    return hashes;
}

/**
 * Compare live computed hashes against a stored manifest.
 * @param {Record<string, { spoken: string, hash: string }>} liveHashes
 * @param {Record<string, string>} storedManifest - Map of term to hash
 * @returns {{ clean: string[], modified: string[], added: string[], removed: string[] }}
 */
function compareManifests(liveHashes, storedManifest = {}) {
    const clean = [];
    const modified = [];
    const added = [];
    const liveKeys = new Set(Object.keys(liveHashes));
    const storedKeys = new Set(Object.keys(storedManifest));

    for (const [term, data] of Object.entries(liveHashes)) {
        if (!storedKeys.has(term)) {
            added.push(term);
        } else if (storedManifest[term] !== data.hash) {
            modified.push(term);
        } else {
            clean.push(term);
        }
    }

    const removed = [];
    for (const term of storedKeys) {
        if (!liveKeys.has(term)) {
            removed.push(term);
        }
    }

    return { clean, modified, added, removed };
}

/**
 * Load the stored manifest from disk.
 * @param {string} [manifestPath]
 * @returns {Record<string, string>}
 */
function loadManifest(manifestPath = MANIFEST_PATH) {
    if (!fs.existsSync(manifestPath)) {
        return {};
    }
    try {
        const raw = fs.readFileSync(manifestPath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

/**
 * Save the manifest to disk.
 * @param {Record<string, string>} manifest
 * @param {string} [manifestPath]
 */
function saveManifest(manifest, manifestPath = MANIFEST_PATH) {
    const sorted = {};
    for (const key of Object.keys(manifest).sort()) {
        sorted[key] = manifest[key];
    }
    fs.writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

/**
 * Parse CLI arguments.
 */
function parseArgs(argv) {
    const args = argv.slice(2);
    return {
        sync: args.includes('--sync') || args.includes('--fix'),
        init: args.includes('--init'),
        json: args.includes('--json'),
        strict: args.includes('--strict'),
        help: args.includes('--help') || args.includes('-h')
    };
}

async function main() {
    const opts = parseArgs(process.argv);

    if (opts.help) {
        console.log(`
Phonetic Drift Detection & Audio Cache Synchronizer
Usage:
  node tools/audio/detect-phonetic-drift.js [flags]

Flags:
  --sync, --fix   Invalidate audio cache for drifted terms and update manifest
  --init          Initialize or regenerate manifest from current pronunciation map
  --json          Output results as JSON
  --strict        Exit with code 1 if any drift is found
  --help, -h      Show this help message
`);
        process.exit(0);
    }

    const liveHashes = computePhoneticHashes();
    const storedManifest = loadManifest();
    const hasExistingManifest = fs.existsSync(MANIFEST_PATH);

    // If --init is passed, or no manifest exists yet and --sync is passed
    if (opts.init || (!hasExistingManifest && opts.sync)) {
        const initial = {};
        for (const [term, data] of Object.entries(liveHashes)) {
            initial[term] = data.hash;
        }
        saveManifest(initial);
        if (opts.json) {
            console.log(JSON.stringify({ status: 'initialized', entries: Object.keys(initial).length }));
        } else {
            console.log(`✅ Initialized phonetic manifest at ${MANIFEST_PATH} with ${Object.keys(initial).length} entries.`);
        }
        process.exit(0);
    }

    if (!hasExistingManifest) {
        if (!opts.json) {
            console.warn(`⚠️ No manifest found at ${MANIFEST_PATH}. Run with --init or --sync to generate the baseline.`);
        }
    }

    const diff = compareManifests(liveHashes, storedManifest);
    const totalTerms = Object.keys(liveHashes).length;
    const hasDrift = diff.modified.length > 0 || diff.added.length > 0 || diff.removed.length > 0;

    if (opts.json) {
        console.log(JSON.stringify({
            total: totalTerms,
            cleanCount: diff.clean.length,
            driftCount: diff.modified.length + diff.added.length + diff.removed.length,
            diff,
            synced: opts.sync
        }, null, 2));
    } else {
        console.log(`\n🔍 Phonetic Drift Audit: PIDGIN_PRONUNCIATION_MAP`);
        console.log(`===============================================`);
        console.log(`Total map terms:     ${totalTerms}`);
        console.log(`Clean (unchanged):   ${diff.clean.length}`);
        console.log(`Modified phonetics:  ${diff.modified.length}`);
        console.log(`New terms:           ${diff.added.length}`);
        console.log(`Removed from map:    ${diff.removed.length}`);

        if (diff.modified.length > 0) {
            console.log(`\n⚠️  Modified terms requiring cache refresh:`);
            diff.modified.forEach(t => console.log(`   • ${t}`));
        }

        if (diff.added.length > 0) {
            console.log(`\n✨ New terms (fresh audio ready):`);
            diff.added.forEach(t => console.log(`   • ${t}`));
        }

        if (diff.removed.length > 0) {
            console.log(`\n🗑️  Removed terms:`);
            diff.removed.forEach(t => console.log(`   • ${t}`));
        }
    }

    if (opts.sync) {
        const termsToInvalidate = [...diff.modified];
        if (termsToInvalidate.length > 0) {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (supabaseUrl && supabaseKey) {
                const db = createClient(supabaseUrl, supabaseKey);
                console.log(`\n🔄 Invalidating audio cache for ${termsToInvalidate.length} modified terms in Supabase...`);
                for (const term of termsToInvalidate) {
                    await invalidateTerm(db, term, { dryRun: false, fuzzy: false });
                }
            } else {
                console.warn(`\n⚠️ Supabase credentials not set; skipping live cache purge.`);
            }
        }

        // Update manifest
        const updated = {};
        for (const [term, data] of Object.entries(liveHashes)) {
            updated[term] = data.hash;
        }
        saveManifest(updated);
        console.log(`\n💾 Saved updated phonetic manifest (${Object.keys(updated).length} terms).`);
    }

    if (opts.strict && hasDrift && !opts.sync) {
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(err => {
        console.error('Fatal error in detect-phonetic-drift:', err);
        process.exit(1);
    });
}

module.exports = {
    computePhoneticHashes,
    compareManifests,
    loadManifest,
    saveManifest,
    MANIFEST_PATH
};
