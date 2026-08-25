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
const { GoogleAuth } = require('google-auth-library');
const { supabase } = require('../../config/supabase');

// Configuration Defaults
const SITE_URL = process.env.SITE_URL || 'sc-domain:chokepidgin.com';
const DEFAULT_KEY_PATH = process.env.GOOGLE_SEARCH_CONSOLE_KEY_PATH || './google-search-console-key.json';
const SEARCH_CONSOLE_API = 'https://searchconsole.googleapis.com/webmasters/v3';
const DEFAULT_OUTPUT_PATH = process.env.OUTPUT_PATH || '/tmp/missing-terms.json';

const BLACKLIST = [
    'dictionary', 'translator', 'pigeon', 'hawaiian', 'pidgin', 'google translate',
    'english to', 'how to say', 'what does', 'meaning of', 'translate', 'sayings',
    'lingo', 'phrases', 'words', 'saying', 'phrase', 'word', 'help help', 'translate poo from',
    'google', 'search', 'free', 'online', 'app', 'download', 'website', 'best', 'hawaii',
    'choke pidgin', 'chokepidgin', 'pronounce', 'pronunciation', 'how to', 'define', 'definition',
    'common', 'yubo', 'portal', 'scobeis', 'scobeis portal', 'tuls', 'bby', 'how\'s it'
];

const QUERY_STRIP_REGEXES = [
    /what does (.*) mean in english/i,
    /what does (.*) mean in chat/i,
    /what does (.*) mean/i,
    /how to say (.*) in hawaiian/i,
    /how to say (.*) in pidgin/i,
    /how to say (.*) in english/i,
    /how to say (.*) in/i,
    /meaning of (.*) in chat/i,
    /meaning of (.*) in english/i,
    /meaning of (.*)/i,
    /(.*) meaning in english/i,
    /(.*) meaning in chat/i,
    /(.*) meaning/i,
    /(.*) definition/i,
    /how to pronounce (.*)/i,
    /(.*) pronunciation/i,
    /spell (.*)/i,
    /(.*) full form in chat/i,
    /full form of (.*) in chat/i,
    /full form of (.*)/i,
    /(.*) full form/i,
    /what is the full form of (.*)/i,
    /what is the meaning of (.*)/i,
    /(.*) in hawaiian/i,
    /(.*) in korean/i,
    /(.*) in japanese/i,
    /(.*) in english/i,
    /(.*) in tagalog/i,
    /(.*) in filipino/i,
    /(.*) in chat/i,
    /(.*) in text/i,
    /(.*) to english/i,
    /(.*) translation/i,
    /english translation of (.*)/i,
    /english to (.*)/i,
    /(.*) english/i,
    /(.*) dictionary/i,
    /dictionary (.*)/i,
    /(.*) translator/i,
    /translator (.*)/i,
    /pidgin translator (.*)/i,
    /pigeon translator (.*)/i,
    /(.*) pigeon/i,
    /pigeon (.*)/i,
    /(.*) tagalog/i,
    /(.*) filipino/i,
    /(.*) german/i,
    /(.*) bedeutung/i,
    /(.*) hawaiian/i,
    /(.*) pidgin/i,
    /(.*) slang/i,
    /(.*) hawaii/i,
    /what is (.*)/i,
    /define (.*)/i,
    /is (.*) a word/i,
    /is (.*) a real word/i,
    /(.*) eyes/i,
    /(.*) fish/i,
    /hawaiian word for (.*)/i,
    /hawaiian word (.*)/i,
    /hawaiian phrase for (.*)/i,
    /hawaiian phrase (.*)/i,
    /hawaiian for (.*)/i,
    /pidgin word for (.*)/i,
    /pidgin word (.*)/i,
    /pidgin phrase for (.*)/i,
    /pidgin phrase (.*)/i,
    /(.*) mean/i,
    /(.*) means/i,
    /(.*) translated/i
];

