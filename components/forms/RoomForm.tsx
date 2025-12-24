'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Room } from '@/types/panel';

interface RoomFormProps {
  room?: Room;
  floorId: string;
  panelId: string;
  onSubmit: (data: {
    floorId: string;
    panelId: string;
    name: string;
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoomForm({ room, floorId, panelId, onSubmit, onCancel, isLoading }: RoomFormProps) {
  const [name, setName] = useState(room?.name ?? '');
  const [width, setWidth] = useState(room?.width ?? undefined);
  const [height, setHeight] = useState(room?.height ?? undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      floorId,
      panelId,
      name,
      width,
      height,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Room Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Kitchen, Master Bedroom, Garage"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">Width (ft)</Label>
          <Input
            id="width"
            type="number"
            step="0.5"
            min={0}
            value={width ?? ''}
            onChange={(e) => setWidth(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Depth (ft)</Label>
          <Input
            id="height"
            type="number"
            step="0.5"
            min={0}
            value={height ?? ''}
            onChange={(e) => setHeight(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Optional"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Room dimensions are optional and used for floor plan visualization
      </p>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name}>
          {isLoading ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
        </Button>
      </div>
    </form>
  );
}
