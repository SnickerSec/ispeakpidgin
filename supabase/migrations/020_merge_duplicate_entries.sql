-- Merge dictionary entries that are the same word spelled twice.
--
-- 23 groups shared a word-page slug and differed only by kahakō/ʻokina (luau vs lūʻau) or
-- punctuation (shoots brah vs shoots, brah!), so each produced a competing /word/<slug>-2.html
-- page and the translator saw two candidates. For each group the richest row (audio, examples,
-- frequency) survives under its id; the others' meanings, examples and tags are folded in and
-- their rows deleted. server.js 301-redirects the vanished -2/-3 URLs to the base page.
--
-- Headwords use the everyday Pidgin spelling (luau, ohana, kokua) — chosen 2026-10-02; the
-- ʻŌlelo Hawaiʻi spelling is recorded in origin ("From ʻŌlelo Hawaiʻi lūʻau."). Search
-- matches either spelling (services/dictionary-search.js).
--
--   aole pilikia     ← a'ole pilikia + 'a'ole pilikia
--   aina             ← 'āina + aina
--   ehu              ← ehu + 'ehu
--   ohana            ← ohana + 'ohana
--   ono              ← ono + 'ono
--   ulu              ← ulu + 'ulu
--   da aina          ← da aina + "da aina"
--   chee hoo         ← chee hoo + chee-hoo
--   da bes'!         ← da bes'! + da bes
--   faamolemole      ← faamolemole + fa'amolemole
--   ho, brah         ← ho, brah + ho brah
--   how you figgah?  ← how you figgah? + how you figgah
--   kamaaina         ← kamaʻāina + kama'āina
--   kokua            ← kōkua + kokua
--   kulolo           ← kulolo + kūlolo
--   lanai            ← lanai + lānai
--   luau             ← luau + lū'au
--   mo' bettah       ← mo' bettah + mo bettah
--   nene             ← nene + nēnē
--   no ka oi         ← nō ka ʻoi + no ka 'oi + no ka oi
--   pake             ← pake + pākē
--   poho             ← pohō + poho
--   shoots, brah!    ← shoots, brah! + shoots brah
--
-- Also: tūtū gains "grandma"/"grandpa" (13 searches for grandma found nothing), and paʻu
-- (skirt) loses "finished"/"done", which belong to pau.
--
-- Every row touched is first copied to dictionary_entries_merged, so this can be undone.
-- Every UPDATE/DELETE is keyed on id AND the current headword: a row edited since this was
-- drafted (2026-10-02) is skipped rather than overwritten. Runs as one transaction.
-- Afterwards: node tools/data/generate-embeddings.js (merged rows changed text).

BEGIN;

