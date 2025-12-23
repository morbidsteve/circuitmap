'use client';

import { Breaker } from '@/types/panel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    appliance: 'bg-red-500',
    hvac: 'bg-purple-500',
    outdoor: 'bg-green-500',
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
    case 'dual_function':
      return 'D';
    default:
      return null;
  }
};

export function BreakerSlot({ breaker, position, side, isSelected, onClick }: BreakerSlotProps) {
  if (!breaker) {
    // Empty slot (knockout)
    return (
      <div className="h-12 mb-1 flex items-center justify-center">
        <div className={cn(
          "w-20 h-10 rounded border-2 border-dashed border-gray-300 bg-gray-50",
          "flex items-center justify-center text-xs text-gray-400",
          side === 'right' && 'ml-auto'
        )}>
          {position}
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
        !isDoubleOrTriple && "h-12"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "relative w-20 rounded shadow-md transition-all hover:shadow-lg",
          "border-2 flex items-center justify-between px-2",
          isDoubleOrTriple ? "h-20" : "h-10",
          side === 'right' && 'ml-auto flex-row-reverse',
          isSelected
            ? 'border-primary ring-2 ring-primary ring-offset-2 bg-primary/10'
            : 'border-gray-400 bg-gradient-to-b from-gray-200 to-gray-300',
          breaker.isOn
            ? 'from-gray-200 to-gray-300'
            : 'from-gray-400 to-gray-500 opacity-70'
        )}
      >
        {/* Circuit type color bar */}
        <div
          className={cn(
            "absolute top-0 left-0 w-1 h-full rounded-l",
            circuitColor
          )}
        />

        {/* Toggle indicator */}
        <div className={cn(
          "w-4 h-6 rounded-sm border border-gray-600 flex items-center justify-center text-[10px] font-bold",
          breaker.isOn ? "bg-gray-100 text-gray-700" : "bg-gray-700 text-gray-100"
        )}>
          {breaker.isOn ? '|' : '○'}
        </div>

        {/* Amperage */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-gray-800">{breaker.amperage}</span>
          <span className="text-[10px] text-gray-600">A</span>
        </div>

        {/* Protection type badge */}
        {protectionIcon && (
          <div className="absolute top-0 right-0 -mt-1 -mr-1">
            <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">
              {protectionIcon}
            </Badge>
          </div>
        )}
      </div>

      {/* Label */}
      <div className={cn(
        "ml-2 flex-1 text-xs truncate max-w-[120px]",
        side === 'right' && 'mr-2 ml-0 text-right'
      )}>
        <div className="font-medium text-gray-900">{breaker.label}</div>
        {breaker.poles > 1 && (
          <div className="text-[10px] text-gray-500">{breaker.poles}-pole</div>
        )}
      </div>
    </div>
  );
}
