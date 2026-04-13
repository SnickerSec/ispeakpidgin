const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPending() {
    console.log('🔍 Checking for pending questions and suggestions...');
    
    try {
        const { data: questions, error: qError } = await supabase
            .from('local_questions')
            .select('*')
            .eq('status', 'pending');
        
        if (qError) throw qError;
        console.log(`📝 Pending Questions: ${questions.length}`);
        questions.forEach((q, i) => {
            console.log(`   ${i+1}. [${q.user_name}] ${q.question_text.substring(0, 50)}...`);
        });

        const { data: suggestions, error: sError } = await supabase
            .from('user_suggestions')
            .select('*')
            .eq('status', 'pending');
        
        if (sError) throw sError;
        console.log(`💡 Pending Suggestions: ${suggestions.length}`);
        suggestions.forEach((s, i) => {
            console.log(`   ${i+1}. [${s.contributor_name}] ${s.pidgin} -> ${s.english}`);
        });

        const { data: gaps, error: gError } = await supabase
            .from('search_gaps')
            .select('*')
            .eq('status', 'pending');
        
        if (gError) throw gError;
        console.log(`🔍 Search Gaps (Pending): ${gaps.length}`);
        gaps.sort((a, b) => b.count - a.count);
        gaps.slice(0, 10).forEach((g, i) => {
            console.log(`   ${i+1}. "${g.term}" (${g.count} searches)`);
        });

    } catch (error) {
        console.error('Error checking pending items:', error.message);
    }
}

checkPending();
