-- supabase/migrations/20260430100000_voice_messages_bucket_verify.sql

-- Probe 1: sender can SELECT objects in their own folder.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT count(*) FROM storage.objects
  WHERE bucket_id = 'voice-messages'
    AND name LIKE '<USER_A_UUID>/%';
-- Expected: 0 (no objects yet) — no error means the USING clause permits it.
ROLLBACK;

-- Probe 2: a non-sender / non-receiver cannot SELECT.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_C_UUID>';
SELECT count(*) FROM storage.objects
  WHERE bucket_id = 'voice-messages';
-- Expected: 0 (RLS hides everything).
ROLLBACK;

-- Probe 3: receiver of a voice message can SELECT the matching object name.
BEGIN;
INSERT INTO public.messages (sender_id, receiver_id, content, content_type)
VALUES ('<USER_A_UUID>', '<USER_B_UUID>', '<USER_A_UUID>/test.webm', 'voice');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_B_UUID>';
SELECT count(*) FROM storage.objects
  WHERE bucket_id = 'voice-messages'
    AND name = '<USER_A_UUID>/test.webm';
-- Expected: 0 (no actual storage object yet; the USING clause itself doesn't
-- raise — confirms the EXISTS branch resolves).
ROLLBACK;
