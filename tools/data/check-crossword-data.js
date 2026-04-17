const { supabase } = require('../../config/supabase');
require('dotenv').config();

async function checkCrossword() {
    console.log('🔍 Checking Crossword Data...');
    
    const { count: wordCount, error: wordErr } = await supabase
        .from('crossword_words')
        .select('*', { count: 'exact', head: true });
        
    const { count: puzzleCount, error: puzzleErr } = await supabase
        .from('crossword_puzzles')
        .select('*', { count: 'exact', head: true });
        
    console.log(`- Words in database: ${wordCount}`);
    console.log(`- Puzzles in database: ${puzzleCount}`);
    
    if (wordErr) console.error('Error fetching words:', wordErr.message);
    if (puzzleErr) console.error('Error fetching puzzles:', puzzleErr.message);
}

checkCrossword();
