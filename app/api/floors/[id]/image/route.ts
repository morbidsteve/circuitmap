import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createFloorPlanImageSchema = z.object({
  imageUrl: z.string().url(),
  scale: z.number().positive().optional().default(1),
  offsetX: z.number().optional().default(0),
  offsetY: z.number().optional().default(0),
  rotation: z.number().min(-360).max(360).optional().default(0),
  opacity: z.number().min(0).max(1).optional().default(0.5),
  isVisible: z.boolean().optional().default(true),
});

const updateFloorPlanImageSchema = z.object({
  imageUrl: z.string().url().optional(),
  scale: z.number().positive().optional(),
  offsetX: z.number().optional(),
  offsetY: z.number().optional(),
  rotation: z.number().min(-360).max(360).optional(),
  opacity: z.number().min(0).max(1).optional(),
  isVisible: z.boolean().optional(),
});

// GET floor plan image for a floor
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify floor ownership
    const floor = await prisma.floor.findFirst({
      where: { id: params.id },
      include: {
        panel: true,
        floorPlanImage: true,
      },
    });

    if (!floor || floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    return NextResponse.json(floor.floorPlanImage);
  } catch (error) {
    console.error('Error fetching floor plan image:', error);
    return NextResponse.json({ error: 'Failed to fetch floor plan image' }, { status: 500 });
  }
}

// POST create floor plan image for a floor
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify floor ownership
    const floor = await prisma.floor.findFirst({
      where: { id: params.id },
      include: {
        panel: true,
        floorPlanImage: true,
      },
    });

    if (!floor || floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    // Check if floor already has an image
    if (floor.floorPlanImage) {
      return NextResponse.json({ error: 'Floor already has an image. Use PATCH to update.' }, { status: 400 });
    }

    const body = await request.json();
    const result = createFloorPlanImageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const floorPlanImage = await prisma.floorPlanImage.create({
      data: {
        floorId: params.id,
        ...result.data,
      },
    });

    return NextResponse.json(floorPlanImage, { status: 201 });
  } catch (error) {
    console.error('Error creating floor plan image:', error);
    return NextResponse.json({ error: 'Failed to create floor plan image' }, { status: 500 });
  }
}

// PATCH update floor plan image for a floor
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify floor ownership
    const floor = await prisma.floor.findFirst({
      where: { id: params.id },
      include: {
        panel: true,
        floorPlanImage: true,
      },
    });

    if (!floor || floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    if (!floor.floorPlanImage) {
      return NextResponse.json({ error: 'Floor has no image. Use POST to create.' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateFloorPlanImageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.floorPlanImage.update({
      where: { id: floor.floorPlanImage.id },
      data: result.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating floor plan image:', error);
    return NextResponse.json({ error: 'Failed to update floor plan image' }, { status: 500 });
  }
}

// DELETE floor plan image for a floor
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify floor ownership
    const floor = await prisma.floor.findFirst({
      where: { id: params.id },
      include: {
        panel: true,
        floorPlanImage: true,
      },
    });

    if (!floor || floor.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
    }

    if (!floor.floorPlanImage) {
      return NextResponse.json({ error: 'Floor has no image to delete' }, { status: 404 });
    }

    // Note: This doesn't delete the actual image file from storage
    // That should be handled separately if using cloud storage
    await prisma.floorPlanImage.delete({
      where: { id: floor.floorPlanImage.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting floor plan image:', error);
    return NextResponse.json({ error: 'Failed to delete floor plan image' }, { status: 500 });
  }
}
