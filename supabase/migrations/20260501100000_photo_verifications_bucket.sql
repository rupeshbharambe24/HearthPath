-- supabase/migrations/20260501100000_photo_verifications_bucket.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'photo-verifications') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('photo-verifications', 'photo-verifications', false);
  ELSE
    UPDATE storage.buckets SET public = false WHERE id = 'photo-verifications';
  END IF;
END $$;

DROP POLICY IF EXISTS "photo_verifications_self_read" ON storage.objects;
CREATE POLICY "photo_verifications_self_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'photo-verifications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- No INSERT / UPDATE / DELETE policies — only the upload edge function with
-- the service-role key may write.
