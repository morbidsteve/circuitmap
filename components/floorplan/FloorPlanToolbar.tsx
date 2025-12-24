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
  Minus,
  Square,
  DoorOpen,
  SquareSlash,
  Ruler,
  Eraser,
  Upload,
  Box,
  Layers,
  PanelRight,
} from 'lucide-react'
import type { ViewMode } from '@/types/floorplan'
import { cn } from '@/lib/utils'

interface FloorPlanToolbarProps {
  floors: FloorWithRooms[]
  breakers: Breaker[]
  onSave: () => void
  onUploadImage?: () => void
  isSaving?: boolean
}

export function FloorPlanToolbar({ floors, breakers, onSave, onUploadImage, isSaving }: FloorPlanToolbarProps) {
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
    showDimensions,
    setShowDimensions,
    activeTool,
    setActiveTool,
    highlightedBreakerId,
    setHighlightedBreaker,
    hasUnsavedChanges,
    discardChanges,
    wallDrawingState,
    cancelWallDrawing,
    viewMode,
    setViewMode,
    threeDSettings,
    setThreeDSettings,
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

  // Get floor color based on level
  const getFloorColor = (level: number) => {
    const colors = [
      { bg: 'bg-slate-500', text: 'text-white', name: 'Basement' },     // -1 or 0
      { bg: 'bg-emerald-500', text: 'text-white', name: '1st Floor' },  // 1
      { bg: 'bg-blue-500', text: 'text-white', name: '2nd Floor' },     // 2
      { bg: 'bg-purple-500', text: 'text-white', name: '3rd Floor' },   // 3
      { bg: 'bg-orange-500', text: 'text-white', name: '4th Floor' },   // 4+
    ]
    if (level <= 0) return colors[0]
    if (level >= colors.length) return colors[colors.length - 1]
    return colors[level]
  }

  const selectedFloor = floors.find(f => f.id === selectedFloorId)
  const floorColor = selectedFloor ? getFloorColor(selectedFloor.level) : null

  return (
    <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg flex-wrap">
      {/* View Mode Switcher */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Button
          variant={viewMode === '2d' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('2d')}
          title="2D Plan View"
          className="h-7 px-2"
        >
          <Layers className="h-3.5 w-3.5 mr-1" />
          2D
        </Button>
        <Button
          variant={viewMode === '3d' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('3d')}
          title="3D View"
          className="h-7 px-2"
        >
          <Box className="h-3.5 w-3.5 mr-1" />
          3D
        </Button>
        <Button
          variant={viewMode === 'elevation' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('elevation')}
          title="Elevation View"
          className="h-7 px-2"
        >
          <PanelRight className="h-3.5 w-3.5 mr-1" />
          Elev
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Floor Selector with color indicator */}
      <div className="flex items-center gap-2">
        {floorColor && (
          <div className={cn(
            'w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm',
            floorColor.bg,
            floorColor.text
          )}>
            {selectedFloor?.level ?? '?'}
          </div>
        )}
        <Select
          value={selectedFloorId ?? ''}
          onValueChange={(value) => setSelectedFloorId(value || null)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select floor..." />
          </SelectTrigger>
          <SelectContent>
            {floors.sort((a, b) => b.level - a.level).map((floor) => {
              const color = getFloorColor(floor.level)
              return (
                <SelectItem key={floor.id} value={floor.id}>
                  <div className="flex items-center gap-2">
                    <div className={cn('w-4 h-4 rounded', color.bg)} />
                    <span>{floor.name}</span>
                    <span className="text-muted-foreground text-xs">(L{floor.level})</span>
                  </div>
                </SelectItem>
              )
            })}
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
          title="Select tool (V)"
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'pan' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('pan')}
          title="Pan tool (Space)"
        >
          <Hand className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Wall drawing tools */}
        <Button
          variant={activeTool === 'wall' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('wall')}
          title="Wall tool (W) - Click to start, click again to finish segment"
          className={cn(activeTool === 'wall' && wallDrawingState.isDrawing && 'ring-2 ring-blue-500')}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'door' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('door')}
          title="Door tool (D) - Click on wall to add door"
        >
          <DoorOpen className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'window' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('window')}
          title="Window tool - Click on wall to add window"
        >
          <SquareSlash className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'eraser' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool('eraser')}
          title="Eraser tool (E) - Click to delete walls/openings"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      {/* Wall drawing status indicator */}
      {activeTool === 'wall' && wallDrawingState.isDrawing && (
        <Badge variant="outline" className="text-blue-600 border-blue-300">
          Drawing wall... (Esc to cancel)
        </Badge>
      )}

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
          variant={showDimensions ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowDimensions(!showDimensions)}
          title="Toggle dimension labels"
        >
          <Ruler className="h-4 w-4 mr-1" />
          Dims
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
        {onUploadImage && viewMode === '2d' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUploadImage}
            title="Upload floor plan image to trace"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        )}
      </div>

      {/* 3D View Options - only show in 3D mode */}
      {viewMode === '3d' && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <Button
              variant={threeDSettings.showAllFloors ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setThreeDSettings({ showAllFloors: !threeDSettings.showAllFloors })}
              title="Show all floors stacked"
            >
              <Layers className="h-4 w-4 mr-1" />
              All Floors
            </Button>
            <Button
              variant={threeDSettings.showWireRouting ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setThreeDSettings({ showWireRouting: !threeDSettings.showWireRouting })}
              title="Show wire routing"
            >
              <Network className="h-4 w-4 mr-1" />
              Wires
            </Button>
          </div>
        </>
      )}

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
