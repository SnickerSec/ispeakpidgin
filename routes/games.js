const express = require('express');
const userAuth = require('../middleware/user-auth');

/**
 * Game Routes (Wordle, Crossword, Quiz)
 */
module.exports = function(supabase, dictionaryLimiter, gamificationService) {
    const router = express.Router();

    // ============================================
    // WORDLE API
    // ============================================

    // Deterministic day index and fixed-seed permutation so every player on the same
    // Pacific/Honolulu calendar date gets the exact same Daily Wordle (no repeats across
    // the full solution cycle), even when `used_on` is not written back to Supabase.
    function honoluluDateString(now = new Date()) {
        return now.toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });
    }

    function daysSinceEpoch(isoDate) {
        const [y, m, d] = isoDate.split('-').map(Number);
        return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
    }

    function dayOfYearFromIso(isoDate) {
        const [y, m, d] = isoDate.split('-').map(Number);
        return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
    }

    function seededPermutation(items, seed = 0x50494447) {
        const arr = [...items].sort((a, b) => String(a.word || '').localeCompare(String(b.word || '')));
        let s = seed >>> 0;
        const rand = () => {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    router.get('/wordle/daily', dictionaryLimiter, async (req, res) => {
        try {
            const today = honoluluDateString();
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
                const { data: allSolutions } = await supabase.from('wordle_words').select('*').eq('is_solution', true);
                if (allSolutions && allSolutions.length > 0) {
                    const ordered = seededPermutation(allSolutions);
                    const picked = ordered[((daysSinceEpoch(today) % ordered.length) + ordered.length) % ordered.length];
                    return res.json({ word: picked.word, meaning: picked.meaning, pronunciation: picked.pronunciation, difficulty: picked.difficulty, date: today, recycled: true });
                }
                return res.status(500).json({ error: 'No wordle words available' });
            }

            const ordered = seededPermutation(availableWords);
            const dailyWord = ordered[((daysSinceEpoch(today) % ordered.length) + ordered.length) % ordered.length];
            res.json({ word: dailyWord.word, meaning: dailyWord.meaning, pronunciation: dailyWord.pronunciation, difficulty: dailyWord.difficulty, date: today });
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
            const { solutions_only, valid_guesses_only, difficulty, with_meanings } = req.query;
            let query = supabase.from('wordle_words').select('word, is_solution, is_valid_guess, difficulty, meaning, pronunciation');
            if (solutions_only === 'true') query = query.eq('is_solution', true);
            if (valid_guesses_only === 'true') query = query.eq('is_valid_guess', true);
            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch wordle words' });

            if (with_meanings === 'true') {
                const entries = data
                    .filter(w => Boolean(w.meaning))
                    .map(w => ({
                        pidgin: w.word.toLowerCase(),
                        english: [w.meaning],
                        pronunciation: w.pronunciation || null,
                        difficulty: w.difficulty || 'medium'
                    }));
                return res.json({
                    entries,
                    count: entries.length
                });
            }

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
            const today = honoluluDateString();
            const { data: todayPuzzle, error: todayError } = await supabase.from('crossword_puzzles').select('*').eq('used_on', today).single();

            if (todayPuzzle && !todayError) return res.json(todayPuzzle);

            const { data: allPuzzles, error } = await supabase.from('crossword_puzzles').select('*').order('puzzle_id', { ascending: true });
            if (error || !allPuzzles || allPuzzles.length === 0) return res.status(500).json({ error: 'No crossword puzzles available' });

            const dayOfYear = dayOfYearFromIso(today);
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

    /**
     * Helper to generate dynamic questions from lesson vocabulary
     */
    async function generateDynamicQuestions(count = 10, category = null, difficulty = null) {
        try {
            let query = supabase
                .from('lessons')
                .select(`id, lesson_key, level, title, icon, lesson_vocabulary (pidgin, english, example)`);
            
            if (difficulty) query = query.eq('level', difficulty);
            
            const { data: lessons, error } = await query;

            // Collect all vocabulary across eligible lessons
            let allVocab = [];
            if (!error && lessons && lessons.length > 0) {
                lessons.forEach(lesson => {
                    if (lesson.lesson_vocabulary) {
                        lesson.lesson_vocabulary.forEach(v => {
                            allVocab.push({
                                ...v,
                                lesson_title: lesson.title,
                                level: lesson.level
                            });
                        });
                    }
                });
            }

            // Fallback to dictionary entries for dynamic question generation if lessons vocab is sparse
            if (allVocab.length < 4) {
                const { data: dictData } = await supabase.from('dictionary_entries').select('pidgin, english, examples, category, difficulty');
                if (dictData && dictData.length >= 4) {
                    dictData.forEach(d => {
                        const englishStr = Array.isArray(d.english) ? d.english[0] : d.english;
                        const exampleStr = Array.isArray(d.examples) && d.examples.length > 0 ? d.examples[0] : `I like go ${d.pidgin}.`;
                        allVocab.push({
                            pidgin: d.pidgin,
                            english: englishStr,
                            example: exampleStr,
                            lesson_title: d.category || 'Dictionary',
                            level: d.difficulty || 'beginner'
                        });
                    });
                }
            }

            if (allVocab.length < 4) return [];

            const questions = [];
            const shuffledVocab = [...allVocab].sort(() => Math.random() - 0.5);
            const emojis = ['🍧', '🤙', '🌺', '🏝️', '🏄‍♂️', '🍍', '🌋', '🐢', '🌈', '🚲'];

            for (let i = 0; i < Math.min(count, shuffledVocab.length); i++) {
                const current = shuffledVocab[i];
                const type = Math.floor(Math.random() * 3); // 0: pidgin->english, 1: english->pidgin, 2: example blank

                let questionText, options, correctIndex, description;

                if (type === 0) {
                    // What does this mean?
                    questionText = `What does "${current.pidgin}" mean?`;
                    description = `From the lesson: ${current.lesson_title}`;
                    
                    const wrong = allVocab
                        .filter(v => v.pidgin !== current.pidgin)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3)
                        .map(v => v.english);
                    
                    options = [current.english, ...wrong].sort(() => Math.random() - 0.5);
                    correctIndex = options.indexOf(current.english);
                } else if (type === 1) {
                    // How you say this?
                    questionText = `How do you say "${current.english}" in Pidgin?`;
                    description = `Local style for: ${current.english}`;

                    const wrong = allVocab
                        .filter(v => v.pidgin !== current.pidgin)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3)
                        .map(v => v.pidgin);
                    
                    options = [current.pidgin, ...wrong].sort(() => Math.random() - 0.5);
                    correctIndex = options.indexOf(current.pidgin);
                } else {
                    // Example sentence
                    const example = current.example || `I like go ${current.pidgin} wit you.`;
                    const regex = new RegExp(`\\b${current.pidgin}\\b`, 'i');
                    questionText = example.replace(regex, '________');
                    description = "Fill in the blank with the best Pidgin word!";

                    const wrong = allVocab
                        .filter(v => v.pidgin !== current.pidgin)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3)
                        .map(v => v.pidgin);
                    
                    options = [current.pidgin, ...wrong].sort(() => Math.random() - 0.5);
                    correctIndex = options.indexOf(current.pidgin);
                }

                // Format options for the frontend
                const formattedOptions = options.map((opt, idx) => ({
                    text: opt,
                    points: idx === correctIndex ? 10 : (Math.random() > 0.5 ? 2 : 0),
                    feedback: idx === correctIndex ? "Rajah dat! You know your stuff." : "Try again, brah."
                }));

                questions.push({
                    id: `dynamic-${i}`,
                    question: questionText,
                    description: description,
                    image: emojis[Math.floor(Math.random() * emojis.length)],
                    options: formattedOptions,
                    category: current.level,
                    difficulty: current.level
                });
            }

            return questions;
        } catch (err) {
            console.error('Dynamic question generation error:', err);
            return [];
        }
    }

    router.get('/quiz/questions', dictionaryLimiter, async (req, res) => {
        try {
            const { category, difficulty, count = 10, random = 'true' } = req.query;
            let query = supabase.from('lesson_quiz_questions').select('*');
            if (category) query = query.eq('category', category);
            if (difficulty) query = query.eq('level', difficulty);

            const { data, error } = await query;
            
            // If we have data in the table, use it
            if (!error && data && data.length > 0) {
                let shuffled = data;
                if (random === 'true') {
                    shuffled = data.sort(() => Math.random() - 0.5);
                }
                
                const limited = shuffled.slice(0, parseInt(count));
                
                // Map to frontend format if needed (loader handles some, but let's be safe)
                const formatted = limited.map(q => ({
                    ...q,
                    image: q.image || '🤙',
                    description: q.description || q.explanation || 'Test your knowledge!',
                    options: Array.isArray(q.options) ? q.options.map((opt, idx) => {
                        // If options are strings, convert to objects
                        if (typeof opt === 'string') {
                            return {
                                text: opt,
                                points: idx === q.correct_index ? 10 : 0,
                                feedback: idx === q.correct_index ? "Correct!" : "Incorrect."
                            };
                        }
                        return opt;
                    }) : []
                }));

                return res.json({ questions: formatted, count: formatted.length });
            }

            // Fallback to dynamic questions from vocabulary
            console.log('Quiz table empty, generating dynamic questions from vocabulary...');
            const dynamicQuestions = await generateDynamicQuestions(parseInt(count), category, difficulty);
            
            if (dynamicQuestions.length === 0) {
                return res.status(404).json({ error: 'No questions found' });
            }

            res.json({ questions: dynamicQuestions, count: dynamicQuestions.length });
        } catch (error) {
            console.error('Quiz API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // LEADERBOARD API
    // ============================================

    router.get('/leaderboard', dictionaryLimiter, async (req, res) => {
        try {
            const { game_type = 'ear-trainer', limit = 10 } = req.query;
            
            // We use local_questions table as a makeshift scores table
            // status = 'score' identifies leaderboard entries
            const { data, error } = await supabase
                .from('local_questions')
                .select('user_name, question_text, created_at')
                .eq('status', 'score')
                .order('created_at', { ascending: false }); // We'll sort by score in JS

            if (error) throw error;

            const scores = (data || [])
                .map(item => {
                    try {
                        const meta = JSON.parse(item.question_text);
                        if (meta.game_type !== game_type) return null;
                        return {
                            username: item.user_name,
                            score: meta.score,
                            streak: meta.streak || 0,
                            created_at: item.created_at
                        };
                    } catch (e) { return null; }
                })
                .filter(Boolean)
                .sort((a, b) => b.score - a.score)
                .slice(0, parseInt(limit));

            res.json({ scores });
        } catch (error) {
            console.error('Leaderboard fetch error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.post('/leaderboard', dictionaryLimiter, async (req, res) => {
        try {
            const { username, score, game_type, streak } = req.body;

            if (!username || score === undefined || !game_type) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if user is logged in (optional)
            const authHeader = req.headers.authorization;
            let userId = null;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const decoded = userAuth.verifyToken ? userAuth.verifyToken(token) : null;
                if (decoded) userId = decoded.userId;
            }

            const parsedScore = parseInt(score);
            // Basic sanitization for storage
            const sanitizedUsername = username.replace(/[<>]/g, '').substring(0, 20);
            
            const metadata = JSON.stringify({
                score: parsedScore,
                game_type,
                streak: parseInt(streak || 0),
                version: '1.1'
            });

            const { data, error } = await supabase
                .from('local_questions')
                .insert({
                    user_name: sanitizedUsername,
                    question_text: metadata,
                    status: 'score'
                });

            if (error) throw error;

            // Gamification: Award XP if user is logged in
            let xpResult = null;
            if (userId && gamificationService) {
                // Base XP: 20 for finishing a game
                // Bonus XP: score-based
                let xpAmount = 20 + Math.floor(parsedScore / 10);
                
                // Perfect score bonus for quizzes
                if (game_type.includes('quiz') && parsedScore >= 50) {
                    xpAmount += 50;
                    await gamificationService.awardBadge(userId, 'quiz_king');
                }

                xpResult = await gamificationService.awardXP(userId, xpAmount, 'game_complete', `${game_type}_${Date.now()}`);
            }

            res.json({ success: true, xp: xpResult });
        } catch (error) {
            console.error('Leaderboard submit error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // PROFICIENCY & GLOBAL RANKING
    // ============================================

    router.get('/proficiency', dictionaryLimiter, async (req, res) => {
        try {
            const { username } = req.query;
            if (!username) return res.status(400).json({ error: 'Username required' });

            // Fetch all scores for this user from our makeshift scores table
            const { data, error } = await supabase
                .from('local_questions')
                .select('question_text, created_at')
                .eq('status', 'score')
                .eq('user_name', username);

            if (error) throw error;

            const scores = (data || []).map(d => JSON.parse(d.question_text));
            
            // Logic: 
            // - Wordle: 1-6 points per win
            // - Scramble: 50-200+ points per game
            // - Speed: 50-300+ points per game
            // - Ear Trainer: 10-50+ points per game
            
            const totalScore = scores.reduce((acc, s) => acc + (s.score || 0), 0);
            const gamesPlayed = scores.length;
            const uniqueGames = new Set(scores.map(s => s.game_type.split('-')[0])).size;
            
            // Calculate Rank
            let rank = 'Visitor';
            let icon = '🌊';
            let nextRank = 'Townie';
            let progress = 0;

            if (totalScore >= 1000) {
                rank = 'Big Kahuna';
                icon = '👑';
                nextRank = 'Max Rank';
                progress = 100;
            } else if (totalScore >= 500) {
                rank = 'Local';
                icon = '🤙';
                nextRank = 'Big Kahuna';
                progress = ((totalScore - 500) / 500) * 100;
            } else if (totalScore >= 150) {
                rank = 'Townie';
                icon = '🏢';
                nextRank = 'Local';
                progress = ((totalScore - 150) / 350) * 100;
            } else {
                rank = 'Visitor';
                icon = '📸';
                nextRank = 'Townie';
                progress = (totalScore / 150) * 100;
            }

            res.json({
                username,
                totalScore,
                gamesPlayed,
                uniqueGames,
                rank,
                icon,
                nextRank,
                progress: Math.min(100, Math.round(progress))
            });

        } catch (error) {
            console.error('Proficiency fetch error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
