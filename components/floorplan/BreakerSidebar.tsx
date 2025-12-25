'use client'

import { useState, useEffect, useRef } from 'react'
import { Breaker, Device, FloorWithRooms } from '@/types/panel'
import { useFloorPlanStore } from '@/stores/floorPlanStore'
import { getCircuitTypeColor, UNASSIGNED_COLOR } from '@/lib/breakerColors'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChevronRight,
  ChevronDown,
  Zap,
  PanelLeftClose,
  PanelLeft,
  AlertCircle,
  Plug,
  Lightbulb,
  Fan,
  Thermometer,
  Monitor,
  CircleDot,
} from 'lucide-react'

interface BreakerSidebarProps {
  breakers: Breaker[]
  floors: FloorWithRooms[]
  panelName?: string
  mainAmperage?: number
  isCollapsed: boolean
  onToggleCollapse: () => void
}

// Get all devices from all floors
function getAllDevices(floors: FloorWithRooms[]): Device[] {
  const devices: Device[] = []
  floors.forEach((floor) => {
    floor.rooms.forEach((room) => {
      room.devices.forEach((device) => {
        devices.push(device)
      })
    })
  })
  return devices
}

// Get device location info
function getDeviceLocation(device: Device, floors: FloorWithRooms[]): { floorName: string; roomName: string } | null {
  for (const floor of floors) {
    for (const room of floor.rooms) {
      if (room.devices.some((d) => d.id === device.id)) {
        return { floorName: floor.name, roomName: room.name }
      }
    }
  }
  return null
}

// Device type icon mapping
function DeviceIcon({ type, className }: { type: string; className?: string }) {
  const iconClass = cn('h-3 w-3', className)
  switch (type) {
    case 'outlet':
      return <Plug className={iconClass} />
    case 'light':
      return <Lightbulb className={iconClass} />
    case 'switch':
      return <CircleDot className={iconClass} />
    case 'fan':
      return <Fan className={iconClass} />
    case 'hvac':
    case 'water_heater':
      return <Thermometer className={iconClass} />
    case 'appliance':
    case 'range':
    case 'dryer':
      return <Monitor className={iconClass} />
    default:
      return <Plug className={iconClass} />
  }
}

interface BreakerItemProps {
  breaker: Breaker
  devices: Device[]
  floors: FloorWithRooms[]
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (hovered: boolean) => void
  onDeviceClick: (deviceId: string) => void
}

