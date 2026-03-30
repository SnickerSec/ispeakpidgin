-- Local Questions Table (Ask a Local)
CREATE TABLE IF NOT EXISTS local_questions (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) DEFAULT 'Anonymous',
    question_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question Responses (Nested as multiple responses per question)
CREATE TABLE IF NOT EXISTS local_responses (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES local_questions(id) ON DELETE CASCADE,
    responder_name VARCHAR(100) DEFAULT 'Local Expert',
    response_text TEXT NOT NULL,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE local_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_responses ENABLE ROW LEVEL SECURITY;

-- Public Policies
CREATE POLICY "Allow public insert on local_questions" 
ON local_questions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on local_questions" 
ON local_questions FOR SELECT 
USING (status = 'answered' OR status = 'pending');

CREATE POLICY "Allow public select on local_responses" 
ON local_responses FOR SELECT 
USING (true);

-- Admin Policies (via service role)
CREATE POLICY "Allow service role full access on local_questions" 
ON local_questions FOR ALL 
USING (true);

CREATE POLICY "Allow service role full access on local_responses" 
ON local_responses FOR ALL 
USING (true);
