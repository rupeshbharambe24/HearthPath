-- supabase/migrations/20260426100000_notifications_table_verify.sql
-- Manual probes — replace UUIDs. Each in BEGIN; … ROLLBACK; so RLS engages and
-- writes are rolled back.

-- Probe 1: recipient sees own notifications, not others'.
BEGIN;
INSERT INTO public.notifications (recipient_user_id, kind) VALUES
  ('<USER_A_UUID>', 'heart_received'),
  ('<USER_B_UUID>', 'heart_received');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
SELECT count(*) AS visible FROM public.notifications;
-- Expected: 1.
ROLLBACK;

-- Probe 2: only read_at can be UPDATEd.
BEGIN;
INSERT INTO public.notifications (id, recipient_user_id, kind)
VALUES ('11111111-1111-1111-1111-111111111111', '<USER_A_UUID>', 'heart_received');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.notifications SET kind = 'message_received'
  WHERE id = '11111111-1111-1111-1111-111111111111';
-- Expected: ERROR "Only read_at may be modified".
ROLLBACK;

-- Probe 3: marking read works.
BEGIN;
INSERT INTO public.notifications (id, recipient_user_id, kind)
VALUES ('22222222-2222-2222-2222-222222222222', '<USER_A_UUID>', 'heart_received');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<USER_A_UUID>';
UPDATE public.notifications SET read_at = now()
  WHERE id = '22222222-2222-2222-2222-222222222222';
SELECT read_at IS NOT NULL AS marked
FROM public.notifications WHERE id = '22222222-2222-2222-2222-222222222222';
-- Expected: marked = true.
ROLLBACK;

-- Probe 4: create_notification skips self-notify (returns NULL).
BEGIN;
SELECT public.create_notification('<USER_A_UUID>', '<USER_A_UUID>', 'heart_received') AS id;
-- Expected: id = NULL.
ROLLBACK;

-- Probe 5: create_notification rejects NULL recipient.
BEGIN;
SELECT public.create_notification(NULL, '<USER_A_UUID>', 'heart_received') AS id;
-- Expected: ERROR "recipient is required".
ROLLBACK;
