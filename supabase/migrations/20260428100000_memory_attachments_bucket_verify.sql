-- supabase/migrations/20260428100000_memory_attachments_bucket_verify.sql

-- Probe 1: a relationship member can SELECT objects in their relationship's folder.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT count(*) FROM storage.objects
  WHERE bucket_id = 'memory-attachments'
    AND name LIKE '<REL_AB_UUID>/%';
-- Expected: 0 (no objects yet) — should NOT raise. Confirms USING clause matches.
ROLLBACK;

-- Probe 2: a non-member cannot SELECT.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_C_UUID>';  -- not in REL_AB
SELECT count(*) FROM storage.objects
  WHERE bucket_id = 'memory-attachments'
    AND name LIKE '<REL_AB_UUID>/%';
-- Expected: 0 (rows hidden by RLS).
ROLLBACK;

-- Probe 3: attachment_type whitelist rejects bogus values.
BEGIN;
INSERT INTO public.memories (relationship_id, created_by, memo_text, attachment_url, attachment_type)
VALUES ('<REL_AB_UUID>', '<USER_A_UUID>', 'note', 'path/file', 'video');
-- Expected: ERROR (constraint memories_attachment_type_check).
ROLLBACK;

-- Probe 4: image/audio/pdf accepted.
BEGIN;
INSERT INTO public.memories (relationship_id, created_by, memo_text, attachment_url, attachment_type)
VALUES ('<REL_AB_UUID>', '<USER_A_UUID>', 'note', 'a/b', 'audio');
-- Expected: success.
ROLLBACK;
