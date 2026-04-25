-- supabase/migrations/20260425110000_profile_photos_private_verify.sql
-- Manual probes for Task 2 — replace UUID placeholders before running with `psql -f`.
--
-- Placeholder UUIDs:
--   <VIEWER_UUID>          : the user issuing the read (would be auth.uid()).
--   <TARGET_UUID>          : the user whose photo is being read.
--   <RELATIONSHIP_UUID>    : id of the relationships row between viewer and target.
--   <FULL_FACE_PERM_UUID>  : id of a relationship_permissions row granting full_face_photo
--                            to the viewer (granted_by = target, granted_to = viewer).
--   <ARCHIVED_REL_UUID>    : id of an archived relationship between viewer and target.
--   <UNRELATED_UUID>       : a user with no relationship to viewer.
--
-- IMPORTANT: every probe is wrapped in BEGIN; ... ROLLBACK; so that
-- SET LOCAL ROLE authenticated and SET LOCAL "request.jwt.claim.sub" actually
-- engage RLS / auth.uid() (without a transaction these statements silently
-- no-op and the probes become false negatives — finding from Task 1 review).

-- ============================================================================
-- Probe A: viewer at stage 2 cannot see target's level_3 photo.
-- Setup: a relationship between viewer and target with current_stage = 2,
--        lifecycle_state = 'active'. No private_photo_gallery permission.
-- Expected: viewer_can_see_photo_level returns false for level 3 (and level 4).
-- ============================================================================
BEGIN;
UPDATE public.relationships
   SET current_stage = 2, lifecycle_state = 'active'
 WHERE id = '<RELATIONSHIP_UUID>';
DELETE FROM public.relationship_permissions
 WHERE relationship_id = '<RELATIONSHIP_UUID>'
   AND permission IN ('private_photo_gallery', 'full_face_photo');
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<VIEWER_UUID>';
SELECT
  public.viewer_can_see_photo_level('<TARGET_UUID>'::uuid, 1) AS level1_should_be_true,
  public.viewer_can_see_photo_level('<TARGET_UUID>'::uuid, 2) AS level2_should_be_true,
  public.viewer_can_see_photo_level('<TARGET_UUID>'::uuid, 3) AS level3_should_be_false,
  public.viewer_can_see_photo_level('<TARGET_UUID>'::uuid, 4) AS level4_should_be_false;
ROLLBACK;

-- ============================================================================
-- Probe B: viewer at stage 5 + holding full_face_photo permission CAN see level_4.
-- Setup: relationship at current_stage = 5, lifecycle_state = 'active', and a
--        live relationship_permissions row granting full_face_photo to viewer.
-- Expected: viewer_can_see_photo_level returns true for level 4.
-- ============================================================================
BEGIN;
UPDATE public.relationships
   SET current_stage = 5, lifecycle_state = 'active'
 WHERE id = '<RELATIONSHIP_UUID>';
INSERT INTO public.relationship_permissions (id, relationship_id, permission, granted_by, granted_to, revoked_at)
VALUES (
  '<FULL_FACE_PERM_UUID>'::uuid,
  '<RELATIONSHIP_UUID>'::uuid,
  'full_face_photo',
  '<TARGET_UUID>'::uuid,
  '<VIEWER_UUID>'::uuid,
  NULL
)
ON CONFLICT (relationship_id, permission, granted_to)
DO UPDATE SET revoked_at = NULL;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<VIEWER_UUID>';
SELECT public.viewer_can_see_photo_level('<TARGET_UUID>'::uuid, 4) AS level4_should_be_true;
ROLLBACK;

-- ============================================================================
-- Probe C: archived relationship blocks all levels >= 2.
-- Setup: relationship at lifecycle_state = 'archived', with both permissions live.
-- Expected: only level 1 returns true; levels 2/3/4 return false.
-- ============================================================================
BEGIN;
UPDATE public.relationships
   SET current_stage = 6, lifecycle_state = 'archived'
 WHERE id = '<ARCHIVED_REL_UUID>';
INSERT INTO public.relationship_permissions (relationship_id, permission, granted_by, granted_to, revoked_at)
VALUES
  ('<ARCHIVED_REL_UUID>'::uuid, 'private_photo_gallery', '<TARGET_UUID>'::uuid, '<VIEWER_UUID>'::uuid, NULL),
  ('<ARCHIVED_REL_UUID>'::uuid, 'full_face_photo',       '<TARGET_UUID>'::uuid, '<VIEWER_UUID>'::uuid, NULL)
ON CONFLICT (relationship_id, permission, granted_to)
DO UPDATE SET revoked_at = NULL;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<VIEWER_UUID>';
SELECT
  public.viewer_can_see_photo_level('<TARGET_UUID>'::uuid, 1) AS level1_should_be_true,
  public.viewer_can_see_photo_level('<TARGET_UUID>'::uuid, 2) AS level2_should_be_false,
  public.viewer_can_see_photo_level('<TARGET_UUID>'::uuid, 3) AS level3_should_be_false,
  public.viewer_can_see_photo_level('<TARGET_UUID>'::uuid, 4) AS level4_should_be_false;
ROLLBACK;

-- ============================================================================
-- Probe D: viewer with no relationship to target sees only level_1.
-- Expected: level 1 is true (public discovery), levels 2/3/4 return false.
-- ============================================================================
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<VIEWER_UUID>';
SELECT
  public.viewer_can_see_photo_level('<UNRELATED_UUID>'::uuid, 1) AS level1_should_be_true,
  public.viewer_can_see_photo_level('<UNRELATED_UUID>'::uuid, 2) AS level2_should_be_false,
  public.viewer_can_see_photo_level('<UNRELATED_UUID>'::uuid, 3) AS level3_should_be_false,
  public.viewer_can_see_photo_level('<UNRELATED_UUID>'::uuid, 4) AS level4_should_be_false;
ROLLBACK;

-- ============================================================================
-- Probe E: self always returns true regardless of stage / permissions.
-- ============================================================================
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '<VIEWER_UUID>';
SELECT
  public.viewer_can_see_photo_level('<VIEWER_UUID>'::uuid, 1) AS self_level1_should_be_true,
  public.viewer_can_see_photo_level('<VIEWER_UUID>'::uuid, 2) AS self_level2_should_be_true,
  public.viewer_can_see_photo_level('<VIEWER_UUID>'::uuid, 3) AS self_level3_should_be_true,
  public.viewer_can_see_photo_level('<VIEWER_UUID>'::uuid, 4) AS self_level4_should_be_true;
ROLLBACK;

-- ============================================================================
-- Probe F: backfill correctness — confirms stripping a public URL leaves the
-- bare object path (no surrounding quotes) in photo_levels JSON.
-- ============================================================================
BEGIN;
WITH sample(photo_levels) AS (
  VALUES (
    jsonb_build_object(
      'level_1',
      'https://abcd.supabase.co/storage/v1/object/public/profile-photos/aaaa/level_1.jpg',
      'level_2',
      'aaaa/level_2.jpg'
    )
  )
)
SELECT (
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
  FROM jsonb_each(sample.photo_levels)
) AS rewritten
FROM sample;
-- Expected: rewritten.level_1 = "aaaa/level_1.jpg" (bare path, no leading quote/scheme),
--           rewritten.level_2 = "aaaa/level_2.jpg" (unchanged).
ROLLBACK;
