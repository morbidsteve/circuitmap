import Konva from 'konva';

/**
 * Export a Konva Stage to a data URL (PNG)
 */
export function stageToDataURL(
  stage: Konva.Stage,
  options: {
    pixelRatio?: number;
    mimeType?: string;
    quality?: number;
    width?: number;
    height?: number;
  } = {}
): string {
  const {
    pixelRatio = 2, // Higher quality for PDF
    mimeType = 'image/png',
    quality = 1,
  } = options;

  return stage.toDataURL({
    pixelRatio,
    mimeType,
    quality,
  });
}

/**
 * Export a Konva Stage to a Blob
 */
export async function stageToBlob(
  stage: Konva.Stage,
  options: {
    pixelRatio?: number;
    mimeType?: string;
    quality?: number;
  } = {}
): Promise<Blob> {
  const {
    pixelRatio = 2,
    mimeType = 'image/png',
    quality = 1,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      stage.toBlob({
        pixelRatio,
        mimeType,
        quality,
        callback: (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from stage'));
          }
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert a Blob to a data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Capture multiple Konva stages (one per floor) for PDF export
 */
export interface FloorCanvasCapture {
  floorId: string;
  imageDataUrl: string;
}

export async function captureFloorCanvases(
  stageRefs: Map<string, React.RefObject<Konva.Stage | null>>
): Promise<FloorCanvasCapture[]> {
  const captures: FloorCanvasCapture[] = [];

  for (const [floorId, stageRef] of stageRefs.entries()) {
    if (stageRef.current) {
      try {
        const dataUrl = stageToDataURL(stageRef.current, { pixelRatio: 2 });
        captures.push({
          floorId,
          imageDataUrl: dataUrl,
        });
      } catch (error) {
        console.warn(`Failed to capture floor ${floorId}:`, error);
      }
    }
  }

  return captures;
}

/**
 * Simple download helper for data URLs
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download a Blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
