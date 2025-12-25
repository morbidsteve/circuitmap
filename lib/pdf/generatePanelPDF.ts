import PDFDocument from 'pdfkit';
import {
  PAGE,
  COLORS,
  FONTS,
  SPACING,
  TABLE,
  getCircuitColor,
  PROTECTION_LABELS,
  CIRCUIT_TYPE_LABELS,
  DEVICE_TYPE_LABELS,
  PLACEMENT_LABELS,
} from './pdfStyles';
import type { PanelWithRelations, Breaker, FloorWithRooms, RoomWithDevices, Device } from '@/types/panel';

export interface PDFExportData {
  panel: PanelWithRelations;
  floorImages?: Map<string, Buffer>; // floorId -> image buffer
}

export interface PDFExportOptions {
  includeFloorPlans?: boolean;
  includeCircuitIndex?: boolean;
}

/**
 * Generate a comprehensive PDF report for an electrical panel
 */
export async function generatePanelPDF(
  data: PDFExportData,
  options: PDFExportOptions = {}
): Promise<Buffer> {
  const { panel, floorImages } = data;
  const { includeFloorPlans = true, includeCircuitIndex = true } = options;

  // Validate panel data
  if (!panel || !panel.name) {
    throw new Error('Invalid panel data');
  }

  // Create PDF document with explicit font configuration
  const doc = new PDFDocument({
    size: 'LETTER',
    margin: PAGE.MARGIN,
    // Disable automatic font embedding to avoid serverless issues
    autoFirstPage: true,
    bufferPages: true,
    info: {
      Title: `CircuitMap - ${panel.name}`,
      Author: 'CircuitMap',
      Subject: 'Electrical Panel Report',
      Creator: 'CircuitMap (https://circuitmap.com)',
    },
  });

  // Collect chunks for buffer
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  // Build PDF sections with error handling
  try {
    addCoverPage(doc, panel);
  } catch (err) {
    console.error('Error in addCoverPage:', err);
    throw new Error(`Cover page generation failed: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  try {
    addBreakerSchedule(doc, panel.breakers || []);
  } catch (err) {
    console.error('Error in addBreakerSchedule:', err);
    throw new Error(`Breaker schedule generation failed: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  // Add floor plans and room details
  const floors = panel.floors || [];
  const sortedFloors = [...floors].sort((a, b) => (b.level || 0) - (a.level || 0));
  for (const floor of sortedFloors) {
    try {
      if (includeFloorPlans && floorImages?.has(floor.id)) {
        addFloorPlanPage(doc, floor, floorImages.get(floor.id)!);
      }

      // Add room details for this floor
      const rooms = floor.rooms || [];
      const sortedRooms = [...rooms].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      for (const room of sortedRooms) {
        if (room.devices && room.devices.length > 0) {
          addRoomDetails(doc, room, floor, panel.breakers || []);
        }
      }
    } catch (err) {
      console.error('Error processing floor:', floor.name, err);
      // Continue with other floors
    }
  }

  // Add circuit index at the end
  if (includeCircuitIndex) {
    try {
      addCircuitIndex(doc, panel);
    } catch (err) {
      console.error('Error in addCircuitIndex:', err);
      // Don't fail the whole PDF for circuit index
    }
  }

  // Add page numbers
  try {
    addPageNumbers(doc);
  } catch (err) {
    console.error('Error in addPageNumbers:', err);
    // Don't fail for page numbers
  }

  // End document
  doc.end();

  // Return buffer
  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

/**
 * Cover Page
 */
function addCoverPage(doc: PDFKit.PDFDocument, panel: PanelWithRelations): void {
  const centerX = PAGE.WIDTH / 2;

  // Title
  doc
    .fontSize(FONTS.title)
    .fillColor(COLORS.dark)
    .text('CircuitMap', PAGE.MARGIN, 100, { align: 'center' });

  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.muted)
    .text('Electrical Panel Report', { align: 'center' });

  // Horizontal line
  doc
    .moveTo(PAGE.MARGIN + 100, 160)
    .lineTo(PAGE.WIDTH - PAGE.MARGIN - 100, 160)
    .strokeColor(COLORS.light)
    .lineWidth(1)
    .stroke();

  // Panel name
  doc
    .fontSize(FONTS.heading1)
    .fillColor(COLORS.dark)
    .text(panel.name, PAGE.MARGIN, 200, { align: 'center' });

  // Address
  if (panel.address) {
    doc
      .fontSize(FONTS.body)
      .fillColor(COLORS.secondary)
      .text(panel.address, { align: 'center' });
  }

  // Panel summary box
  const boxY = 280;
  const boxHeight = 120;

  doc
    .rect(PAGE.MARGIN + 80, boxY, PAGE.CONTENT_WIDTH - 160, boxHeight)
    .fillColor(COLORS.light)
    .fill();

  doc
    .rect(PAGE.MARGIN + 80, boxY, PAGE.CONTENT_WIDTH - 160, boxHeight)
    .strokeColor(COLORS.muted)
    .lineWidth(0.5)
    .stroke();

  // Summary stats
  const statsY = boxY + 20;
  const colWidth = (PAGE.CONTENT_WIDTH - 160) / 3;

  // Main Amperage
  doc
    .fontSize(FONTS.heading1)
    .fillColor(COLORS.primary)
    .text(`${panel.mainAmperage || 200}A`, PAGE.MARGIN + 80, statsY, {
      width: colWidth,
      align: 'center',
    });
  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.secondary)
    .text('Main Breaker', PAGE.MARGIN + 80, statsY + 24, {
      width: colWidth,
      align: 'center',
    });

  // Total Slots
  doc
    .fontSize(FONTS.heading1)
    .fillColor(COLORS.primary)
    .text(`${panel.totalSlots}`, PAGE.MARGIN + 80 + colWidth, statsY, {
      width: colWidth,
      align: 'center',
    });
  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.secondary)
    .text('Total Slots', PAGE.MARGIN + 80 + colWidth, statsY + 24, {
      width: colWidth,
      align: 'center',
    });

  // Active Circuits
  doc
    .fontSize(FONTS.heading1)
    .fillColor(COLORS.primary)
    .text(`${panel.breakers.length}`, PAGE.MARGIN + 80 + colWidth * 2, statsY, {
      width: colWidth,
      align: 'center',
    });
  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.secondary)
    .text('Active Circuits', PAGE.MARGIN + 80 + colWidth * 2, statsY + 24, {
      width: colWidth,
      align: 'center',
    });

  // Secondary stats row
  const statsY2 = statsY + 60;
  const totalDevices = panel.floors.reduce(
    (sum, floor) => sum + floor.rooms.reduce((s, room) => s + room.devices.length, 0),
    0
  );
  const totalRooms = panel.floors.reduce((sum, floor) => sum + floor.rooms.length, 0);

  doc
    .fontSize(FONTS.heading2)
    .fillColor(COLORS.dark)
    .text(`${panel.floors.length}`, PAGE.MARGIN + 80, statsY2, {
      width: colWidth,
      align: 'center',
    });
  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.secondary)
    .text('Floors', PAGE.MARGIN + 80, statsY2 + 18, {
      width: colWidth,
      align: 'center',
    });

  doc
    .fontSize(FONTS.heading2)
    .fillColor(COLORS.dark)
    .text(`${totalRooms}`, PAGE.MARGIN + 80 + colWidth, statsY2, {
      width: colWidth,
      align: 'center',
    });
  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.secondary)
    .text('Rooms', PAGE.MARGIN + 80 + colWidth, statsY2 + 18, {
      width: colWidth,
      align: 'center',
    });

  doc
    .fontSize(FONTS.heading2)
    .fillColor(COLORS.dark)
    .text(`${totalDevices}`, PAGE.MARGIN + 80 + colWidth * 2, statsY2, {
      width: colWidth,
      align: 'center',
    });
  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.secondary)
    .text('Devices', PAGE.MARGIN + 80 + colWidth * 2, statsY2 + 18, {
      width: colWidth,
      align: 'center',
    });

  // Panel info
  if (panel.brand) {
    doc
      .fontSize(FONTS.body)
      .fillColor(COLORS.secondary)
      .text(`Panel Brand: ${panel.brand}`, PAGE.MARGIN, 450, { align: 'center' });
  }

  // Notes
  if (panel.notes) {
    doc
      .fontSize(FONTS.small)
      .fillColor(COLORS.muted)
      .text(panel.notes, PAGE.MARGIN + 80, 480, {
        width: PAGE.CONTENT_WIDTH - 160,
        align: 'center',
      });
  }

  // Footer
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.muted)
    .text(`Generated on ${date}`, PAGE.MARGIN, PAGE.HEIGHT - 80, { align: 'center' });

  doc.text('circuitmap.com', { align: 'center' });
}

