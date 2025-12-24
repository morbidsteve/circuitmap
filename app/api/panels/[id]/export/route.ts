import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: panelId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the complete panel with all related data
    const panel = await prisma.panel.findFirst({
      where: {
        id: panelId,
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
            walls: {
              include: {
                openings: true,
              },
            },
            floorPlanImage: true,
          },
        },
      },
    });

    if (!panel) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    // Create export data structure
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      panel: {
        name: panel.name,
        address: panel.address,
        brand: panel.brand,
        mainAmperage: panel.mainAmperage,
        totalSlots: panel.totalSlots,
        columns: panel.columns,
        notes: panel.notes,
        breakers: panel.breakers.map((b) => ({
          position: b.position,
          amperage: b.amperage,
          poles: b.poles,
          label: b.label,
          circuitType: b.circuitType,
          protectionType: b.protectionType,
          isOn: b.isOn,
          notes: b.notes,
          sortOrder: b.sortOrder,
        })),
        floors: panel.floors.map((f) => ({
          name: f.name,
          level: f.level,
          floorPlanData: f.floorPlanData,
          rooms: f.rooms.map((r) => ({
            name: r.name,
            positionX: r.positionX,
            positionY: r.positionY,
            width: r.width,
            height: r.height,
            devices: r.devices.map((d) => ({
              breakerPosition: panel.breakers.find((b) => b.id === d.breakerId)?.position || null,
              type: d.type,
              subtype: d.subtype,
              description: d.description,
              positionX: d.positionX,
              positionY: d.positionY,
              placement: d.placement,
              heightFromFloor: d.heightFromFloor,
              estimatedWattage: d.estimatedWattage,
              isGfciProtected: d.isGfciProtected,
              notes: d.notes,
            })),
          })),
          walls: f.walls.map((w) => ({
            startX: w.startX,
            startY: w.startY,
            endX: w.endX,
            endY: w.endY,
            thickness: w.thickness,
            isExterior: w.isExterior,
            openings: w.openings.map((o) => ({
              type: o.type,
              position: o.position,
              width: o.width,
              height: o.height,
            })),
          })),
        })),
      },
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="circuitmap-${panel.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting panel:', error);
    return NextResponse.json({ error: 'Failed to export panel' }, { status: 500 });
  }
}
