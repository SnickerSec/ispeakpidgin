-- Migration 048: Clean Polluted April–June 2026 Headwords, Merge Shadowed Near-Duplicates & Expand High-Demand Vocabulary
--
-- Part 1 — Archive and merge/remove 30 polluted, query-fragment, meta-gloss, near-duplicate,
-- and reversed English->Pidgin rows from the April–June 2026 ingestion batches:
--   - Near-duplicates & redirect-shadowed duplicates:
--     * mempachi eyes (34157172-6850-4c40-984c-64b82b148ade) -> menpachi eyes (69dafe9c-74d7-476e-80bf-55577872dbad)
--     * you da best (bc10441d-346b-4c8b-9ce2-874aae46602f) -> you da man (5011551c-1c23-4207-acbf-a9da3423925f)
--     * slang for the best you da (145bf8ef-e9a8-4ee8-a8f0-3ae236be66b7) -> you da man
--   - Meta-gloss & misspelling headwords merged into canonical entries:
--     * pow (5fb70bc8-fa3e-40b3-a0c9-21533150469b) -> pau (0e632528-c302-4183-b404-369418a9da02)
--     * ole way (a4b9978b-d555-4c27-8e9e-17e3bc3a8105) -> auē (au_299)
--     * hawaiin (6c4ca505-2614-47ff-949b-6f946690f959) -> hawaiian (7f9ca3ec-298d-4030-b19e-398a0f090be1)
--   - Raw search queries & modifier duplicates merged into canonical entries:
--     * faka in english (20df70c5-77b3-40f4-a10d-607aeb0f1d5e) -> faka (faka_331)
--     * meaning of goin (55851ecd-d783-425f-bf9f-7380de09c639) & goin or going (124c0176-ad2d-479f-85c1-ace6561b6990) -> goin (goin_240)
--     * how to respond to howzit (8783a7b1-1bd5-4c9f-84c3-7bf1c8251fb6) -> howzit (howzit_072)
--     * does scrap (8b4d3f26-c52b-4a77-960d-742a058425c1) & scrap fight (ee7b44d4-4e55-409a-be96-77da58700189) -> scrap (scrap_156)
--     * for no worries (2d8df46f-8d87-4a6c-9fd2-889c691dc114) -> no worries (no_worries_529)
--     * yobo korean (fbed5fc4-e6cb-42da-acc5-29fc57bf74a2) & korean yobo (da539edb-ad69-4ed6-b5d9-d03c8f3a20e6) -> yobo (yobo_275)
--     * sarap filipino (f2d6f9bc-af78-4e6c-a7cf-80d9bdee7617) & ang sarap (5213452e-faeb-47ce-9ed9-9d50a883a501) -> sarap (sarap_999)
--     * cuz cousin (d711e882-72ce-4d48-92ca-89cd96777c61), cousin cuz (f56a3322-ec00-486f-acec-939b978a390a),
--       my cuz (ec036b38-874b-40d7-ac7b-5b29ccfa4f15), cousin (3a9e7dc8-f0f6-42ac-9d37-1ddb333413c8) -> cuz (cuz_039)
--     * nene goose (3a015856-cef4-48d8-b3a9-4ca85917b61c) -> nene (6638792a-8835-4453-ba79-8938696fcc99)
--     * kōkua kōkua (47dbb7e9-71fc-4ac7-84f7-73d7e569839d) & help (6e86640d-555b-4b35-a421-b88fe870acdd) -> kokua (kokua_096)
--   - Reversed English->Pidgin rows removed (with 301 redirects to canonical Pidgin pages):
--     * done (02a948d4-babb-4edf-9695-a5c3bc07fbcd) -> pau
--     * all done (ea365ff3-ab65-481f-80ae-081384e5ce90) -> all pau
--     * everyone (213daf9d-d513-42ad-af2d-593a72732a37) -> errbody
--     * teacher (5bf32610-9b58-4611-8f9a-6b2191f60af7) -> kumu
--     * ocean (9583b55a-ad1d-4a14-8210-983c46ff1325) & sea (d0b9b3aa-92cb-4623-859d-0e9f2fc9a8e3) -> kai
--     * fat (bf76938e-03da-41ba-b453-5786e6b925b8) -> momona
--     * dead (cef19c4e-ead4-49cf-9209-802b99859b66) -> make
--     * let's go (d829a6c5-2db6-4195-9450-fc71b4bc1b6d) -> we go
--     * the (0708d97a-9596-4e41-b60e-c4738be1ed11) -> da
--
-- Part 2 — Clean in-place English/variant inversions & enrich high-demand entries:
--   - nosey, scared, hawaiian pick up lines, mahalo
--   - shaka, erking me, aurite, moopuna, paniolo, if can can if no can no can, bulai, no need,
--     pau hana, heavy, bumbai you learn, moke
--
-- Part 3 — Ingest 6 high-demand vocabulary entries from Search Console & user search_gaps:
--   - ānuenue (rainbow), hāʻae (drool / sleep drool), uʻi (beautiful / handsome / pretty girl),
--     hayn (right? / isn't it?), gaiz (guys / you guys), bangungot (night terror / sleep paralysis)

BEGIN;

-- 1. Archive removed rows to dictionary_entries_merged (if not already present)
INSERT INTO public.dictionary_entries_merged (
    id, pidgin, english, category, pronunciation, examples, usage, origin,
    difficulty, frequency, tags, audio_example, created_at, updated_at,
    fts, source_language, spelling_variants, merge_role, merged_at
)
SELECT
    de.id, de.pidgin, de.english, de.category, de.pronunciation, de.examples, de.usage, de.origin,
    de.difficulty, de.frequency, de.tags, de.audio_example, de.created_at, de.updated_at,
    de.fts, de.source_language, de.spelling_variants, 'removed', NOW()
FROM public.dictionary_entries de
WHERE de.id IN (
    '34157172-6850-4c40-984c-64b82b148ade', -- mempachi eyes
    'bc10441d-346b-4c8b-9ce2-874aae46602f', -- you da best
    '145bf8ef-e9a8-4ee8-a8f0-3ae236be66b7', -- slang for the best you da
    '5fb70bc8-fa3e-40b3-a0c9-21533150469b', -- pow
    'a4b9978b-d555-4c27-8e9e-17e3bc3a8105', -- ole way
    '6c4ca505-2614-47ff-949b-6f946690f959', -- hawaiin
    '20df70c5-77b3-40f4-a10d-607aeb0f1d5e', -- faka in english
    '55851ecd-d783-425f-bf9f-7380de09c639', -- meaning of goin
    '124c0176-ad2d-479f-85c1-ace6561b6990', -- goin or going
    '8783a7b1-1bd5-4c9f-84c3-7bf1c8251fb6', -- how to respond to howzit
    '8b4d3f26-c52b-4a77-960d-742a058425c1', -- does scrap
    'ee7b44d4-4e55-409a-be96-77da58700189', -- scrap fight
    '2d8df46f-8d87-4a6c-9fd2-889c691dc114', -- for no worries
    'fbed5fc4-e6cb-42da-acc5-29fc57bf74a2', -- yobo korean
    'da539edb-ad69-4ed6-b5d9-d03c8f3a20e6', -- korean yobo
    'f2d6f9bc-af78-4e6c-a7cf-80d9bdee7617', -- sarap filipino
    '5213452e-faeb-47ce-9ed9-9d50a883a501', -- ang sarap
    'd711e882-72ce-4d48-92ca-89cd96777c61', -- cuz cousin
    'f56a3322-ec00-486f-acec-939b978a390a', -- cousin cuz
    'ec036b38-874b-40d7-ac7b-5b29ccfa4f15', -- my cuz
    '3a9e7dc8-f0f6-42ac-9d37-1ddb333413c8', -- cousin
    '3a015856-cef4-48d8-b3a9-4ca85917b61c', -- nene goose
    '47dbb7e9-71fc-4ac7-84f7-73d7e569839d', -- kōkua kōkua
    '6e86640d-555b-4b35-a421-b88fe870acdd', -- help
    '02a948d4-babb-4edf-9695-a5c3bc07fbcd', -- done
    'ea365ff3-ab65-481f-80ae-081384e5ce90', -- all done
    '213daf9d-d513-42ad-af2d-593a72732a37', -- everyone
    '5bf32610-9b58-4611-8f9a-6b2191f60af7', -- teacher
    '9583b55a-ad1d-4a14-8210-983c46ff1325', -- ocean
    'd0b9b3aa-92cb-4623-859d-0e9f2fc9a8e3', -- sea
    'bf76938e-03da-41ba-b453-5786e6b925b8', -- fat
    'cef19c4e-ead4-49cf-9209-802b99859b66', -- dead
    'd829a6c5-2db6-4195-9450-fc71b4bc1b6d', -- let's go
    '0708d97a-9596-4e41-b60e-c4738be1ed11'  -- the
)
ON CONFLICT DO NOTHING;

-- 2. Merge useful variants & glosses into canonical entries

-- menpachi eyes <- mempachi eyes
UPDATE public.dictionary_entries SET
    english = ARRAY['big bulging eyes', 'wide-eyed with surprise', 'wide-eyed', 'startled look', 'bulging eyes']::text[],
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['tako eye', 'mempachi eyes']))),
    updated_at = NOW()
