-- Migration 040: Ingest high-value terms from search gaps & triage backlog
--
-- Adds 10 missing terms from real user search demand:
--   1. kanaka maoli (variants: kanaka, kanaka ʻōiwi) - Native Hawaiian, indigenous Hawaiian person
--   2. pork hash - local dim sum steamed pork and shrimp dumpling (siu mai)
--   3. went grad (variants: wen grad) - graduated from high school/college
--   4. kava (variants: ʻawa, awa) - ceremonial and social island beverage from kava root
--   5. makahiki - traditional Hawaiian harvest, sports, and peace festival
--   6. beach boy (variants: beach boys) - Waikiki waterman, surfing instructor, ambassador of aloha
--   7. holokū (variants: holoku) - elegant traditional Hawaiian floor-length formal gown
--   8. nuff said (variants: 'nuff said, enough said) - say no more, completely agreed
--   9. jah den (variants: den jah) - alright then, see you later, until then
--   10. ay koodish (variants: ay kudeesh, ay koodeesh, cu dish) - island exclamation of shock, dismay, or surprise
--
-- Enriches existing entries with search variants:
--   - you da man: variants + 'you the man', 'you are the man'
--   - aole pilikia: variants + 'a''ole pilikoa', 'aole pilikia', 'a''ole pilikia'
--   - grindz: variants + 'grinding'
--   - chotto: variants + 'chote'
--
-- Triages search_gaps: marks answered terms 'added' and closes noise/typo rows as 'ignored'.

BEGIN;

-- 1. kanaka maoli
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'kanaka maoli',
       ARRAY['Native Hawaiian', 'indigenous Hawaiian person', 'original person of the land']::text[],
       'people',
       'kah-NAH-kah mow-LEE',
       ARRAY['He is proud kanaka maoli, tracing his lineage back through generations.', 'Support local kanaka maoli artists and cultural practitioners.']::text[],
       'Native Hawaiian, of indigenous Hawaiian ancestry. Used with deep cultural respect and cultural identity.',
       'Hawaiian: kanaka (human/person) + maoli (native/indigenous/true).',
       'intermediate',
       'high',
       ARRAY['hawaiian', 'people', 'culture', 'identity']::text[],
       'hawaiian',
       ARRAY['kanaka', 'kanaka ʻōiwi', 'kanaka oiwi']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('kanaka maoli'));

-- 2. pork hash
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'pork hash',
       ARRAY['steamed pork dumpling', 'local dim sum dumpling', 'siu mai']::text[],
       'food',
       'pork hash',
       ARRAY['Grab two manapua and tree pork hash from da bakery.', 'Dip da pork hash in hot mustard and shoyu, so ono!']::text[],
       'A Hawaii Chinese-local dim sum classic (siu mai) featuring seasoned ground pork, water chestnuts, and shrimp steamed in an open wonton wrapper.',
       'Hawaii Chinese-plantation culinary adaptation of Cantonese siu mai (烧卖).',
       'beginner',
       'high',
       ARRAY['food', 'local eats', 'dim sum', 'snack']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('pork hash'));

-- 3. went grad
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'went grad',
       ARRAY['graduated', 'finished school', 'graduated high school']::text[],
       'expressions',
       'went grad',
       ARRAY['What year you went grad?', 'We wen grad together from McKinley.', 'His keiki wen grad college on da mainland.']::text[],
       'The classic Hawaii local milestone question and phrase describing graduating from school, especially high school, which serves as a core local connection in Hawaii.',
       'Hawaiian Pidgin past-tense preverbal marker "wen/went" + English "grad" (graduate).',
       'beginner',
       'high',
       ARRAY['school', 'expressions', 'everyday', 'milestones']::text[],
       'pidgin',
       ARRAY['wen grad']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('went grad', 'wen grad'));

-- 4. kava
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'kava',
       ARRAY['traditional Polynesian ceremonial beverage', 'awa root drink']::text[],
       'cultural',
       'KAH-vah',
       ARRAY['Come join da kava circle tonight and talk story.', 'Drinking kava helps you relax and pau hana in peace.']::text[],
       'A traditional calming beverage prepared from the roots of the kava plant (Piper methysticum), shared across the Pacific and Hawaii during ceremonies and community gatherings.',
       'Polynesian / Hawaiian (ʻawa).',
       'intermediate',
       'medium',
       ARRAY['cultural', 'polynesian', 'tradition', 'gatherings']::text[],
       'hawaiian',
       ARRAY['ʻawa', 'awa']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('kava', 'ʻawa', 'awa'));

