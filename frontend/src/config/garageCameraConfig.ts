/**
 * Centralized Garage Zone Camera Configuration & Framing Architecture
 *
 * Design Rules for all Garage Zones (EV01, Finance, AI, Analytics, Charging, etc.):
 * 1. Focused zone object stays center-left (~35%–42% of viewport width).
 * 2. Right info panel stays fully readable and un-occluded (~55%–75% of viewport width).
 * 3. Object occupies around 25%–40% of visible width with generous surrounding breathing room.
 * 4. Safe framing distance: zones are framed from ~8.8m–9.5m away (never extreme close-up).
 * 5. Comfortable vertical padding: camera is elevated +2.35m with ~35% vertical headroom/footroom.
 * 6. Min distance clamped (6.0m) to strictly prevent camera clipping or extreme close-up zoom.
 * 7. Polar angle floor-safe (min 0.45 rad / ~26°, max 1.43 rad / ~82°).
 */

import { GarageZone } from '../store/worldStore';

export interface GarageCameraPreset {
  /** Target look-at coordinates [x, y, z] in world space */
  target: [number, number, number];
  /** Camera position coordinates [x, y, z] in world space */
  position: [number, number, number];
  /** Vertical field of view in degrees (default: 42) */
  fov: number;
  /** Minimum zoom distance (prevents camera intersecting object or clipping) */
  minDistance: number;
  /** Maximum zoom distance (prevents object becoming too distant) */
  maxDistance: number;
  /** Minimum vertical polar angle in radians (~26° default) */
  minPolarAngle: number;
  /** Maximum vertical polar angle in radians (~82° default, floor-safe) */
  maxPolarAngle: number;
  /** Whether orbit rotation is enabled */
  enableRotate: boolean;
  /** Whether mouse-wheel zoom is enabled */
  enableZoom: boolean;
  /** Whether right-click panning is enabled */
  enablePan: boolean;
  /** Which side of the screen is occupied by a UI detail panel */
  panelSide: 'left' | 'right' | 'none';
  /** Horizontal lateral offset applied to frame object on center-left */
  horizontalOffset: number;
  /** Safe framing 3D Euclidean distance from camera to target */
  safeFramingDistance: number;
  /** Transition animation glide duration in seconds */
  transitionDuration: number;
}

/**
 * Design rule constants for consistent framing across all garage zones
 */
export const GARAGE_CAMERA_CONFIG = {
  ZONE_HORIZONTAL_OFFSET: 1.35,
  ZONE_SAFE_DISTANCE_Z: 8.8,
  ZONE_CAMERA_HEIGHT_OFFSET: 2.35,
  ZONE_TARGET_HEIGHT: 1.25,
  ZONE_MIN_DISTANCE: 6.0,
  ZONE_MAX_DISTANCE: 22.0,
  ZONE_MIN_POLAR: 0.45,
  ZONE_MAX_POLAR: 1.43,

  VEHICLE_HORIZONTAL_OFFSET: 1.45,
  VEHICLE_SAFE_DISTANCE_Z: 12.8,
  VEHICLE_CAMERA_HEIGHT_OFFSET: 2.55,
  VEHICLE_TARGET_HEIGHT: 1.05,
  VEHICLE_MIN_DISTANCE: 6.5,
  VEHICLE_MAX_DISTANCE: 24.0,

  DEFAULT_FOV: 42,
  TRANSITION_DURATION: 0.65,
} as const;

/**
 * World-space spatial anchors for all zones across role layouts
 */
export const GARAGE_ZONE_ANCHORS: {
  CO_OWNER: Record<GarageZone, [number, number, number]>;
  OPERATIONS: Record<GarageZone, [number, number, number]>;
  ADMIN: Record<GarageZone, [number, number, number]>;
} = {
  CO_OWNER: {
    VEHICLE: [0.0, 0.09, 1.8],
    CHARGING: [5.2, 0, 0.5],
    FINANCE: [-5.2, 0, 0.5],
    ANALYTICS: [3.2, 0, -3.8],
    AI: [-3.2, 0, -3.8],
    MAINTENANCE: [-9.0, 0, 0.5],
    GOVERNANCE: [9.0, 0, -4.5],
  },
  OPERATIONS: {
    VEHICLE: [0.0, 0.14, 0.5],
    CHARGING: [6.5, 0, 0.5],
    MAINTENANCE: [-6.5, 0, 0.5],
    FINANCE: [-7.5, 0, -4.5],
    GOVERNANCE: [7.5, 0, -4.5],
    ANALYTICS: [0.0, 0, -5.2],
    AI: [0.0, 0, 9.0],
  },
  ADMIN: {
    VEHICLE: [0.0, 0.14, 0.5],
    CHARGING: [6.5, 0, 0.5],
    MAINTENANCE: [-6.5, 0, 0.5],
    FINANCE: [-7.5, 0, -4.5],
    GOVERNANCE: [-6.5, 0, -2.5],
    ANALYTICS: [0.0, 0, -5.2],
    AI: [0.0, 0, 9.0],
  },
};

