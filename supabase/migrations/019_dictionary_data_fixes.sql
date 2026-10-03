-- Dictionary data fixes found while classifying entries for migration 018.
--
-- 1. Twelve entries stored a list of meanings as ONE array element ("stomach, tummy"), so the
--    translator only matched the whole string and "stomach" never found "opu". Split them.
--    Entries whose comma is part of a real sentence ("shoots, brah!") are left alone.
-- 2. ko'olina was defined as "windward, wet side of island". Ko Olina is a resort area on
--    Oʻahu's leeward (dry) west side; the Hawaiian word for windward is koʻolau. Corrected in
--    place so /word/koolina.html keeps its URL.
--
-- Every UPDATE is keyed on id AND the current value, so a row edited since this was drafted
-- (2026-10-02) is skipped rather than overwritten. Safe to run more than once.

-- 1. Split joined meanings
UPDATE public.dictionary_entries SET english = ARRAY['stupid', 'foolish']
WHERE id = 'hupo_609' AND english = ARRAY['stupid, foolish'];

UPDATE public.dictionary_entries SET english = ARRAY['veranda', 'porch']
WHERE id = 'lanai_618' AND english = ARRAY['veranda, porch', 'porch or veranda'];

UPDATE public.dictionary_entries SET english = ARRAY['toilet', 'bathroom']
WHERE id = 'lua_623' AND english = ARRAY['toilet, bathroom'];

UPDATE public.dictionary_entries SET english = ARRAY['togetherness', 'unity']
WHERE id = 'lokahi_621' AND english = ARRAY['togetherness, unity'];

UPDATE public.dictionary_entries SET english = ARRAY['fat', 'obese']
WHERE id = 'momona_628' AND english = ARRAY['fat, obese'];

UPDATE public.dictionary_entries SET english = ARRAY['grandchild', 'descendant']
WHERE id = 'moopuna_630' AND english = ARRAY['grandchild, descendant'];

UPDATE public.dictionary_entries SET english = ARRAY['stomach', 'tummy']
WHERE id = 'opu_646' AND english = ARRAY['stomach, tummy'];

UPDATE public.dictionary_entries SET english = ARRAY['beef', 'cow', 'bull']
WHERE id = 'pipi_634' AND english = ARRAY['beef, cow, bull'];

UPDATE public.dictionary_entries SET english = ARRAY['man', 'husband', 'male']
WHERE id = 'kane_3010' AND english = ARRAY['man', 'husband', 'male', 'man, male, husband'];

UPDATE public.dictionary_entries SET english = ARRAY['the boss', 'foreman']
WHERE id = 'luna_622' AND english = ARRAY['the boss, foreman'];

UPDATE public.dictionary_entries SET english = ARRAY['pig', 'pork']
WHERE id = 'puaa_639' AND english = ARRAY['pig, pork'];

UPDATE public.dictionary_entries SET english = ARRAY['waste', 'loss', 'useless', 'wasteful', 'wasted']
WHERE id = 'poh_380' AND english = ARRAY['waste', 'loss', 'useless, wasteful, wasted'];

-- 2. Correct ko'olina
UPDATE public.dictionary_entries
SET english  = ARRAY['Ko Olina', 'resort area on Oʻahu''s west side'],
    usage    = 'Ko Olina is a resort area with calm, man-made swimming lagoons on Oʻahu''s leeward (west) side, near Kapolei. It is a place name, not a direction: the windward side is koʻolau.',
    examples = ARRAY['We go Ko Olina lagoon fo'' swim wit da keiki.', 'Ko Olina stay on da west side, mo'' dry dan town.'],
    origin   = 'Hawaiian place name (Ko ʻOlina, commonly translated "place of joy") on Oʻahu''s leeward coast.'
WHERE id = 'koolina_4003' AND english = ARRAY['windward', 'wet side of island'];
