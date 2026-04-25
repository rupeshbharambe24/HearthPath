-- supabase/migrations/20260425100000_users_select_lockdown_verify.sql
-- Manual probes — replace the UUID placeholders before running with `psql -f`.
-- Each probe must `SET LOCAL ROLE authenticated;` so RLS engages; without it the
-- session role is the table owner and policies are bypassed (false negative).

-- Negative: an unrelated user must not see another user's row.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT count(*) AS leaked_rows FROM public.users WHERE id <> '<USER_A_UUID>';
-- Expected: leaked_rows = 0 (only USER_A's row visible via users_self_select).
RESET ROLE;

-- Positive: discovery_candidates returns trimmed rows.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT id, name, photo_levels FROM public.discovery_candidates(5);
-- Expected: photo_levels jsonb contains only the level_1 key.
RESET ROLE;

-- Negative: discovery_candidates rejects non-active viewer.
UPDATE public.users SET access_state = 'verification_pending' WHERE id = '<USER_A_UUID>';
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT * FROM public.discovery_candidates(5);
-- Expected: ERROR "Discovery requires active account".
RESET ROLE;

-- Positive: blocked_user_summaries returns only blocked names for the caller.
INSERT INTO public.blocked_users (blocker_id, blocked_id) VALUES ('<USER_A_UUID>', '<USER_C_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT id, name FROM public.blocked_user_summaries();
-- Expected: one row for USER_C only.
RESET ROLE;