/**
 * Breaker Schedule Table
 */
function addBreakerSchedule(doc: PDFKit.PDFDocument, breakers: Breaker[]): void {
  doc.addPage();

  // Title
  doc
    .fontSize(FONTS.heading1)
    .fillColor(COLORS.dark)
    .text('Breaker Schedule', PAGE.MARGIN, PAGE.MARGIN);

  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.muted)
    .text('Complete list of all circuit breakers in the panel', PAGE.MARGIN, PAGE.MARGIN + 24);

  // Sort breakers by position
  const sortedBreakers = [...breakers].sort((a, b) => {
    const posA = parseInt(a.position.split('-')[0].replace(/[ABab]/g, ''));
    const posB = parseInt(b.position.split('-')[0].replace(/[ABab]/g, ''));
    return posA - posB;
  });

  // Table columns
  const columns = [
    { header: 'Pos', width: 40 },
    { header: 'Amps', width: 45 },
    { header: 'Poles', width: 40 },
    { header: 'Label', width: 160 },
    { header: 'Circuit Type', width: 80 },
    { header: 'Protection', width: 70 },
    { header: 'Status', width: 50 },
  ];

  const tableStartY = PAGE.MARGIN + 60;
  let currentY = tableStartY;

  // Draw header
  doc
    .rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.headerHeight)
    .fillColor(COLORS.dark)
    .fill();

  let headerX = PAGE.MARGIN + TABLE.cellPadding;
  for (const col of columns) {
    doc
      .fontSize(FONTS.small)
      .fillColor(COLORS.white)
      .text(col.header, headerX, currentY + 6, { width: col.width - TABLE.cellPadding * 2 });
    headerX += col.width;
  }

  currentY += TABLE.headerHeight;

  // Draw rows
  for (let i = 0; i < sortedBreakers.length; i++) {
    const breaker = sortedBreakers[i];

    // Check for page break
    if (currentY + TABLE.rowHeight > PAGE.HEIGHT - PAGE.MARGIN - 40) {
      doc.addPage();
      currentY = PAGE.MARGIN;

      // Redraw header on new page
      doc
        .rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.headerHeight)
        .fillColor(COLORS.dark)
        .fill();

      headerX = PAGE.MARGIN + TABLE.cellPadding;
      for (const col of columns) {
        doc
          .fontSize(FONTS.small)
          .fillColor(COLORS.white)
          .text(col.header, headerX, currentY + 6, { width: col.width - TABLE.cellPadding * 2 });
        headerX += col.width;
      }
      currentY += TABLE.headerHeight;
    }

    // Alternate row background
    if (i % 2 === 0) {
      doc
        .rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.rowHeight)
        .fillColor(COLORS.light)
        .fill();
    }

    // Draw row border
    doc
      .rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.rowHeight)
      .strokeColor(COLORS.muted)
      .lineWidth(TABLE.borderWidth)
      .stroke();

    // Row data
    let cellX = PAGE.MARGIN + TABLE.cellPadding;
    const cellY = currentY + 5;
    const effectivePoles = breaker.poles || 1;

    // Position
    doc.fontSize(FONTS.small).fillColor(COLORS.dark).text(breaker.position, cellX, cellY);
    cellX += columns[0].width;

    // Amps
    doc.text(`${breaker.amperage}A`, cellX, cellY);
    cellX += columns[1].width;

    // Poles
    doc.text(effectivePoles.toString(), cellX, cellY);
    cellX += columns[2].width;

    // Label
    doc.text(breaker.label || '-', cellX, cellY, {
      width: columns[3].width - TABLE.cellPadding * 2,
      ellipsis: true,
    });
    cellX += columns[3].width;

    // Circuit Type (with color dot)
    const circuitColor = getCircuitColor(breaker.circuitType);
    doc.circle(cellX + 4, cellY + 4, 4).fillColor(circuitColor).fill();
    doc
      .fillColor(COLORS.dark)
      .text(CIRCUIT_TYPE_LABELS[breaker.circuitType] || breaker.circuitType || '-', cellX + 12, cellY, {
        width: columns[4].width - TABLE.cellPadding * 2 - 12,
      });
    cellX += columns[4].width;

    // Protection
    const protection = PROTECTION_LABELS[breaker.protectionType] || '';
    if (protection) {
      doc.fillColor(COLORS.success).text(protection, cellX, cellY);
    } else {
      doc.fillColor(COLORS.muted).text('-', cellX, cellY);
    }
    cellX += columns[5].width;

    // Status
    doc
      .fillColor(breaker.isOn ? COLORS.success : COLORS.danger)
      .text(breaker.isOn ? 'ON' : 'OFF', cellX, cellY);

    currentY += TABLE.rowHeight;
  }

  // Summary footer
  currentY += SPACING.lg;
  const totalAmps = sortedBreakers.reduce((sum, b) => sum + b.amperage, 0);
  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.secondary)
    .text(`Total Circuits: ${sortedBreakers.length} | Combined Amperage: ${totalAmps}A`, PAGE.MARGIN, currentY);
}

