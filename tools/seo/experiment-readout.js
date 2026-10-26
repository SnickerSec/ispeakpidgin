#!/usr/bin/env node
/**
 * Before/after Search Console readout for SEO changes already shipped.
 *
 * Each experiment compares the 28 days before it went live against the days since
 * (from two days after launch, giving Google time to recrawl, to the newest date
 * Search Console has). Both windows are normalised per day, so a short "after" window
 * is comparable, and spike days are dropped from both: brah drew ~347k impressions on
 * 2026-09-20/21 against a ~300/day baseline, which would swamp any real change.
 *
 * A longer surge ran 2026-09-22 → 10-15 on a few pages: impressions jumped several-fold with no
 * matching clicks, then fell back. Where it overlaps the 28-day window, `baseline` pins the
 * "before" window to the pre-surge weeks instead, and the surge's tail is dropped from "after".
 *
 * Position is impression-weighted, as Search Console reports it. Under 14 days of
 * "after" data the verdict is "too early": daily click counts here are single digits.
 *
 * Usage (production holds the credential):
 *   railway run -p 3ef8ad40-f6d4-4db3-a037-7a759c2193ac -e production -s ispeakpidgin -- \
 *     npm run seo:readout
 *   npm run seo:readout -- --json
 */

require('dotenv').config({ quiet: true });
const { SITE_URL, resolveKeyPath, credentialAttempts, getAuthClient } = require('../../services/search-gaps');

const SEARCH_CONSOLE_API = 'https://searchconsole.googleapis.com/webmasters/v3';
const ORIGIN = 'https://chokepidgin.com';
const BASELINE_DAYS = 28;
const RECRAWL_DAYS = 2;
const MIN_AFTER_DAYS = 14;

