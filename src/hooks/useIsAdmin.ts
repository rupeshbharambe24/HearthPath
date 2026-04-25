import { useQuery } from '@tanstack/react-query';
import { fetchIsAdmin } from '@/lib/admin';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: Boolean(user?.id),
    queryFn: fetchIsAdmin,
    staleTime: 5 * 60 * 1000,
  });
}
