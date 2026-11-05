import { create } from 'zustand';

export interface UserProfile {
  name: string;
  email: string;
  empId: string;
  desk: string;
  department: string;
}

const defaultUser: UserProfile = {
  name: 'Aarav Patel',
  email: 'aarav.patel@company.com',
  empId: 'CB-41208',
  desk: 'DLF CyberCity Tower B, 4th Floor',
  department: 'Engineering',
};

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
  toggleAuth: () => void;
}

const STORAGE_KEY = 'chaibreak_auth_state';

const getInitialAuthState = (): { isAuthenticated: boolean; user: UserProfile | null } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        isAuthenticated: parsed.isAuthenticated ?? true,
        user: parsed.user ?? defaultUser,
      };
    }
  } catch (e) {
    console.warn('Failed to load auth from storage', e);
  }
  return { isAuthenticated: true, user: defaultUser };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialAuthState(),

  login: () => {
    const state = { isAuthenticated: true, user: defaultUser };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    set(state);
  },

  logout: () => {
    const state = { isAuthenticated: false, user: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    set(state);
  },

  toggleAuth: () => {
    const nextAuth = !get().isAuthenticated;
    const state = {
      isAuthenticated: nextAuth,
      user: nextAuth ? defaultUser : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    set(state);
  },
}));