WHERE id = '69dafe9c-74d7-476e-80bf-55577872dbad' AND pidgin = 'menpachi eyes';

-- you da man <- you da best, slang for the best you da
UPDATE public.dictionary_entries SET
    english = ARRAY['you are the best', 'great job', 'you are amazing', 'the greatest']::text[],
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['you the man', 'you are the man', 'you da best']))),
    updated_at = NOW()
WHERE id = '5011551c-1c23-4207-acbf-a9da3423925f' AND pidgin = 'you da man';

-- pau <- pow
UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['pow']))),
    updated_at = NOW()
WHERE id = '0e632528-c302-4183-b404-369418a9da02' AND pidgin = 'pau';

-- auē <- ole way
UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['auwe', 'ole way']))),
    updated_at = NOW()
WHERE id = 'au_299' AND pidgin = 'auē';

-- hawaiian <- hawaiin
UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['hawaiin']))),
    updated_at = NOW()
WHERE id = '7f9ca3ec-298d-4030-b19e-398a0f090be1' AND pidgin = 'hawaiian';

-- scrap <- does scrap, scrap fight
UPDATE public.dictionary_entries SET
    english = ARRAY['fight', 'to fight', 'brawl', 'fistfight', 'physical fight']::text[],
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['scrap fight']))),
    updated_at = NOW()
