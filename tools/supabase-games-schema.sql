-- ============================================
-- ChokePidgin Games Schema
-- Wordle words and Crossword puzzles
-- ============================================

-- ============================================
-- 1. WORDLE WORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wordle_words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(5) NOT NULL UNIQUE,
    is_solution BOOLEAN DEFAULT true,  -- Can be a daily solution
    is_valid_guess BOOLEAN DEFAULT true,  -- Can be used as a guess
    meaning TEXT,  -- What the word means
    pronunciation TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    used_on DATE,  -- Date when this word was the daily word (NULL if not yet used)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wordle_solution ON wordle_words(is_solution) WHERE is_solution = true;
CREATE INDEX IF NOT EXISTS idx_wordle_used ON wordle_words(used_on);
CREATE INDEX IF NOT EXISTS idx_wordle_word ON wordle_words(word);

-- Enable RLS
ALTER TABLE wordle_words ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public wordle words are viewable by everyone"
ON wordle_words FOR SELECT
USING (true);

-- ============================================
-- 2. CROSSWORD PUZZLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crossword_puzzles (
    id SERIAL PRIMARY KEY,
    puzzle_id TEXT NOT NULL UNIQUE,  -- e.g., 'puzzle1', 'puzzle2'
    title TEXT NOT NULL,
    description TEXT,
    theme TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    grid_size JSONB NOT NULL,  -- { "rows": 5, "cols": 5 }
    grid JSONB,  -- 2D array of letters/blanks
    words_across JSONB NOT NULL,  -- Array of across words with clues
    words_down JSONB NOT NULL,  -- Array of down words with clues
    used_on DATE,  -- Date when this puzzle was the daily puzzle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crossword_difficulty ON crossword_puzzles(difficulty);
CREATE INDEX IF NOT EXISTS idx_crossword_theme ON crossword_puzzles(theme);
CREATE INDEX IF NOT EXISTS idx_crossword_used ON crossword_puzzles(used_on);

-- Enable RLS
ALTER TABLE crossword_puzzles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public crossword puzzles are viewable by everyone"
ON crossword_puzzles FOR SELECT
USING (true);

-- ============================================
-- 3. PICKUP LINE COMPONENTS TABLE (for generator)
-- ============================================
CREATE TABLE IF NOT EXISTS pickup_line_components (
    id SERIAL PRIMARY KEY,
    component_type TEXT NOT NULL CHECK (component_type IN ('opener', 'compliment', 'action', 'flavor', 'complete')),
    pidgin TEXT NOT NULL,
    pronunciation TEXT,
    english TEXT,  -- For complete lines
    meaning TEXT,  -- For flavor words
    category TEXT,  -- For complete lines (ocean, food, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_component_type ON pickup_line_components(component_type);
CREATE INDEX IF NOT EXISTS idx_component_category ON pickup_line_components(category);

-- Enable RLS
ALTER TABLE pickup_line_components ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public pickup line components are viewable by everyone"
ON pickup_line_components FOR SELECT
USING (true);

-- ============================================
-- UPDATE TRIGGER
-- ============================================
CREATE TRIGGER update_crossword_puzzles_updated_at
    BEFORE UPDATE ON crossword_puzzles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
