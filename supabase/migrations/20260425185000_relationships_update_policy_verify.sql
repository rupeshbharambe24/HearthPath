-- supabase/migrations/20260425185000_relationships_update_policy_verify.sql
-- Manual probes — replace UUIDs. Each in BEGIN; … ROLLBACK;.

-- Probe 1: a member can update their own relationship row.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET hearts_a2b = COALESCE(hearts_a2b, 0) + 1
WHERE id = '<REL_AB>'
RETURNING id;
-- Expected: 1 row returned.
ROLLBACK;

-- Probe 2: a non-member cannot update via RLS.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_C_UUID>';  -- not user_a or user_b
UPDATE public.relationships
SET hearts_a2b = 99
WHERE id = '<REL_AB>'
RETURNING id;
-- Expected: 0 rows returned (RLS USING blocks).
ROLLBACK;

-- Probe 3: WITH CHECK prevents producing a row whose new members exclude the caller.
-- (The Task 4 trigger also catches this; this probe verifies the RLS layer alone.)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.relationships
SET user_a = '<USER_C_UUID>'  -- caller would no longer be a member
WHERE id = '<REL_AB>';
-- Expected: trigger raises "Cannot reassign relationship members" first; the RLS
-- WITH CHECK would also block if the trigger were absent.
ROLLBACK;
