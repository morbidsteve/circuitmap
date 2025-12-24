import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// This endpoint always returns the demo panel, regardless of authentication
// Used by the /demo page to show sample data
export async function GET() {
  try {
    // Find the demo user's panel
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@circuitmap.com' },
    });

    if (!demoUser) {
      return NextResponse.json(
        { error: 'Demo data not found. Please run: pnpm db:seed' },
        { status: 404 }
      );
    }

    const panel = await prisma.panel.findFirst({
      where: { userId: demoUser.id },
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

    if (!panel) {
      return NextResponse.json(
        { error: 'Demo panel not found. Please run: pnpm db:seed' },
        { status: 404 }
      );
    }

    return NextResponse.json(panel);
  } catch (error) {
    console.error('Error fetching demo panel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demo panel' },
      { status: 500 }
    );
  }
}