WHERE id = 'scrap_156' AND pidgin = 'scrap';

-- yobo <- yobo korean, korean yobo
UPDATE public.dictionary_entries SET
    english = ARRAY['Korean person', 'honey', 'darling', 'spouse']::text[],
    updated_at = NOW()
WHERE id = 'yobo_275' AND pidgin = 'yobo';

-- sarap <- ang sarap, sarap filipino
UPDATE public.dictionary_entries SET
    english = ARRAY['delicious', 'tasty', 'good food', 'very tasty', 'so good']::text[],
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['grabe ang sarap', 'ang sarap']))),
    updated_at = NOW()
WHERE id = 'sarap_999' AND pidgin = 'sarap';

-- cuz <- cuz cousin, cousin cuz, my cuz, cousin
UPDATE public.dictionary_entries SET
    english = ARRAY['cousin', 'friend', 'bro', 'close friend']::text[],
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['kuz', 'cuz for cousin', 'my cuz']))),
    updated_at = NOW()
WHERE id = 'cuz_039' AND pidgin = 'cuz';

-- nene <- nene goose
UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['nene goose']))),
    updated_at = NOW()
WHERE id = '6638792a-8835-4453-ba79-8938696fcc99' AND pidgin = 'nene';

-- kokua <- kōkua kōkua, help
UPDATE public.dictionary_entries SET
    english = ARRAY['help', 'assistance', 'cooperation', 'support']::text[],
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['kōkua', 'kōkua kōkua']))),
    updated_at = NOW()
