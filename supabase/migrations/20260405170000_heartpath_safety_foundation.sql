CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_id uuid REFERENCES public.relationships(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN ('fake_identity', 'pressure', 'harassment', 'boundary_violation', 'unsafe_behavior', 'other')),
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('review_note', 'warn', 'restrict', 'suspend', 'dismiss')),
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own reports" ON public.reports;
CREATE POLICY "Users can create their own reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_user_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports"
ON public.reports
FOR SELECT
USING (auth.uid() = reporter_user_id);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_created ON public.reports(reporter_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target_status ON public.reports(target_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_created ON public.moderation_actions(target_user_id, created_at DESC);
