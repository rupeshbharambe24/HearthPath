-- Create blocked_users table for managing user blocks
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Create policies for blocked_users
CREATE POLICY "Users can manage their own blocks"
ON public.blocked_users
FOR ALL
USING (auth.uid() = blocker_id)
WITH CHECK (auth.uid() = blocker_id);