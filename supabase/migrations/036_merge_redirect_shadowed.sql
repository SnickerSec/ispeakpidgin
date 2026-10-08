-- Migration 036: merge two duplicates that services/word-redirects.js was already hiding
--
-- tools/testing/check-word-links.js found two live entries whose /word/ pages could not be
-- reached, because the redirect map sent them to another spelling of the same word:
--   buss up ← bus up       (/word/bus-up.html → buss up's landing page)
--   bambucha ← bumbucha    (/word/bumbucha.html → /word/bambucha.html; bumboocha merged in 031)
-- The kept entries are the redirect targets, so no public URL changes. The audit's
-- near-duplicate check missed both: neither pair shares an English meaning word for word.
--
-- Meanings and examples are unioned; the merged headword becomes a spelling variant; the kept
-- entry's pronunciation, usage and origin win. Both touched rows of each pair are copied to
-- dictionary_entries_merged first, keyed on id AND headword. One transaction.
-- Afterwards: node tools/data/generate-embeddings.js

BEGIN;

INSERT INTO public.dictionary_entries_merged (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, audio_example, created_at, updated_at, fts, source_language, spelling_variants, merge_role, merged_at)
SELECT de.id, de.pidgin, de.english, de.category, de.pronunciation, de.examples, de.usage, de.origin, de.difficulty, de.frequency, de.tags, de.audio_example, de.created_at, de.updated_at, de.fts, de.source_language, de.spelling_variants,
       CASE WHEN de.id IN ('49575b0d-2e40-4bfa-9c67-f5925f1a33c2', 'bumbucha_212') THEN 'removed' ELSE 'kept' END, now()
FROM public.dictionary_entries de
WHERE (de.id, de.pidgin) IN (
    ('buss_up_213', 'buss up'),
    ('49575b0d-2e40-4bfa-9c67-f5925f1a33c2', 'bus up'),
    ('93129535-031c-401b-ac0f-0978ac49b830', 'bambucha'),
    ('bumbucha_212', 'bumbucha')
);

-- buss up ← bus up
UPDATE public.dictionary_entries SET
    english = ARRAY['broken', 'beaten up', 'beat up', 'worn out', 'damaged']::text[],
    examples = ARRAY['My car stay all buss up', 'My car all buss up aftah da accident.', 'Eh, be careful, dat plate all buss up!', 'My slippahs stay all bus up.', 'Eh brah, my body stay bus up from dat long hike!']::text[],
    spelling_variants = ARRAY['bus up']::text[],
    updated_at = now()
WHERE id = 'buss_up_213' AND pidgin = 'buss up';

-- bambucha ← bumbucha
UPDATE public.dictionary_entries SET
    english = ARRAY['huge', 'very large', 'gigantic', 'big', 'very big']::text[],
    examples = ARRAY['Ho, dat mango stay bambucha!', 'Da wave was bambucha, brah, almost wen'' wash ''em all away!', 'Eh, you see dat truck? Bambucha size, yeah?', 'One bumboocha wave', 'Da mango tree got bumboocha mangoes!', 'Look at dat bumboocha truck!', 'Dat fish bumbucha big, yeah?']::text[],
    spelling_variants = ARRAY['bumboocha', 'bumbucha']::text[],
    updated_at = now()
WHERE id = '93129535-031c-401b-ac0f-0978ac49b830' AND pidgin = 'bambucha';

DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (
    ('49575b0d-2e40-4bfa-9c67-f5925f1a33c2', 'bus up'),
    ('bumbucha_212', 'bumbucha')
);

COMMIT;
