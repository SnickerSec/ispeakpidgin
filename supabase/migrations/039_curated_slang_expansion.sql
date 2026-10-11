-- Migration 039: Ingest curated island slang, cuisine, and cultural terms
--
-- Ingests 25 high-value curated terms from tools/data/curated-missing-terms.json
-- spanning local Hawaii comfort food, cultural values, and everyday plantation-rooted slang:
--   1. loco moco, lomi salmon, squid luau, mochi, pupu platter, kalua pig (cuisine staples)
--   2. puʻuwai, me ka mahalo, maui no ka oi, mahalo plenty, shaka brah (cultural expressions)
--   3. mo' bettah, bettah, poi dog, no make lolo, choke traffic, puka shell, daikon legs,
--      stink, on da lo lo yo, chotto matte, kachi kachi, bagasu, botan, totus (lifestyle & slang)
--
-- Also enriches broke da mouth with spelling variants "broke mouth" and "broke mouf".

BEGIN;

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'loco moco',
       ARRAY['local rice dish with hamburger patty, egg, and gravy', 'Hawaiian comfort food dish']::text[],
       'food',
       'LOH-koh MOH-koh',
       ARRAY['Ho, I stay starving, we go get one loco moco from da diner.', 'Two scoop rice and extra gravy on top da loco moco.']::text[],
       'A staple Hawaii diner comfort dish composed of a bowl of hot white rice topped with a hamburger patty, a sunny-side-up fried egg, and rich brown gravy.',
       'Hawaii local diner creation (Hilo, 1949)',
       'beginner',
       'high',
       ARRAY['food', 'diner', 'comfort food', 'local eats']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('loco moco'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'lomi salmon',
       ARRAY['salted salmon side dish with tomatoes and onions', 'traditional Hawaiian luau side dish']::text[],
       'food',
       'LOH-mee SAH-mun',
       ARRAY['No forget da lomi salmon for da luau plate.', 'Lomi salmon taste so ono wit poi and kalua pork.']::text[],
       'A classic Hawaiian side dish made with diced salted salmon, ripe crushed tomatoes, sweet Maui onions, and crushed ice.',
       'Hawaiian (lomi = massage or mix by hand)',
       'beginner',
       'high',
       ARRAY['food', 'luau', 'traditional', 'local eats']::text[],
       'hawaiian',
       ARRAY['lomi lomi salmon', 'lomilomi salmon']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('lomi salmon', 'lomi lomi salmon', 'lomilomi salmon'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'squid luau',
       ARRAY['octopus or squid simmered in taro leaves and coconut milk', 'traditional Hawaiian stew']::text[],
       'food',
       'SKWID LOO-ow',
       ARRAY['My tutu make da best squid luau on da island.', 'Squid luau stay rich and sweet from da coconut milk.']::text[],
       'A cherished traditional Hawaiian stew prepared by slow-cooking tender octopus or squid with young luau (taro) leaves, coconut milk, and sea salt.',
       'Hawaiian traditional cuisine',
       'intermediate',
       'medium',
       ARRAY['food', 'traditional', 'luau', 'seafood']::text[],
       'hawaiian',
       ARRAY['squid lūʻau']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('squid luau', 'squid lūʻau'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'mochi',
       ARRAY['sweet chewy rice cake', 'local Japanese dessert']::text[],
       'food',
       'MOH-chee',
       ARRAY['Aunty brought fresh butter mochi to da potluck.', 'Dis strawberry mochi stay broke da mouth.']::text[],
       'A chewy, sweet, glutinous rice cake that is a beloved dessert across Hawaii, appearing in variations like butter mochi, chi chi dango, and strawberry mochi.',
       'Japanese loanword',
       'beginner',
       'high',
       ARRAY['food', 'dessert', 'japanese', 'baking']::text[],
       'japanese',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('mochi'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'poi dog',
       ARRAY['mixed breed dog', 'local island mutt']::text[],
       'slang',
       'POY DAWG',
       ARRAY['My dog is one rescue poi dog, smart as anything.', 'He got one loyal poi dog dat follow him everywhere.']::text[],
       'A friendly local slang term for a mixed-breed dog, or affectionately for someone of mixed heritage / multicultural background.',
       'Hawaiian-English hybrid',
       'beginner',
       'high',
       ARRAY['slang', 'animals', 'pets', 'local identity']::text[],
       'hawaiian',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('poi dog'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'pupu platter',
       ARRAY['appetizer assortment plate', 'party starter dish']::text[],
       'food',
       'POO-poo PLAT-tah',
       ARRAY['Order da pupu platter while we wait for da main food.', 'Da pupu platter get lumpia, chicken wings, and edamame.']::text[],
       'A large platter of mixed appetizers and finger foods served at parties, pau hana gatherings, and local diners.',
       'Hawaiian-English hybrid (pūpū = appetizer/snack)',
       'beginner',
       'high',
       ARRAY['food', 'pupu', 'parties', 'gatherings']::text[],
       'hawaiian',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('pupu platter'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'mo'' bettah',
       ARRAY['much better', 'far superior', 'preferable']::text[],
       'slang',
       'MOH BEH-tah',
       ARRAY['Going early morning is mo bettah, no get traffic.', 'Homemade poke stay mo bettah than store-bought.']::text[],
       'The essential Pidgin comparative meaning ''much better'', ''superior'', or ''way more enjoyable''.',
       'Pidgin comparative construction',
       'beginner',
       'high',
       ARRAY['slang', 'grammar', 'expressions', 'everyday']::text[],
       'pidgin',
       ARRAY['mo bettah']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('mo'' bettah', 'mo bettah'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'chotto matte',
       ARRAY['wait a minute', 'hold on', 'hold your horses']::text[],
       'slang',
       'CHOH-toh MAH-teh',
       ARRAY['Chotto matte brah, I still tying my shoes.', 'Chotto matte, lemme check da directions first.']::text[],
       'A common loan phrase used in Hawaii conversation to tell someone to pause, slow down, or wait a second.',
       'Japanese loanword',
       'intermediate',
       'medium',
       ARRAY['slang', 'japanese', 'expressions', 'time']::text[],
       'japanese',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('chotto matte'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'kachi kachi',
       ARRAY['Puerto Rican dance music in Hawaii', 'upbeat island accordion music']::text[],
       'general',
       'KAH-chee KAH-chee',
       ARRAY['Dey playing kachi kachi music at da graduation party!', 'Everyone was dancing to da kachi kachi band.']::text[],
       'A lively genre of Puerto Rican dance music created by immigrants to Hawaii plantations, characterized by accordion, cuatro, and guiro rhythm.',
       'Puerto Rican plantation culture in Hawaii',
       'intermediate',
       'medium',
       ARRAY['music', 'culture', 'puerto rican', 'parties']::text[],
       'pidgin',
       ARRAY['kachikachi']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('kachi kachi', 'kachikachi'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'bagasu',
       ARRAY['useless residue', 'worthless person', 'scoundrel']::text[],
       'slang',
       'bah-GAH-soo',
       ARRAY['Dat guy acting like real bagasu.', 'Clean up all dat bagasu from da yard.']::text[],
       'Originally sugarcane fiber waste; colloquially used in local plantation slang as a playful or biting term for a rascal or good-for-nothing.',
       'Ilocano and plantation Spanish/Portuguese (bagasse)',
       'advanced',
       'low',
       ARRAY['slang', 'insults', 'plantation', 'vintage']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('bagasu'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'botan',
       ARRAY['button', 'snap fastener']::text[],
       'slang',
       'boh-TAHN',
       ARRAY['Push da botan for open da gate.', 'Your shirt missing one botan, brah.']::text[],
       'A button on clothing, or a button on an electronic switch/device.',
       'Japanese loanword (botan / ボタン)',
       'intermediate',
       'medium',
       ARRAY['slang', 'japanese', 'everyday', 'objects']::text[],
       'japanese',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('botan'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'totus',
       ARRAY['fart', 'flatulence']::text[],
       'slang',
       'TOH-toos',
       ARRAY['Who wen make totus in da car?!', 'Crack da window, someone wen make totus.']::text[],
       'Plantation-era slang word for breaking wind or flatulence.',
       'Portuguese plantation loanword',
       'intermediate',
       'medium',
       ARRAY['slang', 'humor', 'plantation', 'body']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('totus'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'no make lolo',
       ARRAY['do not act foolish', 'do not make a fool of yourself']::text[],
       'slang',
       'NOH MAYK LOH-loh',
       ARRAY['Behave in front da kumu, no make lolo.', 'No make lolo on camera, brah!']::text[],
       'Admonition instructing someone to behave with common sense and stop acting crazy or stupid.',
       'Pidgin idiom with Hawaiian lōlō (crazy/foolish)',
       'beginner',
       'high',
       ARRAY['slang', 'idioms', 'advice', 'behavior']::text[],
       'hawaiian',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('no make lolo'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'choke traffic',
       ARRAY['heavy traffic', 'bumper to bumper gridlock']::text[],
       'slang',
       'CHOHK TRAF-fik',
       ARRAY['H-1 get choke traffic right now, take da back road.', 'We was late because had choke traffic going town-bound.']::text[],
       'Severe highway or island road congestion where cars are packed tightly bumper-to-bumper.',
       'Pidgin idiom (choke = abundant/crowded)',
       'beginner',
       'high',
       ARRAY['slang', 'travel', 'driving', 'everyday']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('choke traffic'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'puka shell',
       ARRAY['naturally perforated cone shell necklace', 'traditional shell jewelry']::text[],
       'general',
       'POO-kah SHELL',
       ARRAY['He wearing his vintage puka shell necklace.', 'We went hunting for puka shells along da shoreline.']::text[],
       'A traditional beach necklace or jewelry item made from the worn, naturally holed tip of cone shells found along Hawaiian shorelines.',
       'Hawaiian-English hybrid (puka = hole)',
       'beginner',
       'high',
       ARRAY['beach', 'fashion', 'jewelry', 'ocean']::text[],
       'hawaiian',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('puka shell'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'shaka brah',
       ARRAY['island greeting accompanied by shaka sign', 'hang loose friend']::text[],
       'greetings',
       'SHAH-kah BRAH',
       ARRAY['Shaka brah, good for see you!', 'Threw him one big shaka brah when he let us merge.']::text[],
       'The quintessential friendly Hawaii greeting and hand gesture expressing goodwill, friendliness, and solidarity.',
       'Pidgin colloquialism',
       'beginner',
       'high',
       ARRAY['greetings', 'shaka', 'aloha', 'slang']::text[],
       'pidgin',
       ARRAY['shaka braddah', 'shaka bruddah']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('shaka brah', 'shaka braddah', 'shaka bruddah'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'puʻuwai',
       ARRAY['heart', 'affection', 'feelings']::text[],
       'cultural',
       'poo-oo-WYE',
       ARRAY['From da bottom of my puʻuwai, mahalo nui loa.', 'Uncle get one big puʻuwai, always taking care da family.', 'Listen to your puʻuwai when you need for choose da right path.']::text[],
       'Heart, feelings, affection, or moral character. Commonly used in Hawaiian and local expressions of sincerity, aloha, and heartfelt emotion.',
       'Hawaiian (puʻu = heart/mound, wai = water/vital fluid)',
       'intermediate',
       'medium',
       ARRAY['hawaiian', 'cultural', 'heart', 'feelings', 'aloha']::text[],
       'hawaiian',
       ARRAY['puuwai']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('puʻuwai', 'puuwai'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'stink',
       ARRAY['mean', 'rude', 'nasty', 'in a bad mood']::text[],
       'slang',
       'STINK',
       ARRAY['How come you acting so stink to me?', 'No be stink, share da musubi wit your sistah.', 'He get one stink attitude today, no talk to him.']::text[],
       'As an adjective, stink describes a bad attitude, not a bad smell: someone acting stink is being mean or rude. It also shows up in stink face (a scowl), alongside stink eye and talk stink.',
       'From English ''stink'', extended in Pidgin from a bad smell to a bad attitude.',
       'beginner',
       'high',
       ARRAY['slang', 'attitude', 'english']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('stink'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'kalua pig',
       ARRAY['pork slow-cooked in an underground oven', 'smoky shredded pork']::text[],
       'food',
       'kah-LOO-ah pig',
       ARRAY['Get kalua pig and cabbage at da plate lunch place.', 'Uncle wen dig da imu fo'' da kalua pig.', 'Fo'' da baby lūʻau get kalua pig, lomi salmon, and poi.']::text[],
       'A whole pig cooked in an imu (underground oven) until smoky and tender, then shredded; a lūʻau staple. At home and in plate lunches it is usually made in an oven or slow cooker with Hawaiian salt. Also called kalua pork.',
       'Hawaiian kālua, to bake in an imu (underground oven).',
       'beginner',
       'high',
       ARRAY['food', 'hawaiian', 'luau']::text[],
       'hawaiian',
       ARRAY['kalua pork', 'kālua pig', 'kālua pork']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('kalua pig', 'kalua pork', 'kālua pig', 'kālua pork'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'mahalo plenty',
       ARRAY['thank you very much', 'thanks a lot']::text[],
       'greetings',
       'mah-HAH-loh PLEN-tee',
       ARRAY['Mahalo plenty fo'' da ride, cuz!', 'Aunty, mahalo plenty fo'' da food.', 'Mahalo plenty, brah, you saved me.']::text[],
       'A Pidgin way to say thanks a lot: Hawaiian mahalo plus English plenty (a lot). More casual than mahalo nui loa.',
       'Hawaiian mahalo (thanks) with English plenty.',
       'beginner',
       'medium',
       ARRAY['greetings', 'gratitude', 'hawaiian']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('mahalo plenty'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'bettah',
       ARRAY['better', 'you had better']::text[],
       'slang',
       'BET-tah',
       ARRAY['Bettah you go now before da traffic.', 'Dis one bettah, try taste.', 'You feeling bettah today?']::text[],
       'Pidgin pronunciation of ''better'': the final -er becomes -ah, as in braddah and sistah. At the start of a sentence it means ''you had better'' (Bettah you go now). Best known in mo'' bettah.',
       'English ''better'' with the Pidgin -ah ending.',
       'beginner',
       'high',
       ARRAY['slang', 'english']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('bettah'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'daikon legs',
       ARRAY['thick legs', 'stocky legs']::text[],
       'slang',
       'DYE-kohn legs',
       ARRAY['Ho, dat soccer player get daikon legs, strong!', 'She wen tease me ''cause I get daikon legs.', 'All da hiking wen give me daikon legs.']::text[],
       'Teasing description of thick, sturdy legs, likened to a daikon radish. Playful between friends, but it is a jab about someone''s body, so know your audience.',
       'From Japanese daikon-ashi (radish legs), brought by Japanese immigrants to Hawaii.',
       'intermediate',
       'medium',
       ARRAY['slang', 'japanese', 'body']::text[],
       'pidgin',
       ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('daikon legs'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'maui no ka oi',
       ARRAY['Maui is the best', 'Maui is number one']::text[],
       'expressions',
       'MOW-ee noh kah OY',
       ARRAY['No matta where you go, Maui no ka oi, brah.', 'Ho, dat sunset from Haleakala proves Maui no ka oi.', 'Chee-hoo! Maui no ka oi all day!']::text[],
       'Famous island phrase and motto celebrating Maui island pride: ''Maui is the best'' or ''Maui is top of the line''. Frequently seen on island bumper stickers, shirts, and signs.',
       'Hawaiian: Maui + nō (indeed) + ka (the) + ʻoi (best/superior).',
       'beginner',
       'high',
       ARRAY['expressions', 'pride', 'island', 'maui', 'hawaiian']::text[],
       'hawaiian',
       ARRAY['maui no ka ''oi', 'maui nō ka ʻoi']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('maui no ka oi', 'maui no ka ''oi', 'maui nō ka ʻoi'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'on da lo lo yo',
       ARRAY['on the down-low', 'secretly', 'quietly', 'under the radar']::text[],
       'slang',
       'on dah LOH LOH YOH',
       ARRAY['Keep dis news on da lo lo yo, no tell nobody yet.', 'We stay planning one surprise party, so stay on da lo lo yo.', 'Brah, dat deal went down on da lo lo yo.']::text[],
       'Island Pidgin expression meaning to keep something confidential, secret, or discreet (''on the down-low''). Used when telling someone not to broadcast sensitive news or gossip.',
       'Blend of English ''on the down-low'' / ''low-low'' with Pidgin rhythm and rhyming marker ''yo''.',
       'intermediate',
       'high',
       ARRAY['slang', 'secrets', 'discreet', 'expressions']::text[],
       'pidgin',
       ARRAY['on da low low', 'on da low low yo', 'on da lolo yo', 'on da loloyo']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('on da lo lo yo', 'on da low low', 'on da low low yo', 'on da lolo yo', 'on da loloyo'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'me ka mahalo',
       ARRAY['with gratitude', 'with thanks', 'warm regards', 'sincerely']::text[],
       'greetings',
       'may kah mah-HAH-loh',
       ARRAY['Me ka mahalo for your kokua and support.', 'He wen sign da letter ''Me ka mahalo, Uncle Kimo.''', 'Me ka mahalo nui loa to all our volunteers today.']::text[],
       'Traditional and formal Hawaiian letter or email sign-off meaning ''with gratitude'' or ''with thanks''. Commonly seen as a closing valediction in local correspondence, formal messages, and community announcements.',
       'Hawaiian: me (with) + ka (the) + mahalo (gratitude/thanks).',
       'beginner',
       'high',
       ARRAY['greetings', 'valediction', 'formal', 'hawaiian', 'gratitude']::text[],
       'hawaiian',
       ARRAY['me ka mahalo nui', 'me ka mahalo nui loa']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('me ka mahalo', 'me ka mahalo nui', 'me ka mahalo nui loa'));

-- Update broke da mouth with spelling variants "broke mouth" and "broke mouf"
UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY(SELECT DISTINCT unnest(spelling_variants || ARRAY['broke mouth', 'broke mouf']::text[])),
    updated_at = now()
WHERE pidgin = 'broke da mouth';

COMMIT;
