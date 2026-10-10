-- Migration 038: Triage the on-site search-gap backlog
--
-- 703 search_gaps rows were pending on 2026-10-10. Most were noise: the dictionary page
-- asks the server whenever the user pauses typing, so "hope all is well" also logged
-- "hope all is" (closed by npm run seo:close-gaps, which now marks such fragments
-- 'ignored'), plus keyboard slips, names and English words with no Pidgin angle.
--
-- New entries for real gaps:
--   gasa gasa (variants: gasagasa, gasa-gasa) - rustling around, rummaging noisily
--   hoʻomalimali (variants: hoomalimali, malimali, mali mali) - flattery, sweet talk
--   palu - chum, fish bait
--   karai - spicy, spicy hot
--   welakahao (variants: wela ka hao) - party time, let's get it going
--   chotto (variants: choto) - a little, a bit
--   hapa haole (variants: happa haole) - part white, half white
--   kona weather - humid, muggy
--
-- Existing entries:
--   bachi: variants + batchee
--   hanabata: variants + hana buttah, hanabuttah
--   howzit: variants + howsit
--   kanikapila: variants + kani ka pila, kanekapila
--   ukulele: variants + uke, ʻukulele
--   kolohe: meanings + rascal, troublemaker, naughty
--
-- search_gaps: 10 rows this migration answers that coverage() cannot see
-- ('added'); 364 noise rows ('ignored'). Pidgin-looking unknowns (oshade,
-- ventah, so nah nah, ...) and repeated English lookups with a plausible Pidgin answer stay
-- pending for a person. Run npm run seo:close-gaps -- --apply afterwards.