/**
 * Resolves the ground anchor position [x, y, z] for a specific garage zone and user role.
 */
export function getGarageZoneAnchor(
  zoneId: GarageZone,
  role?: string
): [number, number, number] {
  if (role === 'ADMIN') {
    return GARAGE_ZONE_ANCHORS.ADMIN[zoneId] || GARAGE_ZONE_ANCHORS.OPERATIONS[zoneId];
  }
  const isCoOwner = !role || role === 'CO_OWNER';
  return isCoOwner
    ? GARAGE_ZONE_ANCHORS.CO_OWNER[zoneId] || GARAGE_ZONE_ANCHORS.OPERATIONS[zoneId]
    : GARAGE_ZONE_ANCHORS.OPERATIONS[zoneId];
}

/**
 * Reusable helper to compute responsive distance multiplier for narrower viewports (< 1280px).
 */
export function getResponsiveDistanceFactor(viewportWidth?: number): number {
  if (viewportWidth && viewportWidth < 1280) {
    return Math.min(1.18, Math.max(1.0, 1280 / viewportWidth));
  }
  return 1.0;
}

/**
 * 1. panelFriendlyFocusCamera
 * Generic reusable factory for panel-friendly focus presets.
 * Places the focused object at center-left while giving the right-side detail panel
 * full legibility and breathing room.
 */
export function panelFriendlyFocusCamera(
  baseAnchor: [number, number, number],
  options?: {
    horizontalOffset?: number;
    distanceZ?: number;
    targetHeight?: number;
    cameraHeightOffset?: number;
    minDistance?: number;
    maxDistance?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    fov?: number;
    responsiveFactor?: number;
    transitionDuration?: number;
  }
): GarageCameraPreset {
  const [bx, by, bz] = baseAnchor;
  const factor = options?.responsiveFactor ?? 1.0;
  const offsetX = options?.horizontalOffset ?? GARAGE_CAMERA_CONFIG.ZONE_HORIZONTAL_OFFSET;
  const distZ = (options?.distanceZ ?? GARAGE_CAMERA_CONFIG.ZONE_SAFE_DISTANCE_Z) * factor;
  const targetY = by + (options?.targetHeight ?? GARAGE_CAMERA_CONFIG.ZONE_TARGET_HEIGHT);
  const cameraY = targetY + (options?.cameraHeightOffset ?? GARAGE_CAMERA_CONFIG.ZONE_CAMERA_HEIGHT_OFFSET);

  const target: [number, number, number] = [bx + offsetX, targetY, bz];
  const position: [number, number, number] = [bx + offsetX, cameraY, bz + distZ];

  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const safeFramingDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return {
    target,
    position,
    fov: options?.fov ?? GARAGE_CAMERA_CONFIG.DEFAULT_FOV,
    minDistance: options?.minDistance ?? GARAGE_CAMERA_CONFIG.ZONE_MIN_DISTANCE,
    maxDistance: options?.maxDistance ?? GARAGE_CAMERA_CONFIG.ZONE_MAX_DISTANCE,
    minPolarAngle: options?.minPolarAngle ?? GARAGE_CAMERA_CONFIG.ZONE_MIN_POLAR,
    maxPolarAngle: options?.maxPolarAngle ?? GARAGE_CAMERA_CONFIG.ZONE_MAX_POLAR,
    enableRotate: true,
    enableZoom: true,
    enablePan: true,
    panelSide: 'right',
    horizontalOffset: offsetX,
    safeFramingDistance,
    transitionDuration: options?.transitionDuration ?? GARAGE_CAMERA_CONFIG.TRANSITION_DURATION,
  };
}

/**
 * 2. overviewCamera
 * Wide room shot displaying the whole virtual garage architecture, floor, and platforms.
 */
export function overviewCamera(role?: string, viewportWidth?: number): GarageCameraPreset {
  const isCoOwner = !role || role === 'CO_OWNER';
  const target: [number, number, number] = isCoOwner ? [0.0, 0.85, 1.8] : [0.0, 0.7, 0.5];
  const position: [number, number, number] = isCoOwner ? [-0.20, 2.25, 11.5] : [0.0, 14.5, 19.5];

  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const safeFramingDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return {
    target,
    position,
    fov: 40,
    minDistance: isCoOwner ? 5.0 : 4.0,
    maxDistance: isCoOwner ? 18.0 : 32.0,
    minPolarAngle: isCoOwner ? 0.40 : 0.1,
    maxPolarAngle: isCoOwner ? 1.42 : Math.PI / 2 - 0.05,
    enableRotate: true,
    enableZoom: true,
    enablePan: true,
    panelSide: 'none',
    horizontalOffset: 0,
    safeFramingDistance,
    transitionDuration: 0.65,
  };
}