-- 5. makahiki
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'makahiki',
       ARRAY['ancient Hawaiian New Year festival', 'season of peace and harvest', 'year']::text[],
       'cultural',
       'mah-kah-HEE-kee',
       ARRAY['During Makahiki season, warfare was forbidden across da islands.', 'Hauʻoli Makahiki Hou means Happy New Year!']::text[],
       'The ancient Hawaiian harvest festival and new year season dedicated to Lono, god of agriculture and fertility, marked by games, sports, feasts, and peace.',
       'Hawaiian: makahiki (year, season, annual festival).',
       'intermediate',
       'medium',
       ARRAY['cultural', 'history', 'celebration', 'hawaiian']::text[],
       'hawaiian',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('makahiki'));

-- 6. beach boy
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'beach boy',
       ARRAY['Waikiki surfing instructor', 'waterman ambassador', 'surf guide']::text[],
       'people',
       'beach boy',
       ARRAY['Uncle was one Waikiki beach boy from small kid time.', 'Da beach boys know how fo read every single wave.']::text[],
       'The legendary watermen and surf instructors of Waikiki who helped popularize surfing worldwide while serving as ambassadors of aloha.',
       'Hawaii coastal surf culture.',
       'beginner',
       'medium',
       ARRAY['people', 'surfing', 'ocean', 'waikiki']::text[],
       'pidgin',
       ARRAY['beach boys']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('beach boy', 'beach boys'));

-- 7. holokū
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'holokū',
       ARRAY['traditional formal Hawaiian gown', 'floor-length dress with train']::text[],
       'cultural',
       'hoh-loh-KOO',
       ARRAY['Tutu wore her velvet holokū for da May Day pageant.', 'Da singer looked stunning in her silk holokū.']::text[],
       'An elegant, formal, floor-length Hawaiian gown with a train, adapted in the 19th century from missionary dresses into a dignified symbol of Hawaiian royalty and modern formal attire.',
       'Hawaiian: holokū.',
       'intermediate',
       'medium',
       ARRAY['cultural', 'fashion', 'tradition', 'pageants']::text[],
       'hawaiian',
       ARRAY['holoku']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('holokū', 'holoku'));

-- 8. nuff said
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'nuff said',
       ARRAY['say no more', 'enough said', 'completely agreed', 'understood']::text[],
       'expressions',
       'nuff sed',
       ARRAY['Free food and live music? Nuff said, I stay dea!', 'Nuff said brah, pack your gear and we go.']::text[],
       'Everyday colloquial phrase indicating immediate agreement and that no further explanation or convincing is necessary.',
       'Pidgin contraction of English "enough said".',
       'beginner',
       'high',
       ARRAY['expressions', 'slang', 'agreement', 'everyday']::text[],
       'pidgin',
       ARRAY['''nuff said']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('nuff said', '''nuff said', 'enough said'));

-- 9. jah den
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'jah den',
       ARRAY['alright then', 'see you later', 'until then', 'that is that']::text[],
       'greetings',
       'jah den',
       ARRAY['Shoots, I see you tomorrow, jah den!', 'Jah den brah, take care!']::text[],
       'A casual Pidgin farewell and parting expression meaning "alright then" or "see you then".',
       'Hawaiian Pidgin contraction of "just then" or "alright then".',
       'beginner',
       'high',
       ARRAY['greetings', 'parting', 'farewell', 'slang']::text[],
       'pidgin',
       ARRAY['den jah']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('jah den', 'den jah'));

-- 10. ay koodish
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'ay koodish',
       ARRAY['exclamation of shock', 'oh no', 'good grief', 'yikes']::text[],
       'expressions',
       'eye koo-DEESH',
       ARRAY['Ay koodish! How come da tyre stay flat?', 'Ay koodish, look at da long line!']::text[],
       'Plantation-era island exclamation expressing disbelief, shock, surprise, or distress.',
       'Hawaii plantation multicultural loanword.',
       'intermediate',
       'medium',
       ARRAY['expressions', 'slang', 'shock', 'plantation']::text[],
       'pidgin',
       ARRAY['ay kudeesh', 'ay koodeesh', 'cu dish']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('ay koodish', 'ay kudeesh', 'ay koodeesh', 'cu dish'));

-- 11. Variant updates to existing entries
UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(coalesce(spelling_variants, '{}') || ARRAY['you the man', 'you are the man']::text[])),
    updated_at = now()
WHERE pidgin = 'you da man';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(coalesce(spelling_variants, '{}') || ARRAY['a''ole pilikoa', 'a''ole pilikia', 'aole pilikoa']::text[])),
    updated_at = now()
WHERE pidgin = 'aole pilikia';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(coalesce(spelling_variants, '{}') || ARRAY['grinding']::text[])),
    updated_at = now()
