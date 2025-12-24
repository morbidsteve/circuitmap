'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Breaker } from '@/types/panel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, GripVertical } from 'lucide-react';

interface BreakerSlotProps {
  breaker?: Breaker;
  position: number;
  side: 'left' | 'right';
  isSelected?: boolean;
  onClick?: () => void;
}

const getCircuitTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    general: 'bg-blue-500',
    lighting: 'bg-yellow-500',
    kitchen: 'bg-orange-500',
    bathroom: 'bg-cyan-500',
    appliance: 'bg-red-500',
    hvac: 'bg-purple-500',
    outdoor: 'bg-green-500',
    garage: 'bg-slate-500',
    dryer: 'bg-red-600',
    range: 'bg-red-700',
    ev_charger: 'bg-emerald-500',
    other: 'bg-gray-500',
  };
  return colors[type] || colors.other;
};

const getProtectionIcon = (type: string) => {
  switch (type) {
    case 'gfci':
      return 'G';
    case 'afci':
      return 'A';
    case 'dual':
    case 'dual_function':
      return 'D';
    default:
      return null;
  }
};

export function BreakerSlot({ breaker, position, side, isSelected, onClick }: BreakerSlotProps) {
  // Position number element - shown on the outside edge
  const positionNumber = (
    <div className={cn(
      "w-6 flex-shrink-0 text-center font-mono text-sm font-bold",
      "text-white/90"
    )}>
      {position}
    </div>
  );

  if (!breaker) {
    // Empty slot (knockout)
    return (
      <div className={cn(
        "h-12 mb-1 flex items-center",
        side === 'left' ? 'flex-row' : 'flex-row-reverse'
      )}>
        {positionNumber}
        <div
          className={cn(
            "flex-1 h-10 mx-1 rounded border-2 border-dashed border-gray-300/50 bg-gray-600/30",
            "flex items-center justify-center text-xs text-gray-300/70 cursor-pointer",
            "hover:border-gray-200 hover:bg-gray-500/40 hover:text-gray-200 transition-all",
            "group"
          )}
          onClick={onClick}
        >
          <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  }

  const protectionIcon = getProtectionIcon(breaker.protectionType);
  const circuitColor = getCircuitTypeColor(breaker.circuitType);
  const isDoubleOrTriple = breaker.poles > 1;

  return (
    <div
      className={cn(
        "mb-1 flex items-center transition-all cursor-pointer",
        isDoubleOrTriple && "h-24",
        !isDoubleOrTriple && "h-12",
        side === 'left' ? 'flex-row' : 'flex-row-reverse'
      )}
      onClick={onClick}
    >
      {/* Position number on outside */}
      <div className={cn(
        "w-6 flex-shrink-0 text-center font-mono text-sm font-bold",
        "text-white/90",
        isDoubleOrTriple && "flex flex-col"
      )}>
        {isDoubleOrTriple ? (
          <>
            <span>{position}</span>
            <span className="text-xs text-white/60">-</span>
            <span>{position + (breaker.poles - 1) * 2}</span>
          </>
        ) : (
          position
        )}
      </div>

      {/* Breaker body */}
      <div
        className={cn(
          "relative flex-1 mx-1 rounded shadow-md transition-all hover:shadow-lg",
          "border-2 flex items-center px-2 gap-2",
          isDoubleOrTriple ? "h-20" : "h-10",
          side === 'right' && 'flex-row-reverse',
          isSelected
            ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-gray-500 bg-primary/20'
            : 'border-gray-600 bg-gradient-to-b from-gray-200 to-gray-300',
          breaker.isOn
            ? 'from-gray-200 to-gray-300'
            : 'from-gray-400 to-gray-500 opacity-70'
        )}
      >
        {/* Circuit type color bar */}
        <div
          className={cn(
            "absolute top-0 w-1.5 h-full rounded-sm",
            side === 'left' ? 'left-0 rounded-l' : 'right-0 rounded-r',
            circuitColor
          )}
        />

        {/* Toggle indicator */}
        <div className={cn(
          "w-5 h-7 rounded-sm border border-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0",
          breaker.isOn ? "bg-gray-100 text-gray-700" : "bg-gray-700 text-gray-100",
          side === 'left' ? 'ml-1' : 'mr-1'
        )}>
          {breaker.isOn ? '|' : 'O'}
        </div>

        {/* Amperage */}
        <div className="flex items-baseline gap-0.5 flex-shrink-0">
          <span className="text-lg font-bold text-gray-800">{breaker.amperage}</span>
          <span className="text-xs text-gray-600">A</span>
        </div>

        {/* Label */}
        <div className={cn(
          "flex-1 min-w-0 text-xs",
          side === 'right' ? 'text-right' : 'text-left'
        )}>
          <div className="font-medium text-gray-800 truncate">{breaker.label}</div>
          {breaker.poles > 1 && (
            <div className="text-[10px] text-gray-500">{breaker.poles}-pole • 240V</div>
          )}
        </div>

        {/* Protection type badge */}
        {protectionIcon && (
          <div className={cn(
            "absolute -top-1",
            side === 'left' ? '-right-1' : '-left-1'
          )}>
            <Badge
              variant="secondary"
              className={cn(
                "h-5 w-5 p-0 flex items-center justify-center text-[9px] font-bold",
                protectionIcon === 'G' && 'bg-blue-500 text-white',
                protectionIcon === 'A' && 'bg-orange-500 text-white',
                protectionIcon === 'D' && 'bg-purple-500 text-white'
              )}
            >
              {protectionIcon}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable wrapper for breakers
interface DraggableBreakerSlotProps extends Omit<BreakerSlotProps, 'breaker'> {
  breaker: Breaker;
  isDragging?: boolean;
}

export function DraggableBreakerSlot({
  breaker,
  position,
  side,
  isSelected,
  isDragging,
  onClick,
}: DraggableBreakerSlotProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: breaker.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const protectionIcon = getProtectionIcon(breaker.protectionType);
  const circuitColor = getCircuitTypeColor(breaker.circuitType);
  const isDoubleOrTriple = breaker.poles > 1;

  // Position number element
  const positionNumber = (
    <div className={cn(
      "w-6 flex-shrink-0 text-center font-mono text-sm font-bold",
      "text-white/90",
      isDoubleOrTriple && "flex flex-col"
    )}>
      {isDoubleOrTriple ? (
        <>
          <span>{position}</span>
          <span className="text-xs text-white/60">-</span>
          <span>{position + (breaker.poles - 1) * 2}</span>
        </>
      ) : (
        position
      )}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-1 flex items-center transition-all cursor-pointer",
        isDoubleOrTriple && "h-24",
        !isDoubleOrTriple && "h-12",
        side === 'left' ? 'flex-row' : 'flex-row-reverse',
        isDragging && "opacity-50"
      )}
      onClick={onClick}
    >
      {positionNumber}

      {/* Breaker body with drag handle */}
      <div
        className={cn(
          "relative flex-1 mx-1 rounded shadow-md transition-all hover:shadow-lg",
          "border-2 flex items-center px-2 gap-2",
          isDoubleOrTriple ? "h-20" : "h-10",
          side === 'right' && 'flex-row-reverse',
          isSelected
            ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-gray-500 bg-primary/20'
            : 'border-gray-600 bg-gradient-to-b from-gray-200 to-gray-300',
          breaker.isOn
            ? 'from-gray-200 to-gray-300'
            : 'from-gray-400 to-gray-500 opacity-70'
        )}
      >
        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing",
            "text-gray-400 hover:text-gray-600",
            side === 'left' ? 'right-1' : 'left-1'
          )}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Circuit type color bar */}
        <div
          className={cn(
            "absolute top-0 w-1.5 h-full rounded-sm",
            side === 'left' ? 'left-0 rounded-l' : 'right-0 rounded-r',
            circuitColor
          )}
        />

        {/* Toggle indicator */}
        <div className={cn(
          "w-5 h-7 rounded-sm border border-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0",
          breaker.isOn ? "bg-gray-100 text-gray-700" : "bg-gray-700 text-gray-100",
          side === 'left' ? 'ml-1' : 'mr-1'
        )}>
          {breaker.isOn ? '|' : 'O'}
        </div>

        {/* Amperage */}
        <div className="flex items-baseline gap-0.5 flex-shrink-0">
          <span className="text-lg font-bold text-gray-800">{breaker.amperage}</span>
          <span className="text-xs text-gray-600">A</span>
        </div>

        {/* Label */}
        <div className={cn(
          "flex-1 min-w-0 text-xs",
          side === 'right' ? 'text-right' : 'text-left',
          side === 'left' ? 'pr-5' : 'pl-5' // Make room for drag handle
        )}>
          <div className="font-medium text-gray-800 truncate">{breaker.label}</div>
          {breaker.poles > 1 && (
            <div className="text-[10px] text-gray-500">{breaker.poles}-pole • 240V</div>
          )}
        </div>

        {/* Protection type badge */}
        {protectionIcon && (
          <div className={cn(
            "absolute -top-1",
            side === 'left' ? '-right-1' : '-left-1'
          )}>
            <Badge
              variant="secondary"
              className={cn(
                "h-5 w-5 p-0 flex items-center justify-center text-[9px] font-bold",
                protectionIcon === 'G' && 'bg-blue-500 text-white',
                protectionIcon === 'A' && 'bg-orange-500 text-white',
                protectionIcon === 'D' && 'bg-purple-500 text-white'
              )}
            >
              {protectionIcon}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// Droppable wrapper for slots
interface DroppableSlotProps {
  id: string;
  children: React.ReactNode;
}

export function DroppableSlot({ id, children }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors rounded",
        isOver && "bg-primary/20"
      )}
    >
      {children}
    </div>
  );
}