/**
 * Floor Plan Page
 */
function addFloorPlanPage(doc: PDFKit.PDFDocument, floor: FloorWithRooms, imageBuffer: Buffer): void {
  doc.addPage();

  // Title
  doc
    .fontSize(FONTS.heading1)
    .fillColor(COLORS.dark)
    .text(`Floor Plan - ${floor.name}`, PAGE.MARGIN, PAGE.MARGIN);

  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.muted)
    .text(`Level ${floor.level} | ${floor.rooms.length} rooms`, PAGE.MARGIN, PAGE.MARGIN + 24);

  // Floor plan image
  const imageY = PAGE.MARGIN + 60;
  const maxImageWidth = PAGE.CONTENT_WIDTH;
  const maxImageHeight = PAGE.HEIGHT - imageY - PAGE.MARGIN - 80;

  try {
    doc.image(imageBuffer, PAGE.MARGIN, imageY, {
      fit: [maxImageWidth, maxImageHeight],
      align: 'center',
    });
  } catch (err) {
    // If image fails, show placeholder
    doc
      .rect(PAGE.MARGIN, imageY, maxImageWidth, 200)
      .strokeColor(COLORS.muted)
      .lineWidth(1)
      .stroke();
    doc
      .fontSize(FONTS.body)
      .fillColor(COLORS.muted)
      .text('Floor plan image not available', PAGE.MARGIN, imageY + 90, {
        width: maxImageWidth,
        align: 'center',
      });
  }

  // Legend at bottom
  const legendY = PAGE.HEIGHT - PAGE.MARGIN - 50;
  const legendItems = [
    { color: COLORS.circuit.general, label: 'General' },
    { color: COLORS.circuit.lighting, label: 'Lighting' },
    { color: COLORS.circuit.kitchen, label: 'Kitchen' },
    { color: COLORS.circuit.appliance, label: 'Appliance' },
    { color: COLORS.circuit.hvac, label: 'HVAC' },
  ];

  doc.fontSize(FONTS.tiny).fillColor(COLORS.secondary).text('Legend:', PAGE.MARGIN, legendY);

  let legendX = PAGE.MARGIN + 45;
  for (const item of legendItems) {
    doc.circle(legendX, legendY + 4, 4).fillColor(item.color).fill();
    doc.fillColor(COLORS.dark).text(item.label, legendX + 8, legendY);
    legendX += 70;
  }
}

