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
import {
  getPartById,
  SEMANTIC_HITBOX_DEFINITIONS,
  EV02_SEMANTIC_HITBOXES,
} from '../data/vehicleParts';
import { resolveVehicleCode } from '../components/three/vehicles/vehicleModelConfig';
import { getVehicleBaySlot } from './garageSlotConfig';
import { STAFF_GARAGE_LAYOUT } from './staffGarageLayout';
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
  /** Field of view in degrees (default ~40) */
  fov?: number;
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
  | 'BATTERY_DETAIL'
  | 'CHARGING_OVERVIEW'
  | 'CHARGING_PORT_DETAIL'
  | 'MAINTENANCE'
  | 'DAMAGE_HISTORY';

/**
 * Standard Reusable Camera Preset: Full Garage Overview
 * Wide room shot showing the entire garage architecture, lighting, floor, and platforms.
 * Camera is pulled back and elevated for a breathable, elegant wide showroom composition.
 */
export const GARAGE_OVERVIEW_CAMERA: VehicleCameraPreset = {
  target: [0.0, 0.85, 1.8],
  position: [-0.25, 2.35, 12.0],
  minDistance: 5.0,
  maxDistance: 18.0,
  minPolarAngle: 0.40,
  maxPolarAngle: 1.42,
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
  target: [0.0, 0.85, 1.8],
  position: [-0.25, 2.05, 8.8],
  minDistance: 4.5,
  maxDistance: 16.0,
  minPolarAngle: 0.40,
  maxPolarAngle: 1.42,
  enableRotate: true,
  enableZoom: true,
  enablePan: true,
  panelSide: 'none',
  transitionDuration: 0.65,
};

/**
 * Standard Reusable Camera Preset: Vehicle with Right Detail Panel
 * Farther back, spacious center-left framing preserving generous breathing room between EV01 and the panel.
 * EV01 occupies comfortable center-left ~30-34% of the viewport, with ample floor & environment around it.
 */
