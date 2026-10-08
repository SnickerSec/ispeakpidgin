#!/usr/bin/env node

/**
 * Word-link guard
 *
 * Hand-written pages link to generated word pages (/word/<slug>.html), and merge migrations
 * delete headwords. The two meet only at build time: migration 031 merged bumbye into bumbai on
 * 2026-10-04, what-does-pau-hana-mean.html kept linking /word/bumbye.html, and CI went red on
 * every push for four days without anyone looking. audit-site.js did catch it, but only after a
 * full build, and only once the migration had already been applied to live data.
 *
 * This check needs no build. It reads the live dictionary and:
 *   1. Every literal /word/<slug>.html href in src/ must be a live page that is not redirected.
 *      A redirected link is a 301 hop for every click and crawl; link the target directly.
 *   2. services/word-redirects.js must be sound: targets exist, no chains, and no merge line
 *      shadows a live entry (landing-page lines for live words are intended).
 *   3. With --migration <file.sql>, before applying it: entries the migration deletes or renames
 *      are treated as gone, so links that would break fail now, and each removed headword
 *      must have a redirect line, or its indexed /word/ URL becomes a 404.
 *
 *   npm run test:word-links
 *   npm run test:word-links -- --migration supabase/migrations/036_merge_x.sql
 *
 * Exits 1 on any problem, 78 (shown as SKIPPED by run-all-tests.js) without Supabase
 * credentials: the mock fixture is not the live dictionary, and a pass on it means nothing.
 */

const fs = require('fs');
const path = require('path');
const { assignSlugs, createSlug, fetchFromSupabase, isOfflineMock } = require('../generators/shared-utils');
const redirects = require('../../services/word-redirects');

const ROOT = path.join(__dirname, '../..');
const SCAN_DIRS = ['src/pages', 'src/components'];
const HREF = /href\s*=\s*["'](?:\.\.\/|\/)?word\/([a-z0-9-]+)\.html(?:[#?][^"']*)?["']/gi;
const SKIP_EXIT_CODE = 78;

function listFiles(dir) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap(d => {
        const rel = path.join(dir, d.name);
        if (d.isDirectory()) return listFiles(rel);
        return /\.(html|js)$/.test(d.name) ? [rel] : [];
    });
}

function findLinks() {
    const links = [];
    for (const file of SCAN_DIRS.flatMap(listFiles)) {
        const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
        lines.forEach((line, i) => {
            for (const m of line.matchAll(HREF)) links.push({ file, line: i + 1, slug: m[1].toLowerCase() });
        });
    }
    return links;
}

// Where a redirect value points, as a site path, and whether that page exists.
function redirectTarget(value, liveSlugs) {
    if (value.startsWith('what-does-')) {
        return { href: `/${value}.html`, exists: fs.existsSync(path.join(ROOT, 'src/pages', `${value}.html`)) };
    }
    return { href: `/word/${value}.html`, exists: liveSlugs.has(value) };
}

// --- migration parsing -------------------------------------------------------------------------

function sqlStatements(sql) {
    const noComments = sql.replace(/--[^\n]*/g, '');
    const out = [];
    let cur = '';
    let inStr = false;
    for (let i = 0; i < noComments.length; i++) {
        const c = noComments[i];
        if (c === "'") {
            if (inStr && noComments[i + 1] === "'") { cur += "''"; i++; continue; }
            inStr = !inStr;
        }
        if (c === ';' && !inStr) { out.push(cur.trim()); cur = ''; continue; }
        cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
}

const literals = text => [...text.matchAll(/'((?:[^']|'')*)'/g)].map(m => m[1].replace(/''/g, "'"));

/**
 * Entries a migration removes from their current slug: rows it DELETEs, and rows whose pidgin an
 * UPDATE rewrites. Rows are matched by any string literal in the statement's WHERE clause that
 * equals a live id or headword, which over-matches rather than misses.
 */
function entriesMigrationRemoves(sql, entries) {
    const byId = new Map(entries.map(e => [String(e.id), e]));
    const byPidgin = new Map(entries.map(e => [e.pidgin.toLowerCase(), e]));
    const removed = new Map();
    for (const stmt of sqlStatements(sql)) {
        const [head, ...rest] = stmt.split(/\bwhere\b/i);
        const isDelete = /^delete\s+from\s+(public\.)?dictionary_entries\b/i.test(head);
        const isRename = /^update\s+(public\.)?dictionary_entries\b[\s\S]*\bset\b[\s\S]*\bpidgin\s*=/i.test(head);
        if (!isDelete && !isRename) continue;
        const where = rest.join(' ');
        for (const lit of literals(where)) {
            const e = byId.get(lit) || byPidgin.get(lit.toLowerCase());
            if (e) removed.set(e.id, e);
        }
    }
    return [...removed.values()];
}

