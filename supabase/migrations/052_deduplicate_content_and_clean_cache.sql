-- Migration 052: Deduplicate Content Tables, Clean TTS Cache, and Resolve Search Gaps
-- 1. Purge cross-wired Lesson 3 TTS row (id 3789) and retired voice_id rows from translation_cache.
-- 2. Deduplicate pickup_lines (95 -> 45), phrases (1154 -> 1141, merging all 13 slug collisions),
--    quiz_questions (163 -> 154), and crossword_words (611 -> 576), and add unique indexes.
-- 3. Enrich hui ('meeting') and ingest ʻōkole maluna ('bottoms up' / 'toast') + hae ('flag' / 'banner'),
--    closing all 20 pending search_gaps rows.

BEGIN;

-- 1. Clean translation_cache
DELETE FROM public.translation_cache
WHERE id = 3789
  AND audio_filename = 'lesson_note_37_a52b120fef2d0ed088d9e10f1f342e29.mp3';

DELETE FROM public.translation_cache
WHERE direction = 'tts'
  AND voice_id <> 'f0ODjLMfcJmlKfs7dFCW';

-- 2a. Deduplicate pickup_lines (keep lowest id per normalized pidgin)
DELETE FROM public.pickup_lines a
USING public.pickup_lines b
WHERE a.id > b.id
  AND lower(btrim(a.pidgin)) = lower(btrim(b.pidgin));

CREATE UNIQUE INDEX IF NOT EXISTS idx_pickup_lines_pidgin_norm
    ON public.pickup_lines (lower(btrim(pidgin)));

-- 2b. Merge the 13 slug-colliding / duplicate phrase pairs onto canonical surviving ids
UPDATE public.phrases SET pidgin = 'Malama da ''āina', english = 'Take care of the land', category = 'nature' WHERE id = 9;
DELETE FROM public.phrases WHERE id = 662;

UPDATE public.phrases SET pidgin = 'Tanks brah!', english = 'Thanks, bro!', category = 'greetings' WHERE id = 159;
DELETE FROM public.phrases WHERE id = 884;

UPDATE public.phrases SET pidgin = 'Da buggah stay big', english = 'That guy is huge', category = 'slang' WHERE id = 165;
DELETE FROM public.phrases WHERE id = 1094;

UPDATE public.phrases SET pidgin = 'Dis one mo bettah', english = 'This one is much better', category = 'expressions' WHERE id = 276;
DELETE FROM public.phrases WHERE id = 692;

UPDATE public.phrases SET pidgin = 'Pau hana time!', english = 'After-work relaxation time!', category = 'expressions' WHERE id = 405;
DELETE FROM public.phrases WHERE id = 782;

UPDATE public.phrases SET pidgin = 'What, you like beef or what?', english = 'What, do you want to fight?', category = 'expressions' WHERE id = 622;
DELETE FROM public.phrases WHERE id = 1098;

UPDATE public.phrases SET pidgin = 'Maui no ka ''oi', english = 'Maui is the best', category = 'expressions' WHERE id = 730;
DELETE FROM public.phrases WHERE id = 732;

UPDATE public.phrases SET pidgin = 'Oh wow ladat?', english = 'Oh wow, like that?', category = 'expressions' WHERE id = 746;
DELETE FROM public.phrases WHERE id = 747;

