import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const openingTypeSchema = z.enum(['door', 'window', 'archway']);

const createOpeningSchema = z.object({
  wallId: z.string().uuid(),
  type: openingTypeSchema,
  position: z.number().min(0).max(1), // Position along wall (0-1)
  width: z.number().positive(),
  height: z.number().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createOpeningSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    // Verify wall ownership through floor -> panel
    const wall = await prisma.wall.findFirst({
      where: { id: result.data.wallId },
      include: { floor: { include: { panel: true } } },
    });

    if (!wall || wall.floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 });
    }

    const opening = await prisma.opening.create({
      data: result.data,
    });

    return NextResponse.json(opening, { status: 201 });
  } catch (error) {
    console.error('Error creating opening:', error);
    return NextResponse.json({ error: 'Failed to create opening' }, { status: 500 });
  }
}

// GET openings for a wall
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wallId = searchParams.get('wallId');

    if (!wallId) {
      return NextResponse.json({ error: 'wallId is required' }, { status: 400 });
    }

    // Verify wall ownership
    const wall = await prisma.wall.findFirst({
      where: { id: wallId },
      include: { floor: { include: { panel: true } } },
    });

    if (!wall || wall.floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Wall not found' }, { status: 404 });
    }

    const openings = await prisma.opening.findMany({
      where: { wallId },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(openings);
  } catch (error) {
    console.error('Error fetching openings:', error);
    return NextResponse.json({ error: 'Failed to fetch openings' }, { status: 500 });
  }
}
