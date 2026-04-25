-- supabase/migrations/20260425180000_admin_users_verify.sql
-- Manual probes — replace UUIDs. Each in BEGIN; … ROLLBACK;.

-- Probe 1: non-admin returns false.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_NORMAL_UUID>';
SELECT public.is_admin() AS is_admin;
-- Expected: false.
ROLLBACK;

-- Probe 2: seeded admin returns true.
BEGIN;
INSERT INTO public.admin_users (user_id) VALUES ('<USER_ADMIN_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_ADMIN_UUID>';
SELECT public.is_admin() AS is_admin;
-- Expected: true.
ROLLBACK;

-- Probe 3: client cannot SELECT admin_users directly (no policy = no rows).
BEGIN;
INSERT INTO public.admin_users (user_id) VALUES ('<USER_ADMIN_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_ADMIN_UUID>';
SELECT count(*) AS visible_rows FROM public.admin_users;
-- Expected: 0 (RLS denies all SELECT).
ROLLBACK;