WHERE id = 'kokua_096' AND pidgin = 'kokua';

-- 3. Delete embeddings and dictionary_entries rows for the 30 merged/removed headwords
DELETE FROM public.dictionary_embeddings WHERE entry_id IN (
    '34157172-6850-4c40-984c-64b82b148ade',
    'bc10441d-346b-4c8b-9ce2-874aae46602f',
    '145bf8ef-e9a8-4ee8-a8f0-3ae236be66b7',
    '5fb70bc8-fa3e-40b3-a0c9-21533150469b',
    'a4b9978b-d555-4c27-8e9e-17e3bc3a8105',
    '6c4ca505-2614-47ff-949b-6f946690f959',
    '20df70c5-77b3-40f4-a10d-607aeb0f1d5e',
    '55851ecd-d783-425f-bf9f-7380de09c639',
    '124c0176-ad2d-479f-85c1-ace6561b6990',
    '8783a7b1-1bd5-4c9f-84c3-7bf1c8251fb6',
    '8b4d3f26-c52b-4a77-960d-742a058425c1',
    'ee7b44d4-4e55-409a-be96-77da58700189',
    '2d8df46f-8d87-4a6c-9fd2-889c691dc114',
    'fbed5fc4-e6cb-42da-acc5-29fc57bf74a2',
    'da539edb-ad69-4ed6-b5d9-d03c8f3a20e6',
    'f2d6f9bc-af78-4e6c-a7cf-80d9bdee7617',
    '5213452e-faeb-47ce-9ed9-9d50a883a501',
    'd711e882-72ce-4d48-92ca-89cd96777c61',
    'f56a3322-ec00-486f-acec-939b978a390a',
    'ec036b38-874b-40d7-ac7b-5b29ccfa4f15',
    '3a9e7dc8-f0f6-42ac-9d37-1ddb333413c8',
    '3a015856-cef4-48d8-b3a9-4ca85917b61c',
    '47dbb7e9-71fc-4ac7-84f7-73d7e569839d',
    '6e86640d-555b-4b35-a421-b88fe870acdd',
    '02a948d4-babb-4edf-9695-a5c3bc07fbcd',
    'ea365ff3-ab65-481f-80ae-081384e5ce90',
    '213daf9d-d513-42ad-af2d-593a72732a37',
    '5bf32610-9b58-4611-8f9a-6b2191f60af7',
    '9583b55a-ad1d-4a14-8210-983c46ff1325',
    'd0b9b3aa-92cb-4623-859d-0e9f2fc9a8e3',
    'bf76938e-03da-41ba-b453-5786e6b925b8',
    'cef19c4e-ead4-49cf-9209-802b99859b66',
    'd829a6c5-2db6-4195-9450-fc71b4bc1b6d',
    '0708d97a-9596-4e41-b60e-c4738be1ed11'
);

