-- supabase/migrations/20260429100000_moderation_admin_rls_verify.sql
-- Manual probes — replace UUIDs. Each in BEGIN; … ROLLBACK;.

-- Probe 1: non-admin sees only their own reports.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<NORMAL_USER_UUID>';
SELECT count(*) FROM public.reports;
-- Expected: count = number of reports where reporter_user_id = NORMAL_USER_UUID.
ROLLBACK;

-- Probe 2: admin sees all reports.
BEGIN;
INSERT INTO public.admin_users (user_id) VALUES ('<ADMIN_UUID>')
  ON CONFLICT (user_id) DO NOTHING;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<ADMIN_UUID>';
SELECT count(*) FROM public.reports;
-- Expected: count = total reports in the table.
ROLLBACK;

-- Probe 3: admin can update report status; cannot mutate reason.
BEGIN;
INSERT INTO public.admin_users (user_id) VALUES ('<ADMIN_UUID>')
  ON CONFLICT (user_id) DO NOTHING;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<ADMIN_UUID>';
UPDATE public.reports SET status = 'reviewing' WHERE id = '<SOME_REPORT_UUID>';
-- Expected: success (1 row updated; updated_at also bumped).
UPDATE public.reports SET reason = 'other' WHERE id = '<SOME_REPORT_UUID>';
-- Expected: ERROR "Only status / updated_at may be modified on a report".
ROLLBACK;

-- Probe 4: non-admin cannot suspend.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<NORMAL_USER_UUID>';
SELECT public.set_user_access_state('<TARGET_USER_UUID>', 'blocked');
-- Expected: ERROR "Admin access required".
ROLLBACK;

-- Probe 5: admin can suspend.
BEGIN;
INSERT INTO public.admin_users (user_id) VALUES ('<ADMIN_UUID>')
  ON CONFLICT (user_id) DO NOTHING;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<ADMIN_UUID>';
SELECT public.set_user_access_state('<TARGET_USER_UUID>', 'blocked');
SELECT access_state FROM public.users WHERE id = '<TARGET_USER_UUID>';
-- Expected: 'blocked'.
ROLLBACK;
