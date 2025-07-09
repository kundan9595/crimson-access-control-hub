import { useQuery } from '@tanstack/react-query';
import { fetchUsers, fetchUserRoles, Profile } from '@/services/usersService';

export type UserWithRoles = Profile & { user_roles: any[] };

export function useUsers() {
  return useQuery<UserWithRoles[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const users = await fetchUsers();
      const userRoles = await fetchUserRoles();
      // Combine profiles with their roles
      return users.map(user => ({
        ...user,
        user_roles: userRoles.filter(ur => ur.user_id === user.id) || []
      }));
    },
  });
} 