import { useQuery } from '@tanstack/react-query';
import { fetchStates } from '@/services/masters/statesService';

export const useStates = () => {
  return useQuery({
    queryKey: ['states'],
    queryFn: fetchStates,
  });
};