#!/usr/bin/env node
/**
 * Audio Cache Invalidation CLI Tool for ChokePidgin / iSpeakPidgin
 *
 * Purges stale audio files, index references, and translation_cache database rows
 * when phonetic respellings, pronunciations, or vocabulary entries change.
 *
 * Usage:
 *   node tools/audio/invalidate-audio.js <term>               # Invalidate single term
 *   node tools/audio/invalidate-audio.js "ono" "shoots"       # Invalidate multiple terms
 *   node tools/audio/invalidate-audio.js --check <term>       # Inspect cache status without modifying
 *   node tools/audio/invalidate-audio.js --dry-run <term>     # Preview what would be deleted
 *   node tools/audio/invalidate-audio.js --fuzzy <term>       # Match terms containing the search string
 *   node tools/audio/invalidate-audio.js --all --confirm      # Purge entire TTS cache (requires --confirm)
 *
 * NPM shortcut:
 *   npm run audio:invalidate -- <term>
 *   npm run audio:invalidate -- --check <term>
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const BUCKET_NAME = 'audio-assets';
const TTS_DIRECTION = 'tts';
const KIMO_VOICE_ID = 'f0ODjLMfcJmlKfs7dFCW';
const AUDIO_DIR = path.join(__dirname, '../../public/assets/audio');
const LOCAL_INDEX_FILE = path.join(AUDIO_DIR, 'index.json');

/**
 * Parse CLI arguments into structured configuration.
 */
function parseCommandLineArgs(argv) {
    const config = {
        terms: [],
        check: false,
        dryRun: false,
        fuzzy: false,
        all: false,
        confirm: false,
        help: false
    };

    const args = argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--help' || arg === '-h') {
            config.help = true;
        } else if (arg === '--check') {
            config.check = true;
        } else if (arg === '--dry-run') {
            config.dryRun = true;
        } else if (arg === '--fuzzy') {
            config.fuzzy = true;
        } else if (arg === '--all') {
            config.all = true;
        } else if (arg === '--confirm') {
            config.confirm = true;
        } else if (arg === '--term' || arg === '-t') {
            if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                config.terms.push(args[++i]);
            }
        } else if (!arg.startsWith('-')) {
            config.terms.push(arg);
        }
    }

    return config;
}

/**
 * Generate phonetic/orthographic variations of a term (handling ʻokina and macrons)
 * and calculate their corresponding MD5 hashes.
 */
