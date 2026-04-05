ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS campus_zone text,
  ADD COLUMN IF NOT EXISTS pace_style text,
  ADD COLUMN IF NOT EXISTS communication_style text,
  ADD COLUMN IF NOT EXISTS value_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS lifestyle_preferences text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS deal_breakers text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS discovery_mode text DEFAULT 'slow_burn',
  ADD COLUMN IF NOT EXISTS heartpath_norms_acknowledged_at timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_discovery_mode_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_discovery_mode_check
      CHECK (discovery_mode IS NULL OR discovery_mode IN ('friendship_first', 'slow_burn', 'serious_only', 'same_campus'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_pace_style_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_pace_style_check
      CHECK (pace_style IS NULL OR pace_style IN ('gentle', 'steady', 'deepening'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_communication_style_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_communication_style_check
      CHECK (communication_style IS NULL OR communication_style IN ('thoughtful', 'balanced', 'expressive'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.compatibility_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  discovery_mode text NOT NULL,
  compatibility_score integer NOT NULL CHECK (compatibility_score BETWEEN 0 AND 100),
  score_band text NOT NULL CHECK (score_band IN ('low', 'good', 'strong', 'excellent')),
  rationale text[] NOT NULL DEFAULT '{}'::text[],
  shared_values text[] NOT NULL DEFAULT '{}'::text[],
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (viewer_user_id, candidate_user_id, discovery_mode)
);

CREATE TABLE IF NOT EXISTS public.discovery_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('invite_sent', 'pass')),
  action_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.relationship_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (
    event_type IN (
      'request_received',
      'request_accepted',
      'request_declined',
      'stage_requested',
      'stage_accepted',
      'stage_declined',
      'stage_deferred',
      'permission_granted',
      'permission_revoked',
      'heart_sent',
      'checkin_saved',
      'memory_saved',
      'paused',
      'resumed',
      'archived'
    )
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.compatibility_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their compatibility snapshots" ON public.compatibility_snapshots;
CREATE POLICY "Users can view their compatibility snapshots"
ON public.compatibility_snapshots
FOR SELECT
USING (auth.uid() = viewer_user_id);

DROP POLICY IF EXISTS "Users can upsert their compatibility snapshots" ON public.compatibility_snapshots;
CREATE POLICY "Users can upsert their compatibility snapshots"
ON public.compatibility_snapshots
FOR ALL
USING (auth.uid() = viewer_user_id)
WITH CHECK (auth.uid() = viewer_user_id);

DROP POLICY IF EXISTS "Users can view their discovery actions" ON public.discovery_actions;
CREATE POLICY "Users can view their discovery actions"
ON public.discovery_actions
FOR SELECT
USING (auth.uid() = actor_user_id);

DROP POLICY IF EXISTS "Users can create their discovery actions" ON public.discovery_actions;
CREATE POLICY "Users can create their discovery actions"
ON public.discovery_actions
FOR INSERT
WITH CHECK (auth.uid() = actor_user_id);

DROP POLICY IF EXISTS "Users can view relationship events for their paths" ON public.relationship_events;
CREATE POLICY "Users can view relationship events for their paths"
ON public.relationship_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = relationship_events.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create relationship events for their paths" ON public.relationship_events;
CREATE POLICY "Users can create relationship events for their paths"
ON public.relationship_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = relationship_events.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS idx_compatibility_snapshots_viewer_mode ON public.compatibility_snapshots(viewer_user_id, discovery_mode, compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_actions_actor_date ON public.discovery_actions(actor_user_id, action_date DESC, action_type);
CREATE INDEX IF NOT EXISTS idx_relationship_events_relationship_created ON public.relationship_events(relationship_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.sync_user_access_state()
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_id uuid;
  current_auth_email text;
  current_confirmed_at timestamp with time zone;
  approved_domain text;
  approved_college_name text;
  next_access_state text;
  next_onboarding_step text;
  completeness integer;
  target_user public.users%ROWTYPE;
  badges jsonb;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT au.email, au.email_confirmed_at
  INTO current_auth_email, current_confirmed_at
  FROM auth.users au
  WHERE au.id = current_user_id;

  SELECT *
  INTO target_user
  FROM public.users u
  WHERE u.id = current_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  approved_domain := null;
  approved_college_name := null;

  SELECT cd.domain, cd.college_name
  INTO approved_domain, approved_college_name
  FROM public.college_domains cd
  WHERE cd.domain = lower(split_part(COALESCE(target_user.college_email, current_auth_email, ''), '@', 2))
    AND cd.status = 'active'
  LIMIT 1;

  completeness := 0;

  IF COALESCE(nullif(trim(target_user.name), ''), '') <> '' THEN completeness := completeness + 8; END IF;
  IF COALESCE(nullif(trim(target_user.college_name), ''), '') <> '' THEN completeness := completeness + 8; END IF;
  IF COALESCE(nullif(trim(target_user.branch), ''), '') <> '' THEN completeness := completeness + 8; END IF;
  IF target_user.year IS NOT NULL THEN completeness := completeness + 8; END IF;
  IF COALESCE(nullif(trim(target_user.about), ''), '') <> '' THEN completeness := completeness + 8; END IF;
  IF COALESCE(array_length(target_user.hobbies, 1), 0) > 0 THEN completeness := completeness + 8; END IF;
  IF COALESCE(nullif(trim(target_user.relationship_intent), ''), '') <> '' THEN completeness := completeness + 8; END IF;
  IF COALESCE(nullif(trim(target_user.preferred_chat_frequency), ''), '') <> '' THEN completeness := completeness + 8; END IF;
  IF COALESCE(nullif(trim(target_user.voice_notes_comfort), ''), '') <> '' THEN completeness := completeness + 7; END IF;
  IF COALESCE(nullif(trim(target_user.privacy_comfort), ''), '') <> '' THEN completeness := completeness + 7; END IF;
  IF COALESCE(nullif(trim(target_user.communication_style), ''), '') <> '' THEN completeness := completeness + 8; END IF;
  IF COALESCE(nullif(trim(target_user.pace_style), ''), '') <> '' THEN completeness := completeness + 7; END IF;
  IF COALESCE(array_length(target_user.value_tags, 1), 0) > 0 THEN completeness := completeness + 7; END IF;
  IF COALESCE(array_length(target_user.lifestyle_preferences, 1), 0) > 0 THEN completeness := completeness + 4; END IF;
  IF target_user.heartpath_norms_acknowledged_at IS NOT NULL THEN completeness := completeness + 4; END IF;

  IF current_confirmed_at IS NULL THEN
    next_access_state := 'verification_pending';
    next_onboarding_step := 'verify';
  ELSIF approved_domain IS NULL THEN
    next_access_state := 'blocked';
    next_onboarding_step := 'verify';
  ELSIF COALESCE(target_user.onboarding_completed_at IS NOT NULL, false) THEN
    next_access_state := 'active';
    next_onboarding_step := 'complete';
  ELSIF COALESCE(nullif(trim(target_user.name), ''), '') = ''
      OR COALESCE(nullif(trim(target_user.college_name), ''), '') = ''
      OR COALESCE(nullif(trim(target_user.branch), ''), '') = ''
      OR target_user.year IS NULL THEN
    next_access_state := 'onboarding_required';
    next_onboarding_step := 'basics';
  ELSIF COALESCE(nullif(trim(target_user.about), ''), '') = ''
      OR COALESCE(array_length(target_user.hobbies, 1), 0) = 0
      OR COALESCE(nullif(trim(target_user.relationship_intent), ''), '') = ''
      OR COALESCE(nullif(trim(target_user.preferred_chat_frequency), ''), '') = ''
      OR COALESCE(nullif(trim(target_user.communication_style), ''), '') = ''
      OR COALESCE(array_length(target_user.value_tags, 1), 0) = 0
      OR COALESCE(array_length(target_user.lifestyle_preferences, 1), 0) = 0
      OR target_user.heartpath_norms_acknowledged_at IS NULL THEN
    next_access_state := 'onboarding_required';
    next_onboarding_step := 'heartpath';
  ELSIF COALESCE(nullif(trim(target_user.voice_notes_comfort), ''), '') = ''
      OR COALESCE(nullif(trim(target_user.privacy_comfort), ''), '') = ''
      OR COALESCE(nullif(trim(target_user.pace_style), ''), '') = '' THEN
    next_access_state := 'onboarding_required';
    next_onboarding_step := 'boundaries';
  ELSIF COALESCE(target_user.photo_levels, '{}'::jsonb) = '{}'::jsonb
      OR COALESCE(target_user.photo_levels->>'level_1', '') = '' THEN
    next_access_state := 'onboarding_required';
    next_onboarding_step := 'photo_review';
  ELSE
    next_access_state := 'active';
    next_onboarding_step := 'complete';
  END IF;

  badges := jsonb_build_object(
    'email_verified', current_confirmed_at IS NOT NULL,
    'student_verified', approved_domain IS NOT NULL,
    'photo_verified', COALESCE(target_user.verification_badges->>'photo_verified', 'false')::boolean,
    'identity_verified', COALESCE(target_user.verification_badges->>'identity_verified', 'false')::boolean
  );

  UPDATE public.users
  SET
    college_email = COALESCE(current_auth_email, target_user.college_email),
    college_name = COALESCE(NULLIF(target_user.college_name, ''), approved_college_name),
    access_state = next_access_state,
    onboarding_step = next_onboarding_step,
    profile_completeness = LEAST(100, completeness),
    email_verified_at = current_confirmed_at,
    student_verified_at = CASE WHEN approved_domain IS NOT NULL THEN COALESCE(target_user.student_verified_at, now()) ELSE null END,
    verification_badges = badges
  WHERE id = current_user_id
  RETURNING * INTO target_user;

  RETURN target_user;
END;
$function$;

UPDATE public.users
SET discovery_mode = COALESCE(discovery_mode, 'slow_burn')
WHERE discovery_mode IS NULL;
