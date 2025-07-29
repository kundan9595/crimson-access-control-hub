import { useQuery } from '@tanstack/react-query';
import { statesService, IndianState } from '@/services/masters/statesService';

export const useStates = () => {
  return useQuery<IndianState[]>({
    queryKey: ['states'],
    queryFn: statesService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useState = (id: string) => {
  return useQuery<IndianState | null>({
    queryKey: ['states', id],
    queryFn: () => statesService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 