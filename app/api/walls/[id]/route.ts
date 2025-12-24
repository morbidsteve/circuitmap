import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateWallSchema = z.object({
  startX: z.number().optional(),
  startY: z.number().optional(),
  endX: z.number().optional(),
  endY: z.number().optional(),
  thickness: z.number().positive().optional(),
  isExterior: z.boolean().optional(),
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

    const wall = await prisma.wall.findFirst({
      where: { id: params.id },
      include: { floor: { include: { panel: true } } },
    });

    if (!wall || wall.floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateWallSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.wall.update({
      where: { id: params.id },
      data: result.data,
      include: { openings: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating wall:', error);
    return NextResponse.json({ error: 'Failed to update wall' }, { status: 500 });
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

    const wall = await prisma.wall.findFirst({
      where: { id: params.id },
      include: { floor: { include: { panel: true } } },
    });

    if (!wall || wall.floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 });
    }

    await prisma.wall.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wall:', error);
    return NextResponse.json({ error: 'Failed to delete wall' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wall = await prisma.wall.findFirst({
      where: { id: params.id },
      include: {
        openings: true,
        floor: { include: { panel: true } }
      },
    });

    if (!wall || wall.floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 });
    }

    // Remove floor data from response (not needed)
    const { floor, ...wallData } = wall;

    return NextResponse.json(wallData);
  } catch (error) {
    console.error('Error fetching wall:', error);
    return NextResponse.json({ error: 'Failed to fetch wall' }, { status: 500 });
  }
}