export const VEHICLE_PANEL_SAFE_CAMERA: VehicleCameraPreset = {
  target: [0.75, 0.85, 1.8],
  position: [0.45, 2.05, 8.8],
  minDistance: 4.5,
  maxDistance: 16.0,
  minPolarAngle: 0.40,
  maxPolarAngle: 1.42,
  enableRotate: true,
  enableZoom: true,
  enablePan: true,
  panelSide: 'right',
  panelOffsetX: 0.75,
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
 * Resolves the primary ground anchor of a vehicle using the centralized garage slot architecture.
 * Automatically adapts for role, vehicle status, and dedicated bay assignment.
 */
export function getVehicleAnchor(role?: string, vehicleCode?: string | null): [number, number, number] {
  const isOperations = role === 'STAFF' || role === 'ADMIN';
  if (isOperations) {
    return STAFF_GARAGE_LAYOUT.heroAnchor;
  }
  return getVehicleBaySlot(vehicleCode, role).position;
}

/**
 * Evaluates active interaction modes and determines the appropriate camera preset key.
 */
export function resolveActiveCameraPresetKey(state: {
  selectedZone?: string | null;
  selectedVehicleId?: string | null;
  selectedVehiclePartId?: string | null;
  selectedVehiclePartCode?: string | null;
  selectedDamageId?: string | null;
  vehicleCoOwnershipMode?: boolean;
  vehicleBookingMode?: boolean;
  vehicleHandoverMode?: boolean;
  vehicleReceiptReviewMode?: boolean;
  vehicleTripStartMode?: boolean;
  vehicleTripVisualizationMode?: boolean;
  vehicleDamageMappingMode?: boolean;
  vehicleDamageHistoryMode?: boolean;
  vehicleInspectionMode?: boolean;
  vehicleMaintenanceMode?: boolean;
  vehicleBatteryXrayMode?: boolean;
  vehicleChargingMode?: boolean;
}): VehiclePresetKey {
  if (state.vehicleChargingMode) {
    if (state.selectedVehiclePartId === 'CHARGING_PORT' || state.selectedVehiclePartCode === 'CHARGING_PORT') {
      return 'CHARGING_PORT_DETAIL';
    }
    return 'CHARGING_OVERVIEW';
  }
  if (state.vehicleBatteryXrayMode) {
    if (state.selectedVehiclePartId === 'BATTERY' || state.selectedVehiclePartCode === 'BATTERY') {
      return 'BATTERY_DETAIL';
    }
    return 'BATTERY_XRAY';
  }
  if (state.vehicleMaintenanceMode) {
    if (state.selectedDamageId || state.selectedVehiclePartCode || state.selectedVehiclePartId) {
      return 'VEHICLE_PART_INSPECTION';
    }
    return 'VEHICLE_FOCUS';
  }
  if (state.vehicleDamageHistoryMode) {
    if (state.selectedDamageId || state.selectedVehiclePartCode || state.selectedVehiclePartId) {
      return 'VEHICLE_PART_INSPECTION';
    }
    return 'DAMAGE_HISTORY';
  }
  if (state.vehicleDamageMappingMode) {
    if (state.selectedVehiclePartCode || state.selectedVehiclePartId) {
      return 'VEHICLE_PART_INSPECTION';
    }
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
  if (state.vehicleInspectionMode) {
    if (state.selectedVehiclePartId || state.selectedVehiclePartCode) {
      return 'VEHICLE_PART_INSPECTION';
    }
    return 'VEHICLE_EXPLORE';
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
  viewportWidth?: number,
  vehicleCode?: string | null
): VehicleCameraPreset {
  const isCoOwner = !role || role === 'CO_OWNER';
  const isOperationsRole = role === 'STAFF' || role === 'ADMIN';
  const [vx, vy, vz] = getVehicleAnchor(role, vehicleCode);

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
        target: isCoOwner ? [0.0, 0.85, 1.8] : STAFF_GARAGE_LAYOUT.camera.target,
        position: isCoOwner ? [-0.25, 2.35, 12.0] : STAFF_GARAGE_LAYOUT.camera.position,
        minDistance: isCoOwner ? 5.0 : STAFF_GARAGE_LAYOUT.camera.minDistance,
        maxDistance: isCoOwner ? 18.0 : STAFF_GARAGE_LAYOUT.camera.maxDistance,
        minPolarAngle: isCoOwner ? 0.40 : STAFF_GARAGE_LAYOUT.camera.minPolarAngle,
        maxPolarAngle: isCoOwner ? 1.42 : STAFF_GARAGE_LAYOUT.camera.maxPolarAngle,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'none',
        transitionDuration: 0.7,
      };

    case 'VEHICLE_WITH_RIGHT_PANEL': {
      if (!isCoOwner) {
        return {
          target: STAFF_GARAGE_LAYOUT.camera.target,
          position: STAFF_GARAGE_LAYOUT.camera.position,
          minDistance: STAFF_GARAGE_LAYOUT.camera.minDistance,
          maxDistance: STAFF_GARAGE_LAYOUT.camera.maxDistance,
          minPolarAngle: STAFF_GARAGE_LAYOUT.camera.minPolarAngle,
          maxPolarAngle: STAFF_GARAGE_LAYOUT.camera.maxPolarAngle,
          enableRotate: true,
          enableZoom: true,
          enablePan: true,
          panelSide: 'right',
          transitionDuration: 0.65,
        };
      }
      // Premium hero framing: EV01 on center-left ~30-34% of viewport width, Right Information Panel clear on right, zero clipping
      const panelOffsetX = 0.75;
      const baseDistZ = 7.0 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 0.85, vz],
        position: [vx + 0.45, vy + 2.05, vz + baseDistZ],
        minDistance: 4.5,
        maxDistance: 16.0,
        minPolarAngle: 0.40,
        maxPolarAngle: 1.42,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'VEHICLE_FOCUS': {
      if (!isCoOwner) {
        return {
          target: STAFF_GARAGE_LAYOUT.camera.target,
          position: STAFF_GARAGE_LAYOUT.camera.position,
          minDistance: STAFF_GARAGE_LAYOUT.camera.minDistance,
          maxDistance: STAFF_GARAGE_LAYOUT.camera.maxDistance,
          minPolarAngle: STAFF_GARAGE_LAYOUT.camera.minPolarAngle,
          maxPolarAngle: STAFF_GARAGE_LAYOUT.camera.maxPolarAngle,
          enableRotate: true,
          enableZoom: true,
          enablePan: true,
          panelSide: 'none',
          transitionDuration: 0.65,
        };
      }
      // Pure vehicle focus without right panel - spacious cinematic 3/4 angle
      const baseDistZ = 7.0 * responsiveFactor;
      return {
        target: [vx, vy + 0.85, vz],
        position: [vx - 0.25, vy + 2.05, vz + baseDistZ],
        minDistance: 4.5,
        maxDistance: 16.0,
        minPolarAngle: 0.40,
        maxPolarAngle: 1.42,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'none',
        transitionDuration: 0.65,
      };
    }

    case 'VEHICLE_EXPLORE':
    case 'VEHICLE_PART_INSPECTION':
    case 'MAINTENANCE': {
      if (!isCoOwner) {
        return {
          target: STAFF_GARAGE_LAYOUT.camera.target,
          position: STAFF_GARAGE_LAYOUT.camera.position,
          minDistance: STAFF_GARAGE_LAYOUT.camera.minDistance,
          maxDistance: STAFF_GARAGE_LAYOUT.camera.maxDistance,
          minPolarAngle: STAFF_GARAGE_LAYOUT.camera.minPolarAngle,
          maxPolarAngle: STAFF_GARAGE_LAYOUT.camera.maxPolarAngle,
          enableRotate: true,
          enableZoom: true,
          enablePan: true,
          panelSide: 'right',
          transitionDuration: 0.65,
        };
      }
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
      // Balanced hero framing: EV01 clearly visible in center-left (~35% focus) with base grounded,
      // ample vertical headroom for floating 3D timeline, clear breathing room from fixed right booking panel
      const panelOffsetX = 0.95;
      const baseDistZ = 11.5 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 1.15, vz],
        position: [vx + panelOffsetX, vy + 3.2, vz + baseDistZ],
        minDistance: 6.5,
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

    case 'VEHICLE_CO_OWNERSHIP': {
      // Re-framed CO_OWNER vehicle & co-ownership composition:
      // Vehicle prominent in center-left (~35-45% viewport width), 3D member representatives visible on left,
      // right co-ownership panel unobstructed, podium grounded and visible
      const panelOffsetX = 0.65;
      const baseDistZ = 10.0 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 0.95, vz],
        position: [vx + 0.45, vy + 2.35, vz + baseDistZ],
        fov: 40,
        minDistance: 4.5,
        maxDistance: 18.0,
        minPolarAngle: 0.40,
        maxPolarAngle: 1.42,
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

    case 'DAMAGE_HISTORY':
    case 'DAMAGE_MAPPING': {
      if (isOperationsRole || !isCoOwner) {
        // STAFF / ADMIN panel-safe damage / inspection camera logic with fixed right panel
        return {
          target: STAFF_GARAGE_LAYOUT.camera.target,
          position: STAFF_GARAGE_LAYOUT.camera.position,
          minDistance: STAFF_GARAGE_LAYOUT.camera.minDistance,
          maxDistance: STAFF_GARAGE_LAYOUT.camera.maxDistance,
          minPolarAngle: STAFF_GARAGE_LAYOUT.camera.minPolarAngle,
          maxPolarAngle: STAFF_GARAGE_LAYOUT.camera.maxPolarAngle,
          enableRotate: true,
          enableZoom: true,
          enablePan: true,
          panelSide: 'right',
          transitionDuration: 0.65,
        };
      }
      // CO_OWNER existing spatial behavior: Damage surface clicking + inspector
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

    case 'BATTERY_XRAY': {
      // Dedicated 3D X-Ray Inspection preset:
      // Shows vehicle body context, underfloor battery pack, right panel safe area
      // Composition: center-left vehicle (panelOffsetX = 1.35), elevated looking down into battery pack
      const panelOffsetX = 1.35;
      const baseDistZ = 10.6 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 0.65, vz],
        position: [vx + panelOffsetX, vy + 2.85, vz + baseDistZ],
        minDistance: 4.8,
        maxDistance: 19.0,
        minPolarAngle: 0.62,
        maxPolarAngle: 1.38, // Floor-safe: never below floor
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'BATTERY_DETAIL': {
      // Optional close-up inspection preset when battery pack is focused/clicked:
      // Closer, slightly lower angle, still above floor, battery pack fully visible
      const panelOffsetX = 1.15;
      const baseDistZ = 7.2 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 0.38, vz],
        position: [vx + panelOffsetX, vy + 1.85, vz + baseDistZ],
        minDistance: 3.5,
        maxDistance: 14.0,
        minPolarAngle: 0.70,
        maxPolarAngle: 1.35, // Floor-safe
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'CHARGING_OVERVIEW': {
      // Dedicated 3D Charging Mode Overview:
      // Composition: center-left vehicle, charger kiosk visible, panel safe on right
      const panelOffsetX = 1.35;
      const baseDistZ = 11.2 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 0.95, vz],
        position: [vx + panelOffsetX, vy + 3.1, vz + baseDistZ],
        minDistance: 5.0,
        maxDistance: 20.0,
        minPolarAngle: 0.58,
        maxPolarAngle: 1.40,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'CHARGING_PORT_DETAIL': {
      // Close-up charging port inspection preset:
      // Focuses left-rear quarter charging port and cable connection
      const panelOffsetX = 1.10;
      const baseDistZ = 7.5 * responsiveFactor;
      return {
        target: [vx + panelOffsetX - 0.45, vy + 0.82, vz - 0.9],
        position: [vx + panelOffsetX - 2.8, vy + 1.8, vz + baseDistZ - 3.2],
        minDistance: 3.8,
        maxDistance: 15.0,
        minPolarAngle: 0.65,
        maxPolarAngle: 1.38,
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

/**
 * Dedicated part-aware inspection camera configurations (Sections 11, 12).
 * Each semantic part defines:
 * - targetOffset: local coordinate of the part center on EV01
 * - cameraOffset: ideal viewing position providing direct line-of-sight from the appropriate side,
 *                 ensuring no occlusion through the vehicle body.
 */
export const PART_INSPECTION_CAMERA_CONFIGS: Record<
  string,
  {
    targetOffset: [number, number, number];
    cameraOffset: [number, number, number];
  }
> = {
  // Left Front Door: left-front three-quarter view
  DOOR_FL: {
    targetOffset: [-0.88, 0.80, 0.55],
    cameraOffset: [-4.2, 1.5, 2.2],
  },
  // Right Front Door: right-front three-quarter view (direct line-of-sight from right side)
  DOOR_FR: {
    targetOffset: [0.88, 0.80, 0.55],
    cameraOffset: [4.2, 1.5, 2.2],
  },
  // Left Rear Door: left-rear three-quarter view
  DOOR_RL: {
    targetOffset: [-0.88, 0.80, -0.50],
    cameraOffset: [-4.2, 1.5, -1.8],
  },
  // Right Rear Door: right-rear three-quarter view
  DOOR_RR: {
    targetOffset: [0.88, 0.80, -0.50],
    cameraOffset: [4.2, 1.5, -1.8],
  },
  // Hood: front-upper three-quarter elevated view (comfortable distance, +Z front)
  HOOD: {
    targetOffset: [0.0, 0.82, 1.25],
    cameraOffset: [-2.2, 2.2, 4.4],
  },
  // Windshield: front-upper medium distance view (facing front +Z, directly looking into windshield)
  WINDSHIELD: {
    targetOffset: [0.0, 1.15, 0.45],
    cameraOffset: [-2.0, 2.4, 4.2],
  },
  // Left Front Wheel: left-front lower angle view
  WHEEL_FL: {
    targetOffset: [-0.80, 0.36, 1.31],
    cameraOffset: [-3.4, 0.9, 2.6],
  },
  // Right Front Wheel: right-front lower angle view
  WHEEL_FR: {
    targetOffset: [0.80, 0.36, 1.31],
    cameraOffset: [3.4, 0.9, 2.6],
  },
  // Left Rear Wheel: left-rear lower angle view
  WHEEL_RL: {
    targetOffset: [-0.80, 0.36, -1.31],
    cameraOffset: [-3.4, 0.9, -2.6],
  },
  // Right Rear Wheel: right-rear lower angle view
  WHEEL_RR: {
    targetOffset: [0.80, 0.36, -1.31],
    cameraOffset: [3.4, 0.9, -2.6],
  },
  // Charging Port: left-rear side view
  CHARGING_PORT: {
    targetOffset: [-0.92, 0.82, -1.40],
    cameraOffset: [-3.6, 1.4, -2.4],
  },
  // Taillights: rear three-quarter view (-Z rear)
  TAILLIGHTS: {
    targetOffset: [0.0, 0.95, -1.82],
    cameraOffset: [-2.6, 1.8, -4.6],
  },
  // Diffuser: rear low view (-Z rear)
  DIFFUSER: {
    targetOffset: [0.0, 0.32, -1.80],
    cameraOffset: [-2.4, 1.0, -4.2],
  },
  // Headlights: front three-quarter view (+Z front)
  HEADLIGHTS: {
    targetOffset: [0.0, 0.75, 1.78],
    cameraOffset: [-2.6, 1.6, 4.6],
  },
  // Roof: upper three-quarter medium distance view
  ROOF: {
    targetOffset: [0.0, 1.45, -0.30],
    cameraOffset: [-2.4, 3.8, 2.0],
  },
  // Battery: low underbody side view
  BATTERY: {
    targetOffset: [0.0, 0.20, 0.0],
    cameraOffset: [-3.8, 0.8, 1.2],
  },
  // Body: three-quarter side view with visible context (Section 9)
  BODY: {
    targetOffset: [0.0, 0.72, 0.0],
    cameraOffset: [-4.2, 1.8, 2.6],
  },
};

export const PART_INSPECTION_CAMERA_CONFIGS_EV02: Record<
  string,
  {
    targetOffset: [number, number, number];
    cameraOffset: [number, number, number];
  }
> = {
  // Left Front Door: left-front view (+X is left on EV02, exterior viewing from +X)
  DOOR_FL: {
    targetOffset: [0.87, 0.76, 0.21],
    cameraOffset: [3.8, 1.5, 1.8],
  },
  // Right Front Door: right-front view (-X is right on EV02, exterior viewing from -X)
  DOOR_FR: {
    targetOffset: [-0.87, 0.76, 0.21],
    cameraOffset: [-3.8, 1.5, 1.8],
  },
  // Left Rear Door: left-rear view
  DOOR_RL: {
    targetOffset: [0.79, 0.76, -0.69],
    cameraOffset: [3.8, 1.5, -1.8],
  },
  // Right Rear Door: right-rear view
  DOOR_RR: {
    targetOffset: [-0.79, 0.76, -0.69],
    cameraOffset: [-3.8, 1.5, -1.8],
  },
  // Hood: front-upper view
  HOOD: {
    targetOffset: [0.0, 0.80, 1.60],
    cameraOffset: [-2.2, 2.4, 4.6],
  },
  // Windshield: front-upper medium distance view
  WINDSHIELD: {
    targetOffset: [0.0, 1.05, 0.55],
    cameraOffset: [-2.0, 2.4, 4.2],
  },
  // Left Front Wheel
  WHEEL_FL: {
    targetOffset: [0.77, 0.30, 1.37],
    cameraOffset: [3.4, 0.9, 2.6],
  },
  // Right Front Wheel
  WHEEL_FR: {
    targetOffset: [-0.77, 0.30, 1.37],
    cameraOffset: [-3.4, 0.9, 2.6],
  },
  // Left Rear Wheel
  WHEEL_RL: {
    targetOffset: [0.77, 0.30, -1.27],
    cameraOffset: [3.4, 0.9, -2.6],
  },
  // Right Rear Wheel
  WHEEL_RR: {
    targetOffset: [-0.77, 0.30, -1.27],
    cameraOffset: [-3.4, 0.9, -2.6],
  },
  // Charging Port
  CHARGING_PORT: {
    targetOffset: [0.86, 0.80, -1.65],
    cameraOffset: [3.4, 1.4, -2.4],
  },
  // Taillights
  TAILLIGHTS: {
    targetOffset: [0.0, 0.78, -2.42],
    cameraOffset: [-2.6, 1.8, -5.2],
  },
  // Headlights
  HEADLIGHTS: {
    targetOffset: [0.0, 0.68, 2.38],
    cameraOffset: [-2.6, 1.6, 5.2],
  },
  // Roof
  ROOF: {
    targetOffset: [0.0, 1.36, -0.50],
    cameraOffset: [-2.4, 3.8, 2.0],
  },
  // Battery
  BATTERY: {
    targetOffset: [0.0, 0.18, 0.0],
    cameraOffset: [-3.8, 0.8, 1.2],
  },
  // Body
  BODY: {
    targetOffset: [0.0, 0.65, 0.0],
    cameraOffset: [-4.2, 1.8, 2.6],
  },
};

/**
 * Computes part-specific inspection camera preset (Sections 7-14).
 * - Rotates vehicle-local offsets by vehicleYaw so framing is preserved regardless of turntable orientation.
 * - Chooses part-aware viewing side ensuring direct line-of-sight without vehicle body occlusion.
 * - Applies balanced lateral projection offset so the selected part sits squarely
 *   in the left safe area (~28%–38% of viewport width) with clear margins from screen edge and panel.
 * - Leaves the right safe area (65%–95%) open for the inspection detail panel.
 * - Subtly refines focus toward exact 3D inspection location when draftDamage is present.
 */
export function getVehiclePartInspectionPreset(
  partId: string,
  role?: string,
  viewportWidth?: number,
  inspectionPosition?: [number, number, number] | null,
  vehicleYaw?: number,
  vehicleCode?: string | null
): VehicleCameraPreset {
  const isOperations = role === 'STAFF' || role === 'ADMIN';
  const code = resolveVehicleCode(vehicleCode);
  const isEv02 = code === 'EV02';

  // 1. Authoritative Anchor in world space
  const [vx, vy, vz] = getVehicleAnchor(role, code);

  // 2. Part configuration map (EV02 has calibrated custom coordinates)
  const cfgMap = isEv02 ? PART_INSPECTION_CAMERA_CONFIGS_EV02 : PART_INSPECTION_CAMERA_CONFIGS;
  const cfg = cfgMap[partId] || {
    targetOffset: [0.0, 0.72, 0.0],
    cameraOffset: [-4.2, 1.8, 2.6],
  };

  // 3. Current vehicle yaw (default 0.0 for operations, -0.32 for co-owner)
  const defaultYaw = isOperations ? 0.0 : -0.32;
  const yaw = vehicleYaw ?? defaultYaw;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);

  // Rotate local coordinate around Y by vehicleYaw
  const rotY = (x: number, z: number): [number, number] => [
    x * cosY + z * sinY,
    -x * sinY + z * cosY,
  ];

  // 4. Authoritative focus point in vehicle-local space with strict 4-level target priority:
  // 1) exact part anchor / coordinate (inspectionPosition)
  // 2) semantic hitbox center (hitbox.position)
  // 3) fallback calibrated part preset (cfg.targetOffset)
  // 4) vehicle center focus preset ([0.0, 0.8, 0.0])
  const hitboxes = isEv02 ? EV02_SEMANTIC_HITBOXES : SEMANTIC_HITBOX_DEFINITIONS;
  const hitbox = hitboxes.find((h) => h.id === partId);

  const focusLocal: [number, number, number] = inspectionPosition
    ? [inspectionPosition[0], inspectionPosition[1], inspectionPosition[2]]
    : hitbox?.position
    ? [hitbox.position[0], hitbox.position[1], hitbox.position[2]]
    : cfg.targetOffset
    ? cfg.targetOffset
    : [0.0, 0.8, 0.0];

  // 5. Transform focus point to world space
  const [fRotX, fRotZ] = rotY(focusLocal[0], focusLocal[2]);
  const focusWorldPos: [number, number, number] = [
    vx + fRotX,
    vy + focusLocal[1],
    vz + fRotZ,
  ];

  // 6. Camera position in vehicle-local space maintaining exterior line-of-sight
  const relCamX = cfg.cameraOffset[0] - cfg.targetOffset[0];
  const relCamY = cfg.cameraOffset[1] - cfg.targetOffset[1];
  const relCamZ = cfg.cameraOffset[2] - cfg.targetOffset[2];

  const camLocal: [number, number, number] = [
    focusLocal[0] + relCamX,
    focusLocal[1] + relCamY,
    focusLocal[2] + relCamZ,
  ];

  // Transform camera position to world space
  const [cRotX, cRotZ] = rotY(camLocal[0], camLocal[2]);
  const camWorldPos: [number, number, number] = [
    vx + cRotX,
    vy + camLocal[1],
    vz + cRotZ,
  ];

  // 7. Calculate forward view vector (from camera to target)
  const fx = focusWorldPos[0] - camWorldPos[0];
  const fy = focusWorldPos[1] - camWorldPos[1];
  const fz = focusWorldPos[2] - camWorldPos[2];
  const dist = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1.0;
  const forward = [fx / dist, fy / dist, fz / dist];

  // 8. Screen right vector = forward x up [0, 1, 0]
  let rx = -forward[2];
  let rz = forward[0];
  const rlen = Math.sqrt(rx * rx + rz * rz);
  if (rlen > 0.001) {
    rx /= rlen;
    rz /= rlen;
  } else {
    rx = 1;
    rz = 0;
  }

  // 9. Panel-Safe Framing Offset:
  // Both OPERATIONS and CO_OWNER use a fixed right-side detail panel (~360px wide).
  // Shifting target and position along screen-right ensures the focused part
  // appears in the clear center-left region (approx 38%–44% viewport width)
  // and is NEVER hidden, occluded, or clipped under the fixed right panel.
  const lateralFactor = 0.14;
  const lateralOffset = dist * lateralFactor;

  const target: [number, number, number] = [
    focusWorldPos[0] + rx * lateralOffset,
    focusWorldPos[1],
    focusWorldPos[2] + rz * lateralOffset,
  ];

  const position: [number, number, number] = [
    camWorldPos[0] + rx * lateralOffset,
    camWorldPos[1],
    camWorldPos[2] + rz * lateralOffset,
  ];

  return {
    target,
    position,
    minDistance: 2.2,
    maxDistance: 16.0,
    minPolarAngle: 0.35,
    maxPolarAngle: 1.45,
    enableRotate: true,
    enableZoom: true,
    enablePan: true,
    panelSide: 'right',
    panelOffsetX: lateralOffset,
    transitionDuration: 0.65,
  };
}
