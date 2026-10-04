-- Migration 028: e kala mai no longer claims kalamai as a spelling variant
--
-- 027 set e kala mai's spelling_variants to ['kala mai', 'kalamai', 'excuse me']. 026 had
-- already made kalamai its own headword with 'kala mai' as its variant, so "kalamai" was
-- now both a headword and another entry's variant: the audit's duplicate check flagged
-- it, and search scored both entries as an exact headword hit.
--
-- kalamai keeps 'kala mai'. 'excuse me' is English, and already one of e kala mai's
-- meanings; search and gap detection (services/search-gaps.js) match meanings, so it does
-- not need to be a variant.
--
-- Guarded on the value 027 wrote, so it is a no-op if the row has been edited since.

BEGIN;

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY[]::text[],
    updated_at = now()
WHERE id = 'e_kala_mai_327' AND pidgin = 'e kala mai'
  AND spelling_variants = ARRAY['kala mai', 'kalamai', 'excuse me']::text[];

COMMIT;
