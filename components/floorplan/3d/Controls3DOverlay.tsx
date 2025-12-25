'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  RotateCcw,
  Move3d,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  Eye,
  Compass,
  Box,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useFloorPlanStore } from '@/stores/floorPlanStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Controls3DOverlayProps {
  onResetView: () => void;
  onMoveCamera: (direction: 'forward' | 'back' | 'left' | 'right' | 'up' | 'down') => void;
  onZoom: (direction: 'in' | 'out') => void;
  cameraPosition?: { x: number; y: number; z: number };
}

export function Controls3DOverlay({
  onResetView,
  onMoveCamera,
  onZoom,
  cameraPosition,
}: Controls3DOverlayProps) {
  const { threeDSettings, setThreeDSettings, setCameraPreset } = useFloorPlanStore();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <TooltipProvider>
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left: View presets */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-muted-foreground px-1 mb-1">Camera View</div>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={threeDSettings.cameraPreset === 'isometric' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setCameraPreset('isometric')}
                    >
                      <Box className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Isometric View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={threeDSettings.cameraPreset === 'top' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setCameraPreset('top')}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Top View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={threeDSettings.cameraPreset === 'front' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setCameraPreset('front')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Front View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={threeDSettings.cameraPreset === 'side' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setCameraPreset('side')}
                    >
                      <Move3d className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Side View</TooltipContent>
                </Tooltip>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full justify-start text-xs"
                onClick={onResetView}
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                Reset View
              </Button>
            </div>
          </Card>
        </div>

        {/* Top-right: Settings */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-muted-foreground px-1">Display</div>
              <div className="flex items-center gap-2 px-1">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">All Floors</span>
                <input
                  type="checkbox"
                  checked={threeDSettings.showAllFloors}
                  onChange={(e) => setThreeDSettings({ showAllFloors: e.target.checked })}
                  className="ml-auto"
                />
              </div>
              <div className="px-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Ceiling Height</span>
                  <span className="text-xs font-medium">{threeDSettings.ceilingHeight} ft</span>
                </div>
                <Slider
                  value={[threeDSettings.ceilingHeight]}
                  min={7}
                  max={15}
                  step={0.5}
                  onValueChange={(value: number[]) => setThreeDSettings({ ceilingHeight: value[0] })}
                  className="w-24"
                />
              </div>
              <div className="px-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Floor Spacing</span>
                  <span className="text-xs font-medium">{threeDSettings.floorSpacing} ft</span>
                </div>
                <Slider
                  value={[threeDSettings.floorSpacing]}
                  min={0}
                  max={10}
                  step={0.5}
                  onValueChange={(value: number[]) => setThreeDSettings({ floorSpacing: value[0] })}
                  className="w-24"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom-left: Movement controls */}
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-muted-foreground px-1 mb-1">Move Camera</div>
              {/* Vertical movement */}
              <div className="flex justify-center gap-1 mb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMoveCamera('up')}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Move Up (E)</TooltipContent>
                </Tooltip>
              </div>
              {/* Horizontal movement */}
              <div className="flex justify-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMoveCamera('left')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Move Left (A)</TooltipContent>
                </Tooltip>
                <div className="flex flex-col gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMoveCamera('forward')}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Move Forward (W)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMoveCamera('back')}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Move Back (S)</TooltipContent>
                  </Tooltip>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMoveCamera('right')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Move Right (D)</TooltipContent>
                </Tooltip>
              </div>
              {/* Down button */}
              <div className="flex justify-center gap-1 mt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMoveCamera('down')}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Move Down (Q)</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom-center: Zoom controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onZoom('out')}>
                    <Minimize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out (Scroll)</TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">Zoom</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onZoom('in')}>
                    <Maximize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In (Scroll)</TooltipContent>
              </Tooltip>
            </div>
          </Card>
        </div>

        {/* Bottom-right: Help and camera info */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <Popover open={showHelp} onOpenChange={setShowHelp}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-full justify-start">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  <span className="text-xs">Controls Help</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" side="top" align="end">
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Keyboard Controls</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-muted-foreground">W/S</span>
                    <span>Forward/Back</span>
                    <span className="text-muted-foreground">A/D</span>
                    <span>Left/Right</span>
                    <span className="text-muted-foreground">Q/E</span>
                    <span>Down/Up</span>
                    <span className="text-muted-foreground">Arrows</span>
                    <span>Rotate View</span>
                  </div>
                  <div className="font-medium pt-2">Mouse Controls</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-muted-foreground">Left drag</span>
                    <span>Rotate</span>
                    <span className="text-muted-foreground">Right drag</span>
                    <span>Pan</span>
                    <span className="text-muted-foreground">Scroll</span>
                    <span>Zoom</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {cameraPosition && (
              <div className="text-xs text-muted-foreground px-2 pt-1 border-t mt-1">
                <div className="font-mono">
                  X: {cameraPosition.x.toFixed(1)} Y: {cameraPosition.y.toFixed(1)} Z: {cameraPosition.z.toFixed(1)}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Center: Compass/Orientation indicator */}
        <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
          <div className="relative w-16 h-16">
            <Compass className="w-full h-full text-muted-foreground/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[10px] font-bold text-primary">N</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="text-xs font-medium text-muted-foreground mb-2">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span>Outlets</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span>Lights</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span>Switches</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400" />
                <span>Appliances</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <span>HVAC</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default Controls3DOverlay;