function parseCommandLineArgs(argv = process.argv.slice(2)) {
    const opts = {
        inputFile: null,
        keyPath: DEFAULT_KEY_PATH,
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
  -k, --key-file <path>         Path to Google Search Console service account JSON (default: ./google-search-console-key.json)
  -d, --days <number>           Days of search analytics data to query if using API (default: 28)
  -m, --min-impressions <num>   Minimum impressions threshold to consider a query (default: 20)
  -o, --output <path>           Output file path for missing terms (default: /tmp/missing-terms.json)
  -h, --help                    Display this help message

Offline CSV Examples:
  # Using a Google Search Console CSV export:
  node tools/seo/feedback-loop.js --file ./gsc-queries.csv

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
    const list = Array.isArray(parsed) ? parsed : (parsed.queries || parsed.data || parsed.missing || []);

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

async function getAuthClient(keyPath) {
    if (!fs.existsSync(keyPath)) {
        throw new Error(`Google Search Console key file not found at ${keyPath}`);
    }
    return new GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });
}

async function fetchSearchQueries(auth, days = 28) {
    const client = await auth.getClient();
    const encodedSiteUrl = encodeURIComponent(SITE_URL);
    const url = `${SEARCH_CONSOLE_API}/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3); // 3-day delay
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const requestBody = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 5000,
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }]
    };

    const res = await client.request({ url, method: 'POST', data: requestBody });
    return res.data.rows || [];
}

async function getExistingDictionary() {
    const { data, error } = await supabase
        .from('dictionary_entries')
        .select('pidgin');
    
    if (error) throw error;
    return new Set(data.map(item => item.pidgin.toLowerCase()));
}

function normalizeQueryTerm(txt) {
    if (!txt) return '';
    let normalized = txt.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/['ʻ`‘’]/g, '')
        .replace(/\s+/g, '') // Remove spaces for comparison
        .trim();
    
    // Map common misspellings/variations
    if (normalized === 'kakua' || normalized === 'kakuakakua') {
        normalized = 'kokua';
    }
    return normalized;
}

function cleanQueryTerm(rawQuery, normalizedExisting = new Set()) {
    let term = rawQuery.toLowerCase();
    let changed = true;
    while (changed) {
        changed = false;
        for (const regex of QUERY_STRIP_REGEXES) {
            const match = term.match(regex);
            if (match) {
                const newTerm = match[1].trim();
                if (newTerm !== term) {
                    term = newTerm;
                    changed = true;
                }
            }
        }
    }

    term = term.trim().replace(/[?!]/g, '');

    // Handle word reduplication/repetition (e.g., "kokua kokua" -> "kokua")
    const words = term.split(/\s+/);
    if (words.length === 2 && words[0] === words[1]) {
        const singleNormalized = normalizeQueryTerm(words[0]);
        if (normalizedExisting.has(singleNormalized)) {
            term = words[0];
        }
    }

    return term;
}

function categorizeQuery(query) {
    const q = query.toLowerCase();
    if (q.includes('food') || q.includes('eat') || q.includes('grind') || q.includes('ono') ||
        q.includes('poke') || q.includes('poi') || q.includes('pork') || q.includes('laulau') ||
        q.includes('kalua') || q.includes('manapua') || q.includes('musubi') || q.includes('shave ice') ||
        q.includes('kaukau') || q.includes('kau kau') || q.includes('pupu') || q.includes('saimin') ||
        q.includes('malasada') || q.includes('haupia') || q.includes('pipikaula') || q.includes('chow fun')) {
        return 'food';
    }
    if (q.includes('hello') || q.includes('greet') || q.includes('howzit') || q.includes('aloha') ||
        q.includes('mahalo') || q.includes('shoots') || q.includes('shootz') || q.includes('a hui hou') ||
        q.includes('sup') || q.includes('later')) {
        return 'greetings';
    }
    if (q.includes('bad') || q.includes('insult') || q.includes('mean') || q.includes('slang') ||
        q.includes('buggah') || q.includes('faka') || q.includes('buss') || q.includes('choke') ||
        q.includes('lolo') || q.includes('akamai') || q.includes('da kine') || q.includes('pakalolo') ||
        q.includes('shaka') || q.includes('rajah') || q.includes('guaranz') || q.includes('scrap') ||
        q.includes('stink eye')) {
        return 'slang';
    }
    if (q.includes('love') || q.includes('girl') || q.includes('boy') || q.includes('wahine') ||
        q.includes('kane') || q.includes('babe') || q.includes('crush') || q.includes('date')) {
        return 'romance';
    }
    if (q.includes('where') || q.includes('place') || q.includes('direction') || q.includes('mauka') ||
        q.includes('makai') || q.includes('beach') || q.includes('island') || q.includes('oahu') ||
        q.includes('maui') || q.includes('kauai') || q.includes('waikiki') || q.includes('honolulu') ||
        q.includes('ewa') || q.includes('windward') || q.includes('leeward')) {
        return 'locations';
    }
    return 'general';
}

