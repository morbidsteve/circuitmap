import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// API URL - can be configured via environment or Expo Constants
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  subscriptionTier: string;
  isAdmin: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        // Validate token with server
        const response = await fetch(`${API_URL}/api/auth/mobile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          set({
            token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }

        // Token invalid, clear it
        await SecureStore.deleteItemAsync('auth_token');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }

    set({ isLoading: false });
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/mobile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Store token securely
    await SecureStore.setItemAsync('auth_token', data.token);

    set({
      token: data.token,
      user: data.user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  refreshUser: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/mobile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        set({ user: data.user });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },
}));

// Helper to get auth headers for API requests
export function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}
