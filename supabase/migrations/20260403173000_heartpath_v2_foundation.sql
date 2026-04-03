ALTER TABLE public.relationships DROP CONSTRAINT IF EXISTS relationships_status_check;

ALTER TABLE public.relationships
  ADD COLUMN IF NOT EXISTS lifecycle_state text,
  ADD COLUMN IF NOT EXISTS current_stage integer,
  ADD COLUMN IF NOT EXISTS stage_request_from_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requested_stage integer,
  ADD COLUMN IF NOT EXISTS stage_request_status text,
  ADD COLUMN IF NOT EXISTS stage_request_cooldown_until timestamp with time zone,
  ADD COLUMN IF NOT EXISTS exclusive_locked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS paused_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS pace_preference text DEFAULT 'steady',
  ADD COLUMN IF NOT EXISTS boundary_topics text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS agreements_summary text;

UPDATE public.relationships
SET
  current_stage = GREATEST(1, LEAST(COALESCE(current_stage, current_level, 1), 6)),
  lifecycle_state = CASE
    WHEN COALESCE(current_stage, current_level, 1) >= 6 THEN 'exclusive'
    WHEN COALESCE(lifecycle_state, status, 'pending') IN ('active', 'exclusive', 'paused', 'cooldown', 'archived') THEN COALESCE(lifecycle_state, status)
    WHEN status IN ('chatting', 'friends') THEN 'active'
    WHEN status = 'couple' THEN 'exclusive'
    WHEN status = 'cooldown' THEN 'cooldown'
    ELSE 'pending'
  END,
  stage_request_status = NULL
WHERE lifecycle_state IS NULL OR current_stage IS NULL;

