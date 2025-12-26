import Constants from 'expo-constants';
import { useAuthStore } from './auth';

// API URL - can be configured via environment or Expo Constants
export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Authenticated fetch wrapper for API requests
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if required
  if (requireAuth) {
    const token = useAuthStore.getState().token;
    console.log('[API] Token available:', !!token, token ? `${token.substring(0, 20)}...` : 'none');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('[API] No auth token available for authenticated request to:', endpoint);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.error || `Request failed with status ${response.status}`,
      response.status,
      error
    );
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return {} as T;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Typed API methods
export const api = {
  // Panels
  getPanels: () => apiFetch<import('@circuitmap/shared').PanelWithRelations[]>('/api/panels'),

  getPanel: (id: string) =>
    apiFetch<import('@circuitmap/shared').PanelWithRelations>(`/api/panels/${id}`),

  createPanel: (data: Partial<import('@circuitmap/shared').Panel>) =>
    apiFetch<import('@circuitmap/shared').Panel>('/api/panels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePanel: (id: string, data: Partial<import('@circuitmap/shared').Panel>) =>
    apiFetch<import('@circuitmap/shared').Panel>(`/api/panels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePanel: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/panels/${id}`, {
      method: 'DELETE',
    }),

  // Breakers
  createBreaker: (data: Partial<import('@circuitmap/shared').Breaker>) =>
    apiFetch<import('@circuitmap/shared').Breaker>('/api/breakers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBreaker: (id: string, data: Partial<import('@circuitmap/shared').Breaker>) =>
    apiFetch<import('@circuitmap/shared').Breaker>(`/api/breakers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteBreaker: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/breakers/${id}`, {
      method: 'DELETE',
    }),

  // Floors
  createFloor: (data: Partial<import('@circuitmap/shared').Floor>) =>
    apiFetch<import('@circuitmap/shared').Floor>('/api/floors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFloor: (id: string, data: Partial<import('@circuitmap/shared').Floor>) =>
    apiFetch<import('@circuitmap/shared').Floor>(`/api/floors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteFloor: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/floors/${id}`, {
      method: 'DELETE',
    }),

  // Rooms
  createRoom: (data: Partial<import('@circuitmap/shared').Room>) =>
    apiFetch<import('@circuitmap/shared').Room>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRoom: (id: string, data: Partial<import('@circuitmap/shared').Room>) =>
    apiFetch<import('@circuitmap/shared').Room>(`/api/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRoom: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/rooms/${id}`, {
      method: 'DELETE',
    }),

  // Devices
  createDevice: (data: Partial<import('@circuitmap/shared').Device>) =>
    apiFetch<import('@circuitmap/shared').Device>('/api/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDevice: (id: string, data: Partial<import('@circuitmap/shared').Device>) =>
    apiFetch<import('@circuitmap/shared').Device>(`/api/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDevice: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/devices/${id}`, {
      method: 'DELETE',
    }),
};
