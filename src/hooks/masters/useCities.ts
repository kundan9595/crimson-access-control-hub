import { useQuery } from '@tanstack/react-query';
import { fetchCitiesByState } from '@/services/masters/citiesService';

export const useCities = (stateId: string) => {
  return useQuery({
    queryKey: ['cities', stateId],
    queryFn: () => fetchCitiesByState(stateId),
    enabled: !!stateId,
  });
};

// Alias for backward compatibility
export const useCitiesByState = useCities;