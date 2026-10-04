-- Migration 032: Ingest high-traffic slang and search gap intents
--
-- Adds 4 high-demand missing terms from on-site user searches:
--   1. otomatic (variants: automatic) - Pidgin for "guaranteed", "for sure", "done deal"
--   2. mugga (variants: muggah) - Local slang for muscular, thick-built, stocky person
--   3. crackblock (variants: crack block) - Sports/playground slang for hard blindside hit
--   4. chronic (variants: kronik, cronick) - Hawaii street slang for sketchy character / drug addict
--
-- Maps search intent queries onto existing entries:
--   - a hui hou: add "good bye", "until we meet again"
--   - shoots: add "bye"
--   - brah: add "meanings for brah", "meaning of brah"
--   - no act: add "don't do that", "dont do that"
--   - tūtū: add "old lady"
--   - ohana: add "olana" as spelling variant

BEGIN;

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'otomatic',
       ARRAY['guaranteed', 'for sure', 'done deal', 'automatic', 'no doubt']::text[],
       'expressions',
       'oh-toh-MAH-tik',
       ARRAY['You need one ride to da airport? Otomatic, I pick you up!', 'We going surf Bowls today? Otomatic brah!', 'No worry about da tab, stay otomatic.']::text[],
       'Means "guaranteed", "for sure", or "done deal" — stating that something is completely certain to happen or taken care of without question. Often said with enthusiasm.',
       'Pidgin adaptation of English "automatic".',
       'beginner',
       'high',
       ARRAY['expressions', 'emphasis', 'certainty', 'slang']::text[],
       'pidgin',
       ARRAY['automatic']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('otomatic', 'automatic'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'mugga',
       ARRAY['muscular', 'thick-built', 'stocky', 'jacked', 'strong person']::text[],
       'descriptions',
       'MUG-gah',
       ARRAY['Dat buggah stay mugga, he can bench press two plates easy.', 'Who dat mugga guy over dea by da gym?', 'He was skinny before, now he stay all mugga!']::text[],
       'Describes someone who is very stocky, muscular, thick-set, or heavily built. Common among local gym-goers, paddlers, and athletes.',
       'Local Hawaii Pidgin slang for a muscular or solidly built person.',
       'beginner',
       'medium',
       ARRAY['descriptions', 'slang', 'body', 'people']::text[],
       'pidgin',
       ARRAY['muggah']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('mugga', 'muggah'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'crackblock',
       ARRAY['blindside hit', 'hard blindside block', 'cheap shot']::text[],
       'slang',
       'CRACK-block',
       ARRAY['Watch out fo'' da crackblock coming from da outside!', 'He nevah see da guy and got hit wit one mean crackblock.', 'No crackblock me when I not looking, brah!']::text[],
       'A hard, blindsiding block or collision, originally from football (crackback block) and widely used in Hawaii sports and playground slang to describe a sneak hit from an unseen angle.',
       'Hawaii football and playground slang, derived from "crackback block".',
       'intermediate',
       'medium',
       ARRAY['slang', 'sports', 'football', 'action']::text[],
       'pidgin',
       ARRAY['crack block']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('crackblock', 'crack block'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'chronic',
       ARRAY['sketchy character', 'drug addict', 'troublemaker', 'shady person']::text[],
       'slang',
       'CRAW-nik',
       ARRAY['Lock up your bike, choke chronics stay hanging around da park.', 'Dat buggah acting all chronic today.', 'Stay away from da back alley, full of chronics.']::text[],
       'Local Hawaii street slang for a persistent drug addict (especially methamphetamine) or an untrustworthy, erratic person behaving in a sketchy way.',
       'Hawaii street slang, likely from medical/slang "chronic".',
       'intermediate',
       'high',
       ARRAY['slang', 'street', 'people', 'warnings']::text[],
       'pidgin',
       ARRAY['cronick', 'kronik']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('chronic', 'cronick', 'kronik'));

-- Update existing entries with search intent variants and English mappings
UPDATE public.dictionary_entries SET
    english = ARRAY['goodbye', 'good bye', 'until we meet again', 'see you again']::text[],
    updated_at = now()
WHERE id = 'a_hui_hou_600' AND pidgin = 'a hui hou';

UPDATE public.dictionary_entries SET
    english = ARRAY['alright', 'okay', 'sounds good', 'goodbye', 'bye', 'see you later', 'later']::text[],
    updated_at = now()
WHERE id = 'shoots_509' AND pidgin = 'shoots';

UPDATE public.dictionary_entries SET
    english = ARRAY['bro', 'brother', 'friend', 'dude', 'man', 'meanings for brah', 'meaning of brah']::text[],
    updated_at = now()
WHERE id = 'brah_526' AND pidgin = 'brah';

UPDATE public.dictionary_entries SET
    english = ARRAY['don''t act like that', 'stop messing around', 'don''t pretend', 'don''t do that', 'dont do that']::text[],
    updated_at = now()
WHERE id = 'no_act_7026' AND pidgin = 'no act';

UPDATE public.dictionary_entries SET
    english = ARRAY['grandmother', 'grandfather', 'grandparent', 'grandma', 'grandpa', 'old lady']::text[],
    updated_at = now()
WHERE id = 'tutu_1009' AND pidgin = 'tūtū';

UPDATE public.dictionary_entries SET
    spelling_variants = ARRAY['olana']::text[],
    updated_at = now()
WHERE id = '4f3c41b6-6e39-46e7-8db6-b4aa8b81bbaf' AND pidgin = 'ohana';

COMMIT;
