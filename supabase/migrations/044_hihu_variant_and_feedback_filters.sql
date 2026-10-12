-- Migration 044: Ingest 'hihu' spelling variant for 'huhu' (angry / upset)
--
-- Search Console demand shows searches for 'hihu' (common typo of 'huhu').
-- Mapping 'hihu' as a variant routes users directly to 'huhu' in search and site navigation.

BEGIN;

UPDATE dictionary_entries
SET spelling_variants = ARRAY(
    SELECT DISTINCT unnest(array_cat(
        COALESCE(spelling_variants, ARRAY[]::text[]),
        ARRAY['hihu']
    ))
),
updated_at = NOW()
WHERE id = 'huhu_073';

UPDATE search_gaps
SET status = 'added'
WHERE term IN ('hihu')
  AND status = 'pending';

COMMIT;
