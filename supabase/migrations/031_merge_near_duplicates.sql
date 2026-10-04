-- Migration 031: merge 25 groups of near-duplicate dictionary entries
--
-- The duplicate check compares letters, so different spellings of one word (bumbai / bumbye,
-- shoots / shootz, liddat / lidat / l'dat) each kept their own entry and /word/ page. Found by
-- pairing entries within one or two edits (or with the same consonants) that share an English
-- meaning; checked by hand, and kalamai / e kala mai, cuzzo / cuz, geev 'um / get'um,
-- nai nai / ne ne and the "all ___" intensifiers were left alone as different words.
--
-- Headwords approved 2026-10-03: keep the page with Search Console impressions (90 days),
-- except aina and chance 'um, kept as the base forms over da aina and Eh, chance 'um.
--   goin ← going, a goin
--   bumbai ← bumbye
--   ballah head ← bolo head
--   k den ← kay den
--   nosey ← nosy
--   auē ← auwe
--   rubbah slippahs ← rubbah slippah
--   shame ← i shame
--   hammajang ← hamajang
--   planny ← plenny
--   bambucha ← bumboocha
--   hawaiian pick up lines ← hawaii pick up lines
--   make ass ← make a-ass
--   ass right ← das right
--   fo wat? ← fo what
--   menpachi ← mempachi
--   ova dere ← ova dea
--   shoots ← shootz
--   grindz ← grinds
--   braddah ← bruddah
--   liddat ← lidat, l'dat
--   cockaroach ← cockroach
--   zoris ← zori
--   aina ← da aina
--   chance 'um ← Eh, chance 'um
-- Meanings, examples and tags are unioned; merged headwords become spelling_variants; the kept
-- entry's pronunciation, usage and origin win, filled from a merged one when empty.
-- server.js 301-redirects each removed word page to the kept one (or its landing page).
--
-- Every touched row is copied to dictionary_entries_merged first, so this can be undone. Keyed
-- on id AND headword, so a row edited since drafting is skipped. One transaction.
-- Afterwards: node tools/data/generate-embeddings.js

BEGIN;

INSERT INTO public.dictionary_entries_merged (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, audio_example, created_at, updated_at, fts, source_language, spelling_variants, merge_role, merged_at)
SELECT de.id, de.pidgin, de.english, de.category, de.pronunciation, de.examples, de.usage, de.origin, de.difficulty, de.frequency, de.tags, de.audio_example, de.created_at, de.updated_at, de.fts, de.source_language, de.spelling_variants,
       CASE WHEN de.id IN ('going_1034', 'aae67687-ed78-4aee-b21a-78304a5406d8', 'bumbye_028', 'bolo_head_020', 'kay_den_1004', '12f957d5-608a-40f3-bfeb-354fe0903d9c', 'auwe_504', 'bd487239-610e-4aff-8624-96755799e0ae', 'i_shame_076', 'hamajang_059', 'plenny_1014', 'bumboocha_319', '7679c318-56b0-4d73-affa-9765bb929594', 'c4cdd14b-c4b9-4d77-b88f-4624ef6075f8', 'bf9f5d70-4746-48b3-9a6a-64974bcc7c31', 'fo_what_236', 'c0262c83-453c-4ad8-9541-61291c7a4fe1', 'ova_dea_140', 'shootz_283', 'grinds_055', 'bruddah_429', 'lidat_1015', 'ldat_904', '61ac1e78-c1fa-4e2b-ba87-c04302f8e706', 'zori_285', 'bfc903ea-291f-4e6f-93ba-b46d85c3a7e2', 'chance_um_phrase') THEN 'removed' ELSE 'kept' END, now()
FROM public.dictionary_entries de
WHERE de.id IN ('goin_240', 'going_1034', 'aae67687-ed78-4aee-b21a-78304a5406d8', 'bumbai_027', 'bumbye_028', 'ballah_head_507', 'bolo_head_020', 'k_den_082', 'kay_den_1004', '1f6f0c72-f75c-4007-ba25-04414f2dd39d', '12f957d5-608a-40f3-bfeb-354fe0903d9c', 'au_299', 'auwe_504', 'rubbah_slippahs_155', 'bd487239-610e-4aff-8624-96755799e0ae', 'shame_157', 'i_shame_076', 'hammajang_282', 'hamajang_059', 'planny_379', 'plenny_1014', '93129535-031c-401b-ac0f-0978ac49b830', 'bumboocha_319', '7a970145-6136-4c28-bf05-6ea516aaf88a', '7679c318-56b0-4d73-affa-9765bb929594', 'ae60661c-8292-4216-9774-566a3f442372', 'c4cdd14b-c4b9-4d77-b88f-4624ef6075f8', 'ass_right_013', 'bf9f5d70-4746-48b3-9a6a-64974bcc7c31', 'fo_wat_337', 'fo_what_236', 'f7bd72ed-84fa-4eb8-a89d-1e3c4758a0ef', 'c0262c83-453c-4ad8-9541-61291c7a4fe1', 'ova_dere_375', 'ova_dea_140', 'shoots_509', 'shootz_283', 'grindz_344', 'grinds_055', 'braddah_318', 'bruddah_429', 'liddat_104', 'lidat_1015', 'ldat_904', 'cockaroach_036', '61ac1e78-c1fa-4e2b-ba87-c04302f8e706', 'zoris_6006', 'zori_285', 'ina_309', 'bfc903ea-291f-4e6f-93ba-b46d85c3a7e2', 'chance_um_1027', 'chance_um_phrase');

-- goin ← going, a goin
UPDATE public.dictionary_entries SET
    english = ARRAY['going', 'will', 'gonna', 'going to', 'about to']::text[],
    examples = ARRAY['We goin beach', 'I goin'' to da beach tomorrow.', 'We goin'' eat dinner at seven.', 'I going go beach later', 'I going eat latah.', 'She going to da store.', 'I a goin'' store, you like something?', 'Eh brah, I a goin'' surf after school, you wanna come?', 'She a goin'' cry if you tell her dat.']::text[],
    tags = ARRAY['expressions', 'english', 'grammar', 'common', 'action']::text[],
    spelling_variants = ARRAY['going', 'a goin']::text[],
    frequency = 'high',
    pronunciation = 'GO-in',
    usage = 'This is the Pidgin form of "going," used to indicate a future action or intention. It''s a common way to express plans or arrangements.',
    origin = 'This is a simplified pronunciation of the English word "going," reflecting the way it''s commonly spoken in Pidgin.',
    audio_example = 'I goin'' to da beach tomorrow.',
    updated_at = now()
WHERE id = 'goin_240' AND pidgin = 'goin';

-- bumbai ← bumbye
UPDATE public.dictionary_entries SET
    english = ARRAY['later', 'by and by']::text[],
    examples = ARRAY['Bumbai you learn', 'If you no listen, bumbai you goin'' get in trouble.', 'Bumbai you goin'' understand.', 'See you bumbye', 'I goin'' do dat bumbye, okay?', 'See you bumbye, yeah?']::text[],
    tags = ARRAY['expressions', 'english']::text[],
    spelling_variants = ARRAY['bombai', 'bumbye']::text[],
    frequency = 'medium',
    pronunciation = 'BUM-bye',
    usage = 'Means ''later'' or ''eventually,'' often implying a consequence or result. It suggests that something will happen in the future, often as a result of a current action or situation.',
    origin = 'A Pidgin adaptation of ''by and by,'' often used to indicate a future consequence or outcome.',
    audio_example = 'Bum-bye',
    updated_at = now()
WHERE id = 'bumbai_027' AND pidgin = 'bumbai';

-- ballah head ← bolo head
UPDATE public.dictionary_entries SET
    english = ARRAY['bald head', 'bald person', 'no hair']::text[],
    examples = ARRAY['Uncle get ballah head', 'He stay ballah head since young time', 'My bruddah going ballah head like daddy', 'Eh, dat guy ova dea get one big ballah head, brah!', 'She wen'' cut all her hair off, now she get ballah head.', 'My uncle one bolo head', 'Eh, you see dat bolo head ovah dea?', 'He get one bolo head, but he still look good.']::text[],
    tags = ARRAY['descriptions', 'appearance', 'slang', 'english', 'portuguese']::text[],
    spelling_variants = ARRAY['bale head', 'ball head', 'bolo head']::text[],
    frequency = 'medium',
    pronunciation = 'BAL-lah head',
    usage = '"Ballah head" is a common Pidgin term used to describe someone with a bald head or who is balding. It can be used as a descriptive term or, sometimes, as a lighthearted insult or teasing remark.',
    origin = 'This term likely originated from the English word "bald," but was adapted and localized within the Hawaiian Pidgin language to reflect the local culture and speech patterns.',
    audio_example = 'Eh, dat guy ova dea get one big ballah head, brah!',
    updated_at = now()
WHERE id = 'ballah_head_507' AND pidgin = 'ballah head';

-- k den ← kay den
UPDATE public.dictionary_entries SET
    english = ARRAY['okay then', 'alright then']::text[],
    examples = ARRAY['K den, see you latahs', 'K-den, latahs', 'Kay den, we go now', 'Kay den, I go do dat.', 'You ready? Kay den, let''s go.']::text[],
    tags = ARRAY['expressions', 'english', 'agreement']::text[],
    spelling_variants = ARRAY['kay den']::text[],
    frequency = 'high',
    pronunciation = 'kay-DEN',
    usage = 'Agreement or farewell',
    origin = 'English "okay then"',
    audio_example = 'K den, I going now',
    updated_at = now()
WHERE id = 'k_den_082' AND pidgin = 'k den';

-- nosey ← nosy
UPDATE public.dictionary_entries SET
    english = ARRAY['niele', 'prying', 'meddling', 'curious']::text[],
    examples = ARRAY['Brah, no stay so nosey!', 'Eh, why you so nosey, always gotta know everybody business?', 'She get plenny nosey friends, always talking story ''bout other people.', 'Stop being so nosy about my business.', 'Eh, why you so nosy, brah? Mind your own kine business, yeah?', 'She always nosy, always gotta know everyting dat happenin''.']::text[],
    tags = ARRAY['personality', 'behavior', 'niele']::text[],
    spelling_variants = ARRAY['nosy']::text[],
    frequency = 'high',
    pronunciation = 'NO-zee',
    usage = 'In Pidgin, ''nosey'' is used to describe someone who is excessively curious or intrusive in other people''s affairs. It''s often used to call someone out for being overly inquisitive or meddling in situations that don''t concern them.',
    origin = 'While the word itself is English, its frequent use and the specific way it''s employed in Pidgin reflects the close-knit community values of Hawai''i, where privacy and respect for others are highly valued.',
    audio_example = 'Eh, why you so nosey, always gotta know everybody business?',
    updated_at = now()
WHERE id = '1f6f0c72-f75c-4007-ba25-04414f2dd39d' AND pidgin = 'nosey';

-- auē ← auwe
UPDATE public.dictionary_entries SET
    english = ARRAY['oh dear', 'alas', 'oh my gosh', 'expression of shock or dismay', 'oh no']::text[],
    examples = ARRAY['Auē, I forgot', 'Auē, I forgot my wallet!', 'Auē, da traffic so bad today.', 'Auwe! Look da mess!', 'Auwe, I forgot my wallet', 'Auwe, so sad!', 'Auwe! Da kine buggah wen'' steal my plate lunch!', 'Auwe, brah, I wen'' get one flat tire, yeah?']::text[],
    tags = ARRAY['expressions', 'hawaiian', 'exclamations', 'emotions']::text[],
    spelling_variants = ARRAY['auwe']::text[],
    frequency = 'medium',
    pronunciation = 'ah-WEH',
    usage = 'An expression of dismay, sadness, or lament. It''s used when something unfortunate happens.',
    origin = 'This is a direct borrowing from the Hawaiian language, expressing a similar sentiment.',
    audio_example = 'Auē!',
    updated_at = now()
WHERE id = 'au_299' AND pidgin = 'auē';

-- rubbah slippahs ← rubbah slippah
UPDATE public.dictionary_entries SET
    english = ARRAY['flip flops', 'sandals', 'flip-flops']::text[],
    examples = ARRAY['Wea my rubbah slippahs?', 'I wen'' wear my rubbah slippahs to da beach.', 'Rubbah slippahs, da bes'' footwear, yeah?', 'rubbah slippah stay flip-flops', 'Eh brah, goin'' beach wit'' my rubbah slippah.', 'I wen'' broke my rubbah slippah, gotta go buy new one.']::text[],
    tags = ARRAY['expressions', 'english', 'pidgin', 'clothing']::text[],
    spelling_variants = ARRAY['rubbah slippah']::text[],
    frequency = 'medium',
    pronunciation = 'RUB-bah-SLIP-pahz',
    usage = 'Refers to flip-flops or sandals. It is the standard footwear in Hawaii. It is a comfortable and practical choice for the climate.',
    origin = 'A Pidgin term, derived from the materials used to make the footwear.',
    audio_example = 'I wen'' wear my rubbah slippahs to da beach.',
    updated_at = now()
WHERE id = 'rubbah_slippahs_155' AND pidgin = 'rubbah slippahs';

-- shame ← i shame
UPDATE public.dictionary_entries SET
    english = ARRAY['embarrassed']::text[],
    examples = ARRAY['Ho, shame dat!', 'Eh brah, I shame fo'' fall down in front everybody!', 'She shame ''cause he wen'' tell da whole story.', 'Ho, I shame!', 'I shame fo'' what I did.', 'She stay i shame cuz she fall down.']::text[],
    tags = ARRAY['emotions', 'english']::text[],
    spelling_variants = ARRAY['i shame']::text[],
    frequency = 'medium',
    pronunciation = 'SHAME',
    usage = 'This word expresses the feeling of embarrassment or shame. It''s used when someone feels self-conscious or humiliated, often due to a social faux pas or a personal failing.',
    origin = 'This is a direct borrowing from English, reflecting the influence of the English language on Hawaiian Pidgin.',
    audio_example = 'Eh brah, I shame fo'' fall down in front everybody!',
    updated_at = now()
WHERE id = 'shame_157' AND pidgin = 'shame';

-- hammajang ← hamajang
UPDATE public.dictionary_entries SET
    english = ARRAY['messed up', 'broken']::text[],
    examples = ARRAY['All hammajang', 'Eh, da car hammajang, no can start!', 'My computer hammajang, I dunno what happen.', 'Da TV stay all hamajang', 'Da radio is hamajang, no can hear da music.', 'Eh, my car engine is hamajang, gotta fix it.']::text[],
    tags = ARRAY['slang']::text[],
    spelling_variants = ARRAY['hamachang', 'hamajang']::text[],
    frequency = 'medium',
    pronunciation = 'HAM-mah-jang',
    usage = 'This term means ''messed up'' or ''broken''. It describes something that is not working correctly or is in a state of disrepair.',
    origin = 'This Pidgin term is likely derived from a combination of English and other influences, describing a state of disarray or malfunction.',
    audio_example = 'Eh, da car hammajang, no can start!',
    updated_at = now()
WHERE id = 'hammajang_282' AND pidgin = 'hammajang';

-- planny ← plenny
UPDATE public.dictionary_entries SET
    english = ARRAY['plenty', 'lots', 'a lot', 'many']::text[],
    examples = ARRAY['Get planny', 'Eh, da beach get planny people today.', 'I get planny time fo'' go surf, yeah?', 'Get plenny fish in da ocean', 'We get plenny food for da party.', 'Plenny people at da beach today.']::text[],
    tags = ARRAY['expressions', 'english', 'descriptions', 'amounts']::text[],
    spelling_variants = ARRAY['plenny']::text[],
    frequency = 'high',
    pronunciation = 'PLAN-nee',
    usage = 'Means "plenty" or "lots" of something. It is a versatile word used to express abundance in various contexts, from people to food to time.',
    origin = 'Derived from the English word "plenty".',
    audio_example = 'Eh, da beach get planny people today.',
    updated_at = now()
WHERE id = 'planny_379' AND pidgin = 'planny';

-- bambucha ← bumboocha
UPDATE public.dictionary_entries SET
    english = ARRAY['huge', 'very large', 'gigantic', 'big']::text[],
    examples = ARRAY['Ho, dat mango stay bambucha!', 'Da wave was bambucha, brah, almost wen'' wash ''em all away!', 'Eh, you see dat truck? Bambucha size, yeah?', 'One bumboocha wave', 'Da mango tree got bumboocha mangoes!', 'Look at dat bumboocha truck!']::text[],
    tags = ARRAY['descriptions', 'slang']::text[],
    spelling_variants = ARRAY['bumboocha']::text[],
    frequency = 'medium',
    pronunciation = 'bam-BOO-chah',
    usage = '"Bambucha" is used to describe something of an exceptionally large size, often with a sense of awe or exaggeration. It''s a common term in Pidgin, highlighting the speaker''s surprise or emphasis on the size of an object or situation.',
    origin = 'The term "bambucha" is a Pidgin word, likely derived from a combination of influences, including English and possibly other languages spoken by plantation workers. It reflects the expressive and colorful nature of Pidgin.',
    audio_example = 'Da wave was bambucha, brah, almost wen'' wash ''em all away!',
    updated_at = now()
WHERE id = '93129535-031c-401b-ac0f-0978ac49b830' AND pidgin = 'bambucha';

-- hawaiian pick up lines ← hawaii pick up lines
UPDATE public.dictionary_entries SET
    english = ARRAY['Pick-up lines used in Hawaii', 'Flirty phrases', 'Romantic opening lines', 'Flirting phrases', 'Romantic conversation starters']::text[],
    examples = ARRAY['Eh brah, you like go beach wit'' me? I like you, yeah?', 'You lookin'' good, yeah? You like go eat shave ice afta?', 'Eh brah, you from Hawaii? ''Cause you look like one kine sunshine.', 'You get license fo'' be dat cute, yeah?']::text[],
    tags = ARRAY['romance', 'dating', 'flirting', 'local slang', 'relationships']::text[],
    spelling_variants = ARRAY['hawaii pick up lines']::text[],
    frequency = 'medium',
    pronunciation = 'HAH-vai-in PIK UP LAH-inz',
    usage = NULL,
    origin = NULL,
    audio_example = NULL,
    updated_at = now()
WHERE id = '7a970145-6136-4c28-bf05-6ea516aaf88a' AND pidgin = 'hawaiian pick up lines';

-- make ass ← make a-ass
UPDATE public.dictionary_entries SET
    english = ARRAY['embarrass oneself', 'make a fool of oneself in public', 'act foolishly']::text[],
    examples = ARRAY['I slipped on da wet floor and wen make ass in front errbody.', 'No go over dere and make ass, stay cool.', 'No go make a-ass in front your tutu!', 'Eh brah, stop make a-ass, you look like one kook!', 'She went make a-ass at da party, talkin'' story wit'' da wrong guy.']::text[],
    tags = ARRAY['slang', 'humor', 'idioms', 'social', 'expression']::text[],
    spelling_variants = ARRAY['make a-ass']::text[],
    frequency = 'high',
    pronunciation = 'MAYK ASS',
    usage = 'To humiliate or embarrass oneself in front of others by doing something clumsy, silly, or foolish.',
    origin = 'Pidgin idiom',
    audio_example = 'Eh brah, stop make a-ass, you look like one kook!',
    updated_at = now()
WHERE id = 'ae60661c-8292-4216-9774-566a3f442372' AND pidgin = 'make ass';

-- ass right ← das right
UPDATE public.dictionary_entries SET
    english = ARRAY['that''s right', 'exactly', 'you got it']::text[],
    examples = ARRAY['Ass right, das how we do um', 'Ass right, dat''s exactly what I was thinkin''!', 'You pass da test? Ass right, brah!', 'Das right, brah, we go early fo'' get parking.', '"Pau hana time?" "Das right!"', 'Das right, no can just give up.']::text[],
    tags = ARRAY['expressions', 'english', 'agreement']::text[],
    spelling_variants = ARRAY['das rite', 'dass right', 'das right']::text[],
    frequency = 'high',
    pronunciation = 'ass-RIGHT',
    usage = 'This is a strong affirmative, similar to ''that''s right'' or ''exactly.'' It shows enthusiastic agreement.',
    origin = 'This phrase is a direct translation from English, but its use in Pidgin adds emphasis.',
    audio_example = 'Ass right!',
    updated_at = now()
WHERE id = 'ass_right_013' AND pidgin = 'ass right';

-- fo wat? ← fo what
UPDATE public.dictionary_entries SET
    english = ARRAY['why?', 'for what reason?']::text[],
    examples = ARRAY['Fo wat you wen do dat?', 'Fo wat you do dat, eh?', 'Eh, fo wat you so sad?', 'Fo what you do dat?', 'Fo what you goin'' dere?', 'Eh, fo what you cryin''?']::text[],
    tags = ARRAY['expressions', 'english']::text[],
    spelling_variants = ARRAY['fo what']::text[],
    frequency = 'medium',
    pronunciation = 'foh-WAT',
    usage = 'This phrase means ''why?'' or ''for what reason?'' It''s used to question the purpose or reason behind something.',
    origin = 'This is a Pidgin construction, using ''fo'' (for) and ''wat'' (what) to form a question.',
    audio_example = 'Fo wat you do dat, eh?',
    updated_at = now()
WHERE id = 'fo_wat_337' AND pidgin = 'fo wat?';

-- menpachi ← mempachi
UPDATE public.dictionary_entries SET
    english = ARRAY['squirrelfish', 'big-eyed fish']::text[],
    examples = ARRAY['We went fishing and caught plenty menpachi.', 'Da menpachi stay hide inside da reef during da day.', 'Eh brah, you like eat menpachi? I wen catch plenny today.', 'Caught plenty mempachi last night!']::text[],
    tags = ARRAY['nature', 'japanese', 'food']::text[],
    spelling_variants = ARRAY['mempachi']::text[],
    frequency = 'medium',
    pronunciation = 'men-PAH-chee',
    usage = 'Menpachi, also known as squirrelfish, are popular in Hawaiian cuisine, often fried or used in soups. They are nocturnal fish, so they are commonly caught at night or in deeper waters. This term is used by locals of all ages.',
    origin = 'While the fish itself is native to Hawaiian waters, the Pidgin term ''menpachi'' likely comes from Japanese influence due to the historical presence of Japanese immigrants in Hawaii and their fishing practices.',
    audio_example = 'Eh brah, you like eat menpachi? I wen catch plenny today.',
    updated_at = now()
WHERE id = 'f7bd72ed-84fa-4eb8-a89d-1e3c4758a0ef' AND pidgin = 'menpachi';

-- ova dere ← ova dea
UPDATE public.dictionary_entries SET
    english = ARRAY['over there']::text[],
    examples = ARRAY['Stay ova dere', 'Da beach is ova dere, by da coconut trees.', 'I saw him ova dere, talkin'' story wit'' his braddah.', 'Da store stay ova dea', 'You see dat kine car, ova dea by da beach?', 'Eh brah, da party ova dea, yeah? Let''s go!']::text[],
    tags = ARRAY['directions', 'english']::text[],
    spelling_variants = ARRAY['ova dea']::text[],
    frequency = 'medium',
    pronunciation = 'OH-vah-DAIR',
    usage = '“Ova dere” is used to indicate a location that is distant from the speaker and the listener. It''s a common phrase in Pidgin to point out or describe a place that''s not immediately accessible.',
    origin = 'This phrase comes directly from English, though it has been adapted to fit the rhythm and pronunciation of Hawaiian Pidgin.',
    audio_example = 'Da beach is ova dere, by da coconut trees.',
    updated_at = now()
WHERE id = 'ova_dere_375' AND pidgin = 'ova dere';

-- shoots ← shootz
UPDATE public.dictionary_entries SET
    english = ARRAY['alright', 'okay', 'sounds good', 'goodbye', 'see you later', 'later']::text[],
    examples = ARRAY['Shoots, I''ll see you tomorrow', 'You coming tomorrow? Shoots!', 'We go beach? Shoots!', 'Shoots, gotta go now, brah.', 'You pau already? Shoots, take care!', 'Shootz brah', 'Shootz, I''ll meet you at da beach den.', 'You wanna go eat? Shootz, yeah!']::text[],
    tags = ARRAY['expressions', 'greetings', 'agreement', 'farewell', 'english']::text[],
    spelling_variants = ARRAY['shootz']::text[],
    frequency = 'high',
    pronunciation = 'SHOOTS',
    usage = 'In Pidgin, "shoots" functions as a versatile expression, covering agreement, acknowledgment, or a casual farewell. It''s a quick and easy way to respond positively or to end a conversation, reflecting a relaxed and informal communication style.',
    origin = 'The term "shoots" likely evolved from the English phrase "shoot," adopted and adapted within the local culture. Its widespread use reflects the influence of various immigrant communities and the development of a unique local dialect.',
    audio_example = 'Shoots, gotta go now, brah.',
    updated_at = now()
WHERE id = 'shoots_509' AND pidgin = 'shoots';

-- grindz ← grinds
UPDATE public.dictionary_entries SET
    english = ARRAY['food']::text[],
    examples = ARRAY['Da grindz stay ono', 'Eh, where da good grindz at?', 'I hungry, I need some grindz!', 'Ho, da grinds stay ono!', 'Da grinds at da luau was ono!', 'I like try all da grinds.']::text[],
    tags = ARRAY['food', 'english']::text[],
    spelling_variants = ARRAY['grinds']::text[],
    frequency = 'high',
    pronunciation = 'GRINDZ',
    usage = 'This is the plural form of "grind," referring to food in general. It''s a casual term for meals or dishes.',
    origin = 'This is a Pidgin adaptation of the word "grind," used to refer to food.',
    audio_example = 'Eh, where da good grindz at?',
    updated_at = now()
WHERE id = 'grindz_344' AND pidgin = 'grindz';

-- braddah ← bruddah
UPDATE public.dictionary_entries SET
    english = ARRAY['brother', 'bro', 'friend']::text[],
    examples = ARRAY['Eh braddah', 'Eh, braddah, you goin'' surf dis weekend?', 'My braddah from anoda muddah, always got my back.', 'Wassup bruddah!', 'Tanks bruddah']::text[],
    tags = ARRAY['people', 'english', 'greetings']::text[],
    spelling_variants = ARRAY['bro', 'brah friend', 'bruddah']::text[],
    frequency = 'high',
    pronunciation = 'BRAH-dah',
    usage = 'A term of endearment and camaraderie used between males. It signifies a close friendship or a sense of brotherhood.',
    origin = 'Derived from the English word "brother," it reflects the close-knit community and the importance of relationships in Hawaiian culture.',
    audio_example = 'Eh, braddah, you goin'' surf dis weekend?',
    updated_at = now()
WHERE id = 'braddah_318' AND pidgin = 'braddah';

-- liddat ← lidat, l'dat
UPDATE public.dictionary_entries SET
    english = ARRAY['like that', 'that way']::text[],
    examples = ARRAY['Why you stay liddat?', 'Da kine tings stay liddat fo'' years, brah.', 'Eh, you tink I like stay liddat? No way!', 'Why you stay acting lidat?', 'He do lidat all da time.', 'No be lidat, you hear?', 'Why you stay acting l''dat?', 'Da car broke down, l''dat.', 'She wen'' tell me l''dat, so I dunno what fo'' do.']::text[],
    tags = ARRAY['expressions', 'english', 'common']::text[],
    spelling_variants = ARRAY['li’ dat', 'lidat', 'l''dat']::text[],
    frequency = 'high',
    pronunciation = 'lih-DAT',
    usage = '“Liddat” is used to describe a manner, a state, or a situation, similar to “like that” in English. It can refer to something previously mentioned or understood within the conversation, or to a general state of being.',
    origin = 'Derived from the English phrase “like that,” “liddat” reflects the creolization process of Hawaiian Pidgin, blending English with other languages and cultural influences.',
    audio_example = 'Da kine tings stay liddat fo'' years, brah.',
    updated_at = now()
WHERE id = 'liddat_104' AND pidgin = 'liddat';

-- cockaroach ← cockroach
UPDATE public.dictionary_entries SET
    english = ARRAY['to steal', 'take', 'take without permission']::text[],
    examples = ARRAY['Who wen cockaroach my lunch?', 'He cockaroach my plate lunch!', 'Don''t cockaroach my idea, eh?', 'Who wen cockroach my slippahs?', 'He cockroach my parking spot.', 'Eh brah, da kine guy cockroach my plate lunch!', 'She cockroach all da good malasadas from da party, shame on her!']::text[],
    tags = ARRAY['slang', 'english']::text[],
    spelling_variants = ARRAY['cockroach']::text[],
    frequency = 'medium',
    pronunciation = 'KAH-kah-rohch',
    usage = 'Means to steal or take something, often without permission. It''s a more informal and direct way of saying someone has stolen something.',
    origin = 'A playful alteration of the word "cock," combined with the association of cockroaches as pests that take things.',
    audio_example = 'He cockaroach my plate lunch!',
    updated_at = now()
WHERE id = 'cockaroach_036' AND pidgin = 'cockaroach';

-- zoris ← zori
UPDATE public.dictionary_entries SET
    english = ARRAY['flat-soled sandals', 'slippers', 'flip-flops', 'informal footwear']::text[],
    examples = ARRAY['Grab your zoris, we going beach', 'I wen'' buy new zoris fo'' da beach.', 'Wear yo'' zoris, yeah?', 'Put on your zori', 'I wear my zori to da beach.', 'You get zori fo'' go inside da house?']::text[],
    tags = ARRAY['clothing', 'japanese', 'expressions']::text[],
    spelling_variants = ARRAY['zori']::text[],
    frequency = 'medium',
    pronunciation = 'ZOR-eez',
    usage = 'Refers to flip-flops or sandals, a common type of footwear in Hawaii. They are practical and comfortable for the climate.',
    origin = 'From the Japanese word for flip-flops, reflecting the influence of Japanese culture in Hawaii.',
    audio_example = 'Get yo'' zoris!',
    updated_at = now()
WHERE id = 'zoris_6006' AND pidgin = 'zoris';

-- aina ← da aina
UPDATE public.dictionary_entries SET
    english = ARRAY['land', 'earth', 'the land', 'the earth', 'that which nourishes', 'the country']::text[],
    examples = ARRAY['Malama da ''āina', 'aina stay the land', 'We gotta protect da ''āina.', 'Da love for da ''āina is strong.', 'We gotta take care of da aina.', 'Da aina stay beautiful today.', 'We gotta malama da aina.', 'Da aina give us everything we need.', 'Eh, dis aina so beautiful, brah.', 'We gotta take care of da aina, yeah?']::text[],
    tags = ARRAY['nature', 'hawaiian', 'cultural', 'culture', 'hawaii', 'land', 'responsibility', 'earth', 'place']::text[],
    spelling_variants = ARRAY['da aina']::text[],
    frequency = 'medium',
    pronunciation = 'AH-ee-nah',
    usage = 'Means land, earth, or the land. It''s a fundamental concept in Hawaiian culture.',
    origin = 'From ʻŌlelo Hawaiʻi ʻāina. This is a direct borrowing from the Hawaiian language, representing the deep connection to the land.',
    audio_example = '''Āina.',
    updated_at = now()
WHERE id = 'ina_309' AND pidgin = 'aina';

-- chance 'um ← Eh, chance 'um
UPDATE public.dictionary_entries SET
    english = ARRAY['go for it', 'take a chance', 'try it', 'risk it', 'You should try it']::text[],
    examples = ARRAY['You should chance ''um!', 'Just chance um brah', 'Eh, chance ''um, no scared!', 'Eh, chance ''um, da food ono!', 'Eh brah, chance ''um, you might like ''um.']::text[],
    tags = ARRAY['expressions', 'encouragement', 'english', 'common']::text[],
    spelling_variants = ARRAY['Eh, chance ''um']::text[],
    frequency = 'high',
    pronunciation = 'chance UM',
    usage = 'Encouraging to take a risk',
    origin = 'English',
    audio_example = 'Eh brah, chance ''um, you might like ''um.',
    updated_at = now()
WHERE id = 'chance_um_1027' AND pidgin = 'chance ''um';

DELETE FROM public.dictionary_entries WHERE (id, pidgin) IN (
    ('going_1034', 'going'),
    ('aae67687-ed78-4aee-b21a-78304a5406d8', 'a goin'),
    ('bumbye_028', 'bumbye'),
    ('bolo_head_020', 'bolo head'),
    ('kay_den_1004', 'kay den'),
    ('12f957d5-608a-40f3-bfeb-354fe0903d9c', 'nosy'),
    ('auwe_504', 'auwe'),
    ('bd487239-610e-4aff-8624-96755799e0ae', 'rubbah slippah'),
    ('i_shame_076', 'i shame'),
    ('hamajang_059', 'hamajang'),
    ('plenny_1014', 'plenny'),
    ('bumboocha_319', 'bumboocha'),
    ('7679c318-56b0-4d73-affa-9765bb929594', 'hawaii pick up lines'),
    ('c4cdd14b-c4b9-4d77-b88f-4624ef6075f8', 'make a-ass'),
    ('bf9f5d70-4746-48b3-9a6a-64974bcc7c31', 'das right'),
    ('fo_what_236', 'fo what'),
    ('c0262c83-453c-4ad8-9541-61291c7a4fe1', 'mempachi'),
    ('ova_dea_140', 'ova dea'),
    ('shootz_283', 'shootz'),
    ('grinds_055', 'grinds'),
    ('bruddah_429', 'bruddah'),
    ('lidat_1015', 'lidat'),
    ('ldat_904', 'l''dat'),
    ('61ac1e78-c1fa-4e2b-ba87-c04302f8e706', 'cockroach'),
    ('zori_285', 'zori'),
    ('bfc903ea-291f-4e6f-93ba-b46d85c3a7e2', 'da aina'),
    ('chance_um_phrase', 'Eh, chance ''um')
);

COMMIT;
