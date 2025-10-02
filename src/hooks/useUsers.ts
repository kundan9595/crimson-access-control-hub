import { useQuery } from '@tanstack/react-query';
import { fetchUsers, Profile } from '@/services/usersService';

export function useUsers() {
  return useQuery<Profile[]>({
    queryKey: ['users'],
    queryFn: async () => {
      return await fetchUsers();
    },
  });
} 