WHERE pidgin = 'grindz';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(coalesce(spelling_variants, '{}') || ARRAY['chote']::text[])),
    updated_at = now()
WHERE pidgin = 'chotto';

-- 12. Update search_gaps status
UPDATE public.search_gaps SET status = 'added'
WHERE status = 'pending' AND term IN (
    'kanaka maoli', 'pork hash', 'went grad', 'kava', 'makahiki',
    'beach boy', 'holoku', 'nuff said', 'jah den', 'ay koodish',
    'ay kudeesh', 'ay koodeesh', 'cu dish', 'you the man', 'you are the man',
    'a''ole pilikoa', 'chote', 'grinding', 'enough said'
);

UPDATE public.search_gaps SET status = 'ignored'
WHERE status = 'pending' AND term IN (
    'hog cheese', 'payd', 'hake', 'youre acting odd', 'slow down', 'bawce',
    'me ke', 'pilua', 'pka', 'hartha', 'manerve', 'koliana', 'hugu',
    'gaesekki', 'sponga', 'sponging', 'ki ki', 'kiki', 'squorleh',
    'what you want', 'okoa', 'odamot', 'love you', 'bobola', 'bestes',
    'olos', 'wow wee', 'oww wee', 'kea da pooa', 'higu', 'onu onu',
    'scrub', 'podafee', 'sexy', 'boonies', 'big head', 'shion',
    'haput', 'bomba', 'hulimaka', 'friends gathering', 'family gathering',
    'mamby', 'namby', 'gromet', 'irrants', 'ballbaranz', 'way to go',
    'kee kee', 'kei kei', 'bo hi', 'pooa', 'kuky', 'sups', 'motto bravery',
    'mish', 'knowitall', 'toko', 'cheerah', 'squirleh', 'have fun',
    'hafun', 'old woman', 'give up', 'macho bravery', 'know it all',
    'all good', 'akamia', 'maho', 'supah', 'rodgs', 'rodga', 'malimi',
    'woteveah', 'wotevah', 'havefun', 'piliko', 'chiro', 'bad attitude',
    'yowns', 'youowns', 'maka like', 'you owns', 'cheo', 'patai',
    'helmen', 'gunner', 'deleic', 'delico', 'barefoot', 'barefeet',
    'hawaiian zip bag', 'balawau', 'puni', 'not knowing something',
    'wailua da mouth', 'jag up', 'kulu', 'tane', 'take your time',
    'jagged', 'jags', 'waddu', 'no play today', 'loser', 'havfun',
    'tap out', 'magu', 'lazy no work', 'misi', 'gaufunit', 'are you okay?',
    'jaloke', 'hulo', 'mahoe', 'shut up', 'widdout', 'no bring',
    'vlkid', 'vkid', 'vikid', 'villkid', 'village kid', 'villagekid',
    'gaff', 'fo''evah', 'pidu', 'i got you', 'i''ve got your back',
    'kadai', 'ai soon', 'being smart', 'bissha', 'pussha', 'pissha',
    'sassy', 'dummeh', 'dinkey', 'tuy', 'hujangus', 'hfun', 'uji',
    'whip um kealoha', 'choke timez', 'spaz', 'hamo', 'kanpang', 'kampung',
    'moog', 'campung', 'tarantaran', 'bulls testicles', 'taran taran',
    'yors', 'lumpai', 'kaka', 'me hao', 'failky', 'fun time', 'shuna',
    'suna', 'shoona', 'pahine', 'poke squid', 'halanka', 'kudica',
    'kudiyab', 'sounds cute dat one', 'hope all is well', 'stay well',
    'astin', 'astine', 'numbah', 'boal', 'bola', 'dang', 'hana you',
    'gadut', 'tidda', 'himel', 'tutmary', 'tuntamary', 'so nah nah',
    'loniele', 'loloniele', 'clueless', 'tunta mary', 'scammer',
    'barenz', 'chik', 'dagah', 'wipe out', 'fat guy', 'paias', 'houi',
    'sniffy', 'burato', 'borato', 'baora', 'barato', 'calm down',
    'ay koof', 'good time', 'ebi', 'stay put', 'no like work', 'oshade',
    'screamah', 'koki', 'oldma', 'nem', 'o shade', 'o’shade', 'lbu',
    'pii', 'bolla', 'stay out', 'rottin', 'tede', 'milimili', 'ibu',
    'main land', 'maga', 'tih', 'ventah', 'big guy', 'dat true',
    'stay plenty', 'tight', 'imaway', 'jemo', 'kahonees', 'stinker',
    'mai komo', 'kanakasorr', 'tete'
);

COMMIT;
