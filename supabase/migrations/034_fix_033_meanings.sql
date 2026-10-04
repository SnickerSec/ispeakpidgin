-- Migration 034: clean up after 033
--
-- 033 stored two search queries as English meanings of brah ("meanings for brah", "meaning of
-- brah"), which the brah page then listed as definitions; services/search-gaps.js already
-- strips "meaning(s) of/for" from queries, so they were never needed for coverage. It also
-- gave otomatic "automatic" as both a meaning and a spelling variant; as a variant it reads as
-- the Pidgin headword (the audit's english-variants check), and the meaning alone covers search.
--
-- array_remove only touches the named values, so other edits to these rows are kept.

BEGIN;

UPDATE public.dictionary_entries SET
    english = array_remove(array_remove(english, 'meanings for brah'), 'meaning of brah'),
    updated_at = now()
WHERE pidgin = 'brah' AND english && ARRAY['meanings for brah', 'meaning of brah']::text[];

UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'automatic'),
    updated_at = now()
WHERE pidgin = 'otomatic' AND 'automatic' = ANY(spelling_variants);

COMMIT;
