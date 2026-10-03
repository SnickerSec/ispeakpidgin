-- Merge 13 groups of duplicate dictionary entries: the same word spelled with and without a
-- space or hyphen (kau kau / kaukau, wiki wiki / wikiwiki), plus three headwords that were
-- already another entry's spelling variant (cheeehoo, chee hu, raja dat).
--
-- The audit's duplicate check compared word-page slugs, which differ for these (kau-kau vs
-- kaukau), so it reported 0. Each pair was two pages competing for one search.
--
-- Headwords approved 2026-10-03: keep the page Google already sends traffic to (90 days of
-- Search Console impressions), which is also the everyday Pidgin spelling (cf. 020).
--   imua ← i mua            rajah dat ← raja dat     make ← ma-ke
--   ai yah ← aiyah          wiki wiki ← wikiwiki     kalamai ← kala mai
--   moe moe ← moemoe        holo holo ← holoholo     kaukau ← kau kau
--   pipikaula ← pipi kaula  hana hou ← hanahou       okolehao ← okole hao
--   chee hoo ← cheeehoo + chee hu
-- Meanings, examples and tags are unioned; merged headwords become spelling_variants; generated
-- filler examples ("kala mai stay sorry") are dropped. Also:
--   - holo holo loses "red-striped fish"/"squirrelfish" (that is āholehole / ʻalaʻihi).
--   - kaukau's origin: Chinese Pidgin English chowchow, not Hawaiian ʻai.
--   - rajah ("okay") stops listing rajah dat / raja dat, a separate phrase, as its spellings.
-- server.js 301-redirects each removed word page to the kept one.
--
-- Every touched row is copied to dictionary_entries_merged first, so this can be undone. Keyed on
-- id AND headword, so a row edited since drafting is skipped. One transaction.
-- Afterwards: node tools/data/generate-embeddings.js

BEGIN;

INSERT INTO public.dictionary_entries_merged (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, audio_example, created_at, updated_at, fts, source_language, spelling_variants, merge_role, merged_at)
SELECT de.id, de.pidgin, de.english, de.category, de.pronunciation, de.examples, de.usage, de.origin, de.difficulty, de.frequency, de.tags, de.audio_example, de.created_at, de.updated_at, de.fts, de.source_language, de.spelling_variants,
       CASE WHEN de.id IN ('i_mua_355', '2291191f-7861-4cb9-bcbc-a2d21a1be47a', 'f925f755-15d4-42a5-b851-872e98102cb8', 'aiyah_005', 'wikiwiki_284', '941da83d-2760-4460-a537-72dbea7fecbb', 'moemoe_627', 'holoholo_071', 'kau_kau_092', 'pipi_kaula_635', '84afb94e-3bb4-4fb3-90ca-c5ae4b11aa7e', 'okole_hao_645', 'ddacd379-acc6-43ad-8e73-afbcd859b42e', 'chee_hu_217') THEN 'removed' ELSE 'kept' END, now()
FROM public.dictionary_entries de
WHERE de.id IN ('imua_260', 'i_mua_355', 'rajah_dat_1000', '2291191f-7861-4cb9-bcbc-a2d21a1be47a', 'make_111', 'f925f755-15d4-42a5-b851-872e98102cb8', 'ai_yah_197', 'aiyah_005', 'wiki_wiki_195', 'wikiwiki_284', 'd182a198-0531-4e27-b98a-c8597f76de11', '941da83d-2760-4460-a537-72dbea7fecbb', 'moe_moe_403', 'moemoe_627', 'holo_holo_902', 'holoholo_071', 'kaukau_3003', 'kau_kau_092', '446607a5-2beb-453c-b16a-b7d8eb53b8f8', 'pipi_kaula_635', 'hana_hou_062', '84afb94e-3bb4-4fb3-90ca-c5ae4b11aa7e', '7d8c73fb-47f5-4c23-8fa4-82450583fece', 'okole_hao_645', 'chee_hoo_031', 'ddacd379-acc6-43ad-8e73-afbcd859b42e', 'chee_hu_217', 'rajah_153');

