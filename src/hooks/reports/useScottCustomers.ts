import { useQuery } from '@tanstack/react-query';
import { fetchAllScottCustomers } from '@/services/reports/scottCustomersService';
import { config } from '@/config/environment';

export function useScottCustomers(enabled = true) {
  return useQuery({
    queryKey: ['scott-customers', 'all'],
    queryFn: () => fetchAllScottCustomers(),
    enabled,
    staleTime: config.cache.staleTime,
  });
}
