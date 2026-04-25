-- supabase/migrations/20260425140000_rate_limits_verify.sql
-- Manual probes — replace UUIDs. Each in BEGIN; … ROLLBACK;.

-- Probe 1: 4th invite of the day fails.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.discovery_actions (actor_user_id, target_user_id, action_type) VALUES
  ('<USER_A_UUID>', '<TARGET_1>', 'invite_sent'),
  ('<USER_A_UUID>', '<TARGET_2>', 'invite_sent'),
  ('<USER_A_UUID>', '<TARGET_3>', 'invite_sent');
INSERT INTO public.discovery_actions (actor_user_id, target_user_id, action_type)
VALUES ('<USER_A_UUID>', '<TARGET_4>', 'invite_sent');
-- Expected: ERROR "Daily HeartPath invitation limit (3) reached".
ROLLBACK;

-- Probe 2: 'pass' actions don't count toward the cap.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.discovery_actions (actor_user_id, target_user_id, action_type) VALUES
  ('<USER_A_UUID>', '<TARGET_1>', 'pass'),
  ('<USER_A_UUID>', '<TARGET_2>', 'pass'),
  ('<USER_A_UUID>', '<TARGET_3>', 'pass'),
  ('<USER_A_UUID>', '<TARGET_4>', 'pass'),
  ('<USER_A_UUID>', '<TARGET_5>', 'pass');
-- Expected: success — pass count is unbounded.
ROLLBACK;

-- Probe 3: 6th report of the day fails.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.reports (reporter_user_id, target_user_id, reason) VALUES
  ('<USER_A_UUID>', '<TARGET_1>', 'other'),
  ('<USER_A_UUID>', '<TARGET_2>', 'other'),
  ('<USER_A_UUID>', '<TARGET_3>', 'other'),
  ('<USER_A_UUID>', '<TARGET_4>', 'other'),
  ('<USER_A_UUID>', '<TARGET_5>', 'other');
INSERT INTO public.reports (reporter_user_id, target_user_id, reason)
VALUES ('<USER_A_UUID>', '<TARGET_6>', 'other');
-- Expected: ERROR "Daily report limit (5) reached".
ROLLBACK;

-- Probe 4: duplicate report against same target within 24h fails.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.reports (reporter_user_id, target_user_id, reason)
VALUES ('<USER_A_UUID>', '<TARGET_1>', 'pressure');
INSERT INTO public.reports (reporter_user_id, target_user_id, reason)
VALUES ('<USER_A_UUID>', '<TARGET_1>', 'harassment');
-- Expected: ERROR "You already reported this user in the last 24 hours".
ROLLBACK;
