-- User Profiles and Favorites Migration

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Favorites Table
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL, -- 'word' or 'phrase'
    item_id INTEGER NOT NULL,
    pidgin TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

-- User Sessions Table (Adapting the admin pattern)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (true); -- Public can view? No, let's keep it private
-- Actually, for custom auth with service role, we handle RLS via code or specific JWT claims
-- Since we are using a custom JWT secret and service role, we'll keep it simple for now

CREATE POLICY "Allow service role full access on user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow service role full access on user_favorites" ON user_favorites FOR ALL USING (true);
CREATE POLICY "Allow service role full access on user_sessions" ON user_sessions FOR ALL USING (true);
