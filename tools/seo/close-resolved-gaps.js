#!/usr/bin/env node
/**
 * Close pending search_gaps rows the dictionary now answers.
 *
 * A gap stays "pending" after the word is added, or when it was never a gap at all
 * (an English query like "brother" that braddah's meaning already covers). This uses
 * the same coverage rules as npm run seo:loop and the admin Google Sync
 * (services/search-gaps.js), so all three agree on what a gap is.
 *
 * Usage:
 *   npm run seo:close-gaps            # report what would close (dry run)
 *   npm run seo:close-gaps -- --apply # mark them status='added'
 */

require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const { closeResolvedGaps } = require('../../services/search-gaps');

async function main() {
    const apply = process.argv.includes('--apply');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!process.env.SUPABASE_URL || !key) {
        console.error('❌ Needs SUPABASE_URL and a service-role key (search_gaps is not readable with the anon key).');
        process.exit(1);
    }
    const db = createClient(process.env.SUPABASE_URL, key);

    const { pending, closed } = await closeResolvedGaps(db, { dryRun: !apply });
    const byVia = closed.reduce((acc, g) => ({ ...acc, [g.via]: (acc[g.via] || 0) + 1 }), {});

    console.log(`${pending} pending search gaps; ${closed.length} already answered by the dictionary`);
    for (const [via, n] of Object.entries(byVia)) console.log(`   via ${via}: ${n}`);
    for (const g of closed.slice(0, 40)) console.log(`   "${g.term}" → ${g.match} (${g.via})`);
    if (closed.length > 40) console.log(`   … and ${closed.length - 40} more`);

    console.log(apply
        ? `\n✅ Closed ${closed.length} gaps (status='added').`
        : '\nDry run. Re-run with --apply to close them.');
}

main().catch(err => {
    console.error('❌', err.message);
    process.exit(1);
});
