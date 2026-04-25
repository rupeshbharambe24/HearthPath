-- supabase/migrations/20260425110000_profile_photos_private.sql
--
-- Phase 1, Task 2: lock down the profile-photos bucket.
--
-- Before this migration the bucket was public, so any signed-in (or anonymous)
-- request could fetch level_3 / level_4 photos by guessing the
-- <user_uuid>/level_X.jpg path. We:
--   1) Flip the bucket to private.
--   2) Drop the blanket public-read storage policy.
--   3) Add a self-read storage policy so users can still read their own photos
--      directly via the storage API. Cross-user reads must go through the
--      signed-photo-url edge function (service-role bypasses RLS).
--   4) Add viewer_can_see_photo_level(target, level) — SECURITY DEFINER RPC the
--      edge function calls under the requesting user's JWT to re-check
--      stage + permission gating before issuing a signed URL.
--   5) Backfill users.photo_levels JSON: convert any stored
--      /storage/v1/object/public/profile-photos/<path> URLs to the bare
--      <path> the storage API expects, since the bucket is now private.

UPDATE storage.buckets SET public = false WHERE id = 'profile-photos';

DROP POLICY IF EXISTS "Public read access for profile photos" ON storage.objects;

-- Authenticated users can read their OWN photos directly. Cross-user reads must
-- go through the edge function (service-role).
DROP POLICY IF EXISTS "profile_photos_self_read" ON storage.objects;
CREATE POLICY "profile_photos_self_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE OR REPLACE FUNCTION public.viewer_can_see_photo_level(
  p_target uuid,
  p_level int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  viewer uuid := auth.uid();
  rel public.relationships%ROWTYPE;
  has_full_face boolean;
  has_private_gallery boolean;
BEGIN
  IF viewer IS NULL THEN RETURN false; END IF;
  IF viewer = p_target THEN RETURN true; END IF;
  -- level_1 is the public-discovery photo, gated only by discovery RPC eligibility.
  IF p_level = 1 THEN RETURN true; END IF;

  SELECT * INTO rel FROM public.relationships
  WHERE (user_a = viewer AND user_b = p_target) OR (user_b = viewer AND user_a = p_target)
  LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  IF rel.lifecycle_state IN ('archived', 'cooldown') THEN RETURN false; END IF;

  IF p_level = 2 THEN
    RETURN rel.current_stage >= 2;
  ELSIF p_level = 3 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.relationship_permissions rp
      WHERE rp.relationship_id = rel.id
        AND rp.permission = 'private_photo_gallery'
        AND rp.granted_to = viewer
        AND rp.revoked_at IS NULL
    ) INTO has_private_gallery;
    RETURN rel.current_stage >= 4 AND has_private_gallery;
  ELSIF p_level = 4 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.relationship_permissions rp
      WHERE rp.relationship_id = rel.id
        AND rp.permission = 'full_face_photo'
        AND rp.granted_to = viewer
        AND rp.revoked_at IS NULL
    ) INTO has_full_face;
    RETURN rel.current_stage >= 5 AND has_full_face;
  END IF;
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.viewer_can_see_photo_level(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.viewer_can_see_photo_level(uuid, int) TO authenticated;

-- Convention from this migration onward: photo_levels stores the storage object path,
-- not the public URL (the bucket is no longer public). Backfill any rows that still
-- contain a /storage/v1/object/public/profile-photos/<path> URL.
--
-- Implementation note: for a jsonb string value, `value::text` includes the
-- surrounding quotes (e.g. "https://..."), which would corrupt split_part output.
-- We use `value #>> '{}'` to extract the underlying text safely, then split, then
-- re-wrap with to_jsonb. For non-string values we leave the entry untouched.
UPDATE public.users
SET photo_levels = (
  SELECT jsonb_object_agg(
    key,
    CASE
      WHEN jsonb_typeof(value) = 'string'
        AND (value #>> '{}') LIKE '%/storage/v1/object/public/profile-photos/%'
      THEN to_jsonb(
        split_part(value #>> '{}', '/storage/v1/object/public/profile-photos/', 2)
      )
      ELSE value
    END
  )
  FROM jsonb_each(photo_levels)
)
WHERE photo_levels IS NOT NULL AND photo_levels <> '{}'::jsonb;