function generateVariations(term) {
    if (!term || typeof term !== 'string') {
        return { texts: [], hashes: [] };
    }

    const raw = term.trim().toLowerCase();
    const texts = new Set([raw]);

    // Decomposed unicode to strip diacritics / kahakō macrons (ā -> a, ē -> e, etc.)
    const strippedKahako = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    texts.add(strippedKahako);

    // Common okina and apostrophe characters: ʻ (\u02bb), ’ (\u2019), ‘ (\u2018), ' (\u0027), ` (\u0060)
    const okinaRegex = /[\u02BB'‘’`]/g;
    const noOkina = raw.replace(okinaRegex, '');
    const okinaStandard = raw.replace(okinaRegex, 'ʻ');
    const okinaAscii = raw.replace(okinaRegex, "'");

    texts.add(noOkina);
    texts.add(okinaStandard);
    texts.add(okinaAscii);

    texts.add(strippedKahako.replace(okinaRegex, ''));
    texts.add(strippedKahako.replace(okinaRegex, 'ʻ'));
    texts.add(strippedKahako.replace(okinaRegex, "'"));

    const validTexts = Array.from(texts).filter(t => t.length > 0);
    const hashes = Array.from(new Set(validTexts.map(t => crypto.createHash('md5').update(t).digest('hex'))));

    return { texts: validTexts, hashes };
}

/**
 * Download and parse index.json from Supabase Storage.
 */
/**
 * Download and parse index.json from Supabase Storage with CDN cache-busting.
 */
async function loadStorageIndex(db) {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && key) {
            const url = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/index.json?t=${Date.now()}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${key}` },
                cache: 'no-store'
            });
            if (res.ok) {
                const json = await res.json();
                return { index: json, exists: true };
            }
        }
        const { data, error } = await db.storage.from(BUCKET_NAME).download('index.json');
        if (error || !data) return { index: {}, exists: false };
        const text = await data.text();
        return { index: JSON.parse(text), exists: true };
    } catch {
        return { index: {}, exists: false };
    }
}

/**
 * Query translation_cache for entries matching hashes or text patterns.
 */
async function findDatabaseMatches(db, variations, fuzzy) {
    const { texts, hashes } = variations;
    const results = new Map();

    // 1. Query by MD5 hash
    if (hashes.length > 0) {
        const { data, error } = await db
            .from('translation_cache')
            .select('id, original_text, translated_text, direction, voice_id, audio_filename, md5_hash')
            .eq('direction', TTS_DIRECTION)
            .in('md5_hash', hashes);

        if (!error && Array.isArray(data)) {
            for (const row of data) {
                results.set(row.id, row);
            }
        }
    }

    // 2. Query by text matches (ILIKE)
    for (const text of texts) {
        const queryPattern = fuzzy ? `%${text}%` : text;
        const { data, error } = await db
            .from('translation_cache')
            .select('id, original_text, translated_text, direction, voice_id, audio_filename, md5_hash')
            .eq('direction', TTS_DIRECTION)
            .ilike('original_text', queryPattern);

        if (!error && Array.isArray(data)) {
            for (const row of data) {
                results.set(row.id, row);
            }
        }
    }

    // 3. For queries without okina, match okina-interspersed patterns in translation_cache
    // e.g. "puuwai" -> "p%u%u%w%a%i" matches "puʻuwai"
    const okinaRegex = /[\u02BB'‘’`]/;
    for (const text of texts) {
        if (!okinaRegex.test(text) && text.length >= 3 && !fuzzy) {
            const pattern = text.split('').join('%');
            const { data } = await db
                .from('translation_cache')
                .select('id, original_text, translated_text, direction, voice_id, audio_filename, md5_hash')
                .eq('direction', TTS_DIRECTION)
                .ilike('original_text', pattern);

            if (data && Array.isArray(data)) {
                for (const row of data) {
                    const strippedRow = (row.original_text || '').toLowerCase().replace(/[\u02BB'‘’`\s-]/g, '');
                    const strippedQuery = text.replace(/[\s-]/g, '');
                    if (strippedRow === strippedQuery) {
                        results.set(row.id, row);
                    }
                }
            }
        }
    }

    return Array.from(results.values());
}

/**
 * Inspect cache coverage for a term across DB, storage bucket, and index.json.
 */
async function inspectTerm(db, term, options = {}) {
    const variations = generateVariations(term);
    const dbRows = await findDatabaseMatches(db, variations, options.fuzzy);

    // Expand variations with discovered DB rows so index/storage checks catch canonical forms
    for (const row of dbRows) {
        if (row.original_text) {
            const rowVars = generateVariations(row.original_text);
            for (const t of rowVars.texts) {
                if (!variations.texts.includes(t)) variations.texts.push(t);
            }
            for (const h of rowVars.hashes) {
                if (!variations.hashes.includes(h)) variations.hashes.push(h);
            }
        }
    }

    const { index } = await loadStorageIndex(db);

    // Check index keys (exact, fuzzy, or stripped-okina match, or filename match)
    const matchedIndexKeys = [];
    const lowerKeys = Object.keys(index);
    const dbFilenames = new Set(dbRows.map(r => r.audio_filename).filter(Boolean));

    for (const key of lowerKeys) {
        const lowerKey = key.toLowerCase();
        const strippedKey = lowerKey.replace(/[\u02BB'‘’`\s-]/g, '');
        const filename = index[key];

        const matchesText = variations.texts.includes(lowerKey);
        const matchesStripped = variations.texts.some(t => t.replace(/[\u02BB'‘’`\s-]/g, '') === strippedKey);
        const matchesFilename = filename && dbFilenames.has(filename);
        const matchesFuzzy = options.fuzzy && variations.texts.some(t => lowerKey.includes(t));

        if (matchesText || matchesStripped || matchesFilename || matchesFuzzy) {
            matchedIndexKeys.push({ key, filename });
        }
    }

    // Gather candidate filenames
    const candidateFiles = new Set();
    for (const row of dbRows) {
        if (row.audio_filename) candidateFiles.add(row.audio_filename);
    }
    for (const match of matchedIndexKeys) {
        if (match.filename) candidateFiles.add(match.filename);
    }
    for (const hash of variations.hashes) {
        candidateFiles.add(`${hash}.mp3`);
        candidateFiles.add(`cached_${KIMO_VOICE_ID}_${hash}.mp3`);
    }

    // Check which candidate files actually exist in bucket
    const existingBucketFiles = [];
    for (const filename of candidateFiles) {
        const { data, error } = await db.storage.from(BUCKET_NAME).list('', {
            search: filename
        });
        if (!error && Array.isArray(data) && data.some(o => o.name === filename)) {
            existingBucketFiles.push(filename);
        }
    }

    return {
        term,
        variations,
        dbRows,
        matchedIndexKeys,
        candidateFiles: Array.from(candidateFiles),
        existingBucketFiles
    };
}

/**
 * Invalidate cached audio for a specific term or variations.
 */
async function invalidateTerm(db, term, options = {}) {
    const inspection = await inspectTerm(db, term, options);
    const isDryRun = options.dryRun || false;

    const result = {
        term,
        isDryRun,
        deletedDbRowIds: inspection.dbRows.map(r => r.id),
        deletedDbRows: inspection.dbRows,
        deletedIndexKeys: inspection.matchedIndexKeys.map(k => k.key),
        deletedBucketFiles: inspection.existingBucketFiles,
        status: 'clean'
    };

    if (isDryRun) {
        return result;
    }

    // 1. Delete rows from translation_cache
    if (result.deletedDbRowIds.length > 0) {
        const { error: dbError } = await db
            .from('translation_cache')
            .delete()
            .in('id', result.deletedDbRowIds);

        if (dbError) {
            console.error(`  ⚠️ Error deleting translation_cache rows for "${term}": ${dbError.message}`);
        }
    }

    // 2. Delete files from storage bucket
    if (result.deletedBucketFiles.length > 0) {
        const { error: storageError } = await db.storage
            .from(BUCKET_NAME)
            .remove(result.deletedBucketFiles);

        if (storageError) {
            console.error(`  ⚠️ Error removing storage files for "${term}": ${storageError.message}`);
        }
    }

    // 3. Update storage index.json if keys matched
    if (result.deletedIndexKeys.length > 0) {
        const { index, exists } = await loadStorageIndex(db);
        if (exists) {
            let modified = false;
            for (const key of result.deletedIndexKeys) {
                if (key in index) {
                    delete index[key];
                    modified = true;
                }
            }

            if (modified) {
                const indexStr = JSON.stringify(index, null, 2);
                await db.storage.from(BUCKET_NAME).upload('index.json', Buffer.from(indexStr), {
                    contentType: 'application/json',
                    upsert: true
                });

                // Update local index file if it exists
                if (fs.existsSync(LOCAL_INDEX_FILE)) {
                    try {
                        fs.writeFileSync(LOCAL_INDEX_FILE, indexStr, 'utf8');
                    } catch {}
                }
            }
        }
    }

    // 4. Remove local audio files if they exist in public/assets/audio
    if (fs.existsSync(AUDIO_DIR)) {
        for (const file of result.deletedBucketFiles) {
            const localFile = path.join(AUDIO_DIR, file);
            if (fs.existsSync(localFile)) {
                try {
                    fs.unlinkSync(localFile);
                } catch {}
            }
        }
    }

    return result;
}

/**
 * Purge entire TTS cache and storage files (requires --confirm).
 */
async function invalidateAll(db, options = {}) {
    const isDryRun = options.dryRun || false;

    // 1. Count translation_cache TTS rows
    const { count, error: countError } = await db
        .from('translation_cache')
        .select('*', { count: 'exact', head: true })
        .eq('direction', TTS_DIRECTION);

    if (countError) throw new Error(`Failed to count translation_cache rows: ${countError.message}`);

    // 2. Collect cached_* and bare hash files in bucket
    const objects = [];
    for (let offset = 0; ; ) {
        const { data, error } = await db.storage.from(BUCKET_NAME).list('', { limit: 1000, offset });
        if (error) throw new Error(`Bucket listing failed: ${error.message}`);
        if (!data || !data.length) break;
        objects.push(...data.map(o => o.name));
        offset += data.length;
        if (data.length < 1000) break;
    }

    const ttsFiles = objects.filter(n => /^cached_/.test(n) || /^[0-9a-f]{32}\.mp3$/.test(n));

    const result = {
        totalDbRows: count || 0,
        totalStorageFiles: ttsFiles.length,
        isDryRun
    };

    if (isDryRun) {
        return result;
    }

    // Purge DB rows
    const { error: deleteDbError } = await db
        .from('translation_cache')
        .delete()
        .eq('direction', TTS_DIRECTION);

    if (deleteDbError) throw new Error(`Failed to delete DB rows: ${deleteDbError.message}`);

    // Purge bucket files in batches of 100
    let filesDeleted = 0;
    for (let i = 0; i < ttsFiles.length; i += 100) {
        const batch = ttsFiles.slice(i, i + 100);
        const { error: removeError } = await db.storage.from(BUCKET_NAME).remove(batch);
        if (!removeError) filesDeleted += batch.length;
    }

    // Reset index.json
    await db.storage.from(BUCKET_NAME).upload('index.json', Buffer.from('{}'), {
        contentType: 'application/json',
        upsert: true
    });

    result.filesDeleted = filesDeleted;
    return result;
}

function printHelp() {
    console.log(`
🌺 ChokePidgin Audio Cache Invalidation Tool
==================================================
Purges cached audio clips, database index rows, and storage index references
when pronunciation rules, phonetic maps, or dictionary definitions change.

Usage:
  node tools/audio/invalidate-audio.js <term> [terms...]
  npm run audio:invalidate -- <term>

Options:
  --check               Inspect cache status for the term without modifying anything
  --dry-run             Show what database rows and storage files would be deleted
  --fuzzy               Match any cached text containing the term string
  --term, -t <term>     Specify term explicitly
  --all                 Target ALL cached TTS audio (requires --confirm)
  --confirm             Required confirmation flag when using --all
  --help, -h            Show this help documentation

Examples:
  # Check if "puʻuwai" has cached audio
  node tools/audio/invalidate-audio.js --check "puʻuwai"

  # Preview invalidation for "ono"
  node tools/audio/invalidate-audio.js --dry-run "ono"

  # Invalidate cached audio for "puʻuwai"
  node tools/audio/invalidate-audio.js "puʻuwai"

  # Invalidate multiple terms at once
  node tools/audio/invalidate-audio.js "shoots" "brah" "da kine"
`);
}

async function main() {
    const config = parseCommandLineArgs(process.argv);

    if (config.help) {
        printHelp();
        process.exit(0);
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
        console.error('   A service-role key is required to manage storage and translation_cache.');
        process.exit(1);
    }

    const db = createClient(supabaseUrl, supabaseServiceKey);

    if (config.all) {
        if (!config.confirm) {
            console.error('\n⚠️  SAFETY HALT: Purging all audio requires explicit --confirm flag:');
            console.error('   node tools/audio/invalidate-audio.js --all --confirm\n');
            process.exit(1);
        }

        console.log('\n🚨 Purging ALL cached TTS audio and database records...');
        if (config.dryRun) console.log('   (DRY RUN - No changes will be made)\n');

        const result = await invalidateAll(db, { dryRun: config.dryRun });
        console.log(`\n✅ Summary:`);
        console.log(`   Database rows ${config.dryRun ? 'to delete' : 'deleted'}: ${result.totalDbRows}`);
        console.log(`   Storage files ${config.dryRun ? 'to delete' : 'deleted'}: ${result.filesDeleted ?? result.totalStorageFiles}`);
        return;
    }

    if (config.terms.length === 0) {
        console.error('❌ Error: No terms specified. Provide a term or use --help for instructions.');
        process.exit(1);
    }

    console.log(`\n🎙️ ChokePidgin Audio Cache Invalidation`);
    console.log(`========================================`);
    if (config.check) console.log(`Mode: INSPECT ONLY (--check)\n`);
    else if (config.dryRun) console.log(`Mode: PREVIEW (--dry-run)\n`);
    else console.log(`Mode: INVALIDATE & PURGE\n`);

    for (const term of config.terms) {
        console.log(`🔍 Inspecting term: "${term}"`);

        if (config.check) {
            const status = await inspectTerm(db, term, { fuzzy: config.fuzzy });
            console.log(`   Text variations:        ${status.variations.texts.join(', ')}`);
            console.log(`   MD5 Hashes:             ${status.variations.hashes.join(', ')}`);
            console.log(`   Database rows found:    ${status.dbRows.length}`);
            for (const row of status.dbRows) {
                console.log(`     • [ID ${row.id}] "${row.original_text}" -> "${row.translated_text}" (${row.audio_filename})`);
            }
            console.log(`   Storage index entries:  ${status.matchedIndexKeys.length}`);
            for (const match of status.matchedIndexKeys) {
                console.log(`     • "${match.key}" => ${match.filename}`);
            }
            console.log(`   Bucket files existing:  ${status.existingBucketFiles.length}`);
            for (const file of status.existingBucketFiles) {
                console.log(`     • ${file}`);
            }
            if (status.dbRows.length === 0 && status.matchedIndexKeys.length === 0 && status.existingBucketFiles.length === 0) {
                console.log(`   ✨ No cached audio found for "${term}". Clean.`);
            }
            console.log('');
        } else {
            const res = await invalidateTerm(db, term, { dryRun: config.dryRun, fuzzy: config.fuzzy });
            const verb = config.dryRun ? 'Would remove' : 'Removed';
            console.log(`   ${verb} database rows:   ${res.deletedDbRowIds.length} ${res.deletedDbRowIds.length ? `(${res.deletedDbRowIds.join(', ')})` : ''}`);
            console.log(`   ${verb} storage index:   ${res.deletedIndexKeys.length} ${res.deletedIndexKeys.length ? `(${res.deletedIndexKeys.join(', ')})` : ''}`);
            console.log(`   ${verb} bucket files:    ${res.deletedBucketFiles.length} ${res.deletedBucketFiles.length ? `(${res.deletedBucketFiles.join(', ')})` : ''}`);
            console.log(`   ✨ Status: ${config.dryRun ? 'Preview complete' : 'Cache invalidated successfully'}\n`);
        }
    }
}

if (require.main === module) {
    main().catch(err => {
        console.error('\n❌ Fatal error:', err);
        process.exit(1);
    });
}

module.exports = {
    parseCommandLineArgs,
    generateVariations,
    loadStorageIndex,
    findDatabaseMatches,
    inspectTerm,
    invalidateTerm,
    invalidateAll
};
