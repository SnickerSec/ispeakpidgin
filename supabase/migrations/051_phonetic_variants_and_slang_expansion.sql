-- Migration 051: Search Console Phonetic Spelling Variants & Local Slang Expansion
-- 1. Add Search Console & search_gaps phonetic spelling variants to kahuna, hula, haole,
--    a hui hou, braddah, cuzzo, faamolemole, ack, sistah, and wassup.
-- 2. Backfill optional metadata on cuzzo.
-- 3. Ingest two local Hawaii Pidgin slang entries: ufa (Samoan loanword) and bvds (underwear).

BEGIN;

-- 1. Phonetic spelling variants from Search Console & user search_gaps
UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['cahunas', 'kahoonas', 'kahonas', 'cahuna', 'kahoona', 'kahona', 'kahunas']))),
    updated_at = NOW()
WHERE id = 'kahuna_083' AND pidgin = 'kahuna';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['hoola', 'houla', 'huala']))),
    updated_at = NOW()
WHERE id = 'hula_601' AND pidgin = 'hula';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['holeo', 'haole boy', 'howlie']))),
    updated_at = NOW()
WHERE id = 'haole_064' AND pidgin = 'haole';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['farewell', 'aloha a hui hou', 'a hui hou kakou', 'a hou hoi']))),
    updated_at = NOW()
WHERE id = 'a_hui_hou_600' AND pidgin = 'a hui hou';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['bruddah', 'brodda']))),
    updated_at = NOW()
WHERE id = 'braddah_318' AND pidgin = 'braddah';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['couso', 'cuzo']))),
    origin = COALESCE(origin, 'Playful island slang variation of "cousin" / "cuz," reflecting close family-style friendships across Hawaii.'),
    difficulty = COALESCE(difficulty, 'beginner'),
    frequency = COALESCE(frequency, 'medium'),
    audio_example = COALESCE(audio_example, 'Eh cuzzo, you like go surf later?'),
    updated_at = NOW()
WHERE id = '5f427e7d-d547-4d68-9de6-ed605abb042a' AND pidgin = 'cuzzo';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['faʻamolemole', 'fa''amolemole', 'fakamolemole']))),
    origin = 'From Samoan faʻamolemole ("please"), heard alongside cognate Tongan fakamolemole across Hawaii''s Pacific Islander communities.',
    updated_at = NOW()
WHERE id = '84b11693-97a3-4ae9-b791-3fde62b0a724' AND pidgin = 'faamolemole';

UPDATE public.dictionary_entries SET
    english = ARRAY['to act', 'behave', 'act up', 'show off']::text[],
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['acking', 'aking']))),
    updated_at = NOW()
WHERE id = 'ack_002' AND pidgin = 'ack';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['sista', 'sosta']))),
    updated_at = NOW()
WHERE id = 'sistah_160' AND pidgin = 'sistah';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['sup', 'sahp', 'sap', 'whassup']))),
    updated_at = NOW()
WHERE id = 'wassup_190' AND pidgin = 'wassup';

-- 2. Ingest local slang entries: ufa & bvds
INSERT INTO public.dictionary_entries (
    id, pidgin, english, category, pronunciation, examples, usage, origin,
    difficulty, frequency, tags, audio_example, source_language, spelling_variants
)
VALUES
(
    'a7b8c9d0-e1f2-4a3b-8c4d-5e6f7a8b9c01',
    'ufa',
    ARRAY['butt', 'buttocks', 'rear end']::text[],
    'slang',
    'OO-fah',
    ARRAY[
        'Shut your ufa!',
        'He wen fall right on his ufa.',
        'No act lolo or you get boot in da ufa.'
    ]::text[],
    'Borrowed from Samoan into Hawaii local slang, "ufa" means butt or rear end (similar to Hawaiian "okole"). Commonly heard in playful local trash talk and schoolyard banter across the islands.',
    'Directly from the Samoan word ufa (buttocks/rear end), brought into everyday Hawaii Pidgin slang through Hawaii''s Samoan community.',
    'beginner',
    'medium',
    ARRAY['slang', 'samoan', 'body']::text[],
    'He wen fall right on his ufa.',
    'pidgin',
    ARRAY['ufas']::text[]
),
(
    'b8c9d0e1-f2a3-4b4c-9d5e-6f7a8b9c0d12',
    'bvds',
    ARRAY['underwear', 'briefs', 'men''s underwear']::text[],
    'slang',
    'bee-vee-DEEZ',
    ARRAY[
        'Go put on clean BVDs before we go town!',
        'Small kid time we used to jump off da pier in our BVDs.',
        'Aunty hang all da BVDs on da clothesline.'
    ]::text[],
    'Classic local Hawaii Pidgin term for men''s or boys'' underwear and briefs, used generically regardless of the actual brand.',
    'From the American underwear brand B.V.D., generalized in plantation and mid-century Hawaii into the everyday local word for briefs or underwear.',
    'beginner',
    'medium',
    ARRAY['slang', 'clothing', 'everyday']::text[],
    'Go put on clean BVDs before we go town!',
    'pidgin',
    ARRAY['bvd']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    pidgin = EXCLUDED.pidgin,
    english = EXCLUDED.english,
    category = EXCLUDED.category,
    pronunciation = EXCLUDED.pronunciation,
    examples = EXCLUDED.examples,
    usage = EXCLUDED.usage,
    origin = EXCLUDED.origin,
    difficulty = EXCLUDED.difficulty,
    frequency = EXCLUDED.frequency,
    tags = EXCLUDED.tags,
    audio_example = EXCLUDED.audio_example,
    source_language = EXCLUDED.source_language,
    spelling_variants = EXCLUDED.spelling_variants,
    updated_at = NOW();

COMMIT;
