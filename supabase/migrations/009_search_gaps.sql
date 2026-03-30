-- Search Gaps Migration
-- Logs searches that returned no results to help identify missing dictionary terms
CREATE TABLE IF NOT EXISTS search_gaps (
    id SERIAL PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    count INTEGER DEFAULT 1,
    last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'added', 'ignored')),
    UNIQUE(term)
);

-- Enable RLS
ALTER TABLE search_gaps ENABLE ROW LEVEL SECURITY;

-- Public insert (for logging)
CREATE POLICY "Allow public insert on search_gaps" 
ON search_gaps FOR INSERT 
WITH CHECK (true);

-- Public update (for incrementing count)
CREATE POLICY "Allow public update on search_gaps" 
ON search_gaps FOR UPDATE 
USING (true);

-- Admin read/update (via service role)
CREATE POLICY "Allow service role full access on search_gaps" 
ON search_gaps FOR ALL 
USING (true);
