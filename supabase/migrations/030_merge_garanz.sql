-- Merge four entries for one word into garanz: garanz ← guaranz, garans, gueren-tee
--
-- All four are Pidgin "guarantee(d)" = for sure, no doubt. The audit's duplicate check missed
-- them because the letters differ, so each had its own /word/ page competing for one search.
-- garanz is kept: the only one of the four pages with Search Console impressions (90 days to
-- 2026-09-30), and the headword the user chose. gueren-tee, the full "guarantee" said
-- local-style, becomes a variant with the rest.
--
-- Meanings and tags are unioned; the merged headwords become spelling_variants; fragment
-- examples ("Garans going rain today", "Guaranz going be good") are dropped.
-- server.js 301-redirects /word/guaranz, /word/garans and /word/gueren-tee to /word/garanz.
--
-- Every touched row is copied to dictionary_entries_merged first, so this can be undone. Keyed
-- on id AND headword, so a row edited since drafting is skipped. One transaction.
-- Afterwards: node tools/data/generate-embeddings.js

BEGIN;

INSERT INTO public.dictionary_entries_merged (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, audio_example, created_at, updated_at, fts, source_language, spelling_variants, merge_role, merged_at)
SELECT de.id, de.pidgin, de.english, de.category, de.pronunciation, de.examples, de.usage, de.origin, de.difficulty, de.frequency, de.tags, de.audio_example, de.created_at, de.updated_at, de.fts, de.source_language, de.spelling_variants,
       CASE WHEN de.id = 'garanz_050' THEN 'kept' ELSE 'removed' END, now()
FROM public.dictionary_entries de
WHERE (de.id, de.pidgin) IN (('garanz_050', 'garanz'), ('guaranz_241', 'guaranz'), ('garans_238', 'garans'), ('guerentee_505', 'gueren-tee'));

UPDATE public.dictionary_entries SET
    english = ARRAY['guaranteed', 'for sure', 'certain', 'no doubt', 'definitely']::text[],
    examples = ARRAY['Garanz, he gonna do it!', 'You pass da test, garanz!', 'I garans you, he gonna be late.', 'Guaranz, I goin'' be there!', 'You no need worry, I gueren-tee I get you brah.', 'She said she coming, gueren-tee, so just wait, yeah?']::text[],
    usage = 'Means "guaranteed" or "for sure": states something with complete certainty, or reassures someone. Doubled up as "garanz ballbaranz" for emphasis. Guaranz and garans are other spellings, and gueren-tee is the full word "guarantee" said local-style.',
    origin = 'Pidgin clipping of English "guarantee(d)".',
    tags = ARRAY['expressions', 'english', 'emphasis', 'certainty']::text[],
    spelling_variants = ARRAY['guaranz', 'garans', 'gueren-tee', 'garanz ballbaranz', 'guaranz ballbaranz']::text[],
    updated_at = now()
WHERE id = 'garanz_050' AND pidgin = 'garanz';

DELETE FROM public.dictionary_entries
WHERE (id, pidgin) IN (('guaranz_241', 'guaranz'), ('garans_238', 'garans'), ('guerentee_505', 'gueren-tee'))
  AND EXISTS (SELECT 1 FROM public.dictionary_entries WHERE id = 'garanz_050' AND 'gueren-tee' = ANY(spelling_variants));

COMMIT;
