'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PanelWithRelations, Breaker, Device } from '@/types/panel'
import {
  Zap,
  Home,
  Plug,
  Lightbulb,
  Fan,
  Thermometer,
  Car,
  Waves,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Flame,
  Wind,
  Monitor,
  Refrigerator,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CircuitViewProps {
  panel: PanelWithRelations
  onBreakerClick?: (breaker: Breaker) => void
  onDeviceClick?: (device: Device, roomId: string) => void
  onAddDevice?: (breakerId: string) => void
}

// Get icon for device type
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
    case 'smoke_detector':
      return Monitor
    default:
      return Plug
  }
}

// Get color for circuit type
function getCircuitColor(circuitType: string) {
  switch (circuitType) {
    case 'lighting':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    case 'kitchen':
      return 'bg-orange-100 border-orange-300 text-orange-800'
    case 'bathroom':
      return 'bg-blue-100 border-blue-300 text-blue-800'
    case 'hvac':
      return 'bg-cyan-100 border-cyan-300 text-cyan-800'
    case 'dryer':
    case 'range':
      return 'bg-red-100 border-red-300 text-red-800'
    case 'ev_charger':
      return 'bg-green-100 border-green-300 text-green-800'
    case 'outdoor':
      return 'bg-emerald-100 border-emerald-300 text-emerald-800'
    case 'garage':
      return 'bg-slate-100 border-slate-300 text-slate-800'
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800'
  }
}

// Count devices by type
function countDevicesByType(devices: Device[]): Map<string, number> {
  const counts = new Map<string, number>()
  devices.forEach((d) => {
    counts.set(d.type, (counts.get(d.type) || 0) + 1)
  })
  return counts
}

interface BreakerWithDevices {
  breaker: Breaker
  devicesByRoom: Map<string, { room: { id: string; name: string; floorName: string }; devices: Device[] }>
  allDevices: Device[]
  totalDevices: number
  totalWattage: number
}

