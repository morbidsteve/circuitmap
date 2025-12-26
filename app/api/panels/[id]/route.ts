import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updatePanelSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  brand: z.enum(['square_d', 'siemens', 'ge', 'eaton', 'murray', 'other']).optional(),
  mainAmperage: z.number().int().positive().optional(),
  totalSlots: z.number().int().positive().optional(),
  columns: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const panel = await prisma.panel.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        breakers: {
          orderBy: { sortOrder: 'asc' },
        },
        floors: {
          include: {
            rooms: {
              include: {
                devices: true,
              },
            },
          },
          orderBy: { level: 'asc' },
        },
      },
    });

    if (!panel) {
      return NextResponse.json(
        { error: 'Panel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(panel);
  } catch (error) {
    console.error('Error fetching panel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch panel' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership
    const existingPanel = await prisma.panel.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingPanel) {
      return NextResponse.json(
        { error: 'Panel not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = updatePanelSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const panel = await prisma.panel.update({
      where: { id: params.id },
      data: result.data,
      include: {
        breakers: {
          orderBy: { sortOrder: 'asc' },
        },
        floors: {
          include: {
            rooms: {
              include: {
                devices: true,
              },
            },
          },
          orderBy: { level: 'asc' },
        },
      },
    });

    return NextResponse.json(panel);
  } catch (error) {
    console.error('Error updating panel:', error);
    return NextResponse.json(
      { error: 'Failed to update panel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership
    const existingPanel = await prisma.panel.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingPanel) {
      return NextResponse.json(
        { error: 'Panel not found' },
        { status: 404 }
      );
    }

    await prisma.panel.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting panel:', error);
    return NextResponse.json(
      { error: 'Failed to delete panel' },
      { status: 500 }
    );
  }
}
