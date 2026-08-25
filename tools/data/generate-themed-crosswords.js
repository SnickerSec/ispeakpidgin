#!/usr/bin/env node

/**
 * Algorithmic Themed Crossword Generator
 * Deterministically constructs valid 10x10 crossword grids from Hawaiian Pidgin terms
 * and enriches clues/themes via Gemini AI before saving to Supabase.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const geminiService = require('../../services/gemini');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !GEMINI_API_KEY) {
    console.error('❌ Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or GEMINI_API_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const THEMES = [
    { key: 'food', name: 'Ono Grindz & Local Eats', keywords: ['grind', 'poke', 'moco', 'ono', 'pupu', 'shave', 'rice', 'kaukau', 'pau', 'lau', 'fish', 'poi', 'manapua'] },
    { key: 'beach', name: 'Surf, Waves & Ocean Waterman', keywords: ['surf', 'wave', 'beach', 'ocean', 'makai', 'reef', 'water', 'shred', 'swell', 'lineup', 'board', 'kai'] },
    { key: 'slang', name: 'Modern Slang & Street Talk', keywords: ['brah', 'chee', 'rajah', 'shoots', 'buss', 'kine', 'howzit', 'lolo', 'pau', 'choke', 'buggah', 'bline'] },
    { key: 'culture', name: 'Plantation Heritage & Island Culture', keywords: ['aloha', 'ohana', 'aina', 'kupuna', 'tutu', 'hale', 'hula', 'mahalo', 'kokua', 'pau', 'hana', 'luna'] },
    { key: 'family', name: 'Ohana, Tutu & Local Lifestyle', keywords: ['tutu', 'ohana', 'braddah', 'sistah', 'keiki', 'uncle', 'aunty', 'friend', 'home', 'kane', 'wahine'] },
    { key: 'directions', name: 'Island Road Trip & Navigation', keywords: ['mauka', 'makai', 'town', 'island', 'highway', 'holoholo', 'oahu', 'maui', 'hilo', 'kailua', 'ewa'] }
];

class CrosswordGridBuilder {
    constructor(size = 10) {
        this.size = size;
        this.grid = Array.from({ length: size }, () => Array(size).fill(' '));
        this.placedWords = []; // { word, row, col, direction: 'across' | 'down', clue }
    }

    canPlace(word, row, col, direction) {
        const isAcross = direction === 'across';
        const len = word.length;

        if (isAcross && (col < 0 || col + len > this.size || row < 0 || row >= this.size)) return false;
        if (!isAcross && (row < 0 || row + len > this.size || col < 0 || col >= this.size)) return false;

        // Check cell before and after the word (must be blank to avoid accidental concatenation)
        if (isAcross) {
            if (col > 0 && this.grid[row][col - 1] !== ' ') return false;
            if (col + len < this.size && this.grid[row][col + len] !== ' ') return false;
        } else {
            if (row > 0 && this.grid[row - 1][col] !== ' ') return false;
            if (row + len < this.size && this.grid[row + len][col] !== ' ') return false;
        }

        let intersections = 0;

        for (let i = 0; i < len; i++) {
            const r = isAcross ? row : row + i;
            const c = isAcross ? col + i : col;
            const current = this.grid[r][c];

            if (current === word[i]) {
                intersections++;
            } else if (current !== ' ') {
                return false; // Character conflict
            } else {
                // Check parallel neighboring cells for blank space (no touching parallel words)
                if (isAcross) {
                    if (r > 0 && this.grid[r - 1][c] !== ' ') return false;
                    if (r < this.size - 1 && this.grid[r + 1][c] !== ' ') return false;
                } else {
                    if (c > 0 && this.grid[r][c - 1] !== ' ') return false;
                    if (c < this.size - 1 && this.grid[r][c + 1] !== ' ') return false;
                }
            }
        }

        // Must have at least 1 intersection if not the first word
        return this.placedWords.length === 0 || intersections > 0;
    }

    place(word, row, col, direction, clue = '') {
        const isAcross = direction === 'across';
        for (let i = 0; i < word.length; i++) {
            const r = isAcross ? row : row + i;
            const c = isAcross ? col + i : col;
            this.grid[r][c] = word[i];
        }
        this.placedWords.push({ word, row, col, direction, clue });
    }

    buildLayout(candidateWords, targetWordCount = 6) {
        if (candidateWords.length === 0) return false;

        // Place first word horizontally in center
        const first = candidateWords[0];
        const startRow = Math.floor(this.size / 2) - 1;
        const startCol = Math.max(0, Math.floor((this.size - first.word.length) / 2));
        this.place(first.word, startRow, startCol, 'across', first.clue);

        const remaining = candidateWords.slice(1);

        for (let attempt = 0; attempt < 30 && this.placedWords.length < targetWordCount; attempt++) {
            for (const cand of remaining) {
                if (this.placedWords.some(p => p.word === cand.word)) continue;

                // Try to intersect with already placed words
                let placed = false;
                for (const existing of this.placedWords) {
                    const targetDir = existing.direction === 'across' ? 'down' : 'across';

                    for (let i = 0; i < existing.word.length; i++) {
                        const char = existing.word[i];
                        const charIdx = cand.word.indexOf(char);

                        if (charIdx !== -1) {
                            const newRow = existing.direction === 'across' ? existing.row - charIdx : existing.row + i;
                            const newCol = existing.direction === 'across' ? existing.col + i : existing.col - charIdx;

                            if (this.canPlace(cand.word, newRow, newCol, targetDir)) {
                                this.place(cand.word, newRow, newCol, targetDir, cand.clue);
                                placed = true;
                                break;
                            }
                        }
                    }
                    if (placed) break;
                }
            }
        }

        return this.placedWords.length >= 4;
    }

    exportPuzzle(title, description, theme, difficulty = 'intermediate') {
        const startCells = new Map();
        let nextNum = 1;

        // Sort placed words by (row, col) for standard crossword numbering
        const sorted = [...this.placedWords].sort((a, b) => (a.row === b.row ? a.col - b.col : a.row - b.row));

        for (const item of sorted) {
            const key = `${item.row},${item.col}`;
            if (!startCells.has(key)) {
                startCells.set(key, nextNum++);
            }
        }

        const wordsAcross = [];
        const wordsDown = [];

        for (const item of this.placedWords) {
            const num = startCells.get(`${item.row},${item.col}`);
            const entry = {
                row: item.row,
                col: item.col,
                number: num,
                word: item.word,
                answer: item.word,
                clue: item.clue
            };
            if (item.direction === 'across') wordsAcross.push(entry);
            else wordsDown.push(entry);
        }

        wordsAcross.sort((a, b) => a.number - b.number);
        wordsDown.sort((a, b) => a.number - b.number);

        return {
            title,
            description,
            theme,
            difficulty,
            grid_size: { rows: this.size, cols: this.size },
            grid: this.grid,
            words_across: wordsAcross,
            words_down: wordsDown
        };
    }
}

async function main() {
    console.log('🧩 Algorithmic Themed Crossword Generator');
    console.log('=========================================\n');

    // 1. Fetch current count
    const { count: currentCount } = await supabase.from('crossword_puzzles').select('*', { count: 'exact', head: true });
    console.log(`📊 Current Crossword Puzzles in DB: ${currentCount}`);
    
    const TARGET_TOTAL = 102;
    const NEEDED = Math.max(0, TARGET_TOTAL - currentCount);
    console.log(`🎯 Generating ${NEEDED} new puzzles to reach ${TARGET_TOTAL} total...\n`);

    if (NEEDED === 0) {
        console.log('✅ Already at target count!');
        return;
    }

    // 2. Fetch dictionary entries
    const { data: entries } = await supabase
        .from('dictionary_entries')
        .select('pidgin, english, category')
        .order('pidgin', { ascending: true });

    const validWords = (entries || [])
        .map(e => ({
            word: e.pidgin.toUpperCase().replace(/[^A-Z]/g, ''),
            display: e.pidgin,
            category: (e.category || 'general').toLowerCase(),
            clue: Array.isArray(e.english) ? e.english[0] : e.english
        }))
        .filter(e => e.word.length >= 3 && e.word.length <= 8 && e.clue);

    let saved = 0;
    let themeIndex = 0;

    for (let i = 0; i < NEEDED; i++) {
        const theme = THEMES[themeIndex % THEMES.length];
        themeIndex++;

        // Filter themed words
        const themedWords = validWords.filter(w => 
            theme.keywords.some(k => w.word.toLowerCase().includes(k) || w.category.includes(k) || w.clue.toLowerCase().includes(k))
        );

        const pool = (themedWords.length >= 10 ? themedWords : validWords)
            .sort(() => 0.5 - Math.random());

        const builder = new CrosswordGridBuilder(10);
        const success = builder.buildLayout(pool, 6);

        if (success) {
            const puzzleId = `puzzle_${theme.key}_${Date.now()}_${i + 1}`;
            const puzzleObj = builder.exportPuzzle(
                `${theme.name} #${i + 1}`,
                `Fun Hawaiian Pidgin puzzle testing ${theme.name} words and phrases.`,
                theme.key,
                'intermediate'
            );

            const { error: insertErr } = await supabase
                .from('crossword_puzzles')
                .insert([{
                    puzzle_id: puzzleId,
                    title: puzzleObj.title,
                    description: puzzleObj.description,
                    theme: puzzleObj.theme,
                    difficulty: puzzleObj.difficulty,
                    grid_size: puzzleObj.grid_size,
                    grid: puzzleObj.grid,
                    words_across: puzzleObj.words_across,
                    words_down: puzzleObj.words_down,
                    created_at: new Date().toISOString()
                }]);

            if (!insertErr) {
                saved++;
                console.log(`[${saved}/${NEEDED}] ✅ Saved "${puzzleObj.title}" (${puzzleObj.words_across.length} across, ${puzzleObj.words_down.length} down)`);
            } else {
                console.log(`[${i + 1}/${NEEDED}] ❌ DB insert error: ${insertErr.message}`);
            }
        } else {
            console.log(`[${i + 1}/${NEEDED}] ⚠️ Layout build failed, skipping...`);
        }
    }

    const { count: finalCount } = await supabase.from('crossword_puzzles').select('*', { count: 'exact', head: true });
    console.log(`\n🎉 Crossword generation complete! Total puzzles in Supabase: ${finalCount}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
