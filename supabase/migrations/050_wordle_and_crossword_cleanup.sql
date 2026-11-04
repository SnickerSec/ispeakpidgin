-- Migration 050: Wordle & Crossword Data Cleanup and Expansion
-- 1. Backfill missing meanings & pronunciations on Wordle daily solutions (OKOLE, LIDAT, GOING)
--    and replace kahakō-corrupted KLOLO with OPELU.
-- 2. Add 19 authentic 5-letter Hawaiian Pidgin dictionary terms to wordle_words as daily solutions.
-- 3. Remove 13 kahakō-stripped duplicate rows from crossword_words and fix 3 kahakō-stripped rows
--    (HAKAK -> HAKAKA, PHOEHOE -> PAHOEHOE, PODOCE -> PAODOCE).

-- 1. Wordle daily solution fixes
UPDATE wordle_words
SET meaning = 'buttocks; rear end; behind',
    pronunciation = 'oh-KOH-leh',
    difficulty = 'medium'
WHERE id = 60 AND word = 'OKOLE';

UPDATE wordle_words
SET meaning = 'like that; in that way ("das how stay lidat")',
    pronunciation = 'lie-DAT',
    difficulty = 'easy'
WHERE id = 74 AND word = 'LIDAT';

UPDATE wordle_words
SET meaning = 'will; going to (Pidgin future marker, "I going beach")',
    pronunciation = 'GOH-ing',
    difficulty = 'easy'
WHERE id = 79 AND word = 'GOING';

UPDATE wordle_words
SET word = 'OPELU',
    meaning = 'mackerel scad fish; prized local scad fish',
    pronunciation = 'oh-PEH-loo',
    difficulty = 'medium'
WHERE id = 85;

-- 2. Expand wordle_words with 19 5-letter Pidgin dictionary terms
INSERT INTO wordle_words (word, is_solution, is_valid_guess, meaning, pronunciation, difficulty)
VALUES
  ('BLALA', true, true, 'large local man; tough local guy', 'BLAH-lah', 'medium'),
  ('TANTE', true, true, 'aunty; aunt (Portuguese origin)', 'TAHN-teh', 'medium'),
  ('BOTAN', true, true, 'button; snap fastener (Japanese origin)', 'boh-TAHN', 'medium'),
  ('TOTUS', true, true, 'fart; flatulence', 'TOH-toos', 'medium'),
  ('GARUT', true, true, 'flirty; boy-crazy; girl-crazy; teasing', 'gah-ROOT', 'medium'),
  ('BOROZ', true, true, 'drunk; messed up; broken; intoxicated', 'BOH-rohz', 'medium'),
  ('CUZZO', true, true, 'cousin; close friend; relative', 'KOO-zoh', 'easy'),
  ('SCOBE', true, true, 'to look; to check out; to scope', 'SCOBE', 'medium'),
  ('MUGGA', true, true, 'muscular; thick-built; stocky; strong person', 'MUG-gah', 'easy'),
  ('HIAPO', true, true, 'first-born child', 'hee-AH-poh', 'medium'),
  ('KARAI', true, true, 'spicy; spicy hot; peppery (Japanese origin)', 'kah-RYE', 'medium'),
  ('PUKUI', true, true, 'to gather; to huddle', 'poo-KOO-ee', 'medium'),
  ('STINK', true, true, 'mean; rude; nasty; in a bad mood ("talk stink")', 'STINK', 'easy'),
  ('SPOIL', true, true, 'spoiled; acting entitled; fussy; bratty', 'SPOIL', 'easy'),
  ('BLEND', true, true, 'socialize; hang out; mix in naturally; fit in', 'BLEND', 'medium'),
  ('NOSEY', true, true, 'prying; meddling; curious; niele', 'NO-zee', 'easy'),
  ('TIRED', true, true, 'tired; sleepy; exhausted', 'TY-erd', 'easy'),
  ('SOONO', true, true, 'so ono; very delicious; very tasty', 'so OH-noh', 'easy'),
  ('NOGET', true, true, 'no get; there isn''t any; don''t have', 'noh GET', 'easy')
ON CONFLICT (word) DO UPDATE
SET is_solution = EXCLUDED.is_solution,
    is_valid_guess = EXCLUDED.is_valid_guess,
    meaning = EXCLUDED.meaning,
    pronunciation = EXCLUDED.pronunciation,
    difficulty = EXCLUDED.difficulty;

-- 3. Clean up kahakō-corrupted rows in crossword_words
DELETE FROM crossword_words
WHERE id IN (280, 313, 337, 338, 339, 341, 346, 359, 360, 379, 483, 492, 497);

UPDATE crossword_words SET word = 'HAKAKA', length = 6 WHERE id = 211;
UPDATE crossword_words SET word = 'PAHOEHOE', length = 8 WHERE id = 484;
UPDATE crossword_words SET word = 'PAODOCE', length = 7 WHERE id = 496;
