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
import { Panel } from '@/types/panel';

const PANEL_BRANDS = [
  { value: 'square_d', label: 'Square D' },
  { value: 'siemens', label: 'Siemens' },
  { value: 'eaton', label: 'Eaton' },
  { value: 'ge', label: 'GE' },
  { value: 'murray', label: 'Murray' },
  { value: 'other', label: 'Other' },
];

const AMPERAGE_OPTIONS = [100, 125, 150, 200, 225, 300, 400];

interface PanelFormProps {
  panel?: Panel;
  onSubmit: (data: {
    name: string;
    address?: string;
    brand: string;
    mainAmperage: number;
    totalSlots?: number;
    columns?: number;
    notes?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PanelForm({ panel, onSubmit, onCancel, isLoading }: PanelFormProps) {
  const [name, setName] = useState(panel?.name ?? '');
  const [address, setAddress] = useState(panel?.address ?? '');
  const [brand, setBrand] = useState(panel?.brand ?? 'square_d');
  const [mainAmperage, setMainAmperage] = useState(panel?.mainAmperage ?? 200);
  const [totalSlots, setTotalSlots] = useState(panel?.totalSlots ?? 40);
  const [columns, setColumns] = useState(panel?.columns ?? 2);
  const [notes, setNotes] = useState(panel?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      address: address || undefined,
      brand,
      mainAmperage,
      totalSlots,
      columns,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Panel Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Main Panel, Garage Subpanel"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., 123 Main St"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand *</Label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PANEL_BRANDS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mainAmperage">Main Amperage *</Label>
          <Select value={mainAmperage.toString()} onValueChange={(v) => setMainAmperage(parseInt(v))}>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalSlots">Total Slots</Label>
          <Input
            id="totalSlots"
            type="number"
            min={1}
            max={84}
            value={totalSlots}
            onChange={(e) => setTotalSlots(parseInt(e.target.value) || 40)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="columns">Columns</Label>
          <Select value={columns.toString()} onValueChange={(v) => setColumns(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Column</SelectItem>
              <SelectItem value="2">2 Columns</SelectItem>
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
          placeholder="Any additional notes about this panel..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name}>
          {isLoading ? 'Saving...' : panel ? 'Update Panel' : 'Create Panel'}
        </Button>
      </div>
    </form>
  );
}
