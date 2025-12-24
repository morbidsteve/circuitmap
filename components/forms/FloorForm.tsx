'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Floor } from '@/types/panel';

interface FloorFormProps {
  floor?: Floor;
  panelId: string;
  onSubmit: (data: {
    panelId: string;
    name: string;
    level: number;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function FloorForm({ floor, panelId, onSubmit, onCancel, isLoading }: FloorFormProps) {
  const [name, setName] = useState(floor?.name ?? '');
  const [level, setLevel] = useState(floor?.level ?? 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      panelId,
      name,
      level,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Floor Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., First Floor, Basement, Attic"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="level">Level (for ordering)</Label>
        <Input
          id="level"
          type="number"
          value={level}
          onChange={(e) => setLevel(parseInt(e.target.value) || 0)}
        />
        <p className="text-xs text-muted-foreground">
          Use 0 for ground floor, negative for basement (-1, -2), positive for upper floors (1, 2, 3)
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name}>
          {isLoading ? 'Saving...' : floor ? 'Update Floor' : 'Create Floor'}
        </Button>
      </div>
    </form>
  );
}
