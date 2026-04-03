DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'profile-photos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profile-photos', 'profile-photos', true);
  ELSE
    UPDATE storage.buckets
    SET public = true
    WHERE id = 'profile-photos';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload their own photos'
  ) THEN
    CREATE POLICY "Users can upload their own photos" ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'profile-photos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read access for profile photos'
  ) THEN
    CREATE POLICY "Public read access for profile photos" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'profile-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update their own photos'
  ) THEN
    CREATE POLICY "Users can update their own photos" ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'profile-photos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete their own photos'
  ) THEN
    CREATE POLICY "Users can delete their own photos" ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'profile-photos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;
