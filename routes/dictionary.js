const express = require('express');
const router = express.Router();

/**
 * Dictionary Routes
 * @param {object} supabase - Supabase client
 * @param {object} dictionaryLimiter - Rate limiter for dictionary endpoints
 */
module.exports = function(supabase, dictionaryLimiter, dictionaryCache) {

    // Pre-warm dictionary cache
    async function prewarmDictionaryCache() {
        try {
            const { data, error, count } = await supabase
                .from('dictionary_entries')
                .select('*', { count: 'exact' })
                .order('pidgin', { ascending: true })
                .limit(1000);

            if (error) {
                console.error('❌ Failed to pre-warm dictionary cache:', error.message);
                return;
            }

            const categoryCounts = data.reduce((acc, item) => {
                const cat = item.category || 'uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});

            dictionaryCache.data = {
                entries: data,
                stats: {
                    totalEntries: count || data.length,
                    byCategory: categoryCounts,
                    lastUpdated: new Date().toISOString()
                }
            };
            dictionaryCache.timestamp = Date.now();
            console.log(`✅ Pre-warmed dictionary cache with ${data.length} entries`);
        } catch (err) {
            console.error('❌ Dictionary pre-warm error:', err.message);
        }
    }

    // Initialize cache
    prewarmDictionaryCache();

    // GET /api/dictionary/all - Get ALL dictionary entries in single request
    router.get('/all', dictionaryLimiter, async (req, res) => {
        try {
            const now = Date.now();

            if (dictionaryCache.data && (now - dictionaryCache.timestamp) < dictionaryCache.ttl) {
                res.set('X-Cache', 'HIT');
                res.set('Cache-Control', 'public, max-age=300');
                return res.json(dictionaryCache.data);
            }

            const { data, error, count } = await supabase
                .from('dictionary_entries')
                .select('*', { count: 'exact' })
                .order('pidgin', { ascending: true })
                .limit(1000);

            if (error) {
                console.error('Supabase bulk query error:', error);
                return res.status(500).json({ error: 'Database query failed' });
            }

            const categoryCounts = data.reduce((acc, item) => {
                const cat = item.category || 'uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});

            const response = {
                entries: data,
                stats: {
                    totalEntries: count || data.length,
                    byCategory: categoryCounts,
                    lastUpdated: new Date().toISOString()
                }
            };

            dictionaryCache.data = response;
            dictionaryCache.timestamp = now;

            res.set('X-Cache', 'MISS');
            res.set('Cache-Control', 'public, max-age=300');
            res.json(response);
        } catch (error) {
            console.error('Dictionary bulk API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/dictionary - Get all dictionary entries with pagination
    router.get('/', dictionaryLimiter, async (req, res) => {
        try {
            const ALLOWED_SORT_FIELDS = ['pidgin', 'english', 'difficulty', 'category'];
            const MAX_LIMIT = 100;

            const page = Math.max(parseInt(req.query.page) || 1, 1);
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), MAX_LIMIT);
            const category = req.query.category;
            const difficulty = req.query.difficulty;
            const sort = ALLOWED_SORT_FIELDS.includes(req.query.sort) ? req.query.sort : 'pidgin';
            const order = req.query.order;

            const offset = (page - 1) * limit;
            const validOrders = ['asc', 'desc'];
            const sortOrder = validOrders.includes(order) ? order === 'asc' : true;

            let query = supabase
                .from('dictionary_entries')
                .select('*', { count: 'exact' });

            if (category) query = query.eq('category', category);
            if (difficulty) query = query.eq('difficulty', difficulty);

            query = query
                .order(sort, { ascending: sortOrder })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                console.error('Supabase query error:', error);
                return res.status(500).json({ error: 'Database query failed' });
            }

            res.json({
                entries: data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Dictionary API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/dictionary/search - Full-text search
    router.get('/search', dictionaryLimiter, async (req, res) => {
        try {
            const { q, limit = 20 } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({ error: 'Search query must be at least 2 characters' });
            }

            const searchTerm = q.trim().toLowerCase().replace(/[%_\\{},.()"']/g, '');
            const searchLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

            const { data, error } = await supabase
                .from('dictionary_entries')
                .select('*')
                .or(`pidgin.ilike.%${searchTerm}%,english.ilike.%${searchTerm}%`)
                .limit(searchLimit);

            if (error) {
                console.error('Supabase search error:', error);
                return res.status(500).json({ error: 'Search failed' });
            }

            res.json({
                query: q,
                results: data,
                count: data.length
            });
        } catch (error) {
            console.error('Search API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/dictionary/categories - Get all unique categories
    router.get('/categories', dictionaryLimiter, async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('dictionary_entries')
                .select('category')
                .not('category', 'is', null);

            if (error) {
                console.error('Supabase categories error:', error);
                return res.status(500).json({ error: 'Failed to fetch categories' });
            }

            const categoryCounts = data.reduce((acc, item) => {
                if (item.category) {
                    acc[item.category] = (acc[item.category] || 0) + 1;
                }
                return acc;
            }, {});

            res.json({
                categories: Object.entries(categoryCounts).map(([name, count]) => ({
                    name,
                    count
                })).sort((a, b) => a.name.localeCompare(b.name))
            });
        } catch (error) {
            console.error('Categories API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/dictionary/random - Get random entries
    router.get('/random', dictionaryLimiter, async (req, res) => {
        try {
            const { count = 5, difficulty } = req.query;
            const limit = Math.min(parseInt(count), 20);

            let countQuery = supabase
                .from('dictionary_entries')
                .select('*', { count: 'exact', head: true });

            if (difficulty) countQuery = countQuery.eq('difficulty', difficulty);

            const { count: total } = await countQuery;
            const maxOffset = Math.max(0, total - limit);
            const randomOffset = Math.floor(Math.random() * maxOffset);

            let query = supabase
                .from('dictionary_entries')
                .select('*')
                .range(randomOffset, randomOffset + limit - 1);

            if (difficulty) query = query.eq('difficulty', difficulty);

            const { data, error } = await query;

            if (error) {
                console.error('Supabase random error:', error);
                return res.status(500).json({ error: 'Failed to fetch random entries' });
            }

            const shuffled = data.sort(() => Math.random() - 0.5);

            res.json({
                entries: shuffled,
                count: shuffled.length
            });
        } catch (error) {
            console.error('Random API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/dictionary/stats - Get dictionary statistics
    router.get('/stats', dictionaryLimiter, async (req, res) => {
        try {
            const { count: totalCount } = await supabase
                .from('dictionary_entries')
                .select('*', { count: 'exact', head: true });

            const { data: difficultyData } = await supabase
                .from('dictionary_entries')
                .select('difficulty');

            const difficultyCounts = difficultyData.reduce((acc, item) => {
                const diff = item.difficulty || 'unspecified';
                acc[diff] = (acc[diff] || 0) + 1;
                return acc;
            }, {});

            const { data: categoryData } = await supabase
                .from('dictionary_entries')
                .select('category');

            const categoryCounts = categoryData.reduce((acc, item) => {
                const cat = item.category || 'uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});

            res.json({
                totalEntries: totalCount,
                byDifficulty: difficultyCounts,
                byCategory: categoryCounts,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Stats API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/dictionary/word/:pidgin - Get entry by Pidgin word
    router.get('/word/:pidgin', dictionaryLimiter, async (req, res) => {
        try {
            const { pidgin } = req.params;

            const { data, error } = await supabase
                .from('dictionary_entries')
                .select('*')
                .ilike('pidgin', pidgin)
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return res.status(404).json({ error: 'Word not found' });
                console.error('Supabase word lookup error:', error);
                return res.status(500).json({ error: 'Failed to fetch word' });
            }

            res.json(data);
        } catch (error) {
            console.error('Word lookup API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/dictionary/:id - Get single entry by ID
    router.get('/:id', dictionaryLimiter, async (req, res) => {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('dictionary_entries')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return res.status(404).json({ error: 'Entry not found' });
                console.error('Supabase get error:', error);
                return res.status(500).json({ error: 'Failed to fetch entry' });
            }

            res.json(data);
        } catch (error) {
            console.error('Get entry API error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
