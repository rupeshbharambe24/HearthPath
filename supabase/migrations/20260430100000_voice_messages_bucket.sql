-- supabase/migrations/20260430100000_voice_messages_bucket.sql

-- 1. Private bucket.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'voice-messages') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('voice-messages', 'voice-messages', false);
  ELSE
    UPDATE storage.buckets SET public = false WHERE id = 'voice-messages';
  END IF;
END $$;

-- 2. SELECT policy: caller must be the sender (path prefix) OR the receiver
--    of a message whose content matches the storage path.
DROP POLICY IF EXISTS "voice_messages_member_select" ON storage.objects;
CREATE POLICY "voice_messages_member_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-messages'
  AND (
    -- Sender: their uuid is the first folder in the object name.
    auth.uid()::text = (storage.foldername(name))[1]
    -- Receiver: a messages row exists where content = name and receiver = caller.
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.content = storage.objects.name
        AND m.content_type = 'voice'
        AND m.receiver_id = auth.uid()
    )
  )
);

-- No INSERT / UPDATE / DELETE policies — only the edge function with the
-- service-role key may write.

-- 3. Index supporting the receiver-side EXISTS lookup.
CREATE INDEX IF NOT EXISTS idx_messages_voice_content
  ON public.messages(content)
  WHERE content_type = 'voice';