/**
 * Room Details Section
 */
function addRoomDetails(
  doc: PDFKit.PDFDocument,
  room: RoomWithDevices,
  floor: FloorWithRooms,
  breakers: Breaker[]
): void {
  // Check if we need a new page
  const estimatedHeight = 100 + room.devices.length * TABLE.rowHeight;
  if (doc.y + estimatedHeight > PAGE.HEIGHT - PAGE.MARGIN - 40) {
    doc.addPage();
  }

  const startY = doc.y > PAGE.MARGIN + 40 ? doc.y + SPACING.xl : PAGE.MARGIN;

  // Room header
  doc
    .fontSize(FONTS.heading2)
    .fillColor(COLORS.dark)
    .text(room.name, PAGE.MARGIN, startY);

  // Room info
  const totalWattage = room.devices.reduce((sum, d) => sum + (d.estimatedWattage || 0), 0);
  const dimensions = room.width && room.height ? `${room.width}' x ${room.height}'` : 'N/A';

  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.secondary)
    .text(
      `${floor.name} | Dimensions: ${dimensions} | Devices: ${room.devices.length} | Est. Load: ${totalWattage}W`,
      PAGE.MARGIN,
      startY + 18
    );

  // Device table
  const tableY = startY + 40;
  const columns = [
    { header: 'Device', width: 140 },
    { header: 'Type', width: 70 },
    { header: 'Breaker', width: 80 },
    { header: 'Height', width: 60 },
    { header: 'Placement', width: 65 },
    { header: 'Notes', width: 97 },
  ];

  let currentY = tableY;

  // Table header
  doc
    .rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.headerHeight)
    .fillColor(COLORS.secondary)
    .fill();

  let headerX = PAGE.MARGIN + TABLE.cellPadding;
  for (const col of columns) {
    doc
      .fontSize(FONTS.tiny)
      .fillColor(COLORS.white)
      .text(col.header, headerX, currentY + 7);
    headerX += col.width;
  }

  currentY += TABLE.headerHeight;

  // Device rows
  for (let i = 0; i < room.devices.length; i++) {
    const device = room.devices[i];
    const breaker = breakers.find((b) => b.id === device.breakerId);

    // Check for page break
    if (currentY + TABLE.rowHeight > PAGE.HEIGHT - PAGE.MARGIN - 40) {
      doc.addPage();
      currentY = PAGE.MARGIN;
    }

    // Alternate row background
    if (i % 2 === 0) {
      doc
        .rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.rowHeight)
        .fillColor(COLORS.light)
        .fill();
    }

    // Row border
    doc
      .rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.rowHeight)
      .strokeColor(COLORS.muted)
      .lineWidth(TABLE.borderWidth)
      .stroke();

    let cellX = PAGE.MARGIN + TABLE.cellPadding;
    const cellY = currentY + 5;

    // Device name
    doc
      .fontSize(FONTS.tiny)
      .fillColor(COLORS.dark)
      .text(device.description || DEVICE_TYPE_LABELS[device.type] || device.type, cellX, cellY, {
        width: columns[0].width - TABLE.cellPadding * 2,
        ellipsis: true,
      });
    cellX += columns[0].width;

    // Type
    doc.text(DEVICE_TYPE_LABELS[device.type] || device.type, cellX, cellY);
    cellX += columns[1].width;

    // Breaker
    if (breaker) {
      const circuitColor = getCircuitColor(breaker.circuitType);
      doc.circle(cellX + 4, cellY + 4, 3).fillColor(circuitColor).fill();
      doc.fillColor(COLORS.dark).text(`#${breaker.position} ${breaker.amperage}A`, cellX + 10, cellY);
    } else {
      doc.fillColor(COLORS.warning).text('Unassigned', cellX, cellY);
    }
    cellX += columns[2].width;

    // Height
    const height = device.heightFromFloor ? `${device.heightFromFloor}"` : '-';
    doc.fillColor(COLORS.dark).text(height, cellX, cellY);
    cellX += columns[3].width;

    // Placement
    doc.text(PLACEMENT_LABELS[device.placement || ''] || device.placement || '-', cellX, cellY);
    cellX += columns[4].width;

    // Notes (GFCI indicator, etc)
    const notes: string[] = [];
    if (device.isGfciProtected) notes.push('GFCI');
    if (device.estimatedWattage) notes.push(`${device.estimatedWattage}W`);
    doc.text(notes.join(', ') || '-', cellX, cellY, {
      width: columns[5].width - TABLE.cellPadding * 2,
      ellipsis: true,
    });

    currentY += TABLE.rowHeight;
  }

  // Update doc.y for next section
  doc.y = currentY + SPACING.md;
}

