import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      floorId: string;
      panelId: string;
      name: string;
      positionX?: number;
      positionY?: number;
      width?: number;
      height?: number;
    }) => {
      const { panelId, ...roomData } = data;
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create room');
      }
      return res.json();
    },
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, panelId, data }: {
      id: string;
      panelId: string;
      data: Partial<{
        name: string;
        positionX: number;
        positionY: number;
        width: number;
        height: number;
      }>;
    }) => {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update room');
      }
      return res.json();
    },
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, panelId }: { id: string; panelId: string }) => {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete room');
      }
      return res.json();
    },
    onSuccess: (_, { panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}
