/**
 * Centralized Reusable Vehicle Camera Presets & Framing Architecture
 *
 * Rules for EVShare 3D Virtual Garage (and all future phases 14+):
 * 1. NEVER scale EV01 down to solve framing issues.
 * 2. Use panel-safe framing: when a detail panel is open on the right,
 *    shift the camera target and lateral offset so EV01 occupies the left ~55-65%
 *    of the viewport and the right panel occupies ~30-40% with visible breathing room.
 * 3. Keep EV01 as the orbit center (target = vehicle anchor), supporting full 360-degree
 *    rotation without clamping azimuth.
 * 4. Constrain polar rotation between ~35° and ~82° so the camera never passes
 *    below the floor or flips into extreme top-down angles.
 * 5. Constrain zoom distances so camera never clips into the windshield or body.
 */

import { VEHICLE_INTERACTION_CONFIG } from './interactionConfig';
export * from './garageCameraConfig';

export { VEHICLE_INTERACTION_CONFIG };

export interface VehicleCameraPreset {
  /** Target coordinates [x, y, z] in world space */
  target: [number, number, number];
  /** Camera position coordinates [x, y, z] in world space */
  position: [number, number, number];
  /** Minimum zoom distance (prevents camera intersecting vehicle body/windshield) */
  minDistance: number;
  /** Maximum zoom distance (prevents vehicle becoming tiny) */
  maxDistance: number;
  /** Minimum vertical polar angle in radians (~31° default) */
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
  panelSide?: 'left' | 'right' | 'none';
  /** Lateral X offset in world space to accommodate the panel */
  panelOffsetX?: number;
  /** Transition animation duration in seconds */
  transitionDuration?: number;
}

export type VehiclePresetKey =
  | 'OVERVIEW'
  | 'VEHICLE_FOCUS'
  | 'VEHICLE_WITH_RIGHT_PANEL'
  | 'VEHICLE_PART_INSPECTION'
  | 'VEHICLE_EXPLORE'
  | 'HANDOVER_INSPECTION'
  | 'TRIP_VIEW'
  | 'VEHICLE_TRIP_VISUALIZATION'
  | 'DAMAGE_MAPPING'
  | 'VEHICLE_BOOKING'
  | 'VEHICLE_CO_OWNERSHIP'
  | 'BATTERY_XRAY'
  | 'MAINTENANCE';

/**
 * Standard Reusable Camera Preset: Full Garage Overview
 * Wide room shot showing the entire garage architecture, lighting, floor, and platforms.
 */
export const GARAGE_OVERVIEW_CAMERA: VehicleCameraPreset = {
  target: [0.0, 1.2, -0.5],
  position: [0.0, 6.2, 13.8],
  minDistance: 4.0,
  maxDistance: 28.0,
  minPolarAngle: 0.1,
  maxPolarAngle: Math.PI / 2 - 0.05,
  enableRotate: true,
  enableZoom: true,
  enablePan: true,
  panelSide: 'none',
  transitionDuration: 0.7,
};

/**
 * Standard Reusable Camera Preset: Vehicle Focus (No side panel)
 * Comfortable, spacious framing showing EV01 centered with generous room margins.
 * Pulled farther back so the vehicle is situated in a spacious, premium garage environment.
 */
export const VEHICLE_FOCUS_CAMERA: VehicleCameraPreset = {
  target: [0.0, 0.95, 1.8],
  position: [0.0, 3.4, 15.0],
  minDistance: 6.0,
  maxDistance: 24.0,
  minPolarAngle: 0.55,
  maxPolarAngle: 1.43,
  enableRotate: true,
  enableZoom: true,
  enablePan: true,
  panelSide: 'none',
  transitionDuration: 0.65,
};

/**
 * Standard Reusable Camera Preset: Vehicle with Right Detail Panel
 * Farther back, spacious center-left framing preserving generous breathing room between EV01 and the panel.
 * EV01 occupies comfortable center-left ~38-42% of the viewport, with ample floor & environment around it.
 */
export const VEHICLE_PANEL_SAFE_CAMERA: VehicleCameraPreset = {
  target: [1.45, 1.05, 1.8],
  position: [1.45, 3.6, 14.5],
  minDistance: 6.5,
  maxDistance: 24.0,
  minPolarAngle: 0.55,
  maxPolarAngle: 1.43,
  enableRotate: true,
  enableZoom: true,
  enablePan: true,
  panelSide: 'right',
  panelOffsetX: 1.45,
  transitionDuration: 0.65,
};

