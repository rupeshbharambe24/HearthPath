-- supabase/migrations/20260425140000_rate_limits.sql

-- Discovery: max 3 invitations per actor per day.
CREATE OR REPLACE FUNCTION public.check_discovery_action_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  todays_invites int;
BEGIN
  IF NEW.action_type = 'invite_sent' THEN
    SELECT count(*) INTO todays_invites
    FROM public.discovery_actions
    WHERE actor_user_id = NEW.actor_user_id
      AND action_type = 'invite_sent'
      AND action_date = CURRENT_DATE;
    IF todays_invites >= 3 THEN
      RAISE EXCEPTION 'Daily HeartPath invitation limit (3) reached';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_discovery_action_rate ON public.discovery_actions;
CREATE TRIGGER check_discovery_action_rate
BEFORE INSERT ON public.discovery_actions
FOR EACH ROW EXECUTE FUNCTION public.check_discovery_action_rate();

-- Reports: max 5 per reporter per day, no duplicate target within 24h.
CREATE OR REPLACE FUNCTION public.check_report_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  todays_reports int;
  duplicate int;
BEGIN
  SELECT count(*) INTO todays_reports
  FROM public.reports
  WHERE reporter_user_id = NEW.reporter_user_id
    AND created_at::date = CURRENT_DATE;
  IF todays_reports >= 5 THEN
    RAISE EXCEPTION 'Daily report limit (5) reached';
  END IF;

  SELECT count(*) INTO duplicate
  FROM public.reports
  WHERE reporter_user_id = NEW.reporter_user_id
    AND target_user_id = NEW.target_user_id
    AND created_at > now() - interval '24 hours';
  IF duplicate >= 1 THEN
    RAISE EXCEPTION 'You already reported this user in the last 24 hours';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_report_rate ON public.reports;
CREATE TRIGGER check_report_rate
BEFORE INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.check_report_rate();
