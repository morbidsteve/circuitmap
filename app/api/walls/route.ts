import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createWallSchema = z.object({
  floorId: z.string().uuid(),
  startX: z.number(),
  startY: z.number(),
  endX: z.number(),
  endY: z.number(),
  thickness: z.number().positive().optional().default(0.5),
  isExterior: z.boolean().optional().default(false),
});

const createManyWallsSchema = z.object({
  walls: z.array(createWallSchema),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Support both single wall and multiple walls
    if (body.walls && Array.isArray(body.walls)) {
      // Batch create multiple walls
      const result = createManyWallsSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
      }

      // Verify floor ownership for all walls (they should all be on the same floor)
      const floorIds = [...new Set(result.data.walls.map((w) => w.floorId))];

      for (const floorId of floorIds) {
        const floor = await prisma.floor.findFirst({
          where: { id: floorId },
          include: { panel: true },
        });

        if (!floor || floor.panel.userId !== session.user.id) {
          return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
        }
      }

      const walls = await prisma.wall.createMany({
        data: result.data.walls,
      });

      // Fetch the created walls with openings
      const createdWalls = await prisma.wall.findMany({
        where: { floorId: { in: floorIds } },
        include: { openings: true },
        orderBy: { createdAt: 'desc' },
        take: result.data.walls.length,
      });

      return NextResponse.json(createdWalls, { status: 201 });
    } else {
      // Single wall creation
      const result = createWallSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
      }

      // Verify floor ownership through panel
      const floor = await prisma.floor.findFirst({
        where: { id: result.data.floorId },
        include: { panel: true },
      });

      if (!floor || floor.panel.userId !== session.user.id) {
        return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
      }

      const wall = await prisma.wall.create({
        data: result.data,
        include: { openings: true },
      });

      return NextResponse.json(wall, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating wall:', error);
    return NextResponse.json({ error: 'Failed to create wall' }, { status: 500 });
  }
}

// GET walls for a floor
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const floorId = searchParams.get('floorId');

    if (!floorId) {
      return NextResponse.json({ error: 'floorId is required' }, { status: 400 });
    }

    // Verify floor ownership
    const floor = await prisma.floor.findFirst({
      where: { id: floorId },
      include: { panel: true },
    });

    if (!floor || floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    const walls = await prisma.wall.findMany({
      where: { floorId },
      include: { openings: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(walls);
  } catch (error) {
    console.error('Error fetching walls:', error);
    return NextResponse.json({ error: 'Failed to fetch walls' }, { status: 500 });
  }
}