/**
 * Standard Reusable Camera Preset: Vehicle Explore / Part Inspection
 * Framed for checkpoint exploration and interactive 3D part highlights with room space.
 */
export const VEHICLE_EXPLORE_CAMERA: VehicleCameraPreset = {
  target: [0.0, 0.95, 1.8],
  position: [0.0, 3.2, 13.8],
  minDistance: 5.5,
  maxDistance: 20.0,
  minPolarAngle: 0.55,
  maxPolarAngle: 1.43,
  enableRotate: true,
  enableZoom: true,
  enablePan: true,
  panelSide: 'none',
  transitionDuration: 0.65,
};

/**
 * Resolves the primary ground anchor of EV01 based on user role.
 * - CO_OWNER: [0.0, 0.14, 1.8] (Reference Showcase Hero Center)
 * - OPERATIONS (STAFF / ADMIN): [0.0, 0.14, 0.5]
 */
export function getVehicleAnchor(role?: string): [number, number, number] {
  const isCoOwner = !role || role === 'CO_OWNER';
  return isCoOwner ? [0.0, 0.14, 1.8] : [0.0, 0.14, 0.5];
}

/**
 * Evaluates active interaction modes and determines the appropriate camera preset key.
 */
export function resolveActiveCameraPresetKey(state: {
  selectedZone?: string | null;
  selectedVehicleId?: string | null;
  selectedVehiclePartId?: string | null;
  vehicleCoOwnershipMode?: boolean;
  vehicleBookingMode?: boolean;
  vehicleHandoverMode?: boolean;
  vehicleReceiptReviewMode?: boolean;
  vehicleTripStartMode?: boolean;
  vehicleTripVisualizationMode?: boolean;
  vehicleDamageMappingMode?: boolean;
  vehicleInspectionMode?: boolean;
}): VehiclePresetKey {
  if (state.vehicleDamageMappingMode) {
    return 'DAMAGE_MAPPING';
  }
  if (state.vehicleTripVisualizationMode) {
    return 'VEHICLE_TRIP_VISUALIZATION';
  }
  if (state.vehicleTripStartMode) {
    return 'TRIP_VIEW';
  }
  if (state.vehicleHandoverMode || state.vehicleReceiptReviewMode) {
    return 'HANDOVER_INSPECTION';
  }
  if (state.vehicleBookingMode) {
    return 'VEHICLE_BOOKING';
  }
  if (state.vehicleCoOwnershipMode) {
    return 'VEHICLE_CO_OWNERSHIP';
  }
  if (state.selectedVehiclePartId || state.vehicleInspectionMode) {
    return 'VEHICLE_PART_INSPECTION';
  }
  if (state.selectedVehicleId) {
    return 'VEHICLE_WITH_RIGHT_PANEL';
  }
  return 'OVERVIEW';
}

/**
 * Retrieves the calibrated camera preset for the given preset key, role, and viewport size.
 * Automatically applies panel-safe lateral offsets and responsive scaling.
 */
