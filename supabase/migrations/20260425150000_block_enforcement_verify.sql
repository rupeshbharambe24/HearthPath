-- supabase/migrations/20260425150000_block_enforcement_verify.sql
-- Manual probes — replace UUIDs. Each in BEGIN; … ROLLBACK;.

-- Probe 1: blocked user cannot insert a message in either direction.
BEGIN;
INSERT INTO public.blocked_users (blocker_id, blocked_id) VALUES ('<USER_A_UUID>', '<USER_B_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_B_UUID>';
INSERT INTO public.messages (sender_id, receiver_id, content) VALUES ('<USER_B_UUID>', '<USER_A_UUID>', 'hi');
-- Expected: ERROR "Messaging blocked between these users".
ROLLBACK;

-- Probe 2: blocker cannot message blocked either.
BEGIN;
INSERT INTO public.blocked_users (blocker_id, blocked_id) VALUES ('<USER_A_UUID>', '<USER_B_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.messages (sender_id, receiver_id, content) VALUES ('<USER_A_UUID>', '<USER_B_UUID>', 'still here');
-- Expected: ERROR.
ROLLBACK;

-- Probe 3: cannot create new relationship across a block.
BEGIN;
INSERT INTO public.blocked_users (blocker_id, blocked_id) VALUES ('<USER_A_UUID>', '<USER_B_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.relationships (user_a, user_b) VALUES ('<USER_A_UUID>', '<USER_B_UUID>');
-- Expected: ERROR "Cannot start relationship with blocked user".
ROLLBACK;

-- Probe 4: SELECT hides messages once blocked.
BEGIN;
-- (assume a pre-existing message between USER_A and USER_B inserted by fixture)
INSERT INTO public.blocked_users (blocker_id, blocked_id) VALUES ('<USER_A_UUID>', '<USER_B_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT count(*) AS visible_messages
FROM public.messages
WHERE sender_id IN ('<USER_A_UUID>', '<USER_B_UUID>')
   OR receiver_id IN ('<USER_A_UUID>', '<USER_B_UUID>');
-- Expected: visible_messages = 0 (blocked-pair messages filtered by RLS).
ROLLBACK;

-- Probe 5: unblocked users can still message normally.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.messages (sender_id, receiver_id, content) VALUES ('<USER_A_UUID>', '<USER_C_UUID>', 'hey');
-- Expected: success.
ROLLBACK;