function findMissingTerms(scQueries, existingTermsSet, minImpressions = 20) {
    const normalizedExisting = new Set();
    existingTermsSet.forEach(term => normalizedExisting.add(normalizeQueryTerm(term)));

    const missing = [];
    const seenQueries = new Set();

    for (const row of scQueries) {
        const rawQuery = (row.keys && row.keys[0]) ? row.keys[0] : '';
        if (!rawQuery) continue;

        const term = cleanQueryTerm(rawQuery, normalizedExisting);
        const normalizedTerm = normalizeQueryTerm(term);

        // Skip if in blacklist or matches common site queries
        if (BLACKLIST.some(b => {
            const nb = normalizeQueryTerm(b);
            return normalizedTerm === nb || normalizedTerm.includes(nb);
        })) {
            continue;
        }

        const impressions = row.impressions || 0;
        const clicks = row.clicks || 0;
        const ctr = typeof row.ctr === 'number' ? (row.ctr * 100).toFixed(2) + '%' : (row.ctr || '0.00%');
        const position = typeof row.position === 'number' ? row.position.toFixed(1) : (row.position || '0.0');

        if (term.length > 2 && !normalizedExisting.has(normalizedTerm) && !seenQueries.has(normalizedTerm) && impressions >= minImpressions) {
            missing.push({
                pidgin: term,
                english: ["TBD (Add English translation)"],
                category: categorizeQuery(term),
                impressions: impressions,
                clicks: clicks,
                ctr: ctr,
                position: position
            });
            seenQueries.add(normalizedTerm);
        }
    }

    missing.sort((a, b) => b.impressions - a.impressions);
    return missing;
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

        if (options.inputFile) {
            console.log(`📂 Loading search queries from offline file: ${options.inputFile}`);
            scQueries = loadQueriesFromFile(options.inputFile);
            console.log(`✅ Loaded ${scQueries.length} queries from file`);
        } else {
            // Check if key file exists
            if (!fs.existsSync(options.keyPath)) {
                console.log(`⚠️  Google Search Console key file not found at: ${options.keyPath}`);
                console.log('\n💡 Tip: You can run offline with a Search Console CSV/JSON export:');
                console.log('   npm run seo:loop -- --file /path/to/Queries.csv');
                console.log('\n   Or place your service account key at ./google-search-console-key.json');
                console.log('   Run with --help for all available options.\n');
                process.exit(1);
            }

            console.log('🔑 Authenticating with Google Search Console API...');
            const auth = await getAuthClient(options.keyPath);
            
            console.log('📡 Fetching Search Console queries...');
            scQueries = await fetchSearchQueries(auth, options.days);
            console.log(`✅ Found ${scQueries.length} unique search queries`);
        }

        console.log('🔍 Fetching current dictionary from Supabase...');
        const existingTerms = await getExistingDictionary();
        console.log(`✅ Found ${existingTerms.size} existing dictionary terms`);

        console.log('\n🧠 Identifying missing terms and content gaps...');
        const missing = findMissingTerms(scQueries, existingTerms, options.minImpressions);

        console.log(`✨ Found ${missing.length} potential new terms! (threshold >= ${options.minImpressions} impressions)`);

        if (missing.length > 0) {
            console.log('\n📊 Top 10 Missing Opportunities:');
            missing.slice(0, 10).forEach((m, i) => {
                console.log(`   ${i + 1}. "${m.pidgin}" (${m.impressions} impressions, ${m.clicks} clicks) - Cat: ${m.category}`);
            });

            const outputData = {
                generated: new Date().toISOString(),
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
            console.log('\n🎉 No significant content gaps found! You are covering what users are searching for.');
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
    parseCommandLineArgs,
    printHelp,
    main
};

