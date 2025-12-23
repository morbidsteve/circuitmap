'use client';

import { useEffect, useState } from 'react';
import { PanelView } from '@/components/panel/PanelView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PanelWithRelations, Device } from '@/types/panel';

export default function DemoPage() {
  const [panel, setPanel] = useState<PanelWithRelations | null>(null);
  const [selectedBreakerId, setSelectedBreakerId] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/panels')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setPanel(data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading panel:', err);
        setLoading(false);
      });
  }, []);

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">CircuitMap Demo</h1>
          <p className="text-muted-foreground">
            Click on a breaker to see connected devices
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel View */}
          <div className="lg:col-span-2">
            <PanelView
              breakers={panel.breakers}
              totalSlots={panel.totalSlots}
              selectedBreakerId={selectedBreakerId}
              onBreakerClick={setSelectedBreakerId}
            />
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedBreaker ? 'Breaker Details' : 'Panel Info'}
                </CardTitle>
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
    </div>
  );
}
