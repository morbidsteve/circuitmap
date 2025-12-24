import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for validating imported data
const deviceSchema = z.object({
  breakerPosition: z.string().nullable().optional(),
  type: z.string(),
  subtype: z.string().optional().nullable(),
  description: z.string(),
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
  placement: z.enum(['floor', 'wall', 'ceiling']).default('wall'),
  heightFromFloor: z.number().optional().nullable(),
  estimatedWattage: z.number().optional().nullable(),
  isGfciProtected: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

const openingSchema = z.object({
  type: z.string(),
  position: z.number(),
  width: z.number(),
  height: z.number().optional().nullable(),
});

const wallSchema = z.object({
  startX: z.number(),
  startY: z.number(),
  endX: z.number(),
  endY: z.number(),
  thickness: z.number().default(0.5),
  isExterior: z.boolean().default(false),
  openings: z.array(openingSchema).default([]),
});

const roomSchema = z.object({
  name: z.string(),
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  devices: z.array(deviceSchema).default([]),
});

const floorSchema = z.object({
  name: z.string(),
  level: z.number(),
  floorPlanData: z.any().optional().nullable(),
  rooms: z.array(roomSchema).default([]),
  walls: z.array(wallSchema).default([]),
});

const breakerSchema = z.object({
  position: z.string(),
  amperage: z.number(),
  poles: z.number().default(1),
  label: z.string(),
  circuitType: z.string().default('general'),
  protectionType: z.string().default('standard'),
  isOn: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().optional().nullable(),
});

const importSchema = z.object({
  version: z.string(),
  exportedAt: z.string().optional(),
  panel: z.object({
    name: z.string(),
    address: z.string().optional().nullable(),
    brand: z.string().default('other'),
    mainAmperage: z.number().default(200),
    totalSlots: z.number().default(40),
    columns: z.number().default(2),
    notes: z.string().optional().nullable(),
    breakers: z.array(breakerSchema).default([]),
    floors: z.array(floorSchema).default([]),
  }),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = importSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid import data', details: result.error.errors },
        { status: 400 }
      );
    }

    const importData = result.data;

    // Create the panel with all related data in a transaction
    const panel = await prisma.$transaction(async (tx) => {
      // Create the panel
      const newPanel = await tx.panel.create({
        data: {
          userId: session.user.id,
          name: `${importData.panel.name} (Imported)`,
          address: importData.panel.address,
          brand: importData.panel.brand,
          mainAmperage: importData.panel.mainAmperage,
          totalSlots: importData.panel.totalSlots,
          columns: importData.panel.columns,
          notes: importData.panel.notes,
        },
      });

      // Create breakers and build a position -> id map
      const breakerIdMap = new Map<string, string>();
      for (const breaker of importData.panel.breakers) {
        const newBreaker = await tx.breaker.create({
          data: {
            panelId: newPanel.id,
            position: breaker.position,
            amperage: breaker.amperage,
            poles: breaker.poles,
            label: breaker.label,
            circuitType: breaker.circuitType,
            protectionType: breaker.protectionType,
            isOn: breaker.isOn,
            notes: breaker.notes,
            sortOrder: breaker.sortOrder,
          },
        });
        breakerIdMap.set(breaker.position, newBreaker.id);
      }

      // Create floors, rooms, devices, and walls
      for (const floor of importData.panel.floors) {
        const newFloor = await tx.floor.create({
          data: {
            panelId: newPanel.id,
            name: floor.name,
            level: floor.level,
            floorPlanData: floor.floorPlanData,
          },
        });

        // Create rooms and devices
        for (const room of floor.rooms) {
          const newRoom = await tx.room.create({
            data: {
              floorId: newFloor.id,
              name: room.name,
              positionX: room.positionX,
              positionY: room.positionY,
              width: room.width,
              height: room.height,
            },
          });

          // Create devices
          for (const device of room.devices) {
            const breakerId = device.breakerPosition
              ? breakerIdMap.get(device.breakerPosition) || null
              : null;

            await tx.device.create({
              data: {
                roomId: newRoom.id,
                breakerId,
                type: device.type,
                subtype: device.subtype,
                description: device.description,
                positionX: device.positionX,
                positionY: device.positionY,
                placement: device.placement,
                heightFromFloor: device.heightFromFloor,
                estimatedWattage: device.estimatedWattage,
                isGfciProtected: device.isGfciProtected,
                notes: device.notes,
              },
            });
          }
        }

        // Create walls and openings
        for (const wall of floor.walls) {
          const newWall = await tx.wall.create({
            data: {
              floorId: newFloor.id,
              startX: wall.startX,
              startY: wall.startY,
              endX: wall.endX,
              endY: wall.endY,
              thickness: wall.thickness,
              isExterior: wall.isExterior,
            },
          });

          // Create openings
          for (const opening of wall.openings) {
            await tx.opening.create({
              data: {
                wallId: newWall.id,
                type: opening.type,
                position: opening.position,
                width: opening.width,
                height: opening.height,
              },
            });
          }
        }
      }

      return newPanel;
    });

    return NextResponse.json({
      success: true,
      panelId: panel.id,
      message: `Panel "${panel.name}" imported successfully`,
    });
  } catch (error) {
    console.error('Error importing panel:', error);
    return NextResponse.json({ error: 'Failed to import panel' }, { status: 500 });
  }
}
