-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to dictionary_entries
-- Gemini embeddings are typically 768 dimensions (text-embedding-004)
ALTER TABLE public.dictionary_entries 
ADD COLUMN IF NOT EXISTS embedding vector(768),
ADD COLUMN IF NOT EXISTS last_embedded_at TIMESTAMP WITH TIME ZONE;

-- Create a function to search for dictionary entries by embedding similarity
CREATE OR REPLACE FUNCTION public.match_dictionary_entries (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  pidgin TEXT,
  english JSONB,
  pronunciation TEXT,
  example TEXT,
  examples TEXT[],
  category TEXT,
  difficulty TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.pidgin,
    de.english,
    de.pronunciation,
    de.example,
    de.examples,
    de.category,
    de.difficulty,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM dictionary_entries de
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Index for faster similarity search
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_embedding 
ON public.dictionary_entries USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
