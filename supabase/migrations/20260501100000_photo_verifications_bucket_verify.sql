-- supabase/migrations/20260501100000_photo_verifications_bucket_verify.sql

-- Probe 1: bucket is private.
BEGIN;
SELECT public FROM storage.buckets WHERE id = 'photo-verifications';
-- Expected: false.
ROLLBACK;

-- Probe 2: user can SELECT their own folder.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT count(*) FROM storage.objects
  WHERE bucket_id = 'photo-verifications'
    AND name LIKE '<USER_A_UUID>/%';
-- Expected: 0 (no files yet) — no error means USING permits.
ROLLBACK;

-- Probe 3: another user cannot SELECT.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_C_UUID>';
SELECT count(*) FROM storage.objects
  WHERE bucket_id = 'photo-verifications'
    AND name LIKE '<USER_A_UUID>/%';
-- Expected: 0 (RLS hides).
ROLLBACK;
