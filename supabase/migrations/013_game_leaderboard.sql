-- Create game_scores table
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    difficulty TEXT DEFAULT 'all',
    streak INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Allow public to read scores (for global leaderboards)
CREATE POLICY "Allow public read access to scores"
    ON public.game_scores FOR SELECT
    USING (true);

-- Allow authenticated users to insert their own scores
CREATE POLICY "Allow users to insert their own scores"
    ON public.game_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Index for common leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_scores_type_score ON public.game_scores (game_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON public.game_scores (created_at DESC);

-- View for Top 100 Leaderboard per game
CREATE OR REPLACE VIEW public.leaderboard_top_100 AS
SELECT 
    username, 
    score, 
    game_type, 
    difficulty,
    streak,
    created_at,
    RANK() OVER (PARTITION BY game_type ORDER BY score DESC, created_at ASC) as rank
FROM 
    public.game_scores;
