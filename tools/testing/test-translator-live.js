#!/usr/bin/env node

/**
 * Live Translator Test
 *
 * The other translator suites hand PidginTranslator a mock data loader with no entries, so they
 * never see the dictionary. This one loads the real browser stack in page order
 * (supabase-data-loader → phrase-translator → sentence-chunker → context-tracker → translator)
 * and feeds it the live dictionary_entries rows through the loader's own loadFromSupabase().
 *
 * Run it after any data migration: a merge on 2026-10-02 silently turned "the best" into
 * "da bomb" by dropping a meaning, and only a live run shows that.
 *
 * Checks:
 *   1. Golden translations both ways (core words and sentences).
 *   2. No ʻŌlelo Hawaiʻi entry leaks into English→Pidgin output unless
 *      SupabaseDataLoader.PIDGIN_HAWAIIAN_LOANWORDS allows that meaning.
 *
 * Needs SUPABASE_URL + SUPABASE_ANON_KEY; without them it exits 78, which run-all-tests.js shows
 * as SKIPPED rather than passing on data it never saw.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

const ROOT = path.join(__dirname, '../..');
const PAGE_SCRIPTS = [
    'src/components/shared/supabase-data-loader.js',
    'src/components/translator/phrase-translator.js',
    'src/components/translator/sentence-chunker.js',
    'src/components/translator/context-tracker.js',
    'src/components/translator/translator.js'
];

// [input, expected output] — compared case-insensitively, ignoring trailing punctuation
const ENGLISH_TO_PIDGIN = [
    ['thank you', 'mahalo'],
    ['family', 'ohana'],
    ['delicious', 'ono'],
    ['lazy', 'molowa'],
    ['finished', 'pau'],
    ['grandmother', 'tūtū'],
    ['the best', "da bes'!"],
    ['happy birthday', 'hauʻoli lā hānau'],
    ['how are you?', 'how you stay'],
    ['no problem', 'no worries'],
    ['I don\'t know', 'I no know'],
    ['Do you want to eat?', 'you like eat, eh'],
    ['He is at home', 'he stay at home'],
    ['she is angry', 'she stay angry'],
    ["Let's go", 'we go'],
    ['I can not go', 'I no can go'],
    ["I can't go", 'I no can go']
];
const PIDGIN_TO_ENGLISH = [
    ['howzit', 'how are you'],
    ['da kine', 'the thing'],
    ['pau hana', 'after work'],
    ['broke da mouth', 'delicious'],
    ['no can', 'cannot'],
    ['wen go', 'went'],
    ['molowa', 'lazy'],
    ['bumbai', 'later'],
    ['braddah', 'brother'],
    ['ohana', 'family'],
    ['kokua', 'help'],
    ['no ka oi', 'the best'],
    ['mo bettah', 'better'],
    ['I no can go', 'I cannot go'],
    ['we go beach', "let's go beach"]
];

// Pidgin → English outputs that must not contain a phrase (a mistranslation seen before)
const PIDGIN_TO_ENGLISH_NEVER = [
    ['you like go?', "let's"],      // "go" used to read as "let's go"
    ['stay go', 'doing well'],      // short phrase fuzzy-matched "stay good"
    ['he nevah like', 'nevah']      // spelling variant of neva left untranslated
];

async function liveDictionary() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    const res = await fetch(`${url}/rest/v1/dictionary_entries?select=*&order=pidgin.asc`, {
        headers: { apikey: key, Range: '0-4999' }
    });
    if (!res.ok) throw new Error(`dictionary_entries: HTTP ${res.status}`);
    const entries = await res.json();
    const byCategory = {};
    for (const e of entries) byCategory[e.category || 'uncategorized'] = (byCategory[e.category || 'uncategorized'] || 0) + 1;
    return { entries, stats: { totalEntries: entries.length, byCategory, lastUpdated: new Date().toISOString() } };
}

// The page's scripts in a sandbox where, as in a browser, window is the global object
async function loadTranslatorStack(dictionary) {
    const listeners = {};
    const ctx = {
        addEventListener: (type, fn) => (listeners[type] ??= []).push(fn),
        removeEventListener() {},
        dispatchEvent: e => { (listeners[e.type] || []).slice().forEach(fn => fn(e)); return true; },
        location: { hostname: 'localhost' },
        console: { ...console, log() {}, info() {}, debug() {} },
        document: { readyState: 'loading', addEventListener() {}, getElementById: () => null, querySelector: () => null },
        navigator: { userAgent: 'node' },
        performance: { now: () => Date.now() },
        localStorage: { getItem: () => null, setItem() {} },
        Event: class { constructor(type, init) { this.type = type; Object.assign(this, init); } },
        CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
        settingsManager: { get: () => 'false' }, // no AI fallback: deterministic output
        fetch: async url => String(url).endsWith('/api/dictionary/all')
            ? { ok: true, json: async () => dictionary }
            : { ok: false, status: 404, json: async () => ({}) },
        setTimeout, clearTimeout, URLSearchParams
    };
    vm.createContext(ctx);
    ctx.window = ctx;
    for (const file of PAGE_SCRIPTS) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), ctx, { filename: file });
    }
    vm.runInContext('globalThis.__stack = { loader: supabaseDataLoader, translator, Loader: SupabaseDataLoader }', ctx);
    const stack = ctx.__stack;
    await stack.loader.loadFromSupabase();
    ctx.dispatchEvent(new ctx.Event('pidginDataLoaded'));
    await new Promise(resolve => setTimeout(resolve, 50)); // phrase/chunker loaders resolve on the event
    return stack;
}

const normalize = s => String(s || '').toLowerCase().replace(/[.?!\s]+$/, '').trim();

(async () => {
    console.log('🌐 Live Translator Test\n');
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.log('⚪ SKIPPED: SUPABASE_URL / SUPABASE_ANON_KEY not set — nothing was measured.');
        process.exit(78);
    }

    const dictionary = await liveDictionary();
    const { translator, Loader } = await loadTranslatorStack(dictionary);
    console.log(`   ${dictionary.entries.length} live entries loaded\n`);

    const failures = [];
    const check = (label, ok, detail) => {
        console.log(`   ${ok ? '✅' : '❌'} ${label}${ok ? '' : `\n      ${detail}`}`);
        if (!ok) failures.push(label);
    };

    console.log('1. English → Pidgin');
    for (const [input, expected] of ENGLISH_TO_PIDGIN) {
        const { text } = await translator.translate(input, 'eng-to-pidgin');
        check(`"${input}" → "${expected}"`, normalize(text) === normalize(expected), `got "${text}"`);
    }

    console.log('\n2. Pidgin → English');
    for (const [input, expected] of PIDGIN_TO_ENGLISH) {
        const { text } = await translator.translate(input, 'pidgin-to-eng');
        check(`"${input}" → "${expected}"`, normalize(text) === normalize(expected), `got "${text}"`);
    }

    for (const [input, banned] of PIDGIN_TO_ENGLISH_NEVER) {
        const { text } = await translator.translate(input, 'pidgin-to-eng');
        check(`"${input}" → no "${banned}"`, !normalize(text).includes(banned), `got "${text}"`);
    }

    // Every meaning of every Hawaiian entry, translated: the output must not be a Hawaiian
    // headword unless the allowlist permits that headword for that meaning.
    console.log('\n3. ʻŌlelo Hawaiʻi stays out of Pidgin output');
    const fold = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ'ʻ‘’]/g, '').trim();
    const hawaiian = dictionary.entries.filter(e => e.source_language === 'hawaiian');
    const hawaiianHeadwords = new Map(hawaiian.map(e => [fold(e.pidgin), e]));
    const allowed = (word, meaning) => (Loader.PIDGIN_HAWAIIAN_LOANWORDS[word] || []).includes(meaning);
    const leaks = [];
    for (const entry of hawaiian) {
        for (const meaning of entry.english || []) {
            const { text } = await translator.translate(meaning, 'eng-to-pidgin');
            const out = fold(normalize(text));
            if (hawaiianHeadwords.has(out) && out !== fold(meaning) && !allowed(out, meaning.toLowerCase().trim())) {
                leaks.push(`"${meaning}" → "${text}"`);
            }
        }
    }
    check(`${hawaiian.length} Hawaiian entries: no unapproved Hawaiian output`, leaks.length === 0,
        `${leaks.length} leak(s): ${leaks.slice(0, 10).join(', ')}`);

    const total = ENGLISH_TO_PIDGIN.length + PIDGIN_TO_ENGLISH.length + PIDGIN_TO_ENGLISH_NEVER.length + 1;
    if (failures.length) {
        console.error(`\n❌ ${failures.length} of ${total} live translator checks failed`);
        process.exit(1);
    }
    console.log(`\n🎉 All ${total} live translator checks passed! 🌺`);
})().catch(err => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
});
