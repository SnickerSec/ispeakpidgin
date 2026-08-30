#!/usr/bin/env node

/**
 * Generate Sitemap from Built Output
 *
 * The URL set is derived from the pages that actually exist in public/, not from a
 * hand-maintained list. The previous version enumerated every static page inline, which meant
 * every new page had to be added by hand -- and 26 of them never were, including all eight game
 * pages, talk-story.html, pidgin-bible.html and the curated /what-does-sarap-mean.html (whose
 * /word/sarap.html alternative is deliberately suppressed, so the term had no indexable URL at
 * all). Walking the build output makes that class of drift impossible.
 *
 * A page is included unless it opts out, using the signals already present in the markup:
 *   - <meta name="robots" content="noindex">   -> excluded
 *   - a canonical pointing at a different URL  -> excluded (premium landing pages already
 *     absorb their /word/ alternative; -2/-3 slug collisions already point at the base page)
 *   - a robots.txt Disallow rule               -> excluded
 *
 * Priority and changefreq come from path rules plus a small editorial override table. Those
 * describe *ranking*, not membership, so they cannot cause a page to go missing.
 *
 * Must run AFTER all page generators (build.js does this).
 */

const fs = require('fs');
const path = require('path');

const { fetchFromSupabase, SITE_URL } = require('./shared-utils');