DELETE FROM public.dictionary_entries WHERE id IN (
    '34157172-6850-4c40-984c-64b82b148ade',
    'bc10441d-346b-4c8b-9ce2-874aae46602f',
    '145bf8ef-e9a8-4ee8-a8f0-3ae236be66b7',
    '5fb70bc8-fa3e-40b3-a0c9-21533150469b',
    'a4b9978b-d555-4c27-8e9e-17e3bc3a8105',
    '6c4ca505-2614-47ff-949b-6f946690f959',
    '20df70c5-77b3-40f4-a10d-607aeb0f1d5e',
    '55851ecd-d783-425f-bf9f-7380de09c639',
    '124c0176-ad2d-479f-85c1-ace6561b6990',
    '8783a7b1-1bd5-4c9f-84c3-7bf1c8251fb6',
    '8b4d3f26-c52b-4a77-960d-742a058425c1',
    'ee7b44d4-4e55-409a-be96-77da58700189',
    '2d8df46f-8d87-4a6c-9fd2-889c691dc114',
    'fbed5fc4-e6cb-42da-acc5-29fc57bf74a2',
    'da539edb-ad69-4ed6-b5d9-d03c8f3a20e6',
    'f2d6f9bc-af78-4e6c-a7cf-80d9bdee7617',
    '5213452e-faeb-47ce-9ed9-9d50a883a501',
    'd711e882-72ce-4d48-92ca-89cd96777c61',
    'f56a3322-ec00-486f-acec-939b978a390a',
    'ec036b38-874b-40d7-ac7b-5b29ccfa4f15',
    '3a9e7dc8-f0f6-42ac-9d37-1ddb333413c8',
    '3a015856-cef4-48d8-b3a9-4ca85917b61c',
    '47dbb7e9-71fc-4ac7-84f7-73d7e569839d',
    '6e86640d-555b-4b35-a421-b88fe870acdd',
    '02a948d4-babb-4edf-9695-a5c3bc07fbcd',
    'ea365ff3-ab65-481f-80ae-081384e5ce90',
    '213daf9d-d513-42ad-af2d-593a72732a37',
    '5bf32610-9b58-4611-8f9a-6b2191f60af7',
    '9583b55a-ad1d-4a14-8210-983c46ff1325',
    'd0b9b3aa-92cb-4623-859d-0e9f2fc9a8e3',
    'bf76938e-03da-41ba-b453-5786e6b925b8',
    'cef19c4e-ead4-49cf-9209-802b99859b66',
    'd829a6c5-2db6-4195-9450-fc71b4bc1b6d',
    '0708d97a-9596-4e41-b60e-c4738be1ed11'
);

-- 4. Clean in-place English/variant inversions & meta-glosses
UPDATE public.dictionary_entries SET
    english = ARRAY['prying', 'meddling', 'curious']::text[],
    updated_at = NOW()
WHERE id = '1f6f0c72-f75c-4007-ba25-04414f2dd39d' AND pidgin = 'nosey';

UPDATE public.dictionary_entries SET
    english = ARRAY['afraid', 'frightened', 'startled']::text[],
    spelling_variants = ARRAY['sked']::text[],
    updated_at = NOW()
WHERE id = '0ae6d107-40d6-4199-9b38-b7ed0fe1ed49' AND pidgin = 'scared';

UPDATE public.dictionary_entries SET
    english = ARRAY['flirty local phrases', 'romantic opening lines', 'flirting phrases', 'romantic conversation starters']::text[],
    updated_at = NOW()
WHERE id = '7a970145-6136-4c28-bf05-6ea516aaf88a' AND pidgin = 'hawaiian pick up lines';

UPDATE public.dictionary_entries SET
    english = ARRAY['thank you', 'grateful', 'appreciate', 'admire', 'esteem']::text[],
    spelling_variants = ARRAY['mahola', 'mahalos']::text[],
    updated_at = NOW()
WHERE id = 'mahalo_109' AND pidgin = 'mahalo';

-- 5. Enrich existing entries for Search Console & search_gaps coverage
UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['hang ten', 'hang 10', 'hang loose hand signal', 'hang loose symbol', 'hang ten symbol', 'hang ten gesture']))),
    updated_at = NOW()
WHERE id = 'shaka_1029' AND pidgin = 'shaka';

UPDATE public.dictionary_entries SET
    english = ARRAY['irritating me', 'annoying me', 'bothering me', 'irks me']::text[],
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['erks me', 'irk', 'erk']))),
    updated_at = NOW()
WHERE id = '9c1f96eb-2a51-459c-bf21-344b4cd2c7f5' AND pidgin = 'erking me';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['ight', 'aight', 'ight brah']))),
    updated_at = NOW()
WHERE id = 'aurite_015' AND pidgin = 'aurite';

UPDATE public.dictionary_entries SET
    english = ARRAY['grandchild', 'grandchildren', 'descendant']::text[],
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['moʻopuna']))),
    updated_at = NOW()
WHERE id = 'moopuna_630' AND pidgin = 'moopuna';

