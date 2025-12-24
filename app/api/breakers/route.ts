import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createBreakerSchema = z.object({
  panelId: z.string().uuid(),
  position: z.string().min(1),
  amperage: z.number().int().positive(),
  poles: z.number().int().min(1).max(3).default(1),
  label: z.string().min(1),
  circuitType: z.enum([
    'general', 'lighting', 'appliance', 'hvac', 'outdoor', 'other',
    'kitchen', 'bathroom', 'dryer', 'range', 'water_heater',
    'ev_charger', 'pool', 'garage', 'subpanel'
  ]).default('general'),
  protectionType: z.enum(['standard', 'gfci', 'afci', 'dual_function', 'dual']).default('standard'),
  isOn: z.boolean().default(true),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createBreakerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    // Verify panel ownership
    const panel = await prisma.panel.findFirst({
      where: { id: result.data.panelId, userId: session.user.id },
    });

    if (!panel) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    const breaker = await prisma.breaker.create({
      data: result.data,
    });

    return NextResponse.json(breaker, { status: 201 });
  } catch (error) {
    console.error('Error creating breaker:', error);
    return NextResponse.json({ error: 'Failed to create breaker' }, { status: 500 });
  }
}