// Add an entry when an SEO change ships; keep it until the readout has been taken.
const EXPERIMENTS = [
    {
        name: 'Translator retarget (7949b942)',
        live: '2026-10-11',
        page: '/translator.html',
        queries: ['pidgin translator', 'english to pidgin', 'pidgin english translator', 'english to pidgin translator']
    },
    {
        name: 'Pidgin Bible: fixed verses, both editions, FAQ',
        live: '2026-10-11',
        page: '/pidgin-bible.html',
        queries: ['da jesus book', 'hawaiian pidgin bible', 'da good and spesho book', 'da jesus book pdf']
    },
    {
        name: 'brah answer snippet, slang FAQ, definition schema',
        live: '2026-10-12',
        page: '/what-does-brah-mean.html',
        queries: ['brah', 'brah meaning', 'brah definition', 'what is brah', 'define brah', 'what does brah mean', 'brah def', 'brah meaning slang'],
        excludeDates: ['2026-09-20', '2026-09-21']
    },
    { name: 'pau snippet', live: '2026-10-07', page: '/what-does-pau-mean.html' },
    // 10-07 answer-first titles lost ground on the question queries (faka: clicks 25 -> 6,
    // "faka in hawaiian" 3.4 -> 4.6; shaka: "shaka meaning" 6.2 -> 8.2). Hybrid: the searched
    // question back at the front of the title, the short answer kept in the description.
    {
        name: 'faka hybrid title (question + answer)',
        live: '2026-10-26',
        page: '/what-does-faka-mean.html',
        queries: ['faka', 'faka meaning', 'faka in hawaiian', 'faka meaning hawaiian', 'what does faka mean in hawaiian']
    },
    {
        name: 'shaka hybrid title (question + answer)',
        live: '2026-10-26',
        page: '/what-does-shaka-mean.html',
        queries: ['shaka meaning', 'what does shaka mean', 'shaka definition', 'hang loose sign']
    },
    { name: 'shaka snippet', live: '2026-10-07', page: '/what-does-shaka-mean.html' },
    { name: 'shoots snippet', live: '2026-10-07', page: '/what-does-shoots-mean.html' },
    { name: 'faka snippet', live: '2026-10-07', page: '/what-does-faka-mean.html' },
    {
        // 202 impr/d before the surge, 837 during it, 132 after: the 28 days before launch
        // were all surge, so measure against the weeks before it.
        name: 'mahalo snippet, FAQ, folk etymology corrected',
        live: '2026-10-12',
        page: '/what-does-mahalo-mean.html',
        queries: ['mahalo meaning', 'what does mahalo mean', 'hawaiian word for thank you', 'does mahalo mean thank you'],
        baseline: { from: '2026-08-23', to: '2026-09-19' },
        excludeDates: ['2026-10-14', '2026-10-15']
    },
    // The /word/ answer-first title cohort (kefe, fosho, mahalo nui loa, bumbai, shaka brah) is
    // gone: each of those pages now 301s to its what-does-*-mean page (services/word-redirects.js),
    // so there is no title change left to measure. Their landing pages are tracked below.
    {
        name: 'poho snippet, answer-first, FAQ',
        live: '2026-10-12',
        page: '/what-does-poho-mean.html',
        queries: ['poho meaning', 'what does poho mean', 'poho hawaiian', 'waste in hawaiian']
    },
    {
        name: 'niele snippet, answer-first, FAQ',
        live: '2026-10-12',
        page: '/what-does-niele-mean.html',
        queries: ['niele meaning', 'what does niele mean', 'nosy in hawaiian', 'hawaiian word for nosy']
    },
    {
        name: 'kimochi landing page, answer-first, FAQ',
        live: '2026-10-13',
        page: '/what-does-kimochi-mean.html',
        queries: ['kimochi meaning', 'what does kimochi mean', 'good kimochi', 'kimochi in english', 'kimochi definition']
    },
    {
        name: 'sarap snippet, answer-first, FAQ',
        live: '2026-10-13',
        page: '/what-does-sarap-mean.html',
        queries: ['sarap meaning', 'what does sarap mean', 'sarap', 'sarap hawaiian', 'is sarap hawaiian']
    },
    // Answer-first rollout to the 10 untreated /what-does-* pages with the most impressions
    // (2026-09-23 → 10-11: ~20.6k impressions, 25 clicks; sarap shipped separately above).
    // Set `live` to the deploy day.
    { name: 'what-does: keiki', live: '2026-10-13', page: '/what-does-keiki-mean.html', queries: ['keiki meaning', 'child in hawaiian'] },
    { name: 'what-does: kamaaina', live: '2026-10-13', page: '/what-does-kamaaina-mean.html', queries: ['kamaaina', 'hawaiian word for local'] },
    { name: 'what-does: a hui hou', live: '2026-10-13', page: '/what-does-a-hui-hou-mean.html', queries: ['a hui hou', 'a hui ho'] },
    { name: 'what-does: da kine', live: '2026-10-13', page: '/what-does-da-kine-mean.html', queries: ['da kine', 'da kine meaning'] },
    { name: 'what-does: pau hana', live: '2026-10-13', page: '/what-does-pau-hana-mean.html', queries: ['pau hana meaning', 'pau hana'] },
    { name: 'what-does: pilau', live: '2026-10-13', page: '/what-does-pilau-mean.html', queries: ['pilau meaning', 'pilau', 'what does pilau mean'] },
    { name: 'what-does: lolo', live: '2026-10-13', page: '/what-does-lolo-mean.html', queries: ['lolo meaning', 'lolo hawaiian', 'what does lolo mean'] },
    { name: 'what-does: howzit', live: '2026-10-13', page: '/what-does-howzit-mean.html', queries: ['howzit', 'howzit meaning'] },
    { name: 'what-does: akamai', live: '2026-10-13', page: '/what-does-akamai-mean.html', queries: ['akamai meaning', 'akamai definition'] },
    { name: 'what-does: humbug', live: '2026-10-13', page: '/what-does-humbug-mean.html', queries: ['humbug'] },
    {
        name: 'kefe landing page, answer-first, FAQ',
        live: '2026-10-13',
        page: '/what-does-kefe-mean.html',
        queries: ['kefe meaning', 'kefe', 'what does kefe mean in samoan', 'what does kefe mean']
    },
    {
        name: 'kapakahi landing page, answer-first, FAQ',
        live: '2026-10-13',
        page: '/what-does-kapakahi-mean.html',
        queries: ['kapakahi meaning', 'kapakahi', 'what does kapakahi mean in hawaii', 'what does kapakahi mean', 'all kapakahi']
    },
    {
        name: 'pidgin insults guide, answer-first, FAQ',
        live: '2026-10-13',
        page: '/funny-insulting-pidgin-phrases.html',
        queries: ['list of pidgin insults', 'painful pidgin insults in english', 'pidgin insults', 'insults in pidgin', 'hawaiian slang insults']
    },
    // Top 5 uncovered /word/ pages upgraded to dedicated /what-does-*-mean.html explainers
    { name: 'mahalo nui loa landing page, answer-first, FAQ', live: '2026-10-14', page: '/what-does-mahalo-nui-loa-mean.html', queries: ['mahalo nui loa', 'mahalo nui loa meaning', 'mahalo nui', 'what does mahalo nui loa mean'] },
    { name: 'fosho landing page, answer-first, FAQ', live: '2026-10-14', page: '/what-does-fosho-mean.html', queries: ['fosho meaning', 'fosho', 'fo sho meaning', 'what does fosho mean'] },
    { name: 'kokua landing page, answer-first, FAQ', live: '2026-10-14', page: '/what-does-kokua-mean.html', queries: ['kokua meaning', 'kokua', 'what does kokua mean', 'mahalo for your kokua'] },
    { name: 'cuz landing page, answer-first, FAQ', live: '2026-10-14', page: '/what-does-cuz-mean.html', queries: ['cuz meaning', 'cuz slang', 'what does cuz mean'] },
    { name: 'bumbai landing page, answer-first, FAQ', live: '2026-10-14', page: '/what-does-bumbai-mean.html', queries: ['bumbai', 'bumbai meaning', 'bumbye meaning', 'bumbai you learn'] },
    // Final 9 untreated /what-does-* pages upgraded to answer-first + FAQPage schema
    { name: 'what-does: broke da mouth', live: '2026-10-14', page: '/what-does-broke-da-mouth-mean.html', queries: ['broke da mouth', 'broke da mouth meaning'] },
    { name: 'what-does: kanak attack', live: '2026-10-14', page: '/what-does-kanak-attack-mean.html', queries: ['kanak attack', 'kanak attack meaning'] },
    { name: 'what-does: mayjah', live: '2026-10-14', page: '/what-does-mayjah-mean.html', queries: ['mayjah', 'mayjah meaning'] },
    { name: 'what-does: moopuna', live: '2026-10-14', page: '/what-does-moopuna-mean.html', queries: ['moopuna', 'moopuna meaning', 'grandchild in hawaiian'] },
    { name: 'what-does: ono grindz', live: '2026-10-14', page: '/what-does-ono-grindz-mean.html', queries: ['ono grindz', 'ono grindz meaning'] },
    { name: 'what-does: pake', live: '2026-10-14', page: '/what-does-pake-mean.html', queries: ['pake meaning', 'pake hawaiian'] },
    { name: 'what-does: rajah', live: '2026-10-14', page: '/what-does-rajah-mean.html', queries: ['rajah dat', 'rajah meaning hawaii'] },
    { name: 'what-does: sistah', live: '2026-10-14', page: '/what-does-sistah-mean.html', queries: ['sistah meaning', 'tita hawaii'] },
    { name: 'what-does: small kine', live: '2026-10-14', page: '/what-does-small-kine-mean.html', queries: ['small kine', 'small kine meaning'] },
    // Next 5 high-impression /word/ pages upgraded to dedicated /what-does-*-mean.html explainers (2026-10-15)
    { name: 'shaka brah landing page, answer-first, FAQ', live: '2026-10-15', page: '/what-does-shaka-brah-mean.html', queries: ['shaka brah', 'shaka brah meaning', 'what does shaka brah mean'] },
    { name: 'imua landing page, answer-first, FAQ', live: '2026-10-15', page: '/what-does-imua-mean.html', queries: ['imua', 'imua meaning', 'what does imua mean in hawaiian', 'i mua meaning'] },
    { name: 'no need landing page, answer-first, FAQ', live: '2026-10-15', page: '/what-does-no-need-mean.html', queries: ['no need', 'no need meaning', 'no need worry'] },
    { name: 'kala landing page, answer-first, FAQ', live: '2026-10-15', page: '/what-does-kala-mean.html', queries: ['kala meaning', 'kala hawaiian meaning', 'hawaiian word for money', 'e kala mai'] },
    { name: 'unko landing page, answer-first, FAQ', live: '2026-10-15', page: '/what-does-unko-mean.html', queries: ['unko', 'unko meaning', 'unko hawaii'] },
    // Top 6 hub & guide pages upgraded with answer-first snippets & FAQPage schema (2026-10-15)
    { name: 'dictionary hub answer-first & FAQ', live: '2026-10-15', page: '/dictionary.html', queries: ['hawaiian pidgin dictionary', 'pidgin dictionary', 'hawaiian slang dictionary'] },
    { name: 'pickup lines hub answer-first & FAQ', live: '2026-10-15', page: '/pickup-lines.html', queries: ['hawaiian pickup lines', 'pidgin pickup lines', 'hawaiian pidgin pickup lines'] },
    { name: 'games hub answer-first & FAQ', live: '2026-10-15', page: '/games.html', queries: ['pidgin wordle', 'hawaiian pidgin games', 'pidgin crossword'] },
    { name: 'cheat sheet guide answer-first & FAQ', live: '2026-10-15', page: '/cheat-sheet.html', queries: ['hawaiian pidgin cheat sheet', 'pidgin phrases', 'common hawaiian pidgin phrases'] },
    { name: 'plate lunch guide answer-first & FAQ', live: '2026-10-15', page: '/15-essential-pidgin-phrases-ordering-plate-lunch.html', queries: ['two scoop rice', 'hawaiian plate lunch', 'how to order plate lunch in hawaii'] },
    { name: 'visitor phrases blog answer-first & FAQ', live: '2026-10-15', page: '/blog/10-essential-pidgin-phrases-visitors.html', queries: ['pidgin phrases for visitors', 'essential hawaiian pidgin phrases'] }
];

