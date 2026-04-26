-- supabase/migrations/20260429100000_moderation_admin_rls.sql
--
-- Phase 1 created reports and moderation_actions but only the reporter could
-- read their own reports. For triage, admins (rows in admin_users) need full
-- read access, INSERT on moderation_actions, and UPDATE on reports (status
-- transitions). All gated by the existing public.is_admin() RPC.

-- 1. reports: admins SELECT all + UPDATE all.
DROP POLICY IF EXISTS "admins_select_all_reports" ON public.reports;
CREATE POLICY "admins_select_all_reports"
ON public.reports
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "admins_update_reports" ON public.reports;
CREATE POLICY "admins_update_reports"
ON public.reports
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. Lock down which fields admins can mutate. Only status, updated_at, and
--    related metadata may change post-insert; reporter / target / reason /
--    details are immutable history.
CREATE OR REPLACE FUNCTION public.check_report_admin_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.reporter_user_id IS DISTINCT FROM OLD.reporter_user_id
     OR NEW.target_user_id IS DISTINCT FROM OLD.target_user_id
     OR NEW.relationship_id IS DISTINCT FROM OLD.relationship_id
     OR NEW.reason IS DISTINCT FROM OLD.reason
     OR NEW.details IS DISTINCT FROM OLD.details
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only status / updated_at may be modified on a report';
  END IF;
  -- Always bump updated_at on a status change so the UI can show "last triaged".
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_report_admin_update ON public.reports;
CREATE TRIGGER check_report_admin_update
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.check_report_admin_update();

-- 3. moderation_actions: admins SELECT and INSERT.
DROP POLICY IF EXISTS "admins_select_moderation_actions" ON public.moderation_actions;
CREATE POLICY "admins_select_moderation_actions"
ON public.moderation_actions
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "admins_insert_moderation_actions" ON public.moderation_actions;
CREATE POLICY "admins_insert_moderation_actions"
ON public.moderation_actions
FOR INSERT
WITH CHECK (public.is_admin() AND created_by = auth.uid());

-- 4. Suspend / reinstate RPC. Admin-only, mutates users.access_state.
CREATE OR REPLACE FUNCTION public.set_user_access_state(
  p_user uuid,
  p_state text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_state NOT IN ('active', 'blocked', 'verification_pending', 'onboarding_required') THEN
    RAISE EXCEPTION 'Unsupported access_state: %', p_state;
  END IF;
  UPDATE public.users SET access_state = p_state WHERE id = p_user;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_access_state(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_access_state(uuid, text) TO authenticated;

-- 5. Index for the most common admin query: open reports newest first.
CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON public.reports(status, created_at DESC);
