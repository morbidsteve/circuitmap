'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FloorWithRooms, Breaker } from '@/types/panel'
import { useFloorPlanStore } from '@/stores/floorPlanStore'
import { getCircuitTypeColor } from '@/lib/breakerColors'
import {
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Network,
  RotateCcw,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloorPlanToolbarProps {
  floors: FloorWithRooms[]
  breakers: Breaker[]
  onSave: () => void
  isSaving?: boolean
}

export function FloorPlanToolbar({ floors, breakers, onSave, isSaving }: FloorPlanToolbarProps) {
  const {
    selectedFloorId,
    setSelectedFloorId,
    zoom,
    setZoom,
    setPanOffset,
    snapToGrid,
    setSnapToGrid,
    showWires,
    setShowWires,
    activeTool,
    setActiveTool,
    highlightedBreakerId,
    setHighlightedBreaker,
    hasUnsavedChanges,
    discardChanges,
  } = useFloorPlanStore()

  // Sort breakers by position for the filter dropdown
  const sortedBreakers = [...breakers].sort((a, b) => {
    const posA = parseInt(a.position.split('-')[0]) || parseInt(a.position) || 0
    const posB = parseInt(b.position.split('-')[0]) || parseInt(b.position) || 0
    return posA - posB
  })

  const handleZoomIn = () => setZoom(zoom * 1.25)
  const handleZoomOut = () => setZoom(zoom / 1.25)
  const handleResetView = () => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }

  return (
    <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg flex-wrap">
      {/* Floor Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Floor:</span>
        <Select
          value={selectedFloorId ?? ''}
          onValueChange={(value) => setSelectedFloorId(value || null)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select floor..." />
          </SelectTrigger>
          <SelectContent>
            {floors.map((floor) => (
              <SelectItem key={floor.id} value={floor.id}>
                {floor.name} (Level {floor.level})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Tool Selection */}
      <div className="flex items-center gap-1">
        <Button
          variant={activeTool === 'select' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('select')}
          title="Select tool"
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'pan' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('pan')}
          title="Pan tool"
        >
          <Hand className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleResetView} title="Reset view">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Toggle Options */}
      <div className="flex items-center gap-2">
        <Button
          variant={snapToGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setSnapToGrid(!snapToGrid)}
          title="Toggle grid snap"
        >
          <Grid3X3 className="h-4 w-4 mr-1" />
          Grid
        </Button>
        <Button
          variant={showWires ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowWires(!showWires)}
          title="Toggle wire visualization"
        >
          <Network className="h-4 w-4 mr-1" />
          Wires
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Breaker Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        <Select
          value={highlightedBreakerId ?? 'all'}
          onValueChange={(value) => setHighlightedBreaker(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All breakers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All breakers</SelectItem>
            {sortedBreakers.map((breaker) => {
              const colors = getCircuitTypeColor(breaker.circuitType)
              return (
                <SelectItem key={breaker.id} value={breaker.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors.fill }}
                    />
                    <span>#{breaker.position}: {breaker.label}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save/Discard */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Unsaved changes</Badge>
          <Button variant="ghost" size="sm" onClick={discardChanges}>
            Discard
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  )
}
