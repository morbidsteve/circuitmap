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
import { Device, Breaker, DevicePlacement } from '@/types/panel';

const PLACEMENT_OPTIONS: { value: DevicePlacement; label: string; description: string }[] = [
  { value: 'wall', label: 'Wall', description: 'Mounted on a wall (outlets, switches, sconces)' },
  { value: 'ceiling', label: 'Ceiling', description: 'Mounted on ceiling (lights, fans, smoke detectors)' },
  { value: 'floor', label: 'Floor', description: 'Floor level (floor outlets, baseboard heaters)' },
];

// Common heights in inches for quick selection
const COMMON_HEIGHTS = [
  { value: 12, label: '12" (Floor outlet)' },
  { value: 18, label: '18" (Standard outlet)' },
  { value: 48, label: '48" (Counter height)' },
  { value: 52, label: '52" (Switch height)' },
  { value: 84, label: '84" (7 ft - High switch)' },
  { value: 96, label: '96" (8 ft - Ceiling)' },
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

interface DeviceFormProps {
  device?: Device;
  roomId: string;
  panelId: string;
  breakers: Breaker[];
  onSubmit: (data: {
    roomId: string;
    panelId: string;
    breakerId?: string | null;
    type: string;
    subtype?: string;
    description: string;
    placement: DevicePlacement;
    heightFromFloor?: number;
    estimatedWattage?: number;
    isGfciProtected?: boolean;
    notes?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeviceForm({
  device,
  roomId,
  panelId,
  breakers,
  onSubmit,
  onCancel,
  isLoading,
}: DeviceFormProps) {
  const [type, setType] = useState(device?.type ?? 'outlet');
  const [subtype, setSubtype] = useState(device?.subtype ?? '');
  const [description, setDescription] = useState(device?.description ?? '');
  const [breakerId, setBreakerId] = useState(device?.breakerId ?? '__none__');
  const [placement, setPlacement] = useState<DevicePlacement>(device?.placement ?? 'wall');
  const [heightFromFloor, setHeightFromFloor] = useState<number | undefined>(device?.heightFromFloor ?? undefined);
  const [estimatedWattage, setEstimatedWattage] = useState(device?.estimatedWattage ?? undefined);
  const [isGfciProtected, setIsGfciProtected] = useState(device?.isGfciProtected ?? false);
  const [notes, setNotes] = useState(device?.notes ?? '');

  const currentType = DEVICE_TYPES.find((t) => t.value === type);
  const subtypes = currentType?.subtypes ?? [];

  // Auto-set default heights based on device type and placement
  const getDefaultHeight = (deviceType: string, devicePlacement: DevicePlacement): number | undefined => {
    if (devicePlacement === 'ceiling') return 96; // 8 ft ceiling
    if (devicePlacement === 'floor') return 6; // near floor
    // Wall placements
    switch (deviceType) {
      case 'outlet': return 18;
      case 'switch': return 48;
      case 'light': return 72; // sconce
      default: return 48;
    }
  };

  const handlePlacementChange = (newPlacement: DevicePlacement) => {
    setPlacement(newPlacement);
    // Set a sensible default height if none is set
    if (!heightFromFloor) {
      setHeightFromFloor(getDefaultHeight(type, newPlacement));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      roomId,
      panelId,
      breakerId: breakerId === '__none__' ? null : breakerId,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

        {subtypes.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subtype">Subtype</Label>
            <Select value={subtype} onValueChange={setSubtype}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {subtypes.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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

      {/* Placement and Height */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="placement">Placement</Label>
          <Select value={placement} onValueChange={(v) => handlePlacementChange(v as DevicePlacement)}>
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
          <p className="text-xs text-muted-foreground">
            {PLACEMENT_OPTIONS.find((o) => o.value === placement)?.description}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="heightFromFloor">Height from Floor (inches)</Label>
          <div className="flex gap-2">
            <Input
              id="heightFromFloor"
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Quick pick" />
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
        <Label htmlFor="breakerId">Connected Breaker</Label>
        <Select value={breakerId} onValueChange={setBreakerId}>
          <SelectTrigger>
            <SelectValue placeholder="Select breaker..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Not assigned</SelectItem>
            {breakers.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                #{b.position} - {b.label} ({b.amperage}A)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !description}>
          {isLoading ? 'Saving...' : device ? 'Update Device' : 'Create Device'}
        </Button>
      </div>
    </form>
  );
}
