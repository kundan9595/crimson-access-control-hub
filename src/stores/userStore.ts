import { create } from 'zustand';
import type { UserWithRoles } from '@/hooks/useUsers';

interface UserStoreState {
  users: UserWithRoles[];
  selectedUser: UserWithRoles | null;
  setUsers: (users: UserWithRoles[]) => void;
  selectUser: (user: UserWithRoles | null) => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  users: [],
  selectedUser: null,
  setUsers: (users) => set({ users }),
  selectUser: (user) => set({ selectedUser: user }),
})); 