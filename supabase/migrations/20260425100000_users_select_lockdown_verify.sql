-- supabase/migrations/20260425100000_users_select_lockdown_verify.sql
-- Manual probes — replace UUID placeholders before running with `psql -f`.
-- IMPORTANT: each probe runs inside a transaction so SET LOCAL ROLE / SET LOCAL
-- "request.jwt.claim.sub" actually engage RLS. Outside a transaction these
-- statements silently no-op and the probes will be false negatives.

-- Probe 1: an unrelated user must not see another user's row.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT count(*) AS leaked_rows FROM public.users WHERE id <> '<USER_A_UUID>';
-- Expected: leaked_rows = 0.
ROLLBACK;

-- Probe 2: discovery_candidates returns photo_levels with only level_1.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT id, name, photo_levels FROM public.discovery_candidates(5);
-- Expected: photo_levels jsonb has only the level_1 key.
ROLLBACK;

-- Probe 3: discovery_candidates rejects a non-active viewer.
BEGIN;
UPDATE public.users SET access_state = 'verification_pending' WHERE id = '<USER_A_UUID>';
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT * FROM public.discovery_candidates(5);
-- Expected: ERROR "Discovery requires active account".
ROLLBACK;

-- Probe 4: blocked_user_summaries returns only blocked names for the caller.
BEGIN;
INSERT INTO public.blocked_users (blocker_id, blocked_id) VALUES ('<USER_A_UUID>', '<USER_C_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT id, name FROM public.blocked_user_summaries();
-- Expected: one row for USER_C only.
ROLLBACK;
