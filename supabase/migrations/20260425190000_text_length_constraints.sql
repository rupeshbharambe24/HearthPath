-- supabase/migrations/20260425190000_text_length_constraints.sql

-- Add NOT VALID first if any existing rows might exceed limits, then VALIDATE in
-- a follow-up. For Phase 1 these limits are deliberately generous; existing rows
-- are exceedingly unlikely to exceed them. If validation fails on rollout, run:
--   ALTER TABLE public.<table> VALIDATE CONSTRAINT <name>;
-- after manually trimming offenders.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_details_length'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_details_length CHECK (details IS NULL OR char_length(details) <= 1000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_content_length'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_content_length CHECK (content IS NULL OR char_length(content) <= 4000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memories_memo_length'
  ) THEN
    ALTER TABLE public.memories
      ADD CONSTRAINT memories_memo_length CHECK (memo_text IS NULL OR char_length(memo_text) <= 4000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_checkins_note_length'
  ) THEN
    ALTER TABLE public.weekly_checkins
      ADD CONSTRAINT weekly_checkins_note_length CHECK (relationship_note IS NULL OR char_length(relationship_note) <= 2000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_checkins_grat_length'
  ) THEN
    ALTER TABLE public.weekly_checkins
      ADD CONSTRAINT weekly_checkins_grat_length CHECK (gratitude_note IS NULL OR char_length(gratitude_note) <= 2000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_about_length'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_about_length CHECK (about IS NULL OR char_length(about) <= 2000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_name_length'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_name_length CHECK (char_length(name) <= 120);
  END IF;
END $$;
