import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  user: { id: number; phone: string; name: string; role: string } | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
