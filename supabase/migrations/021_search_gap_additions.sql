-- Dictionary additions from the search-gap backlog (2026-10-02).
--
-- Source: the 227 pending search_gaps searched 3+ times, each researched against the Pukui-Elbert
-- Hawaiian Dictionary (via hilo.hawaii.edu/wehe), Da Jesus Book, Wiktionary and local press;
-- crowd-sourced sites counted only as corroboration. Low-confidence findings were left out
-- (they stay pending in search_gaps for a human). Review notes: /tmp research files, session log.
--
-- 1. New column spelling_variants: other spellings people type for a headword (howle → haole).
--    Search treats them like the headword (services/dictionary-search.js, fuzzySearch).
-- 2. 19 new entries. Hawaiian-origin words are source_language 'hawaiian' so the translator
--    only uses them where PIDGIN_HAWAIIAN_LOANWORDS allows; loanwords Pidgin writes without
--    marks use the plain spelling (kapulu, molowa), with the ʻŌlelo spelling in origin.
-- 3. Spelling variants for 21 headwords.
-- 4. English meanings people searched, added to 19 existing headwords.
-- 5. potagee: usage note that it can be derogatory.
--
-- Guards: inserts skip a headword that already exists; array updates only add missing values.
-- Afterwards: node tools/data/generate-embeddings.js

BEGIN;

ALTER TABLE public.dictionary_entries
    ADD COLUMN IF NOT EXISTS spelling_variants TEXT[] NOT NULL DEFAULT '{}';

-- 2. New entries
-- "happy birthday" searched 26x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'hauʻoli lā hānau', ARRAY['happy birthday']::text[], 'greetings', 'how-OH-lee LAH HAH-now', ARRAY['Hauʻoli lā hānau, Tūtū! Come, we go cut da cake.']::text[], 'Hawaiian: hauʻoli (happy) + lā (day) + hānau (birth)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('hauʻoli lā hānau'));
-- "a'a" searched 5x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'ʻaʻā', ARRAY['rough, jagged lava', 'clinker lava']::text[], 'nature', 'ah-AH', ARRAY['No walk barefoot on da ʻaʻā, brah, going cut up your feet.']::text[], 'Hawaiian (also adopted into geology worldwide)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('ʻaʻā'));
-- "bochi" searched 4x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'bochi', ARRAY['Japanese cemetery', 'graveyard']::text[], 'cultural', 'BOH-chee', ARRAY['Obon time, da whole family go clean da graves at da bochi.']::text[], 'Japanese bochi (cemetery)', 'intermediate', 'medium', 'pidgin'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('bochi'));
-- "choom" searched 4x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'choom', ARRAY['to smoke marijuana']::text[], 'slang', 'CHOOM', ARRAY['Back in high school, dey used to go choom by da park aftah practice.']::text[], '1970s Honolulu teen slang (popularized by the "Choom Gang")', 'intermediate', 'medium', 'pidgin'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('choom'));
-- "kapulu" searched 4x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'kapulu', ARRAY['careless', 'sloppy', 'slovenly', 'messy']::text[], 'descriptions', 'KAH-POO-loo', ARRAY['Ho, your room stay so kāpulu, go clean um befo Mom come home!']::text[], 'From ʻŌlelo Hawaiʻi kāpulu.', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('kapulu'));
-- "makuahine" searched 3x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'makuahine', ARRAY['mother', 'aunt', 'female relative of parents'' generation']::text[], 'people', 'mah-koo-ah-HEE-neh', ARRAY['My makuahine stay teaching hula tonight, so I gotta pick up da kids.']::text[], 'Hawaiian: makua (parent) + wahine (woman)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('makuahine'));
-- "lidis" searched 3x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'lidis', ARRAY['like this', 'this way']::text[], 'expressions', 'lie-DIS', ARRAY['No do um lidat, do um lidis—watch me.']::text[], 'English "like this" (pairs with lidat)', 'intermediate', 'medium', 'pidgin'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('lidis'));
-- "カニレフア" searched 3x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'Kanilehua', ARRAY['misty rain of Hilo']::text[], 'nature', 'KAH-nee-leh-HOO-ah', ARRAY['Hilo get da Kanilehua rain, so soft and misty, da lehua love um.']::text[], 'Hawaiian: rain that lehua flowers drink', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('Kanilehua'));
-- "kapukapu" searched 3x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'kapukapu', ARRAY['dignity', 'regal bearing', 'entitled to respect and reverence', 'sacred']::text[], 'cultural', 'KAH-poo-KAH-poo', ARRAY['Da kupuna get one kapukapu kine presence—everybody show respect.']::text[], 'Hawaiian (reduplication of kapu)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('kapukapu'));
-- "mountain apples" searched 3x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'ʻōhiʻa ʻai', ARRAY['mountain apple', 'Malay apple']::text[], 'food', 'oh-HEE-ah EYE', ARRAY['We wen go pick mountain apple—da ʻōhiʻa ʻai stay ripe already.']::text[], 'Hawaiian (Polynesian canoe plant Syzygium malaccense)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('ʻōhiʻa ʻai'));
-- "lazy" searched 6x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'molowa', ARRAY['lazy', 'idle', 'indifferent', 'not wanting to work']::text[], 'descriptions', 'moh-loh-WAH', ARRAY['Eh, no be so molowa, come help me carry da cooler.']::text[], 'From ʻŌlelo Hawaiʻi moloā / molowā.', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('molowa'));
-- "wot" searched 6x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'wat', ARRAY['what']::text[], 'grammar', 'WAHT', ARRAY['Wat you like eat fo dinnah?']::text[], 'English ''what''', 'intermediate', 'medium', 'pidgin'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('wat'));
-- "wela" searched 4x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'wela', ARRAY['hot', 'burning', 'heat', 'passion']::text[], 'descriptions', 'VEH-lah', ARRAY['Ho, da sand stay wela today, no walk barefoot!']::text[], 'Hawaiian wela (hot, burned; heat). Also in ''wela ka hao'' (the iron is hot: let''s party)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('wela'));
-- "mimis" searched 4x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'mimi', ARRAY['pee', 'urine', 'to urinate']::text[], 'slang', 'MEE-mee', ARRAY['Wait, da keiki gotta go mimi first before we leave.']::text[], 'Hawaiian mimi (urine; to urinate)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('mimi'));
-- "good morning" searched 3x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'aloha kakahiaka', ARRAY['good morning']::text[], 'greetings', 'ah-LOH-hah kah-kah-hee-AH-kah', ARRAY['Aloha kakahiaka, Aunty! You like coffee?']::text[], 'Hawaiian aloha + kakahiaka (morning)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('aloha kakahiaka'));
-- "pio" searched 4x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'pio', ARRAY['out, extinguished (light, fire)', 'turned off', 'to go out']::text[], 'actions', 'PEE-oh', ARRAY['Eh, pio da light befo you go sleep.']::text[], 'Hawaiian pio (extinguished, gone out)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('pio'));
-- "hele mai" searched 3x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'hele mai', ARRAY['come here', 'come over', 'come in']::text[], 'expressions', 'HEH-leh MY', ARRAY['Hele mai, come eat already!']::text[], 'Hawaiian hele (go) + mai (toward the speaker)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('hele mai'));
-- "nuha" searched 3x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'nuha', ARRAY['sulky', 'sullen', 'to sulk, pout', 'peeved']::text[], 'emotions', 'NOO-hah', ARRAY['Why you stay all nuha? Nobody wen do nothing to you.']::text[], 'Hawaiian nuha (sulky, sullen)', 'intermediate', 'medium', 'hawaiian'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('nuha'));
-- "no get" searched 3x
INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, origin, difficulty, frequency, source_language)
SELECT gen_random_uuid()::text, 'no get', ARRAY['there isn''t any', 'don''t have', 'none, nothing']::text[], 'expressions', 'noh GET', ARRAY['Sorry, no get rice today, da barge came late.']::text[], 'English ''no'' + ''get'' (have/there is)', 'intermediate', 'medium', 'pidgin'
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) = lower('no get'));

