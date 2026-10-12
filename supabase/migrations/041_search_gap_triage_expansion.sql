-- Migration 041: Ingest high-value terms from search gaps & triage backlog
--
-- Adds 8 missing terms from real user search demand and pending search gaps:
--   1. aloha e komo mai (variants: komo mai, e komo mai) - welcome, come in with aloha
--   2. aku eye (variants: aku eyes) - bulging eyes, staring blankly, bug-eyed
--   3. fadah man (variants: father man, fada man) - Catholic priest, minister, pastor
--   4. dap (variants: dhaap, dapps) - fist bump, casual handshake greeting
--   5. aiyah (variants: aiyh, aiya, ai-yah) - exclamation of exasperation, disbelief, shock
--   6. spesho (variants: speso, speco) - special, precious, unique
--   7. trow up (variants: throw up, trow-up) - vomit, throw up, puke
--   8. dangah (variants: danger) - danger, dangerous, formidable person
--
-- Enriches existing entries with search variants:
--   - shaka: variants + 'hang loose', 'hang loose hand sign'
--   - kamaaina: variants + 'local'
--   - fo' real: variants + 'fo sho', 'fo sho origin'
--   - sarap: variants + 'grabe ang sarap'
--   - mahalo: variants + 'grateful'
--   - a hui hou: variants + 'farewell'
--   - menpachi eyes: variants + 'tako eye'
--   - chillin: variants + 'chillon'
--
-- Triages search_gaps: marks answered terms 'added' and closes noise/entity rows as 'ignored'.

BEGIN;

-- 1. aku eye
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'aku eye',
       ARRAY['bulging eyes', 'bug-eyed', 'wide glassy eyes', 'staring blankly']::text[],
       'slang',
       'AH-koo eye',
       ARRAY['Why you got aku eye like dat? You nevah sleep last night?', 'He stayed looking at da waves wit aku eye.']::text[],
       'Local slang describing someone with wide, bulging, tired, or blankly staring eyes, resembling an aku (skipjack tuna). Similar to menpachi eyes.',
       'Hawaiian aku (skipjack tuna) + English eye.',
       'intermediate',
       'medium',
       ARRAY['slang', 'expressions', 'humor', 'local']::text[],
       'pidgin',
       ARRAY['aku eyes']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('aku eye'));

-- 3. fadah man
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'fadah man',
       ARRAY['Catholic priest', 'minister', 'pastor', 'reverend']::text[],
       'people',
       'FAH-dah man',
       ARRAY['Fadah man wen give da blessing befo'' we eat.', 'Uncle went talk story wit da fadah man aftah church.']::text[],
       'Local Pidgin term referring to a Catholic priest, pastor, or clerical father figure.',
       'Pidgin pronunciation of father man.',
       'intermediate',
       'medium',
       ARRAY['people', 'church', 'culture', 'local']::text[],
       'pidgin',
       ARRAY['father man', 'fada man']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('fadah man'));

-- 4. dap
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'dap',
       ARRAY['fist bump', 'handshake greeting', 'hand clasp greeting']::text[],
       'slang',
       'dap',
       ARRAY['Give da boy dap when you see him.', 'Shoots brah, throw me one dap.']::text[],
       'Casual island hand greeting incorporating a slap, slide, or fist bump between friends and braddahs.',
       'Colloquial greeting gesture adopted widely in island culture.',
       'beginner',
       'high',
       ARRAY['slang', 'greetings', 'gesture']::text[],
       'pidgin',
       ARRAY['dhaap', 'dapps']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('dap'));

-- 5. spesho
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'spesho',
       ARRAY['special', 'extraordinary', 'precious', 'unique']::text[],
       'slang',
       'SPESH-oh',
       ARRAY['Dis one stay real spesho to me.', 'Da Good An Spesho Book stay da Pidgin Old Testament.']::text[],
       'Hawaiian Pidgin phonetic pronunciation and spelling of special. Widely recognized in Hawaii literature and everyday speech.',
       'Hawaiian Pidgin phonetic pronunciation of English special.',
       'beginner',
       'high',
       ARRAY['slang', 'expressions', 'everyday']::text[],
       'pidgin',
       ARRAY['speso', 'speco']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('spesho'));

-- 7. trow up
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'trow up',
       ARRAY['vomit', 'throw up', 'puke', 'get sick']::text[],
       'actions',
       'trow up',
       ARRAY['Too much malasada, now I feel like I going trow up.', 'Dat boat ride was rough, almost everyone wen trow up.']::text[],
       'Everyday Pidgin term for vomiting or throwing up. Follows the standard Pidgin th-stopping ("th" -> "t").',
       'Pidgin phonology for English throw up.',
       'beginner',
       'high',
       ARRAY['actions', 'health', 'slang']::text[],
       'pidgin',
       ARRAY['trow-up']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('trow up'));

-- 7. Update existing entries with spelling/search variants
UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['aloha e komo mai', 'komo mai']::text[]),
    updated_at = NOW()
WHERE pidgin = 'e komo mai' AND NOT ('aloha e komo mai' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['aiyah', 'aiyh', 'aiya']::text[]),
    updated_at = NOW()
WHERE pidgin = 'ai yah' AND NOT ('aiyah' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['hang loose', 'hang loose hand sign']::text[]),
    updated_at = NOW()
WHERE pidgin = 'shaka' AND NOT ('hang loose' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['local']::text[]),
    updated_at = NOW()
WHERE pidgin IN ('kamaaina', 'kamaʻāina') AND NOT ('local' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['fo sho', 'fo sho origin']::text[]),
    updated_at = NOW()
WHERE pidgin = 'fosho' AND NOT ('fo sho' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['dangah']::text[]),
    updated_at = NOW()
WHERE pidgin = 'danjah' AND NOT ('dangah' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['grabe ang sarap']::text[]),
    updated_at = NOW()
WHERE pidgin = 'sarap' AND NOT ('grabe ang sarap' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['grateful']::text[]),
    updated_at = NOW()
WHERE pidgin = 'mahalo' AND NOT ('grateful' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['farewell']::text[]),
    updated_at = NOW()
WHERE pidgin = 'a hui hou' AND NOT ('farewell' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['tako eye']::text[]),
    updated_at = NOW()
WHERE pidgin = 'menpachi eyes' AND NOT ('tako eye' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries
SET spelling_variants = array_cat(COALESCE(spelling_variants, ARRAY[]::text[]), ARRAY['chillon']::text[]),
    updated_at = NOW()
WHERE pidgin = 'chillin' AND NOT ('chillon' = ANY(COALESCE(spelling_variants, ARRAY[]::text[])));

-- 10. Triage search_gaps table
UPDATE public.search_gaps
SET status = 'added'
WHERE status = 'pending'
  AND term IN (
    'aloha e komo mai', 'aku eye', 'aku eyes', 'fadah man', 'father man',
    'fada man', 'dap', 'dhaap', 'dapps', 'aiyah', 'aiyh', 'spesho',
    'speso', 'speco', 'trow up', 'throw up', 'vomit', 'dangah',
    'danger', 'tako eye', 'chillon', 'hang loose hand sign', 'grabe ang sarap'
  );

UPDATE public.search_gaps
SET status = 'ignored'
WHERE status = 'pending'
  AND term IN (
    'fo&#x27;evah', 'i&#x27;ve got your back'
  );

COMMIT;
