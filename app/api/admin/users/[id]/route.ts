import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
  subscriptionTier: z.enum(['free', 'pro', 'premium']).optional(),
  isAdmin: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch user with their panels and stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        subscriptionTier: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        stripeCustomerId: true,
        panels: {
          select: {
            id: true,
            name: true,
            address: true,
            brand: true,
            mainAmperage: true,
            totalSlots: true,
            createdAt: true,
            _count: {
              select: {
                breakers: true,
                floors: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      subscriptionTier: user.subscriptionTier,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasStripeCustomer: !!user.stripeCustomerId,
      panels: user.panels.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        brand: p.brand,
        mainAmperage: p.mainAmperage,
        totalSlots: p.totalSlots,
        createdAt: p.createdAt,
        breakerCount: p._count.breakers,
        floorCount: p._count.floors,
      })),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent removing your own admin status
    if (userId === session.user.id) {
      const body = await request.json();
      if (body.isAdmin === false) {
        return NextResponse.json(
          { error: 'Cannot remove your own admin status' },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: result.data,
      select: {
        id: true,
        email: true,
        fullName: true,
        subscriptionTier: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