ALTER TABLE public.relationships
  ALTER COLUMN lifecycle_state SET DEFAULT 'pending',
  ALTER COLUMN current_stage SET DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationships_lifecycle_state_check'
  ) THEN
    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_lifecycle_state_check
      CHECK (lifecycle_state IN ('pending', 'active', 'exclusive', 'paused', 'cooldown', 'archived'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationships_stage_request_status_check'
  ) THEN
    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_stage_request_status_check
      CHECK (stage_request_status IS NULL OR stage_request_status IN ('pending', 'declined', 'deferred'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationships_current_stage_check'
  ) THEN
    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_current_stage_check
      CHECK (current_stage BETWEEN 1 AND 6);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationships_requested_stage_check'
  ) THEN
    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_requested_stage_check
      CHECK (requested_stage IS NULL OR requested_stage BETWEEN 2 AND 6);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationships_pace_preference_check'
  ) THEN
    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_pace_preference_check
      CHECK (pace_preference IN ('gentle', 'steady', 'deepening'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationships_status_check'
  ) THEN
    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_status_check
      CHECK (status IN ('pending', 'active', 'exclusive', 'paused', 'cooldown', 'archived'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_relationship_heartpath_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.current_stage := GREATEST(1, LEAST(COALESCE(NEW.current_stage, NEW.current_level, 1), 6));
  NEW.current_level := NEW.current_stage;
  NEW.lifecycle_state := COALESCE(NEW.lifecycle_state, NEW.status, 'pending');

  IF NEW.current_stage = 6 AND NEW.lifecycle_state = 'active' THEN
    NEW.lifecycle_state := 'exclusive';
  END IF;

  IF NEW.lifecycle_state = 'exclusive' THEN
    NEW.current_stage := 6;
    NEW.current_level := 6;
    NEW.exclusive_locked_at := COALESCE(NEW.exclusive_locked_at, now());
  ELSIF NEW.lifecycle_state <> 'exclusive' THEN
    NEW.exclusive_locked_at := NULL;
  END IF;

  IF NEW.lifecycle_state = 'paused' THEN
    NEW.paused_at := COALESCE(NEW.paused_at, now());
  ELSIF NEW.lifecycle_state <> 'paused' THEN
    NEW.paused_at := NULL;
  END IF;

  IF NEW.lifecycle_state = 'archived' THEN
    NEW.archived_at := COALESCE(NEW.archived_at, now());
  END IF;

  IF NEW.lifecycle_state = 'cooldown' THEN
    NEW.cooldown_until := COALESCE(NEW.cooldown_until, now() + interval '7 days');
    NEW.archived_at := COALESCE(NEW.archived_at, now());
  END IF;

  NEW.status := NEW.lifecycle_state;
  NEW.updated_at := COALESCE(NEW.updated_at, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_relationship_heartpath_fields ON public.relationships;

CREATE TRIGGER sync_relationship_heartpath_fields
BEFORE INSERT OR UPDATE ON public.relationships
FOR EACH ROW
EXECUTE FUNCTION public.sync_relationship_heartpath_fields();

ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS entry_type text DEFAULT 'good_moment',
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS mood text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS reflection_follow_up text,
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'memories_entry_type_check'
  ) THEN
    ALTER TABLE public.memories
      ADD CONSTRAINT memories_entry_type_check
      CHECK (entry_type IN ('good_moment', 'milestone', 'hard_moment', 'repair', 'gratitude', 'promise', 'date', 'reflection'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'memories_visibility_check'
  ) THEN
    ALTER TABLE public.memories
      ADD CONSTRAINT memories_visibility_check
      CHECK (visibility IN ('private', 'shared'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.relationship_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  granted_to uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (relationship_id, permission, granted_to)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationship_permissions_permission_check'
  ) THEN
    ALTER TABLE public.relationship_permissions
      ADD CONSTRAINT relationship_permissions_permission_check
      CHECK (permission IN ('full_face_photo', 'private_photo_gallery', 'voice_notes', 'deeper_profile_details', 'shared_memory_vault', 'ai_shared_recap_access'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.weekly_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  relationship_rating integer NOT NULL CHECK (relationship_rating BETWEEN 1 AND 5),
  relationship_note text,
  gratitude_note text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (relationship_id, user_id, week_start)
);

CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  generated_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  summary_kind text NOT NULL CHECK (summary_kind IN ('monthly_recap', 'milestone_summary', 'conversation_summary', 'memory_search')),
  source_scope text NOT NULL CHECK (source_scope IN ('private', 'shared')),
  visibility text NOT NULL CHECK (visibility IN ('private', 'shared')),
  consent_scope text,
  title text NOT NULL,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.relationship_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view memories from their relationships" ON public.memories;
DROP POLICY IF EXISTS "Users can create memories for their relationships" ON public.memories;

CREATE POLICY "Users can view memories for accessible scopes"
ON public.memories
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = memories.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
  AND (
    visibility = 'shared'
    OR created_by = auth.uid()
  )
);

CREATE POLICY "Users can create memories for their relationships"
ON public.memories
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = memories.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
);

CREATE POLICY "Users can update their own memories"
ON public.memories
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view relationship permissions for their relationships"
ON public.relationship_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = relationship_permissions.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
);

CREATE POLICY "Users can grant relationship permissions"
ON public.relationship_permissions
FOR INSERT
WITH CHECK (
  auth.uid() = granted_by
  AND EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = relationship_permissions.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
);

CREATE POLICY "Users can revoke relationship permissions"
ON public.relationship_permissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = relationship_permissions.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = relationship_permissions.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
);

CREATE POLICY "Users can view their own or shared check-ins"
ON public.weekly_checkins
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = weekly_checkins.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
  AND (
    visibility = 'shared'
    OR user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own check-ins"
ON public.weekly_checkins
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = weekly_checkins.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
);

CREATE POLICY "Users can update their own check-ins"
ON public.weekly_checkins
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view allowed AI summaries"
ON public.ai_summaries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = ai_summaries.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
  AND (
    visibility = 'shared'
    OR generated_by = auth.uid()
  )
);

CREATE POLICY "Users can create their own AI summaries"
ON public.ai_summaries
FOR INSERT
WITH CHECK (
  generated_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.relationships r
    WHERE r.id = ai_summaries.relationship_id
      AND (r.user_a = auth.uid() OR r.user_b = auth.uid())
  )
);

CREATE POLICY "Users can update their own AI summaries"
ON public.ai_summaries
FOR UPDATE
USING (generated_by = auth.uid())
WITH CHECK (generated_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_relationships_lifecycle_stage ON public.relationships(lifecycle_state, current_stage);
CREATE INDEX IF NOT EXISTS idx_relationship_permissions_relationship ON public.relationship_permissions(relationship_id, permission, granted_to);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_relationship_week ON public.weekly_checkins(relationship_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_relationship_created ON public.ai_summaries(relationship_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_relationship_visibility_created ON public.memories(relationship_id, visibility, created_at DESC);

ALTER TABLE public.relationship_permissions REPLICA IDENTITY FULL;
ALTER TABLE public.weekly_checkins REPLICA IDENTITY FULL;
ALTER TABLE public.ai_summaries REPLICA IDENTITY FULL;
ALTER TABLE public.memories REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.relationship_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
