import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  userPermission: 'admin' | 'write' | 'read' | null;
  setAuth: (token: string, user: User) => void;
  setUserPermission: (permission: 'admin' | 'write' | 'read') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      userPermission: null,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      setUserPermission: (permission) => set({ userPermission: permission }),
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, userPermission: null });
        localStorage.removeItem('auth-storage');
        window.location.href = '/';
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);
