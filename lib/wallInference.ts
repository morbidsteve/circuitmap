import { Device } from '@/types/panel'

export type WallDirection = 'north' | 'south' | 'east' | 'west'

export interface WallInfo {
  wall: WallDirection
  positionAlongWall: number // 0-1, position along the wall from left/top
  distanceFromWall: number  // How far from the wall edge (in feet)
}

/**
 * Infer which wall a device is on based on its position within the room.
 * Uses closest-edge detection.
 */
export function inferWall(
  device: Device,
  roomWidth: number,
  roomHeight: number
): WallInfo {
  const x = device.positionX ?? roomWidth / 2
  const y = device.positionY ?? roomHeight / 2

  // Calculate distance to each edge
  const distToNorth = y                    // top edge
  const distToSouth = roomHeight - y       // bottom edge
  const distToWest = x                     // left edge
  const distToEast = roomWidth - x         // right edge

  const minDist = Math.min(distToNorth, distToSouth, distToWest, distToEast)

  let wall: WallDirection
  let positionAlongWall: number

  if (minDist === distToNorth) {
    wall = 'north'
    positionAlongWall = x / roomWidth
  } else if (minDist === distToSouth) {
    wall = 'south'
    positionAlongWall = x / roomWidth
  } else if (minDist === distToWest) {
    wall = 'west'
    positionAlongWall = y / roomHeight
  } else {
    wall = 'east'
    positionAlongWall = y / roomHeight
  }

  return {
    wall,
    positionAlongWall,
    distanceFromWall: minDist,
  }
}

/**
 * Get the wall length based on direction and room dimensions
 */
export function getWallLength(
  wall: WallDirection,
  roomWidth: number,
  roomHeight: number
): number {
  return wall === 'north' || wall === 'south' ? roomWidth : roomHeight
}

/**
 * Get devices for a specific wall
 */
export function getDevicesForWall(
  devices: Device[],
  wall: WallDirection,
  roomWidth: number,
  roomHeight: number
): Array<{ device: Device; wallInfo: WallInfo }> {
  return devices
    .filter((device) => device.placement === 'wall' || device.placement === 'ceiling')
    .map((device) => ({
      device,
      wallInfo: inferWall(device, roomWidth, roomHeight),
    }))
    .filter(({ wallInfo }) => {
      // Ceiling devices appear on all walls at the top
      if (devices.find(d => d.id === wallInfo.wall)?.placement === 'ceiling') {
        return true
      }
      return wallInfo.wall === wall
    })
    .sort((a, b) => a.wallInfo.positionAlongWall - b.wallInfo.positionAlongWall)
}

/**
 * Get all devices that should appear on a wall's elevation view,
 * including ceiling devices
 */
export function getDevicesForElevation(
  devices: Device[],
  wall: WallDirection,
  roomWidth: number,
  roomHeight: number
): Array<{ device: Device; wallInfo: WallInfo; isCeiling: boolean }> {
  const result: Array<{ device: Device; wallInfo: WallInfo; isCeiling: boolean }> = []

  devices.forEach((device) => {
    if (device.placement === 'ceiling') {
      // Ceiling devices appear on all walls at the ceiling level
      const wallInfo = inferWall(device, roomWidth, roomHeight)
      result.push({
        device,
        wallInfo: {
          ...wallInfo,
          wall, // Override to current wall for positioning
        },
        isCeiling: true,
      })
    } else if (device.placement === 'wall') {
      const wallInfo = inferWall(device, roomWidth, roomHeight)
      if (wallInfo.wall === wall) {
        result.push({
          device,
          wallInfo,
          isCeiling: false,
        })
      }
    }
    // Floor devices don't appear in elevation view
  })

  return result.sort((a, b) => a.wallInfo.positionAlongWall - b.wallInfo.positionAlongWall)
}

/**
 * Standard height references for electrical devices (in inches)
 */
export const STANDARD_HEIGHTS = {
  floorOutlet: 12,
  standardOutlet: 18,
  counterOutlet: 48,
  switchHeight: 52,
  highSwitch: 84,
  ceiling8ft: 96,
  ceiling9ft: 108,
  ceiling10ft: 120,
}

/**
 * Get a human-readable label for a height
 */
export function getHeightLabel(heightInches: number): string {
  if (heightInches <= 14) return 'Floor level'
  if (heightInches <= 24) return 'Standard outlet'
  if (heightInches <= 54) return 'Counter/switch height'
  if (heightInches <= 72) return 'Above counter'
  if (heightInches <= 90) return 'High mount'
  return 'Ceiling level'
}