UPDATE public.phrases SET pidgin = '''Ohana means family', english = 'Family means nobody gets left behind', category = 'people' WHERE id = 748;
DELETE FROM public.phrases WHERE id = 1072;

UPDATE public.phrases SET pidgin = 'No talk stink', english = 'Do not gossip or speak badly', category = 'expressions' WHERE id = 876;
DELETE FROM public.phrases WHERE id = 1155;

UPDATE public.phrases SET pidgin = 'Try wait!', english = 'Please wait a moment!', category = 'expressions' WHERE id = 902;
DELETE FROM public.phrases WHERE id = 1159;

UPDATE public.phrases SET pidgin = 'We cooking ''ulu tonight', english = 'We are cooking breadfruit tonight', category = 'food' WHERE id = 916;
DELETE FROM public.phrases WHERE id = 1143;

UPDATE public.phrases SET pidgin = 'We go beach', english = 'Let''s go to the beach', category = 'expressions' WHERE id = 942;
DELETE FROM public.phrases WHERE id = 1039;

DELETE FROM public.phrases a
USING public.phrases b
WHERE a.id > b.id
  AND lower(btrim(a.pidgin)) = lower(btrim(b.pidgin));

CREATE UNIQUE INDEX IF NOT EXISTS idx_phrases_pidgin_norm
    ON public.phrases (lower(btrim(pidgin)));

-- 2c. Deduplicate quiz_questions (keep lowest id per normalized question)
DELETE FROM public.quiz_questions a
USING public.quiz_questions b
WHERE a.id > b.id
  AND lower(btrim(a.question)) = lower(btrim(b.question));

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_questions_question_norm
    ON public.quiz_questions (lower(btrim(question)));

-- 2d. Deduplicate crossword_words (keep lowest id per normalized word)
DELETE FROM public.crossword_words a
USING public.crossword_words b
WHERE a.id > b.id
  AND upper(btrim(a.word)) = upper(btrim(b.word));

CREATE UNIQUE INDEX IF NOT EXISTS idx_crossword_words_word_norm
    ON public.crossword_words (upper(btrim(word)));

-- 3. Enrich hui & ingest ʻōkole maluna + hae from real search_gaps
UPDATE public.dictionary_entries SET
    english = ARRAY['group', 'club', 'meeting', 'association', 'organization']::text[],
    updated_at = NOW()
WHERE id = 'hui_074';

INSERT INTO public.dictionary_entries (
    id, pidgin, english, category, pronunciation, examples, usage, origin,
    difficulty, frequency, tags, audio_example, source_language, spelling_variants
)
VALUES
(
    'c9d0e1f2-a3b4-4c5d-8e6f-7a8b9c0d1e23',
    'ʻōkole maluna',
    ARRAY['bottoms up', 'cheers', 'drinking toast']::text[],
    'expressions',
    'oh-KOH-leh mah-LOO-nah',
    ARRAY[
        'Raise your glass — ʻōkole maluna, everybody!',
        'Uncle stood up at da pau hana party and yelled, "ʻŌkole maluna!"',
        'Before we drink, give one big ʻōkole maluna fo'' da birthday girl.'
    ]::text[],
    'Classic humorous Hawaii drinking toast meaning "bottoms up!" (literally "buttocks up" in Hawaiian), said when clinking glasses at pau hana gatherings and backyard parties.',
    'Coined in late-19th-century Hawaii from Hawaiian ʻōkole (buttocks/bottom) + maluna (upward/on top) as a playful literal calque of English "bottoms up!"',
    'beginner',
    'medium',
    ARRAY['toast', 'party', 'expressions', 'hawaiian']::text[],
    'Raise your glass — ʻōkole maluna, everybody!',
    'hawaiian',
    ARRAY['okole maluna']::text[]
),
(
    'd0e1f2a3-b4c5-4d6e-9f7a-8b9c0d1e2f34',
    'hae',
    ARRAY['flag', 'banner']::text[],
    'culture',
    'HYE',
    ARRAY[
        'Ka Hae Hawaiʻi stay flying high at Iolani Palace.',
        'Every classroom had da Hawaiian hae next to da door.',
        'Dey wave da hae proud at da parade.'
    ]::text[],
    'Hawaiian word for flag or banner, most famously heard in Ka Hae Hawaiʻi (the Hawaiian flag) at civic celebrations, parades, and cultural gatherings.',
    'Directly from Hawaiian hae (flag, banner, ensign).',
    'beginner',
    'medium',
    ARRAY['culture', 'hawaiian', 'history']::text[],
    'Ka Hae Hawaiʻi stay flying high at Iolani Palace.',
    'hawaiian',
    ARRAY['ka hae hawaii']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    pidgin = EXCLUDED.pidgin,
    english = EXCLUDED.english,
    category = EXCLUDED.category,
    pronunciation = EXCLUDED.pronunciation,
    examples = EXCLUDED.examples,
    usage = EXCLUDED.usage,
    origin = EXCLUDED.origin,
    difficulty = EXCLUDED.difficulty,
    frequency = EXCLUDED.frequency,
    tags = EXCLUDED.tags,
    audio_example = EXCLUDED.audio_example,
    source_language = EXCLUDED.source_language,
    spelling_variants = EXCLUDED.spelling_variants,
    updated_at = NOW();

-- 4. Close triaged search_gaps
UPDATE public.search_gaps
SET status = 'added'
WHERE status = 'pending'
  AND term IN ('toast', 'bottom', 'bottomsvup', 'meeting', 'flag', 'banner');

UPDATE public.search_gaps
SET status = 'ignored'
WHERE status = 'pending';

COMMIT;
