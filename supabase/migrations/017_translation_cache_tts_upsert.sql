-- The TTS audio cache writes into translation_cache with an ON CONFLICT target of
-- (md5_hash, direction, voice_id). Migration 012's unique index is an *expression* index --
-- (md5_hash, direction, COALESCE(voice_id, 'none')) -- which PostgREST's upsert cannot target,
-- so it needs a plain-column unique index as well.
--
-- Context: as of 2026-08-23 migration 012 had never been applied to production. The route was
-- logging "Could not find the table 'public.translation_cache' in the schema cache" on every
-- request, nothing was cached, and every playback was billed by ElevenLabs -- while the audio
-- files themselves uploaded successfully, accumulating in the audio-assets bucket with no index
-- pointing at them. Apply 012 before this one.

CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_cache_tts_entry
ON public.translation_cache (md5_hash, direction, voice_id);
