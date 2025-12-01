-- ============================================
-- ChokePidgin Supabase Schema
-- Complete database schema for all data
-- ============================================

-- ============================================
-- 1. DICTIONARY ENTRIES TABLE (Main Dictionary)
-- ============================================
CREATE TABLE IF NOT EXISTS dictionary_entries (
    id TEXT PRIMARY KEY,
    pidgin TEXT NOT NULL,
    english TEXT[] DEFAULT '{}',
    category TEXT,
    pronunciation TEXT,
    examples TEXT[] DEFAULT '{}',
    usage TEXT,
    origin TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    frequency TEXT CHECK (frequency IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    tags TEXT[] DEFAULT '{}',
    audio_example TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_dictionary_pidgin ON dictionary_entries(pidgin);
CREATE INDEX IF NOT EXISTS idx_dictionary_category ON dictionary_entries(category);
CREATE INDEX IF NOT EXISTS idx_dictionary_difficulty ON dictionary_entries(difficulty);
CREATE INDEX IF NOT EXISTS idx_dictionary_frequency ON dictionary_entries(frequency);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_dictionary_search ON dictionary_entries
USING GIN (to_tsvector('english', pidgin || ' ' || array_to_string(english, ' ')));

-- Enable RLS
ALTER TABLE dictionary_entries ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public dictionary entries are viewable by everyone"
ON dictionary_entries FOR SELECT
USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dictionary_updated_at
    BEFORE UPDATE ON dictionary_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. PHRASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phrases (
    id SERIAL PRIMARY KEY,
    pidgin TEXT NOT NULL,
    english TEXT NOT NULL,
    category TEXT,
    context TEXT,
    pronunciation TEXT,
    source TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_phrases_pidgin ON phrases(pidgin);
CREATE INDEX IF NOT EXISTS idx_phrases_english ON phrases(english);
CREATE INDEX IF NOT EXISTS idx_phrases_category ON phrases(category);
CREATE INDEX IF NOT EXISTS idx_phrases_difficulty ON phrases(difficulty);

-- Enable RLS
ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public phrases are viewable by everyone"
ON phrases FOR SELECT
USING (true);

-- ============================================
-- 2. STORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    pidgin_text TEXT NOT NULL,
    english_translation TEXT NOT NULL,
    cultural_notes TEXT,
    vocabulary JSONB DEFAULT '[]',
    audio_example TEXT,
    tags TEXT[] DEFAULT '{}',
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searches
CREATE INDEX IF NOT EXISTS idx_stories_difficulty ON stories(difficulty);
CREATE INDEX IF NOT EXISTS idx_stories_tags ON stories USING GIN(tags);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public stories are viewable by everyone"
ON stories FOR SELECT
USING (true);

-- ============================================
-- 3. CROSSWORD WORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crossword_words (
    id SERIAL PRIMARY KEY,
    word TEXT NOT NULL,
    display_word TEXT NOT NULL,
    clue TEXT NOT NULL,
    clue_pidgin TEXT,
    category TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    length INTEGER NOT NULL,
    pronunciation TEXT,
    example TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crossword_category ON crossword_words(category);
CREATE INDEX IF NOT EXISTS idx_crossword_difficulty ON crossword_words(difficulty);
CREATE INDEX IF NOT EXISTS idx_crossword_length ON crossword_words(length);

-- Enable RLS
ALTER TABLE crossword_words ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public crossword words are viewable by everyone"
ON crossword_words FOR SELECT
USING (true);

-- ============================================
-- 4. PICKUP LINES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pickup_lines (
    id SERIAL PRIMARY KEY,
    pidgin TEXT NOT NULL,
    english TEXT NOT NULL,
    category TEXT,
    spiciness INTEGER CHECK (spiciness BETWEEN 1 AND 5),
    context TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pickup_category ON pickup_lines(category);
CREATE INDEX IF NOT EXISTS idx_pickup_spiciness ON pickup_lines(spiciness);

-- Enable RLS
ALTER TABLE pickup_lines ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public pickup lines are viewable by everyone"
ON pickup_lines FOR SELECT
USING (true);

-- ============================================
-- 5. QUIZ QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'multiple_choice', 'true_false', 'fill_blank'
    options JSONB DEFAULT '[]',
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    category TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    points INTEGER DEFAULT 10,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_category ON quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_difficulty ON quiz_questions(difficulty);

-- Enable RLS
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public quiz questions are viewable by everyone"
ON quiz_questions FOR SELECT
USING (true);

-- ============================================
-- 6. USER PROGRESS TABLE (Future use)
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    words_learned TEXT[] DEFAULT '{}',
    stories_read TEXT[] DEFAULT '{}',
    quiz_scores JSONB DEFAULT '{}',
    streak_days INTEGER DEFAULT 0,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users can view own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. FAVORITES/BOOKMARKS TABLE (Future use)
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'word', 'phrase', 'story', 'pickup_line'
    item_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own favorites
CREATE POLICY "Users can view own favorites"
ON user_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
ON user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
ON user_favorites FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_phrases_updated_at
    BEFORE UPDATE ON phrases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
