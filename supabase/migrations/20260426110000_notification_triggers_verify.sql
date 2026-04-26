-- supabase/migrations/20260426110000_notification_triggers_verify.sql
-- Manual probes — replace UUIDs. Each in BEGIN; … ROLLBACK;.

-- Probe 1: stage_requested fires for the partner.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET stage_request_from_user_id = '<USER_A_UUID>',
    requested_stage = 2,
    stage_request_status = 'pending'
WHERE id = '<REL_AT_STAGE_1>';
SELECT count(*) AS notif_count
FROM public.notifications
WHERE recipient_user_id = '<USER_B_UUID>'
  AND kind = 'stage_requested'
  AND related_id = '<REL_AT_STAGE_1>';
-- Expected: 1.
ROLLBACK;

-- Probe 2: message_received fires for receiver.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.messages (sender_id, receiver_id, content)
VALUES ('<USER_A_UUID>', '<USER_B_UUID>', 'hi');
SELECT count(*) FROM public.notifications
WHERE recipient_user_id = '<USER_B_UUID>' AND kind = 'message_received';
-- Expected: 1.
ROLLBACK;

-- Probe 3: message_received SUPPRESSED when blocked.
BEGIN;
INSERT INTO public.blocked_users (blocker_id, blocked_id) VALUES ('<USER_B_UUID>', '<USER_A_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
-- Note: the message INSERT itself will be rejected by Phase 1's check_message_block.
-- This probe verifies the suppression branch in case any future code path bypasses
-- that check (e.g. service-role insert).
RESET ROLE;
INSERT INTO public.messages (sender_id, receiver_id, content)
VALUES ('<USER_A_UUID>', '<USER_B_UUID>', 'sneak attempt');
SELECT count(*) FROM public.notifications
WHERE recipient_user_id = '<USER_B_UUID>' AND kind = 'message_received'
  AND payload->>'preview' = 'sneak attempt';
-- Expected: 0.
ROLLBACK;

-- Probe 4: heart_received fires when counter increments.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET hearts_a2b = COALESCE(hearts_a2b, 0) + 1
WHERE id = '<REL_AB>';
SELECT count(*) FROM public.notifications
WHERE recipient_user_id = '<USER_B_UUID>' AND kind = 'heart_received';
-- Expected: 1.
ROLLBACK;

-- Probe 5: invitation_received fires on INSERT of pending relationship.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.relationships (user_a, user_b, lifecycle_state, status)
VALUES ('<USER_A_UUID>', '<USER_C_UUID>', 'pending', 'pending');
SELECT count(*) FROM public.notifications
WHERE recipient_user_id = '<USER_C_UUID>' AND kind = 'invitation_received';
-- Expected: 1.
ROLLBACK;

-- Probe 6: permission_granted fires on INSERT.
BEGIN;
-- Pre-set the relationship to stage 5 so the Phase 1 stage-validation trigger allows
-- granting full_face_photo.
UPDATE public.relationships SET current_stage = 5, lifecycle_state = 'active'
  WHERE id = '<REL_AT_STAGE_X>';
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.relationship_permissions
  (relationship_id, permission, granted_by, granted_to)
VALUES ('<REL_AT_STAGE_X>', 'full_face_photo', '<USER_A_UUID>', '<USER_B_UUID>');
SELECT count(*) FROM public.notifications
WHERE recipient_user_id = '<USER_B_UUID>' AND kind = 'permission_granted';
-- Expected: 1.
ROLLBACK;
