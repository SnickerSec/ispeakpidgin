-- Merge "mauka and makai" into "mauka makai".
--
-- Same phrase, same three meanings, two rows: mauka makai (2026-08-25) already listed
-- "mauka and makai" as a spelling variant when the curated ingest of 2026-10-03 added it again
-- as its own row, giving a second /word/mauka-and-makai.html page. mauka makai is the headword;
-- server.js 301s /word/mauka-and-makai.html to /what-does-mauka-makai-mean.html, the
-- phrase's landing page. The single words mauka and makai keep their own entries and pages.
--
-- Both rows are copied to dictionary_entries_merged first, so this can be undone. Keyed on id
-- AND headword, so a row edited since drafting (2026-10-03) is skipped. One transaction.
-- Afterwards: node tools/data/generate-embeddings.js

BEGIN;

INSERT INTO public.dictionary_entries_merged
    (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency,
     tags, audio_example, created_at, updated_at, fts, source_language, spelling_variants, merge_role, merged_at)
SELECT de.id, de.pidgin, de.english, de.category, de.pronunciation, de.examples, de.usage, de.origin,
       de.difficulty, de.frequency, de.tags, de.audio_example, de.created_at, de.updated_at, de.fts,
       de.source_language, de.spelling_variants,
       CASE WHEN de.id = '007881d5-366f-4057-a362-ec8f6c8225ba' THEN 'kept' ELSE 'removed' END, now()
FROM public.dictionary_entries de
WHERE de.id IN ('007881d5-366f-4057-a362-ec8f6c8225ba', '7e6162a1-4061-402a-8e5b-e9514de86a19');

UPDATE public.dictionary_entries SET
    examples = ARRAY[
        'We wen search mauka makai for dat missing surfboard.',
        'Da whole island stay celebrating mauka makai.',
        'We searched mauka and makai for da lost dog.'
    ]::text[],
    usage = 'Encompassing the whole island from mountain ridge to shoreline: everywhere, all over. Also said "mauka and makai" or "mauka to makai". For a single direction use mauka (toward the mountains) or makai (toward the ocean).',
    frequency = 'high',
    tags = ARRAY['locations', 'directions', 'island', 'geography', 'travel']::text[],
    spelling_variants = ARRAY['mauka and makai', 'mauka to makai']::text[],
    updated_at = now()
WHERE id = '007881d5-366f-4057-a362-ec8f6c8225ba' AND pidgin = 'mauka makai';

DELETE FROM public.dictionary_entries
WHERE (id, pidgin) IN (('7e6162a1-4061-402a-8e5b-e9514de86a19', 'mauka and makai'));

COMMIT;