CREATE TABLE IF NOT EXISTS public.dictionary_entries_merged (
    LIKE public.dictionary_entries,
    merge_role TEXT NOT NULL,          -- 'kept' (pre-merge copy) or 'removed'
    merged_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dictionary_entries_merged ENABLE ROW LEVEL SECURITY;

INSERT INTO public.dictionary_entries_merged
SELECT de.*, CASE WHEN de.id IN ('6792256e-1d9b-4c5b-b890-dd47534eb363', 'ina_309', 'c51cf6ea-9ff6-48f7-99d5-4dfd294f41a8', '4f3c41b6-6e39-46e7-8db6-b4aa8b81bbaf', 'a9e7c36e-997e-4d8d-ade3-691011f1269b', '9788e65d-6fa5-4b4d-bcea-e846d6991c47', 'bfc903ea-291f-4e6f-93ba-b46d85c3a7e2', 'chee_hoo_031', 'da_bes_513', '84b11693-97a3-4ae9-b791-3fde62b0a724', 'ho_brah_7023', '62991bc1-9691-49e2-b47c-32d2c27e1d24', '188f904d-517f-4583-916d-1c00ef4b96f1', 'kokua_096', '8ba5ca85-c972-4585-8e0d-0563940e7faa', '48087b9f-c6b1-4a02-b876-56fa16f8a8e2', '866e09a5-4334-40ae-8e53-4d93790740ab', 'mo_bettah_122', '6638792a-8835-4453-ba79-8938696fcc99', '1dfdb3dd-11d0-4a8d-852c-0506a9fa3073', '6a4a9571-5987-4e7d-b76b-769b2258a8f4', 'poh_380', 'shoots_brah_511') THEN 'kept' ELSE 'removed' END, now()
FROM public.dictionary_entries de
WHERE de.id IN ('6792256e-1d9b-4c5b-b890-dd47534eb363', 'aole_pilikia_308', 'ina_309', '1cb7e95f-dbd9-4a12-bed8-1a4547173ac1', 'c51cf6ea-9ff6-48f7-99d5-4dfd294f41a8', 'ehu_329', '4f3c41b6-6e39-46e7-8db6-b4aa8b81bbaf', 'ohana_3008', 'a9e7c36e-997e-4d8d-ade3-691011f1269b', 'ono_1011', '9788e65d-6fa5-4b4d-bcea-e846d6991c47', 'ulu_7021', 'bfc903ea-291f-4e6f-93ba-b46d85c3a7e2', '5657115a-0cc6-46b5-912f-88d4bcac5eb1', 'chee_hoo_031', '875f6955-f611-4b40-af5d-131ff391468b', 'da_bes_513', 'a19a138f-12a8-4dab-87f9-1e1e6364f269', '84b11693-97a3-4ae9-b791-3fde62b0a724', 'faamolemole_334', 'ho_brah_7023', '8b4b6252-26b3-4816-9fff-b7a3a3b67332', '62991bc1-9691-49e2-b47c-32d2c27e1d24', 'how_you_figgah_254', '188f904d-517f-4583-916d-1c00ef4b96f1', 'kamaaina_1010', 'kokua_096', '6a918415-ad32-45b3-a5a7-629af041ebdd', '8ba5ca85-c972-4585-8e0d-0563940e7faa', 'kulolo_3005', '48087b9f-c6b1-4a02-b876-56fa16f8a8e2', 'lanai_618', '866e09a5-4334-40ae-8e53-4d93790740ab', 'luau_1019', 'mo_bettah_122', '5d321ac5-f5cf-46af-8741-8d0d5286ead7', '6638792a-8835-4453-ba79-8938696fcc99', 'nene_631', '1dfdb3dd-11d0-4a8d-852c-0506a9fa3073', 'no_ka_oi_373', '0d0e2b77-4306-4835-9894-eceab5dfcbc4', '6a4a9571-5987-4e7d-b76b-769b2258a8f4', 'pake_3013', 'poh_380', '5a27ee35-8beb-4e66-861e-7589ec913ee5', 'shoots_brah_511', 'b428a27f-fb6f-4ad3-964b-0409324b7e3b', 'tutu_1009', 'pau_4013');

-- aole-pilikia: keep 6792256e-1d9b-4c5b-b890-dd47534eb363 (a'ole pilikia); merge aole_pilikia_308 ('a'ole pilikia)
UPDATE public.dictionary_entries SET
    pidgin = 'aole pilikia',
    english = ARRAY['no problem', 'you''re welcome', 'no trouble']::text[],
    examples = ARRAY['Mahalo! - A''ole pilikia.', 'Eh, I wen'' aks fo'' help, an'' a''ole pilikia, da guy wen'' do it right away!', 'You drop yo'' phone? A''ole pilikia, I pick ''em up fo'' you.', '''A''ole pilikia brah', 'Mahalo for da help. ''A''ole pilikia!', 'You dropped your keys? ''A''ole pilikia, I got ''em.']::text[],
    tags = ARRAY['polite', 'response', 'expressions', 'hawaiian']::text[],
    frequency = 'high',
    audio_example = 'Eh, I wen'' aks fo'' help, an'' a''ole pilikia, da guy wen'' do it right away!',
    origin = 'From ʻŌlelo Hawaiʻi ʻaʻole pilikia. This Pidgin phrase directly translates to ''no problem'' from Hawaiian. It reflects the laid-back, accommodating nature of Hawaiian culture.',
    pronunciation = 'ah-OH-leh pee-lee-KEE-ah',
    updated_at = now()
WHERE id = '6792256e-1d9b-4c5b-b890-dd47534eb363' AND pidgin = 'a''ole pilikia';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('aole_pilikia_308', '''a''ole pilikia'));

-- aina: keep ina_309 ('āina); merge 1cb7e95f-dbd9-4a12-bed8-1a4547173ac1 (aina)
UPDATE public.dictionary_entries SET
    pidgin = 'aina',
    english = ARRAY['land', 'earth', 'the land', 'the earth', 'that which nourishes']::text[],
    examples = ARRAY['Malama da ''āina', 'aina stay the land', 'We gotta protect da ''āina.', 'Da love for da ''āina is strong.', 'We gotta take care of da aina.', 'Da aina stay beautiful today.']::text[],
    tags = ARRAY['nature', 'hawaiian', 'cultural', 'culture', 'hawaii']::text[],
    frequency = 'medium',
    audio_example = '''Āina.',
    origin = 'From ʻŌlelo Hawaiʻi ʻāina. This is a direct borrowing from the Hawaiian language, representing the deep connection to the land.',
    pronunciation = 'AH-ee-nah',
    updated_at = now()
WHERE id = 'ina_309' AND pidgin = '''āina';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('1cb7e95f-dbd9-4a12-bed8-1a4547173ac1', 'aina'));

-- ehu: keep c51cf6ea-9ff6-48f7-99d5-4dfd294f41a8 (ehu); merge ehu_329 ('ehu)
UPDATE public.dictionary_entries SET
    pidgin = 'ehu',
    english = ARRAY['reddish hair', 'sandy haired', 'spray']::text[],
    examples = ARRAY['He one ehu boy, always in da sun.', 'Da keiki get ehu hair from swimmin'' in da ocean all day.', 'Eh, dat aunty gotta real nice ehu color, like da sunset.', 'Get ''ehu hair', 'Her hair get dat ''ehu color, so pretty.', 'Da sun make my hair get a little ''ehu.']::text[],
    tags = ARRAY['descriptions', 'hawaiian']::text[],
    frequency = 'medium',
    audio_example = 'Eh, dat aunty gotta real nice ehu color, like da sunset.',
    origin = 'From ʻŌlelo Hawaiʻi ʻehu. The term ''ehu'' originates from the Hawaiian language, where it describes a reddish hue. It reflects the influence of Polynesian and other cultures on the islands.',
    pronunciation = 'EH-hoo',
    updated_at = now()
WHERE id = 'c51cf6ea-9ff6-48f7-99d5-4dfd294f41a8' AND pidgin = 'ehu';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('ehu_329', '''ehu'));

-- ohana: keep 4f3c41b6-6e39-46e7-8db6-b4aa8b81bbaf (ohana); merge ohana_3008 ('ohana)
UPDATE public.dictionary_entries SET
    pidgin = 'ohana',
    english = ARRAY['family', 'kinship', 'social group', 'extended family', 'close friends']::text[],
    examples = ARRAY['Ohana means family.', 'My ohana going da beach today.', 'We stay ohana, we gotta help each other.']::text[],
    tags = ARRAY['family', 'values', 'people', 'hawaiian', 'cultural', 'expressions']::text[],
    frequency = 'very_high',
    audio_example = 'My ohana going da beach today.',
    origin = 'From ʻŌlelo Hawaiʻi ʻohana. The concept of "ohana" is deeply rooted in traditional Hawaiian culture, reflecting the values of interconnectedness, love, and care for one another.',
    pronunciation = 'oh-HAH-nah',
    updated_at = now()
WHERE id = '4f3c41b6-6e39-46e7-8db6-b4aa8b81bbaf' AND pidgin = 'ohana';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('ohana_3008', '''ohana'));

-- ono: keep a9e7c36e-997e-4d8d-ade3-691011f1269b (ono); merge ono_1011 ('ono)
UPDATE public.dictionary_entries SET
    pidgin = 'ono',
    english = ARRAY['delicious', 'tasty', 'good']::text[],
    examples = ARRAY['This plate lunch stay so ono.', 'Da poke bowl was ono, brah!', 'Eh, dis shave ice ono, gotta get one!', 'This poke stay so ''ono!', 'Da poke stay ono!']::text[],
    tags = ARRAY['praise', 'food', 'hawaiian', 'descriptions']::text[],
    frequency = 'very_high',
    audio_example = 'Da poke bowl was ono, brah!',
    origin = 'From ʻŌlelo Hawaiʻi ʻono. The word "ono" comes directly from the Hawaiian language, where it also means delicious or tasty. It''s a fundamental part of the local vocabulary, reflecting the importance of food and enjoyment in Hawaiian culture.',
    pronunciation = 'OH-no',
    updated_at = now()
WHERE id = 'a9e7c36e-997e-4d8d-ade3-691011f1269b' AND pidgin = 'ono';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('ono_1011', '''ono'));

-- ulu: keep 9788e65d-6fa5-4b4d-bcea-e846d6991c47 (ulu); merge ulu_7021 ('ulu)
UPDATE public.dictionary_entries SET
    pidgin = 'ulu',
    english = ARRAY['breadfruit']::text[],
    examples = ARRAY['Steamed ulu stay so ono with butter.', 'Da ulu tree plenny big, gotta watch out fo'' fallin'' fruit!', 'You like try some ulu poi? It''s a real local kine treat.', 'We cooking ''ulu tonight', 'Ulu stay ready fo pick']::text[],
    tags = ARRAY['food', 'nature', 'hawaiian', 'fruit']::text[],
    frequency = 'medium',
    audio_example = 'Da ulu tree plenny big, gotta watch out fo'' fallin'' fruit!',
    origin = 'From ʻŌlelo Hawaiʻi ʻulu. Ulu was brought to Hawai''i by Polynesian voyagers, and it became a vital part of the Hawaiian diet and culture, symbolizing abundance and sustainability.',
    pronunciation = 'OO-loo',
    updated_at = now()
WHERE id = '9788e65d-6fa5-4b4d-bcea-e846d6991c47' AND pidgin = 'ulu';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('ulu_7021', '''ulu'));

-- da-aina: keep bfc903ea-291f-4e6f-93ba-b46d85c3a7e2 (da aina); merge 5657115a-0cc6-46b5-912f-88d4bcac5eb1 ("da aina")
UPDATE public.dictionary_entries SET
    pidgin = 'da aina',
    english = ARRAY['the land', 'the earth', 'the country']::text[],
    examples = ARRAY['We gotta malama da aina.', 'Da aina give us everything we need.', 'Eh, dis aina so beautiful, brah.', 'We gotta take care of da aina, yeah?']::text[],
    tags = ARRAY['land', 'nature', 'responsibility', 'earth', 'hawaii', 'place', 'culture']::text[],
    frequency = 'medium',
    audio_example = NULL,
    origin = 'Hawaiian',
    pronunciation = 'dah EYE-nah',
    updated_at = now()
WHERE id = 'bfc903ea-291f-4e6f-93ba-b46d85c3a7e2' AND pidgin = 'da aina';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('5657115a-0cc6-46b5-912f-88d4bcac5eb1', '"da aina"'));

-- chee-hoo: keep chee_hoo_031 (chee hoo); merge 875f6955-f611-4b40-af5d-131ff391468b (chee-hoo)
UPDATE public.dictionary_entries SET
    pidgin = 'chee hoo',
    english = ARRAY['expression of joy', 'excitement', 'exclamation of excitement', 'woohoo', 'yeah', 'joyful shout', 'celebratory cry']::text[],
    examples = ARRAY['Chee hoo! We going Vegas!', 'Chee-hoo! We going beach!', 'We won da game! Chee-hoo!', 'Chee-hoo! Party tonight!']::text[],
    tags = ARRAY['expressions', 'celebration', 'shout', 'joy']::text[],
    frequency = 'medium',
    audio_example = 'Chee hoo, da waves stay pumping!',
    origin = 'Local expression',
    pronunciation = 'CHEE-hoo',
    updated_at = now()
WHERE id = 'chee_hoo_031' AND pidgin = 'chee hoo';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('875f6955-f611-4b40-af5d-131ff391468b', 'chee-hoo'));

-- da-bes: keep da_bes_513 (da bes'!); merge a19a138f-12a8-4dab-87f9-1e1e6364f269 (da bes)
UPDATE public.dictionary_entries SET
    pidgin = 'da bes''!',
    english = ARRAY['the best!', 'awesome!', 'excellent!', 'the greatest']::text[],
    examples = ARRAY['Dis grindz is da bes''!', 'Your new ride is da bes''!', 'Ho, da bes'' waves today!', 'This poke is da bes''!', 'You da bes, brah!', 'Dis shave ice is da bes in town.']::text[],
    tags = ARRAY['expressions', 'praise', 'compliment', 'superlative']::text[],
    frequency = 'high',
    audio_example = NULL,
    origin = 'English',
    pronunciation = 'dah-BES',
    updated_at = now()
WHERE id = 'da_bes_513' AND pidgin = 'da bes''!';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('a19a138f-12a8-4dab-87f9-1e1e6364f269', 'da bes'));

-- faamolemole: keep 84b11693-97a3-4ae9-b791-3fde62b0a724 (faamolemole); merge faamolemole_334 (fa'amolemole)
UPDATE public.dictionary_entries SET
    pidgin = 'faamolemole',
    english = ARRAY['please', 'please (Samoan)']::text[],
    examples = ARRAY['faamolemole stay please', 'Faamolemole, can you pass da kine?', 'Eh brah, faamolemole, help me wit dis, yeah?', 'Fa''amolemole help me', 'Can you pass the poi, faamolemole?']::text[],
    tags = ARRAY['samoan', 'polite', 'expressions', 'greetings']::text[],
    frequency = 'medium',
    audio_example = 'Faamolemole, can you pass da kine?',
    origin = 'The word''s presence in Hawaiian Pidgin reflects the significant Samoan population and cultural exchange within the islands. It highlights the interconnectedness of Polynesian cultures in Hawaii.',
    pronunciation = 'fah-ah-moh-leh-MOH-leh',
    updated_at = now()
WHERE id = '84b11693-97a3-4ae9-b791-3fde62b0a724' AND pidgin = 'faamolemole';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('faamolemole_334', 'fa''amolemole'));

-- ho-brah: keep ho_brah_7023 (ho, brah); merge 8b4b6252-26b3-4816-9fff-b7a3a3b67332 (ho brah)
UPDATE public.dictionary_entries SET
    pidgin = 'ho, brah',
    english = ARRAY['wow', 'hey', 'listen', 'check this out', 'wow man', 'hey brother']::text[],
    examples = ARRAY['Ho, brah! You see dat?', 'Ho, brah, you see dat sunset?', 'Ho, brah, I wen'' win da lottery!', 'Ho brah, you see dat wave?', 'Ho brah, long time no see!']::text[],
    tags = ARRAY['expressions', 'exclamations', 'common', 'greeting', 'surprise']::text[],
    frequency = 'high',
    audio_example = 'Ho, brah',
    origin = 'A quintessential Pidgin phrase, "ho" is a general interjection, and "brah" is a term of camaraderie, reflecting the close-knit community spirit of Hawaii.',
    pronunciation = 'HO, BRAH',
    updated_at = now()
WHERE id = 'ho_brah_7023' AND pidgin = 'ho, brah';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('8b4b6252-26b3-4816-9fff-b7a3a3b67332', 'ho brah'));

-- how-you-figgah: keep 62991bc1-9691-49e2-b47c-32d2c27e1d24 (how you figgah?); merge how_you_figgah_254 (how you figgah)
UPDATE public.dictionary_entries SET
    pidgin = 'how you figgah?',
    english = ARRAY['how is that possible?', 'how do you figure?']::text[],
    examples = ARRAY['He said he won da lottery. How you figgah?', 'Da car no start. How you figgah dat?', 'She wen'' tell me she can fly. How you figgah, brah?', 'How you figgah he did dat?', 'How you figgah da car broke down again?', 'How you figgah, no mo'' food left?']::text[],
    tags = ARRAY['general', 'slang', 'expressions', 'english']::text[],
    frequency = 'medium',
    audio_example = 'She wen'' tell me she can fly. How you figgah, brah?',
    origin = 'This phrase is a direct translation from English, but it has become a staple in Hawaiian Pidgin, reflecting the local way of questioning and reacting to surprising information.',
    pronunciation = 'HOW you FIG-gah',
    updated_at = now()
WHERE id = '62991bc1-9691-49e2-b47c-32d2c27e1d24' AND pidgin = 'how you figgah?';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('how_you_figgah_254', 'how you figgah'));

-- kamaaina: keep 188f904d-517f-4583-916d-1c00ef4b96f1 (kamaʻāina); merge kamaaina_1010 (kama'āina)
UPDATE public.dictionary_entries SET
    pidgin = 'kamaaina',
    english = ARRAY['local resident', 'child of the land', 'longtime resident', 'native-born']::text[],
    examples = ARRAY['Do you have a kamaʻāina discount?', 'Eh, you stay kamaʻāina, yeah? You know da best shave ice place?', 'My tutu stay kamaʻāina, she know all da secret spots fo'' fish.', 'Kama''aina rates for locals only', 'Kama''āina discount for locals', 'Get kamaaina discount']::text[],
    tags = ARRAY['local', 'identity', 'people', 'hawaiian', 'cultural', 'expressions']::text[],
    frequency = 'very_high',
    audio_example = 'Eh, you stay kamaʻāina, yeah? You know da best shave ice place?',
    origin = 'From ʻŌlelo Hawaiʻi kamaʻāina. The term comes from the Hawaiian language, literally meaning "child of the land." It reflects the deep connection between the people and the ʻāina (land).',
    pronunciation = 'kah-mah-EYE-nah',
    updated_at = now()
WHERE id = '188f904d-517f-4583-916d-1c00ef4b96f1' AND pidgin = 'kamaʻāina';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('kamaaina_1010', 'kama''āina'));

-- kokua: keep kokua_096 (kōkua); merge 6a918415-ad32-45b3-a5a7-629af041ebdd (kokua)
UPDATE public.dictionary_entries SET
    pidgin = 'kokua',
    english = ARRAY['help', 'assistance', 'cooperation']::text[],
    examples = ARRAY['Mahalo fo your kokua', 'Need kōkua?', 'Mahalo for your kokua.', 'We need some kokua over here.']::text[],
    tags = ARRAY['expressions', 'hawaiian', 'actions']::text[],
    frequency = 'high',
    audio_example = 'Need kokua moving?',
    origin = 'From ʻŌlelo Hawaiʻi kōkua.',
    pronunciation = 'koh-KOO-ah',
    updated_at = now()
WHERE id = 'kokua_096' AND pidgin = 'kōkua';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('6a918415-ad32-45b3-a5a7-629af041ebdd', 'kokua'));

-- kulolo: keep 8ba5ca85-c972-4585-8e0d-0563940e7faa (kulolo); merge kulolo_3005 (kūlolo)
UPDATE public.dictionary_entries SET
    pidgin = 'kulolo',
    english = ARRAY['taro dessert', 'Hawaiian pudding', 'steamed taro and coconut pudding', 'a type of Hawaiian dessert']::text[],
    examples = ARRAY['We went buy fresh kulolo from da farmers market.', 'My grandma make da best kulolo.', 'Aunty make da best kūlolo', 'kulolo stay a type of Hawaiian dessert']::text[],
    tags = ARRAY['food', 'hawaiian', 'desserts', 'cultural']::text[],
    frequency = 'medium',
    audio_example = NULL,
    origin = 'From ʻŌlelo Hawaiʻi kūlolo.',
    pronunciation = 'koo-LOH-loh',
    updated_at = now()
WHERE id = '8ba5ca85-c972-4585-8e0d-0563940e7faa' AND pidgin = 'kulolo';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('kulolo_3005', 'kūlolo'));

-- lanai: keep 48087b9f-c6b1-4a02-b876-56fa16f8a8e2 (lanai); merge lanai_618 (lānai)
UPDATE public.dictionary_entries SET
    pidgin = 'lanai',
    english = ARRAY['porch', 'balcony', 'patio', 'veranda']::text[],
    examples = ARRAY['lanai stay porch', 'Eh brah, come sit on da lanai, yeah? Get plenny good pupus.', 'She like relax on da lanai wit'' her book, watchin'' da sunset.', 'lanai stay veranda, porch', 'Sit on da lānai']::text[],
    tags = ARRAY['hawaiian', 'home', 'places', 'architecture']::text[],
    frequency = 'medium',
    audio_example = 'Eh brah, come sit on da lanai, yeah? Get plenny good pupus.',
    origin = 'From ʻŌlelo Hawaiʻi lānai. The term "lanai" comes directly from the Hawaiian language, originally referring to a veranda or porch. Its widespread use in Hawaii reflects the importance of outdoor living in the local culture.',
    pronunciation = 'lah-NAI',
    updated_at = now()
WHERE id = '48087b9f-c6b1-4a02-b876-56fa16f8a8e2' AND pidgin = 'lanai';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('lanai_618', 'lānai'));

-- luau: keep 866e09a5-4334-40ae-8e53-4d93790740ab (luau); merge luau_1019 (lū'au)
UPDATE public.dictionary_entries SET
    pidgin = 'luau',
    english = ARRAY['Hawaiian feast', 'party', 'taro leaves']::text[],
    examples = ARRAY['We going to one luau tonight.', 'Da luau was so ono, I wen'' eat ''til I couldn''t move!', 'You tink dey goin'' serve kalua pig at da luau?', 'Going to da lū''au tonight', 'We going one luau dis weekend', 'Going to da big lūʻau']::text[],
    tags = ARRAY['party', 'food', 'cultural', 'hawaiian', 'celebrations']::text[],
    frequency = 'high',
    audio_example = 'You tink dey goin'' serve kalua pig at da luau?',
    origin = 'From ʻŌlelo Hawaiʻi lūʻau. The term ''luau'' comes from the Hawaiian word for the taro plant''s leaves, which are often cooked in the feast. The luau evolved from ancient Hawaiian practices of communal feasting and celebration.',
    pronunciation = 'LOO-ow',
    updated_at = now()
WHERE id = '866e09a5-4334-40ae-8e53-4d93790740ab' AND pidgin = 'luau';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('luau_1019', 'lū''au'));

-- mo-bettah: keep mo_bettah_122 (mo' bettah); merge 5d321ac5-f5cf-46af-8741-8d0d5286ead7 (mo bettah)
UPDATE public.dictionary_entries SET
    pidgin = 'mo'' bettah',
    english = ARRAY['much better', 'far superior', 'preferable']::text[],
    examples = ARRAY['Dis one mo bettah', 'Dis mo'' bettah', 'Going early morning is mo bettah, no get traffic.', 'Homemade poke stay mo bettah than store-bought.']::text[],
    tags = ARRAY['expressions', 'english', 'slang', 'grammar', 'everyday']::text[],
    frequency = 'high',
    audio_example = 'Da new place stay mo bettah',
    origin = 'English "more better"',
    pronunciation = 'moh-BET-tah',
    updated_at = now()
WHERE id = 'mo_bettah_122' AND pidgin = 'mo'' bettah';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('5d321ac5-f5cf-46af-8741-8d0d5286ead7', 'mo bettah'));

-- nene: keep 6638792a-8835-4453-ba79-8938696fcc99 (nene); merge nene_631 (nēnē)
UPDATE public.dictionary_entries SET
    pidgin = 'nene',
    english = ARRAY['the Hawaiian goose', 'state bird of Hawaii', 'the native Hawaiian goose', 'Hawaiian goose']::text[],
    examples = ARRAY['I saw one nene by da road', 'Da nene stay walkin'' all ova da golf course, brah.', 'Eh, you hear dat? Nene make plenny noise, yeah?', 'nene stay the native Hawaiian goose', 'See da nēnē at park']::text[],
    tags = ARRAY['bird', 'nature', 'hawaiian', 'animals']::text[],
    frequency = 'medium',
    audio_example = 'Da nene stay walkin'' all ova da golf course, brah.',
    origin = 'From ʻŌlelo Hawaiʻi nēnē. The word "nene" comes directly from the Hawaiian language, where it is the name for this unique species of goose. The bird''s call is said to resemble the sound "nene."',
    pronunciation = 'NAY-nay',
    updated_at = now()
WHERE id = '6638792a-8835-4453-ba79-8938696fcc99' AND pidgin = 'nene';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('nene_631', 'nēnē'));

