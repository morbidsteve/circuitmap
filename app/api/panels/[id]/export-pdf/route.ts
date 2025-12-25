import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generatePanelPDF } from '@/lib/pdf/generatePanelPDF';
import type { PanelWithRelations } from '@/types/panel';

export const dynamic = 'force-dynamic';

// Increase timeout for PDF generation
export const maxDuration = 30;

interface FloorImageData {
  floorId: string;
  imageDataUrl: string;
}

interface ExportPDFRequest {
  floorImages?: FloorImageData[];
  options?: {
    includeFloorPlans?: boolean;
    includeCircuitIndex?: boolean;
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: panelId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    let body: ExportPDFRequest = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is fine
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
          },
        },
      },
    });

    if (!panel) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    // Convert floor images from data URLs to buffers
    const floorImages = new Map<string, Buffer>();
    if (body.floorImages) {
      for (const img of body.floorImages) {
        try {
          // Extract base64 data from data URL
          const matches = img.imageDataUrl.match(/^data:image\/\w+;base64,(.+)$/);
          if (matches && matches[1]) {
            const buffer = Buffer.from(matches[1], 'base64');
            floorImages.set(img.floorId, buffer);
          }
        } catch (err) {
          console.warn(`Failed to parse floor image for ${img.floorId}:`, err);
        }
      }
    }

    // Generate PDF
    const pdfBuffer = await generatePanelPDF(
      {
        panel: panel as PanelWithRelations,
        floorImages: floorImages.size > 0 ? floorImages : undefined,
      },
      body.options || {}
    );

    // Create filename
    const safeName = panel.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const filename = `circuitmap-${safeName}-${date}.pdf`;

    // Return PDF - convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support GET for simple export without floor images
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
          },
        },
      },
    });

    if (!panel) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    // Generate PDF without floor images
    const pdfBuffer = await generatePanelPDF({
      panel: panel as PanelWithRelations,
    });

    // Create filename
    const safeName = panel.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const filename = `circuitmap-${safeName}-${date}.pdf`;

    // Return PDF - convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
