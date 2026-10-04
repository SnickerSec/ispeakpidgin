-- Migration 029: terms from the on-site search-gap backlog (searches that returned nothing)
--
-- Chosen from the 745 pending search_gaps rows after services/search-gaps.js removed the
-- ones the dictionary already answered. Counts are on-site searches with zero results:
--   jus like   ← "juslike" (4)
--   danjah     ← "danejah" (4)
--   no play    ← "no play" (5)
--   buss nuts  ← "bus da nuts" (4), "bus da nut" (4)
-- Existing entries:
--   garanz     ← "garanz ballbaranz" (3); the phrases table already has "Garanz ballbaranz!"
--   molowa     ← "lazy person" (3), "lazy no work" (3)
--
-- Inserts skip if the headword exists; updates append, so later edits are kept.

BEGIN;

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'jus like',
       ARRAY['just like', 'exactly like', 'same as', 'similar to']::text[],
       'expressions',
       'jus LIKE',
       ARRAY['Dat boy jus like his faddah, always talking story.', 'She cook jus like her tūtū.', 'Da sunset tonight stay jus like one painting.']::text[],
       'Compares two people or things: "just like", "exactly like". Pidgin drops the final t of "just", as in jus joke and jus buckaloose.',
       'English "just like", with the final consonant dropped.',
       'beginner',
       'high',
       ARRAY['expressions', 'comparison', 'everyday']::text[],
       'pidgin',
       ARRAY['juslike', 'jus'' like']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('jus like', 'juslike', 'jus'' like'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'danjah',
       ARRAY['danger', 'dangerous', 'risky']::text[],
       'descriptions',
       'DANE-jah',
       ARRAY['No go out dea, da current stay danjah today.', 'Dat road get danjah curves, so slow down.', 'Watch out, brah, danjah!']::text[],
       'Pidgin pronunciation of "danger", used both as a noun and as an adjective meaning "dangerous", often as a warning.',
       'English "danger"; Pidgin turns the final -er into -ah, as in braddah and sistah.',
       'beginner',
       'medium',
       ARRAY['descriptions', 'warnings', 'safety']::text[],
       'pidgin',
       ARRAY['danejah']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('danjah', 'danejah'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'no play',
       ARRAY['don''t mess around', 'I''m serious', 'don''t fool around', 'stop playing']::text[],
       'expressions',
       'NO PLAY',
       ARRAY['No play, brah, I stay serious dis time.', 'Eh, no play wit da fire!', 'No play play, we gotta pau dis today.']::text[],
       'A warning to stop joking or fooling around. Doubled as "no play play" for emphasis. "No" before a verb is the usual Pidgin negative command, as in no act and no worry.',
       'Pidgin negative command: "no" + English "play".',
       'beginner',
       'medium',
       ARRAY['expressions', 'commands', 'warnings']::text[],
       'pidgin',
       ARRAY['no play play']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('no play', 'no play play'));

INSERT INTO public.dictionary_entries (id, pidgin, english, category, pronunciation, examples, usage, origin, difficulty, frequency, tags, source_language, spelling_variants)
SELECT gen_random_uuid()::text,
       'buss nuts',
       ARRAY['work extremely hard', 'give it everything', 'push yourself to the limit']::text[],
       'slang',
       'BUSS NUTS',
       ARRAY['We wen buss nuts fo'' pau da job before da rain came.', 'Coach made us buss nuts at practice today.', 'I wen buss my nuts fixing dat car.']::text[],
       'Crude but common slang for straining or working as hard as you can. Buss is Pidgin for "burst" or "break", as in buss up and buss laff.',
       'Pidgin buss ("burst, break") + English "nuts".',
       'intermediate',
       'medium',
       ARRAY['slang', 'work', 'effort', 'crude']::text[],
       'pidgin',
       ARRAY['buss da nuts', 'bus da nuts', 'bus da nut', 'buss nut']::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.dictionary_entries WHERE lower(pidgin) IN ('buss nuts', 'buss da nuts', 'bus da nuts'));

UPDATE public.dictionary_entries SET
    spelling_variants = coalesce(spelling_variants, ARRAY[]::text[]) || ARRAY['garanz ballbaranz', 'guaranz ballbaranz']::text[],
    updated_at = now()
WHERE id = 'garanz_050' AND pidgin = 'garanz'
  AND NOT ('garanz ballbaranz' = ANY(coalesce(spelling_variants, ARRAY[]::text[])));

UPDATE public.dictionary_entries SET
    english = english || ARRAY['lazy person']::text[],
    updated_at = now()
WHERE id = '035230d0-c5d2-466e-82aa-82cd59a11685' AND pidgin = 'molowa'
  AND NOT ('lazy person' = ANY(english));

COMMIT;
