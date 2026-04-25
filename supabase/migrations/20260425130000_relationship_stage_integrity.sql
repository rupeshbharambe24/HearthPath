-- supabase/migrations/20260425130000_relationship_stage_integrity.sql

CREATE OR REPLACE FUNCTION public.check_relationship_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF caller NOT IN (NEW.user_a, NEW.user_b) THEN
    RAISE EXCEPTION 'Caller is not a relationship member';
  END IF;

  -- Members are immutable post-insert.
  IF NEW.user_a IS DISTINCT FROM OLD.user_a OR NEW.user_b IS DISTINCT FROM OLD.user_b THEN
    RAISE EXCEPTION 'Cannot reassign relationship members';
  END IF;

  -- New stage requests must originate from the caller, target the next stage,
  -- respect the cooldown, and only happen on a live lifecycle.
  IF NEW.stage_request_status = 'pending'
     AND (OLD.stage_request_status IS DISTINCT FROM 'pending'
          OR OLD.stage_request_from_user_id IS DISTINCT FROM NEW.stage_request_from_user_id) THEN
    IF NEW.stage_request_from_user_id <> caller THEN
      RAISE EXCEPTION 'stage_request_from_user_id must equal caller';
    END IF;
    IF NEW.requested_stage IS NULL OR NEW.requested_stage <> COALESCE(OLD.current_stage, 1) + 1 THEN
      RAISE EXCEPTION 'Can only request the next stage';
    END IF;
    IF NEW.requested_stage > 6 THEN
      RAISE EXCEPTION 'No stage above 6';
    END IF;
    IF OLD.stage_request_cooldown_until IS NOT NULL AND OLD.stage_request_cooldown_until > now() THEN
      RAISE EXCEPTION 'Stage request blocked by cooldown until %', OLD.stage_request_cooldown_until;
    END IF;
    IF OLD.lifecycle_state IN ('archived', 'cooldown', 'paused') THEN
      RAISE EXCEPTION 'Cannot request stage in lifecycle %', OLD.lifecycle_state;
    END IF;
  END IF;

  -- Resolution (accept / decline / defer) must come from the OTHER member.
  IF OLD.stage_request_status = 'pending'
     AND NEW.stage_request_status IS DISTINCT FROM OLD.stage_request_status THEN
    -- Lifecycle terminations (archive/cooldown) may clear pending requests
    -- regardless of who initiated — the relationship is ending, not being resolved.
    IF NEW.lifecycle_state IN ('archived', 'cooldown') THEN
      -- Allowed; no caller restriction.
      NULL;
    ELSE
      -- Otherwise, only the partner may resolve.
      IF caller = OLD.stage_request_from_user_id THEN
        RAISE EXCEPTION 'Originator cannot resolve their own stage request';
      END IF;
      IF NEW.stage_request_status = 'declined' THEN
        NEW.stage_request_cooldown_until := now() + interval '7 days';
      END IF;
    END IF;
  END IF;

  -- current_stage may only advance via accepted request, never set freely.
  IF NEW.current_stage IS DISTINCT FROM OLD.current_stage THEN
    -- Lifecycle terminations may reset stage to 1 regardless of caller.
    IF NEW.lifecycle_state IN ('archived', 'cooldown') AND NEW.current_stage = 1 THEN
      NULL;
    ELSE
      IF NEW.current_stage <> COALESCE(OLD.requested_stage, NEW.current_stage)
         AND NEW.current_stage <> 1 THEN
        RAISE EXCEPTION 'current_stage may only advance to requested_stage via acceptance';
      END IF;
      IF caller = OLD.stage_request_from_user_id THEN
        RAISE EXCEPTION 'Originator cannot self-advance current_stage';
      END IF;
    END IF;
  END IF;

  -- Don't let clients set exclusive_locked_at directly; the existing sync trigger does.
  IF NEW.exclusive_locked_at IS DISTINCT FROM OLD.exclusive_locked_at
     AND NEW.lifecycle_state <> 'exclusive' THEN
    NEW.exclusive_locked_at := OLD.exclusive_locked_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_relationship_update ON public.relationships;
-- Run BEFORE the existing sync_relationship_heartpath_fields trigger so integrity
-- checks happen on user input, then sync normalizes lifecycle state.
CREATE TRIGGER check_relationship_update
BEFORE UPDATE ON public.relationships
FOR EACH ROW EXECUTE FUNCTION public.check_relationship_update();

-- Idempotency: only one pending stage request per relationship at a time.
DROP INDEX IF EXISTS public.unique_pending_stage_request;
CREATE UNIQUE INDEX unique_pending_stage_request
ON public.relationships (id) WHERE stage_request_status = 'pending';
