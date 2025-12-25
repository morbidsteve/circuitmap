'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Box,
  Layers,
  HelpCircle,
  Settings,
  X,
} from 'lucide-react';
import { useFloorPlanStore } from '@/stores/floorPlanStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Controls3DOverlayProps {
  onResetView: () => void;
  onMoveCamera: (direction: 'forward' | 'back' | 'left' | 'right' | 'up' | 'down') => void;
  onZoom: (direction: 'in' | 'out') => void;
  cameraPosition?: { x: number; y: number; z: number };
}

// Touch-friendly button component with 44px minimum touch target
function TouchButton({
  children,
  onClick,
  variant = 'outline',
  active = false,
  className = '',
  tooltip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'outline' | 'default' | 'ghost';
  active?: boolean;
  className?: string;
  tooltip?: string;
}) {
  const button = (
    <Button
      variant={active ? 'default' : variant}
      className={`min-h-[44px] min-w-[44px] h-11 w-11 p-0 touch-manipulation ${className}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent className="hidden sm:block">{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

export function Controls3DOverlay({
  onResetView,
  onMoveCamera,
  onZoom,
  cameraPosition,
}: Controls3DOverlayProps) {
  const { threeDSettings, setThreeDSettings, setCameraPreset } = useFloorPlanStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Mobile: Floating action buttons */}
        <div className="sm:hidden absolute top-2 right-2 pointer-events-auto flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-background/90 backdrop-blur-sm"
            onClick={() => setShowControls(!showControls)}
          >
            {showControls ? <X className="h-5 w-5" /> : <Move3d className="h-5 w-5" />}
          </Button>
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-background/90 backdrop-blur-sm"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[60vh]">
              <SheetHeader>
                <SheetTitle>3D View Settings</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-6">
                {/* View presets */}
                <div>
                  <div className="text-sm font-medium mb-3">Camera View</div>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant={threeDSettings.cameraPreset === 'isometric' ? 'default' : 'outline'}
                      className="h-12 flex-col gap-1"
                      onClick={() => { setCameraPreset('isometric'); setShowSettings(false); }}
                    >
                      <Box className="h-5 w-5" />
                      <span className="text-xs">3D</span>
                    </Button>
                    <Button
                      variant={threeDSettings.cameraPreset === 'top' ? 'default' : 'outline'}
                      className="h-12 flex-col gap-1"
                      onClick={() => { setCameraPreset('top'); setShowSettings(false); }}
                    >
                      <ArrowDown className="h-5 w-5" />
                      <span className="text-xs">Top</span>
                    </Button>
                    <Button
                      variant={threeDSettings.cameraPreset === 'front' ? 'default' : 'outline'}
                      className="h-12 flex-col gap-1"
                      onClick={() => { setCameraPreset('front'); setShowSettings(false); }}
                    >
                      <Eye className="h-5 w-5" />
                      <span className="text-xs">Front</span>
                    </Button>
                    <Button
                      variant={threeDSettings.cameraPreset === 'side' ? 'default' : 'outline'}
                      className="h-12 flex-col gap-1"
                      onClick={() => { setCameraPreset('side'); setShowSettings(false); }}
                    >
                      <Move3d className="h-5 w-5" />
                      <span className="text-xs">Side</span>
                    </Button>
                  </div>
                </div>

                {/* Display options */}
                <div>
                  <div className="text-sm font-medium mb-3">Display Options</div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span>Show All Floors</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={threeDSettings.showAllFloors}
                      onChange={(e) => setThreeDSettings({ showAllFloors: e.target.checked })}
                      className="h-5 w-5"
                    />
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Ceiling Height</span>
                      <span className="text-sm font-medium">{threeDSettings.ceilingHeight} ft</span>
                    </div>
                    <Slider
                      value={[threeDSettings.ceilingHeight]}
                      min={7}
                      max={15}
                      step={0.5}
                      onValueChange={(value: number[]) => setThreeDSettings({ ceilingHeight: value[0] })}
                      className="touch-manipulation"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Floor Spacing</span>
                      <span className="text-sm font-medium">{threeDSettings.floorSpacing} ft</span>
                    </div>
                    <Slider
                      value={[threeDSettings.floorSpacing]}
                      min={0}
                      max={10}
                      step={0.5}
                      onValueChange={(value: number[]) => setThreeDSettings({ floorSpacing: value[0] })}
                      className="touch-manipulation"
                    />
                  </div>
                </div>

                {/* Reset button */}
                <Button variant="outline" className="w-full h-12" onClick={() => { onResetView(); setShowSettings(false); }}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset View
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile: Movement joystick (shown when controls visible) */}
        {showControls && (
          <div className="sm:hidden absolute bottom-4 left-4 pointer-events-auto">
            <Card className="p-3 bg-background/95 backdrop-blur-sm shadow-lg">
              <div className="flex flex-col items-center gap-1">
                {/* Up */}
                <TouchButton onClick={() => onMoveCamera('up')} tooltip="Move Up">
                  <ArrowUp className="h-5 w-5" />
                </TouchButton>
                {/* Forward */}
                <TouchButton onClick={() => onMoveCamera('forward')} tooltip="Forward">
                  <ChevronUp className="h-5 w-5" />
                </TouchButton>
                {/* Left, Back, Right */}
                <div className="flex gap-1">
                  <TouchButton onClick={() => onMoveCamera('left')} tooltip="Left">
                    <ChevronLeft className="h-5 w-5" />
                  </TouchButton>
                  <TouchButton onClick={() => onMoveCamera('back')} tooltip="Back">
                    <ChevronDown className="h-5 w-5" />
                  </TouchButton>
                  <TouchButton onClick={() => onMoveCamera('right')} tooltip="Right">
                    <ChevronRight className="h-5 w-5" />
                  </TouchButton>
                </div>
                {/* Down */}
                <TouchButton onClick={() => onMoveCamera('down')} tooltip="Move Down">
                  <ArrowDown className="h-5 w-5" />
                </TouchButton>
              </div>
            </Card>
          </div>
        )}

        {/* Mobile: Zoom controls */}
        {showControls && (
          <div className="sm:hidden absolute bottom-4 right-4 pointer-events-auto">
            <Card className="p-3 bg-background/95 backdrop-blur-sm shadow-lg">
              <div className="flex flex-col gap-2">
                <TouchButton onClick={() => onZoom('in')} tooltip="Zoom In">
                  <Maximize className="h-5 w-5" />
                </TouchButton>
                <TouchButton onClick={() => onZoom('out')} tooltip="Zoom Out">
                  <Minimize className="h-5 w-5" />
                </TouchButton>
              </div>
            </Card>
          </div>
        )}

        {/* Desktop: Top-left view presets */}
        <div className="hidden sm:block absolute top-4 left-4 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-muted-foreground px-1 mb-1">Camera View</div>
              <div className="flex gap-1">
                <TouchButton
                  active={threeDSettings.cameraPreset === 'isometric'}
                  onClick={() => setCameraPreset('isometric')}
                  tooltip="Isometric View"
                >
                  <Box className="h-5 w-5" />
                </TouchButton>
                <TouchButton
                  active={threeDSettings.cameraPreset === 'top'}
                  onClick={() => setCameraPreset('top')}
                  tooltip="Top View"
                >
                  <ArrowDown className="h-5 w-5" />
                </TouchButton>
                <TouchButton
                  active={threeDSettings.cameraPreset === 'front'}
                  onClick={() => setCameraPreset('front')}
                  tooltip="Front View"
                >
                  <Eye className="h-5 w-5" />
                </TouchButton>
                <TouchButton
                  active={threeDSettings.cameraPreset === 'side'}
                  onClick={() => setCameraPreset('side')}
                  tooltip="Side View"
                >
                  <Move3d className="h-5 w-5" />
                </TouchButton>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-start text-xs mt-1"
                onClick={onResetView}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset View
              </Button>
            </div>
          </Card>
        </div>

        {/* Desktop: Top-right settings */}
        <div className="hidden sm:block absolute top-4 right-4 pointer-events-auto">
          <Card className="p-3 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="text-xs font-medium text-muted-foreground">Display</div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">All Floors</span>
                <input
                  type="checkbox"
                  checked={threeDSettings.showAllFloors}
                  onChange={(e) => setThreeDSettings({ showAllFloors: e.target.checked })}
                  className="ml-auto h-4 w-4"
                />
              </div>
              <div>
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
                  className="w-28"
                />
              </div>
              <div>
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
                  className="w-28"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Desktop: Bottom-left movement controls */}
        <div className="hidden sm:block absolute bottom-4 left-4 pointer-events-auto">
          <Card className="p-3 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-muted-foreground px-1 mb-1">Move Camera</div>
              <div className="flex justify-center mb-1">
                <TouchButton onClick={() => onMoveCamera('up')} tooltip="Move Up (E)">
                  <ArrowUp className="h-5 w-5" />
                </TouchButton>
              </div>
              <div className="flex justify-center gap-1">
                <TouchButton onClick={() => onMoveCamera('left')} tooltip="Move Left (A)">
                  <ChevronLeft className="h-5 w-5" />
                </TouchButton>
                <div className="flex flex-col gap-1">
                  <TouchButton onClick={() => onMoveCamera('forward')} tooltip="Move Forward (W)">
                    <ChevronUp className="h-5 w-5" />
                  </TouchButton>
                  <TouchButton onClick={() => onMoveCamera('back')} tooltip="Move Back (S)">
                    <ChevronDown className="h-5 w-5" />
                  </TouchButton>
                </div>
                <TouchButton onClick={() => onMoveCamera('right')} tooltip="Move Right (D)">
                  <ChevronRight className="h-5 w-5" />
                </TouchButton>
              </div>
              <div className="flex justify-center mt-1">
                <TouchButton onClick={() => onMoveCamera('down')} tooltip="Move Down (Q)">
                  <ArrowDown className="h-5 w-5" />
                </TouchButton>
              </div>
            </div>
          </Card>
        </div>

        {/* Desktop: Bottom-center zoom controls */}
        <div className="hidden sm:block absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2">
              <TouchButton onClick={() => onZoom('out')} tooltip="Zoom Out">
                <Minimize className="h-5 w-5" />
              </TouchButton>
              <span className="text-xs text-muted-foreground px-1">Zoom</span>
              <TouchButton onClick={() => onZoom('in')} tooltip="Zoom In">
                <Maximize className="h-5 w-5" />
              </TouchButton>
            </div>
          </Card>
        </div>

        {/* Desktop: Bottom-right help */}
        <div className="hidden sm:block absolute bottom-4 right-4 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="space-y-2">
              <div className="text-xs font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span>Controls</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <span className="text-muted-foreground">WASD</span>
                <span>Move</span>
                <span className="text-muted-foreground">Q/E</span>
                <span>Up/Down</span>
                <span className="text-muted-foreground">Drag</span>
                <span>Rotate</span>
                <span className="text-muted-foreground">Scroll</span>
                <span>Zoom</span>
              </div>
              {cameraPosition && (
                <div className="text-xs text-muted-foreground pt-1 border-t font-mono">
                  X:{cameraPosition.x.toFixed(0)} Y:{cameraPosition.y.toFixed(0)} Z:{cameraPosition.z.toFixed(0)}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Desktop: Legend (hidden on mobile to save space) */}
        <div className="hidden lg:block absolute top-1/2 left-4 -translate-y-1/2 pointer-events-auto">
          <Card className="p-2 bg-background/90 backdrop-blur-sm shadow-lg">
            <div className="text-xs font-medium text-muted-foreground mb-2">Legend</div>
            <div className="space-y-1.5 text-xs">
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
