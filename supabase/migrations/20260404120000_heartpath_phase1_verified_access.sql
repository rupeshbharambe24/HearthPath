ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS access_state text,
  ADD COLUMN IF NOT EXISTS onboarding_step text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS profile_completeness integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS student_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verification_badges jsonb DEFAULT '{"email_verified": false, "student_verified": false, "photo_verified": false, "identity_verified": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS relationship_intent text,
  ADD COLUMN IF NOT EXISTS preferred_chat_frequency text,
  ADD COLUMN IF NOT EXISTS voice_notes_comfort text,
  ADD COLUMN IF NOT EXISTS privacy_comfort text,
  ADD COLUMN IF NOT EXISTS boundary_topics text[] DEFAULT '{}'::text[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_access_state_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_access_state_check
      CHECK (access_state IS NULL OR access_state IN ('verification_pending', 'onboarding_required', 'active', 'blocked'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_onboarding_step_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_onboarding_step_check
      CHECK (onboarding_step IS NULL OR onboarding_step IN ('verify', 'basics', 'heartpath', 'boundaries', 'photo_review', 'complete'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_profile_completeness_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_profile_completeness_check
      CHECK (profile_completeness BETWEEN 0 AND 100);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.college_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE NOT NULL,
  college_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  verification_type text NOT NULL,
  status text NOT NULL DEFAULT 'verified',
  verified_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'college_domains_status_check'
  ) THEN
    ALTER TABLE public.college_domains
      ADD CONSTRAINT college_domains_status_check
      CHECK (status IN ('active', 'inactive'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_verifications_type_check'
  ) THEN
    ALTER TABLE public.user_verifications
      ADD CONSTRAINT user_verifications_type_check
      CHECK (verification_type IN ('email_verified', 'student_verified', 'photo_verified', 'identity_verified'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_verifications_status_check'
  ) THEN
    ALTER TABLE public.user_verifications
      ADD CONSTRAINT user_verifications_status_check
      CHECK (status IN ('verified', 'pending', 'revoked'));
  END IF;
END $$;

ALTER TABLE public.college_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active college domains" ON public.college_domains;
CREATE POLICY "Anyone can view active college domains"
ON public.college_domains
FOR SELECT
USING (status = 'active');

DROP POLICY IF EXISTS "Users can view their own verifications" ON public.user_verifications;
CREATE POLICY "Users can view their own verifications"
ON public.user_verifications
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own verification records" ON public.user_verifications;
CREATE POLICY "Users can create their own verification records"
ON public.user_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own verification records" ON public.user_verifications;
CREATE POLICY "Users can update their own verification records"
ON public.user_verifications
FOR UPDATE
USING (auth.uid() = user_id);

INSERT INTO public.college_domains (domain, college_name, status)
SELECT DISTINCT
  lower(split_part(college_email, '@', 2)) AS domain,
  COALESCE(NULLIF(college_name, ''), initcap(replace(split_part(college_email, '@', 2), '.', ' '))) AS college_name,
  'active'
FROM public.users
WHERE college_email IS NOT NULL
  AND position('@' IN college_email) > 0
  AND split_part(college_email, '@', 2) <> ''
  AND lower(split_part(college_email, '@', 2)) NOT IN ('gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com')
ON CONFLICT (domain) DO NOTHING;

UPDATE public.college_domains
SET status = 'inactive'
WHERE domain IN ('gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com');

INSERT INTO public.college_domains (domain, college_name, status)
VALUES ('csmssengg.org', 'CSMSS Chh. Shahu College of Engineering', 'active')
ON CONFLICT (domain) DO UPDATE
SET
  college_name = EXCLUDED.college_name,
  status = EXCLUDED.status;

CREATE OR REPLACE FUNCTION public.check_college_email_domain(email text)
RETURNS TABLE (
  normalized_email text,
  domain text,
  approved boolean,
  college_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  normalized_input text;
BEGIN
  normalized_input := lower(trim(email));

  IF normalized_input IS NULL OR normalized_input = '' OR position('@' IN normalized_input) = 0 THEN
    RETURN QUERY
    SELECT normalized_input, null::text, false, null::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    normalized_input,
    split_part(normalized_input, '@', 2),
    EXISTS (
      SELECT 1
      FROM public.college_domains cd
      WHERE cd.domain = split_part(normalized_input, '@', 2)
        AND cd.status = 'active'
    ) AS approved,
    (
      SELECT cd.college_name
      FROM public.college_domains cd
      WHERE cd.domain = split_part(normalized_input, '@', 2)
        AND cd.status = 'active'
      LIMIT 1
    ) AS college_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_user_verification(
  target_user_id uuid,
  target_type text,
  target_status text,
  target_verified_at timestamp with time zone,
  target_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.user_verifications (user_id, verification_type, status, verified_at, metadata)
  VALUES (target_user_id, target_type, target_status, target_verified_at, COALESCE(target_metadata, '{}'::jsonb))
  ON CONFLICT (user_id, verification_type) DO UPDATE
  SET
    status = EXCLUDED.status,
    verified_at = EXCLUDED.verified_at,
    metadata = EXCLUDED.metadata;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_verifications_user_type_unique'
  ) THEN
    ALTER TABLE public.user_verifications
      ADD CONSTRAINT user_verifications_user_type_unique UNIQUE (user_id, verification_type);
  END IF;
END $$;

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

  IF COALESCE(nullif(trim(target_user.name), ''), '') <> '' THEN completeness := completeness + 10; END IF;
  IF COALESCE(nullif(trim(target_user.college_name), ''), '') <> '' THEN completeness := completeness + 10; END IF;
  IF COALESCE(nullif(trim(target_user.branch), ''), '') <> '' THEN completeness := completeness + 10; END IF;
  IF target_user.year IS NOT NULL THEN completeness := completeness + 10; END IF;
  IF COALESCE(nullif(trim(target_user.about), ''), '') <> '' THEN completeness := completeness + 10; END IF;
  IF COALESCE(array_length(target_user.hobbies, 1), 0) > 0 THEN completeness := completeness + 10; END IF;
  IF COALESCE(nullif(trim(target_user.relationship_intent), ''), '') <> '' THEN completeness := completeness + 10; END IF;
  IF COALESCE(nullif(trim(target_user.preferred_chat_frequency), ''), '') <> '' THEN completeness := completeness + 10; END IF;
  IF COALESCE(nullif(trim(target_user.voice_notes_comfort), ''), '') <> '' THEN completeness := completeness + 10; END IF;
  IF COALESCE(nullif(trim(target_user.privacy_comfort), ''), '') <> '' THEN completeness := completeness + 10; END IF;

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
      OR COALESCE(nullif(trim(target_user.preferred_chat_frequency), ''), '') = '' THEN
    next_access_state := 'onboarding_required';
    next_onboarding_step := 'heartpath';
  ELSIF COALESCE(nullif(trim(target_user.voice_notes_comfort), ''), '') = ''
      OR COALESCE(nullif(trim(target_user.privacy_comfort), ''), '') = '' THEN
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
    profile_completeness = completeness,
    email_verified_at = current_confirmed_at,
    student_verified_at = CASE WHEN approved_domain IS NOT NULL THEN COALESCE(target_user.student_verified_at, now()) ELSE null END,
    verification_badges = badges
  WHERE id = current_user_id
  RETURNING * INTO target_user;

  PERFORM public.upsert_user_verification(
    current_user_id,
    'email_verified',
    CASE WHEN current_confirmed_at IS NOT NULL THEN 'verified' ELSE 'pending' END,
    current_confirmed_at,
    '{}'::jsonb
  );

  PERFORM public.upsert_user_verification(
    current_user_id,
    'student_verified',
    CASE WHEN approved_domain IS NOT NULL THEN 'verified' ELSE 'pending' END,
    CASE WHEN approved_domain IS NOT NULL THEN COALESCE(target_user.student_verified_at, now()) ELSE null END,
    jsonb_build_object('domain', approved_domain, 'college_name', approved_college_name)
  );

  RETURN target_user;
END;
$function$;

UPDATE public.users u
SET
  access_state = CASE
    WHEN au.email_confirmed_at IS NULL THEN 'verification_pending'
    WHEN cd.domain IS NULL THEN 'blocked'
    WHEN COALESCE(u.photo_levels->>'level_1', '') <> ''
      AND COALESCE(nullif(trim(u.name), ''), '') <> ''
      AND COALESCE(nullif(trim(u.college_name), ''), '') <> ''
      AND COALESCE(nullif(trim(u.branch), ''), '') <> ''
      AND u.year IS NOT NULL
      AND COALESCE(nullif(trim(u.about), ''), '') <> ''
      AND COALESCE(array_length(u.hobbies, 1), 0) > 0
      AND COALESCE(nullif(trim(u.relationship_intent), ''), '') <> ''
      AND COALESCE(nullif(trim(u.preferred_chat_frequency), ''), '') <> ''
      AND COALESCE(nullif(trim(u.voice_notes_comfort), ''), '') <> ''
      AND COALESCE(nullif(trim(u.privacy_comfort), ''), '') <> ''
      THEN 'active'
    ELSE 'onboarding_required'
  END,
  onboarding_step = CASE
    WHEN au.email_confirmed_at IS NULL THEN 'verify'
    WHEN cd.domain IS NULL THEN 'verify'
    WHEN COALESCE(nullif(trim(u.name), ''), '') = ''
      OR COALESCE(nullif(trim(u.college_name), ''), '') = ''
      OR COALESCE(nullif(trim(u.branch), ''), '') = ''
      OR u.year IS NULL THEN 'basics'
    WHEN COALESCE(nullif(trim(u.about), ''), '') = ''
      OR COALESCE(array_length(u.hobbies, 1), 0) = 0
      OR COALESCE(nullif(trim(u.relationship_intent), ''), '') = ''
      OR COALESCE(nullif(trim(u.preferred_chat_frequency), ''), '') = '' THEN 'heartpath'
    WHEN COALESCE(nullif(trim(u.voice_notes_comfort), ''), '') = ''
      OR COALESCE(nullif(trim(u.privacy_comfort), ''), '') = '' THEN 'boundaries'
    WHEN COALESCE(u.photo_levels->>'level_1', '') = '' THEN 'photo_review'
    ELSE 'complete'
  END,
  onboarding_completed_at = CASE
    WHEN COALESCE(u.photo_levels->>'level_1', '') <> ''
      AND COALESCE(nullif(trim(u.name), ''), '') <> ''
      AND COALESCE(nullif(trim(u.college_name), ''), '') <> ''
      AND COALESCE(nullif(trim(u.branch), ''), '') <> ''
      AND u.year IS NOT NULL
      AND COALESCE(nullif(trim(u.about), ''), '') <> ''
      AND COALESCE(array_length(u.hobbies, 1), 0) > 0
      AND COALESCE(nullif(trim(u.relationship_intent), ''), '') <> ''
      AND COALESCE(nullif(trim(u.preferred_chat_frequency), ''), '') <> ''
      AND COALESCE(nullif(trim(u.voice_notes_comfort), ''), '') <> ''
      AND COALESCE(nullif(trim(u.privacy_comfort), ''), '') <> ''
      THEN COALESCE(u.onboarding_completed_at, now())
    ELSE null
  END,
  profile_completeness = LEAST(100,
    (CASE WHEN COALESCE(nullif(trim(u.name), ''), '') <> '' THEN 10 ELSE 0 END) +
    (CASE WHEN COALESCE(nullif(trim(u.college_name), ''), '') <> '' THEN 10 ELSE 0 END) +
    (CASE WHEN COALESCE(nullif(trim(u.branch), ''), '') <> '' THEN 10 ELSE 0 END) +
    (CASE WHEN u.year IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN COALESCE(nullif(trim(u.about), ''), '') <> '' THEN 10 ELSE 0 END) +
    (CASE WHEN COALESCE(array_length(u.hobbies, 1), 0) > 0 THEN 10 ELSE 0 END) +
    (CASE WHEN COALESCE(nullif(trim(u.relationship_intent), ''), '') <> '' THEN 10 ELSE 0 END) +
    (CASE WHEN COALESCE(nullif(trim(u.preferred_chat_frequency), ''), '') <> '' THEN 10 ELSE 0 END) +
    (CASE WHEN COALESCE(nullif(trim(u.voice_notes_comfort), ''), '') <> '' THEN 10 ELSE 0 END) +
    (CASE WHEN COALESCE(nullif(trim(u.privacy_comfort), ''), '') <> '' THEN 10 ELSE 0 END)
  ),
  email_verified_at = au.email_confirmed_at,
  student_verified_at = CASE WHEN cd.domain IS NOT NULL THEN COALESCE(u.student_verified_at, now()) ELSE null END,
  verification_badges = jsonb_build_object(
    'email_verified', au.email_confirmed_at IS NOT NULL,
    'student_verified', cd.domain IS NOT NULL,
    'photo_verified', COALESCE(u.verification_badges->>'photo_verified', 'false')::boolean,
    'identity_verified', COALESCE(u.verification_badges->>'identity_verified', 'false')::boolean
  )
FROM auth.users au
LEFT JOIN public.college_domains cd
  ON cd.domain = lower(split_part(COALESCE(au.email, ''), '@', 2))
 AND cd.status = 'active'
WHERE au.id = u.id;

INSERT INTO public.user_verifications (user_id, verification_type, status, verified_at, metadata)
SELECT
  u.id,
  'email_verified',
  CASE WHEN u.email_verified_at IS NOT NULL THEN 'verified' ELSE 'pending' END,
  u.email_verified_at,
  '{}'::jsonb
FROM public.users u
ON CONFLICT (user_id, verification_type) DO NOTHING;

INSERT INTO public.user_verifications (user_id, verification_type, status, verified_at, metadata)
SELECT
  u.id,
  'student_verified',
  CASE WHEN u.student_verified_at IS NOT NULL THEN 'verified' ELSE 'pending' END,
  u.student_verified_at,
  jsonb_build_object('domain', lower(split_part(u.college_email, '@', 2)))
FROM public.users u
ON CONFLICT (user_id, verification_type) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_college_domains_domain_status ON public.college_domains(domain, status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_type ON public.user_verifications(user_id, verification_type);
