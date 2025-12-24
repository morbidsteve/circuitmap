'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Breaker } from '@/types/panel';

const AMPERAGE_OPTIONS = [15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 200];

const CIRCUIT_TYPES = [
  { value: 'general', label: 'General Purpose' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'dryer', label: 'Dryer' },
  { value: 'range', label: 'Range/Oven' },
  { value: 'water_heater', label: 'Water Heater' },
  { value: 'ev_charger', label: 'EV Charger' },
  { value: 'pool', label: 'Pool/Spa' },
  { value: 'garage', label: 'Garage' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'subpanel', label: 'Subpanel Feed' },
  { value: 'other', label: 'Other' },
];

const PROTECTION_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'gfci', label: 'GFCI' },
  { value: 'afci', label: 'AFCI' },
  { value: 'dual', label: 'Dual Function (GFCI+AFCI)' },
];

// Validate breaker position format
function validatePosition(pos: string): { valid: boolean; type: string; message: string } {
  const trimmed = pos.trim().toUpperCase();
  if (!trimmed) return { valid: false, type: '', message: '' };

  // Single position: "1", "2", "14"
  if (/^\d+$/.test(trimmed)) {
    return { valid: true, type: 'single', message: `Single-pole at position ${trimmed}` };
  }

  // Multi-pole range: "1-3", "2-4"
  if (/^\d+-\d+$/.test(trimmed)) {
    const [start, end] = trimmed.split('-').map(Number);
    const poles = Math.ceil((end - start + 1) / 2);
    if (poles >= 2 && poles <= 3) {
      return { valid: true, type: 'multi', message: `${poles}-pole breaker (240V)` };
    }
    return { valid: false, type: 'multi', message: 'Invalid range - use consecutive positions' };
  }

  // Combined tandem: "14A/14B"
  if (/^\d+[AB]\/\d+[AB]$/i.test(trimmed)) {
    return { valid: true, type: 'tandem', message: 'Tandem - creates 2 separate breakers' };
  }

  // Individual tandem: "14A" or "14B"
  if (/^\d+[AB]$/i.test(trimmed)) {
    return { valid: true, type: 'tandem-single', message: `Tandem half at ${trimmed}` };
  }

  return { valid: false, type: 'unknown', message: 'Invalid format' };
}

interface BreakerFormProps {
  breaker?: Breaker;
  panelId: string;
  position?: string;
  onSubmit: (data: {
    panelId: string;
    position: string;
    amperage: number;
    poles?: number;
    label: string;
    circuitType?: string;
    protectionType?: string;
    isOn?: boolean;
    notes?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BreakerForm({
  breaker,
  panelId,
  position: defaultPosition,
  onSubmit,
  onCancel,
  isLoading,
}: BreakerFormProps) {
  const [position, setPosition] = useState(breaker?.position ?? defaultPosition ?? '');
  const [amperage, setAmperage] = useState(breaker?.amperage ?? 20);
  const [poles, setPoles] = useState(breaker?.poles ?? 1);
  const [label, setLabel] = useState(breaker?.label ?? '');
  const [circuitType, setCircuitType] = useState(breaker?.circuitType ?? 'general');
  const [protectionType, setProtectionType] = useState(breaker?.protectionType ?? 'standard');
  const [isOn, setIsOn] = useState(breaker?.isOn ?? true);
  const [notes, setNotes] = useState(breaker?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      panelId,
      position,
      amperage,
      poles,
      label,
      circuitType,
      protectionType,
      isOn,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Position *</Label>
          <Input
            id="position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g., 1, 1-3, 14A/14B"
            required
            className={position && !validatePosition(position).valid ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {position ? (
            <p className={`text-xs ${validatePosition(position).valid ? 'text-green-600' : 'text-red-500'}`}>
              {validatePosition(position).valid ? '✓ ' : '✗ '}
              {validatePosition(position).message || 'Enter a valid position format'}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Single: 1 | Double-pole: 1-3 | Tandem: 14A/14B
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="poles">Poles</Label>
          <Select value={poles.toString()} onValueChange={(v) => setPoles(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Single Pole (120V)</SelectItem>
              <SelectItem value="2">Double Pole (240V)</SelectItem>
              <SelectItem value="3">Triple Pole</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Label *</Label>
        <Input
          id="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Kitchen Outlets, Master Bedroom"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amperage">Amperage *</Label>
          <Select value={amperage.toString()} onValueChange={(v) => setAmperage(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AMPERAGE_OPTIONS.map((a) => (
                <SelectItem key={a} value={a.toString()}>
                  {a}A
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="circuitType">Circuit Type</Label>
          <Select value={circuitType} onValueChange={setCircuitType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CIRCUIT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="protectionType">Protection Type</Label>
          <Select value={protectionType} onValueChange={setProtectionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROTECTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="isOn">Status</Label>
          <Select value={isOn ? 'on' : 'off'} onValueChange={(v) => setIsOn(v === 'on')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">On</SelectItem>
              <SelectItem value="off">Off</SelectItem>
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
        <Button type="submit" disabled={isLoading || !position || !label || (!!position && !validatePosition(position).valid)}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isLoading ? 'Saving...' : breaker ? 'Update Breaker' : 'Create Breaker'}
        </Button>
      </div>
    </form>
  );
}