/**
 * Circuit Index
 */
function addCircuitIndex(doc: PDFKit.PDFDocument, panel: PanelWithRelations): void {
  doc.addPage();

  // Title
  doc
    .fontSize(FONTS.heading1)
    .fillColor(COLORS.dark)
    .text('Circuit Index', PAGE.MARGIN, PAGE.MARGIN);

  doc
    .fontSize(FONTS.small)
    .fillColor(COLORS.muted)
    .text('Quick reference: Which breaker controls what?', PAGE.MARGIN, PAGE.MARGIN + 24);

  let currentY = PAGE.MARGIN + 60;

  // Build index: breaker -> devices mapping
  const breakerDevices = new Map<string, { breaker: Breaker; devices: Array<{ device: Device; room: string; floor: string }> }>();

  for (const breaker of panel.breakers) {
    breakerDevices.set(breaker.id, { breaker, devices: [] });
  }

  for (const floor of panel.floors) {
    for (const room of floor.rooms) {
      for (const device of room.devices) {
        if (device.breakerId && breakerDevices.has(device.breakerId)) {
          breakerDevices.get(device.breakerId)!.devices.push({
            device,
            room: room.name,
            floor: floor.name,
          });
        }
      }
    }
  }

  // Sort breakers by position
  const sortedEntries = Array.from(breakerDevices.values()).sort((a, b) => {
    const posA = parseInt(a.breaker.position.split('-')[0].replace(/[ABab]/g, ''));
    const posB = parseInt(b.breaker.position.split('-')[0].replace(/[ABab]/g, ''));
    return posA - posB;
  });

  // Print each breaker and its devices
  for (const { breaker, devices } of sortedEntries) {
    // Check for page break
    const entryHeight = 30 + devices.length * 14;
    if (currentY + entryHeight > PAGE.HEIGHT - PAGE.MARGIN - 40) {
      doc.addPage();
      currentY = PAGE.MARGIN;
    }

    // Breaker header
    const circuitColor = getCircuitColor(breaker.circuitType);
    doc.circle(PAGE.MARGIN + 6, currentY + 5, 5).fillColor(circuitColor).fill();

    const poles = breaker.poles && breaker.poles > 1 ? ` ${breaker.poles}-pole` : '';
    doc
      .fontSize(FONTS.body)
      .fillColor(COLORS.dark)
      .text(
        `#${breaker.position} (${breaker.amperage}A${poles}) - ${breaker.label || 'Unlabeled'}`,
        PAGE.MARGIN + 18,
        currentY
      );

    currentY += 18;

    // Devices controlled by this breaker
    if (devices.length > 0) {
      for (const { device, room, floor } of devices) {
        doc
          .fontSize(FONTS.small)
          .fillColor(COLORS.secondary)
          .text(
            `   ${device.description || DEVICE_TYPE_LABELS[device.type] || device.type} - ${room} (${floor})`,
            PAGE.MARGIN + 18,
            currentY
          );
        currentY += 14;
      }
    } else {
      doc
        .fontSize(FONTS.small)
        .fillColor(COLORS.muted)
        .text('   No devices mapped', PAGE.MARGIN + 18, currentY);
      currentY += 14;
    }

    currentY += SPACING.sm;
  }
}

/**
 * Add page numbers
 */
function addPageNumbers(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Skip page number on cover page (page 0)
    if (i === 0) continue;

    doc
      .fontSize(FONTS.tiny)
      .fillColor(COLORS.muted)
      .text(`Page ${i} of ${range.count - 1}`, PAGE.MARGIN, PAGE.HEIGHT - 30, {
        width: PAGE.CONTENT_WIDTH,
        align: 'center',
      });
  }
}
