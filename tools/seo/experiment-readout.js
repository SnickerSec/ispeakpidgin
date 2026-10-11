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
    { name: 'brah snippet', live: '2026-10-03', page: '/what-does-brah-mean.html', excludeDates: ['2026-09-20', '2026-09-21'] },
    { name: 'pau snippet', live: '2026-10-07', page: '/what-does-pau-mean.html' },
    { name: 'shaka snippet', live: '2026-10-07', page: '/what-does-shaka-mean.html' },
    { name: 'shoots snippet', live: '2026-10-07', page: '/what-does-shoots-mean.html' },
    { name: 'faka snippet', live: '2026-10-07', page: '/what-does-faka-mean.html' }
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
    const before = { from: addDays(exp.live, -BASELINE_DAYS), to: addDays(exp.live, -1) };
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
        console.log(`${r.name}: ${r.page}, live ${r.live}${r.excludeDates ? `, excluding ${r.excludeDates.join(', ')}` : ''}`);
        console.log(line('page total', r.overall));
        for (const q of r.queries) console.log(line(`"${q.query}"`, q));
        console.log('');
    }
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1); });
