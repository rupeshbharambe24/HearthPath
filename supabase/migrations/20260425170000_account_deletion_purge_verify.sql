-- supabase/migrations/20260425170000_account_deletion_purge_verify.sql
-- Manual probes — replace UUIDs. Each in BEGIN; … ROLLBACK; so no real data
-- is touched. Run as service role / table owner (purge_user is service-only).

-- Probe 1: purge_user removes rows across every keyed table.
BEGIN;
-- Seed (assumes USER_A exists with at least:
--   1 relationship with USER_B, 1 report against USER_C, 1 memory in the rel,
--   1 weekly check-in, 1 discovery_action invite_sent, 1 compatibility_snapshot,
--   1 relationship_permission as granter, 1 user_verification, 1 blocked_users
--   row as blocker, 1 ai_summary, 1 message). Otherwise seed manually.
SELECT public.purge_user('<USER_A_UUID>');
SELECT
  (SELECT count(*) FROM public.users WHERE id = '<USER_A_UUID>') AS users_left,
  (SELECT count(*) FROM public.relationships WHERE user_a = '<USER_A_UUID>' OR user_b = '<USER_A_UUID>') AS rels_left,
  (SELECT count(*) FROM public.memories WHERE created_by = '<USER_A_UUID>') AS mem_left,
  (SELECT count(*) FROM public.weekly_checkins WHERE user_id = '<USER_A_UUID>') AS chk_left,
  (SELECT count(*) FROM public.discovery_actions WHERE actor_user_id = '<USER_A_UUID>' OR target_user_id = '<USER_A_UUID>') AS disc_left,
  (SELECT count(*) FROM public.compatibility_snapshots WHERE viewer_user_id = '<USER_A_UUID>' OR candidate_user_id = '<USER_A_UUID>') AS snap_left,
  (SELECT count(*) FROM public.relationship_permissions WHERE granted_by = '<USER_A_UUID>' OR granted_to = '<USER_A_UUID>') AS perm_left,
  (SELECT count(*) FROM public.user_verifications WHERE user_id = '<USER_A_UUID>') AS ver_left,
  (SELECT count(*) FROM public.blocked_users WHERE blocker_id = '<USER_A_UUID>' OR blocked_id = '<USER_A_UUID>') AS block_left,
  (SELECT count(*) FROM public.ai_summaries WHERE generated_by = '<USER_A_UUID>') AS ai_left,
  (SELECT count(*) FROM public.reports WHERE reporter_user_id = '<USER_A_UUID>' OR target_user_id = '<USER_A_UUID>') AS rep_left,
  (SELECT count(*) FROM public.messages WHERE sender_id = '<USER_A_UUID>' OR receiver_id = '<USER_A_UUID>') AS msg_left;
-- Expected: every count = 0.
ROLLBACK;

-- Probe 2: purge_user does not touch unrelated user data.
BEGIN;
SELECT count(*) AS user_b_rows_before FROM public.users WHERE id = '<USER_B_UUID>';
SELECT public.purge_user('<USER_A_UUID>');
SELECT count(*) AS user_b_rows_after FROM public.users WHERE id = '<USER_B_UUID>';
-- Expected: rows_before = rows_after = 1.
ROLLBACK;

-- Probe 3: purge_user with NULL raises.
BEGIN;
SELECT public.purge_user(NULL);
-- Expected: ERROR 'p_user is required'.
ROLLBACK;
