#!/usr/bin/env node
/**
 * SEO Feedback Loop - Close the Loop Tool
 *
 * This script identifies high-visibility search queries from Google Search Console
 * (or offline CSV/JSON exports) that are NOT currently in our dictionary. It helps
 * automate the process of discovering what users are searching for and adding it
 * to the codebase.
 *
 * Workflow:
 * 1. Fetch or load search queries (from GSC API or offline CSV/JSON file)
 * 2. Fetch all current dictionary terms from Supabase
 * 3. Filter queries that aren't in the dictionary
 * 4. Categorize and suggest additions
 * 5. Output to /tmp/missing-terms.json for use with npm run data:add-missing
 *
 * Usage:
 *   node tools/seo/feedback-loop.js
 *   node tools/seo/feedback-loop.js --file queries.csv
 *   node tools/seo/feedback-loop.js -f /path/to/gsc-export.json --min-impressions 10
 *   node tools/seo/feedback-loop.js --help
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { supabase } = require('../../config/supabase');
const {
    SITE_URL,
    normalizeQueryTerm,
    cleanQueryTerm,
    categorizeQuery,
    buildCoverageIndex,
    coveredBy,
    findMissingTerms,
    fetchDictionaryForCoverage,
    resolveKeyPath,
    getAuthClient,
    fetchSearchQueries,
    fetchLiveQueries
} = require('../../services/search-gaps');

// Configuration Defaults
const SAMPLE_DATA_PATH = path.join(__dirname, 'data/gsc-sample-performance.csv');
const DEFAULT_OUTPUT_PATH = process.env.OUTPUT_PATH || '/tmp/missing-terms.json';

// Real exports only. The packaged sample is never auto-discovered: a run on it
// reports "no gaps" against invented queries, which reads exactly like a real result.
const CANDIDATE_OFFLINE_PATHS = [
    path.join(process.cwd(), 'Queries.csv'),
    path.join(process.cwd(), 'queries.csv'),
    path.join(__dirname, '../../data/Queries.csv'),
    path.join(__dirname, '../../data/queries.csv'),
    path.join(__dirname, '../../docs/Queries.csv'),
    path.join(__dirname, '../../docs/queries.csv')
];

function findOfflineQueryFile(candidates = CANDIDATE_OFFLINE_PATHS) {
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

function parseCommandLineArgs(argv = process.argv.slice(2)) {
    const opts = {
        inputFile: null,
        keyPath: null,
        days: 28,
        minImpressions: 20,
        outputPath: DEFAULT_OUTPUT_PATH,
        help: false
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') {
            opts.help = true;
        } else if ((arg === '--file' || arg === '-f' || arg === '--input' || arg === '-i') && argv[i + 1]) {
            opts.inputFile = argv[++i];
        } else if ((arg === '--key-file' || arg === '-k') && argv[i + 1]) {
            opts.keyPath = argv[++i];
        } else if ((arg === '--days' || arg === '-d') && argv[i + 1]) {
            opts.days = parseInt(argv[++i], 10) || 28;
        } else if ((arg === '--min-impressions' || arg === '-m') && argv[i + 1]) {
            opts.minImpressions = parseInt(argv[++i], 10) || 20;
        } else if ((arg === '--output' || arg === '-o') && argv[i + 1]) {
            opts.outputPath = argv[++i];
        } else if (arg === '--demo' || arg === '--sample') {
            opts.inputFile = SAMPLE_DATA_PATH;
        }
    }

    if (!opts.inputFile && process.env.GSC_INPUT_FILE) {
        opts.inputFile = process.env.GSC_INPUT_FILE;
    }

    return opts;
}

function printHelp() {
    console.log(`
🌺 ChokePidgin SEO Feedback Loop Tool

Identifies high-visibility search queries not yet in the dictionary and generates
a structured candidate list for curation and ingestion.

Usage:
  node tools/seo/feedback-loop.js [options]

Options:
  -f, --file <path>             Load queries from offline CSV or JSON export (e.g. GSC performance export)
  --demo, --sample              Run with built-in sample Search Console dataset
  -k, --key-file <path>         Search Console service account JSON (default: $GOOGLE_SEARCH_CONSOLE_KEY_PATH,
                                ./google-search-console-key.json, then $GA4_KEY_FILE)
  -d, --days <number>           Days of search analytics data to query if using API (default: 28)
  -m, --min-impressions <num>   Minimum impressions threshold to consider a query (default: 20)
  -o, --output <path>           Output file path for missing terms (default: /tmp/missing-terms.json)
  -h, --help                    Display this help message

Offline CSV Examples:
  # Live Search Console data (needs a key with access to ${SITE_URL}):
  npm run seo:loop -- --days 90

  # Explicitly using a Google Search Console CSV export:
  node tools/seo/feedback-loop.js --file ./gsc-queries.csv

  # Run demo mode on packaged sample data:
  npm run seo:loop -- --demo

  # Custom output and lower impression threshold:
  node tools/seo/feedback-loop.js -f ./queries.csv -m 10 -o ./staged-terms.json
`);
}

/**
 * Robust CSV line tokenizer supporting quotes and commas.
 */
function parseCsvLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}

/**
 * Parses numeric values safely (handles commas, percentages, currency symbols).
 */
function parseMetricNumber(val, defaultVal = 0) {
    if (val === null || val === undefined || val === '') return defaultVal;
    if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
    const str = String(val).replace(/,/g, '').trim();
    if (str.endsWith('%')) {
        const num = parseFloat(str.slice(0, -1));
        return isNaN(num) ? defaultVal : num / 100;
    }
    const num = parseFloat(str);
    return isNaN(num) ? defaultVal : num;
}

/**
 * Parses Google Search Console CSV export content.
 */
function parseCsvQueries(csvContent) {
    if (!csvContent || typeof csvContent !== 'string') return [];
    
    // Strip UTF-8 BOM
    const content = csvContent.charCodeAt(0) === 0xFEFF ? csvContent.slice(1) : csvContent;
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    const headerFields = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
    
    // Detect column indexes
    let queryIdx = headerFields.findIndex(h => h === 'top queries' || h === 'top query' || h === 'query' || h === 'queries' || h === 'keyword' || h === 'search query');
    let clicksIdx = headerFields.findIndex(h => h === 'clicks');
    let impressionsIdx = headerFields.findIndex(h => h === 'impressions' || h === 'views');
    let ctrIdx = headerFields.findIndex(h => h === 'ctr' || h === 'click through rate' || h === 'click-through rate');
    let positionIdx = headerFields.findIndex(h => h === 'position' || h === 'avg position' || h === 'average position');

    // Default to first column if no named query column found
    if (queryIdx === -1) {
        queryIdx = 0;
    }

    const startRow = (clicksIdx !== -1 || impressionsIdx !== -1 || queryIdx !== -1) ? 1 : 0;
    const rows = [];

    for (let i = startRow; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length <= queryIdx) continue;

        const query = cols[queryIdx].replace(/^["']|["']$/g, '').trim();
        if (!query) continue;

        const clicks = clicksIdx !== -1 && cols[clicksIdx] ? parseMetricNumber(cols[clicksIdx], 0) : 0;
        const impressions = impressionsIdx !== -1 && cols[impressionsIdx] ? parseMetricNumber(cols[impressionsIdx], 100) : 100;
        const ctr = ctrIdx !== -1 && cols[ctrIdx] ? parseMetricNumber(cols[ctrIdx], clicks / Math.max(impressions, 1)) : (clicks / Math.max(impressions, 1));
        const position = positionIdx !== -1 && cols[positionIdx] ? parseMetricNumber(cols[positionIdx], 10.0) : 10.0;

        rows.push({
            keys: [query],
            clicks: Math.round(clicks),
            impressions: Math.round(impressions),
            ctr: ctr,
            position: position
        });
    }

    return rows;
}

/**
 * Parses JSON format queries from GSC API or custom export.
 */
function parseJsonQueries(jsonContent) {
    let parsed;
    try {
        parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch (e) {
        throw new Error(`Failed to parse JSON query file: ${e.message}`);
    }

    if (!parsed) return [];

    // Format 1: GSC standard API response { rows: [...] }
    if (parsed.rows && Array.isArray(parsed.rows)) {
        return parsed.rows;
    }

    // Format 2: Array of objects or strings
    const list = Array.isArray(parsed) ? parsed : (parsed.topQueries || parsed.queries || parsed.data || parsed.missing || []);

    return list.map(item => {
        if (typeof item === 'string') {
            return {
                keys: [item],
                clicks: 0,
                impressions: 100,
                ctr: 0,
                position: 10.0
            };
        }
        const q = item.query || item.pidgin || item.term || (item.keys && item.keys[0]) || '';
        const impressions = parseMetricNumber(item.impressions, 100);
        const clicks = parseMetricNumber(item.clicks, 0);
        const ctr = item.ctr ? parseMetricNumber(item.ctr, clicks / Math.max(impressions, 1)) : (clicks / Math.max(impressions, 1));
        const position = parseMetricNumber(item.position, 10.0);

        return {
            keys: [q],
            clicks: Math.round(clicks),
            impressions: Math.round(impressions),
            ctr: ctr,
            position: position
        };
    }).filter(row => row.keys[0] && row.keys[0].trim().length > 0);
}

/**
 * Loads queries from an offline file (CSV, JSON, or plain text).
 */
function loadQueriesFromFile(filePath) {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Input file not found at: ${resolvedPath}`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf8');
    const ext = path.extname(resolvedPath).toLowerCase();

    if (ext === '.json') {
        return parseJsonQueries(content);
    }

    if (ext === '.csv') {
        return parseCsvQueries(content);
    }

    // Heuristic detection if extension is missing or .txt
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            return parseJsonQueries(trimmed);
        } catch (e) {
            // Fall through to CSV
        }
    }

    if (trimmed.includes(',')) {
        return parseCsvQueries(content);
    }

    // Plain text line-by-line fallback
    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return lines.map(line => ({
        keys: [line],
        clicks: 0,
        impressions: 100,
        ctr: 0,
        position: 10.0
    }));
}

async function main() {
    const options = parseCommandLineArgs();

    if (options.help) {
        printHelp();
        return;
    }

    console.log('🔄 Starting SEO Feedback Loop...');
    console.log('=============================\n');

    try {
        let scQueries = [];
        let source;
        const keyPath = resolveKeyPath(options.keyPath);

        if (options.inputFile) {
            source = path.resolve(options.inputFile) === SAMPLE_DATA_PATH ? 'sample' : `file:${options.inputFile}`;
            if (source === 'sample') {
                console.log('⚠️  DEMO MODE: packaged sample queries, not real search demand.');
            }
            console.log(`📂 Loading search queries from offline file: ${options.inputFile}`);
            scQueries = loadQueriesFromFile(options.inputFile);
            console.log(`✅ Loaded ${scQueries.length} queries from file`);
        } else if ((scQueries = await fetchLiveQueries(keyPath, options.days)) !== null) {
            source = `search-console:${SITE_URL}:${options.days}d`;
            console.log(`✅ Found ${scQueries.length} unique search queries`);
        } else {
            scQueries = [];
            const discovered = findOfflineQueryFile();
            if (discovered) {
                console.log('ℹ️  No Search Console credential could read the property');
                const displayPath = path.relative(process.cwd(), discovered) || discovered;
                console.log(`📂 Auto-discovered local query dataset: ${displayPath}`);
                scQueries = loadQueriesFromFile(discovered);
                source = `file:${displayPath}`;
                console.log(`✅ Loaded ${scQueries.length} queries from file`);
            } else {
                console.log('⚠️  No Search Console credential could read the property, and no query export to read.');
                console.log('\n💡 Tip: You can run offline with a Search Console CSV/JSON export:');
                console.log('   npm run seo:loop -- --file /path/to/Queries.csv');
                console.log('   Or run demo mode on packaged sample data: npm run seo:loop -- --demo');
                console.log('\n   Or set GOOGLE_SEARCH_CONSOLE_KEY_PATH / GA4_KEY_FILE to a service account key,');
                console.log('   or: gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform');
                console.log('   Run with --help for all available options.\n');
                process.exit(1);
            }
        }

        console.log('🔍 Fetching current dictionary from Supabase...');
        const entries = await fetchDictionaryForCoverage(supabase);
        console.log(`✅ Found ${entries.length} dictionary entries (headwords, variants and English meanings)`);

        console.log('\n🧠 Identifying missing terms and content gaps...');
        const missing = findMissingTerms(scQueries, entries, options.minImpressions);

        console.log(`✨ Found ${missing.length} potential new terms! (threshold >= ${options.minImpressions} impressions)`);

        if (missing.length > 0) {
            console.log('\n📊 Top 10 Missing Opportunities:');
            missing.slice(0, 10).forEach((m, i) => {
                console.log(`   ${i + 1}. "${m.pidgin}" (${m.impressions} impressions, ${m.clicks} clicks) - Cat: ${m.category}`);
            });

            const outputData = {
                generated: new Date().toISOString(),
                source,
                count: missing.length,
                minImpressions: options.minImpressions,
                missing: missing
            };

            const resolvedOut = path.resolve(process.cwd(), options.outputPath);
            fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
            fs.writeFileSync(resolvedOut, JSON.stringify(outputData, null, 2));
            console.log(`\n✅ Missing terms list saved to: ${resolvedOut}`);
            console.log('\n💡 Next steps:');
            console.log(`   1. Open ${options.outputPath} and fill in the "english" translations`);
            console.log('   2. Run: npm run data:add-missing');
        } else {
            console.log(source === 'sample'
                ? '\nℹ️  No gaps in the sample data. This says nothing about real search demand.'
                : '\n🎉 No significant content gaps found! You are covering what users are searching for.');
        }

    } catch (err) {
        console.error('\n❌ Feedback loop failed:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
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
    printHelp,
    findOfflineQueryFile,
    resolveKeyPath,
    fetchSearchQueries,
    getAuthClient,
    CANDIDATE_OFFLINE_PATHS,
    SAMPLE_DATA_PATH,
    SITE_URL,
    main
};

