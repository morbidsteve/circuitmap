import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const panels = await prisma.panel.findMany({
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
