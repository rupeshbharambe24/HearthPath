-- supabase/migrations/20260425100000_users_select_lockdown.sql

DROP POLICY IF EXISTS "Users can view all user profiles" ON public.users;

-- Self-read: full row.
CREATE POLICY "users_self_select"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Partner-read: only when an active/pending/exclusive/paused/cooldown relationship exists.
CREATE POLICY "users_partner_select"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE (r.user_a = auth.uid() AND r.user_b = users.id)
       OR (r.user_b = auth.uid() AND r.user_a = users.id)
  )
);

-- Discovery candidate reads MUST go through discovery_candidates() RPC.
-- No general-public SELECT policy is created.

CREATE OR REPLACE FUNCTION public.discovery_candidates(p_limit int DEFAULT 40)
RETURNS TABLE (
  id uuid,
  name text,
  college_name text,
  branch text,
  year integer,
  hobbies text[],
  about text,
  relationship_intent text,
  preferred_chat_frequency text,
  pace_style text,
  communication_style text,
  value_tags text[],
  lifestyle_preferences text[],
  deal_breakers text[],
  discovery_mode text,
  campus_zone text,
  profile_completeness integer,
  verification_badges jsonb,
  photo_levels jsonb,
  access_state text,
  boundary_topics text[],
  heartpath_norms_acknowledged_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_id uuid := auth.uid();
  viewer_state text;
BEGIN
  IF viewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.access_state INTO viewer_state FROM public.users u WHERE u.id = viewer_id;
  IF viewer_state IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Discovery requires active account';
  END IF;

  RETURN QUERY
  SELECT
    u.id, u.name, u.college_name, u.branch, u.year, u.hobbies, u.about,
    u.relationship_intent, u.preferred_chat_frequency, u.pace_style,
    u.communication_style, u.value_tags, u.lifestyle_preferences, u.deal_breakers,
    u.discovery_mode, u.campus_zone, u.profile_completeness, u.verification_badges,
    -- Only level_1 photo for discovery; strip the rest.
    jsonb_build_object('level_1', u.photo_levels->>'level_1') AS photo_levels,
    u.access_state,
    u.boundary_topics,
    u.heartpath_norms_acknowledged_at
  FROM public.users u
  WHERE u.id <> viewer_id
    AND u.access_state = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = viewer_id AND b.blocked_id = u.id)
         OR (b.blocker_id = u.id AND b.blocked_id = viewer_id)
    )
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.discovery_candidates(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discovery_candidates(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.blocked_user_summaries()
RETURNS TABLE (
  id uuid,
  name text,
  college_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_id uuid := auth.uid();
BEGIN
  IF viewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT u.id, u.name, u.college_name
  FROM public.users u
  WHERE u.id IN (
    SELECT b.blocked_id FROM public.blocked_users b WHERE b.blocker_id = viewer_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.blocked_user_summaries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.blocked_user_summaries() TO authenticated;
