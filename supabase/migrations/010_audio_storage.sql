-- Create a new bucket for dictionary audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the audio bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'audio' );

-- Allow authenticated users (admins) to upload/update audio
-- Since the admin panel uses service role key, this is technically not needed for the server
-- but good for consistency
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'audio' );

CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'audio' );

CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'audio' );
