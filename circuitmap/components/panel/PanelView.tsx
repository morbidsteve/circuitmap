'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { Breaker } from '@/types/panel';
import { BreakerSlot, DraggableBreakerSlot, DroppableSlot } from './BreakerSlot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PanelViewProps {
  breakers: Breaker[];
  totalSlots: number;
  mainAmperage?: number;
  selectedBreakerId?: string;
  onBreakerClick?: (breakerId: string) => void;
  onEmptySlotClick?: (position: string) => void;
  onBreakerMove?: (breakerId: string, newPosition: string) => void;
}

export function PanelView({
  breakers,
  totalSlots,
  mainAmperage,
  selectedBreakerId,
  onBreakerClick,
  onEmptySlotClick,
  onBreakerMove,
}: PanelViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  // Group breakers by their position (odd = left, even = right)
  // Use 'skip' to mark slots covered by multi-pole breakers above
  const leftBreakers: (Breaker | 'skip' | undefined)[] = [];
  const rightBreakers: (Breaker | 'skip' | undefined)[] = [];

  // Create a map of position to breaker for easy lookup
  const breakerMap = new Map<string, Breaker>();
  breakers.forEach((breaker) => {
    breakerMap.set(breaker.position, breaker);
  });

  // Build a set of all positions occupied by multi-pole breakers
  const occupiedPositions = new Set<number>();
  breakers.forEach((breaker) => {
    if (breaker.poles > 1 && breaker.position.includes('-')) {
      const [start, end] = breaker.position.split('-').map(Number);
      // Multi-pole breakers on same side span odd-odd or even-even positions
      // e.g., 1-3 covers positions 1 and 3, 2-4 covers 2 and 4
      for (let pos = start; pos <= end; pos += 2) {
        occupiedPositions.add(pos);
      }
    }
  });

  // Fill slots (assuming 2-column panel)
  const slotsPerSide = Math.ceil(totalSlots / 2);

  for (let i = 1; i <= slotsPerSide; i++) {
    const leftPos = i * 2 - 1;
    const rightPos = i * 2;

    // Check for breakers at this position
    let leftBreaker: Breaker | 'skip' | undefined = breakerMap.get(leftPos.toString());
    let rightBreaker: Breaker | 'skip' | undefined = breakerMap.get(rightPos.toString());

    // Check for range positions like "1-3" or "2-4" that START at this position
    if (!leftBreaker) {
      for (const [pos, breaker] of breakerMap.entries()) {
        if (pos.includes('-')) {
          const startPos = parseInt(pos.split('-')[0]);
          if (startPos === leftPos) {
            leftBreaker = breaker;
            break;
          }
        }
      }
    }

    if (!rightBreaker) {
      for (const [pos, breaker] of breakerMap.entries()) {
        if (pos.includes('-')) {
          const startPos = parseInt(pos.split('-')[0]);
          if (startPos === rightPos) {
            rightBreaker = breaker;
            break;
          }
        }
      }
    }

    // If this position is occupied by a multi-pole breaker from above, mark as skip
    if (!leftBreaker && occupiedPositions.has(leftPos)) {
      leftBreaker = 'skip';
    }
    if (!rightBreaker && occupiedPositions.has(rightPos)) {
      rightBreaker = 'skip';
    }

    leftBreakers.push(leftBreaker);
    rightBreakers.push(rightBreaker);
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !onBreakerMove) return;

    const breakerId = active.id as string;
    const targetPosition = over.id as string;

    // Only move if dropped on a different position
    const breaker = breakers.find(b => b.id === breakerId);
    if (breaker && breaker.position !== targetPosition) {
      onBreakerMove(breakerId, targetPosition);
    }
  };

  const activeBreaker = activeId ? breakers.find(b => b.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-b from-gray-700 to-gray-800 text-white pb-3">
        <CardTitle className="text-center text-lg">Electrical Panel</CardTitle>
        <div className="text-center text-sm text-gray-300">
          {mainAmperage && <span className="font-semibold">{mainAmperage}A Main</span>}
          {mainAmperage && ' • '}
          {totalSlots} Slots • {breakers.length} Breakers
        </div>
      </CardHeader>
      <CardContent className="p-4 bg-gray-800">
        {/* Main Breaker */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg px-6 py-3 border-2 border-gray-600 shadow-lg">
            <div className="text-center">
              <div className="text-xs text-gray-600 font-medium">MAIN</div>
              <div className="text-2xl font-bold text-gray-800">{mainAmperage || 200}A</div>
            </div>
          </div>
        </div>

        {/* Panel body */}
        <div className="bg-gradient-to-b from-gray-500 to-gray-600 rounded-lg p-4 shadow-inner">
          {/* Column headers */}
          <div className="flex justify-between mb-2 px-1">
            <div className="text-xs text-white/70 font-medium">ODD</div>
            <div className="text-xs text-white/70 font-medium">EVEN</div>
          </div>

          {/* Breakers grid with center bus bar */}
          <div className="flex gap-2">
            {/* Left column (odd positions) */}
            <div className="flex-1">
              {leftBreakers.map((breaker, index) => {
                const pos = (index * 2 + 1).toString();
                // Skip slots occupied by multi-pole breakers above
                if (breaker === 'skip') {
                  return null;
                }
                return (
                  <DroppableSlot key={`left-${index}`} id={pos}>
                    {breaker ? (
                      <DraggableBreakerSlot
                        breaker={breaker}
                        position={index * 2 + 1}
                        side="left"
                        isSelected={breaker.id === selectedBreakerId}
                        isDragging={activeId === breaker.id}
                        onClick={() => onBreakerClick?.(breaker.id)}
                      />
                    ) : (
                      <BreakerSlot
                        breaker={undefined}
                        position={index * 2 + 1}
                        side="left"
                        isSelected={false}
                        onClick={() => onEmptySlotClick?.(pos)}
                      />
                    )}
                  </DroppableSlot>
                );
              })}
            </div>

            {/* Center bus bars */}
            <div className="w-4 flex flex-col items-center">
              <div className="flex-1 w-2 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400 rounded-full shadow-inner" />
            </div>

            {/* Right column (even positions) */}
            <div className="flex-1">
              {rightBreakers.map((breaker, index) => {
                const pos = (index * 2 + 2).toString();
                // Skip slots occupied by multi-pole breakers above
                if (breaker === 'skip') {
                  return null;
                }
                return (
                  <DroppableSlot key={`right-${index}`} id={pos}>
                    {breaker ? (
                      <DraggableBreakerSlot
                        breaker={breaker}
                        position={index * 2 + 2}
                        side="right"
                        isSelected={breaker.id === selectedBreakerId}
                        isDragging={activeId === breaker.id}
                        onClick={() => onBreakerClick?.(breaker.id)}
                      />
                    ) : (
                      <BreakerSlot
                        breaker={undefined}
                        position={index * 2 + 2}
                        side="right"
                        isSelected={false}
                        onClick={() => onEmptySlotClick?.(pos)}
                      />
                    )}
                  </DroppableSlot>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-400">General</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-gray-400">Lighting</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span className="text-gray-400">Kitchen</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-gray-400">HVAC</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-400">Appliance</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 text-[8px] text-white flex items-center justify-center font-bold">G</div>
            <span className="text-gray-400">GFCI</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500 text-[8px] text-white flex items-center justify-center font-bold">A</div>
            <span className="text-gray-400">AFCI</span>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Drag overlay for visual feedback */}
    <DragOverlay>
      {activeBreaker ? (
        <div className="opacity-80">
          <BreakerSlot
            breaker={activeBreaker}
            position={parseInt(activeBreaker.position.split('-')[0]) || 0}
            side="left"
            isSelected={false}
          />
        </div>
      ) : null}
    </DragOverlay>
    </DndContext>
  );
}
