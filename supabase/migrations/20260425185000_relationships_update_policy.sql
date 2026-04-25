-- supabase/migrations/20260425185000_relationships_update_policy.sql
--
-- Defense in depth for the stage-integrity trigger added in
-- 20260425130000_relationship_stage_integrity.sql. Replace the legacy
-- "Users can update their relationships" policy (USING only, no WITH CHECK)
-- with a tighter policy that also runs the membership predicate against
-- the *new* row, so an UPDATE cannot produce a row whose user_a/user_b
-- the caller is no longer part of. The trigger already catches this with
-- "Cannot reassign relationship members"; this is the RLS-layer safety net.

DROP POLICY IF EXISTS "Users can update their relationships" ON public.relationships;
DROP POLICY IF EXISTS "relationships_member_update" ON public.relationships;

CREATE POLICY "relationships_member_update"
ON public.relationships
FOR UPDATE
USING (auth.uid() IN (user_a, user_b))
WITH CHECK (auth.uid() IN (user_a, user_b));
