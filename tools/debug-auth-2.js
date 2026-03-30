const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://jfzgzjgdptowfbtljvyp.supabase.co';
// Try to get key from process.env or .env (if dotenv worked)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY in environment');
} else {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    async function checkEverything() {
        try {
            // Check users
            const { data: users, error: userError } = await supabase
                .from('admin_users')
                .select('*');

            if (userError) {
                console.error('Error fetching admin users:', userError.message);
            } else {
                console.log(`Found ${users.length} admin users:`);
                users.forEach(u => {
                    console.log(`- ${u.username}: attempts=${u.failed_attempts}, locked=${u.locked_until}`);
                });
            }

            // Check audit log
            const { data: logs, error: logError } = await supabase
                .from('admin_audit_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (logError) {
                console.error('Error fetching audit logs:', logError.message);
            } else {
                console.log('\nLast 10 audit logs:');
                logs.forEach(l => {
                    console.log(`[${l.created_at}] ${l.username}: ${l.action} ${l.resource || ''}`);
                });
            }
        } catch (err) {
            console.error('Fatal error:', err.message);
        }
    }

    checkEverything();
}
