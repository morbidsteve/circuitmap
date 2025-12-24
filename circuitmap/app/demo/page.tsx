'use client';

import { useEffect, useState, useCallback } from 'react';
import { PanelView } from '@/components/panel/PanelView';
import { BreakerForm } from '@/components/forms/BreakerForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PanelWithRelations, Device, Breaker } from '@/types/panel';
import { Edit, Trash2, MoreVertical, Plus, Map, LogIn } from 'lucide-react';
import Link from 'next/link';

type ModalState =
  | { type: 'none' }
  | { type: 'createBreaker'; position?: string }
  | { type: 'editBreaker'; breaker: Breaker };

export default function DemoPage() {
  const [panel, setPanel] = useState<PanelWithRelations | null>(null);
  const [selectedBreakerId, setSelectedBreakerId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  const [isSaving, setIsSaving] = useState(false);

  const closeModal = () => setModalState({ type: 'none' });

  const fetchPanel = useCallback(async () => {
    try {
      console.log('Fetching panels...');
      const res = await fetch('/api/panels');
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Panels received:', data.length);
      if (data.length > 0) {
        setPanel(data[0]);
      } else {
        console.log('No panels in response');
      }
    } catch (err) {
      console.error('Error loading panel:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPanel();
  }, [fetchPanel]);

  const handleCreateBreaker = async (data: {
    panelId: string;
    position: string;
    amperage: number;
    poles: number;
    label: string;
    circuitType: string;
    protectionType: string;
  }) => {
    if (!panel) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/breakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchPanel();
        closeModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBreaker = async (data: {
    panelId: string;
    position: string;
    amperage: number;
    poles: number;
    label: string;
    circuitType: string;
    protectionType: string;
  }) => {
    if (!panel || modalState.type !== 'editBreaker') return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/breakers/${modalState.breaker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, panelId: panel.id }),
      });
      if (res.ok) {
        await fetchPanel();
        closeModal();
        setSelectedBreakerId(undefined);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBreaker = async (breakerId: string) => {
    if (!panel) return;
    try {
      const res = await fetch(`/api/breakers/${breakerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panelId: panel.id }),
      });
      if (res.ok) {
        await fetchPanel();
        setSelectedBreakerId(undefined);
      }
    } catch (err) {
      console.error('Error deleting breaker:', err);
    }
  };

  const handleBreakerMove = async (breakerId: string, newPosition: string) => {
    if (!panel) return;
    try {
      const res = await fetch(`/api/breakers/${breakerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panelId: panel.id, position: newPosition }),
      });
      if (res.ok) {
        await fetchPanel();
      }
    } catch (err) {
      console.error('Error moving breaker:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <div className="text-muted-foreground">Fetching panel data</div>
        </div>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">No Panel Found</div>
          <div className="text-muted-foreground">
            Please run the seed script to populate demo data
          </div>
          <code className="mt-4 block bg-gray-100 p-4 rounded">
            pnpm db:seed
          </code>
        </div>
      </div>
    );
  }

  const selectedBreaker = panel.breakers.find(b => b.id === selectedBreakerId);

  // Get all devices connected to selected breaker
  const connectedDevices: (Device & { roomName: string; floorName: string })[] = [];
  if (selectedBreaker) {
    panel.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        room.devices.forEach(device => {
          if (device.breakerId === selectedBreaker.id) {
            connectedDevices.push({
              ...device,
              roomName: room.name,
              floorName: floor.name,
            });
          }
        });
      });
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">CircuitMap Demo</h1>
            <p className="text-muted-foreground">
              Click breakers to view details • Click empty slots to add • Drag to reorder
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/panels/${panel.id}`}>
              <Button variant="outline">
                <Map className="h-4 w-4 mr-2" />
                Floor Plan
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel View */}
          <div className="lg:col-span-2">
            <PanelView
              breakers={panel.breakers}
              totalSlots={panel.totalSlots}
              mainAmperage={panel.mainAmperage}
              selectedBreakerId={selectedBreakerId}
              onBreakerClick={setSelectedBreakerId}
              onEmptySlotClick={(position) =>
                setModalState({ type: 'createBreaker', position })
              }
              onBreakerMove={handleBreakerMove}
            />
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {selectedBreaker ? 'Breaker Details' : 'Panel Info'}
                </CardTitle>
                {selectedBreaker && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          setModalState({ type: 'editBreaker', breaker: selectedBreaker })
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteBreaker(selectedBreaker.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent>
                {selectedBreaker ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Position
                      </div>
                      <div className="text-lg font-bold">
                        {selectedBreaker.position}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Label
                      </div>
                      <div className="text-lg">{selectedBreaker.label}</div>
                    </div>

                    <div className="flex gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Amperage
                        </div>
                        <div className="text-lg font-bold">
                          {selectedBreaker.amperage}A
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Poles
                        </div>
                        <div className="text-lg font-bold">
                          {selectedBreaker.poles}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge>{selectedBreaker.circuitType}</Badge>
                      <Badge variant="outline">
                        {selectedBreaker.protectionType}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        className="flex-1"
                        onClick={() =>
                          setModalState({ type: 'editBreaker', breaker: selectedBreaker })
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Breaker
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleDeleteBreaker(selectedBreaker.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-3">
                        Connected Devices ({connectedDevices.length})
                      </div>
                      {connectedDevices.length > 0 ? (
                        <div className="space-y-2">
                          {connectedDevices.map(device => (
                            <div
                              key={device.id}
                              className="p-3 bg-gray-50 rounded-md"
                            >
                              <div className="font-medium text-sm">
                                {device.description}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {device.floorName} • {device.roomName}
                              </div>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {device.type}
                                </Badge>
                                {device.isGfciProtected && (
                                  <Badge variant="outline" className="text-xs">
                                    GFCI
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No devices connected
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Panel Name
                      </div>
                      <div className="text-lg font-bold">{panel.name}</div>
                    </div>

                    {panel.address && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Address
                        </div>
                        <div className="text-sm">{panel.address}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Brand
                        </div>
                        <div className="text-sm capitalize">
                          {panel.brand.replace('_', ' ')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Main Amperage
                        </div>
                        <div className="text-sm">{panel.mainAmperage}A</div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Button
                        className="w-full mb-4"
                        onClick={() => setModalState({ type: 'createBreaker' })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Breaker
                      </Button>
                      <div className="text-sm font-medium mb-2">Statistics</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Total Slots
                          </span>
                          <span className="font-medium">{panel.totalSlots}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Installed Breakers
                          </span>
                          <span className="font-medium">
                            {panel.breakers.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Total Devices
                          </span>
                          <span className="font-medium">
                            {panel.floors.reduce(
                              (acc, floor) =>
                                acc +
                                floor.rooms.reduce(
                                  (acc2, room) => acc2 + room.devices.length,
                                  0
                                ),
                              0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Breaker Dialog */}
      <Dialog
        open={modalState.type === 'createBreaker'}
        onOpenChange={closeModal}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Breaker</DialogTitle>
            <DialogDescription>Create a new breaker in this panel.</DialogDescription>
          </DialogHeader>
          <BreakerForm
            panelId={panel.id}
            position={modalState.type === 'createBreaker' ? modalState.position : undefined}
            onSubmit={handleCreateBreaker}
            onCancel={closeModal}
            isLoading={isSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Breaker Dialog */}
      <Dialog open={modalState.type === 'editBreaker'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Breaker</DialogTitle>
            <DialogDescription>Update breaker information.</DialogDescription>
          </DialogHeader>
          {modalState.type === 'editBreaker' && (
            <BreakerForm
              breaker={modalState.breaker}
              panelId={panel.id}
              onSubmit={handleUpdateBreaker}
              onCancel={closeModal}
              isLoading={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
