import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PanelWithRelations } from '@/types/panel';

// Fetch all panels
export function usePanels() {
  return useQuery<PanelWithRelations[]>({
    queryKey: ['panels'],
    queryFn: async () => {
      const res = await fetch('/api/panels');
      if (!res.ok) throw new Error('Failed to fetch panels');
      return res.json();
    },
  });
}

// Fetch single panel
export function usePanel(id: string | undefined) {
  return useQuery<PanelWithRelations>({
    queryKey: ['panels', id],
    queryFn: async () => {
      const res = await fetch(`/api/panels/${id}`);
      if (!res.ok) throw new Error('Failed to fetch panel');
      return res.json();
    },
    enabled: !!id,
  });
}

// Create panel
export function useCreatePanel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      address?: string;
      brand: string;
      mainAmperage: number;
      totalSlots?: number;
      columns?: number;
      notes?: string;
    }) => {
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create panel');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
    },
  });
}

// Update panel
export function useUpdatePanel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{
      name: string;
      address: string;
      brand: string;
      mainAmperage: number;
      totalSlots: number;
      columns: number;
      notes: string;
    }> }) => {
      const res = await fetch(`/api/panels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update panel');
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['panels', id] });
    },
  });
}

// Delete panel
export function useDeletePanel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/panels/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete panel');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
    },
  });
}
