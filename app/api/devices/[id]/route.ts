import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateDeviceSchema = z.object({
  roomId: z.string().uuid().optional(),
  breakerId: z.string().uuid().optional().nullable(),
  type: z.enum([
    'outlet', 'light', 'switch', 'appliance', 'hvac', 'water_heater',
    'dryer', 'range', 'ev_charger', 'pool', 'smoke_detector', 'fan', 'other',
    // Legacy types for backward compatibility
    'fixture', 'hardwired'
  ]).optional(),
  subtype: z.string().optional(),
  description: z.string().min(1).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  placement: z.enum(['floor', 'wall', 'ceiling']).optional(),
  heightFromFloor: z.number().optional().nullable(),
  estimatedWattage: z.number().int().optional(),
  isGfciProtected: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const device = await prisma.device.findFirst({
      where: { id: params.id },
      include: { room: { include: { floor: { include: { panel: true } } } } },
    });

    if (!device || device.room.floor.panel.userId !== user.id) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateDeviceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.device.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const device = await prisma.device.findFirst({
      where: { id: params.id },
      include: { room: { include: { floor: { include: { panel: true } } } } },
    });

    if (!device || device.room.floor.panel.userId !== user.id) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    await prisma.device.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 });
  }
}