function BreakerItem({
  breaker,
  devices,
  floors,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onDeviceClick,
}: BreakerItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)
  const colors = getCircuitTypeColor(breaker.circuitType)
  const connectedDevices = devices.filter((d) => d.breakerId === breaker.id)

  // Auto-expand when selected
  useEffect(() => {
    if (isSelected && connectedDevices.length > 0) {
      setIsExpanded(true)
    }
  }, [isSelected, connectedDevices.length])

  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isSelected])

  return (
    <div ref={itemRef} className="mb-1">
      <div
        className={cn(
          'group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-all',
          'hover:bg-accent/50',
          isSelected && 'bg-accent ring-2 ring-primary',
          isHovered && !isSelected && 'bg-accent/30'
        )}
        onClick={onSelect}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      >
        {/* Color bar */}
        <div
          className="w-1 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: colors.fill }}
        />

        {/* Breaker info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-muted-foreground">#{breaker.position}</span>
            <span className="font-medium text-sm truncate">{breaker.label}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{breaker.amperage}A</span>
            <span className="capitalize">{breaker.circuitType.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Device count badge */}
        <Badge
          variant={connectedDevices.length > 0 ? 'secondary' : 'outline'}
          className={cn(
            'h-5 min-w-5 px-1.5 text-xs',
            connectedDevices.length === 0 && 'text-muted-foreground'
          )}
        >
          {connectedDevices.length}
        </Badge>

        {/* Expand/collapse toggle */}
        {connectedDevices.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Expanded device list */}
      {isExpanded && connectedDevices.length > 0 && (
        <div className="ml-4 pl-2 border-l-2 border-muted mt-1 space-y-0.5">
          {connectedDevices.map((device) => {
            const location = getDeviceLocation(device, floors)
            return (
              <div
                key={device.id}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer',
                  'hover:bg-accent/50 transition-colors'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onDeviceClick(device.id)
                }}
              >
                <DeviceIcon type={device.type} className="text-muted-foreground" />
                <span className="truncate flex-1">{device.description}</span>
                {location && (
                  <span className="text-muted-foreground text-[10px] truncate max-w-20">
                    {location.roomName}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function BreakerSidebar({
  breakers,
  floors,
  panelName = 'Electrical Panel',
  mainAmperage,
  isCollapsed,
  onToggleCollapse,
}: BreakerSidebarProps) {
  const [hoveredBreakerId, setHoveredBreakerId] = useState<string | null>(null)

  const {
    highlightedBreakerId,
    highlightBreaker,
    highlightCircuit,
    highlightDevice,
    clearHighlight,
  } = useFloorPlanStore()

  const allDevices = getAllDevices(floors)
  const unassignedDevices = allDevices.filter((d) => !d.breakerId)

  // Sort breakers by position
  const sortedBreakers = [...breakers].sort((a, b) => {
    const posA = parseInt(a.position.replace(/[^\d]/g, '')) || 0
    const posB = parseInt(b.position.replace(/[^\d]/g, '')) || 0
    return posA - posB
  })

  const handleBreakerSelect = (breakerId: string) => {
    if (highlightedBreakerId === breakerId) {
      // Deselect if already selected
      clearHighlight()
    } else {
      // Select and highlight all devices on this breaker
      const deviceIds = allDevices.filter((d) => d.breakerId === breakerId).map((d) => d.id)
      highlightCircuit(breakerId, deviceIds)
    }
  }

  const handleBreakerHover = (breakerId: string, hovered: boolean) => {
    if (hovered && !highlightedBreakerId) {
      setHoveredBreakerId(breakerId)
      highlightBreaker(breakerId)
    } else if (!hovered && !highlightedBreakerId) {
      setHoveredBreakerId(null)
      clearHighlight()
    }
  }

  const handleDeviceClick = (deviceId: string) => {
    const device = allDevices.find((d) => d.id === deviceId)
    if (device) {
      const siblingIds = allDevices
        .filter((d) => d.breakerId === device.breakerId && d.id !== deviceId)
        .map((d) => d.id)
      highlightDevice(deviceId, siblingIds, device.breakerId)
    }
  }

  // Collapsed state - just show toggle button
  if (isCollapsed) {
    return (
      <div className="w-10 flex-shrink-0 border-r bg-muted/30 flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleCollapse}
          title="Expand breaker panel"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="mt-2 writing-mode-vertical text-xs text-muted-foreground font-medium">
          Breakers
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 flex-shrink-0 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <div>
            <div className="font-medium text-sm">{panelName}</div>
            {mainAmperage && (
              <div className="text-xs text-muted-foreground">{mainAmperage}A Main</div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onToggleCollapse}
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Breaker list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Stats */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 text-xs text-muted-foreground">
            <span>{breakers.length} breakers</span>
            <span>{allDevices.length} devices</span>
          </div>

          {/* Breakers */}
          {sortedBreakers.map((breaker) => (
            <BreakerItem
              key={breaker.id}
              breaker={breaker}
              devices={allDevices}
              floors={floors}
              isSelected={highlightedBreakerId === breaker.id}
              isHovered={hoveredBreakerId === breaker.id}
              onSelect={() => handleBreakerSelect(breaker.id)}
              onHover={(hovered) => handleBreakerHover(breaker.id, hovered)}
              onDeviceClick={handleDeviceClick}
            />
          ))}

          {/* Unassigned devices section */}
          {unassignedDevices.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center gap-2 px-2 py-1.5 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Unassigned ({unassignedDevices.length})
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {unassignedDevices.map((device) => {
                  const location = getDeviceLocation(device, floors)
                  return (
                    <div
                      key={device.id}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer',
                        'hover:bg-accent/50 transition-colors',
                        'border border-dashed border-amber-300 bg-amber-50/50'
                      )}
                      onClick={() => handleDeviceClick(device.id)}
                    >
                      <DeviceIcon type={device.type} className="text-amber-600" />
                      <span className="truncate flex-1">{device.description}</span>
                      {location && (
                        <span className="text-muted-foreground text-[10px] truncate max-w-16">
                          {location.roomName}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-2 border-t text-[10px] text-muted-foreground text-center">
        Click breaker to see connected devices
      </div>
    </div>
  )
}
