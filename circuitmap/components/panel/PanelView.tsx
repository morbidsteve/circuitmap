'use client';

import { Breaker } from '@/types/panel';
import { BreakerSlot } from './BreakerSlot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PanelViewProps {
  breakers: Breaker[];
  totalSlots: number;
  selectedBreakerId?: string;
  onBreakerClick?: (breakerId: string) => void;
}

export function PanelView({ breakers, totalSlots, selectedBreakerId, onBreakerClick }: PanelViewProps) {
  // Group breakers by their position (odd = left, even = right)
  const leftBreakers: (Breaker | undefined)[] = [];
  const rightBreakers: (Breaker | undefined)[] = [];

  // Create a map of position to breaker for easy lookup
  const breakerMap = new Map<string, Breaker>();
  breakers.forEach(breaker => {
    breakerMap.set(breaker.position, breaker);
  });

  // Fill slots (assuming 2-column panel)
  const slotsPerSide = Math.ceil(totalSlots / 2);

  for (let i = 1; i <= slotsPerSide; i++) {
    const leftPos = (i * 2 - 1).toString();
    const rightPos = (i * 2).toString();

    // Check for multi-pole breakers
    let leftBreaker = breakerMap.get(leftPos);
    let rightBreaker = breakerMap.get(rightPos);

    // Also check for range positions like "1-3" or "2-4"
    if (!leftBreaker) {
      for (const [pos, breaker] of breakerMap.entries()) {
        if (pos.includes('-') && pos.startsWith(leftPos)) {
          leftBreaker = breaker;
          break;
        }
      }
    }

    if (!rightBreaker) {
      for (const [pos, breaker] of breakerMap.entries()) {
        if (pos.includes('-') && pos.startsWith(rightPos)) {
          rightBreaker = breaker;
          break;
        }
      }
    }

    leftBreakers.push(leftBreaker);
    rightBreakers.push(rightBreaker);
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-b from-gray-700 to-gray-800 text-white">
        <CardTitle className="text-center">Electrical Panel</CardTitle>
        <div className="text-center text-sm text-gray-300">
          {totalSlots} Slots • {breakers.length} Breakers Installed
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-8 bg-gradient-to-b from-gray-400 to-gray-500 p-6 rounded-lg shadow-inner">
          {/* Left column (odd positions) */}
          <div className="space-y-0">
            {leftBreakers.map((breaker, index) => (
              <BreakerSlot
                key={`left-${index}`}
                breaker={breaker}
                position={index * 2 + 1}
                side="left"
                isSelected={breaker?.id === selectedBreakerId}
                onClick={() => breaker && onBreakerClick?.(breaker.id)}
              />
            ))}
          </div>

          {/* Right column (even positions) */}
          <div className="space-y-0">
            {rightBreakers.map((breaker, index) => (
              <BreakerSlot
                key={`right-${index}`}
                breaker={breaker}
                position={index * 2 + 2}
                side="right"
                isSelected={breaker?.id === selectedBreakerId}
                onClick={() => breaker && onBreakerClick?.(breaker.id)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
