-- supabase/migrations/20260425170000_account_deletion_purge.sql

-- Service-role only: explicitly purge every row keyed to the user, in
-- dependency-safe order so we don't rely solely on FK CASCADE behavior
-- which has historically drifted across the migration timeline.
CREATE OR REPLACE FUNCTION public.purge_user(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_user IS NULL THEN
    RAISE EXCEPTION 'p_user is required';
  END IF;

  -- Reports the user filed or was the target of.
  DELETE FROM public.reports WHERE reporter_user_id = p_user OR target_user_id = p_user;

  -- Moderation actions referencing this user (target side).
  DELETE FROM public.moderation_actions WHERE target_user_id = p_user;

  -- Discovery actions on either side.
  DELETE FROM public.discovery_actions
   WHERE actor_user_id = p_user OR target_user_id = p_user;

  -- Compatibility snapshots on either side.
  DELETE FROM public.compatibility_snapshots
   WHERE viewer_user_id = p_user OR candidate_user_id = p_user;

  -- Relationship events the user actored.
  DELETE FROM public.relationship_events WHERE actor_user_id = p_user;

  -- AI summaries the user generated.
  DELETE FROM public.ai_summaries WHERE generated_by = p_user;

  -- Memories the user created.
  DELETE FROM public.memories WHERE created_by = p_user;

  -- Weekly check-ins by the user.
  DELETE FROM public.weekly_checkins WHERE user_id = p_user;

  -- Permission grants on either side (granted_by or granted_to).
  DELETE FROM public.relationship_permissions
   WHERE granted_by = p_user OR granted_to = p_user;

  -- Any messages where the user is sender or receiver. (FK on messages is CASCADE
  -- from users; we delete here to keep ordering deterministic and survive any
  -- future schema drift.)
  DELETE FROM public.messages WHERE sender_id = p_user OR receiver_id = p_user;

  -- Relationships involving the user (cascades any leftover memories /
  -- check-ins / events / permissions referencing those rels).
  DELETE FROM public.relationships WHERE user_a = p_user OR user_b = p_user;

  -- Verifications and blocks.
  DELETE FROM public.user_verifications WHERE user_id = p_user;
  DELETE FROM public.blocked_users WHERE blocker_id = p_user OR blocked_id = p_user;

  -- Public profile row (auth.users CASCADE will also fire when the auth row
  -- goes away, but be explicit so the purge is idempotent and self-contained).
  DELETE FROM public.users WHERE id = p_user;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_user(uuid) FROM PUBLIC;
-- Only the service role calls this — no GRANT to authenticated.
