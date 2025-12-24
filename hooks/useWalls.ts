import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WallWithOpenings, CreateWallInput, UpdateWallInput } from '@/types/floorplan';

export function useWalls(floorId: string | undefined) {
  return useQuery({
    queryKey: ['walls', floorId],
    queryFn: async (): Promise<WallWithOpenings[]> => {
      if (!floorId) return [];
      const res = await fetch(`/api/walls?floorId=${floorId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch walls');
      }
      return res.json();
    },
    enabled: !!floorId,
  });
}

export function useCreateWall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWallInput & { panelId: string }) => {
      const { panelId, ...wallData } = data;
      const res = await fetch('/api/walls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wallData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create wall');
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

export function useCreateManyWalls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { walls: CreateWallInput[]; panelId: string }) => {
      const { panelId, ...wallsData } = data;
      const res = await fetch('/api/walls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wallsData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create walls');
      }
      return res.json();
    },
    onSuccess: (_, { walls, panelId }) => {
      // Invalidate all affected floors
      const floorIds = [...new Set(walls.map((w) => w.floorId))];
      floorIds.forEach((floorId) => {
        queryClient.invalidateQueries({ queryKey: ['walls', floorId] });
      });
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

export function useUpdateWall() {
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
      data: UpdateWallInput;
    }) => {
      const res = await fetch(`/api/walls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update wall');
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

export function useDeleteWall() {
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
      const res = await fetch(`/api/walls/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete wall');
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
