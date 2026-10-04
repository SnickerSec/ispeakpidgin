-- Migration 032: spelling_variants hold spellings, not search queries
--
-- 027 put raw Search Console queries into spelling_variants so the gap report would stop
-- listing them: English words the entry already lists as meanings (bro, kids, water, money,
-- painful), and phrases around a headword ("brah friend", "kefe in samoan", "beef like
-- fight"). Variants count as the headword itself in search ranking and in the translator, so
-- "water" read as a Pidgin spelling of wai. Real spellings stay (powhana, kuz, bad juju, hu hu,
-- eha, almost pow, kalikimaka). Also drops Pidgin listed as English ("pau hana time" on pau
-- hana, "no needed" on no need) and moves "almost done" to almost pau's meanings.
--
-- Those queries stay covered without fake variants: services/search-gaps.js now treats a
-- headword plus words from its own meanings as covered ("kala money", "beef like fight"),
-- strips more language names ("kefe in samoan"), and counts "does"/"just" as filler.
-- Simulated on 90 days of Search Console queries: only "how is it" and "hu hu hu" reappear
-- as gaps, and neither is a spelling of an existing word.
--
-- array_remove only touches the named values, so other edits to these rows are kept.

BEGIN;

-- braddah: drop "bro", "brah friend"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(array_remove(spelling_variants, 'bro'), 'brah friend'),
    updated_at = now()
WHERE id = 'braddah_318' AND pidgin = 'braddah';

-- cruising: drop "just cruising"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'just cruising'),
    updated_at = now()
WHERE id = 'cruising_524' AND pidgin = 'cruising';

-- kala: drop "money"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'money'),
    updated_at = now()
WHERE id = 'kala_611' AND pidgin = 'kala';

-- kefe: drop "kefe in samoan"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'kefe in samoan'),
    updated_at = now()
WHERE id = 'kefe_399' AND pidgin = 'kefe';

-- howzit: drop "how is it"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'how is it'),
    updated_at = now()
WHERE id = 'howzit_072' AND pidgin = 'howzit';

-- ʻeha: drop "painful"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'painful'),
    updated_at = now()
WHERE id = '591bcbef-7d80-48d6-918f-f4fbcb4f121f' AND pidgin = 'ʻeha';

-- almost pau: drop "almost done"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'almost done'),
    english = CASE WHEN 'almost done' = ANY(english) THEN english ELSE english || ARRAY['almost done']::text[] END,
    updated_at = now()
WHERE id = '95cfdb32-2ef3-40c4-8e8e-eba13a714279' AND pidgin = 'almost pau';

-- faka: drop "onefaka", "one faka"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(array_remove(spelling_variants, 'onefaka'), 'one faka'),
    updated_at = now()
WHERE id = 'faka_331' AND pidgin = 'faka';

-- like beef: drop "beef like fight", "like fight"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(array_remove(spelling_variants, 'beef like fight'), 'like fight'),
    updated_at = now()
WHERE id = 'like_beef_105' AND pidgin = 'like beef';

-- huhu: drop "hu hu hu"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'hu hu hu'),
    updated_at = now()
WHERE id = 'huhu_073' AND pidgin = 'huhu';

-- no need: drop "no needed", "no need explanation"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(array_remove(spelling_variants, 'no needed'), 'no need explanation'),
    english = array_remove(english, 'no needed'),
    updated_at = now()
WHERE id = 'no_need_131' AND pidgin = 'no need';

-- cuz: drop "lil cuz", "does cuz"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(array_remove(spelling_variants, 'lil cuz'), 'does cuz'),
    updated_at = now()
WHERE id = 'cuz_039' AND pidgin = 'cuz';

-- keiki: drop "kids", "children"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(array_remove(spelling_variants, 'kids'), 'children'),
    updated_at = now()
WHERE id = 'keiki_093' AND pidgin = 'keiki';

-- pau hana: drop "pau hana time"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'pau hana time'),
    english = array_remove(english, 'pau hana time'),
    updated_at = now()
WHERE id = 'pau_hana_144' AND pidgin = 'pau hana';

-- wai: drop "water"
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'water'),
    updated_at = now()
WHERE id = 'wai_4008' AND pidgin = 'wai';

-- goin: drop "going" (became a variant when 031 merged the "going" entry; it is goin's meaning)
UPDATE public.dictionary_entries SET
    spelling_variants = array_remove(spelling_variants, 'going'),
    updated_at = now()
WHERE pidgin = 'goin' AND 'going' = ANY(spelling_variants);

COMMIT;
