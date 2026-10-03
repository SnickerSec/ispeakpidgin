-- Restore English meanings that migration 020 dropped.
--
-- 020 de-duplicated merged meanings ignoring punctuation, so "the best" and "the best!" counted
-- as one and only the "!" form was kept. The translator matches English exactly, so
-- "the best" stopped finding da bes' (it fell through to "da bomb"). Found by the live
-- translator test (tools/testing/test-translator-live.js); values come from the
-- dictionary_entries_merged backup. Only adds a meaning that is missing; safe to re-run.

UPDATE public.dictionary_entries
SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['the best', 'excellent']::text[]) m WHERE NOT (m = ANY (english))),
    updated_at = now()
WHERE id = 'da_bes_513' AND NOT (ARRAY['the best', 'excellent']::text[] <@ english);

UPDATE public.dictionary_entries
SET english = english || ARRAY['how is that possible']::text[],
    updated_at = now()
WHERE pidgin = 'how you figgah?' AND NOT ('how is that possible' = ANY (english));
