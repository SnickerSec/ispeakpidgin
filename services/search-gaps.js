/**
 * Search-gap detection: which search queries the dictionary does not already answer.
 *
 * The single owner of this logic. It used to live in three places that disagreed:
 * tools/seo/feedback-loop.js matched headwords and variants but not English meanings
 * (so "thank you", "brother" and "kids" came back as missing Pidgin words), the admin
 * Google Sync matched English but none of the variant/filler rules, and a third admin
 * endpoint matched exact headwords only. Ingesting from those lists is how duplicate
 * entries got in (migrations 024-026 merged them back out).
 *
 * Used by tools/seo/feedback-loop.js (CLI), routes/admin.js (/api/admin/gaps sync) and
 * tools/seo/close-resolved-gaps.js. Lives in services/ because the runtime image copies it.
 */

const fs = require('fs');

// Search Console property id. Not SITE_URL: .env sets that to the site's https:// origin.
const SITE_URL = process.env.GSC_PROPERTY || 'sc-domain:chokepidgin.com';
const DEFAULT_KEY_PATH = './google-search-console-key.json';
const SEARCH_CONSOLE_API = 'https://searchconsole.googleapis.com/webmasters/v3';

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
    /how do you say (.*) in (?:hawaiian|pidgin)/i,
    /how do you say (.*)/i,
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

// Words that ride along with a headword in a query without changing what it asks for
// ("howzit brah", "brah def", "whats a brah", "bro vs brah").
const FILLER_TOKENS = new Set([
    'a', 'e', 'the', 'is', 'it', 'or', 'vs', 'whats', 'what', 'os', 'ehat', 'of', 'if', 'def', 'origin',
    'acronym', 'spelling', 'sentence', 'in', 'ho', 'hey', 'hi', 'eh', 'aye', 'mate', 'bro', 'bruh',
    'brah', 'cuz', 'homophone', 'urban', 'dictionary', 'dict', 'slang', 'mean', 'means', 'meaning', 'meanings'
]);
// "meaning"/"definition" and the typos real searchers make of them (menaing, defintion, mesning, meanings).
const GLOSS_TYPO = /^(?:m|n)[a-z]{0,4}ings?$|^def[a-z]*$/;
// Queries for a site section rather than a word (the Pidgin Bible lives at /bible).
const SECTION_QUERY = /jesus book|\bbible\b|spesho book|^list of\b|\blist of pidgin\b|\bwords list\b/;

