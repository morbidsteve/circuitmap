'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PanelWithRelations, Breaker, DevicePlacement } from '@/types/panel';

const PLACEMENT_OPTIONS: { value: DevicePlacement; label: string }[] = [
  { value: 'wall', label: 'Wall' },
  { value: 'ceiling', label: 'Ceiling' },
  { value: 'floor', label: 'Floor' },
];

const COMMON_HEIGHTS = [
  { value: 12, label: '12" (Floor)' },
  { value: 18, label: '18" (Outlet)' },
  { value: 48, label: '48" (Counter)' },
  { value: 52, label: '52" (Switch)' },
  { value: 96, label: '96" (Ceiling)' },
];

const DEVICE_TYPES = [
  { value: 'outlet', label: 'Outlet', subtypes: ['standard', 'gfci', 'usb', '20a', 'dedicated'] },
  { value: 'light', label: 'Light Fixture', subtypes: ['ceiling', 'recessed', 'chandelier', 'sconce', 'track', 'outdoor'] },
  { value: 'switch', label: 'Switch', subtypes: ['single', 'three-way', 'dimmer', 'smart', 'fan'] },
  { value: 'appliance', label: 'Appliance', subtypes: ['refrigerator', 'dishwasher', 'garbage_disposal', 'microwave', 'vent_hood'] },
  { value: 'hvac', label: 'HVAC', subtypes: ['ac_unit', 'furnace', 'heat_pump', 'mini_split', 'thermostat'] },
  { value: 'water_heater', label: 'Water Heater', subtypes: ['tank', 'tankless', 'heat_pump'] },
  { value: 'dryer', label: 'Dryer', subtypes: ['electric', 'gas'] },
  { value: 'range', label: 'Range/Oven', subtypes: ['electric', 'gas', 'induction'] },
  { value: 'ev_charger', label: 'EV Charger', subtypes: ['level1', 'level2'] },
  { value: 'pool', label: 'Pool/Spa', subtypes: ['pump', 'heater', 'lights'] },
  { value: 'smoke_detector', label: 'Smoke/CO Detector', subtypes: ['hardwired', 'battery'] },
  { value: 'fan', label: 'Fan', subtypes: ['ceiling', 'exhaust', 'whole_house'] },
  { value: 'other', label: 'Other', subtypes: [] },
];

interface DeviceFormWithRoomSelectProps {
  panel: PanelWithRelations;
  breakerId: string;
  onSubmit: (data: {
    roomId: string;
    panelId: string;
    breakerId: string;
    type: string;
    subtype?: string;
    description: string;
    placement?: DevicePlacement;
    heightFromFloor?: number;
    estimatedWattage?: number;
    isGfciProtected?: boolean;
    notes?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeviceFormWithRoomSelect({
  panel,
  breakerId,
  onSubmit,
  onCancel,
  isLoading,
}: DeviceFormWithRoomSelectProps) {
  const [roomId, setRoomId] = useState('');
  const [type, setType] = useState('outlet');
  const [subtype, setSubtype] = useState('');
  const [description, setDescription] = useState('');
  const [placement, setPlacement] = useState<DevicePlacement>('wall');
  const [heightFromFloor, setHeightFromFloor] = useState<number | undefined>(undefined);
  const [estimatedWattage, setEstimatedWattage] = useState<number | undefined>(undefined);
  const [isGfciProtected, setIsGfciProtected] = useState(false);
  const [notes, setNotes] = useState('');

  const currentType = DEVICE_TYPES.find((t) => t.value === type);
  const subtypes = currentType?.subtypes ?? [];

  // Get the breaker info
  const breaker = panel.breakers.find((b) => b.id === breakerId);

  // Build room options from floors
  const roomOptions: { id: string; name: string; floorName: string }[] = [];
  panel.floors.forEach((floor) => {
    floor.rooms.forEach((room) => {
      roomOptions.push({
        id: room.id,
        name: room.name,
        floorName: floor.name,
      });
    });
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    onSubmit({
      roomId,
      panelId: panel.id,
      breakerId,
      type,
      subtype: subtype || undefined,
      description,
      placement,
      heightFromFloor,
      estimatedWattage,
      isGfciProtected,
      notes: notes || undefined,
    });
  };

  const hasRooms = roomOptions.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Show which breaker this device will be added to */}
      {breaker && (
        <div className="p-3 bg-muted rounded-lg text-sm">
          <div className="font-medium">Adding to Breaker #{breaker.position}</div>
          <div className="text-muted-foreground">{breaker.label} ({breaker.amperage}A)</div>
        </div>
      )}

      {/* Room Selection */}
      <div className="space-y-2">
        <Label htmlFor="roomId">Room Location *</Label>
        {hasRooms ? (
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a room..." />
            </SelectTrigger>
            <SelectContent>
              {roomOptions.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} ({room.floorName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
            <p className="mb-2">No rooms available. Add floors and rooms first.</p>
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Go to Locations Tab
            </Button>
          </div>
        )}
      </div>

      {hasRooms && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Device Type *</Label>
              <Select value={type} onValueChange={(v) => { setType(v); setSubtype(''); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtype">Subtype</Label>
              <div className="flex gap-2">
                {subtypes.length > 0 ? (
                  <>
                    <Select value={subtypes.includes(subtype) ? subtype : '__custom__'} onValueChange={(v) => {
                      if (v === '__custom__') {
                        setSubtype('');
                      } else {
                        setSubtype(v);
                      }
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subtypes.map((st) => (
                          <SelectItem key={st} value={st}>
                            {st.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                    {!subtypes.includes(subtype) && (
                      <Input
                        placeholder="Custom"
                        value={subtype}
                        onChange={(e) => setSubtype(e.target.value)}
                        className="flex-1"
                      />
                    )}
                  </>
                ) : (
                  <Input
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value)}
                    placeholder="Optional"
                    className="flex-1"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Placement and Height */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placement">Placement</Label>
              <Select value={placement} onValueChange={(v) => setPlacement(v as DevicePlacement)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heightFromFloor">Height (inches)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={240}
                  value={heightFromFloor ?? ''}
                  onChange={(e) => setHeightFromFloor(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g., 48"
                  className="flex-1"
                />
                <Select
                  value={heightFromFloor?.toString() ?? ''}
                  onValueChange={(v) => setHeightFromFloor(v ? parseInt(v) : undefined)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Quick" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_HEIGHTS.map((h) => (
                      <SelectItem key={h.value} value={h.value.toString()}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Outlet behind TV, Kitchen ceiling light"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedWattage">Est. Wattage</Label>
              <Input
                id="estimatedWattage"
                type="number"
                min={0}
                value={estimatedWattage ?? ''}
                onChange={(e) => setEstimatedWattage(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isGfciProtected">GFCI Protected</Label>
              <Select
                value={isGfciProtected ? 'yes' : 'no'}
                onValueChange={(v) => setIsGfciProtected(v === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        {hasRooms && (
          <Button type="submit" disabled={isLoading || !roomId || !description}>
            {isLoading ? 'Adding...' : 'Add Device'}
          </Button>
        )}
      </div>
    </form>
  );
}
