import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  tier: 'free' | 'starter' | 'pro';
}

interface AuthState {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: { access_token: string; refresh_token: string } | null) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: () => set({ user: null, session: null, isAuthenticated: false }),
}));
