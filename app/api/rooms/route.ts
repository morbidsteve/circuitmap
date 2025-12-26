import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createRoomSchema = z.object({
  floorId: z.string().uuid(),
  name: z.string().min(1),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createRoomSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    // Verify floor ownership through panel
    const floor = await prisma.floor.findFirst({
      where: { id: result.data.floorId },
      include: { panel: true },
    });

    if (!floor || floor.panel.userId !== user.id) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    const room = await prisma.room.create({
      data: result.data,
      include: { devices: true },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
