-- Migration 035: correct faka
--
-- faka was defined as "bro / friend / faker / pretender" with an "uncertain" origin, and the
-- faka page called it "not a bad word" from Samoan/Tongan. It is Pidgin's pronunciation of
-- English "fucker" (dropped final r, as in braddah, buggah): rough affection between close
-- friends, an insult otherwise. The "faker" sense was invented, and had spread into two
-- phrases (304, 305) and quiz question 105, which marked "you are being fake" as correct.
--
-- Each UPDATE is guarded on the old value, so re-running is a no-op and later edits are kept.

BEGIN;

UPDATE public.dictionary_entries SET
    english = ARRAY['jerk', 'bastard', 'guy (crude)', 'you bugger (between friends)']::text[],
    examples = ARRAY['Eh, faka! Long time no see!', 'Dis faka wen eat all my musubi!', 'Who dat faka tink he is?']::text[],
    usage = 'Crude: a swear word. Between close friends it is rough affection, like "buggah" ("Lucky faka, you wen win again?"). Said to a stranger, or about someone you are mad at, it is an insult. Not for elders, kids, or work; visitors wanting a friendly "bro" should say "brah".',
    origin = 'English "f*cker" in Pidgin pronunciation, which drops a final r (brother → braddah, bugger → buggah). Not from Tongan or Samoan; the Tongan prefix faka- is unrelated.',
    audio_example = 'Eh, faka! Long time no see!',
    tags = ARRAY['slang', 'people', 'vulgar', 'insult']::text[],
    updated_at = now()
WHERE pidgin = 'faka' AND 'faker' = ANY(english);

UPDATE public.phrases SET
    english = 'He''s a jerk',
    context = 'Crude: faka is Pidgin for f*cker. An insult unless said between close friends',
    tags = ARRAY['slang', 'vulgar']::text[],
    updated_at = now()
WHERE id = 304 AND english = 'faker';

UPDATE public.phrases SET
    english = 'Don''t be a jerk',
    context = 'Crude: faka is Pidgin for f*cker. Only between close friends',
    tags = ARRAY['slang', 'vulgar']::text[],
    updated_at = now()
WHERE id = 305 AND english = 'faker';

UPDATE public.quiz_questions SET
    question = 'Your old friend grins and says "Eh, faka! Long time!" What is going on?',
    options = jsonb_build_array(
        'They are greeting you warmly, with a swear word only close friends use.',
        'They are calling you fake.',
        'They are speaking Tongan.',
        'They are asking you for a favor.'
    ),
    correct_answer = 'They are greeting you warmly, with a swear word only close friends use.',
    explanation = '''Faka'' is Pidgin for the English swear word ''f*cker''. Between close friends it is affectionate, like ''you bugger''; from a stranger it is an insult. It does not mean fake.',
    tags = ARRAY['slang', 'context', 'vulgar']::text[]
WHERE id = 105 AND correct_answer = 'You are being fake or insincere.';

COMMIT;