-- imua ← i mua
UPDATE public.dictionary_entries SET
    english = ARRAY['forward', 'ahead', 'onward']::text[],
    examples = ARRAY['We going imua', 'Imua, gotta keep goin'', no give up!', 'We stay imua wit'' da project, almost pau!', 'I mua!', 'I mua! Let''s go!', 'I mua, we can do dis!']::text[],
    tags = ARRAY['expressions', 'hawaiian']::text[],
    spelling_variants = ARRAY['i mua']::text[],
    frequency = 'medium',
    audio_example = 'Imua, gotta keep goin'', no give up!',
    updated_at = now()
WHERE id = 'imua_260' AND pidgin = 'imua';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('i_mua_355', 'i mua'));

-- rajah dat ← raja dat
UPDATE public.dictionary_entries SET
    english = ARRAY['roger that', 'I understand', 'got it', 'I agree', 'that''s correct']::text[],
    examples = ARRAY['Rajah dat, I stay on it', 'I''ll pick you up at seven, rajah dat?', 'You understand da instructions? Rajah dat.', 'You going beach bumbye? Raja dat, I grab the cooler.', 'We meeting at Zippy''s at five? Raja dat, see you there.']::text[],
    tags = ARRAY['expressions', 'agreement', 'common', 'slang', 'expression', 'local talk']::text[],
    spelling_variants = ARRAY['raja dat']::text[],
    frequency = 'high',
    audio_example = 'I''ll pick you up at seven, rajah dat?',
    updated_at = now()
WHERE id = 'rajah_dat_1000' AND pidgin = 'rajah dat';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('2291191f-7861-4cb9-bcbc-a2d21a1be47a', 'raja dat'));

-- make ← ma-ke
UPDATE public.dictionary_entries SET
    english = ARRAY['dead', 'die', 'to die', 'broken']::text[],
    examples = ARRAY['Da bug stay make', 'Eh brah, da fish wen make las week.', 'No worry, da plant no go make, I wen water ''em.', 'My phone stay ma-ke.', 'The battery ma-ke already.']::text[],
    tags = ARRAY['slang', 'hawaiian', 'broken', 'status']::text[],
    spelling_variants = ARRAY['mahke', 'ma-ke']::text[],
    frequency = 'medium',
    audio_example = 'Eh brah, da fish wen make las week.',
    updated_at = now()
WHERE id = 'make_111' AND pidgin = 'make';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('f925f755-15d4-42a5-b851-872e98102cb8', 'ma-ke'));

-- ai yah ← aiyah
UPDATE public.dictionary_entries SET
    english = ARRAY['oops', 'expression of frustration', 'surprise']::text[],
    examples = ARRAY['Ai yah, I wen forget!', 'Ai yah! I forgot my wallet!', 'Ai yah, I wen'' spill my coffee!', 'Aiyah! I forgot my keys again', 'Aiyah! Dat was one big wave!', 'Aiyah, I didn''t know!']::text[],
    tags = ARRAY['expressions', 'chinese']::text[],
    spelling_variants = ARRAY['aiyah']::text[],
    frequency = 'medium',
    audio_example = 'Ai yah, I drop ''em!',
    updated_at = now()
WHERE id = 'ai_yah_197' AND pidgin = 'ai yah';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('aiyah_005', 'aiyah'));

-- wiki wiki ← wikiwiki
UPDATE public.dictionary_entries SET
    english = ARRAY['hurry up', 'fast', 'quickly', 'hurry']::text[],
    examples = ARRAY['Wiki wiki, we going be late', 'Wiki wiki, we gotta go!', 'Hurry up, wiki wiki!', 'Wikiwiki!', 'Drive wikiwiki, we late!', 'I gotta go wikiwiki to da store.']::text[],
    tags = ARRAY['expressions', 'hawaiian']::text[],
    spelling_variants = ARRAY['wikiwiki']::text[],
    frequency = 'medium',
    audio_example = 'Wiki wiki, we gotta go!',
    updated_at = now()
WHERE id = 'wiki_wiki_195' AND pidgin = 'wiki wiki';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('wikiwiki_284', 'wikiwiki'));