function normalizeQueryTerm(txt) {
    if (!txt) return '';
    let normalized = txt.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/['ʻ`‘’]/g, '')
        .replace(/\s+/g, '') // Remove spaces for comparison
        .trim();

    // Map common misspellings/variations
    if (normalized === 'kakua' || normalized === 'kakuakakua') {
        normalized = 'kokua';
    }
    return normalized;
}

/** Lowercase, drop diacritics/punctuation, and collapse letter runs (brahhh, kamaaina → kamaina). */
function squeezeKey(txt) {
    return String(txt || '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z\s-]/g, '')
        .replace(/(.)\1+/g, '$1')
        .trim();
}

/**
 * An English gloss as plain words, for exact comparison: parentheticals dropped
 * ("go to sleep (said to kids)"), leading to/a/an/the dropped ("to pay off" ~ "pay off").
 * No letter squeezing: that is for Pidgin spellings, and would fold English "good" into "god".
 */
function glossKey(txt) {
    return String(txt || '').toLowerCase()
        .replace(/\([^)]*\)/g, ' ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[ʻʼ'‘’`]/g, '')
        .replace(/[^a-z]+/g, ' ')
        .trim()
        .replace(/^(?:to|a|an|the) /, '');
}

function editDistanceAtMostOne(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { i++; j++; continue; }
        if (++edits > 1) return false;
        if (a.length > b.length) i++;
        else if (b.length > a.length) j++;
        else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Index of the dictionary for coverage checks. Accepts dictionary_entries rows
 * ({ pidgin, spelling_variants, english }) or bare headword strings.
 *
 * Headwords and variants go into joined keys (kuru-kuru → kurukuru), single-word keys,
 * and multi-word phrases for containment; English meanings into whole-word glosses.
 */
function buildCoverageIndex(entries) {
    const joined = new Set();
    const words = new Set();
    const phrases = [];
    const glosses = new Map();
    const normalized = new Set();
    for (const entry of entries || []) {
        const row = typeof entry === 'string' ? { pidgin: entry } : entry;
        for (const term of [row.pidgin, ...(row.spelling_variants || [])]) {
            if (!term) continue;
            normalized.add(normalizeQueryTerm(term));
            const tokens = squeezeKey(term).split(/[\s-]+/).filter(Boolean);
            if (!tokens.length) continue;
            joined.add(tokens.join(''));
            if (tokens.length === 1) words.add(tokens[0]);
            else phrases.push(` ${tokens.join(' ')} `);
        }
        const english = Array.isArray(row.english) ? row.english : (row.english ? [row.english] : []);
        // "angry; upset" and "sleepy / sleep" hold two glosses each. When several entries
        // share a gloss, credit the one listing it first and unqualified: "thank you" is
        // mahalo, not fa'afetai's "thank you (Samoan)".
        english.flatMap(m => String(m).split(/[;,/]/)).forEach((meaning, i) => {
            const key = glossKey(meaning);
            const rank = i + (meaning.includes('(') ? 0.5 : 0);
            const held = glosses.get(key);
            if (key && (!held || rank < held.rank)) glosses.set(key, { pidgin: row.pidgin, rank });
        });
    }
    return { joined, words, phrases, glosses, normalized, joinedList: [...joined] };
}

/**
 * How the dictionary already answers a query, or null for a real gap.
 * Returns { match, via }, where via is one of:
 *   headword - the headword or a variant, ignoring spacing/hyphens/letter runs/plurals
 *   phrase   - part of a multi-word headword (komo mai → e komo mai)
 *   filler   - a headword plus words that do not change the question (brah def)
 *   english  - an English meaning, whole (brother → braddah). Only whole: matching words
 *              inside a gloss closed "problems" against "no problem", the opposite
 *   near     - one edit from a headword (kamaiana → kamaaina): probably a misspelling,
 *              but site search will not find it, so it may want a spelling variant
 */
function coverage(term, index) {
    const tokens = squeezeKey(term).split(/[\s-]+/).filter(Boolean)
        .filter(t => !GLOSS_TYPO.test(t));
    if (!tokens.length) return null;
    const joined = tokens.join('').replace(/(?:meaning|mening|definition)$/, '');
    const known = t => index.words.has(t) || (t.endsWith('s') && index.words.has(t.slice(0, -1)));

    if (index.normalized.has(normalizeQueryTerm(term)) || index.joined.has(joined)) return { match: joined, via: 'headword' };
    if (joined.endsWith('s') && index.joined.has(joined.slice(0, -1))) return { match: joined.slice(0, -1), via: 'headword' };
    if (tokens.length > 1 && index.phrases.some(p => p.includes(` ${tokens.join(' ')} `))) return { match: tokens.join(' '), via: 'phrase' };

    const content = tokens.filter(t => !FILLER_TOKENS.has(t) || index.words.has(t));
    if (content.length && content.every(known)) return { match: content.join(' '), via: 'filler' };
    if (!content.length && tokens.some(known)) return { match: tokens.find(known), via: 'filler' };

    const gloss = glossKey(term);
    if (gloss) {
        const form = [gloss, gloss.length > 3 && gloss.endsWith('s') && gloss.slice(0, -1)]
            .find(f => f && index.glosses.has(f));
        if (form) return { match: index.glosses.get(form).pidgin, via: 'english' };
    }

    if (joined.length >= 5) {
        const near = index.joinedList.find(k => k.length >= 5 && editDistanceAtMostOne(joined, k));
        if (near) return { match: near, via: 'near' };
    }
    return null;
}

/** The existing headword or entry a query already lands on, or null for a real gap. */
function coveredBy(term, index) {
    const hit = coverage(term, index);
    return hit ? hit.match : null;
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

/**
 * Search Console rows the dictionary does not answer, most impressions first.
 * @param {Array<object>} scQueries - Search Console rows ({ keys: [query], impressions, clicks, ctr, position })
 * @param {Iterable<object|string>|object} entries - dictionary rows, headword strings, or a buildCoverageIndex result
 * @param {number} [minImpressions]
 */
function findMissingTerms(scQueries, entries, minImpressions = 20) {
    const index = entries && entries.glosses instanceof Map ? entries : buildCoverageIndex(entries);
    const missing = [];
    const seenQueries = new Set();

    for (const row of scQueries) {
        const rawQuery = (row.keys && row.keys[0]) ? row.keys[0] : '';
        if (!rawQuery) continue;

        // Quoted searches are exact-match lookups for a name ("shoots with fabian"), not vocabulary.
        if (/^["“]/.test(rawQuery.trim()) || SECTION_QUERY.test(rawQuery.toLowerCase())) continue;

        const term = cleanQueryTerm(rawQuery, index.normalized);
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

        if (term.length > 2 && !coverage(term, index) && !seenQueries.has(normalizedTerm) && impressions >= minImpressions) {
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

/** Every dictionary_entries row needed for coverage. Paged: a bare select stops at 1,000 rows. */
async function fetchDictionaryForCoverage(db) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
        const { data, error } = await db.from('dictionary_entries')
            .select('pidgin, spelling_variants, english')
            .range(from, from + 999);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 1000) return rows;
    }
}

/**
 * Close pending search_gaps rows the dictionary now answers, as status 'added'.
 * 'near' matches stay pending: site search still finds nothing for them, so a person
 * should decide whether they deserve a spelling variant.
 * @returns {Promise<{ pending: number, closed: Array<{ id, term, match, via }> }>}
 */
async function closeResolvedGaps(db, { entries, dryRun = false } = {}) {
    const index = buildCoverageIndex(entries || await fetchDictionaryForCoverage(db));
    const pending = [];
    for (let from = 0; ; from += 1000) {
        const { data, error } = await db.from('search_gaps')
            .select('id, term')
            .eq('status', 'pending')
            .order('id')
            .range(from, from + 999);
        if (error) throw error;
        pending.push(...data);
        if (data.length < 1000) break;
    }

    const closed = [];
    for (const gap of pending) {
        const hit = coverage(gap.term, index) || coverage(cleanQueryTerm(gap.term, index.normalized), index);
        if (hit && hit.via !== 'near') closed.push({ id: gap.id, term: gap.term, ...hit });
    }

    if (!dryRun) {
        for (let i = 0; i < closed.length; i += 200) {
            const ids = closed.slice(i, i + 200).map(g => g.id);
            const { error } = await db.from('search_gaps').update({ status: 'added' }).in('id', ids);
            if (error) throw error;
        }
    }
    return { pending: pending.length, closed };
}

/**
 * First Search Console service-account key that exists: explicit, then
 * GOOGLE_SEARCH_CONSOLE_KEY_PATH, then ./google-search-console-key.json, then
 * GA4_KEY_FILE (the SEO service account in ~/.secrets, which can hold GSC access too).
 */
function resolveKeyPath(explicit, env = process.env) {
    const candidates = [explicit, env.GOOGLE_SEARCH_CONSOLE_KEY_PATH, DEFAULT_KEY_PATH, env.GA4_KEY_FILE]
        .filter(Boolean);
    return candidates.find(p => fs.existsSync(p)) || null;
}

/**
 * A service account JSON from GOOGLE_CREDENTIALS_BASE64, or null. This is how production
 * authenticates: the runtime image holds no key file and Railway has no metadata server for
 * ADC. (choke-pidgin@ has Full access to the property; verified 2026-10-03.)
 */
function credentialsFromEnv(env = process.env) {
    const encoded = env.GOOGLE_CREDENTIALS_BASE64;
    if (!encoded) return null;
    try {
        const credentials = JSON.parse(Buffer.from(encoded.trim(), 'base64').toString('utf8'));
        return credentials.client_email && credentials.private_key ? credentials : null;
    } catch {
        return null;
    }
}

/**
 * source: a key file path, { credentials } (a parsed service account), or null for
 * Application Default Credentials (gcloud auth application-default login).
 */
async function getAuthClient(source) {
    if (typeof source === 'string' && !fs.existsSync(source)) {
        throw new Error(`Google Search Console key file not found at ${source}`);
    }
    const { GoogleAuth } = require('google-auth-library');
    return new GoogleAuth({
        ...(typeof source === 'string' ? { keyFile: source } : {}),
        ...(source && source.credentials ? { credentials: source.credentials } : {}),
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });
}

async function fetchSearchQueries(auth, days = 28, rowLimit = 5000) {
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
        rowLimit,
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }]
    };

    try {
        const res = await client.request({ url, method: 'POST', data: requestBody });
        return res.data.rows || [];
    } catch (err) {
        if (err.response && err.response.status === 403) {
            const email = (await auth.getCredentials()).client_email || 'the service account';
            throw new Error(`${email} has no Search Console access to ${SITE_URL}. ` +
                `Add it under Search Console → Settings → Users and permissions (Restricted is enough).`);
        }
        throw err;
    }
}

/**
 * Tries the key file, then GOOGLE_CREDENTIALS_BASE64, then ADC; the first credential that
 * can read the property wins. Returns null (with the reasons logged) when none can.
 */
async function fetchLiveQueries(keyPath, days = 28, { rowLimit = 5000, log = console.log, env = process.env } = {}) {
    const envCredentials = credentialsFromEnv(env);
    const attempts = [
        ...(keyPath ? [{ source: keyPath, label: keyPath }] : []),
        ...(envCredentials ? [{ source: { credentials: envCredentials }, label: `GOOGLE_CREDENTIALS_BASE64 (${envCredentials.client_email})` }] : []),
        { source: null, label: 'application default credentials' }
    ];
    for (const { source, label } of attempts) {
        try {
            log(`🔑 Authenticating with Google Search Console API (${label})...`);
            const auth = await getAuthClient(source);
            log(`📡 Fetching ${days} days of Search Console queries for ${SITE_URL}...`);
            return await fetchSearchQueries(auth, days, rowLimit);
        } catch (err) {
            log(`   ✗ ${err.message.split('\n')[0]}`);
        }
    }
    return null;
}

module.exports = {
    BLACKLIST,
    SITE_URL,
    normalizeQueryTerm,
    cleanQueryTerm,
    categorizeQuery,
    buildCoverageIndex,
    coverage,
    coveredBy,
    findMissingTerms,
    fetchDictionaryForCoverage,
    closeResolvedGaps,
    resolveKeyPath,
    credentialsFromEnv,
    getAuthClient,
    fetchSearchQueries,
    fetchLiveQueries
};