export function getVehicleCameraPreset(
  presetKey: VehiclePresetKey,
  role?: string,
  viewportWidth?: number
): VehicleCameraPreset {
  const isCoOwner = !role || role === 'CO_OWNER';
  const [vx, vy, vz] = getVehicleAnchor(role);

  // Responsive distance scale for narrower viewports (< 1280px)
  const responsiveFactor =
    viewportWidth && viewportWidth < 1280
      ? Math.min(1.18, Math.max(1.0, 1280 / viewportWidth))
      : 1.0;

  // Polar constraints: Min ~31° (0.55 rad), Max ~82° (1.43 rad, floor-safe)
  const defaultMinPolar = 0.55;
  const defaultMaxPolar = 1.43;

  switch (presetKey) {
    case 'OVERVIEW':
      return {
        target: isCoOwner ? [0.0, 1.2, -0.5] : [0.0, 0.7, 0.5],
        position: isCoOwner ? [0.0, 6.2, 13.8] : [0.0, 14.5, 19.5],
        minDistance: 4.0,
        maxDistance: isCoOwner ? 24.0 : 28.0,
        minPolarAngle: 0.1,
        maxPolarAngle: Math.PI / 2 - 0.05,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'none',
        transitionDuration: 0.7,
      };

    case 'VEHICLE_WITH_RIGHT_PANEL': {
      // Spacious framing: EV01 on center-left 38-42%, Right Detail Panel on right, with clear room breathing space
      const panelOffsetX = 1.45;
      const baseDistZ = 12.7 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 1.05, vz],
        position: [vx + panelOffsetX, vy + 3.6, vz + baseDistZ],
        minDistance: 6.5,
        maxDistance: 24.0,
        minPolarAngle: defaultMinPolar,
        maxPolarAngle: defaultMaxPolar,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'VEHICLE_FOCUS': {
      // Pure vehicle focus without right panel - generous wide framing showing surrounding garage room
      const baseDistZ = 13.2 * responsiveFactor;
      return {
        target: [vx, vy + 0.95, vz],
        position: [vx, vy + 3.4, vz + baseDistZ],
        minDistance: 6.0,
        maxDistance: 24.0,
        minPolarAngle: defaultMinPolar,
        maxPolarAngle: defaultMaxPolar,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'none',
        transitionDuration: 0.65,
      };
    }

    case 'VEHICLE_EXPLORE':
    case 'VEHICLE_PART_INSPECTION': {
      const baseDistZ = 12.0 * responsiveFactor;
      return {
        target: [vx, vy + 0.95, vz],
        position: [vx, vy + 3.2, vz + baseDistZ],
        minDistance: 5.5,
        maxDistance: 20.0,
        minPolarAngle: defaultMinPolar,
        maxPolarAngle: defaultMaxPolar,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'none',
        transitionDuration: 0.65,
      };
    }

    case 'VEHICLE_BOOKING': {
      // 3D Date Selector + Timeline on right side - wide, comfortable view
      const panelOffsetX = 1.45;
      const baseDistZ = 12.8 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 1.05, vz],
        position: [vx + panelOffsetX, vy + 3.6, vz + baseDistZ],
        minDistance: 6.5,
        maxDistance: 24.0,
        minPolarAngle: defaultMinPolar,
        maxPolarAngle: defaultMaxPolar,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'VEHICLE_CO_OWNERSHIP': {
      // Group summary above EV01 + owner columns
      const panelOffsetX = 0.8;
      const baseDistZ = 13.0 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 1.4, vz],
        position: [vx + panelOffsetX, vy + 3.7, vz + baseDistZ],
        minDistance: 6.5,
        maxDistance: 24.0,
        minPolarAngle: defaultMinPolar,
        maxPolarAngle: defaultMaxPolar,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'HANDOVER_INSPECTION': {
      // Handover 8 hotspots + right inspection card
      const panelOffsetX = 1.25;
      const baseDistZ = 12.5 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 1.05, vz],
        position: [vx + panelOffsetX, vy + 3.5, vz + baseDistZ],
        minDistance: 6.0,
        maxDistance: 22.0,
        minPolarAngle: defaultMinPolar,
        maxPolarAngle: defaultMaxPolar,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'DAMAGE_MAPPING': {
      // Damage surface clicking + inspector
      const panelOffsetX = 1.25;
      const baseDistZ = 12.2 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 1.05, vz],
        position: [vx + panelOffsetX, vy + 3.5, vz + baseDistZ],
        minDistance: 5.8,
        maxDistance: 22.0,
        minPolarAngle: defaultMinPolar,
        maxPolarAngle: defaultMaxPolar,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'TRIP_VIEW':
    case 'VEHICLE_TRIP_VISUALIZATION': {
      // Trip telemetrics & visualizer
      const panelOffsetX = 1.25;
      const baseDistZ = 12.8 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 1.05, vz],
        position: [vx + 1.45, vy + 3.6, vz + baseDistZ],
        minDistance: 6.0,
        maxDistance: 22.0,
        minPolarAngle: defaultMinPolar,
        maxPolarAngle: defaultMaxPolar,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    default: {
      const baseDistZ = 13.0 * responsiveFactor;
      return {
        target: [vx, vy + 0.95, vz],
        position: [vx, vy + 3.4, vz + baseDistZ],
        minDistance: 6.0,
        maxDistance: 24.0,
        minPolarAngle: defaultMinPolar,
        maxPolarAngle: defaultMaxPolar,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'none',
        transitionDuration: 0.65,
      };
    }
  }
}