-- no-ka-oi: keep 1dfdb3dd-11d0-4a8d-852c-0506a9fa3073 (nō ka ʻoi); merge no_ka_oi_373 (no ka 'oi), 0d0e2b77-4306-4835-9894-eceab5dfcbc4 (no ka oi)
UPDATE public.dictionary_entries SET
    pidgin = 'no ka oi',
    english = ARRAY['the best', 'supreme', 'number one', 'finest']::text[],
    examples = ARRAY['Maui nō ka ʻoi!', 'Da food at da luau, nō ka ʻoi, brah!', 'Eh, dis shave ice place, nō ka ʻoi, you gotta try ''em!', 'Dis plate lunch stay no ka oi.']::text[],
    tags = ARRAY['praise', 'location', 'expressions', 'hawaiian']::text[],
    frequency = 'high',
    audio_example = 'Da food at da luau, nō ka ʻoi, brah!',
    origin = 'From ʻŌlelo Hawaiʻi nō ka ʻoi. This phrase originates from the Hawaiian language, where it literally translates to ''the best'' or ''the most''. It has been adopted into Pidgin to express superlative praise and is deeply rooted in local pride.',
    pronunciation = 'noh kah OY',
    updated_at = now()
WHERE id = '1dfdb3dd-11d0-4a8d-852c-0506a9fa3073' AND pidgin = 'nō ka ʻoi';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('no_ka_oi_373', 'no ka ''oi'), ('0d0e2b77-4306-4835-9894-eceab5dfcbc4', 'no ka oi'));

