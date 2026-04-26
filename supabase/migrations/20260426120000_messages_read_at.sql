-- supabase/migrations/20260426120000_messages_read_at.sql

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON public.messages(receiver_id, created_at DESC)
  WHERE read_at IS NULL;

-- RLS UPDATE: only the receiver can set read_at, and ONLY read_at can change.
DROP POLICY IF EXISTS "messages_receiver_mark_read" ON public.messages;
CREATE POLICY "messages_receiver_mark_read"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

CREATE OR REPLACE FUNCTION public.check_message_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
     OR NEW.content IS DISTINCT FROM OLD.content
     OR NEW.content_type IS DISTINCT FROM OLD.content_type
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read_at may be modified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_message_update ON public.messages;
CREATE TRIGGER check_message_update
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.check_message_update();
