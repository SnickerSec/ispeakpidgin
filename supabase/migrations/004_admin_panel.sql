-- ============================================
-- Admin Panel Tables Migration
-- ============================================

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    last_login TIMESTAMPTZ,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Sessions Table (for JWT revocation)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Audit Log Table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user_id ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service Role Only (admin tables are server-side only)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access to admin_users" ON admin_users;
DROP POLICY IF EXISTS "Service role full access to admin_sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Service role full access to site_settings" ON site_settings;
DROP POLICY IF EXISTS "Service role full access to admin_audit_log" ON admin_audit_log;

-- Create policies for service role
CREATE POLICY "Service role full access to admin_users"
    ON admin_users FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access to admin_sessions"
    ON admin_sessions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access to site_settings"
    ON site_settings FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access to admin_audit_log"
    ON admin_audit_log FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Default Site Settings
-- ============================================

-- API Keys (secrets - values stored in env vars, these are placeholders)
INSERT INTO site_settings (key, value, value_type, category, description, is_secret)
VALUES
    ('elevenlabs_api_key', '', 'string', 'api_keys', 'ElevenLabs API key for text-to-speech', TRUE),
    ('gemini_api_key', '', 'string', 'api_keys', 'Google Gemini API key for AI translation', TRUE),
    ('google_translate_enabled', 'true', 'boolean', 'api_keys', 'Enable Google Translate API', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Voice Settings (ElevenLabs)
INSERT INTO site_settings (key, value, value_type, category, description, is_secret)
VALUES
    ('elevenlabs_voice_id', 'f0ODjLMfcJmlKfs7dFCW', 'string', 'voice_settings', 'ElevenLabs voice ID (Hawaiian voice)', FALSE),
    ('elevenlabs_model_id', 'eleven_flash_v2_5', 'string', 'voice_settings', 'ElevenLabs model ID', FALSE),
    ('voice_stability', '0.5', 'number', 'voice_settings', 'Voice stability (0-1)', FALSE),
    ('voice_similarity_boost', '0.8', 'number', 'voice_settings', 'Voice similarity boost (0-1)', FALSE),
    ('voice_style', '0.0', 'number', 'voice_settings', 'Voice style (0-1)', FALSE),
    ('voice_speaker_boost', 'true', 'boolean', 'voice_settings', 'Use speaker boost', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Model Configuration
INSERT INTO site_settings (key, value, value_type, category, description, is_secret)
VALUES
    ('gemini_model', 'gemini-2.5-flash-lite', 'string', 'model_config', 'Gemini model for translation', FALSE),
    ('gemini_temperature', '0.3', 'number', 'model_config', 'Gemini temperature for translation (0-1)', FALSE),
    ('gemini_max_tokens', '500', 'number', 'model_config', 'Max output tokens for translation', FALSE),
    ('pickup_temperature', '0.9', 'number', 'model_config', 'Temperature for pickup line generation (0-1)', FALSE),
    ('pickup_max_tokens', '300', 'number', 'model_config', 'Max output tokens for pickup lines', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Rate Limits
INSERT INTO site_settings (key, value, value_type, category, description, is_secret)
VALUES
    ('api_rate_limit_window_ms', '900000', 'number', 'rate_limits', 'API rate limit window in ms (15 min default)', FALSE),
    ('api_rate_limit_max', '100', 'number', 'rate_limits', 'Max API requests per window', FALSE),
    ('translation_rate_limit_max', '50', 'number', 'rate_limits', 'Max translation requests per window', FALSE),
    ('page_rate_limit_max', '300', 'number', 'rate_limits', 'Max page requests per window', FALSE),
    ('dictionary_rate_limit_max', '200', 'number', 'rate_limits', 'Max dictionary requests per window', FALSE),
    ('login_rate_limit_max', '5', 'number', 'rate_limits', 'Max login attempts per 15 min', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Cache Settings (TTL in seconds)
INSERT INTO site_settings (key, value, value_type, category, description, is_secret)
VALUES
    ('dictionary_cache_ttl', '300', 'number', 'cache_settings', 'Dictionary cache TTL in seconds (5 min)', FALSE),
    ('phrases_cache_ttl', '600', 'number', 'cache_settings', 'Phrases cache TTL in seconds (10 min)', FALSE),
    ('lessons_cache_ttl', '300', 'number', 'cache_settings', 'Lessons cache TTL in seconds (5 min)', FALSE),
    ('settings_refresh_interval', '60', 'number', 'cache_settings', 'Settings auto-refresh interval in seconds', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Feature Toggles
INSERT INTO site_settings (key, value, value_type, category, description, is_secret)
VALUES
    ('tts_enabled', 'true', 'boolean', 'features', 'Enable text-to-speech functionality', FALSE),
    ('ai_translation_enabled', 'true', 'boolean', 'features', 'Enable AI-powered translation', FALSE),
    ('pickup_generator_enabled', 'true', 'boolean', 'features', 'Enable pickup line generator', FALSE),
    ('cringe_generator_enabled', 'true', 'boolean', 'features', 'Enable 808 cringe generator', FALSE),
    ('wordle_enabled', 'true', 'boolean', 'features', 'Enable Pidgin Wordle game', FALSE),
    ('crossword_enabled', 'true', 'boolean', 'features', 'Enable Pidgin Crossword game', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Site Settings
INSERT INTO site_settings (key, value, value_type, category, description, is_secret)
VALUES
    ('site_name', 'ChokePidgin', 'string', 'site', 'Site display name', FALSE),
    ('site_tagline', 'Learn Hawaiian Pidgin', 'string', 'site', 'Site tagline', FALSE),
    ('maintenance_mode', 'false', 'boolean', 'site', 'Enable maintenance mode', FALSE),
    ('maintenance_message', 'Site is under maintenance. Check back soon!', 'string', 'site', 'Maintenance mode message', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Function to get setting value with type conversion
CREATE OR REPLACE FUNCTION get_setting(setting_key VARCHAR)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
    setting_type VARCHAR(20);
BEGIN
    SELECT value, value_type INTO setting_value, setting_type
    FROM site_settings
    WHERE key = setting_key;

    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all settings by category
CREATE OR REPLACE FUNCTION get_settings_by_category(category_name VARCHAR)
RETURNS TABLE (
    key VARCHAR(100),
    value TEXT,
    value_type VARCHAR(20),
    description TEXT,
    is_secret BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.key, s.value, s.value_type, s.description, s.is_secret
    FROM site_settings s
    WHERE s.category = category_name
    ORDER BY s.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
