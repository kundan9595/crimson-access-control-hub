import { useQuery } from '@tanstack/react-query';
import { fetchRoles, Role } from '@/services/rolesService';

export function useRoles() {
  console.log('🪝 [useRoles] Hook called');
  const result = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      console.log('🪝 [useRoles] Query function executing...');
      const roles = await fetchRoles();
      console.log('🪝 [useRoles] Query function completed, returning:', roles);
      return roles;
    },
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch on window focus
  });
  
  console.log('🪝 [useRoles] Query result:', {
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    data: result.data,
    dataLength: result.data?.length,
    status: result.status,
    fetchStatus: result.fetchStatus
  });
  
  return result;
}