-- kalamai ← kala mai
UPDATE public.dictionary_entries SET
    english = ARRAY['sorry', 'excuse me', 'pardon', 'pardon me']::text[],
    examples = ARRAY['Kalamai, I didn''t mean to bump you.', 'Kalamai for being late.', 'Kala mai, I didn''t mean fo'' say dat.', 'Kala mai, can you help me wit'' dis?']::text[],
    tags = ARRAY['expressions', 'hawaiian', 'polite']::text[],
    spelling_variants = ARRAY['kala mai']::text[],
    frequency = 'medium',
    audio_example = 'Kala mai, I didn''t mean fo'' say dat.',
    usage = 'A polite way to say sorry, excuse me or pardon me: to apologize, or to get someone''s attention before asking for help.',
    updated_at = now()
WHERE id = 'd182a198-0531-4e27-b98a-c8597f76de11' AND pidgin = 'kalamai';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('941da83d-2760-4460-a537-72dbea7fecbb', 'kala mai'));

-- moe moe ← moemoe
UPDATE public.dictionary_entries SET
    english = ARRAY['sleepy', 'sleep', 'go to sleep (said to kids)']::text[],
    examples = ARRAY['I stay moe moe', 'Eh brah, I so moe moe, gotta go take one nap.', 'Da keiki stay moe moe, gotta put ''um to bed.', 'Eh, da keiki all ready moemoe, yeah?', 'I wen tell ''em, ''Moemoe now, gotta get plenny sleep!''']::text[],
    tags = ARRAY['descriptions', 'hawaiian', 'cultural']::text[],
    spelling_variants = ARRAY['moemoe']::text[],
    frequency = 'medium',
    audio_example = 'Eh brah, I so moe moe, gotta go take one nap.',
    usage = 'Sleepy, or sleep. Said of yourself ("I stay moe moe") and, especially to children, as "go moe moe" or "moemoe" for going to bed.',
    updated_at = now()
WHERE id = 'moe_moe_403' AND pidgin = 'moe moe';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('moemoe_627', 'moemoe'));

-- holo holo ← holoholo
UPDATE public.dictionary_entries SET
    english = ARRAY['aimless wandering', 'cruise around', 'to venture out', 'go cruising']::text[],
    examples = ARRAY['We go holo holo around town', 'Les go holoholo', 'You guys wanna holoholo dis weekend?', 'Let''s go holoholo down da coast, yeah?']::text[],
    tags = ARRAY['actions', 'hawaiian', 'activities']::text[],
    spelling_variants = ARRAY['holoholo']::text[],
    frequency = 'high',
    audio_example = 'You guys wanna holoholo dis weekend?',
    usage = 'To go out for a leisurely drive, walk or outing with no particular destination: cruising around for the fun of it.',
    updated_at = now()
WHERE id = 'holo_holo_902' AND pidgin = 'holo holo';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('holoholo_071', 'holoholo'));

-- kaukau ← kau kau
UPDATE public.dictionary_entries SET
    english = ARRAY['food', 'meal', 'to eat', 'eat']::text[],
    examples = ARRAY['Time fo'' kaukau!', 'I going make kaukau.', 'Time fo kau kau', 'Time fo'' kau kau, you guys hungry?', 'I wen'' kau kau da best plate lunch today, brah!']::text[],
    tags = ARRAY['food', 'chinese', 'actions']::text[],
    spelling_variants = ARRAY['kau kau']::text[],
    frequency = 'high',
    audio_example = 'Kaukau!',
    origin = 'From Chinese Pidgin English chowchow (food), brought to Hawaii in the plantation era; often written kau kau.',
    updated_at = now()
WHERE id = 'kaukau_3003' AND pidgin = 'kaukau';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('kau_kau_092', 'kau kau'));

