-- Migration 042: Search Gap Triage and Query Demand Expansion
--
-- 1. Updates `hauna` to explicitly include 'spoiled', 'stinky', 'rotten' in English array.
-- 2. Ingests new headwords:
--    - `uso`: Samoan-derived brother/bro/friend, widely used in Hawaii slang. Variants: `fa uso`, `fa'a uso`.
--    - `spoil`: local pidgin description for entitled/fussy behavior ('spoil brat'). Variants: `spoil brat`, `spoilt`, `spoile`.
-- 3. Enriches variants on existing high-demand search entries:
--    - `shaka`: 'hand gesture with thumb and pinky out', 'shaka sign', 'shaka hand'
--    - `a hui hou`: 'aloha a hui hou', 'a hui hou kakou'
--    - `howzit`: 'howzit response', 'howzit braddah'
-- 4. Triages pending `search_gaps` rows ('spoiled', 'spoile').

BEGIN;

-- 1. Enrich `hauna` English meanings
UPDATE dictionary_entries
SET english = ARRAY['smelly', 'spoiled', 'rotten', 'foul-smelling'],
    updated_at = NOW()
WHERE id = 'hauna_604';

-- 2. Ingest `uso`
INSERT INTO dictionary_entries (
    id,
    pidgin,
    english,
    category,
    pronunciation,
    examples,
    usage,
    origin,
    difficulty,
    frequency,
    tags,
    source_language,
    spelling_variants,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'uso',
    ARRAY['brother', 'bro', 'brotherhood', 'friend'],
    'slang',
    'OO-soh',
    ARRAY[
        'Cheee, what''s up uso!',
        'Dat guy my uso from way back, we grew up together.'
    ],
    'A Samoan term widely embraced across Hawaii meaning brother or close friend, used similarly to brah or bro.',
    'Samoan uso (sibling of the same gender). Commonly used in local Hawaii culture.',
    'beginner',
    'high',
    ARRAY['slang', 'polynesian', 'brotherhood', 'greetings', 'local'],
    'pidgin',
    ARRAY['fa uso', 'fa''a uso'],
    NOW(),
    NOW()
) ON CONFLICT (pidgin) DO UPDATE SET
    english = EXCLUDED.english,
    spelling_variants = EXCLUDED.spelling_variants,
    usage = EXCLUDED.usage,
    updated_at = NOW();

-- 3. Ingest `spoil`
INSERT INTO dictionary_entries (
    id,
    pidgin,
    english,
    category,
    pronunciation,
    examples,
    usage,
    origin,
    difficulty,
    frequency,
    tags,
    source_language,
    spelling_variants,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'spoil',
    ARRAY['spoiled', 'acting entitled', 'fussy', 'bratty'],
    'descriptions',
    'SPOIL',
    ARRAY[
        'No be so spoil, eat what stay on your plate.',
        'Dat kid stay one spoil brat when he no get his way.'
    ],
    'Used to describe someone who acts entitled, fussy, or demanding like a spoiled child. Commonly heard as "spoil brat".',
    'English spoiled, adapted with characteristic Pidgin consonant cluster reduction.',
    'beginner',
    'medium',
    ARRAY['slang', 'descriptions', 'behavior', 'family'],
    'pidgin',
    ARRAY['spoil brat', 'spoilt', 'spoile'],
    NOW(),
    NOW()
) ON CONFLICT (pidgin) DO UPDATE SET
    english = EXCLUDED.english,
    spelling_variants = EXCLUDED.spelling_variants,
    usage = EXCLUDED.usage,
    updated_at = NOW();

-- 4. Enrich existing entries with Search Console query variants
UPDATE dictionary_entries
SET spelling_variants = ARRAY(
    SELECT DISTINCT unnest(array_cat(
        COALESCE(spelling_variants, ARRAY[]::text[]),
        ARRAY['hand gesture with thumb and pinky out', 'shaka sign', 'shaka hand']
    ))
),
updated_at = NOW()
WHERE id = 'shaka_1029';

UPDATE dictionary_entries
SET spelling_variants = ARRAY(
    SELECT DISTINCT unnest(array_cat(
        COALESCE(spelling_variants, ARRAY[]::text[]),
        ARRAY['aloha a hui hou', 'a hui hou kakou']
    ))
),
updated_at = NOW()
WHERE id = 'a_hui_hou_600';

UPDATE dictionary_entries
SET spelling_variants = ARRAY(
    SELECT DISTINCT unnest(array_cat(
        COALESCE(spelling_variants, ARRAY[]::text[]),
        ARRAY['howzit response', 'howzit braddah']
    ))
),
updated_at = NOW()
WHERE id = 'howzit_072';

-- 5. Triage search_gaps rows
UPDATE search_gaps
SET status = 'added',
    notes = 'Addressed in Migration 042 (hauna spoiled / spoil / uso / shaka)',
    updated_at = NOW()
WHERE term IN ('spoiled', 'spoile', 'fa uso', 'aloha a hui hou')
  AND status = 'pending';

COMMIT;
