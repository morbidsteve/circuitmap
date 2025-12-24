import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Breaker } from '@/types/panel';

// Create breaker
export function useCreateBreaker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      panelId: string;
      position: string;
      amperage: number;
      poles?: number;
      label: string;
      circuitType?: string;
      protectionType?: string;
      isOn?: boolean;
      notes?: string;
      sortOrder?: number;
    }) => {
      const res = await fetch('/api/breakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create breaker');
      }
      return res.json() as Promise<Breaker>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', variables.panelId] });
    },
  });
}

// Update breaker
export function useUpdateBreaker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, panelId, data }: {
      id: string;
      panelId: string;
      data: Partial<{
        position: string;
        amperage: number;
        poles: number;
        label: string;
        circuitType: string;
        protectionType: string;
        isOn: boolean;
        notes: string;
        sortOrder: number;
      }>;
    }) => {
      const res = await fetch(`/api/breakers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update breaker');
      }
      return res.json() as Promise<Breaker>;
    },
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

// Delete breaker
export function useDeleteBreaker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, panelId }: { id: string; panelId: string }) => {
      const res = await fetch(`/api/breakers/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete breaker');
      }
      return res.json();
    },
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}
