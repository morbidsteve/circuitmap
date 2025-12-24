import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateBreakerSchema = z.object({
  position: z.string().min(1).transform(s => s.trim().toUpperCase()).optional(),
  amperage: z.number().int().positive().optional(),
  poles: z.number().int().min(1).max(3).optional(),
  label: z.string().min(1).optional(),
  circuitType: z.enum([
    'general', 'lighting', 'appliance', 'hvac', 'outdoor', 'other',
    'kitchen', 'bathroom', 'dryer', 'range', 'water_heater',
    'ev_charger', 'pool', 'garage', 'subpanel'
  ]).optional(),
  protectionType: z.enum(['standard', 'gfci', 'afci', 'dual_function', 'dual']).optional(),
  isOn: z.boolean().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership through panel
    const breaker = await prisma.breaker.findFirst({
      where: { id: params.id },
      include: { panel: true },
    });

    if (!breaker || breaker.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Breaker not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = updateBreakerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.breaker.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating breaker:', error);
    return NextResponse.json({ error: 'Failed to update breaker' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership through panel
    const breaker = await prisma.breaker.findFirst({
      where: { id: params.id },
      include: { panel: true },
    });

    if (!breaker || breaker.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Breaker not found' }, { status: 404 });
    }

    await prisma.breaker.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting breaker:', error);
    return NextResponse.json({ error: 'Failed to delete breaker' }, { status: 500 });
  }
}
