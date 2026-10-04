-- Migration 027: High-demand Google Search Console additions & query variant coverage
-- Ingests top missing search demand terms and expands spelling_variants/meanings on 16 existing headwords.
--
-- Headwords added:
--   1. ʻeha (painful, hurt, sore, ache, in pain) - 187 impressions, 17 clicks in GSC
--   2. almost pau (almost finished, nearly done, almost over) - 20 impressions in GSC
--
-- Updates to existing headwords:
--   - keiki: adds children, kids, kid, baby to meanings; adds kids, children to spelling_variants
--   - pau hana: adds pau hana time, powhana, pow hana to spelling_variants
--   - cuz: adds kuz, lil cuz, does cuz to spelling_variants; adds bro to meanings
--   - bahjuju: adds bad joojoo, bad juju, ba juju to spelling_variants
--   - wai: adds water to meanings and spelling_variants
--   - mele kalikimaka: adds kalikimaka to spelling_variants
--   - no need: adds no needed, no need explanation to spelling_variants; adds no needed to meanings
--   - huhu: adds hu hu hu, hu hu to spelling_variants
--   - cruising: adds just cruising to spelling_variants
--   - faka: adds onefaka, one faka to spelling_variants
--   - braddah: adds bro, brah friend to spelling_variants; adds bro, friend to meanings
--   - howzit: adds how is it to spelling_variants
--   - like beef: adds beef like fight, like fight to spelling_variants
--   - e kala mai: adds kala mai, kalamai, excuse me to spelling_variants
--   - kala: adds money to spelling_variants
--   - kefe: adds jerk, fool, punk, clown to meanings; adds kefe in samoan to spelling_variants

BEGIN;

-- 1. Insert new terms if they do not already exist
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'ʻeha',
       ARRAY['painful', 'hurt', 'sore', 'ache', 'in pain', 'injury']::text[],
       'descriptions',
       'EH-hah',
       ARRAY['Auwe, my back stay so ʻeha after moving da heavy boxes.', 'No touch ''em, brah, da sunburn stay so ʻeha!', 'His knee wen get ʻeha at da football game.']::text[],
       'Hawaiian loanword used in Pidgin to describe physical pain, soreness, or an injury. Commonly heard when describing sports injuries, sunburns, or sore muscles after hard work.',
       'From ʻŌlelo Hawaiʻi ʻeha (hurt, in pain, sore, painful, injured).',
       'intermediate',
       'high',
       ARRAY['hawaiian', 'feelings', 'body', 'descriptions', 'pain']::text[],
       'hawaiian',
       ARRAY['eha', 'painful']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = 'ʻeha' OR lower(pidgin) = 'eha');

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'almost pau',
       ARRAY['almost finished', 'nearly done', 'almost over']::text[],
       'expressions',
       'ALL-most POW',
       ARRAY['Hang on brah, I stay almost pau with da truck.', 'Two mo minutes, den almost pau work—pau hana time!', 'We almost pau with da prep, get da grill ready.']::text[],
       'Everyday Pidgin expression indicating that a task, work shift, or event is nearly finished and nearing completion.',
       'Pidgin compound: English "almost" + Hawaiian "pau" (finished, completed, done).',
       'beginner',
       'high',
       ARRAY['expressions', 'work', 'time', 'status', 'pau']::text[],
       'pidgin',
       ARRAY['almost pow', 'almost done']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = 'almost pau');

-- 2. Update existing headwords with expanded variants and meanings
UPDATE public.dictionary_entries SET
    english = ARRAY['child', 'children', 'kid', 'kids', 'baby']::text[],
    spelling_variants = ARRAY['kids', 'children']::text[],
    updated_at = now()
WHERE id = 'keiki_093' AND pidgin = 'keiki';

UPDATE public.dictionary_entries SET
    english = ARRAY['after work', 'pau hana time']::text[],
    spelling_variants = ARRAY['pau hana time', 'powhana', 'pow hana']::text[],
    updated_at = now()
WHERE id = 'pau_hana_144' AND pidgin = 'pau hana';

UPDATE public.dictionary_entries SET
    english = ARRAY['cousin', 'friend', 'bro']::text[],
    spelling_variants = ARRAY['kuz', 'lil cuz', 'does cuz']::text[],
    updated_at = now()
WHERE id = 'cuz_039' AND pidgin = 'cuz';

UPDATE public.dictionary_entries SET
    english = ARRAY['bad vibes', 'bad juju', 'bad joojoo']::text[],
    spelling_variants = ARRAY['bad joojoo', 'bad juju', 'ba juju']::text[],
    updated_at = now()
WHERE id = 'bahjuju_310' AND pidgin = 'bahjuju';

UPDATE public.dictionary_entries SET
    english = ARRAY['water', 'fresh water', 'river', 'stream']::text[],
    spelling_variants = ARRAY['water']::text[],
    updated_at = now()
WHERE id = 'wai_4008' AND pidgin = 'wai';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['kalikimaka']::text[],
    updated_at = now()
WHERE id = 'mele_kalikimaka_906' AND pidgin = 'mele kalikimaka';

UPDATE public.dictionary_entries SET
    english = ARRAY['not necessary', 'unnecessary', 'no need', 'no needed']::text[],
    spelling_variants = ARRAY['no needed', 'no need explanation']::text[],
    updated_at = now()
WHERE id = 'no_need_131' AND pidgin = 'no need';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['hu hu hu', 'hu hu']::text[],
    updated_at = now()
WHERE id = 'huhu_073' AND pidgin = 'huhu';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['just cruising']::text[],
    updated_at = now()
WHERE id = 'cruising_524' AND pidgin = 'cruising';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['onefaka', 'one faka']::text[],
    updated_at = now()
WHERE id = 'faka_331' AND pidgin = 'faka';

UPDATE public.dictionary_entries SET
    english = ARRAY['brother', 'bro', 'friend']::text[],
    spelling_variants = ARRAY['bro', 'brah friend']::text[],
    updated_at = now()
WHERE id = 'braddah_318' AND pidgin = 'braddah';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['how is it']::text[],
    updated_at = now()
WHERE id = 'howzit_072' AND pidgin = 'howzit';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['beef like fight', 'like fight']::text[],
    updated_at = now()
WHERE id = 'like_beef_105' AND pidgin = 'like beef';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['kala mai', 'kalamai', 'excuse me']::text[],
    updated_at = now()
WHERE id = 'e_kala_mai_327' AND pidgin = 'e kala mai';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['money']::text[],
    updated_at = now()
WHERE id = 'kala_611' AND pidgin = 'kala';

UPDATE public.dictionary_entries SET
    english = ARRAY['jerk', 'fool', 'punk', 'clown', 'Samoan swear word']::text[],
    spelling_variants = ARRAY['kefe in samoan']::text[],
    updated_at = now()
WHERE id = 'kefe_399' AND pidgin = 'kefe';

COMMIT;