const isoDay = d => d.toISOString().slice(0, 10);
const addDays = (day, n) => { const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return isoDay(d); };

async function connect() {
    for (const { source, label } of credentialAttempts(resolveKeyPath())) {
        try {
            const client = await (await getAuthClient(source)).getClient();
            await client.request({ url: `${SEARCH_CONSOLE_API}/sites/${encodeURIComponent(SITE_URL)}`, method: 'GET' });
            return { client, label };
        } catch (err) {
            console.error(`   ✗ ${label}: ${err.message.split('\n')[0]}`);
        }
    }
    return null;
}

async function dailyRows(client, { page, query, startDate, endDate }) {
    const filters = [{ dimension: 'page', operator: 'equals', expression: ORIGIN + page }];
    if (query) filters.push({ dimension: 'query', operator: 'equals', expression: query });
    const res = await client.request({
        url: `${SEARCH_CONSOLE_API}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
        method: 'POST',
        data: { startDate, endDate, dimensions: ['date'], dimensionFilterGroups: [{ filters }], rowLimit: 1000 }
    });
    return (res.data.rows || []).map(r => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position }));
}

/** Per-day totals over [from, to], skipping excluded dates. Days with no row count as zero. */
function summarise(rows, from, to, exclude) {
    const days = [];
    for (let d = from; d <= to; d = addDays(d, 1)) if (!exclude.has(d)) days.push(d);
    const inWindow = rows.filter(r => r.date >= from && r.date <= to && !exclude.has(r.date));
    const clicks = inWindow.reduce((s, r) => s + r.clicks, 0);
    const impressions = inWindow.reduce((s, r) => s + r.impressions, 0);
    const position = impressions ? inWindow.reduce((s, r) => s + r.position * r.impressions, 0) / impressions : null;
    return {
        days: days.length,
        clicks,
        impressions,
        clicksPerDay: days.length ? clicks / days.length : 0,
        impressionsPerDay: days.length ? impressions / days.length : 0,
        ctr: impressions ? clicks / impressions : 0,
        position
    };
}

async function measure(client, target, exp, lastDay) {
    const exclude = new Set(exp.excludeDates || []);
    const before = exp.baseline || { from: addDays(exp.live, -BASELINE_DAYS), to: addDays(exp.live, -1) };
    const after = { from: addDays(exp.live, RECRAWL_DAYS), to: lastDay };
    const rows = await dailyRows(client, { ...target, startDate: before.from, endDate: after.to });
    return {
        before: { ...before, ...summarise(rows, before.from, before.to, exclude) },
        after: after.from <= after.to ? { ...after, ...summarise(rows, after.from, after.to, exclude) } : null
    };
}

function verdict(m) {
    if (!m.after || m.after.days < MIN_AFTER_DAYS) return `too early (${m.after ? m.after.days : 0}/${MIN_AFTER_DAYS} days after)`;
    if (!m.before.impressions || !m.after.impressions) return 'no impressions in one window';
    const pos = m.before.position - m.after.position; // positive = moved up
    const ctr = m.after.ctr - m.before.ctr;
    const parts = [];
    if (Math.abs(pos) >= 0.5) parts.push(pos > 0 ? `up ${pos.toFixed(1)} positions` : `down ${(-pos).toFixed(1)} positions`);
    if (Math.abs(ctr) >= 0.002) parts.push(`CTR ${ctr > 0 ? '+' : ''}${(ctr * 100).toFixed(2)} pts`);
    return parts.length ? parts.join(', ') : 'no clear change';
}

function line(label, m) {
    const f = s => s
        ? `${s.impressionsPerDay.toFixed(1).padStart(7)} impr/d ${s.clicksPerDay.toFixed(2).padStart(5)} clk/d ${(s.ctr * 100).toFixed(2).padStart(5)}% @${s.position ? s.position.toFixed(1) : '—'}`
        : '(no data yet)'.padEnd(44);
    return `   ${label.padEnd(30)} before ${f(m.before)} │ after ${f(m.after)} │ ${verdict(m)}`;
}

async function main() {
    const json = process.argv.includes('--json');
    const conn = await connect();
    if (!conn) {
        console.error('❌ No credential can read Search Console. Run under railway run (GOOGLE_CREDENTIALS_BASE64), see the usage above.');
        process.exit(1);
    }
    // Search Console data lags ~3 days; anything newer is partial.
    const lastDay = isoDay(new Date(Date.now() - 3 * 864e5));

    const report = [];
    for (const exp of EXPERIMENTS) {
        const result = { ...exp, overall: await measure(conn.client, { page: exp.page }, exp, lastDay), queries: [] };
        for (const query of exp.queries || []) {
            result.queries.push({ query, ...(await measure(conn.client, { page: exp.page, query }, exp, lastDay)) });
        }
        report.push(result);
    }

    if (json) {
        console.log(JSON.stringify({ property: SITE_URL, credential: conn.label, lastDay, experiments: report }, null, 2));
        return;
    }
    console.log(`📊 SEO experiment readout: ${SITE_URL}, data through ${lastDay} (${conn.label})`);
    console.log(`   before = ${BASELINE_DAYS} days before launch; after = launch+${RECRAWL_DAYS}d → ${lastDay}; per-day averages\n`);
    for (const r of report) {
        console.log(`${r.name}: ${r.page}, live ${r.live}${r.baseline ? `, baseline ${r.baseline.from} → ${r.baseline.to}` : ''}${r.excludeDates ? `, excluding ${r.excludeDates.join(', ')}` : ''}`);
        console.log(line('page total', r.overall));
        for (const q of r.queries) console.log(line(`"${q.query}"`, q));
        console.log('');
    }
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });
