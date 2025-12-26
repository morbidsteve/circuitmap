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
  floorImages?: Map<string, Buffer>;
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
  const { panel } = data;
  const { includeCircuitIndex = true } = options;

  if (!panel || !panel.name) {
    throw new Error('Invalid panel data');
  }

  const doc = new PDFDocument({
    size: 'LETTER',
    margin: PAGE.MARGIN,
    autoFirstPage: true,
    bufferPages: true,
    info: {
      Title: `CircuitMap - ${panel.name}`,
      Author: 'CircuitMap',
      Subject: 'Electrical Panel Report',
      Creator: 'CircuitMap (https://circuitmap.com)',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  // Build PDF sections
  try {
    addCoverPage(doc, panel);
    addBreakerSchedule(doc, panel.breakers || []);

    // Add visual panel diagram
    addPanelDiagram(doc, panel);

    // Add floor plans with room layouts
    const floors = panel.floors || [];
    const sortedFloors = [...floors].sort((a, b) => (b.level || 0) - (a.level || 0));

    for (const floor of sortedFloors) {
      if (floor.rooms && floor.rooms.length > 0) {
        addFloorPlanDrawing(doc, floor, panel.breakers || []);
      }
    }

    // Add circuit index at the end
    if (includeCircuitIndex) {
      addCircuitIndex(doc, panel);
    }

    addPageNumbers(doc);
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }

  doc.end();

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
    .strokeColor(COLORS.muted)
    .lineWidth(1)
    .stroke();

  // Panel name
  doc
    .fontSize(FONTS.heading1)
    .fillColor(COLORS.dark)
    .text(panel.name, PAGE.MARGIN, 200, { align: 'center' });

  if (panel.address) {
    doc
      .fontSize(FONTS.body)
      .fillColor(COLORS.secondary)
      .text(panel.address, { align: 'center' });
  }

  // Panel summary box
  const boxY = 280;
  const boxHeight = 120;
  const boxX = PAGE.MARGIN + 60;
  const boxWidth = PAGE.CONTENT_WIDTH - 120;

  doc.rect(boxX, boxY, boxWidth, boxHeight).fillColor(COLORS.light).fill();
  doc.rect(boxX, boxY, boxWidth, boxHeight).strokeColor(COLORS.muted).lineWidth(0.5).stroke();

  const statsY = boxY + 20;
  const colWidth = boxWidth / 3;

  // Stats row 1
  doc.fontSize(FONTS.heading1).fillColor(COLORS.primary)
    .text(`${panel.mainAmperage || 200}A`, boxX, statsY, { width: colWidth, align: 'center' });
  doc.fontSize(FONTS.small).fillColor(COLORS.secondary)
    .text('Main Breaker', boxX, statsY + 24, { width: colWidth, align: 'center' });

  doc.fontSize(FONTS.heading1).fillColor(COLORS.primary)
    .text(`${panel.totalSlots}`, boxX + colWidth, statsY, { width: colWidth, align: 'center' });
  doc.fontSize(FONTS.small).fillColor(COLORS.secondary)
    .text('Total Slots', boxX + colWidth, statsY + 24, { width: colWidth, align: 'center' });

  doc.fontSize(FONTS.heading1).fillColor(COLORS.primary)
    .text(`${(panel.breakers || []).length}`, boxX + colWidth * 2, statsY, { width: colWidth, align: 'center' });
  doc.fontSize(FONTS.small).fillColor(COLORS.secondary)
    .text('Active Circuits', boxX + colWidth * 2, statsY + 24, { width: colWidth, align: 'center' });

  // Stats row 2
  const statsY2 = statsY + 60;
  const totalDevices = (panel.floors || []).reduce(
    (sum, floor) => sum + (floor.rooms || []).reduce((s, room) => s + (room.devices || []).length, 0),
    0
  );
  const totalRooms = (panel.floors || []).reduce((sum, floor) => sum + (floor.rooms || []).length, 0);

  doc.fontSize(FONTS.heading2).fillColor(COLORS.dark)
    .text(`${(panel.floors || []).length}`, boxX, statsY2, { width: colWidth, align: 'center' });
  doc.fontSize(FONTS.small).fillColor(COLORS.secondary)
    .text('Floors', boxX, statsY2 + 18, { width: colWidth, align: 'center' });

  doc.fontSize(FONTS.heading2).fillColor(COLORS.dark)
    .text(`${totalRooms}`, boxX + colWidth, statsY2, { width: colWidth, align: 'center' });
  doc.fontSize(FONTS.small).fillColor(COLORS.secondary)
    .text('Rooms', boxX + colWidth, statsY2 + 18, { width: colWidth, align: 'center' });

  doc.fontSize(FONTS.heading2).fillColor(COLORS.dark)
    .text(`${totalDevices}`, boxX + colWidth * 2, statsY2, { width: colWidth, align: 'center' });
  doc.fontSize(FONTS.small).fillColor(COLORS.secondary)
    .text('Devices', boxX + colWidth * 2, statsY2 + 18, { width: colWidth, align: 'center' });

  // Panel brand
  if (panel.brand) {
    doc.fontSize(FONTS.body).fillColor(COLORS.secondary)
      .text(`Panel Brand: ${panel.brand}`, PAGE.MARGIN, 450, { align: 'center' });
  }

  // Footer
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.fontSize(FONTS.small).fillColor(COLORS.muted)
    .text(`Generated on ${date}`, PAGE.MARGIN, PAGE.HEIGHT - 80, { align: 'center' });
  doc.text('circuitmap.com', { align: 'center' });
}

/**
 * Visual Panel Diagram
 */
function addPanelDiagram(doc: PDFKit.PDFDocument, panel: PanelWithRelations): void {
  doc.addPage();

  doc.fontSize(FONTS.heading1).fillColor(COLORS.dark)
    .text('Panel Layout', PAGE.MARGIN, PAGE.MARGIN);
  doc.fontSize(FONTS.small).fillColor(COLORS.muted)
    .text('Visual representation of your electrical panel', PAGE.MARGIN, PAGE.MARGIN + 24);

  const breakers = panel.breakers || [];
  const sortedBreakers = [...breakers].sort((a, b) => {
    const posA = parseInt(a.position.split('-')[0].replace(/[ABab]/g, '')) || 0;
    const posB = parseInt(b.position.split('-')[0].replace(/[ABab]/g, '')) || 0;
    return posA - posB;
  });

  // Panel box dimensions
  const panelX = PAGE.MARGIN + 50;
  const panelY = PAGE.MARGIN + 70;
  const panelWidth = PAGE.CONTENT_WIDTH - 100;
  const panelHeight = 400;
  const slotHeight = panelHeight / Math.ceil((panel.totalSlots || 40) / 2);
  const columnWidth = (panelWidth - 40) / 2;

  // Draw panel box
  doc.rect(panelX, panelY, panelWidth, panelHeight)
    .fillColor('#1E293B')
    .fill();
  doc.rect(panelX, panelY, panelWidth, panelHeight)
    .strokeColor('#475569')
    .lineWidth(2)
    .stroke();

  // Main breaker at top
  doc.rect(panelX + 20, panelY + 10, panelWidth - 40, 25)
    .fillColor('#334155')
    .fill();
  doc.fontSize(FONTS.small).fillColor(COLORS.white)
    .text(`MAIN ${panel.mainAmperage || 200}A`, panelX + 20, panelY + 16, {
      width: panelWidth - 40,
      align: 'center'
    });

  // Center bus bar
  doc.rect(panelX + panelWidth / 2 - 5, panelY + 40, 10, panelHeight - 50)
    .fillColor('#0F172A')
    .fill();

  // Draw breaker positions
  const breakerMap = new Map<string, Breaker>();
  for (const b of sortedBreakers) {
    breakerMap.set(b.position, b);
  }

  const totalSlots = panel.totalSlots || 40;
  const slotsPerSide = Math.ceil(totalSlots / 2);
  const startY = panelY + 45;

  for (let i = 0; i < slotsPerSide; i++) {
    const leftPos = (i * 2 + 1).toString();
    const rightPos = (i * 2 + 2).toString();
    const y = startY + i * slotHeight;

    // Left side (odd positions)
    const leftBreaker = breakerMap.get(leftPos) ||
      [...breakerMap.values()].find(b => b.position.startsWith(leftPos));
    drawBreakerSlot(doc, panelX + 20, y, columnWidth, slotHeight - 2, leftBreaker, leftPos);

    // Right side (even positions)
    const rightBreaker = breakerMap.get(rightPos) ||
      [...breakerMap.values()].find(b => b.position.startsWith(rightPos));
    drawBreakerSlot(doc, panelX + panelWidth / 2 + 10, y, columnWidth, slotHeight - 2, rightBreaker, rightPos);
  }

  // Legend
  const legendY = panelY + panelHeight + 20;
  doc.fontSize(FONTS.small).fillColor(COLORS.dark).text('Legend:', PAGE.MARGIN, legendY);

  const legendItems = [
    { color: COLORS.circuit.general, label: 'General' },
    { color: COLORS.circuit.lighting, label: 'Lighting' },
    { color: COLORS.circuit.kitchen, label: 'Kitchen' },
    { color: COLORS.circuit.appliance, label: 'Appliance' },
    { color: COLORS.circuit.hvac, label: 'HVAC' },
  ];

  let legendX = PAGE.MARGIN + 50;
  for (const item of legendItems) {
    doc.rect(legendX, legendY, 12, 12).fillColor(item.color).fill();
    doc.fontSize(FONTS.tiny).fillColor(COLORS.dark).text(item.label, legendX + 16, legendY + 2);
    legendX += 80;
  }
}

function drawBreakerSlot(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  breaker: Breaker | undefined,
  position: string
): void {
  if (breaker) {
    const color = getCircuitColor(breaker.circuitType || 'general');
    doc.rect(x, y, width, height).fillColor(color).fill();
    doc.rect(x, y, width, height).strokeColor('#475569').lineWidth(0.5).stroke();

    // Position number
    doc.fontSize(7).fillColor(COLORS.white)
      .text(breaker.position, x + 2, y + 2, { width: 20 });

    // Amperage
    doc.fontSize(8).fillColor(COLORS.white)
      .text(`${breaker.amperage}A`, x + width - 25, y + 2, { width: 22, align: 'right' });

    // Label (truncated)
    if (breaker.label && height > 12) {
      const label = breaker.label.length > 15 ? breaker.label.substring(0, 14) + '...' : breaker.label;
      doc.fontSize(6).fillColor(COLORS.white)
        .text(label, x + 2, y + height - 10, { width: width - 4 });
    }
  } else {
    // Empty slot
    doc.rect(x, y, width, height).fillColor('#374151').fill();
    doc.rect(x, y, width, height).strokeColor('#4B5563').lineWidth(0.5).stroke();
    doc.fontSize(7).fillColor('#6B7280').text(position, x + 2, y + (height / 2) - 4);
  }
}

// Device type symbols for schematic view
const DEVICE_SYMBOLS: Record<string, string> = {
  outlet: '⊡',
  light: '☀',
  switch: '◐',
  fan: '❋',
  appliance: '▣',
  hvac: '❄',
  water_heater: '♨',
  dryer: '◎',
  range: '⬡',
  ev_charger: '⚡',
  pool: '≋',
  smoke_detector: '◉',
  other: '○',
};

/**
 * Floor Plan - Schematic Room View
 * Shows a clear, readable room-by-room breakdown with device listings
 */
function addFloorPlanDrawing(doc: PDFKit.PDFDocument, floor: FloorWithRooms, breakers: Breaker[]): void {
  doc.addPage();

  doc.fontSize(FONTS.heading1).fillColor(COLORS.dark)
    .text(`${floor.name}`, PAGE.MARGIN, PAGE.MARGIN);

  const totalDevices = (floor.rooms || []).reduce((sum, r) => sum + (r.devices || []).length, 0);
  doc.fontSize(FONTS.small).fillColor(COLORS.muted)
    .text(`Level ${floor.level || 0} · ${(floor.rooms || []).length} rooms · ${totalDevices} devices`,
      PAGE.MARGIN, PAGE.MARGIN + 22);

  const rooms = floor.rooms || [];
  if (rooms.length === 0) {
    doc.fontSize(FONTS.body).fillColor(COLORS.muted)
      .text('No rooms configured for this floor', PAGE.MARGIN, PAGE.MARGIN + 60);
    return;
  }

  // Build a map of breaker ID to breaker for quick lookup
  const breakerMap = new Map<string, Breaker>();
  for (const b of breakers) {
    breakerMap.set(b.id, b);
  }

  // Collect all breakers used on this floor
  const floorBreakerIds = new Set<string>();
  for (const room of rooms) {
    for (const device of room.devices || []) {
      if (device.breakerId) {
        floorBreakerIds.add(device.breakerId);
      }
    }
  }

  // Get breakers used on this floor, sorted by position
  const floorBreakers = Array.from(floorBreakerIds)
    .map(id => breakerMap.get(id))
    .filter((b): b is Breaker => b !== undefined)
    .sort((a, b) => {
      const numA = parseInt(a.position.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.position.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });

  // Breaker summary at top
  let currentY = PAGE.MARGIN + 45;

  if (floorBreakers.length > 0) {
    doc.fontSize(FONTS.small).fillColor(COLORS.dark)
      .text('Breakers serving this floor:', PAGE.MARGIN, currentY);
    currentY += 14;

    // Show breakers in a compact format
    const breakerSummaries: string[] = [];
    for (const breaker of floorBreakers) {
      const label = breaker.label ? breaker.label : `${breaker.amperage}A`;
      breakerSummaries.push(`#${breaker.position} ${label}`);
    }

    // Wrap breaker list
    const breakerText = breakerSummaries.join('  ·  ');
    doc.fontSize(FONTS.tiny).fillColor(COLORS.secondary)
      .text(breakerText, PAGE.MARGIN, currentY, { width: PAGE.CONTENT_WIDTH });
    currentY += doc.heightOfString(breakerText, { width: PAGE.CONTENT_WIDTH }) + 15;
  } else {
    currentY += 10;
  }

  // Draw horizontal divider
  doc.moveTo(PAGE.MARGIN, currentY)
    .lineTo(PAGE.WIDTH - PAGE.MARGIN, currentY)
    .strokeColor(COLORS.muted)
    .lineWidth(0.5)
    .stroke();
  currentY += 15;

  // Room-by-room schematic view
  for (const room of rooms) {
    const devices = room.devices || [];

    // Calculate room box height
    const headerHeight = 24;
    const deviceRowHeight = 16;
    const roomPadding = 10;
    const minRoomHeight = headerHeight + roomPadding;
    const roomHeight = devices.length > 0
      ? headerHeight + (devices.length * deviceRowHeight) + roomPadding
      : minRoomHeight + 20;

    // Check for page break
    if (currentY + roomHeight > PAGE.HEIGHT - PAGE.MARGIN - 30) {
      doc.addPage();
      currentY = PAGE.MARGIN;

      // Repeat floor header on new page
      doc.fontSize(FONTS.heading2).fillColor(COLORS.dark)
        .text(`${floor.name} (continued)`, PAGE.MARGIN, currentY);
      currentY += 25;
    }

    // Get circuits serving this room
    const roomBreakerPositions = new Set<string>();
    for (const device of devices) {
      if (device.breakerId) {
        const breaker = breakerMap.get(device.breakerId);
        if (breaker) roomBreakerPositions.add(breaker.position);
      }
    }
    const sortedCircuits = Array.from(roomBreakerPositions).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });

    // Room box
    const roomBoxX = PAGE.MARGIN;
    const roomBoxWidth = PAGE.CONTENT_WIDTH;

    // Room background
    doc.rect(roomBoxX, currentY, roomBoxWidth, roomHeight)
      .fillColor('#F8FAFC')
      .fill();
    doc.rect(roomBoxX, currentY, roomBoxWidth, roomHeight)
      .strokeColor('#CBD5E1')
      .lineWidth(1)
      .stroke();

    // Room header bar
    doc.rect(roomBoxX, currentY, roomBoxWidth, headerHeight)
      .fillColor('#E2E8F0')
      .fill();

    // Room name
    doc.fontSize(FONTS.body).fillColor(COLORS.dark)
      .text(room.name || 'Unnamed Room', roomBoxX + 8, currentY + 6);

    // Circuit badges in header
    if (sortedCircuits.length > 0) {
      const circuitText = `Circuits: ${sortedCircuits.join(', ')}`;
      doc.fontSize(FONTS.tiny).fillColor(COLORS.secondary)
        .text(circuitText, roomBoxX + roomBoxWidth - 150, currentY + 8, {
          width: 142,
          align: 'right'
        });
    }

    // Device count badge
    const deviceCountX = roomBoxX + 200;
    doc.fontSize(FONTS.tiny).fillColor(COLORS.muted)
      .text(`${devices.length} device${devices.length !== 1 ? 's' : ''}`, deviceCountX, currentY + 8);

    const deviceStartY = currentY + headerHeight + 4;

    if (devices.length === 0) {
      doc.fontSize(FONTS.small).fillColor(COLORS.muted)
        .text('No devices in this room', roomBoxX + 8, deviceStartY + 2);
    } else {
      // Column headers
      const colX = {
        symbol: roomBoxX + 8,
        description: roomBoxX + 28,
        type: roomBoxX + 220,
        breaker: roomBoxX + 310,
        location: roomBoxX + 400,
      };

      // Device rows
      let deviceY = deviceStartY;
      for (const device of devices) {
        const breaker = breakerMap.get(device.breakerId || '');
        const circuitColor = breaker ? getCircuitColor(breaker.circuitType || 'general') : COLORS.muted;

        // Device symbol with circuit color background
        const symbol = DEVICE_SYMBOLS[device.type] || DEVICE_SYMBOLS.other;
        doc.circle(colX.symbol + 6, deviceY + 6, 7)
          .fillColor(circuitColor)
          .fill();
        doc.fontSize(9).fillColor(COLORS.white)
          .text(symbol, colX.symbol, deviceY + 1, { width: 14, align: 'center' });

        // Description
        const deviceName = device.description || DEVICE_TYPE_LABELS[device.type] || device.type;
        doc.fontSize(FONTS.small).fillColor(COLORS.dark)
          .text(deviceName, colX.description, deviceY + 2, { width: 185, ellipsis: true });

        // Device type
        const typeLabel = DEVICE_TYPE_LABELS[device.type] || device.type;
        doc.fontSize(FONTS.tiny).fillColor(COLORS.secondary)
          .text(typeLabel, colX.type, deviceY + 3, { width: 80, ellipsis: true });

        // Breaker info
        if (breaker) {
          const breakerLabel = `#${breaker.position} · ${breaker.amperage}A`;
          doc.fontSize(FONTS.tiny).fillColor(COLORS.dark)
            .text(breakerLabel, colX.breaker, deviceY + 3, { width: 80 });
        } else {
          doc.fontSize(FONTS.tiny).fillColor(COLORS.muted)
            .text('Unassigned', colX.breaker, deviceY + 3);
        }

        // Placement info
        if (device.placement || device.heightFromFloor) {
          const placementText = device.heightFromFloor
            ? `${PLACEMENT_LABELS[device.placement] || device.placement} · ${device.heightFromFloor}"`
            : PLACEMENT_LABELS[device.placement] || device.placement;
          doc.fontSize(FONTS.tiny).fillColor(COLORS.muted)
            .text(placementText, colX.location, deviceY + 3, { width: 100, ellipsis: true });
        }

        deviceY += deviceRowHeight;
      }
    }

    currentY += roomHeight + 10;
  }

  // Legend at bottom of last page (if there's room)
  if (currentY < PAGE.HEIGHT - 100) {
    currentY += 10;
    doc.moveTo(PAGE.MARGIN, currentY)
      .lineTo(PAGE.WIDTH - PAGE.MARGIN, currentY)
      .strokeColor(COLORS.muted)
      .lineWidth(0.5)
      .stroke();
    currentY += 12;

    doc.fontSize(FONTS.small).fillColor(COLORS.dark)
      .text('Device Symbols:', PAGE.MARGIN, currentY);
    currentY += 14;

    // Symbol legend in columns
    const symbolLegend = [
      { symbol: '⊡', label: 'Outlet' },
      { symbol: '☀', label: 'Light' },
      { symbol: '◐', label: 'Switch' },
      { symbol: '❋', label: 'Fan' },
      { symbol: '▣', label: 'Appliance' },
      { symbol: '❄', label: 'HVAC' },
    ];

    let legendX = PAGE.MARGIN;
    for (const item of symbolLegend) {
      doc.fontSize(10).fillColor(COLORS.muted).text(item.symbol, legendX, currentY);
      doc.fontSize(FONTS.tiny).fillColor(COLORS.secondary).text(item.label, legendX + 14, currentY + 2);
      legendX += 75;
    }

    currentY += 18;
    doc.fontSize(FONTS.tiny).fillColor(COLORS.muted)
      .text('Symbol colors indicate the circuit type of the connected breaker.', PAGE.MARGIN, currentY);
  }
}

/**
 * Breaker Schedule Table
 */
function addBreakerSchedule(doc: PDFKit.PDFDocument, breakers: Breaker[]): void {
  doc.addPage();

  doc.fontSize(FONTS.heading1).fillColor(COLORS.dark)
    .text('Breaker Schedule', PAGE.MARGIN, PAGE.MARGIN);
  doc.fontSize(FONTS.small).fillColor(COLORS.muted)
    .text('Complete list of all circuit breakers', PAGE.MARGIN, PAGE.MARGIN + 24);

  if (breakers.length === 0) {
    doc.fontSize(FONTS.body).fillColor(COLORS.muted)
      .text('No breakers configured', PAGE.MARGIN, PAGE.MARGIN + 60);
    return;
  }

  const sortedBreakers = [...breakers].sort((a, b) => {
    const posA = parseInt(a.position.split('-')[0].replace(/[ABab]/g, '')) || 0;
    const posB = parseInt(b.position.split('-')[0].replace(/[ABab]/g, '')) || 0;
    return posA - posB;
  });

  const columns = [
    { header: 'Pos', width: 40 },
    { header: 'Amps', width: 45 },
    { header: 'Poles', width: 40 },
    { header: 'Label', width: 160 },
    { header: 'Circuit Type', width: 85 },
    { header: 'Protection', width: 70 },
    { header: 'Status', width: 50 },
  ];

  let currentY = PAGE.MARGIN + 60;

  // Header
  doc.rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.headerHeight)
    .fillColor(COLORS.dark).fill();

  let headerX = PAGE.MARGIN + TABLE.cellPadding;
  for (const col of columns) {
    doc.fontSize(FONTS.small).fillColor(COLORS.white)
      .text(col.header, headerX, currentY + 6, { width: col.width - TABLE.cellPadding * 2 });
    headerX += col.width;
  }
  currentY += TABLE.headerHeight;

  // Rows
  for (let i = 0; i < sortedBreakers.length; i++) {
    const breaker = sortedBreakers[i];

    if (currentY + TABLE.rowHeight > PAGE.HEIGHT - PAGE.MARGIN - 40) {
      doc.addPage();
      currentY = PAGE.MARGIN;

      doc.rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.headerHeight)
        .fillColor(COLORS.dark).fill();
      headerX = PAGE.MARGIN + TABLE.cellPadding;
      for (const col of columns) {
        doc.fontSize(FONTS.small).fillColor(COLORS.white)
          .text(col.header, headerX, currentY + 6, { width: col.width - TABLE.cellPadding * 2 });
        headerX += col.width;
      }
      currentY += TABLE.headerHeight;
    }

    if (i % 2 === 0) {
      doc.rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.rowHeight)
        .fillColor(COLORS.light).fill();
    }

    doc.rect(PAGE.MARGIN, currentY, PAGE.CONTENT_WIDTH, TABLE.rowHeight)
      .strokeColor(COLORS.muted).lineWidth(TABLE.borderWidth).stroke();

    let cellX = PAGE.MARGIN + TABLE.cellPadding;
    const cellY = currentY + 5;

    doc.fontSize(FONTS.small).fillColor(COLORS.dark).text(breaker.position, cellX, cellY);
    cellX += columns[0].width;

    doc.text(`${breaker.amperage}A`, cellX, cellY);
    cellX += columns[1].width;

    doc.text((breaker.poles || 1).toString(), cellX, cellY);
    cellX += columns[2].width;

    doc.text(breaker.label || '-', cellX, cellY, {
      width: columns[3].width - TABLE.cellPadding * 2,
      ellipsis: true,
    });
    cellX += columns[3].width;

    const circuitColor = getCircuitColor(breaker.circuitType || 'general');
    doc.circle(cellX + 4, cellY + 4, 4).fillColor(circuitColor).fill();
    doc.fillColor(COLORS.dark)
      .text(CIRCUIT_TYPE_LABELS[breaker.circuitType || ''] || breaker.circuitType || '-', cellX + 12, cellY);
    cellX += columns[4].width;

    const protection = PROTECTION_LABELS[breaker.protectionType || ''] || '';
    doc.fillColor(protection ? COLORS.success : COLORS.muted).text(protection || '-', cellX, cellY);
    cellX += columns[5].width;

    doc.fillColor(breaker.isOn !== false ? COLORS.success : COLORS.danger)
      .text(breaker.isOn !== false ? 'ON' : 'OFF', cellX, cellY);

    currentY += TABLE.rowHeight;
  }

  currentY += SPACING.lg;
  const totalAmps = sortedBreakers.reduce((sum, b) => sum + (b.amperage || 0), 0);
  doc.fontSize(FONTS.small).fillColor(COLORS.secondary)
    .text(`Total Circuits: ${sortedBreakers.length} | Combined Amperage: ${totalAmps}A`, PAGE.MARGIN, currentY);
}

