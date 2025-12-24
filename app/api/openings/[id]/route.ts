import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const openingTypeSchema = z.enum(['door', 'window', 'archway']);

const updateOpeningSchema = z.object({
  type: openingTypeSchema.optional(),
  position: z.number().min(0).max(1).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional().nullable(),
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

    const opening = await prisma.opening.findFirst({
      where: { id: params.id },
      include: { wall: { include: { floor: { include: { panel: true } } } } },
    });

    if (!opening || opening.wall.floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Opening not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateOpeningSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.opening.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating opening:', error);
    return NextResponse.json({ error: 'Failed to update opening' }, { status: 500 });
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

    const opening = await prisma.opening.findFirst({
      where: { id: params.id },
      include: { wall: { include: { floor: { include: { panel: true } } } } },
    });

    if (!opening || opening.wall.floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Opening not found' }, { status: 404 });
    }

    await prisma.opening.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opening:', error);
    return NextResponse.json({ error: 'Failed to delete opening' }, { status: 500 });
  }
}
