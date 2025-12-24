import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  FloorPlanImage,
  CreateFloorPlanImageInput,
  UpdateFloorPlanImageInput,
} from '@/types/floorplan';

export function useFloorPlanImage(floorId: string | undefined) {
  return useQuery({
    queryKey: ['floorPlanImage', floorId],
    queryFn: async (): Promise<FloorPlanImage | null> => {
      if (!floorId) return null;
      const res = await fetch(`/api/floors/${floorId}/image`);
      if (!res.ok) {
        if (res.status === 404) return null;
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch floor plan image');
      }
      return res.json();
    },
    enabled: !!floorId,
  });
}

export function useCreateFloorPlanImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFloorPlanImageInput & { panelId: string }) => {
      const { panelId, floorId, ...imageData } = data;
      const res = await fetch(`/api/floors/${floorId}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create floor plan image');
      }
      return res.json();
    },
    onSuccess: (_, { floorId, panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['floorPlanImage', floorId] });
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

export function useUpdateFloorPlanImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      floorId,
      panelId,
      data,
    }: {
      floorId: string;
      panelId: string;
      data: UpdateFloorPlanImageInput;
    }) => {
      const res = await fetch(`/api/floors/${floorId}/image`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update floor plan image');
      }
      return res.json();
    },
    onSuccess: (_, { floorId, panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['floorPlanImage', floorId] });
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}

export function useDeleteFloorPlanImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      floorId,
      panelId,
    }: {
      floorId: string;
      panelId: string;
    }) => {
      const res = await fetch(`/api/floors/${floorId}/image`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete floor plan image');
      }
      return res.json();
    },
    onSuccess: (_, { floorId, panelId }) => {
      queryClient.invalidateQueries({ queryKey: ['floorPlanImage', floorId] });
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', panelId] });
    },
  });
}