export function CircuitView({ panel, onBreakerClick, onDeviceClick, onAddDevice }: CircuitViewProps) {
  const [expandedBreakers, setExpandedBreakers] = useState<Set<string>>(new Set())

  // Build a map of breaker -> devices grouped by room
  const breakerData: BreakerWithDevices[] = panel.breakers.map((breaker) => {
    const devicesByRoom = new Map<string, { room: { id: string; name: string; floorName: string }; devices: Device[] }>()
    const allDevices: Device[] = []
    let totalDevices = 0
    let totalWattage = 0

    panel.floors.forEach((floor) => {
      floor.rooms.forEach((room) => {
        const roomDevices = room.devices.filter((d) => d.breakerId === breaker.id)
        if (roomDevices.length > 0) {
          devicesByRoom.set(room.id, {
            room: { id: room.id, name: room.name, floorName: floor.name },
            devices: roomDevices,
          })
          allDevices.push(...roomDevices)
          totalDevices += roomDevices.length
          totalWattage += roomDevices.reduce((sum, d) => sum + (d.estimatedWattage || 0), 0)
        }
      })
    })

    return { breaker, devicesByRoom, allDevices, totalDevices, totalWattage }
  })

  // Sort by position
  breakerData.sort((a, b) => {
    const posA = parseInt(a.breaker.position.split('-')[0])
    const posB = parseInt(b.breaker.position.split('-')[0])
    return posA - posB
  })

  const toggleBreaker = (breakerId: string) => {
    const newExpanded = new Set(expandedBreakers)
    if (newExpanded.has(breakerId)) {
      newExpanded.delete(breakerId)
    } else {
      newExpanded.add(breakerId)
    }
    setExpandedBreakers(newExpanded)
  }

  return (
    <div className="space-y-3">
      {breakerData.map(({ breaker, devicesByRoom, allDevices, totalDevices, totalWattage }) => {
        const isExpanded = expandedBreakers.has(breaker.id)
        const hasDevices = totalDevices > 0
        const colorClass = getCircuitColor(breaker.circuitType)
        const deviceTypeCounts = countDevicesByType(allDevices)

        return (
          <Card
            key={breaker.id}
            className="overflow-hidden transition-all"
          >
            {/* Breaker Header - Always clickable */}
            <div
              className={cn(
                'flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                colorClass.split(' ')[0]
              )}
              onClick={() => toggleBreaker(breaker.id)}
            >
              {/* Expand/Collapse Icon */}
              <div className="w-5">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </div>

              {/* Breaker Icon */}
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-lg border-2',
                  colorClass
                )}
              >
                <Zap className="h-6 w-6" />
              </div>

              {/* Breaker Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold">#{breaker.position}</span>
                  <span className="font-medium truncate">{breaker.label}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{breaker.amperage}A</span>
                  <span>•</span>
                  <span className="capitalize">{breaker.circuitType.replace('_', ' ')}</span>
                  {breaker.protectionType !== 'standard' && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {breaker.protectionType.toUpperCase()}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Device Summary Icons */}
              {hasDevices && (
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from(deviceTypeCounts.entries()).slice(0, 4).map(([type, count]) => {
                    const Icon = getDeviceIcon(type)
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/50 text-xs"
                        title={`${count} ${type}${count > 1 ? 's' : ''}`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Stats */}
              <div className="text-right min-w-[80px]">
                <div className="font-semibold">
                  {totalDevices} device{totalDevices !== 1 ? 's' : ''}
                </div>
                {totalWattage > 0 && (
                  <div className="text-sm text-muted-foreground">
                    ~{totalWattage >= 1000 ? `${(totalWattage / 1000).toFixed(1)}kW` : `${totalWattage}W`}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddDevice?.(breaker.id)
                  }}
                  title="Add device to this breaker"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onBreakerClick?.(breaker)
                  }}
                  title="Edit breaker"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <CardContent className="pt-0 pb-4 px-4 bg-gray-50/50">
                {hasDevices ? (
                  <div className="ml-5 pl-4 border-l-2 border-dashed border-gray-300 space-y-3 pt-3">
                    {Array.from(devicesByRoom.entries()).map(([roomId, { room, devices }]) => (
                      <div key={roomId} className="relative">
                        {/* Connection line */}
                        <div className="absolute -left-4 top-4 w-4 border-t-2 border-dashed border-gray-300" />

                        <Card className="bg-white shadow-sm">
                          <CardHeader className="py-2 px-3 border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{room.name}</span>
                                <span className="text-muted-foreground">({room.floorName})</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {devices.length} device{devices.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2 px-3">
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {devices.map((device) => {
                                const DeviceIcon = getDeviceIcon(device.type)
                                return (
                                  <div
                                    key={device.id}
                                    className="flex items-center gap-2 p-2 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                                    onClick={() => onDeviceClick?.(device, roomId)}
                                  >
                                    <div className={cn(
                                      'flex items-center justify-center w-8 h-8 rounded',
                                      colorClass.split(' ')[0]
                                    )}>
                                      <DeviceIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">
                                        {device.description}
                                      </div>
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <Badge variant="secondary" className="text-xs h-4 px-1">
                                          {device.type}
                                        </Badge>
                                        {device.subtype && (
                                          <Badge variant="outline" className="text-xs h-4 px-1">
                                            {device.subtype}
                                          </Badge>
                                        )}
                                        {device.isGfciProtected && (
                                          <Badge variant="outline" className="text-xs h-4 px-1 text-green-600 border-green-300">
                                            GFCI
                                          </Badge>
                                        )}
                                        {device.estimatedWattage && device.estimatedWattage > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            {device.estimatedWattage}W
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}

                    {/* Add Device Button at bottom */}
                    <div className="relative">
                      <div className="absolute -left-4 top-4 w-4 border-t-2 border-dashed border-gray-300" />
                      <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={() => onAddDevice?.(breaker.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Device to This Breaker
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <Plug className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">
                      No devices connected to this breaker yet
                    </p>
                    <Button onClick={() => onAddDevice?.(breaker.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Device
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}

      {breakerData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No breakers yet</h3>
            <p className="text-muted-foreground">
              Add breakers to your panel to see the circuit visualization
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