BEGIN;

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'gasa gasa',
       ARRAY['rustling around', 'rummaging noisily', 'clumsy and noisy', 'restless']::text[],
       'descriptions',
       'GAH-sah GAH-sah',
       ARRAY['Stop gasa gasa in da bag, everybody stay sleeping!', 'Who stay gasa gasa in da kitchen dis late?', 'He so gasa gasa, always knocking stuff ova.']::text[],
       'Noisy rummaging or rustling, or someone restless and clumsy. Often a gentle scold from parents and grandparents.',
       'Japanese gasagasa, an onomatopoeia for rustling or rough, dry sounds.',
       'intermediate',
       'medium',
       ARRAY['japanese', 'descriptions', 'sounds']::text[],
       'pidgin',
       ARRAY['gasagasa', 'gasa-gasa']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('gasa gasa', 'gasagasa', 'gasa-gasa'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'hoʻomalimali',
       ARRAY['flattery', 'sweet talk', 'butter up', 'flatter']::text[],
       'expressions',
       'hoh-oh-MAH-lee-MAH-lee',
       ARRAY['No try hoʻomalimali me, I know you like borrow my truck.', 'He stay malimali da teacher fo get one A.', 'All dis hoʻomalimali, what you like?']::text[],
       'Flattering or sweet-talking someone, usually to get something. The short form "malimali" is common in everyday talk.',
       'Hawaiian hoʻomalimali, to flatter or soothe.',
       'intermediate',
       'medium',
       ARRAY['hawaiian', 'expressions', 'behavior']::text[],
       'hawaiian',
       ARRAY['hoomalimali', 'malimali', 'mali mali']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('hoʻomalimali', 'hoomalimali', 'malimali', 'mali mali'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'palu',
       ARRAY['chum', 'fish bait', 'ground fish bait']::text[],
       'cultural',
       'PAH-loo',
       ARRAY['Bring da palu, we go throw um in fo bring up da fish.', 'Your hands stink like palu, go wash!', 'Uncle make his own palu wit aku guts and bread.']::text[],
       'Fishing chum: chopped fish parts or other bait thrown in the water to draw fish. An everyday word for anyone who fishes in Hawaiʻi.',
       'Hawaiian palu, a bait or relish of chopped fish head and innards.',
       'intermediate',
       'medium',
       ARRAY['hawaiian', 'fishing', 'ocean']::text[],
       'hawaiian',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('palu'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'karai',
       ARRAY['spicy', 'spicy hot', 'peppery']::text[],
       'food',
       'kah-RYE',
       ARRAY['Watch out, dis kim chee stay karai!', 'Too karai fo me, pass da rice.', 'Grandma like her shoyu chicken little bit karai.']::text[],
       'Spicy-hot, about food. Heard in local homes across generations.',
       'Japanese karai (辛い), spicy or salty.',
       'intermediate',
       'medium',
       ARRAY['japanese', 'food', 'taste']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('karai'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'welakahao',
       ARRAY['party time', 'let''s get it going', 'let''s celebrate']::text[],
       'expressions',
       'WEH-lah-kah-HOW',
       ARRAY['Pau work, welakahao!', 'Friday night, welakahao, everybody come.', 'Da band wen start up and was welakahao already.']::text[],
       'A call to party or get things going, often at the end of the work week.',
       'Hawaiian wela ka hao, literally "the iron is hot".',
       'intermediate',
       'low',
       ARRAY['hawaiian', 'expressions', 'party']::text[],
       'hawaiian',
       ARRAY['wela ka hao']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('welakahao', 'wela ka hao'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'chotto',
       ARRAY['a little', 'a bit', 'just a moment']::text[],
       'expressions',
       'CHOH-toh',
       ARRAY['Chotto, chotto, I almost pau!', 'Give me chotto rice, not too much.', 'Chotto matte, I coming!']::text[],
       'Japanese for "a little" or "just a moment": said alone to ask someone to hold on, or to mean a small amount. See also chotto matte.',
       'Japanese chotto (ちょっと).',
       'beginner',
       'medium',
       ARRAY['japanese', 'expressions']::text[],
       'pidgin',
       ARRAY['choto']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('chotto', 'choto'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'hapa haole',
       ARRAY['part white', 'half white', 'half Caucasian']::text[],
       'people',
       'HAH-pah HOW-leh',
       ARRAY['She hapa haole, her dad from California and her mom from Hilo.', 'Me hapa haole, brah, but I born and raise here.', 'Hapa haole kids get da best of both sides.']::text[],
       'Someone of part-white ancestry, mixed with Hawaiian, Asian or other heritage. Neutral and very common. Also names a style of English-language Hawaiian music ("hapa haole songs").',
       'Hawaiian hapa (half, from English "half") + haole (foreigner, white person).',
       'beginner',
       'high',
       ARRAY['people', 'hawaiian', 'identity']::text[],
       'hawaiian',
       ARRAY['happa haole']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('hapa haole', 'happa haole'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'kona weather',
       ARRAY['humid', 'muggy', 'hot and humid', 'sticky weather', 'no trade winds']::text[],
       'nature',
       'KOH-nah WEH-dah',
       ARRAY['Ho, kona weather today, no more breeze.', 'Kona weather get me all sticky.', 'Was kona weather all week, nobody could sleep.']::text[],
       'Hot, still, humid weather when the trade winds stop and southerly kona winds bring muggy air, often with vog.',
       'From kona, Hawaiian for leeward or south, the direction the wind comes from when the trades die.',
       'beginner',
       'medium',
       ARRAY['nature', 'weather']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('kona weather'));

-- Spellings people search for that site search misses, and missing meanings
UPDATE public.dictionary_entries SET
    spelling_variants = coalesce(spelling_variants, '{}') || ARRAY(SELECT v FROM unnest(ARRAY['batchee']::text[]) v WHERE NOT v = ANY(coalesce(spelling_variants, '{}'))),
    updated_at = now()
WHERE id = 'bachi_016' AND pidgin = 'bachi';

UPDATE public.dictionary_entries SET
    spelling_variants = coalesce(spelling_variants, '{}') || ARRAY(SELECT v FROM unnest(ARRAY['hana buttah', 'hanabuttah']::text[]) v WHERE NOT v = ANY(coalesce(spelling_variants, '{}'))),
    updated_at = now()
WHERE id = 'hanabata_063' AND pidgin = 'hanabata';

UPDATE public.dictionary_entries SET
    spelling_variants = coalesce(spelling_variants, '{}') || ARRAY(SELECT v FROM unnest(ARRAY['howsit']::text[]) v WHERE NOT v = ANY(coalesce(spelling_variants, '{}'))),
    updated_at = now()
WHERE id = 'howzit_072' AND pidgin = 'howzit';

UPDATE public.dictionary_entries SET
    spelling_variants = coalesce(spelling_variants, '{}') || ARRAY(SELECT v FROM unnest(ARRAY['kani ka pila', 'kanekapila']::text[]) v WHERE NOT v = ANY(coalesce(spelling_variants, '{}'))),
    updated_at = now()
WHERE id = 'kanikapila_089' AND pidgin = 'kanikapila';

UPDATE public.dictionary_entries SET
    spelling_variants = coalesce(spelling_variants, '{}') || ARRAY(SELECT v FROM unnest(ARRAY['uke', 'ʻukulele']::text[]) v WHERE NOT v = ANY(coalesce(spelling_variants, '{}'))),
    updated_at = now()
WHERE id = 'ukulele_181' AND pidgin = 'ukulele';

UPDATE public.dictionary_entries SET
    english = english || ARRAY(SELECT m FROM unnest(ARRAY['rascal', 'troublemaker', 'naughty']::text[]) m WHERE NOT m = ANY(english)),
    updated_at = now()
WHERE id = 'kolohe_095' AND pidgin = 'kolohe';

-- Gaps the new entries answer that coverage() cannot see (a word inside a new phrase, typos)
UPDATE public.search_gaps SET status = 'added'
WHERE status = 'pending' AND term IN (
    'gasa', 'hana buttan', 'me hapa haole brah', 'me happa haole brah', 'mischivious', 'trouble maker',
    'hot ahumid', 'hot anhumid', 'hot humid', 'hothumid'
);

-- Noise: keyboard slips, names, off-topic English, slurs and sentence scraps
UPDATE public.search_gaps SET status = 'ignored'
WHERE status = 'pending' AND term IN (
    'cheese', 'ghetto', 'intruder', 'mexican', 'allowed', 'asshole',
    'closed', 'cocktail', 'convince', 'cute pig', 'don’t blow away', 'enjoy',
    'excreted', 'feed up', 'gay', 'narcissist', 'nope', 'not any',
    'orgasm', 'otherwise', 'shower', 'slang for strong', 'spider', 'taco',
    'adobo', 'always', 'amazed', 'area the place', 'babes', 'beet',
    'bicycle', 'bombae', 'bombaih', 'bombay', 'bummers', 'capsize',
    'chicano', 'chillaxing', 'clean', 'close it', 'coastal life', 'coasting',
    'comments', 'convinced', 'crying', 'cum', 'da line', 'dad',
    'doctor', 'don’t do y', 'don&#x27;t know', 'donkey', 'drop', 'drunken',
    'equipment', 'explore', 'fant', 'fast car', 'fingers', 'fool or trick',
    'freaking awesome', 'full', 'get sick', 'hailey', 'hammajng', 'he or she',
    'heart throb', 'heartthrobs', 'helper', 'hispanic', 'hokulani', 'hollie',
    'hours', 'hunter', 'i hope', 'i’m going to', 'i’m going to bed', 'incense',
    'kamahina', 'let’s go to', 'let’s go to sleep', 'likewise', 'lowest', 'lug nut',
    'lugnut', 'mexico', 'miracles', 'morning', 'my eye', 'no get not',
    'o’ahu', 'ocole', 'oh shit', 'okay yes', 'open up', 'oreo',
    'out today', 'pidgin', 'possibility', 'punani patrol', 'pupils', 'relaxed',
    'responsable', 'retarded', 'smoking', 'sound so good', 'spinner', 'sponge',
    'suspected', 'sword', 'tanaka', 'temperature', 'tke your time', 'to close',
    'vacation', 'vehicle', 'viva', 'what about', 'where are you?', 'wilderness',
    'without bringing something', 'wooden spoon', 'worker', 'youre acting weird', '7: steps to spiritual recovery 15 min discussion', 'alert',
    'all of it', 'alot', 'alscrao', 'angrey', 'anyone', 'anytime',
    'approve', 'armor', 'attuide', 'attutid', 'auright', 'baldf',
    'batchrr', 'be ready', 'bein smart', 'belt', 'beoke', 'bitches',
    'board', 'bodyboard', 'bombaij', 'boogieboard', 'boucha', 'bouvh',
    'bqald', 'braddqh', 'brain', 'brst', 'business', 'business hours',
    'business time', 'castom', 'cheet', 'chest', 'chill&#x27;', 'chubby',
    'chubby girl', 'cillh', 'come on', 'computer', 'create', 'custom',
    'damn', 'danegah', 'decorate', 'disapo', 'disappoined', 'disappointed',
    'dog li', 'don’t act like th', 'dont know', 'drive', 'during', 'erends',
    'errands', 'error', 'fear', 'feed', 'feet', 'feminine',
    'fillipino', 'flat tire', 'flighty', 'fly swatter', 'fly w', 'fool ortrick',
    'footew', 'fpo', 'frustrated', 'gangster', 'get rid of', 'ghetto ha',
    'good coma', 'goodd', 'great days', 'grim', 'grund', 'hagemogo',
    'hagenoge', 'half ass', 'halloween', 'hammacng', 'hammajangq', 'hammajsng',
    'hammang', 'hammer', 'hapine', 'haple', 'haven', 'haven&#x27;',
    'haven&#x27;t', 'heartthrobe', 'high makmk', 'hjel', 'hockey', 'hocvk',
    'honestly', 'hope', 'hope allus', 'hospital', 'hosptia', 'howzithow',
    'hreat', 'hukilao', 'huyy', 'i gotta go', 'i’m going', 'iagree',
    'imagine', 'insults', 'jaime', 'kamains', 'khapai', 'knowing',
    'kuksi', 'kukua', 'last', 'layer', 'lazt', 'leg',
    'let’s go to bed', 'lets gi', 'lickings', 'long time', 'lovaly', 'love uou',
    'lovely', 'lsame', 'm bravery', 'ma bravery', 'mac bravery', 'mach bravery',
    'macho', 'mama', 'marr', 'mean line', 'merna', 'michelina',
    'mo bravery', 'mop', 'motto', 'north', 'not catching fish', 'not catching fosh',
    'okana', 'owns', 'palals', 'paul', 'pays', 'pee there',
    'peeded', 'photo', 'picture', 'portugese', 'possibiliti', 'practice',
    'prepared', 'pro9b', 'protein bar', 'proud', 'punani patril', 'punish',
    'quey', 'radio', 'rain', 'ready', 'really hot', 'rele',
    'responsibly', 'ritz', 's4', 'said', 'same', 'science',
    'scoff', 'seord', 'seventeen', 'sh9', 'shoes', 'simple',
    'slang for amazing', 'slang for stgrongamazing', 'slang for strong amazing', 'slaps', 'slur', 'some body goin',
    'some body gon', 'some more', 'special sprir', 'sqirl', 'stau', 'stay qell',
    'stay ut', 'strong man', 'stropn', 'swat', 'tbirty', 'than when my sto',
    'that’s enough of thaf', 'that’s enough of that', 'that&#x27;sright', 'the besrt', 'they', 'thirtyu',
    'throw out', 'to seal', 'toss', 'touble', 'troble', 'turles',
    'tutnt', 'unhappy', 'wahinr', 'waht', 'walk', 'warrior',
    'went', 'what are you doing?', 'what are you f', 'what changed?', 'what you need', 'whenever',
    'wihtou', 'winner', 'wipe pu', 'without bringing somethign', 'woop', 'xthan when==',
    'xthan when===', 'ycu', 'yeah okay', 'yesterday', 'you  the man', 'you a the man',
    'you look', 'you&#x27;r ein', 'your commen ts', 'youre'
);

COMMIT;
