const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExisting() {
    const words = ['Buggah', 'Choke', 'Grindz', 'Howzit', 'Shoots'];
    try {
        const { data, error } = await supabase
            .from('dictionary_entries')
            .select('pidgin')
            .in('pidgin', words.map(w => w.toLowerCase()));

        if (error) throw error;

        console.log('--- EXISTING WORDS ---');
        const existing = data.map(d => d.pidgin.toLowerCase());
        words.forEach(w => {
            console.log(`${w}: ${existing.includes(w.toLowerCase()) ? 'EXISTS' : 'MISSING'}`);
        });
    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

checkExisting();
