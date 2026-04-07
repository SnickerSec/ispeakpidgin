const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    const { data: existing } = await supabase.from('dictionary_entries').select('pidgin');
    const existingSet = new Set(existing.map(e => e.pidgin.toLowerCase()));
    
    console.log(`Total in DB: ${existing.length}`);
    
    const missingFile = JSON.parse(fs.readFileSync('docs/missing-terms-completed.json', 'utf8'));
    
    console.log('--- Diagnosis of "Missing" Terms ---');
    missingFile.missing.forEach(m => {
        const inDB = existingSet.has(m.pidgin.toLowerCase());
        if (inDB) {
            console.log(`[ALREADY IN DB] "${m.pidgin}" - Why did feedback-loop miss it?`);
            // Check for exact match vs fuzzy
            const exact = existing.find(e => e.pidgin.toLowerCase() === m.pidgin.toLowerCase());
            console.log(`   DB Version: "${exact.pidgin}"`);
        } else {
            console.log(`[ACTUALLY MISSING] "${m.pidgin}"`);
        }
    });
}

diagnose();
