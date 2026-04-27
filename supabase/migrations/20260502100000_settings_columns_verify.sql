-- 20260502100000_settings_columns_verify.sql

-- Probe 1: columns exist with correct defaults.
BEGIN;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='users'
  AND column_name IN ('notification_preferences', 'discoverable');
-- Expected: 2 rows (jsonb default '{}'::jsonb, boolean default true).
ROLLBACK;

-- Probe 2: discoverable=false hides user from discovery_candidates.
BEGIN;
UPDATE public.users SET discoverable=false WHERE id='<USER_TARGET>';
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_VIEWER>';
SELECT count(*) FROM public.discovery_candidates(40)
  WHERE id = '<USER_TARGET>';
-- Expected: 0.
ROLLBACK;
