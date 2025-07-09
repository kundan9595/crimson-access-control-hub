import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Permission = Tables<'permissions'>;

export function usePermissions() {
  const queryClient = useQueryClient();
  const query = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
  return query;
} 