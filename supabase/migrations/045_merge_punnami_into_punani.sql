-- Migration 045: Merge redundant 'punnami' misspelling into 'punani'
--
-- 'punnami' was previously ingested as a standalone headword with the definition
-- "Common misspelling of 'punani'". It emits a competing /word/ page and captures
-- unrelated search queries (e.g. Telugu full moon festival 'Punnami').
--
-- This migration:
-- 1. Merges 'punnami' into 'punani' (id: 'punani_383') spelling_variants.
-- 2. Deletes the embedding and standalone dictionary_entries row for 'punnami'.
-- 3. Preserves URL traffic via 301 redirect in services/word-redirects.js.

BEGIN;

-- 1. Add 'punnami' to punani's spelling_variants
UPDATE dictionary_entries
SET spelling_variants = ARRAY(
    SELECT DISTINCT unnest(array_cat(
        COALESCE(spelling_variants, ARRAY[]::text[]),
        ARRAY['punnami']
    ))
),
updated_at = NOW()
WHERE id = 'punani_383';

-- 2. Delete embedding for the standalone punnami row
DELETE FROM dictionary_embeddings
WHERE entry_id = 'b4cb0eb9-c2d4-4c33-9a73-13b14fdad5e0';

-- 3. Delete the standalone punnami headword row
DELETE FROM dictionary_entries
WHERE id = 'b4cb0eb9-c2d4-4c33-9a73-13b14fdad5e0';

-- 4. Mark any pending search_gaps for punnami as added
UPDATE search_gaps
SET status = 'added'
WHERE term = 'punnami'
  AND status = 'pending';

COMMIT;