/**
 * Circuit Index
 */
function addCircuitIndex(doc: PDFKit.PDFDocument, panel: PanelWithRelations): void {
  doc.addPage();

  doc.fontSize(FONTS.heading1).fillColor(COLORS.dark)
    .text('Circuit Index', PAGE.MARGIN, PAGE.MARGIN);
  doc.fontSize(FONTS.small).fillColor(COLORS.muted)
    .text('Quick reference: Which breaker controls what?', PAGE.MARGIN, PAGE.MARGIN + 24);

  let currentY = PAGE.MARGIN + 60;

  const breakers = panel.breakers || [];
  const floors = panel.floors || [];

  // Build breaker -> devices mapping
  const breakerDevices = new Map<string, { breaker: Breaker; devices: Array<{ device: Device; room: string; floor: string }> }>();

  for (const breaker of breakers) {
    breakerDevices.set(breaker.id, { breaker, devices: [] });
  }

  for (const floor of floors) {
    for (const room of floor.rooms || []) {
      for (const device of room.devices || []) {
        if (device.breakerId && breakerDevices.has(device.breakerId)) {
          breakerDevices.get(device.breakerId)!.devices.push({
            device,
            room: room.name || 'Unknown Room',
            floor: floor.name || 'Unknown Floor',
          });
        }
      }
    }
  }

  const sortedEntries = Array.from(breakerDevices.values()).sort((a, b) => {
    const posA = parseInt(a.breaker.position.split('-')[0].replace(/[ABab]/g, '')) || 0;
    const posB = parseInt(b.breaker.position.split('-')[0].replace(/[ABab]/g, '')) || 0;
    return posA - posB;
  });

  for (const { breaker, devices } of sortedEntries) {
    const entryHeight = 24 + Math.max(devices.length, 1) * 14;

    if (currentY + entryHeight > PAGE.HEIGHT - PAGE.MARGIN - 40) {
      doc.addPage();
      currentY = PAGE.MARGIN;
    }

    const circuitColor = getCircuitColor(breaker.circuitType || 'general');
    doc.circle(PAGE.MARGIN + 6, currentY + 5, 5).fillColor(circuitColor).fill();

    const poles = breaker.poles && breaker.poles > 1 ? ` ${breaker.poles}-pole` : '';
    doc.fontSize(FONTS.body).fillColor(COLORS.dark)
      .text(`#${breaker.position} (${breaker.amperage}A${poles}) - ${breaker.label || 'Unlabeled'}`,
        PAGE.MARGIN + 18, currentY);

    currentY += 18;

    if (devices.length > 0) {
      for (const { device, room, floor } of devices) {
        const deviceName = device.description || DEVICE_TYPE_LABELS[device.type] || device.type;
        doc.fontSize(FONTS.small).fillColor(COLORS.secondary)
          .text(`    ${deviceName} - ${room} (${floor})`, PAGE.MARGIN + 18, currentY);
        currentY += 14;
      }
    } else {
      doc.fontSize(FONTS.small).fillColor(COLORS.muted)
        .text('    No devices mapped', PAGE.MARGIN + 18, currentY);
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
    if (i === 0) continue;
    doc.fontSize(FONTS.tiny).fillColor(COLORS.muted)
      .text(`Page ${i} of ${range.count - 1}`, PAGE.MARGIN, PAGE.HEIGHT - 30, {
        width: PAGE.CONTENT_WIDTH,
        align: 'center',
      });
  }
}
