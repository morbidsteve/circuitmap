import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createBreakerSchema = z.object({
  panelId: z.string().uuid(),
  position: z.string().min(1).transform(s => s.trim().toUpperCase()),
  amperage: z.number().int().positive(),
  poles: z.number().int().min(1).max(3).default(1),
  label: z.string().min(1),
  circuitType: z.enum([
    'general', 'lighting', 'appliance', 'hvac', 'outdoor', 'other',
    'kitchen', 'bathroom', 'dryer', 'range', 'water_heater',
    'ev_charger', 'pool', 'garage', 'subpanel'
  ]).default('general'),
  protectionType: z.enum(['standard', 'gfci', 'afci', 'dual_function', 'dual']).default('standard'),
  isOn: z.boolean().default(true),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createBreakerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    // Verify panel ownership
    const panel = await prisma.panel.findFirst({
      where: { id: result.data.panelId, userId: session.user.id },
    });

    if (!panel) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    // Check for duplicate positions
    // For tandem breakers (ending in A or B), allow both A and B
    // For regular breakers and multi-pole (like "2-4"), only one allowed
    const position = result.data.position;

    // Check for combined tandem format (e.g., "14A/14B") - split into two breakers
    const combinedTandemMatch = position.match(/^(\d+)([AB])\/\1([AB])$/i);
    if (combinedTandemMatch) {
      const slotNum = combinedTandemMatch[1];
      const suffixA = combinedTandemMatch[2].toUpperCase();
      const suffixB = combinedTandemMatch[3].toUpperCase();

      const positionA = `${slotNum}${suffixA}`;
      const positionB = `${slotNum}${suffixB}`;

      // Check if either position already exists
      const existingBreakers = await prisma.breaker.findMany({
        where: {
          panelId: result.data.panelId,
          position: { in: [positionA, positionB] },
        },
      });

      if (existingBreakers.length > 0) {
        const occupied = existingBreakers.map(b => b.position).join(', ');
        return NextResponse.json(
          { error: `Position(s) ${occupied} already occupied` },
          { status: 400 }
        );
      }

      // Create both tandem breakers - each gets same properties but different position
      const { position: _pos, ...breakerDataWithoutPosition } = result.data;

      const [breakerA, breakerB] = await prisma.$transaction([
        prisma.breaker.create({
          data: { ...breakerDataWithoutPosition, position: positionA, label: `${result.data.label} (${suffixA})` },
        }),
        prisma.breaker.create({
          data: { ...breakerDataWithoutPosition, position: positionB, label: `${result.data.label} (${suffixB})` },
        }),
      ]);

      return NextResponse.json([breakerA, breakerB], { status: 201 });
    }

    const isTandem = /^(\d+)[AB]$/i.test(position);

    const existingBreaker = await prisma.breaker.findFirst({
      where: {
        panelId: result.data.panelId,
        position: position,
      },
    });

    if (existingBreaker) {
      return NextResponse.json(
        { error: `Position ${position} is already occupied by another breaker` },
        { status: 400 }
      );
    }

    // For non-tandem breakers, also check if trying to use a position that's part of a multi-pole
    if (!isTandem) {
      const basePosition = parseInt(position.split('-')[0]);
      if (!isNaN(basePosition)) {
        // Check if this position is already part of a multi-pole breaker
        const conflictingMultiPole = await prisma.breaker.findFirst({
          where: {
            panelId: result.data.panelId,
            position: {
              contains: '-',
            },
          },
        });

        if (conflictingMultiPole) {
          const [start, end] = conflictingMultiPole.position.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            // Check if new position falls within multi-pole range
            for (let pos = start; pos <= end; pos += 2) {
              if (pos === basePosition) {
                return NextResponse.json(
                  { error: `Position ${position} conflicts with multi-pole breaker at ${conflictingMultiPole.position}` },
                  { status: 400 }
                );
              }
            }
          }
        }
      }
    }

    const breaker = await prisma.breaker.create({
      data: result.data,
    });

    return NextResponse.json(breaker, { status: 201 });
  } catch (error) {
    console.error('Error creating breaker:', error);
    return NextResponse.json({ error: 'Failed to create breaker' }, { status: 500 });
  }
}
