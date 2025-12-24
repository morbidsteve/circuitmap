'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PanelWithRelations, Breaker, Device } from '@/types/panel'
import {
  Zap,
  Lightbulb,
  Plug,
  Fan,
  Thermometer,
  Car,
  Waves,
  Flame,
  Wind,
  Refrigerator,
  Plus,
  Edit,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreakerSummaryViewProps {
  panel: PanelWithRelations
  onBreakerEdit?: (breaker: Breaker) => void
  onDeviceEdit?: (device: Device, roomId: string) => void
  onAddDevice?: (breakerId: string) => void
}

function getDeviceIcon(type: string) {
  switch (type) {
    case 'light':
      return Lightbulb
    case 'outlet':
      return Plug
    case 'fan':
      return Fan
    case 'hvac':
      return Thermometer
    case 'ev_charger':
      return Car
    case 'pool':
      return Waves
    case 'range':
      return Flame
    case 'dryer':
      return Wind
    case 'appliance':
      return Refrigerator
    default:
      return Plug
  }
}

function getCircuitColor(circuitType: string) {
  switch (circuitType) {
    case 'lighting':
      return 'border-l-yellow-500'
    case 'kitchen':
      return 'border-l-orange-500'
    case 'bathroom':
      return 'border-l-blue-500'
    case 'hvac':
      return 'border-l-purple-500'
    case 'dryer':
    case 'range':
      return 'border-l-red-500'
    case 'ev_charger':
      return 'border-l-green-500'
    case 'outdoor':
      return 'border-l-emerald-500'
    case 'garage':
      return 'border-l-slate-500'
    default:
      return 'border-l-gray-500'
  }
}

export function BreakerSummaryView({
  panel,
  onBreakerEdit,
  onDeviceEdit,
  onAddDevice,
}: BreakerSummaryViewProps) {
  // Build breaker data with devices
  const breakerData = panel.breakers.map((breaker) => {
    const devices: (Device & { roomName: string; floorName: string; roomId: string })[] = []
    let totalWattage = 0

    panel.floors.forEach((floor) => {
      floor.rooms.forEach((room) => {
        room.devices
          .filter((d) => d.breakerId === breaker.id)
          .forEach((device) => {
            devices.push({
              ...device,
              roomName: room.name,
              floorName: floor.name,
              roomId: room.id,
            })
            totalWattage += device.estimatedWattage || 0
          })
      })
    })

    return { breaker, devices, totalWattage }
  })

  // Sort by position
  breakerData.sort((a, b) => {
    const posA = parseInt(a.breaker.position.split('-')[0])
    const posB = parseInt(b.breaker.position.split('-')[0])
    return posA - posB
  })

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <div className="col-span-1">#</div>
        <div className="col-span-2">Breaker</div>
        <div className="col-span-1 text-center">Amps</div>
        <div className="col-span-6">Connected Devices</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {breakerData.map(({ breaker, devices, totalWattage }) => {
        const colorClass = getCircuitColor(breaker.circuitType)

        return (
          <Card
            key={breaker.id}
            className={cn('border-l-4', colorClass)}
          >
            <div className="grid grid-cols-12 gap-2 p-4 items-start">
              {/* Position */}
              <div className="col-span-1">
                <span className="font-mono font-bold text-lg">{breaker.position}</span>
              </div>

              {/* Breaker Info */}
              <div className="col-span-2">
                <div className="font-medium">{breaker.label}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {breaker.circuitType}
                  </Badge>
                  {breaker.protectionType !== 'standard' && (
                    <Badge variant="outline" className="text-xs">
                      {breaker.protectionType.toUpperCase()}
                    </Badge>
                  )}
                </div>
                {breaker.poles > 1 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {breaker.poles}-pole (240V)
                  </div>
                )}
              </div>

              {/* Amperage */}
              <div className="col-span-1 text-center">
                <span className="text-xl font-bold">{breaker.amperage}</span>
                <span className="text-xs text-muted-foreground">A</span>
              </div>

              {/* Devices */}
              <div className="col-span-6">
                {devices.length > 0 ? (
                  <div className="space-y-1">
                    {devices.map((device) => {
                      const DeviceIcon = getDeviceIcon(device.type)
                      return (
                        <div
                          key={device.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer group"
                          onClick={() => onDeviceEdit?.(device, device.roomId)}
                        >
                          <DeviceIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium flex-1 truncate">
                            {device.description}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {device.roomName}
                          </span>
                          {device.estimatedWattage && device.estimatedWattage > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {device.estimatedWattage}W
                            </span>
                          )}
                          {device.isGfciProtected && (
                            <Badge variant="outline" className="text-xs h-4 px-1 text-green-600">
                              GFCI
                            </Badge>
                          )}
                          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                        </div>
                      )
                    })}
                    {totalWattage > 0 && (
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        Total: ~{totalWattage >= 1000 ? `${(totalWattage / 1000).toFixed(1)}kW` : `${totalWattage}W`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                    <Plug className="h-4 w-4" />
                    No devices mapped
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddDevice?.(breaker.id)}
                  title="Add device"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBreakerEdit?.(breaker)}
                  title="Edit breaker"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )
      })}

      {breakerData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No breakers yet</h3>
            <p className="text-muted-foreground">
              Add breakers to your panel to see them here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {breakerData.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex justify-around text-center">
              <div>
                <div className="text-2xl font-bold">{breakerData.length}</div>
                <div className="text-xs text-muted-foreground">Breakers</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {breakerData.reduce((sum, b) => sum + b.devices.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Devices Mapped</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {breakerData.filter((b) => b.devices.length === 0).length}
                </div>
                <div className="text-xs text-muted-foreground">Unmapped</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {(() => {
                    const total = breakerData.reduce((sum, b) => sum + b.totalWattage, 0)
                    return total >= 1000 ? `${(total / 1000).toFixed(1)}kW` : `${total}W`
                  })()}
                </div>
                <div className="text-xs text-muted-foreground">Total Load</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