const PUBLIC_DIR = path.join(__dirname, '../../public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const baseUrl = SITE_URL || 'https://chokepidgin.com';

// A sitemap this much smaller than the build means something upstream failed; refuse to
// overwrite a good sitemap with a broken one.
const MIN_EXPECTED_URLS = 500;

// Editorial weighting for hub pages. Membership never depends on this table -- an entry that
// no longer exists on disk is simply unused, and a page missing from it gets the default.
const PAGE_RULES = [
    ['/',                            'weekly',  1.0],
    ['/english-to-pidgin.html',      'weekly',  0.95],
    ['/dictionary.html',             'weekly',  0.9],
    ['/translator.html',             'weekly',  0.9],
    ['/phrases.html',                'weekly',  0.9],
    ['/games.html',                  'weekly',  0.9],
    ['/learning-hub.html',           'weekly',  0.9],
    ['/pidgin-vs-hawaiian.html',     'monthly', 0.9],
    ['/pidgin-vs-singlish.html',     'monthly', 0.9],
    ['/pronunciation-practice.html', 'weekly',  0.85],
    ['/stories.html',                'weekly',  0.85],
    ['/blog/',                       'weekly',  0.85],
    ['/ask-local.html',              'monthly', 0.8],
    ['/pidgin-heads-up.html',        'monthly', 0.8],
    ['/pickup-lines.html',           'monthly', 0.75],
];
const PAGE_RULE_MAP = new Map(PAGE_RULES.map(([url, changefreq, priority]) => [url, { changefreq, priority }]));

// Curated landing pages that outperform the rest of the "what does X mean" set.
const HIGH_VALUE_LANDING = new Map([
    ['/what-does-menpachi-eyes-mean.html', { changefreq: 'weekly',  priority: 0.9 }],
    ['/what-does-no-ka-oi-mean.html',      { changefreq: 'weekly',  priority: 0.9 }],
    ['/what-does-akamai-mean.html',        { changefreq: 'weekly',  priority: 0.9 }],
    ['/what-does-a-hui-hou-mean.html',     { changefreq: 'weekly',  priority: 0.9 }],
    ['/what-does-aloha-mean.html',         { changefreq: 'monthly', priority: 0.9 }],
    ['/what-does-ohana-mean.html',         { changefreq: 'monthly', priority: 0.9 }],
]);

// Section ordering keeps the generated file readable and the diffs small.
const SECTIONS = [
    { key: 'root',   label: 'Main Pages & Curated Landing Pages', test: url => !/^\/(word|phrase|story|pickup|blog)\//.test(url) },
    { key: 'blog',   label: 'Blog',                               test: url => url.startsWith('/blog/') },
    { key: 'word',   label: 'Individual Dictionary Entry Pages',  test: url => url.startsWith('/word/') },
    { key: 'phrase', label: 'Individual Phrase Pages',            test: url => url.startsWith('/phrase/') },
    { key: 'story',  label: 'Individual Story Pages',             test: url => url.startsWith('/story/') },
    { key: 'pickup', label: 'Individual Pickup Line Pages',       test: url => url.startsWith('/pickup/') },
];

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Collapse the equivalent spellings of one URL (/, /index.html, /x.html, /x/) to a single key
 * so a self-referencing canonical is recognised as self-referencing.
 */
function normalizeUrl(url) {
    let u = url.trim();
    u = u.replace(/^https?:\/\/[^/]+/, '');
    u = u.split(/[?#]/)[0];
    u = u.replace(/index\.html$/, '');
    u = u.replace(/\.html$/, '');
    u = u.replace(/\/+$/, '');
    return u === '' ? '/' : u;
}

/** Map a file inside public/ to the URL path it is served at. */
function fileToUrl(relativePath) {
    const url = '/' + relativePath.split(path.sep).join('/');
    if (url === '/index.html') return '/';
    if (url.endsWith('/index.html')) return url.slice(0, -'index.html'.length);
    return url;
}

function walkHtmlFiles(dir, found = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
            walkHtmlFiles(full, found);
        } else if (name.endsWith('.html')) {
            found.push(path.relative(PUBLIC_DIR, full));
        }
    }
    return found;
}

/** Paths blocked in robots.txt -- listing them in the sitemap would be a contradictory signal. */
function readRobotsDisallows() {
    const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
    if (!fs.existsSync(robotsPath)) return [];

    const disallows = [];
    let inWildcardGroup = false;

    for (const rawLine of fs.readFileSync(robotsPath, 'utf8').split('\n')) {
        const line = rawLine.replace(/#.*$/, '').trim();
        if (!line) continue;

        const uaMatch = line.match(/^User-agent:\s*(.+)$/i);
        if (uaMatch) {
            inWildcardGroup = uaMatch[1].trim() === '*';
            continue;
        }

        const disallowMatch = line.match(/^Disallow:\s*(.+)$/i);
        if (inWildcardGroup && disallowMatch) {
            disallows.push(disallowMatch[1].trim());
        }
    }
    return disallows;
}

function isDisallowed(url, disallows) {
    return disallows.some(rule => {
        if (!rule || rule === '/') return false;
        if (rule.endsWith('$')) {
            return url.endsWith(rule.slice(0, -1));
        }
        return url === rule || url.startsWith(rule);
    });
}

/**
 * Decide whether one built page belongs in the sitemap, reading the opt-out signals already
 * present in its markup.
 */
function classifyPage(relativePath, disallows) {
    const url = fileToUrl(relativePath);
    const html = fs.readFileSync(path.join(PUBLIC_DIR, relativePath), 'utf8');

    const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
    if (robotsMatch && /noindex/i.test(robotsMatch[1])) {
        return { url, included: false, reason: 'noindex' };
    }

    if (isDisallowed(url, disallows)) {
        return { url, included: false, reason: 'robots.txt' };
    }

    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
    if (canonicalMatch) {
        const canonical = normalizeUrl(canonicalMatch[1]);
        if (canonical !== normalizeUrl(url)) {
            return { url, included: false, reason: 'canonical -> ' + canonical };
        }
    } else {
        return { url, included: false, reason: 'no canonical' };
    }

    return { url, included: true };
}

/** Weighting for a URL. wordMeta supplies the frequency/difficulty nuance for /word/ pages. */
function weightFor(url, wordMeta) {
    if (PAGE_RULE_MAP.has(url)) return PAGE_RULE_MAP.get(url);
    if (HIGH_VALUE_LANDING.has(url)) return HIGH_VALUE_LANDING.get(url);

    if (url.startsWith('/word/')) {
        const meta = wordMeta.get(url.slice('/word/'.length).replace(/\.html$/, ''));
        if (meta && meta.frequency === 'high') return { changefreq: 'weekly', priority: 0.8 };
        if (meta && meta.difficulty === 'beginner') return { changefreq: 'monthly', priority: 0.75 };
        return { changefreq: 'monthly', priority: 0.7 };
    }
    if (url.startsWith('/phrase/')) return { changefreq: 'monthly', priority: 0.65 };
    if (url.startsWith('/story/'))  return { changefreq: 'monthly', priority: 0.75 };
    if (url.startsWith('/pickup/')) return { changefreq: 'monthly', priority: 0.6 };
    if (url.startsWith('/blog/'))   return { changefreq: 'monthly', priority: 0.8 };
    if (/^\/what-does-.+-mean\.html$/.test(url)) return { changefreq: 'monthly', priority: 0.85 };

    return { changefreq: 'monthly', priority: 0.7 };
}

/**
 * Per-entry frequency/difficulty, used only for weighting. Best-effort: without it every word
 * page still ships, just at the default priority.
 */
async function loadWordMeta() {
    const { createSlug } = require('./shared-utils');
    const wordMeta = new Map();
    try {
        const entries = await fetchFromSupabase('dictionary_entries', 'pidgin,frequency,difficulty', 'pidgin.asc');
        entries.forEach(entry => {
            if (entry.pidgin) wordMeta.set(createSlug(entry.pidgin), entry);
        });
    } catch (error) {
        console.warn(`⚠️  Could not load dictionary metadata (${error.message}); using default priorities.`);
    }
    return wordMeta;
}

function buildSitemap(includedUrls, wordMeta) {
    const currentDate = getCurrentDate();
    const remaining = new Set(includedUrls);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

    const counts = {};

    for (const section of SECTIONS) {
        const urls = [...remaining].filter(section.test).sort();
        urls.forEach(u => remaining.delete(u));
        counts[section.key] = urls.length;
        if (urls.length === 0) continue;

        xml += `\n    <!-- ${section.label} -->\n`;
        for (const url of urls) {
            const { changefreq, priority } = weightFor(url, wordMeta);
            xml += `    <url>
        <loc>${baseUrl}${url}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>
`;
        }
    }

    xml += `
</urlset>`;

    return { xml, counts };
}

async function main() {
    console.log('🗺️  Generating sitemap.xml from built output...\n');

    if (!fs.existsSync(PUBLIC_DIR)) {
        throw new Error(`public/ does not exist -- run the build before generating the sitemap.`);
    }

    const disallows = readRobotsDisallows();
    const htmlFiles = walkHtmlFiles(PUBLIC_DIR);
    console.log(`📂 Scanned ${htmlFiles.length} built HTML pages`);

    const classified = htmlFiles.map(f => classifyPage(f, disallows));
    const included = classified.filter(p => p.included).map(p => p.url);
    const excluded = classified.filter(p => !p.included);

    if (included.length < MIN_EXPECTED_URLS) {
        throw new Error(`Only ${included.length} indexable pages found (expected at least ${MIN_EXPECTED_URLS}). Refusing to write a truncated sitemap.`);
    }

    const wordMeta = await loadWordMeta();
    const { xml, counts } = buildSitemap(included, wordMeta);

    fs.writeFileSync(OUTPUT_PATH, xml, 'utf8');

    const reasons = excluded.reduce((acc, p) => {
        const key = p.reason.startsWith('canonical') ? 'canonical elsewhere' : p.reason;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    console.log('\n✅ Sitemap generated successfully!');
    console.log(`📄 Total URLs: ${included.length}`);
    Object.entries(counts).forEach(([key, n]) => console.log(`   - ${key}: ${n}`));
    console.log(`\n🚫 Excluded ${excluded.length} pages:`);
    Object.entries(reasons).forEach(([reason, n]) => console.log(`   - ${reason}: ${n}`));
    console.log(`\n📂 Output: ${OUTPUT_PATH}`);
    console.log(`🔗 Sitemap URL: ${baseUrl}/sitemap.xml`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = { normalizeUrl, fileToUrl, classifyPage, readRobotsDisallows, isDisallowed, weightFor };
