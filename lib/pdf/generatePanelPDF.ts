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

/**
 * Floor Plan Drawing
 */
function addFloorPlanDrawing(doc: PDFKit.PDFDocument, floor: FloorWithRooms, breakers: Breaker[]): void {
  doc.addPage();

  doc.fontSize(FONTS.heading1).fillColor(COLORS.dark)
    .text(`${floor.name} - Floor Plan`, PAGE.MARGIN, PAGE.MARGIN);

  const totalDevices = (floor.rooms || []).reduce((sum, r) => sum + (r.devices || []).length, 0);
  doc.fontSize(FONTS.small).fillColor(COLORS.muted)
    .text(`Level ${floor.level || 0} | ${(floor.rooms || []).length} rooms | ${totalDevices} devices`,
      PAGE.MARGIN, PAGE.MARGIN + 24);

  const rooms = floor.rooms || [];
  if (rooms.length === 0) return;

  // Build a map of breaker ID to breaker for quick lookup
  const breakerMap = new Map<string, Breaker>();
  for (const b of breakers) {
    breakerMap.set(b.id, b);
  }

  // Collect all breakers used on this floor for the legend
  const floorBreakerIds = new Set<string>();
  for (const room of rooms) {
    for (const device of room.devices || []) {
      if (device.breakerId) {
        floorBreakerIds.add(device.breakerId);
      }
    }
  }

  // First, compute layout positions for rooms that don't have them
  // This mirrors the web app's auto-layout logic
  const roomLayouts: Array<{
    room: RoomWithDevices;
    x: number;
    y: number;
    w: number;
    h: number;
    circuitPositions: string[]; // breaker positions serving this room
  }> = [];

  // Check if any rooms have explicit positions
  const hasPositionedRooms = rooms.some(r =>
    r.positionX !== null && r.positionX !== undefined &&
    r.positionY !== null && r.positionY !== undefined
  );

  if (hasPositionedRooms) {
    // Use existing positions - calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const room of rooms) {
      const rx = room.positionX ?? 0;
      const ry = room.positionY ?? 0;
      const rw = room.width || 10;
      const rh = room.height || 10;
      minX = Math.min(minX, rx);
      minY = Math.min(minY, ry);
      maxX = Math.max(maxX, rx + rw);
      maxY = Math.max(maxY, ry + rh);
    }

    // Normalize positions relative to min
    for (const room of rooms) {
      // Get unique breaker positions for this room
      const roomBreakerPositions = new Set<string>();
      for (const device of room.devices || []) {
        if (device.breakerId) {
          const breaker = breakerMap.get(device.breakerId);
          if (breaker) {
            roomBreakerPositions.add(breaker.position);
          }
        }
      }

      roomLayouts.push({
        room,
        x: (room.positionX ?? 0) - minX,
        y: (room.positionY ?? 0) - minY,
        w: room.width || 10,
        h: room.height || 10,
        circuitPositions: Array.from(roomBreakerPositions).sort((a, b) => {
          const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
          const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
          return numA - numB;
        }),
      });
    }
  } else {
    // Auto-layout: arrange rooms in a grid pattern
    const maxRowWidth = 60; // in feet - max width before wrapping
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0;
    const gap = 2; // 2 feet gap between rooms

    for (const room of rooms) {
      const rw = room.width || 10;
      const rh = room.height || 10;

      // Check if room fits in current row
      if (currentX > 0 && currentX + rw > maxRowWidth) {
        // Move to next row
        currentX = 0;
        currentY += rowHeight + gap;
        rowHeight = 0;
      }

      // Get unique breaker positions for this room
      const roomBreakerPositions = new Set<string>();
      for (const device of room.devices || []) {
        if (device.breakerId) {
          const breaker = breakerMap.get(device.breakerId);
          if (breaker) {
            roomBreakerPositions.add(breaker.position);
          }
        }
      }

      roomLayouts.push({
        room,
        x: currentX,
        y: currentY,
        w: rw,
        h: rh,
        circuitPositions: Array.from(roomBreakerPositions).sort((a, b) => {
          const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
          const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
          return numA - numB;
        }),
      });

      currentX += rw + gap;
      rowHeight = Math.max(rowHeight, rh);
    }
  }

  // Calculate bounds from layouts
  let layoutWidth = 0, layoutHeight = 0;
  for (const layout of roomLayouts) {
    layoutWidth = Math.max(layoutWidth, layout.x + layout.w);
    layoutHeight = Math.max(layoutHeight, layout.y + layout.h);
  }

  // Scale to fit in available space
  const floorPlanWidth = Math.max(layoutWidth, 1);
  const floorPlanHeight = Math.max(layoutHeight, 1);

  const availableWidth = PAGE.CONTENT_WIDTH - 40;
  const availableHeight = 250; // Reduced to make room for better legend
  const scale = Math.min(availableWidth / floorPlanWidth, availableHeight / floorPlanHeight, 15);

  const offsetX = PAGE.MARGIN + 20 + (availableWidth - floorPlanWidth * scale) / 2;
  const offsetY = PAGE.MARGIN + 60;

  // Draw rooms
  for (const layout of roomLayouts) {
    const { room, x: rx, y: ry, w: rw, h: rh, circuitPositions } = layout;

    const screenX = offsetX + rx * scale;
    const screenY = offsetY + ry * scale;
    const screenW = rw * scale;
    const screenH = rh * scale;

    // Room background
    doc.rect(screenX, screenY, screenW, screenH).fillColor('#F8FAFC').fill();
    doc.rect(screenX, screenY, screenW, screenH).strokeColor('#64748B').lineWidth(1.5).stroke();

    // Room name
    doc.fontSize(Math.min(9, screenW / 8)).fillColor(COLORS.dark)
      .text(room.name || 'Room', screenX + 4, screenY + 4, {
        width: screenW - 8,
        height: 12,
        ellipsis: true
      });

    // Room circuit summary (e.g., "Circuits: 3, 7, 15")
    if (circuitPositions.length > 0 && screenH > 30) {
      const circuitText = circuitPositions.length <= 4
        ? `Circuits: ${circuitPositions.join(', ')}`
        : `Circuits: ${circuitPositions.slice(0, 3).join(', ')}...`;
      doc.fontSize(6).fillColor(COLORS.secondary)
        .text(circuitText, screenX + 4, screenY + 14, {
          width: screenW - 8,
          height: 10,
          ellipsis: true
        });
    }

    // Draw devices in room
    const devices = room.devices || [];
    for (const device of devices) {
      const dx = device.positionX ?? (rw / 2);
      const dy = device.positionY ?? (rh / 2);

      const deviceX = screenX + (dx / rw) * screenW;
      const deviceY = screenY + (dy / rh) * screenH;

      // Get breaker for color and label
      const breaker = breakerMap.get(device.breakerId || '');
      const deviceColor = breaker ? getCircuitColor(breaker.circuitType || 'general') : COLORS.muted;

      // Draw device marker
      doc.circle(deviceX, deviceY, 4).fillColor(deviceColor).fill();
      doc.circle(deviceX, deviceY, 4).strokeColor(COLORS.dark).lineWidth(0.5).stroke();

      // Add breaker number label next to device (e.g., "B3")
      if (breaker) {
        const breakerLabel = `B${breaker.position}`;
        doc.fontSize(5).fillColor(COLORS.dark)
          .text(breakerLabel, deviceX + 5, deviceY - 3, { width: 20 });
      }
    }
  }

  // Enhanced legend showing actual breakers on this floor
  const legendY = offsetY + availableHeight + 15;
  doc.fontSize(FONTS.small).fillColor(COLORS.dark).text('Breakers on this floor:', PAGE.MARGIN, legendY);

  // Get breakers used on this floor, sorted by position
  const floorBreakers = Array.from(floorBreakerIds)
    .map(id => breakerMap.get(id))
    .filter((b): b is Breaker => b !== undefined)
    .sort((a, b) => {
      const numA = parseInt(a.position.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.position.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });

  let legendX = PAGE.MARGIN;
  let legendRowY = legendY + 14;
  const legendColWidth = PAGE.CONTENT_WIDTH / 3;

  if (floorBreakers.length === 0) {
    doc.fontSize(FONTS.tiny).fillColor(COLORS.muted)
      .text('No devices assigned to breakers', legendX, legendRowY);
    legendRowY += 14;
  } else {
    let colIndex = 0;
    for (const breaker of floorBreakers) {
      const color = getCircuitColor(breaker.circuitType || 'general');
      const x = PAGE.MARGIN + (colIndex % 3) * legendColWidth;
      const y = legendRowY + Math.floor(colIndex / 3) * 12;

      // Check if we need to wrap to a new set of rows
      if (y > legendY + 60) break; // Limit legend height

      doc.circle(x + 4, y + 4, 3).fillColor(color).fill();

      const label = breaker.label
        ? `B${breaker.position} - ${breaker.label.substring(0, 18)}${breaker.label.length > 18 ? '...' : ''}`
        : `B${breaker.position} (${breaker.amperage}A)`;
      doc.fontSize(FONTS.tiny).fillColor(COLORS.dark)
        .text(label, x + 10, y, { width: legendColWidth - 15, ellipsis: true });

      colIndex++;
    }
    legendRowY += Math.ceil(Math.min(floorBreakers.length, 9) / 3) * 12 + 8;
  }

  // Add unassigned indicator if any devices are unassigned
  const hasUnassigned = rooms.some(r => (r.devices || []).some(d => !d.breakerId));
  if (hasUnassigned) {
    doc.circle(PAGE.MARGIN + 4, legendRowY + 4, 3).fillColor(COLORS.muted).fill();
    doc.fontSize(FONTS.tiny).fillColor(COLORS.dark)
      .text('Unassigned devices', PAGE.MARGIN + 10, legendRowY);
    legendRowY += 14;
  }

  // Room details table below floor plan
  const tableY = legendRowY + 10;
  doc.fontSize(FONTS.heading2).fillColor(COLORS.dark).text('Room Details', PAGE.MARGIN, tableY);

  let currentY = tableY + 20;

  for (const room of rooms) {
    const devices = room.devices || [];
    if (devices.length === 0) continue;

    // Check for page break
    if (currentY + 60 + devices.length * 14 > PAGE.HEIGHT - PAGE.MARGIN - 30) {
      doc.addPage();
      currentY = PAGE.MARGIN;
    }

    // Room header with circuit summary
    const totalWattage = devices.reduce((sum, d) => sum + (d.estimatedWattage || 0), 0);
    const roomBreakerPositions = new Set<string>();
    for (const device of devices) {
      if (device.breakerId) {
        const breaker = breakerMap.get(device.breakerId);
        if (breaker) roomBreakerPositions.add(breaker.position);
      }
    }
    const circuitSummary = roomBreakerPositions.size > 0
      ? `Circuits: ${Array.from(roomBreakerPositions).sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}`
      : 'No circuits assigned';

    doc.fontSize(FONTS.body).fillColor(COLORS.dark)
      .text(`${room.name}`, PAGE.MARGIN, currentY);
    doc.fontSize(FONTS.tiny).fillColor(COLORS.secondary)
      .text(`${devices.length} devices | ${totalWattage}W | ${circuitSummary}`, PAGE.MARGIN + 120, currentY + 1);

    currentY += 16;

    // Device list
    for (const device of devices) {
      const breaker = breakerMap.get(device.breakerId || '');
      const circuitColor = breaker ? getCircuitColor(breaker.circuitType || 'general') : COLORS.muted;

      doc.circle(PAGE.MARGIN + 5, currentY + 4, 3).fillColor(circuitColor).fill();

      const deviceName = device.description || DEVICE_TYPE_LABELS[device.type] || device.type;
      const breakerInfo = breaker ? `B${breaker.position} (${breaker.amperage}A)` : 'Unassigned';

      doc.fontSize(FONTS.tiny).fillColor(COLORS.dark)
        .text(deviceName, PAGE.MARGIN + 14, currentY, { width: 150, ellipsis: true });
      doc.text(DEVICE_TYPE_LABELS[device.type] || device.type, PAGE.MARGIN + 170, currentY);
      doc.fillColor(breaker ? COLORS.dark : COLORS.muted)
        .text(breakerInfo, PAGE.MARGIN + 260, currentY);

      if (device.heightFromFloor) {
        doc.fillColor(COLORS.dark).text(`${device.heightFromFloor}"`, PAGE.MARGIN + 360, currentY);
      }

      currentY += 14;
    }

    currentY += 10;
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
