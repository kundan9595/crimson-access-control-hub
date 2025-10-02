import { create } from 'zustand';
import type { Profile } from '@/services/usersService';

interface UserStoreState {
  users: Profile[];
  selectedUser: Profile | null;
  setUsers: (users: Profile[]) => void;
  selectUser: (user: Profile | null) => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  users: [],
  selectedUser: null,
  setUsers: (users) => set({ users }),
  selectUser: (user) => set({ selectedUser: user }),
})); 