#!/usr/bin/env node
/**
 * Run SQL migration against Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required for migrations');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const sqlFile = path.join(__dirname, '../supabase/migrations/003_lessons.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('🔄 Running migration: 003_lessons.sql\n');

    // Split by semicolon and run each statement
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
                // Try direct query for DDL
                const { error: queryError } = await supabase.from('_exec').select().limit(0);
                console.log(`  ⚠️  Statement may need manual execution`);
            } else {
                console.log(`  ✅ Executed`);
            }
        } catch (e) {
            console.log(`  ⚠️  ${e.message}`);
        }
    }

    console.log('\n📋 If tables were not created, run this SQL in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/jfzgzjgdptowfbtljvyp/sql/new\n');
}

runMigration();
