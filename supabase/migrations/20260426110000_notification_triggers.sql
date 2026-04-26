-- supabase/migrations/20260426110000_notification_triggers.sql

CREATE OR REPLACE FUNCTION public.notify_on_relationship_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  partner uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.lifecycle_state = 'pending' AND NEW.user_a IS NOT NULL AND NEW.user_b IS NOT NULL THEN
      PERFORM public.create_notification(
        NEW.user_b, NEW.user_a, 'invitation_received',
        jsonb_build_object('relationship_id', NEW.id),
        'relationship', NEW.id
      );
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE handlers below.

  -- Invitation accepted (pending -> active).
  IF OLD.lifecycle_state = 'pending'
     AND NEW.lifecycle_state = 'active'
     AND OLD.user_a IS NOT NULL THEN
    PERFORM public.create_notification(
      OLD.user_a, OLD.user_b, 'invitation_accepted',
      jsonb_build_object('relationship_id', NEW.id),
      'relationship', NEW.id
    );
  END IF;

  -- Invitation declined (pending -> archived).
  IF OLD.lifecycle_state = 'pending'
     AND NEW.lifecycle_state = 'archived'
     AND OLD.user_a IS NOT NULL THEN
    PERFORM public.create_notification(
      OLD.user_a, OLD.user_b, 'invitation_declined',
      jsonb_build_object('relationship_id', NEW.id),
      'relationship', NEW.id
    );
  END IF;

  -- New stage request opened.
  IF NEW.stage_request_status = 'pending'
     AND (OLD.stage_request_status IS DISTINCT FROM 'pending'
          OR OLD.stage_request_from_user_id IS DISTINCT FROM NEW.stage_request_from_user_id) THEN
    partner := CASE
      WHEN NEW.stage_request_from_user_id = OLD.user_a THEN OLD.user_b
      ELSE OLD.user_a
    END;
    PERFORM public.create_notification(
      partner, NEW.stage_request_from_user_id, 'stage_requested',
      jsonb_build_object(
        'relationship_id', NEW.id,
        'requested_stage', NEW.requested_stage
      ),
      'relationship', NEW.id
    );
  END IF;

  -- Stage request resolved (pending -> {accepted/declined/deferred}).
  IF OLD.stage_request_status = 'pending'
     AND NEW.stage_request_status IS DISTINCT FROM 'pending'
     AND OLD.stage_request_from_user_id IS NOT NULL THEN
    IF NEW.current_stage > OLD.current_stage THEN
      PERFORM public.create_notification(
        OLD.stage_request_from_user_id,
        CASE WHEN OLD.stage_request_from_user_id = OLD.user_a THEN OLD.user_b ELSE OLD.user_a END,
        'stage_accepted',
        jsonb_build_object('relationship_id', NEW.id, 'new_stage', NEW.current_stage),
        'relationship', NEW.id
      );
    ELSIF NEW.stage_request_status = 'declined' THEN
      PERFORM public.create_notification(
        OLD.stage_request_from_user_id,
        CASE WHEN OLD.stage_request_from_user_id = OLD.user_a THEN OLD.user_b ELSE OLD.user_a END,
        'stage_declined',
        jsonb_build_object('relationship_id', NEW.id, 'requested_stage', OLD.requested_stage),
        'relationship', NEW.id
      );
    ELSIF NEW.stage_request_status = 'deferred' THEN
      PERFORM public.create_notification(
        OLD.stage_request_from_user_id,
        CASE WHEN OLD.stage_request_from_user_id = OLD.user_a THEN OLD.user_b ELSE OLD.user_a END,
        'stage_deferred',
        jsonb_build_object('relationship_id', NEW.id, 'requested_stage', OLD.requested_stage),
        'relationship', NEW.id
      );
    END IF;
  END IF;

  -- Hearts.
  IF COALESCE(NEW.hearts_a2b, 0) > COALESCE(OLD.hearts_a2b, 0) THEN
    PERFORM public.create_notification(
      OLD.user_b, OLD.user_a, 'heart_received',
      jsonb_build_object('relationship_id', NEW.id, 'count', NEW.hearts_a2b),
      'relationship', NEW.id
    );
  END IF;
  IF COALESCE(NEW.hearts_b2a, 0) > COALESCE(OLD.hearts_b2a, 0) THEN
    PERFORM public.create_notification(
      OLD.user_a, OLD.user_b, 'heart_received',
      jsonb_build_object('relationship_id', NEW.id, 'count', NEW.hearts_b2a),
      'relationship', NEW.id
    );
  END IF;

  -- Breakup (active/exclusive/paused -> archived/cooldown). Notify the other party.
  IF OLD.lifecycle_state IN ('active', 'exclusive', 'paused')
     AND NEW.lifecycle_state IN ('archived', 'cooldown') THEN
    partner := CASE WHEN auth.uid() = OLD.user_a THEN OLD.user_b ELSE OLD.user_a END;
    PERFORM public.create_notification(
      partner, auth.uid(), 'breakup_initiated',
      jsonb_build_object('relationship_id', NEW.id),
      'relationship', NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_relationship_change ON public.relationships;
CREATE TRIGGER notify_on_relationship_change
AFTER INSERT OR UPDATE ON public.relationships
FOR EACH ROW EXECUTE FUNCTION public.notify_on_relationship_change();


CREATE OR REPLACE FUNCTION public.notify_on_permission_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.granted_to, NEW.granted_by, 'permission_granted',
      jsonb_build_object(
        'relationship_id', NEW.relationship_id,
        'permission', NEW.permission
      ),
      'relationship_permission', NEW.id
    );
    RETURN NEW;
  END IF;

  IF OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.granted_to, NEW.granted_by, 'permission_revoked',
      jsonb_build_object(
        'relationship_id', NEW.relationship_id,
        'permission', NEW.permission
      ),
      'relationship_permission', NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_permission_change ON public.relationship_permissions;
CREATE TRIGGER notify_on_permission_change
AFTER INSERT OR UPDATE ON public.relationship_permissions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_permission_change();


CREATE OR REPLACE FUNCTION public.notify_on_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.blocked_users b
    WHERE (b.blocker_id = NEW.receiver_id AND b.blocked_id = NEW.sender_id)
       OR (b.blocker_id = NEW.sender_id AND b.blocked_id = NEW.receiver_id)
  ) THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_notification(
    NEW.receiver_id, NEW.sender_id, 'message_received',
    jsonb_build_object(
      'message_id', NEW.id,
      'preview', left(coalesce(NEW.content, ''), 80)
    ),
    'message', NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_message_insert ON public.messages;
CREATE TRIGGER notify_on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_message_insert();