UPDATE public.dictionary_entries SET
    english = ARRAY['Hawaiian cowboy', 'cowboy', 'rancher']::text[],
    updated_at = NOW()
WHERE id = 'paniolo_142' AND pidgin = 'paniolo';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['if can can if no can still can']))),
    updated_at = NOW()
WHERE id = 'if_can_can_if_no_can_077' AND pidgin = 'if can can if no can no can';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['bulaia', 'bulais', 'bu lai', 'bu lai en']))),
    updated_at = NOW()
WHERE id = 'bulai_026' AND pidgin = 'bulai';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['it''s no need', 'its no need']))),
    updated_at = NOW()
WHERE id = 'no_need_131' AND pidgin = 'no need';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['powhana', 'pow hana', 'pau hana time']))),
    updated_at = NOW()
WHERE id = 'pau_hana_144' AND pidgin = 'pau hana';

UPDATE public.dictionary_entries SET
    english = ARRAY['cool', 'impressive', 'intense', 'hardcore', 'formidable']::text[],
    updated_at = NOW()
WHERE id = 'b393ea5c-7c3e-42a3-9f12-33327687057a' AND pidgin = 'heavy';

UPDATE public.dictionary_entries SET
    english = ARRAY['you''ll learn eventually', 'you''ll see what happens', 'I told you so', 'you reap what you sow', 'you get what you deserve', 'you get what you get', 'karma']::text[],
    updated_at = NOW()
WHERE id = '8537bc6e-a66f-4a15-85f0-356f4ab08cc7' AND pidgin = 'bumbai you learn';

UPDATE public.dictionary_entries SET
    english = ARRAY['tough local guy', 'bully', 'tough guy']::text[],
    updated_at = NOW()
WHERE id = 'moke_123' AND pidgin = 'moke';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['holeo']))),
    updated_at = NOW()
WHERE id = 'haole_064' AND pidgin = 'haole';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['punnami', 'nice punani']))),
    updated_at = NOW()
WHERE id = 'punani_383' AND pidgin = 'punani';