-- 3. Spelling variants
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['ai sus', 'ai soos']::text[])), updated_at = now() WHERE pidgin = 'aisus';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['boboda']::text[])), updated_at = now() WHERE pidgin = 'bobora';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['uz bubooze']::text[])), updated_at = now() WHERE pidgin = 'babooze';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['iritz']::text[])), updated_at = now() WHERE pidgin = 'irrahz';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['no worry beef curry']::text[])), updated_at = now() WHERE pidgin = 'beef curry no worry';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['broke da mouf']::text[])), updated_at = now() WHERE pidgin = 'broke da mouth';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['bulaia', 'bulais']::text[])), updated_at = now() WHERE pidgin = 'bulai';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['wotev']::text[])), updated_at = now() WHERE pidgin = 'whatevahz';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['howle']::text[])), updated_at = now() WHERE pidgin = 'haole';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['moki']::text[])), updated_at = now() WHERE pidgin = 'moke';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['bombai']::text[])), updated_at = now() WHERE pidgin = 'bumbai';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['kukai']::text[])), updated_at = now() WHERE pidgin = 'kukae';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['titah']::text[])), updated_at = now() WHERE pidgin = 'tita';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['blahlah']::text[])), updated_at = now() WHERE pidgin = 'blala';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['givem']::text[])), updated_at = now() WHERE pidgin = 'geev ''um';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['pooka']::text[])), updated_at = now() WHERE pidgin = 'puka';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['hamachang']::text[])), updated_at = now() WHERE pidgin = 'hammajang';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['podagee', 'portagee']::text[])), updated_at = now() WHERE pidgin = 'potagee';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['mahke']::text[])), updated_at = now() WHERE pidgin = 'make';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['li’ dat']::text[])), updated_at = now() WHERE pidgin = 'lidat';
UPDATE public.dictionary_entries SET spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['auntie']::text[])), updated_at = now() WHERE pidgin = 'aunty';

-- 4. English meanings people searched for
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['balls (testicles)']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'alas';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['expression of disbelief']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'ho nah';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['yucky', 'gross']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'ujee';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['certain']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'garanz';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['idiot']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'babooze';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['piss']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'shishi';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['towards the mountain', 'mountainward', 'inland']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'mauka';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['keep out', 'no trespassing', 'off limits']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'kapu';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['all right']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'aurite';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['silver', 'dollar']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'kala';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['appreciate', 'admire', 'esteem']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'mahalo';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['pompous', 'snooty']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'high makamaka';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['dumb']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'lolo';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['pissy', 'cranky']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'habut';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['pissed off']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'huhu';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['oh no']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'auwe';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['how''s it going']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'howzit';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['attractive']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'nani';
UPDATE public.dictionary_entries SET english = english || ARRAY(SELECT m FROM unnest(ARRAY['chillax']::text[]) m WHERE NOT (lower(m) = ANY (SELECT lower(e) FROM unnest(english) e))), updated_at = now() WHERE pidgin = 'cruising';

-- 5. potagee: same word can be affectionate inside the community and an insult from outside it
UPDATE public.dictionary_entries
SET usage = usage || ' Used with affection among Portuguese-descended locals, it can be derogatory from an outsider; read the room.', updated_at = now()
WHERE pidgin = 'potagee' AND usage NOT ILIKE '%derogatory%';

COMMIT;
