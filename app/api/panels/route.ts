import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createPanelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  brand: z.enum(['square_d', 'siemens', 'ge', 'eaton', 'murray', 'other']),
  mainAmperage: z.number().int().positive(),
  totalSlots: z.number().int().positive().default(40),
  columns: z.number().int().positive().default(2),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // If no session, return empty array (demo page will handle this)
    // In a real app, you might want to return 401
    const userId = session?.user?.id;

    const panels = await prisma.panel.findMany({
      where: userId ? { userId } : undefined,
      include: {
        breakers: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        floors: {
          include: {
            rooms: {
              include: {
                devices: true,
              },
            },
          },
          orderBy: {
            level: 'asc',
          },
        },
      },
    });

    return NextResponse.json(panels);
  } catch (error) {
    console.error('Error fetching panels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch panels' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = createPanelSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const panel = await prisma.panel.create({
      data: {
        ...result.data,
        userId: session.user.id,
      },
      include: {
        breakers: true,
        floors: {
          include: {
            rooms: {
              include: {
                devices: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(panel, { status: 201 });
  } catch (error) {
    console.error('Error creating panel:', error);
    return NextResponse.json(
      { error: 'Failed to create panel' },
      { status: 500 }
    );
  }
}
