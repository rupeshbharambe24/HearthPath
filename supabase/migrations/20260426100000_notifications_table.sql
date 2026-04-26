-- supabase/migrations/20260426100000_notifications_table.sql

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN (
    'stage_requested',
    'stage_accepted',
    'stage_declined',
    'stage_deferred',
    'permission_granted',
    'permission_revoked',
    'heart_received',
    'message_received',
    'invitation_received',
    'invitation_accepted',
    'invitation_declined',
    'breakup_initiated'
  )),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  related_kind text,
  related_id uuid,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications(recipient_user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_recent
  ON public.notifications(recipient_user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_self_select" ON public.notifications;
CREATE POLICY "notifications_self_select"
ON public.notifications
FOR SELECT
USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_self_update" ON public.notifications;
CREATE POLICY "notifications_self_update"
ON public.notifications
FOR UPDATE
USING (recipient_user_id = auth.uid())
WITH CHECK (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_self_delete" ON public.notifications;
CREATE POLICY "notifications_self_delete"
ON public.notifications
FOR DELETE
USING (recipient_user_id = auth.uid());

-- No INSERT policy: only the create_notification() RPC and triggers (Task 2)
-- write notifications, both running as SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.check_notification_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.recipient_user_id IS DISTINCT FROM OLD.recipient_user_id
     OR NEW.actor_user_id IS DISTINCT FROM OLD.actor_user_id
     OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.payload IS DISTINCT FROM OLD.payload
     OR NEW.related_kind IS DISTINCT FROM OLD.related_kind
     OR NEW.related_id IS DISTINCT FROM OLD.related_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read_at may be modified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_notification_update ON public.notifications;
CREATE TRIGGER check_notification_update
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.check_notification_update();

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add to realtime publication only if not already a member.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient uuid,
  p_actor uuid,
  p_kind text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_related_kind text DEFAULT NULL,
  p_related_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF p_recipient IS NULL THEN
    RAISE EXCEPTION 'recipient is required';
  END IF;
  IF p_recipient = p_actor THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.notifications
    (recipient_user_id, actor_user_id, kind, payload, related_kind, related_id)
  VALUES (p_recipient, p_actor, p_kind, p_payload, p_related_kind, p_related_id)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, uuid, text, jsonb, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, uuid, text, jsonb, text, uuid) TO authenticated;
