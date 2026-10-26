-- Migration 047: page respellings for eight terms where the page and the audio disagreed
--
-- Settled 2026-10-24..26 from three independent model readings (asked about Hawaiian Pidgin /
-- Hawaiʻi Creole English, not ʻōlelo Hawaiʻi) plus the dictionary's own definitions; only the
-- terms all three agreed on change. The matching audio (TTS map) changed in the same commit.
--
--   ʻāina        AH-ee-nah   -> EYE-nah        "ai" is one sound in Pidgin; two syllables
--   try wait     try-WAYT    -> chry-WAYT      tr- affricates to chr- (Odo: chrai weit)
--   talk stink   TALK-stink  -> talk-STEENK    i before -nk tenses to ee; stress on stink
--   lomi salmon  ...SAH-mun  -> ...SAM-un      locals say salmon the English way
--   aurite       AW-right    -> aw-RITE        prominence on the second syllable
--   bline        B-LINE      -> BLINE          one syllable ("B-LINE" read as bee-line)
--   danjah, suk suk: page already right (DANE-jah, SUK-suk); only the audio changed.

BEGIN;

UPDATE dictionary_entries SET pronunciation = 'EYE-nah',         updated_at = NOW() WHERE pidgin = 'aina'        AND pronunciation = 'AH-ee-nah';
UPDATE dictionary_entries SET pronunciation = 'chry-WAYT',       updated_at = NOW() WHERE pidgin = 'try wait'    AND pronunciation = 'try-WAYT';
UPDATE dictionary_entries SET pronunciation = 'talk-STEENK',     updated_at = NOW() WHERE pidgin = 'talk stink'  AND pronunciation = 'TALK-stink';
UPDATE dictionary_entries SET pronunciation = 'LOH-mee SAM-un',  updated_at = NOW() WHERE pidgin = 'lomi salmon' AND pronunciation = 'LOH-mee SAH-mun';
UPDATE dictionary_entries SET pronunciation = 'aw-RITE',         updated_at = NOW() WHERE pidgin = 'aurite'      AND pronunciation = 'AW-right';
UPDATE dictionary_entries SET pronunciation = 'BLINE',           updated_at = NOW() WHERE pidgin = 'bline'       AND pronunciation = 'B-LINE';

COMMIT;
