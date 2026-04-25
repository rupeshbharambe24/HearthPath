import { supabase } from '@/integrations/supabase/client';

export async function fetchIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.warn('is_admin check failed:', error.message);
    return false;
  }
  return Boolean(data);
}
