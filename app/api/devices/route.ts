import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createDeviceSchema = z.object({
  roomId: z.string().uuid(),
  breakerId: z.string().uuid().optional().nullable(),
  type: z.enum([
    'outlet', 'light', 'switch', 'appliance', 'hvac', 'water_heater',
    'dryer', 'range', 'ev_charger', 'pool', 'smoke_detector', 'fan', 'other',
    // Legacy types for backward compatibility
    'fixture', 'hardwired'
  ]),
  subtype: z.string().optional(),
  description: z.string().min(1),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  placement: z.enum(['floor', 'wall', 'ceiling']).default('wall'),
  heightFromFloor: z.number().optional(),
  estimatedWattage: z.number().int().optional(),
  isGfciProtected: z.boolean().default(false),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createDeviceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    // Verify room ownership through panel
    const room = await prisma.room.findFirst({
      where: { id: result.data.roomId },
      include: { floor: { include: { panel: true } } },
    });

    if (!room || room.floor.panel.userId !== user.id) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // If breakerId provided, verify it belongs to the same panel
    if (result.data.breakerId) {
      const breaker = await prisma.breaker.findFirst({
        where: { id: result.data.breakerId, panelId: room.floor.panelId },
      });

      if (!breaker) {
        return NextResponse.json({ error: 'Breaker not found' }, { status: 404 });
      }
    }

    const device = await prisma.device.create({
      data: result.data,
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 });
  }
}
