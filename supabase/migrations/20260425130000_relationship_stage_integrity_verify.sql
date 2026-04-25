-- supabase/migrations/20260425130000_relationship_stage_integrity_verify.sql
-- Manual probes — replace UUID placeholders. Each probe in BEGIN; … ROLLBACK;.

-- Probe 1: cannot forge a request from the partner.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET stage_request_from_user_id = '<USER_B_UUID>',
    requested_stage = 3,
    stage_request_status = 'pending'
WHERE id = '<REL_AT_STAGE_2>';
-- Expected: ERROR "stage_request_from_user_id must equal caller".
ROLLBACK;

-- Probe 2: cannot skip stages (request stage 5 from stage 1).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET stage_request_from_user_id = '<USER_A_UUID>',
    requested_stage = 5,
    stage_request_status = 'pending'
WHERE id = '<REL_AT_STAGE_1>';
-- Expected: ERROR "Can only request the next stage".
ROLLBACK;

-- Probe 3: legitimate request + accept by partner.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET stage_request_from_user_id = '<USER_A_UUID>',
    requested_stage = 2,
    stage_request_status = 'pending'
WHERE id = '<REL_AT_STAGE_1>';
SET LOCAL "request.jwt.claim.sub" = '<USER_B_UUID>';
UPDATE public.relationships
SET current_stage = 2, stage_request_status = NULL,
    stage_request_from_user_id = NULL, requested_stage = NULL
WHERE id = '<REL_AT_STAGE_1>';
-- Expected: success on both.
ROLLBACK;

-- Probe 4: originator cannot self-accept.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET stage_request_from_user_id = '<USER_A_UUID>',
    requested_stage = 3,
    stage_request_status = 'pending'
WHERE id = '<REL_AT_STAGE_2>';
UPDATE public.relationships
SET current_stage = 3, stage_request_status = NULL
WHERE id = '<REL_AT_STAGE_2>';
-- Expected: ERROR "Originator cannot self-advance current_stage".
ROLLBACK;

-- Probe 5: cooldown enforcement.
BEGIN;
UPDATE public.relationships
SET stage_request_cooldown_until = now() + interval '6 days'
WHERE id = '<REL_AT_STAGE_2>';
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET stage_request_from_user_id = '<USER_A_UUID>',
    requested_stage = 3,
    stage_request_status = 'pending'
WHERE id = '<REL_AT_STAGE_2>';
-- Expected: ERROR "Stage request blocked by cooldown ...".
ROLLBACK;

-- Probe 6: only one pending request at a time (unique partial index).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET stage_request_from_user_id = '<USER_A_UUID>',
    requested_stage = 3,
    stage_request_status = 'pending'
WHERE id = '<REL_AT_STAGE_2>';
-- Same row already pending: a second pending should noop (UPDATE doesn't violate PK).
-- Note: the unique partial index is on (id) WHERE status='pending', enforcing uniqueness
-- across rows — duplicate rows would violate, but a single row staying pending is fine.
ROLLBACK;

-- Probe 7: originator may archive their own relationship while their request is pending.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET stage_request_from_user_id = '<USER_A_UUID>',
    requested_stage = 3,
    stage_request_status = 'pending'
WHERE id = '<REL_AT_STAGE_2>';
UPDATE public.relationships
SET lifecycle_state = 'archived',
    stage_request_status = NULL,
    stage_request_from_user_id = NULL,
    requested_stage = NULL,
    current_stage = 1
WHERE id = '<REL_AT_STAGE_2>';
-- Expected: success on both. Originator may end the relationship even with their own pending request.
ROLLBACK;
