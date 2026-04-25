-- supabase/migrations/20260425120000_relationship_permission_integrity_verify.sql
-- Manual probes — replace UUID placeholders. Each runs inside BEGIN/ROLLBACK so RLS
-- engages and any state mutations are rolled back.

-- Probe 1: at stage 1, cannot grant full_face_photo.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.relationship_permissions
  (relationship_id, permission, granted_by, granted_to)
VALUES ('<REL_AT_STAGE_1>', 'full_face_photo', '<USER_A_UUID>', '<USER_B_UUID>');
-- Expected: ERROR "Permission full_face_photo requires stage 5...".
ROLLBACK;

-- Probe 2: at stage 5, can grant full_face_photo.
BEGIN;
UPDATE public.relationships SET current_stage = 5 WHERE id = '<REL_AT_STAGE_1>';
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.relationship_permissions
  (relationship_id, permission, granted_by, granted_to)
VALUES ('<REL_AT_STAGE_1>', 'full_face_photo', '<USER_A_UUID>', '<USER_B_UUID>');
-- Expected: success, one row inserted.
ROLLBACK;

-- Probe 3: USER_B cannot revoke a permission USER_A granted.
BEGIN;
INSERT INTO public.relationship_permissions
  (relationship_id, permission, granted_by, granted_to)
VALUES ('<REL_AT_STAGE_5>', 'voice_notes', '<USER_A_UUID>', '<USER_B_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_B_UUID>';
UPDATE public.relationship_permissions SET revoked_at = now()
WHERE granted_by = '<USER_A_UUID>' AND permission = 'voice_notes';
-- Expected: 0 rows affected (RLS UPDATE policy blocks USER_B).
ROLLBACK;

-- Probe 4: cannot mutate granted_by or permission after insert.
BEGIN;
INSERT INTO public.relationship_permissions
  (relationship_id, permission, granted_by, granted_to)
VALUES ('<REL_AT_STAGE_5>', 'voice_notes', '<USER_A_UUID>', '<USER_B_UUID>');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationship_permissions
SET permission = 'full_face_photo'
WHERE granted_by = '<USER_A_UUID>' AND permission = 'voice_notes';
-- Expected: ERROR "Only revoked_at may be modified after grant".
ROLLBACK;

-- Probe 5: cannot grant on archived relationship.
BEGIN;
UPDATE public.relationships SET lifecycle_state = 'archived' WHERE id = '<REL_AT_STAGE_5>';
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
INSERT INTO public.relationship_permissions
  (relationship_id, permission, granted_by, granted_to)
VALUES ('<REL_AT_STAGE_5>', 'voice_notes', '<USER_A_UUID>', '<USER_B_UUID>');
-- Expected: ERROR "Cannot grant permissions on archived/cooldown relationship".
ROLLBACK;
