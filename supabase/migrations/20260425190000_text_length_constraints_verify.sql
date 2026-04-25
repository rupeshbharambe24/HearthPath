-- supabase/migrations/20260425190000_text_length_constraints_verify.sql
-- Manual probes - replace UUIDs. Each in BEGIN; ... ROLLBACK;.

-- Probe 1: oversized report.details rejected.
BEGIN;
INSERT INTO public.reports (reporter_user_id, target_user_id, reason, details)
VALUES ('<USER_A_UUID>', '<USER_B_UUID>', 'other', repeat('x', 1001));
-- Expected: ERROR (constraint reports_details_length).
ROLLBACK;

-- Probe 2: 1000-char details accepted.
BEGIN;
INSERT INTO public.reports (reporter_user_id, target_user_id, reason, details)
VALUES ('<USER_A_UUID>', '<USER_B_UUID>', 'other', repeat('x', 1000));
-- Expected: success.
ROLLBACK;

-- Probe 3: oversized message.content rejected.
BEGIN;
INSERT INTO public.messages (sender_id, receiver_id, content)
VALUES ('<USER_A_UUID>', '<USER_B_UUID>', repeat('z', 4001));
-- Expected: ERROR.
ROLLBACK;

-- Probe 4: oversized memories.memo_text rejected.
BEGIN;
INSERT INTO public.memories (relationship_id, created_by, memo_text)
VALUES ('<REL>', '<USER_A_UUID>', repeat('q', 4001));
-- Expected: ERROR.
ROLLBACK;

-- Probe 5: oversized users.name rejected.
BEGIN;
UPDATE public.users SET name = repeat('a', 121) WHERE id = '<USER_A_UUID>';
-- Expected: ERROR.
ROLLBACK;