-- pake: keep 6a4a9571-5987-4e7d-b76b-769b2258a8f4 (pake); merge pake_3013 (pākē)
UPDATE public.dictionary_entries SET
    pidgin = 'pake',
    english = ARRAY['Chinese person', 'stingy (derogatory)', 'of Chinese origin', 'of Chinese descent']::text[],
    examples = ARRAY['He so pake, he no like spend money.', 'Da pake grind fo'' da best deals, yeah?', 'Eh, dat pake always tryin'' bargain, brah.', 'My tūtū was pāke', 'Pake stay of Chinese descent', 'My grandma pākē']::text[],
    tags = ARRAY['ethnicity', 'insult', 'people', 'hawaiian', 'cultural', 'chinese']::text[],
    frequency = 'high',
    audio_example = 'Eh, dat pake always tryin'' bargain, brah.',
    origin = 'From ʻŌlelo Hawaiʻi pākē. The term "pake" originates from the Chinese word "bak," meaning "white" or "pale," likely referring to the skin tone of Chinese immigrants compared to native Hawaiians. It reflects historical interactions and perceptions within the diverse ethnic landscape of Hawai''i.',
    pronunciation = 'PAH-keh',
    updated_at = now()
WHERE id = '6a4a9571-5987-4e7d-b76b-769b2258a8f4' AND pidgin = 'pake';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('pake_3013', 'pākē'));

