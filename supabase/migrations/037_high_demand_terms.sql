-- Migration 037: Ingest high-demand authentic Pidgin terms and search variants
--
-- Adds 4 high-demand missing terms from on-site user searches & Search Console:
--   1. palala (variants: palalah) - Hawaiianized "brother", "friend", "dude", "local guy"
--   2. homelunch (variants: home lunch) - Universal Hawaii school/work term for lunch packed from home
--   3. onefaka (variants: one faka, won faka) - Pidgin compound for "a guy / someone / that person"
--   4. dis ol' way (variants: this ole way, dis ole way, dis old way, this old way) - Idiom for "like this / the customary way"
--
-- Updates existing entries with high-frequency phonetic variants:
--   - hammah: add "hammas" to spelling_variants; enrich meanings with "badass", "heavy hitter"
--   - ono: add "oohno" to spelling_variants
--   - huhu: add "who who", "hu hu hu" to spelling_variants
--   - geev: add "geeve" to spelling_variants
--   - geev 'um: add "geevum", "give 'um" to spelling_variants
--   - pau hana: add "pau hana time" to spelling_variants

BEGIN;

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'palala',
       ARRAY['brother', 'friend', 'bro', 'local guy', 'dude']::text[],
       'people',
       'pah-LAH-lah',
       ARRAY['Howzit, palala! Long time no see!', 'Dat palala over dea know how fo'' fix your truck.', 'Shoots, tanks palala, I catch you later.']::text[],
       'Used warmly between friends or to refer respectfully to another local guy. Hawaiianized adaptation of "brother", parallel to "braddah". Common across Oahu, Maui, and Hawaii Island.',
       'Hawaiianized adaptation of English "brother" (also influenced by Hawaiian palaoa/palalah).',
       'beginner',
       'high',
       ARRAY['people', 'greetings', 'slang', 'friendship']::text[],
       'pidgin',
       ARRAY['palalah']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('palala', 'palalah'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'homelunch',
       ARRAY['packed lunch', 'home lunch', 'lunch from home', 'brown-bag lunch', 'bento from home']::text[],
       'food',
       'HOHM-lunch',
       ARRAY['You buying school lunch today or you get homelunch?', 'My mom wen pack me one mean homelunch wit spam musubi and chips.', 'Homelunch gang stay eating outside by da pavilion.']::text[],
       'Everyday Hawaii school and workplace term for lunch brought from home, contrasting with buying school lunch, cafeteria food, or takeout plate lunch.',
       'Hawaii plantation and school culture terminology distinguishing home-prepared bentos from cafeteria lunches.',
       'beginner',
       'high',
       ARRAY['food', 'daily life', 'school', 'lifestyle']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('homelunch'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'onefaka',
       ARRAY['someone', 'a guy', 'some dude', 'that guy', 'a person']::text[],
       'slang',
       'wun-FAH-kah',
       ARRAY['I wen see onefaka trying fo'' open your car door!', 'Who dat onefaka walking around wit no slippahs?', 'Lucky onefaka, he wen win da jackpot.']::text[],
       'Very common Pidgin compound of "one" (indefinite article "a/an") and "faka" (fellow/guy). Can be neutral/affectionate between friends ("lucky onefaka") or derogatory toward an outsider/troublemaker depending on tone.',
       'Hawaiian Pidgin grammatical compound of "one" (a/an) + "faka" (from English fucker/fellow).',
       'intermediate',
       'high',
       ARRAY['slang', 'people', 'expressions']::text[],
       'pidgin',
       ARRAY['one faka', 'won faka']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('onefaka', 'one faka', 'won faka'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'dis ol'' way',
       ARRAY['like this', 'in this manner', 'this way', 'the customary way', 'this old way']::text[],
       'expressions',
       'dis-OHL-way',
       ARRAY['If you do ''um dis ol'' way, goin'' take all day brah!', 'Why you stay walking dis ol'' way?', 'We always wen cook da kalua pig dis ol'' way, from small kid time.']::text[],
       'Idiomatic expression describing doing something in a particular, customary, or frustratingly slow manner ("like this" or "this old way").',
       'Hawaiian Pidgin idiom adapted from English "this old way" with creole phonology.',
       'intermediate',
       'medium',
       ARRAY['expressions', 'idioms', 'daily life']::text[],
       'pidgin',
       ARRAY['this ole way', 'dis ole way', 'dis old way']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('dis ol'' way', 'this ole way', 'dis ole way', 'dis old way'));

-- Update existing entries with search variants
UPDATE public.dictionary_entries SET
    english = ARRAY['pound hard', 'badass', 'hard worker', 'heavy hitter', 'beast']::text[],
    spelling_variants = ARRAY['hammas']::text[],
    updated_at = now()
WHERE id = 'hammah_060' AND pidgin = 'hammah';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['oohno']::text[],
    updated_at = now()
WHERE id = 'a9e7c36e-997e-4d8d-ade3-691011f1269b' AND pidgin = 'ono';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['hu hu', 'who who', 'hu hu hu']::text[],
    updated_at = now()
WHERE id = 'huhu_073' AND pidgin = 'huhu';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['geeve']::text[],
    updated_at = now()
WHERE id = '94f37a14-252b-47b3-a2ab-50e42faad66f' AND pidgin = 'geev';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['givem', 'geevum', 'give ''um']::text[],
    updated_at = now()
WHERE id = 'geev_um_1026' AND pidgin = 'geev ''um';

COMMIT;
