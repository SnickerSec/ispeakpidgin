const express = require('express');
const router = express.Router();

/**
 * Game Routes (Wordle, Crossword, Quiz)
 */
module.exports = function(supabase, dictionaryLimiter) {

    // ============================================
    // WORDLE API
    // ============================================

    router.get('/wordle/daily', dictionaryLimiter, async (req, res) => {
        try {
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });
            const { data: usedWord, error: usedError } = await supabase.from('wordle_words').select('*').eq('used_on', today).single();

            if (usedWord && !usedError) {
                return res.json({
                    word: usedWord.word,
                    meaning: usedWord.meaning,
                    pronunciation: usedWord.pronunciation,
                    difficulty: usedWord.difficulty,
                    date: today
                });
            }

            const { data: availableWords, error } = await supabase.from('wordle_words').select('*').eq('is_solution', true).is('used_on', null);
            if (error || !availableWords || availableWords.length === 0) {
                const { data: anyWord } = await supabase.from('wordle_words').select('*').eq('is_solution', true).limit(1).single();
                if (anyWord) return res.json({ word: anyWord.word, meaning: anyWord.meaning, pronunciation: anyWord.pronunciation, difficulty: anyWord.difficulty, date: today, recycled: true });
                return res.status(500).json({ error: 'No wordle words available' });
            }

            const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
            res.json({ word: randomWord.word, meaning: randomWord.meaning, pronunciation: randomWord.pronunciation, difficulty: randomWord.difficulty, date: today });
        } catch (error) {
            console.error('Wordle daily API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/wordle/validate/:word', dictionaryLimiter, async (req, res) => {
        try {
            const { word } = req.params;
            if (!word || word.length !== 5) return res.json({ valid: false, reason: 'Word must be exactly 5 letters' });

            const { data, error } = await supabase.from('wordle_words').select('word, is_valid_guess').ilike('word', word.toLowerCase()).single();
            if (error || !data) return res.json({ valid: false, reason: 'Word not in dictionary' });
            res.json({ valid: data.is_valid_guess, word: data.word });
        } catch (error) {
            console.error('Wordle validate API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/wordle/words', dictionaryLimiter, async (req, res) => {
        try {
            const { solutions_only, valid_guesses_only, difficulty } = req.query;
            let query = supabase.from('wordle_words').select('word, is_solution, is_valid_guess, difficulty');
            if (solutions_only === 'true') query = query.eq('is_solution', true);
            if (valid_guesses_only === 'true') query = query.eq('is_valid_guess', true);
            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch wordle words' });

            res.json({
                words: data.map(w => w.word),
                count: data.length,
                solutions: data.filter(w => w.is_solution).length,
                validGuesses: data.filter(w => w.is_valid_guess).length
            });
        } catch (error) {
            console.error('Wordle words API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // CROSSWORD API
    // ============================================

    router.get('/crossword/words', dictionaryLimiter, async (req, res) => {
        try {
            const { category, difficulty, minLength, maxLength } = req.query;
            let query = supabase.from('crossword_words').select('*');
            if (category) query = query.eq('category', category);
            if (difficulty) query = query.eq('difficulty', difficulty);
            if (minLength) query = query.gte('length', parseInt(minLength));
            if (maxLength) query = query.lte('length', parseInt(maxLength));

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch crossword words' });
            res.json({ words: data, count: data.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/crossword/random', dictionaryLimiter, async (req, res) => {
        try {
            const { count = 20, difficulty } = req.query;
            let query = supabase.from('crossword_words').select('*');
            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch words' });

            const shuffled = data.sort(() => Math.random() - 0.5).slice(0, parseInt(count));
            res.json({ words: shuffled, count: shuffled.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/crossword/puzzles', dictionaryLimiter, async (req, res) => {
        try {
            const { difficulty, theme } = req.query;
            let query = supabase.from('crossword_puzzles').select('*');
            if (difficulty) query = query.eq('difficulty', difficulty);
            if (theme) query = query.ilike('theme', `%${theme}%`);
            query = query.order('puzzle_id', { ascending: true });

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch crossword puzzles' });
            res.json({ puzzles: data, count: data.length });
        } catch (error) {
            console.error('Crossword puzzles API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/crossword/puzzles/:puzzleId', dictionaryLimiter, async (req, res) => {
        try {
            const { puzzleId } = req.params;
            const { data, error } = await supabase.from('crossword_puzzles').select('*').eq('puzzle_id', puzzleId).single();

            if (error) {
                if (error.code === 'PGRST116') return res.status(404).json({ error: 'Puzzle not found' });
                return res.status(500).json({ error: 'Failed to fetch puzzle' });
            }
            res.json(data);
        } catch (error) {
            console.error('Crossword puzzle API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/crossword/daily', dictionaryLimiter, async (req, res) => {
        try {
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });
            const { data: todayPuzzle, error: todayError } = await supabase.from('crossword_puzzles').select('*').eq('used_on', today).single();

            if (todayPuzzle && !todayError) return res.json(todayPuzzle);

            const { data: allPuzzles, error } = await supabase.from('crossword_puzzles').select('*').order('puzzle_id', { ascending: true });
            if (error || !allPuzzles || allPuzzles.length === 0) return res.status(500).json({ error: 'No crossword puzzles available' });

            const startOfYear = new Date(new Date().getFullYear(), 0, 0);
            const diff = new Date() - startOfYear;
            const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
            const puzzleIndex = dayOfYear % allPuzzles.length;

            res.json({ ...allPuzzles[puzzleIndex], date: today });
        } catch (error) {
            console.error('Crossword daily API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // QUIZ API
    // ============================================

    router.get('/quiz/questions', dictionaryLimiter, async (req, res) => {
        try {
            const { category, difficulty, count = 10 } = req.query;
            let query = supabase.from('quiz_questions').select('*');
            if (category) query = query.eq('category', category);
            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch questions' });

            const shuffled = data.sort(() => Math.random() - 0.5).slice(0, parseInt(count));
            res.json({ questions: shuffled, count: shuffled.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