-- poho: keep poh_380 (pohō); merge 5a27ee35-8beb-4e66-861e-7589ec913ee5 (poho)
UPDATE public.dictionary_entries SET
    pidgin = 'poho',
    english = ARRAY['waste', 'loss', 'useless', 'wasteful', 'wasted', 'a pity']::text[],
    examples = ARRAY['Pohō money', 'poho stay useless, wasteful, wasted', 'Eh, dat car, pohō, gotta fix ''em.', 'Da game, pohō, we lost, yeah?', 'It''s poho to throw away good food.', 'Eh brah, da car get totaled, so much poho!']::text[],
    tags = ARRAY['expressions', 'hawaiian', 'cultural', 'negative', 'waste']::text[],
    frequency = 'medium',
    audio_example = 'Eh, dat car, pohō, gotta fix ''em.',
    origin = 'From ʻŌlelo Hawaiʻi pohō.',
    pronunciation = 'poh-HOH',
    updated_at = now()
WHERE id = 'poh_380' AND pidgin = 'pohō';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('5a27ee35-8beb-4e66-861e-7589ec913ee5', 'poho'));

-- shoots-brah: keep shoots_brah_511 (shoots, brah!); merge b428a27f-fb6f-4ad3-964b-0409324b7e3b (shoots brah)
UPDATE public.dictionary_entries SET
    pidgin = 'shoots, brah!',
    english = ARRAY['alright, brother!', 'okay, dude!', 'sounds good, bro!', 'alright friend', 'sounds good brother']::text[],
    examples = ARRAY['We go beach today? Shoots, brah!', 'Can you help me move? Shoots, brah!', 'Thanks for da ride. Shoots, brah!', 'You goin'' surf dis afternoon? Shoots, brah!', 'I get extra plate lunch fo'' you, shoots, brah!', 'Eh, we go beach? Shoots brah!']::text[],
    tags = ARRAY['expressions', 'agreement', 'slang', 'greetings']::text[],
    frequency = 'very_high',
    audio_example = 'You goin'' surf dis afternoon? Shoots, brah!',
    origin = 'This expression is a blend of the English word "shoots" (meaning "sounds good" or "okay") and the Pidgin term "brah," which is a term of endearment and camaraderie. It reflects the laid-back, friendly culture of Hawai''i.',
    pronunciation = 'SHOOTS, brah',
    updated_at = now()
WHERE id = 'shoots_brah_511' AND pidgin = 'shoots, brah!';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('b428a27f-fb6f-4ad3-964b-0409324b7e3b', 'shoots brah'));

-- tūtū: the English people type
UPDATE public.dictionary_entries SET english = ARRAY['grandmother', 'grandfather', 'grandparent', 'grandma', 'grandpa']::text[], updated_at = now()
WHERE id = 'tutu_1009' AND english = ARRAY['grandmother', 'grandfather', 'grandparent']::text[];

-- paʻu is the skirt; "finished"/"done" is pau
UPDATE public.dictionary_entries SET english = ARRAY['skirt', 'sarong']::text[], updated_at = now()
WHERE id = 'pau_4013' AND english = ARRAY['skirt', 'sarong', 'finished', 'done']::text[];

COMMIT;
