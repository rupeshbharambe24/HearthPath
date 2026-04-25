-- supabase/migrations/20260425150000_block_enforcement.sql

-- Prevent blocked users from sending messages.
CREATE OR REPLACE FUNCTION public.check_message_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.blocked_users b
    WHERE (b.blocker_id = NEW.sender_id AND b.blocked_id = NEW.receiver_id)
       OR (b.blocker_id = NEW.receiver_id AND b.blocked_id = NEW.sender_id)
  ) THEN
    RAISE EXCEPTION 'Messaging blocked between these users';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_message_block ON public.messages;
CREATE TRIGGER check_message_block
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.check_message_block();

-- Hide messages with blocked counterparties from SELECT.
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "messages_select_unless_blocked" ON public.messages;
CREATE POLICY "messages_select_unless_blocked"
ON public.messages
FOR SELECT
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.blocked_users b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id IN (sender_id, receiver_id))
       OR (b.blocked_id = auth.uid() AND b.blocker_id IN (sender_id, receiver_id))
  )
);

-- Prevent new relationships across a block.
CREATE OR REPLACE FUNCTION public.check_relationship_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.blocked_users b
    WHERE (b.blocker_id = NEW.user_a AND b.blocked_id = NEW.user_b)
       OR (b.blocker_id = NEW.user_b AND b.blocked_id = NEW.user_a)
  ) THEN
    RAISE EXCEPTION 'Cannot start relationship with blocked user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_relationship_block ON public.relationships;
CREATE TRIGGER check_relationship_block
BEFORE INSERT ON public.relationships
FOR EACH ROW EXECUTE FUNCTION public.check_relationship_block();

-- Helpful index for the bidirectional block lookups in triggers and policies.
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);
