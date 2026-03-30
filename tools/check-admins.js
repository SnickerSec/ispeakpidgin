const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUsers() {
    try {
        const { data, count, error } = await supabase
            .from('admin_users')
            .select('id, username, role, failed_attempts, locked_until', { count: 'exact' });

        if (error) {
            console.error('Error fetching admin users:', error.message);
            return;
        }

        console.log(`Found ${count} admin users:`);
        data.forEach(u => {
            console.log(`- ${u.username} (${u.role}): ${u.failed_attempts} failed attempts, Locked until: ${u.locked_until || 'None'}`);
        });
    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

checkAdminUsers();
