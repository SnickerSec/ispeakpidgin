-- Translator data fixes found by the live translator test probe (2026-10-02).
--
-- 1. "go" was defined as ["let's go", "we'll go"]. The translator reads a headword's first
--    meaning as its English, so every Pidgin "go" became "let's go": "I no can go" →
--    "I cannot let's go", "you like go?" → "You like let's go?". Its usage text and examples
--    ("We go beach") describe the separate "we go" entry, which already means "let's go".
-- 2. "nevah" is how many people spell neva; as a spelling variant, search and Pidgin→English
--    translation now read it as neva.
-- Guarded on the current values; safe to re-run.

UPDATE public.dictionary_entries
SET english = ARRAY['go']::text[],
    usage = 'The verb "to go". Also marks intention before another verb: "I go eat" means I''m going to eat. For "let''s go", Pidgin says "we go".',
    examples = ARRAY['I go store, you like anything?', 'Bumbye I go eat.']::text[],
    updated_at = now()
WHERE id = 'go_1025' AND english = ARRAY['let''s go', 'we''ll go']::text[];

UPDATE public.dictionary_entries
SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['nevah']::text[])),
    updated_at = now()
WHERE id = 'neva_2010';
