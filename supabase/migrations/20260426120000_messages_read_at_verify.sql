-- supabase/migrations/20260426120000_messages_read_at_verify.sql
-- Manual probes — replace UUIDs. Each in BEGIN; … ROLLBACK;.

-- Probe 1: receiver can set read_at.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_B_UUID>';
UPDATE public.messages SET read_at = now()
  WHERE id = '<MSG_FROM_A_TO_B>';
SELECT read_at IS NOT NULL AS marked
FROM public.messages WHERE id = '<MSG_FROM_A_TO_B>';
-- Expected: true.
ROLLBACK;

-- Probe 2: sender CANNOT set read_at (RLS USING blocks; 0 rows updated).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.messages SET read_at = now()
  WHERE id = '<MSG_FROM_A_TO_B>'
  RETURNING id;
-- Expected: 0 rows returned.
ROLLBACK;

-- Probe 3: receiver CANNOT edit content (immutability trigger).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_B_UUID>';
UPDATE public.messages SET content = 'tampered'
  WHERE id = '<MSG_FROM_A_TO_B>';
-- Expected: ERROR "Only read_at may be modified".
ROLLBACK;
