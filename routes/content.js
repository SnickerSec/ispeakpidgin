const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');

/**
 * Content Routes (Phrases, Stories, Lessons)
 */
module.exports = function(supabase, dictionaryLimiter) {

    // Helper to handle validation errors
    const validate = (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    };

    // ============================================
    // PHRASES API
    // ============================================

    let phrasesCache = {
        data: null,
        timestamp: 0,
        ttl: 10 * 60 * 1000
    };

    router.get('/phrases', dictionaryLimiter, async (req, res) => {
        try {
            const { page = 1, limit = 50, category, difficulty } = req.query;
            const requestedLimit = Math.min(parseInt(limit), 1000);
            const offset = (parseInt(page) - 1) * requestedLimit;

            const now = Date.now();
            if (!category && !difficulty && requestedLimit >= 100 && offset === 0) {
                if (phrasesCache.data && (now - phrasesCache.timestamp) < phrasesCache.ttl) {
                    const cachedPhrases = phrasesCache.data.slice(0, requestedLimit);
                    res.set('X-Cache', 'HIT');
                    return res.json({
                        phrases: cachedPhrases,
                        pagination: {
                            page: 1,
                            limit: requestedLimit,
                            total: phrasesCache.data.length,
                            totalPages: Math.ceil(phrasesCache.data.length / requestedLimit)
                        }
                    });
                }
            }

            let query = supabase.from('phrases').select('*', { count: 'exact' });
            if (category) query = query.eq('category', category);
            if (difficulty) query = query.eq('difficulty', difficulty);
            query = query.range(offset, offset + requestedLimit - 1);

            const { data, error, count } = await query;
            if (error) return res.status(500).json({ error: 'Database query failed' });

            if (!category && !difficulty && requestedLimit >= 100 && offset === 0) {
                phrasesCache.data = data;
                phrasesCache.timestamp = now;
            }

            res.set('X-Cache', 'MISS');
            res.json({
                phrases: data,
                pagination: {
                    page: parseInt(page),
                    limit: requestedLimit,
                    total: count,
                    totalPages: Math.ceil(count / requestedLimit)
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/phrases/random', dictionaryLimiter, async (req, res) => {
        try {
            const { count = 5, category } = req.query;
            const limit = Math.min(parseInt(count), 20);

            const { data, error } = await supabase.rpc('get_random_phrases', {
                p_count: limit,
                p_category: category || null
            });

            if (error) return res.status(500).json({ error: 'Failed to fetch phrases' });
            res.json({ phrases: data, count: data.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // STORIES API
    // ============================================
    router.get('/stories', dictionaryLimiter, [
        query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced'])
    ], validate, async (req, res) => {
        try {
            const { difficulty } = req.query;
            let query = supabase.from('stories').select('*');
            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch stories' });
            res.json({ stories: data, count: data.length });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/stories/:id', dictionaryLimiter, async (req, res) => {
        try {
            const { id } = req.params;
            const { data, error } = await supabase.from('stories').select('*').eq('id', id).single();

            if (error) {
                if (error.code === 'PGRST116') return res.status(404).json({ error: 'Story not found' });
                return res.status(500).json({ error: 'Failed to fetch story' });
            }
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // ============================================
    // LESSONS API
    // ============================================

    const lessonsCache = { data: null, timestamp: 0, ttl: 300000 };

    router.get('/lessons', dictionaryLimiter, [
        query('level').optional().isIn(['beginner', 'intermediate', 'advanced'])
    ], validate, async (req, res) => {
        try {
            const { level } = req.query;
            const now = Date.now();

            if (!level && lessonsCache.data && (now - lessonsCache.timestamp) < lessonsCache.ttl) {
                res.set('X-Cache', 'HIT');
                return res.json(lessonsCache.data);
            }

            let query = supabase
                .from('lessons')
                .select(`id, lesson_key, level, title, icon, cultural_note, practice, sort_order, lesson_vocabulary (pidgin, english, example, sort_order)`)
                .order('sort_order', { ascending: true });

            if (level) query = query.eq('level', level);

            const { data, error } = await query;
            if (error) return res.status(500).json({ error: 'Failed to fetch lessons' });

            const lessonsByLevel = { beginner: [], intermediate: [], advanced: [] };
            data.forEach(lesson => {
                lessonsByLevel[lesson.level].push({
                    id: lesson.lesson_key,
                    title: lesson.title,
                    icon: lesson.icon,
                    content: {
                        vocabulary: (lesson.lesson_vocabulary || []).sort((a, b) => a.sort_order - b.sort_order).map(v => ({ pidgin: v.pidgin, english: v.english, example: v.example })),
                        culturalNote: lesson.cultural_note,
                        practice: lesson.practice
                    }
                });
            });

            const result = level ? { [level]: lessonsByLevel[level] } : lessonsByLevel;
            if (!level) {
                lessonsCache.data = result;
                lessonsCache.timestamp = now;
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/lessons/:lessonKey', dictionaryLimiter, async (req, res) => {
        try {
            const { lessonKey } = req.params;
            const { data, error } = await supabase
                .from('lessons')
                .select(`id, lesson_key, level, title, icon, cultural_note, practice, lesson_vocabulary (pidgin, english, example, sort_order)`)
                .eq('lesson_key', lessonKey)
                .single();

            if (error || !data) return res.status(404).json({ error: 'Lesson not found' });

            res.json({
                id: data.lesson_key,
                level: data.level,
                title: data.title,
                icon: data.icon,
                content: {
                    vocabulary: (data.lesson_vocabulary || []).sort((a, b) => a.sort_order - b.sort_order).map(v => ({ pidgin: v.pidgin, english: v.english, example: v.example })),
                    culturalNote: data.cultural_note,
                    practice: data.practice
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
