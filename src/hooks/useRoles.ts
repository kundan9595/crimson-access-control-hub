import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Role = Tables<'roles'> & {
  role_permissions?: any[];
};

export function useRoles() {
  const queryClient = useQueryClient();
  const query = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          role_permissions (
            permission_id,
            permissions (
              id,
              name,
              description
            )
          )
        `)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
  return query;
} 