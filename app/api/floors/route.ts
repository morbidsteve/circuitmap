import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createFloorSchema = z.object({
  panelId: z.string().uuid(),
  name: z.string().min(1),
  level: z.number().int(),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createFloorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    // Verify panel ownership
    const panel = await prisma.panel.findFirst({
      where: { id: result.data.panelId, userId: user.id },
    });

    if (!panel) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    const floor = await prisma.floor.create({
      data: result.data,
      include: { rooms: true },
    });

    return NextResponse.json(floor, { status: 201 });
  } catch (error) {
    console.error('Error creating floor:', error);
    return NextResponse.json({ error: 'Failed to create floor' }, { status: 500 });
  }
}
