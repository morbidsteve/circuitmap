import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateFloorSchema = z.object({
  name: z.string().min(1).optional(),
  level: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const floor = await prisma.floor.findFirst({
      where: { id: params.id },
      include: { panel: true },
    });

    if (!floor || floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateFloorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.floor.update({
      where: { id: params.id },
      data: result.data,
      include: { rooms: { include: { devices: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating floor:', error);
    return NextResponse.json({ error: 'Failed to update floor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const floor = await prisma.floor.findFirst({
      where: { id: params.id },
      include: { panel: true },
    });

    if (!floor || floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    await prisma.floor.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting floor:', error);
    return NextResponse.json({ error: 'Failed to delete floor' }, { status: 500 });
  }
}
