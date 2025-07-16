
-- Create users table linked to auth.users
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  college_email text UNIQUE NOT NULL,
  college_name text,
  branch text,
  year integer,
  hobbies text[],
  about text,
  photo_levels jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create relationships table
CREATE TABLE public.relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid REFERENCES public.users(id) ON DELETE CASCADE,
  user_b uuid REFERENCES public.users(id) ON DELETE CASCADE,
  hearts_a2b integer DEFAULT 0,
  hearts_b2a integer DEFAULT 0,
  trust_score integer DEFAULT 0,
  current_level integer DEFAULT 1,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'chatting', 'friends', 'couple', 'cooldown')),
  cooldown_until timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  content text,
  content_type text DEFAULT 'text' CHECK (content_type IN ('text', 'voice', 'image')),
  created_at timestamp with time zone DEFAULT now()
);

-- Create memories table
CREATE TABLE public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid REFERENCES public.relationships(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.users(id) ON DELETE CASCADE,
  level_at integer,
  memo_text text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create fun_posts table for confessions, unlocks, and quizzes
CREATE TABLE public.fun_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('confession', 'unlock', 'quiz')),
  target_user uuid REFERENCES public.users(id),
  question text,
  correct_answer text,
  message text,
  visible_to_target boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fun_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all user profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for relationships
CREATE POLICY "Users can view their relationships" ON public.relationships
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can create relationships" ON public.relationships
  FOR INSERT WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can update their relationships" ON public.relationships
  FOR UPDATE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for memories
CREATE POLICY "Users can view memories from their relationships" ON public.memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.relationships 
      WHERE id = relationship_id 
      AND (user_a = auth.uid() OR user_b = auth.uid())
    )
  );

CREATE POLICY "Users can create memories for their relationships" ON public.memories
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.relationships 
      WHERE id = relationship_id 
      AND (user_a = auth.uid() OR user_b = auth.uid())
    )
  );

-- RLS Policies for fun_posts
CREATE POLICY "Users can view public fun posts or their own" ON public.fun_posts
  FOR SELECT USING (
    target_user IS NULL OR 
    auth.uid() = owner_id OR 
    auth.uid() = target_user
  );

CREATE POLICY "Users can create their own fun posts" ON public.fun_posts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own fun posts" ON public.fun_posts
  FOR UPDATE USING (auth.uid() = owner_id);

-- Enable real-time for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, college_email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_relationships_users ON public.relationships(user_a, user_b);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_memories_relationship ON public.memories(relationship_id, created_at);
CREATE INDEX idx_fun_posts_type_owner ON public.fun_posts(type, owner_id);