/**
 * 3. vehicleFocusCamera
 * Focused EV01 view without side panel: vehicle is centered with generous room margins.
 */
export function vehicleFocusCamera(role?: string, viewportWidth?: number): GarageCameraPreset {
  const isCoOwner = !role || role === 'CO_OWNER';
  if (isCoOwner) {
    return {
      target: [0.0, 0.85, 1.8],
      position: [-0.25, 2.05, 8.8],
      fov: 40,
      minDistance: 4.5,
      maxDistance: 16.0,
      minPolarAngle: 0.40,
      maxPolarAngle: 1.42,
      enableRotate: true,
      enableZoom: true,
      enablePan: true,
      panelSide: 'none',
      horizontalOffset: 0,
      safeFramingDistance: 7.0,
      transitionDuration: 0.65,
    };
  }

  const [vx, vy, vz] = getGarageZoneAnchor('VEHICLE', role);
  const factor = getResponsiveDistanceFactor(viewportWidth);
  const distZ = 13.2 * factor;
  const target: [number, number, number] = [vx, vy + 0.95, vz];
  const position: [number, number, number] = [vx, vy + 3.4, vz + distZ];

  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];

  return {
    target,
    position,
    fov: 42,
    minDistance: GARAGE_CAMERA_CONFIG.VEHICLE_MIN_DISTANCE,
    maxDistance: GARAGE_CAMERA_CONFIG.VEHICLE_MAX_DISTANCE,
    minPolarAngle: 0.55,
    maxPolarAngle: 1.43,
    enableRotate: true,
    enableZoom: true,
    enablePan: true,
    panelSide: 'none',
    horizontalOffset: 0,
    safeFramingDistance: Math.sqrt(dx * dx + dy * dy + dz * dz),
    transitionDuration: 0.65,
  };
}

/**
 * 4. vehicleZoneCamera
 * Panel-friendly EV01 vehicle camera preset with EV01 center-left and right detail panel legible.
 */
export function vehicleZoneCamera(role?: string, viewportWidth?: number): GarageCameraPreset {
  const isCoOwner = !role || role === 'CO_OWNER';
  if (isCoOwner) {
    return {
      target: [0.75, 0.85, 1.8],
      position: [0.45, 2.05, 8.8],
      fov: 40,
      minDistance: 4.5,
      maxDistance: 16.0,
      minPolarAngle: 0.40,
      maxPolarAngle: 1.42,
      enableRotate: true,
      enableZoom: true,
      enablePan: true,
      panelSide: 'right',
      horizontalOffset: 0.75,
      safeFramingDistance: 7.0,
      transitionDuration: 0.65,
    };
  }

  const anchor = getGarageZoneAnchor('VEHICLE', role);
  const factor = getResponsiveDistanceFactor(viewportWidth);
  return panelFriendlyFocusCamera(anchor, {
    horizontalOffset: GARAGE_CAMERA_CONFIG.VEHICLE_HORIZONTAL_OFFSET,
    distanceZ: GARAGE_CAMERA_CONFIG.VEHICLE_SAFE_DISTANCE_Z,
    targetHeight: GARAGE_CAMERA_CONFIG.VEHICLE_TARGET_HEIGHT,
    cameraHeightOffset: GARAGE_CAMERA_CONFIG.VEHICLE_CAMERA_HEIGHT_OFFSET,
    minDistance: GARAGE_CAMERA_CONFIG.VEHICLE_MIN_DISTANCE,
    maxDistance: GARAGE_CAMERA_CONFIG.VEHICLE_MAX_DISTANCE,
    minPolarAngle: 0.55,
    maxPolarAngle: 1.43,
    responsiveFactor: factor,
  });
}

/**
 * 5. zoneFocusCamera
 * Generic zone camera resolver applying the standardized center-left framing and safe distance.
 */
