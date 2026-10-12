-- Migration 043: Ingest Local Slang "Garut", Expand Mahalo Variants & Triage Search Gaps
--
-- 1. Ingests new headword `garut`:
--    - Classic plantation-era Filipino (Ilocano) loanword widely used in Hawaii Pidgin.
--    - Meaning: flirty, coquettish, boy-crazy/girl-crazy, playful teasing.
--    - Variants: `garot`, `gaddut`.
-- 2. Enriches variants on existing high-demand search entries:
--    - `mahalo nui loa`: 'mahalo nunui', 'mahalo nui'
--    - `aole pilikia`: 'mahalo response'
-- 3. Triages pending `search_gaps` rows:
--    - Marks out-of-scope non-island dialect queries ('kiri', 'kuruchung') as 'ignored'.
--    - Marks answered queries as 'added'.

BEGIN;

-- 1. Ingest `garut`
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
    'garut',
    ARRAY['flirty', 'boy-crazy', 'girl-crazy', 'teasing', 'coquettish'],
    'slang',
    'gah-ROOT',
    ARRAY[
        'Eh, no be so garut! You just met da guy five minutes ago.',
        'She stay acting all garut in front of da boys.'
    ],
    'Used in local Pidgin to tease someone who is being overly flirty, boy-crazy, or acting coquettish. Often said as gentle teasing among friends and family.',
    'Ilocano garut (flirtatious, promiscuous, or playful). Brought to Hawaii plantations by Filipino laborers and widely adopted into local Pidgin.',
    'intermediate',
    'medium',
    ARRAY['slang', 'filipino', 'ilocano', 'personality', 'humor', 'local'],
    'pidgin',
    ARRAY['garot', 'gaddut'],
    NOW(),
    NOW()
) ON CONFLICT (pidgin) DO UPDATE SET
    english = EXCLUDED.english,
    spelling_variants = EXCLUDED.spelling_variants,
    usage = EXCLUDED.usage,
    origin = EXCLUDED.origin,
    examples = EXCLUDED.examples,
    pronunciation = EXCLUDED.pronunciation,
    updated_at = NOW();

-- 2. Enrich variants on `mahalo nui loa`
UPDATE dictionary_entries
SET spelling_variants = ARRAY(
    SELECT DISTINCT unnest(array_cat(
        COALESCE(spelling_variants, ARRAY[]::text[]),
        ARRAY['mahalo nunui']
    ))
),
updated_at = NOW()
WHERE id = '97452e75-c017-44db-95f8-22a3d852e9c7';

-- 3. Enrich variants on `aole pilikia`
UPDATE dictionary_entries
SET spelling_variants = ARRAY(
    SELECT DISTINCT unnest(array_cat(
        COALESCE(spelling_variants, ARRAY[]::text[]),
        ARRAY['mahalo response']
    ))
),
updated_at = NOW()
WHERE id = '6792256e-1d9b-4c5b-b890-dd47534eb363';

-- 4. Triage search_gaps rows
UPDATE search_gaps
SET status = 'ignored'
WHERE term IN ('kiri', 'kuruchung')
  AND status = 'pending';

UPDATE search_gaps
SET status = 'added'
WHERE term IN ('garut', 'garot', 'mahalo nunui', 'mahalo response')
  AND status = 'pending';

COMMIT;
