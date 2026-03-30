const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('Missing SUPABASE_URL');
}
if (!supabaseServiceKey) {
    console.error('Missing SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
}

if (!supabaseUrl || !supabaseServiceKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminStatus() {
    try {
        const { data, error } = await supabase
            .from('admin_users')
            .select('*');

        if (error) {
            console.error('Error fetching admin users:', error.message);
            return;
        }

        console.log(`Found ${data.length} admin users:`);
        data.forEach(u => {
            console.log(`User: ${u.username}`);
            console.log(`- Role: ${u.role}`);
            console.log(`- Failed attempts: ${u.failed_attempts}`);
            console.log(`- Locked until: ${u.locked_until}`);
            console.log(`- Last login: ${u.last_login}`);
            console.log('---');
        });
    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

checkAdminStatus();
