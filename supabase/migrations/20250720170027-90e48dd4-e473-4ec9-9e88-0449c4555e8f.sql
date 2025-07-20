-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for relationships table  
ALTER TABLE public.relationships REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.relationships;