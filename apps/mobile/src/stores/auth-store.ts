import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient, setTokens, clearTokens } from '../services/api-client';
import type { User, AuthTokens, ApiResponse } from '@eyecare/shared';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;

  login: (identifier: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    preferredLanguage?: string;
    timezone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  enterGuestMode: () => void;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,

  login: async (identifier, password) => {
    const res = await apiClient<ApiResponse<{ user: User } & AuthTokens>>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
        skipAuth: true,
      },
    );

    await setTokens(res.data.accessToken, res.data.refreshToken);
    set({ user: res.data.user, isAuthenticated: true, isGuest: false });
  },

  signup: async (data) => {
    const res = await apiClient<ApiResponse<{ user: User } & AuthTokens>>(
      '/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      },
    );

    await setTokens(res.data.accessToken, res.data.refreshToken);
    set({ user: res.data.user, isAuthenticated: true, isGuest: false });
  },

  logout: async () => {
    try {
      await apiClient('/auth/logout', { method: 'DELETE' });
    } catch {
      // Ignore logout errors
    }
    await clearTokens();
    set({ user: null, isAuthenticated: false, isGuest: false });
  },

  enterGuestMode: () => {
    set({ user: null, isAuthenticated: false, isGuest: true });
  },

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      // Validate token by fetching current user profile
      // For now, just mark as authenticated — we'll add a /me endpoint later
      set({ isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
