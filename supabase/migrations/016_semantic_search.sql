-- Semantic dictionary search (pgvector + Gemini embeddings).
--
-- Rewritten 2026-10-02 before it was ever applied. The first draft declared id UUID and
-- english JSONB (the real columns are TEXT and TEXT[]), so its function could not have
-- returned a row, and it put the vector on dictionary_entries itself, where every
-- select('*') (/api/dictionary/all ships all 799 rows) would carry 768 floats per entry.
-- Vectors live in their own table instead.
--
-- Vectors come from services/gemini.js (gemini-embedding-001, 768 dimensions) via
-- node tools/data/generate-embeddings.js, which re-embeds only entries whose text changed.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.dictionary_embeddings (
    entry_id     TEXT PRIMARY KEY REFERENCES public.dictionary_entries(id) ON DELETE CASCADE,
    embedding    extensions.vector(768) NOT NULL,
    content_hash TEXT NOT NULL,               -- md5 of the embedded text; a change means re-embed
    model        TEXT NOT NULL,
    embedded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only the service role writes or reads vectors directly; the public reaches them through
-- match_dictionary_entries below.
ALTER TABLE public.dictionary_embeddings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_dictionary_embeddings_hnsw
    ON public.dictionary_embeddings USING hnsw (embedding extensions.vector_cosine_ops);

-- Return the dictionary entries closest to a query embedding.
-- SECURITY DEFINER so anon can search without reading dictionary_embeddings itself.
CREATE OR REPLACE FUNCTION public.match_dictionary_entries (
    query_embedding extensions.vector(768),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id TEXT,
    pidgin TEXT,
    english TEXT[],
    pronunciation TEXT,
    examples TEXT[],
    usage TEXT,
    category TEXT,
    difficulty TEXT,
    source_language TEXT,
    similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT de.id, de.pidgin, de.english, de.pronunciation, de.examples, de.usage,
           de.category, de.difficulty, de.source_language,
           1 - (emb.embedding <=> query_embedding) AS similarity
    FROM public.dictionary_embeddings emb
    JOIN public.dictionary_entries de ON de.id = emb.entry_id
    WHERE 1 - (emb.embedding <=> query_embedding) > match_threshold
    ORDER BY emb.embedding <=> query_embedding
    LIMIT LEAST(match_count, 50);
$$;

REVOKE ALL ON FUNCTION public.match_dictionary_entries(extensions.vector, float, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_dictionary_entries(extensions.vector, float, int) TO anon, authenticated, service_role;
