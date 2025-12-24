import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateOpeningInput, UpdateOpeningInput } from '@/types/floorplan';

export function useCreateOpening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOpeningInput & { floorId: string; panelId: string }) => {
      const { floorId, panelId, ...openingData } = data;
      const res = await fetch('/api/openings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(openingData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create opening');
      }
      return res.json();
    },
    onSuccess: (_, { floorId, panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['walls', floorId] });
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

export function useUpdateOpening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      floorId,
      panelId,
      data,
    }: {
      id: string;
      floorId: string;
      panelId: string;
      data: UpdateOpeningInput;
    }) => {
      const res = await fetch(`/api/openings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update opening');
      }
      return res.json();
    },
    onSuccess: (_, { floorId, panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['walls', floorId] });
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

export function useDeleteOpening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      floorId,
      panelId,
    }: {
      id: string;
      floorId: string;
      panelId: string;
    }) => {
      const res = await fetch(`/api/openings/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete opening');
      }
      return res.json();
    },
    onSuccess: (_, { floorId, panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['walls', floorId] });
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}