export function zoneFocusCamera(
  zoneId: GarageZone,
  role?: string,
  viewportWidth?: number
): GarageCameraPreset {
  if (zoneId === 'VEHICLE') {
    return vehicleZoneCamera(role, viewportWidth);
  }
  const anchor = getGarageZoneAnchor(zoneId, role);
  const factor = getResponsiveDistanceFactor(viewportWidth);
  return panelFriendlyFocusCamera(anchor, {
    horizontalOffset: GARAGE_CAMERA_CONFIG.ZONE_HORIZONTAL_OFFSET,
    distanceZ: GARAGE_CAMERA_CONFIG.ZONE_SAFE_DISTANCE_Z,
    targetHeight: GARAGE_CAMERA_CONFIG.ZONE_TARGET_HEIGHT,
    cameraHeightOffset: GARAGE_CAMERA_CONFIG.ZONE_CAMERA_HEIGHT_OFFSET,
    minDistance: GARAGE_CAMERA_CONFIG.ZONE_MIN_DISTANCE,
    maxDistance: GARAGE_CAMERA_CONFIG.ZONE_MAX_DISTANCE,
    minPolarAngle: GARAGE_CAMERA_CONFIG.ZONE_MIN_POLAR,
    maxPolarAngle: GARAGE_CAMERA_CONFIG.ZONE_MAX_POLAR,
    responsiveFactor: factor,
  });
}

/**
 * 6. Consistent Per-Zone Presets:
 * Dedicated named presets for every garage zone.
 */

export function financeZoneCamera(role?: string, viewportWidth?: number): GarageCameraPreset {
  const isCoOwner = !role || role === 'CO_OWNER';
  if (isCoOwner) {
    const factor = getResponsiveDistanceFactor(viewportWidth);
    const distZ = 11.5 * factor;
    return {
      target: [0.35, 1.25, 1.8],
      position: [0.35, 2.10, 1.8 + distZ],
      fov: 40,
      minDistance: 6.0,
      maxDistance: 20.0,
      minPolarAngle: 0.40,
      maxPolarAngle: 1.42,
      enableRotate: true,
      enableZoom: true,
      enablePan: true,
      panelSide: 'right',
      horizontalOffset: 0.35,
      safeFramingDistance: distZ,
      transitionDuration: 0.65,
    };
  }
  return zoneFocusCamera('FINANCE', role, viewportWidth);
}

export function aiZoneCamera(role?: string, viewportWidth?: number): GarageCameraPreset {
  return zoneFocusCamera('AI', role, viewportWidth);
}

export function analyticsZoneCamera(role?: string, viewportWidth?: number): GarageCameraPreset {
  return zoneFocusCamera('ANALYTICS', role, viewportWidth);
}

export function chargingZoneCamera(role?: string, viewportWidth?: number): GarageCameraPreset {
  return zoneFocusCamera('CHARGING', role, viewportWidth);
}

export function maintenanceZoneCamera(role?: string, viewportWidth?: number): GarageCameraPreset {
  return zoneFocusCamera('MAINTENANCE', role, viewportWidth);
}

export function governanceZoneCamera(role?: string, viewportWidth?: number): GarageCameraPreset {
  return zoneFocusCamera('GOVERNANCE', role, viewportWidth);
}

/**
 * Standard static presets for default CO_OWNER presentation
 */
export const OVERVIEW_CAMERA: GarageCameraPreset = overviewCamera('CO_OWNER');
export const VEHICLE_ZONE_CAMERA: GarageCameraPreset = vehicleZoneCamera('CO_OWNER');
export const FINANCE_ZONE_CAMERA: GarageCameraPreset = financeZoneCamera('CO_OWNER');
export const AI_ZONE_CAMERA: GarageCameraPreset = aiZoneCamera('CO_OWNER');
export const ANALYTICS_ZONE_CAMERA: GarageCameraPreset = analyticsZoneCamera('CO_OWNER');
export const CHARGING_ZONE_CAMERA: GarageCameraPreset = chargingZoneCamera('CO_OWNER');
export const MAINTENANCE_ZONE_CAMERA: GarageCameraPreset = maintenanceZoneCamera('CO_OWNER');
export const GOVERNANCE_ZONE_CAMERA: GarageCameraPreset = governanceZoneCamera('CO_OWNER');

/**
 * Primary resolver for garage zone camera presets.
 * Accepts any zone identifier or preset key and returns the standardized preset.
 */
export function getGarageZoneCameraPreset(
  zoneOrKey: GarageZone | string,
  role?: string,
  viewportWidth?: number
): GarageCameraPreset {
  switch (zoneOrKey) {
    case 'OVERVIEW':
      return overviewCamera(role, viewportWidth);
    case 'VEHICLE':
    case 'VEHICLE_FOCUS':
      return vehicleZoneCamera(role, viewportWidth);
    case 'FINANCE':
      return financeZoneCamera(role, viewportWidth);
    case 'AI':
      return aiZoneCamera(role, viewportWidth);
    case 'ANALYTICS':
      return analyticsZoneCamera(role, viewportWidth);
    case 'CHARGING':
      return chargingZoneCamera(role, viewportWidth);
    case 'MAINTENANCE':
      return maintenanceZoneCamera(role, viewportWidth);
    case 'GOVERNANCE':
      return governanceZoneCamera(role, viewportWidth);
    default:
      return overviewCamera(role, viewportWidth);
  }
}
