-- supabase/migrations/20260425120000_relationship_permission_integrity.sql

-- Single source of truth for required stages (also consumed by client lib).
CREATE TABLE IF NOT EXISTS public.permission_stage_requirements (
  permission text PRIMARY KEY,
  required_stage int NOT NULL CHECK (required_stage BETWEEN 1 AND 6)
);

INSERT INTO public.permission_stage_requirements (permission, required_stage) VALUES
  ('voice_notes', 3),
  ('deeper_profile_details', 3),
  ('private_photo_gallery', 4),
  ('shared_memory_vault', 4),
  ('full_face_photo', 5),
  ('ai_shared_recap_access', 5)
ON CONFLICT (permission) DO UPDATE SET required_stage = EXCLUDED.required_stage;

ALTER TABLE public.permission_stage_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permission_stage_requirements_read" ON public.permission_stage_requirements;
CREATE POLICY "permission_stage_requirements_read"
ON public.permission_stage_requirements
FOR SELECT TO authenticated USING (true);

-- Trigger: enforce stage on INSERT, validate granted_by/granted_to are the two members.
CREATE OR REPLACE FUNCTION public.check_permission_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  rel public.relationships%ROWTYPE;
  required int;
BEGIN
  SELECT * INTO rel FROM public.relationships WHERE id = NEW.relationship_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown relationship';
  END IF;

  IF NEW.granted_by NOT IN (rel.user_a, rel.user_b) THEN
    RAISE EXCEPTION 'granted_by must be a relationship member';
  END IF;

  IF NEW.granted_to NOT IN (rel.user_a, rel.user_b) OR NEW.granted_to = NEW.granted_by THEN
    RAISE EXCEPTION 'granted_to must be the other relationship member';
  END IF;

  SELECT psr.required_stage INTO required
  FROM public.permission_stage_requirements psr
  WHERE psr.permission = NEW.permission;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown permission %', NEW.permission;
  END IF;

  IF rel.current_stage IS NULL OR rel.current_stage < required THEN
    RAISE EXCEPTION 'Permission % requires stage %, current stage %',
      NEW.permission, required, COALESCE(rel.current_stage, 1);
  END IF;

  IF rel.lifecycle_state IN ('archived', 'cooldown') THEN
    RAISE EXCEPTION 'Cannot grant permissions on archived/cooldown relationship';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_permission_grant ON public.relationship_permissions;
CREATE TRIGGER check_permission_grant
BEFORE INSERT ON public.relationship_permissions
FOR EACH ROW EXECUTE FUNCTION public.check_permission_grant();

-- Tighten UPDATE policy: only the granter may modify (revoke).
DROP POLICY IF EXISTS "Users can revoke relationship permissions" ON public.relationship_permissions;
DROP POLICY IF EXISTS "permissions_revoke_by_granter" ON public.relationship_permissions;
CREATE POLICY "permissions_revoke_by_granter"
ON public.relationship_permissions
FOR UPDATE
USING (granted_by = auth.uid())
WITH CHECK (granted_by = auth.uid());

-- Trigger: only revoked_at may change post-grant.
CREATE OR REPLACE FUNCTION public.check_permission_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.relationship_id IS DISTINCT FROM OLD.relationship_id
     OR NEW.permission IS DISTINCT FROM OLD.permission
     OR NEW.granted_by IS DISTINCT FROM OLD.granted_by
     OR NEW.granted_to IS DISTINCT FROM OLD.granted_to
     OR NEW.granted_at IS DISTINCT FROM OLD.granted_at THEN
    RAISE EXCEPTION 'Only revoked_at may be modified after grant';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_permission_update ON public.relationship_permissions;
CREATE TRIGGER check_permission_update
BEFORE UPDATE ON public.relationship_permissions
FOR EACH ROW EXECUTE FUNCTION public.check_permission_update();
