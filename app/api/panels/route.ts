import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/stripe';

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

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    // If no user, return empty array (demo page will handle this)
    // In a real app, you might want to return 401
    const userId = user?.id;

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
    const authUser = await getAuthenticatedUser(request);

    if (!authUser?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check subscription limits
    const tier = (authUser.subscriptionTier || 'free') as SubscriptionTier;
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    // Count existing panels
    const panelCount = await prisma.panel.count({
      where: { userId: authUser.id },
    });

    if (panelCount >= tierConfig.maxPanels) {
      return NextResponse.json(
        {
          error: `Panel limit reached. ${tier === 'free' ? 'Upgrade to Pro for unlimited panels.' : 'You have reached your plan limit.'}`,
          code: 'LIMIT_REACHED',
          upgradeRequired: tier === 'free',
        },
        { status: 403 }
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
        userId: authUser.id,
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
