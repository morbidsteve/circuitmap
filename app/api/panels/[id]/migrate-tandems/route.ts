import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/panels/[id]/migrate-tandems
 * Automatically splits any combined tandem breakers (e.g., "14A/14B")
 * into two separate breaker records.
 * This is a one-time migration that runs automatically.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const panelId = params.id;

    // Verify panel ownership
    const panel = await prisma.panel.findFirst({
      where: { id: panelId, userId: session.user.id },
      include: { breakers: true },
    });

    if (!panel) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    // Find all combined tandem breakers
    const combinedTandems = panel.breakers.filter(b =>
      /^\d+[AB]\/\d+[AB]$/i.test(b.position)
    );

    if (combinedTandems.length === 0) {
      return NextResponse.json({ migrated: 0, message: 'No combined tandems to migrate' });
    }

    let migratedCount = 0;

    for (const breaker of combinedTandems) {
      const match = breaker.position.match(/^(\d+)([AB])\/\1([AB])$/i);
      if (!match) continue;

      const slotNum = match[1];
      const suffixA = match[2].toUpperCase();
      const suffixB = match[3].toUpperCase();

      const positionA = `${slotNum}${suffixA}`;
      const positionB = `${slotNum}${suffixB}`;

      // Check if positions already exist (shouldn't, but safety check)
      const existing = await prisma.breaker.findFirst({
        where: {
          panelId,
          position: { in: [positionA, positionB] },
          id: { not: breaker.id },
        },
      });

      if (existing) {
        console.log(`Skipping ${breaker.position} - position conflict`);
        continue;
      }

      // Extract base label
      const baseLabel = breaker.label.replace(/\s*\([AB]\)\s*$/i, '').trim();

      // Perform the split
      await prisma.$transaction([
        // Update original breaker to position A
        prisma.breaker.update({
          where: { id: breaker.id },
          data: {
            position: positionA,
            label: `${baseLabel} (${suffixA})`,
          },
        }),
        // Create new breaker for position B
        prisma.breaker.create({
          data: {
            panelId: breaker.panelId,
            position: positionB,
            amperage: breaker.amperage,
            poles: breaker.poles,
            label: `${baseLabel} (${suffixB})`,
            circuitType: breaker.circuitType,
            protectionType: breaker.protectionType,
            isOn: breaker.isOn,
            notes: breaker.notes,
            sortOrder: breaker.sortOrder,
          },
        }),
      ]);

      migratedCount++;
    }

    return NextResponse.json({
      migrated: migratedCount,
      message: `Migrated ${migratedCount} combined tandem breaker(s)`
    });
  } catch (error) {
    console.error('Error migrating tandems:', error);
    return NextResponse.json({ error: 'Failed to migrate tandems' }, { status: 500 });
  }
}
