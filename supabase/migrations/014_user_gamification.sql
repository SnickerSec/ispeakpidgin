-- User Gamification Migration: XP, Ranks, and Badges

-- 1. Update user_profiles with XP and Leveling
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_rank TEXT DEFAULT 'Malahini',
ADD COLUMN IF NOT EXISTS badge_ids JSONB DEFAULT '[]'::jsonb;

-- 2. Create User XP History table for auditing and preventing duplicate rewards
CREATE TABLE IF NOT EXISTS public.user_xp_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- 'quiz_complete', 'word_favorite', 'suggestion_approved', etc.
    reference_id TEXT, -- e.g., quiz_id, word_id
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for checking duplicates (e.g., only reward favoriting a specific word once)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_xp_unique_action 
ON public.user_xp_history (user_id, action_type, reference_id) 
WHERE reference_id IS NOT NULL;

-- 3. Create Badges Master Table
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY, -- 'spam_musubi_master', 'first_shaka', etc.
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    xp_bonus INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create User Badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, badge_id)
);

-- 5. Helper function to calculate rank from XP
CREATE OR REPLACE FUNCTION public.calculate_rank(xp INTEGER) 
RETURNS TEXT AS $$
BEGIN
    IF xp >= 5000 THEN RETURN 'Ali''i';
    ELSIF xp >= 2500 THEN RETURN 'Kamaʻāina';
    ELSIF xp >= 1000 THEN RETURN 'Local';
    ELSIF xp >= 500 THEN RETURN 'Townie';
    ELSIF xp >= 100 THEN RETURN 'Regular';
    ELSE RETURN 'Malahini';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- RPC to increment XP atomically
CREATE OR REPLACE FUNCTION public.increment_user_xp(target_user_id UUID, xp_to_add INTEGER)
RETURNS public.user_profiles AS $$
DECLARE
    updated_profile public.user_profiles;
BEGIN
    UPDATE public.user_profiles
    SET total_xp = total_xp + xp_to_add
    WHERE id = target_user_id
    RETURNING * INTO updated_profile;
    
    RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to update rank when XP changes
CREATE OR REPLACE FUNCTION public.update_user_rank_on_xp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_rank := public.calculate_rank(NEW.total_xp);
    NEW.current_level := floor(sqrt(NEW.total_xp / 10)) + 1; -- Simple level curve
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rank
BEFORE UPDATE OF total_xp ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_rank_on_xp();

-- 7. RLS Policies
ALTER TABLE public.user_xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own XP history" ON public.user_xp_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view all badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

-- 8. Seed some initial badges
INSERT INTO public.badges (id, name, description, xp_bonus) VALUES
('malahini_arrival', 'Welcome to da Islands', 'Registered your account', 50),
('first_shaka', 'First Shaka', 'Favorited your first word', 10),
('word_wizard', 'Word Wizard', 'Favorited 20 words', 100),
('helpful_local', 'Helpful Local', 'First suggestion approved', 200),
('quiz_king', 'Quiz King', 'Got 100% on 5 quizzes', 500),
('talk_story_pro', 'Talk Story Pro', 'Chatted with AI for the first time', 50)
ON CONFLICT (id) DO NOTHING;
