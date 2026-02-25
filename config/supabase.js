// Supabase client configuration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase, supabaseUrl, supabaseAnonKey };
