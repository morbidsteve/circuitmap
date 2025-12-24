import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      roomId: string;
      panelId: string;
      breakerId?: string | null;
      type: string;
      subtype?: string;
      description: string;
      positionX?: number;
      positionY?: number;
      estimatedWattage?: number;
      isGfciProtected?: boolean;
      notes?: string;
    }) => {
      const { panelId, ...deviceData } = data;
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create device');
      }
      return res.json();
    },
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, panelId, data }: {
      id: string;
      panelId: string;
      data: Partial<{
        roomId: string;
        breakerId: string | null;
        type: string;
        subtype: string;
        description: string;
        positionX: number;
        positionY: number;
        estimatedWattage: number;
        isGfciProtected: boolean;
        notes: string;
      }>;
    }) => {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update device');
      }
      return res.json();
    },
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, panelId }: { id: string; panelId: string }) => {
      const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete device');
      }
      return res.json();
    },
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}
