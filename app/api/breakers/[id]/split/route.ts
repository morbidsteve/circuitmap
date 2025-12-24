import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/breakers/[id]/split
 * Splits a combined tandem breaker (e.g., "14A/14B") into two separate breaker records.
 * Devices will remain on the first half (A) - user can reassign them after.
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

    const breakerId = params.id;

    // Get the breaker
    const breaker = await prisma.breaker.findUnique({
      where: { id: breakerId },
      include: {
        panel: true,
      },
    });

    if (!breaker) {
      return NextResponse.json({ error: 'Breaker not found' }, { status: 404 });
    }

    // Verify ownership
    if (breaker.panel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if this is a combined tandem format
    const combinedMatch = breaker.position.match(/^(\d+)([AB])\/\1([AB])$/i);
    if (!combinedMatch) {
      return NextResponse.json(
        { error: 'This breaker is not in combined tandem format (e.g., "14A/14B")' },
        { status: 400 }
      );
    }

    const slotNum = combinedMatch[1];
    const suffixA = combinedMatch[2].toUpperCase();
    const suffixB = combinedMatch[3].toUpperCase();

    const positionA = `${slotNum}${suffixA}`;
    const positionB = `${slotNum}${suffixB}`;

    // Check if either position already exists (shouldn't happen, but safety check)
    const existingBreakers = await prisma.breaker.findMany({
      where: {
        panelId: breaker.panelId,
        position: { in: [positionA, positionB] },
      },
    });

    if (existingBreakers.length > 0) {
      const occupied = existingBreakers.map(b => b.position).join(', ');
      return NextResponse.json(
        { error: `Position(s) ${occupied} already occupied. Delete them first.` },
        { status: 400 }
      );
    }

    // Extract the label - remove any existing (A) or (B) suffix
    let baseLabel = breaker.label.replace(/\s*\([AB]\)\s*$/i, '').trim();

    // Perform the split in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the original breaker to be position A
      const breakerA = await tx.breaker.update({
        where: { id: breakerId },
        data: {
          position: positionA,
          label: `${baseLabel} (${suffixA})`,
        },
      });

      // Create a new breaker for position B
      const breakerB = await tx.breaker.create({
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
      });

      return { breakerA, breakerB };
    });

    return NextResponse.json({
      message: 'Tandem breaker split successfully',
      breakers: [result.breakerA, result.breakerB],
    });
  } catch (error) {
    console.error('Error splitting breaker:', error);
    return NextResponse.json({ error: 'Failed to split breaker' }, { status: 500 });
  }
}
