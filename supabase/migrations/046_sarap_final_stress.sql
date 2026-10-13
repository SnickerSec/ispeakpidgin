-- Migration 046: sarap is stressed on the final syllable (sah-RAHP)
--
-- Tagalog saráp (mabilis: final stress, no glottal stop) was written "SAH-rahp",
-- stressing the wrong syllable. Local Pidgin keeps the final stress, as in bruddAH and
-- sistAH. The TTS map now carries 'sarap': 'suh-rahp' so the audio follows the guide.

BEGIN;

UPDATE dictionary_entries
SET pronunciation = 'sah-RAHP',
    updated_at = NOW()
WHERE pidgin = 'sarap'
  AND pronunciation = 'SAH-rahp';

COMMIT;
