const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPendingItems() {
    try {
        const [suggestions, questions, gaps] = await Promise.all([
            supabase.from('user_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('local_questions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('search_gaps').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        console.log('--- PENDING ITEMS ---');
        console.log(`Pending Suggestions: ${suggestions.count || 0}`);
        console.log(`Pending Questions: ${questions.count || 0}`);
        console.log(`Pending Search Gaps: ${gaps.count || 0}`);
        console.log('---------------------');
        
        if (suggestions.count > 0) {
            const { data: suggestionsData } = await supabase
                .from('user_suggestions')
                .select('*')
                .eq('status', 'pending')
                .limit(5);
            console.log('\n--- SAMPLE SUGGESTIONS ---');
            suggestionsData.forEach(s => console.log(`- ${s.pidgin}: ${s.english}`));
        }

        if (questions.count > 0) {
            const { data: questionsData } = await supabase
                .from('local_questions')
                .select('*')
                .eq('status', 'pending')
                .limit(5);
            console.log('\n--- SAMPLE QUESTIONS ---');
            questionsData.forEach(q => console.log(`- ${q.question_text} (from: ${q.user_name || 'Anon'})`));
        }

    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

checkPendingItems();