-- 6. Ingest 7 high-demand vocabulary terms
INSERT INTO public.dictionary_entries (
    id, pidgin, english, category, pronunciation, examples, usage, origin,
    difficulty, frequency, tags, source_language, spelling_variants, created_at, updated_at
) VALUES
(
    'catch_cracks_048',
    'catch cracks',
    ARRAY['get beat up', 'get punched', 'take a beating', 'get hit']::text[],
    'slang',
    'KACH KRAKS',
    ARRAY[
        'Eh, no talk stink or you going catch cracks!',
        'You like catch cracks, o wat?'
    ]::text[],
    'Classic Hawaiian Pidgin expression meaning to get beat up, punched, or receive a physical thrashing. Often heard as a warning ("You like catch cracks?").',
    'Local Hawaii Pidgin (from "cracks" meaning blows or punches).',
    'beginner',
    'high',
    ARRAY['slang', 'actions', 'fighting', 'expressions']::text[],
    'pidgin',
    ARRAY['like catch cracks']::text[],
    NOW(),
    NOW()
),
(
    'anuenue_048',
    'ānuenue',
    ARRAY['rainbow']::text[],
    'nature',
    'ah-noo-eh-NOO-eh',
    ARRAY[
        'Look da big ānuenue ova Mānoa Valley!',
        'Afta da rain pass, one bright ānuenue wen'' come out.'
    ]::text[],
    'The Hawaiian word for rainbow, used throughout Hawaii in everyday speech, place names, and school names.',
    'Hawaiian ānuenue (rainbow).',
    'beginner',
    'high',
    ARRAY['nature', 'weather', 'hawaiian']::text[],
    'hawaiian',
    ARRAY['anuenue']::text[],
    NOW(),
    NOW()
),
(
    'haae_048',
    'hāʻae',
    ARRAY['drool', 'saliva', 'spittle', 'sleep drool', 'slobber']::text[],
    'descriptions',
    'hah-EYE',
    ARRAY[
        'Ho, dat nap was so good I wake up wit hāʻae on da pillow!',
        'Da baby stay teething, get plenny hāʻae.'
    ]::text[],
    'Used locally for drool or saliva, especially when someone falls into a deep sleep ("sleep drool") or when mouth-watering grinds are on the table.',
    'Hawaiian hāʻae (saliva, spittle, to drool).',
    'intermediate',
    'medium',
    ARRAY['body', 'sleep', 'descriptions']::text[],
    'hawaiian',
    ARRAY['haae', 'ha''ae']::text[],
    NOW(),
    NOW()
),
(
    'ui_048',
    'uʻi',
    ARRAY['beautiful', 'handsome', 'pretty', 'pretty girl', 'good-looking', 'attractive']::text[],
    'descriptions',
    'OO-ee',
    ARRAY[
        'Ho, dat wahine stay real uʻi!',
        'Look how uʻi you look all dress up fo'' da lūʻau.'
    ]::text[],
    'Used across Hawaii to compliment someone as beautiful, pretty, or handsome (often heard as "wahine uʻi" for a pretty girl).',
    'Hawaiian uʻi (youthful, handsome, pretty, beautiful).',
    'beginner',
    'high',
    ARRAY['compliments', 'descriptions', 'romance']::text[],
    'hawaiian',
    ARRAY['ui', 'wahine ui', 'wahine uʻi']::text[],
    NOW(),
    NOW()
),
(
    'hayn_048',
    'hayn',
    ARRAY['right?', 'isn''t it?', 'you know?', 'yeah?', 'ain''t']::text[],
    'slang',
    'HAYN',
    ARRAY[
        'Da waves was firing today, hayn?',
        'Good grinds at dat spot, hayn brah?'
    ]::text[],
    'Casual local tag question or affirmation at the end of a statement, similar to "yeah?", "no?", or "isn''t it?".',
    'Local Hawaii phonetic slang (related to "ain''t" / "eh").',
    'intermediate',
    'medium',
    ARRAY['slang', 'expressions', 'conversation']::text[],
    'pidgin',
    ARRAY['hain']::text[],
    NOW(),
    NOW()
),
(
    'gaiz_048',
    'gaiz',
    ARRAY['guys', 'folks', 'everyone', 'you guys']::text[],
    'people',
    'GYZE',
    ARRAY[
        'Eh, wat you gaiz doing afta work?',
        'Thanks fo'' coming out tonight, gaiz!'
    ]::text[],
    'Phonetic Pidgin spelling of "guys", commonly used in local texts and social media when addressing a group ("you gaiz", "da gaiz").',
    'English guys, spelled phonetically in local Pidgin.',
    'beginner',
    'high',
    ARRAY['people', 'slang', 'greetings']::text[],
    'pidgin',
    ARRAY['you gaiz']::text[],
    NOW(),
    NOW()
),
(
    'bangungot_048',
    'bangungot',
    ARRAY['nightmare', 'sleep paralysis', 'night terror', 'sleep breath']::text[],
    'cultural',
    'bahng-oo-NGOHT',
    ARRAY[
        'No go sleep right afta you eat plenny, bumbai you catch bangungot!',
        'My tutu always warn us bout bangungot if you sleep on one full stomach.'
    ]::text[],
    'Filipino-Hawaiian folklore belief and term for a severe nightmare or sleep paralysis (often warned against when going to bed immediately after eating a heavy meal, where one groans or struggles to breathe in their sleep).',
    'Tagalog/Ilocano bangungot (nightmare / nocturnal pressing spirit), widely known in Hawaii plantation and local family lore.',
    'advanced',
    'medium',
    ARRAY['cultural', 'folklore', 'filipino', 'sleep']::text[],
    'pidgin',
    ARRAY['bangogot']::text[],
    NOW(),
    NOW()
)
ON CONFLICT (pidgin) DO UPDATE SET
    english = EXCLUDED.english,
    spelling_variants = EXCLUDED.spelling_variants,
    pronunciation = EXCLUDED.pronunciation,
    examples = EXCLUDED.examples,
    usage = EXCLUDED.usage,
    updated_at = NOW();

COMMIT;
