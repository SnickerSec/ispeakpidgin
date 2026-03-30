-- User Suggestions Migration
CREATE TABLE IF NOT EXISTS user_suggestions (
    id SERIAL PRIMARY KEY,
    pidgin VARCHAR(255) NOT NULL UNIQUE,
    english TEXT NOT NULL,
    example TEXT,
    contributor_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE user_suggestions ENABLE ROW LEVEL SECURITY;

-- Public insert policy
CREATE POLICY "Allow public insert on user_suggestions" 
ON user_suggestions FOR INSERT 
WITH CHECK (true);

-- Admin read/update policy (using existing roles if any, but service role always has access)
CREATE POLICY "Allow service role full access on user_suggestions" 
ON user_suggestions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
