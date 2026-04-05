DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'verification-documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('verification-documents', 'verification-documents', false);
  ELSE
    UPDATE storage.buckets
    SET public = false
    WHERE id = 'verification-documents';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_verifications_status_check'
  ) THEN
    ALTER TABLE public.user_verifications
      DROP CONSTRAINT user_verifications_status_check;
  END IF;

  ALTER TABLE public.user_verifications
    ADD CONSTRAINT user_verifications_status_check
    CHECK (status IN ('verified', 'pending', 'reviewing', 'rejected', 'revoked'));
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload their own verification documents'
  ) THEN
    CREATE POLICY "Users can upload their own verification documents"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can view their own verification documents'
  ) THEN
    CREATE POLICY "Users can view their own verification documents"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update their own verification documents'
  ) THEN
    CREATE POLICY "Users can update their own verification documents"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete their own verification documents'
  ) THEN
    CREATE POLICY "Users can delete their own verification documents"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'verification-documents'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
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
  student_verification public.user_verifications%ROWTYPE;
  student_verified_via_id boolean;
  effective_student_verified boolean;
  effective_student_verified_at timestamp with time zone;
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

  SELECT *
  INTO student_verification
  FROM public.user_verifications uv
  WHERE uv.user_id = current_user_id
    AND uv.verification_type = 'student_verified'
  LIMIT 1;

  student_verified_via_id := COALESCE(student_verification.status = 'verified', false)
    AND COALESCE(student_verification.metadata->>'source', '') = 'id_card';
  effective_student_verified := approved_domain IS NOT NULL OR student_verified_via_id;
  effective_student_verified_at := CASE
    WHEN approved_domain IS NOT NULL THEN COALESCE(target_user.student_verified_at, now())
    WHEN student_verified_via_id THEN COALESCE(student_verification.verified_at, target_user.student_verified_at, now())
    ELSE null
  END;

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
  ELSIF NOT effective_student_verified THEN
    next_access_state := 'verification_pending';
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
    'student_verified', effective_student_verified,
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
    student_verified_at = effective_student_verified_at,
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

  IF approved_domain IS NOT NULL THEN
    PERFORM public.upsert_user_verification(
      current_user_id,
      'student_verified',
      'verified',
      effective_student_verified_at,
      jsonb_build_object(
        'source', 'email_domain',
        'domain', approved_domain,
        'college_name', approved_college_name
      )
    );
  END IF;

  RETURN target_user;
END;
$function$;

UPDATE public.users u
SET
  access_state = CASE
    WHEN au.email_confirmed_at IS NULL THEN 'verification_pending'
    WHEN NOT EXISTS (
      SELECT 1
      FROM public.college_domains cd
      WHERE cd.domain = lower(split_part(COALESCE(u.college_email, au.email, ''), '@', 2))
        AND cd.status = 'active'
    ) AND NOT EXISTS (
      SELECT 1
      FROM public.user_verifications uv
      WHERE uv.user_id = u.id
        AND uv.verification_type = 'student_verified'
        AND uv.status = 'verified'
    ) THEN 'verification_pending'
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
      AND COALESCE(nullif(trim(u.communication_style), ''), '') <> ''
      AND COALESCE(nullif(trim(u.pace_style), ''), '') <> ''
      AND COALESCE(array_length(u.value_tags, 1), 0) > 0
      AND COALESCE(array_length(u.lifestyle_preferences, 1), 0) > 0
      AND u.heartpath_norms_acknowledged_at IS NOT NULL
      THEN 'active'
    ELSE 'onboarding_required'
  END,
  onboarding_step = CASE
    WHEN au.email_confirmed_at IS NULL THEN 'verify'
    WHEN NOT EXISTS (
      SELECT 1
      FROM public.college_domains cd
      WHERE cd.domain = lower(split_part(COALESCE(u.college_email, au.email, ''), '@', 2))
        AND cd.status = 'active'
    ) AND NOT EXISTS (
      SELECT 1
      FROM public.user_verifications uv
      WHERE uv.user_id = u.id
        AND uv.verification_type = 'student_verified'
        AND uv.status = 'verified'
    ) THEN 'verify'
    WHEN COALESCE(nullif(trim(u.name), ''), '') = ''
      OR COALESCE(nullif(trim(u.college_name), ''), '') = ''
      OR COALESCE(nullif(trim(u.branch), ''), '') = ''
      OR u.year IS NULL THEN 'basics'
    WHEN COALESCE(nullif(trim(u.about), ''), '') = ''
      OR COALESCE(array_length(u.hobbies, 1), 0) = 0
      OR COALESCE(nullif(trim(u.relationship_intent), ''), '') = ''
      OR COALESCE(nullif(trim(u.preferred_chat_frequency), ''), '') = ''
      OR COALESCE(nullif(trim(u.communication_style), ''), '') = ''
      OR COALESCE(array_length(u.value_tags, 1), 0) = 0
      OR COALESCE(array_length(u.lifestyle_preferences, 1), 0) = 0
      OR u.heartpath_norms_acknowledged_at IS NULL THEN 'heartpath'
    WHEN COALESCE(nullif(trim(u.voice_notes_comfort), ''), '') = ''
      OR COALESCE(nullif(trim(u.privacy_comfort), ''), '') = ''
      OR COALESCE(nullif(trim(u.pace_style), ''), '') = '' THEN 'boundaries'
    WHEN COALESCE(u.photo_levels->>'level_1', '') = '' THEN 'photo_review'
    ELSE 'complete'
  END,
  email_verified_at = au.email_confirmed_at,
  student_verified_at = CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.college_domains cd
      WHERE cd.domain = lower(split_part(COALESCE(u.college_email, au.email, ''), '@', 2))
        AND cd.status = 'active'
    ) THEN COALESCE(u.student_verified_at, now())
    WHEN EXISTS (
      SELECT 1
      FROM public.user_verifications uv
      WHERE uv.user_id = u.id
        AND uv.verification_type = 'student_verified'
        AND uv.status = 'verified'
    ) THEN COALESCE(
      (
        SELECT uv.verified_at
        FROM public.user_verifications uv
        WHERE uv.user_id = u.id
          AND uv.verification_type = 'student_verified'
          AND uv.status = 'verified'
        LIMIT 1
      ),
      u.student_verified_at
    )
    ELSE null
  END,
  verification_badges = jsonb_build_object(
    'email_verified', au.email_confirmed_at IS NOT NULL,
    'student_verified',
      EXISTS (
        SELECT 1
        FROM public.college_domains cd
        WHERE cd.domain = lower(split_part(COALESCE(u.college_email, au.email, ''), '@', 2))
          AND cd.status = 'active'
      )
      OR EXISTS (
        SELECT 1
        FROM public.user_verifications uv
        WHERE uv.user_id = u.id
          AND uv.verification_type = 'student_verified'
          AND uv.status = 'verified'
      ),
    'photo_verified', COALESCE(u.verification_badges->>'photo_verified', 'false')::boolean,
    'identity_verified', COALESCE(u.verification_badges->>'identity_verified', 'false')::boolean
  )
FROM auth.users au
WHERE au.id = u.id;
