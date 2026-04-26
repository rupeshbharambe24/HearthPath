-- supabase/migrations/20260428100000_memory_attachments_bucket.sql

-- 1. Private bucket.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'memory-attachments') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('memory-attachments', 'memory-attachments', false);
  ELSE
    UPDATE storage.buckets SET public = false WHERE id = 'memory-attachments';
  END IF;
END $$;

-- 2. Storage policies. Direct INSERT/UPDATE/DELETE locked down to the
--    upload-memory-attachment edge function (service-role). Direct SELECT
--    is allowed for relationship members so the owner can preview their
--    own upload immediately, but cross-user reads of private memories
--    must still go through the signed-url edge function (which re-checks
--    memory visibility).
DROP POLICY IF EXISTS "memory_attachments_member_select" ON storage.objects;
CREATE POLICY "memory_attachments_member_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'memory-attachments'
  AND EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = ((storage.foldername(name))[1])::uuid
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
);

-- No INSERT / UPDATE / DELETE policies — only the edge function with the
-- service-role key may write. (Phase 1 verification-documents bucket uses
-- the same pattern.)

-- 3. Whitelist attachment_type values (NULL still allowed for text-only memories).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memories_attachment_type_check'
  ) THEN
    ALTER TABLE public.memories
      ADD CONSTRAINT memories_attachment_type_check
      CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'audio', 'pdf'));
  END IF;
END $$;
