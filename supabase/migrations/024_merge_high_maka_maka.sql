-- Merge "high makamaka" into "high maka maka".
--
-- The same word had two rows with different word-page slugs (high-maka-maka, high-makamaka),
-- so two pages competed in search and the slug-based duplicate audit could not see it.
-- The three-word form is the headword (print lexicons and most local spelling use it); the
-- other spellings become spelling_variants, which search already matches.
-- server.js 301-redirects /word/high-makamaka.html to /word/high-maka-maka.html.
--
-- Origin: Hawaiian makamaka is a close friend or patron, so the phrase's path from it is not
-- documented; the entry says so rather than inventing one.
--
-- Both rows are copied to dictionary_entries_merged first, so this can be undone. Keyed on id
-- AND headword, so a row edited since drafting (2026-10-03) is skipped. One transaction.
-- Afterwards: node tools/data/generate-embeddings.js

BEGIN;

-- The backup table predates spelling_variants (020 used LIKE); name columns so it can't drift again.
ALTER TABLE public.dictionary_entries_merged ADD COLUMN IF NOT EXISTS spelling_variants TEXT[];

INSERT INTO public.dictionary_entries_merged
    (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency,
     tags, audio_example, created_at, updated_at, fts, source_language, spelling_variants, merge_role, merged_at)
SELECT de.id, de.pidgin, de.english, de.category, de.pronunciation, de.examples, de.usage, de.origin,
       de.difficulty, de.frequency, de.tags, de.audio_example, de.created_at, de.updated_at, de.fts,
       de.source_language, de.spelling_variants,
       CASE WHEN de.id = 'high_maka_maka_069' THEN 'kept' ELSE 'removed' END, now()
FROM public.dictionary_entries de
WHERE de.id IN ('high_maka_maka_069', 'f2267727-8299-4906-88c7-57ebc15a4916');

UPDATE public.dictionary_entries SET
    english = ARRAY['stuck up', 'snobbish', 'pretentious', 'acting superior', 'snooty', 'pompous']::text[],
    examples = ARRAY[
        'Ever since she moved to town, she get real high maka maka.',
        'Why you acting all high maka maka? We eating at Zippy''s, not one five-star restaurant.',
        'Dat guy ova dea, so high maka maka, he no even talk story wit'' us.',
        'She used to be so nice, but now she high maka maka, no like talk story wit'' us.',
        'She all high maka maka'
    ]::text[],
    usage = 'Describes someone who is pretentious or stuck up: acting high-class and too good for everyone else, putting on airs, or looking down on local ways. Used as an adjective ("she get real high maka maka").',
    origin = 'English "high" (as in high-class) plus Hawaiian makamaka. In ʻŌlelo Hawaiʻi makamaka means a close friend or patron; how the phrase came to mean stuck up is not documented. Some explain it through maka (eyes), picturing someone with their eyes held high.',
    difficulty = 'intermediate',
    tags = ARRAY['slang', 'descriptions', 'hawaiian', 'english']::text[],
    spelling_variants = ARRAY['high makamaka', 'hai maka maka', 'haimakamaka', 'hi makamaka']::text[],
    updated_at = now()
WHERE id = 'high_maka_maka_069' AND pidgin = 'high maka maka';

DELETE FROM public.dictionary_entries
WHERE (id, pidgin) IN (('f2267727-8299-4906-88c7-57ebc15a4916', 'high makamaka'));

COMMIT;
