import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  user: { id: number; phone: string; name: string; role: string } | null;
  isRestoringToken: boolean; //track initialization
  setAuth: (token: string, user: any) => void;
  logout: () => void;
  setRestoringComplete: () => void; //clear the loading state
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      isRestoringToken: true, // Starts as true when the app boots up
      setAuth: (token, user) => set({ token, user, isRestoringToken: false }),
      logout: () => set({ token: null, user: null, isRestoringToken: false }),
      setRestoringComplete: () => set({ isRestoringToken: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // This function executes automatically as soon as AsyncStorage finishes loading
      onRehydrateStorage: () => state => {
        state?.setRestoringComplete();
      },
    },
  ),
);