-- pipikaula ← pipi kaula
UPDATE public.dictionary_entries SET
    english = ARRAY['Hawaiian cured beef flank', 'seasoned semi-dried beef jerky', 'dried beef, similar to beef jerky']::text[],
    examples = ARRAY['Pass da pipikaula, brah, dat beef so ono!', 'We brought poke and pipikaula to da beach.', 'You like some pipi kaula? Good pau hana snack.']::text[],
    tags = ARRAY['food', 'beef', 'pupu', 'traditional', 'cultural', 'hawaiian']::text[],
    spelling_variants = ARRAY['pipi kaula']::text[],
    frequency = 'high',
    audio_example = 'You like some pipi kaula? Good pau hana snack.',
    updated_at = now()
WHERE id = '446607a5-2beb-453c-b16a-b7d8eb53b8f8' AND pidgin = 'pipikaula';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('pipi_kaula_635', 'pipi kaula'));

-- hana hou ← hanahou
UPDATE public.dictionary_entries SET
    english = ARRAY['do it again', 'encore', 'one more time']::text[],
    examples = ARRAY['Hana hou! One more time!', 'Hana hou! Play dat song again!', 'Da keiki wen'' do good, hana hou!', 'The band was so good, everybody was screaming hanahou!', 'Da crowd stay yellin'' hanahou afta da show, yeah?', 'Hanahou, brah! Play dat song again!']::text[],
    tags = ARRAY['expressions', 'hawaiian', 'actions', 'cultural']::text[],
    spelling_variants = ARRAY['hanahou']::text[],
    frequency = 'medium',
    audio_example = 'Hana hou! Play dat song again!',
    updated_at = now()
WHERE id = 'hana_hou_062' AND pidgin = 'hana hou';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('84afb94e-3bb4-4fb3-90ca-c5ae4b11aa7e', 'hanahou'));

-- okolehao ← okole hao
UPDATE public.dictionary_entries SET
    english = ARRAY['traditional liquor', 'moonshine', 'Hawaiian ti root moonshine']::text[],
    examples = ARRAY['Dey used to make okolehao in da valley.', 'Eh brah, dis okolehao hit hard, gotta take it easy.', 'My tita''s grandpa used to make da best okolehao, secret recipe kine.', 'Da party gettin'' wild, plenny okole hao gettin'' pau!', 'Eh brah, you try dat okole hao? Real ono, but watch out, strong kine!']::text[],
    tags = ARRAY['food', 'cultural', 'hawaiian']::text[],
    spelling_variants = ARRAY['okole hao']::text[],
    frequency = 'medium',
    audio_example = 'Eh brah, dis okolehao hit hard, gotta take it easy.',
    updated_at = now()
WHERE id = '7d8c73fb-47f5-4c23-8fa4-82450583fece' AND pidgin = 'okolehao';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('okole_hao_645', 'okole hao'));

-- chee hoo ← cheeehoo + chee hu
UPDATE public.dictionary_entries SET
    english = ARRAY['expression of joy', 'excitement', 'exclamation of excitement', 'woohoo', 'yeah', 'joyful shout', 'celebratory cry', 'woo hoo']::text[],
    examples = ARRAY['Chee hoo! We going Vegas!', 'Chee-hoo! We going beach!', 'We won da game! Chee-hoo!', 'Chee-hoo! Party tonight!', 'Cheeehoo! We going beach today!', 'Cheeehoo! We won da championship!', 'Friday pau hana, cheeehoo!', 'Chee hu! Going Vegas!', 'Chee hu! We win!', 'Chee hu, da food so good!']::text[],
    tags = ARRAY['expressions', 'celebration', 'shout', 'joy', 'slang']::text[],
    spelling_variants = ARRAY['cheeehoo', 'chee-hoo', 'chee hu', 'cheehu']::text[],
    frequency = 'high',
    audio_example = 'Chee hoo, da waves stay pumping!',
    updated_at = now()
WHERE id = 'chee_hoo_031' AND pidgin = 'chee hoo';
DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (('ddacd379-acc6-43ad-8e73-afbcd859b42e', 'cheeehoo'), ('chee_hu_217', 'chee hu'));

-- rajah (okay) keeps its own entry; "rajah dat" is a separate phrase, so it is not a spelling of rajah
UPDATE public.dictionary_entries SET spelling_variants = ARRAY['raja']::text[], updated_at = now()
WHERE id = 'rajah_153' AND pidgin = 'rajah';

COMMIT;
