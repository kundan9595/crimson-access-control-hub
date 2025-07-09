
import { useQuery } from '@tanstack/react-query';
import { fetchStates, fetchCitiesByState } from '@/services/statesService';

export function useStates() {
  return useQuery({
    queryKey: ['states'],
    queryFn: fetchStates,
  });
}

export function useCitiesByState(stateId: string) {
  return useQuery({
    queryKey: ['cities', stateId],
    queryFn: () => fetchCitiesByState(stateId),
    enabled: !!stateId,
  });
}
