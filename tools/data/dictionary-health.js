const { supabase } = require('../../config/supabase');
require('dotenv').config();

async function checkHealth() {
    console.log('🩺 Dictionary Content Health Check');
    console.log('=================================\n');

    try {
        const { data: entries, error } = await supabase
            .from('dictionary_entries')
            .select('pidgin, usage, origin, examples');

        if (error) throw error;

        let total = entries.length;
        let thinEntries = [];
        let missingUsage = 0;
        let missingOrigin = 0;
        let fewExamples = 0;

        entries.forEach(entry => {
            const needsUsage = !entry.usage || entry.usage.length < 10;
            const needsOrigin = !entry.origin || entry.origin.length < 5;
            const needsExamples = !entry.examples || entry.examples.length < 2;

            if (needsUsage) missingUsage++;
            if (needsOrigin) missingOrigin++;
            if (needsExamples) fewExamples++;

            if (needsUsage || needsOrigin || needsExamples) {
                thinEntries.push(entry);
            }
        });

        console.log(`📊 Statistics:`);
        console.log(`- Total Entries: ${total}`);
        console.log(`- Rich Entries: ${total - thinEntries.length}`);
        console.log(`- Thin Entries: ${thinEntries.length} (${((thinEntries.length / total) * 100).toFixed(1)}%)`);
        console.log(`\n🔍 Reasons for being "Thin":`);
        console.log(`- Missing/Short Usage: ${missingUsage}`);
        console.log(`- Missing/Short Origin: ${missingOrigin}`);
        console.log(`- Fewer than 2 examples: ${fewExamples}`);

        console.log('\n📌 Example Thin Entries:');
        thinEntries.slice(0, 10).forEach(e => {
            console.log(`- "${e.pidgin}" (Usage: ${e.usage ? 'Short' : 'Missing'}, Origin: ${e.origin ? 'Short' : 'Missing'}, Examples: ${e.examples ? e.examples.length : 0})`);
        });

    } catch (err) {
        console.error('❌ Health check failed:', err.message);
    }
}

checkHealth();
