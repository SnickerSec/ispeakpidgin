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
            .from('dictionary_suggestions')
            .select('*')
            .eq('status', 'pending');
        
        if (sError) {
            // Table might not exist yet, ignore if so
            if (sError.code !== 'PGRST116') {
                 console.log('📝 dictionary_suggestions table not found or empty.');
            } else {
                throw sError;
            }
        } else {
            console.log(`💡 Pending Suggestions: ${suggestions.length}`);
        }

    } catch (error) {
        console.error('Error checking pending items:', error.message);
    }
}

checkPending();
