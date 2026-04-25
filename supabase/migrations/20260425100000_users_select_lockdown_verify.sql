-- supabase/migrations/20260425100000_users_select_lockdown_verify.sql
-- Manual probes — replace UUID placeholders before running with `psql -f`.

-- Negative: an unrelated user must not see another user's row.
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT count(*) AS leaked_rows FROM public.users WHERE id <> '<USER_A_UUID>';
-- Expected: leaked_rows = 0 (only USER_A's row visible via self_select).

-- Positive: discovery_candidates returns trimmed rows.
SELECT id, name, photo_levels FROM public.discovery_candidates(5);
-- Expected: photo_levels jsonb has only level_1 key.

-- Negative: discovery_candidates rejects non-active viewer.
UPDATE public.users SET access_state = 'verification_pending' WHERE id = '<USER_A_UUID>';
SELECT * FROM public.discovery_candidates(5);
-- Expected: ERROR "Discovery requires active account".
