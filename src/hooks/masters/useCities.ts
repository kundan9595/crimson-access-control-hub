import { useQuery } from '@tanstack/react-query';
import { citiesService, IndianCity } from '@/services/masters/citiesService';

export const useCities = () => {
  return useQuery<IndianCity[]>({
    queryKey: ['cities'],
    queryFn: citiesService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCitiesByState = (stateId: string) => {
  return useQuery<IndianCity[]>({
    queryKey: ['cities', 'state', stateId],
    queryFn: () => citiesService.getByStateId(stateId),
    enabled: !!stateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCity = (id: string) => {
  return useQuery<IndianCity | null>({
    queryKey: ['cities', id],
    queryFn: () => citiesService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 