-- Lessons Migration
-- Creates tables for learning hub lessons data

-- Lessons table (main lesson metadata)
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    lesson_key VARCHAR(50) UNIQUE NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    title VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    cultural_note TEXT,
    practice TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lesson vocabulary table
CREATE TABLE IF NOT EXISTS lesson_vocabulary (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    pidgin VARCHAR(200) NOT NULL,
    english VARCHAR(500) NOT NULL,
    example VARCHAR(500),
    sort_order INTEGER DEFAULT 0
);

-- Lesson quiz questions table
CREATE TABLE IF NOT EXISTS lesson_quiz_questions (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    lesson_key VARCHAR(50),
    sort_order INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(level);
CREATE INDEX IF NOT EXISTS idx_lesson_vocabulary_lesson_id ON lesson_vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_quiz_level ON lesson_quiz_questions(level);

-- Enable Row Level Security
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_quiz_questions ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access on lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Allow public read access on lesson_vocabulary" ON lesson_vocabulary FOR SELECT USING (true);
CREATE POLICY "Allow public read access on lesson_quiz_questions" ON lesson_quiz_questions FOR SELECT USING (true);