// The entry that absorbs a removed headword: one that lists it as a spelling variant, either
// already or via an UPDATE in this migration that sets spelling_variants.
function survivorFor(removedEntry, entries, removedIds, sql) {
    const word = removedEntry.pidgin.toLowerCase();
    const live = entries.find(e => !removedIds.has(e.id) &&
        (e.spelling_variants || []).some(v => v.toLowerCase() === word));
    if (live) return live;
    if (!sql) return null;
    for (const stmt of sqlStatements(sql)) {
        if (!/^update\s+(public\.)?dictionary_entries\b/i.test(stmt) || !/spelling_variants/i.test(stmt)) continue;
        const [set, ...rest] = stmt.split(/\bwhere\b/i);
        if (!literals(set).some(l => l.toLowerCase() === word)) continue;
        for (const lit of literals(rest.join(' '))) {
            const e = entries.find(x => !removedIds.has(x.id) && (String(x.id) === lit || x.pidgin.toLowerCase() === lit.toLowerCase()));
            if (e) return e;
        }
    }
    return null;
}

// --- main --------------------------------------------------------------------------------------

async function main() {
    const migArg = process.argv.indexOf('--migration');
    const migrationPath = migArg > -1 ? process.argv[migArg + 1] : null;
    if (migArg > -1 && !migrationPath) {
        console.error('Usage: check-word-links.js [--migration <file.sql>]');
        process.exit(2);
    }

    console.log('🔗 Word-link guard\n');
    if (isOfflineMock) {
        console.log('⚪ No Supabase credentials: the mock fixture is not the live dictionary. Skipping.');
        process.exit(SKIP_EXIT_CODE);
    }

    // Same order the page generator uses, so -2/-3 suffixes land on the same entries.
    const entries = await fetchFromSupabase('dictionary_entries', 'id,pidgin,spelling_variants', 'pidgin.asc');
    if (!entries.length) {
        console.error('❌ dictionary_entries came back empty; refusing to judge links against nothing.');
        process.exit(1);
    }

    const sql = migrationPath ? fs.readFileSync(path.resolve(ROOT, migrationPath), 'utf8') : null;
    const removedEntries = sql ? entriesMigrationRemoves(sql, entries) : [];
    const removedIds = new Set(removedEntries.map(e => e.id));
    const slugOf = new Map(assignSlugs(entries).map(({ entry, slug }) => [entry.id, slug]));
    // Slugs after the migration. Surviving entries keep their slugs: pruning removed rows can
    // only shift -2/-3 suffixes, and a suffix collision is the rare case not worth modelling.
    const liveSlugs = new Set(entries.filter(e => !removedIds.has(e.id)).map(e => slugOf.get(e.id)));

    const problems = [];
    const variantOwner = slug => entries.find(e => !removedIds.has(e.id) &&
        (e.spelling_variants || []).some(v => createSlug(v) === slug));

    // 1. Hard-coded links
    const links = findLinks();
    for (const { file, line, slug } of links) {
        const where = `${file}:${line}`;
        if (redirects[slug] && redirects[slug] !== slug) {
            const t = redirectTarget(redirects[slug], liveSlugs);
            problems.push(`${where} links /word/${slug}.html, which redirects; link ${t.href} directly`);
        } else if (!liveSlugs.has(slug)) {
            const goneEntry = sql && entries.find(e => removedIds.has(e.id) && slugOf.get(e.id) === slug);
            const gone = Boolean(goneEntry);
            const owner = (goneEntry && survivorFor(goneEntry, entries, removedIds, sql)) || variantOwner(slug);
            const why = gone ? `removed by ${path.basename(migrationPath)}` : 'no such word page';
            const fix = owner ? `; "${slug}" is a spelling of ${owner.pidgin}, link /word/${slugOf.get(owner.id)}.html` : '';
            problems.push(`${where} links /word/${slug}.html: ${why}${fix}`);
        }
    }

    // 2. The redirect map itself
    for (const [from, to] of Object.entries(redirects)) {
        if (from === to) continue; // server.js ignores these
        const t = redirectTarget(to, liveSlugs);
        if (!t.exists) problems.push(`services/word-redirects.js: '${from}' → ${t.href}, which does not exist`);
        else if (redirects[to] && redirects[to] !== to) problems.push(`services/word-redirects.js: '${from}' → '${to}' is a chain ('${to}' redirects too); point it at the final page`);
        if (liveSlugs.has(from) && !to.startsWith('what-does-')) {
            problems.push(`services/word-redirects.js: '${from}' is a live word page but redirects to ${t.href}, hiding it`);
        }
    }

    // 3. Headwords the migration removes need a redirect
    for (const e of removedEntries) {
        const slug = slugOf.get(e.id);
        if (redirects[slug] || liveSlugs.has(slug)) continue;
        const survivor = survivorFor(e, entries, removedIds, sql);
        const hint = survivor ? `add '${slug}': '${slugOf.get(survivor.id)}'` : 'add a line pointing at the entry that absorbs it';
        problems.push(`${path.basename(migrationPath)} removes "${e.pidgin}": /word/${slug}.html will 404; ${hint} to services/word-redirects.js`);
    }

    console.log(`Dictionary: ${entries.length} entries${sql ? `, ${removedEntries.length} removed or renamed by ${path.basename(migrationPath)}` : ''}`);
    console.log(`Hard-coded /word/ links: ${links.length} in ${SCAN_DIRS.join(', ')}`);
    console.log(`Redirect lines: ${Object.keys(redirects).length}\n`);

    if (problems.length) {
        console.log(`❌ ${problems.length} problem(s):`);
        problems.forEach(p => console.log(`   - ${p}`));
        process.exit(1);
    }
    console.log('✅ Every word link resolves directly, and the redirect map is sound.');
}

main().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
});
