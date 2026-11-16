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

import * as THREE from 'three';
import { VEHICLE_INTERACTION_CONFIG } from './interactionConfig';
import {
  getPartById,
  SEMANTIC_HITBOX_DEFINITIONS,
  EV02_SEMANTIC_HITBOXES,
} from '../data/vehicleParts';
import {
  findCatalogEntryByModel,
  getCatalogEntryById,
} from '../data/vehicleCatalog';
import {
  resolveVehicleCode,
  VEHICLE_MODEL_CONFIGS,
} from '../components/three/vehicles/vehicleModelConfig';
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
export function getVehicleAnchor(role?: string, vehicleIdentifier?: any): [number, number, number] {
  const isOperations = role === 'STAFF' || role === 'ADMIN';
  if (isOperations) {
    return STAFF_GARAGE_LAYOUT.heroAnchor;
  }
  const code = resolveVehicleCode(vehicleIdentifier);
  return getVehicleBaySlot(code, role).position;
}

/**
 * Shared Vehicle Overview Camera Preset Builder
 * Reuses the canonical three-quarter showroom overview camera geometry
 * across both CO_OWNER and STAFF/ADMIN operations mode.
 *
 * Geometric Specifications (derived from authoritative CO_OWNER baseline):
 * - Target: [vx + panelOffsetX, vy + 0.71, vz]
 * - Position: [vx + panelOffsetX - 0.25, vy + 2.21, vz + 10.2 * responsiveFactor]
 * - Viewing Vector: ΔX = -0.25m, ΔY = 1.50m, ΔZ = 10.2m (Distance ~10.31m)
 * - Viewing Angles: Downward pitch ~8.36°, horizontal azimuth ~ -1.40°
 * - FOV: 40°
 * - Distance Constraints: minDistance 5.0m, maxDistance 18.0m
 * - Polar Constraints: min 0.40 rad (~23°), max 1.42 rad (~81°)
 */
export interface SharedVehicleOverviewPresetOptions {
  anchor: [number, number, number];
  panelSide?: 'none' | 'right';
  panelOffsetX?: number;
  responsiveFactor?: number;
  transitionDuration?: number;
}

export function buildSharedVehicleOverviewPreset(
  options: SharedVehicleOverviewPresetOptions
): VehicleCameraPreset {
  const {
    anchor,
    panelSide = 'none',
    panelOffsetX = 0,
    responsiveFactor = 1.0,
    transitionDuration = 0.7,
  } = options;

  const [vx, vy, vz] = anchor;
  const targetX = vx + panelOffsetX;
  const targetY = vy + 1.05;
  const targetZ = vz;

  // Scaled 5% farther along identical viewing vector: target + (prev - target) * 1.05
  // Previous delta: [0.0, 1.543, 9.023] -> Scaled delta: [0.0, 1.620, 9.474]
  const camDistZ = 9.474 * responsiveFactor;
  const posX = targetX;
  const posY = targetY + 1.620;
  const posZ = targetZ + camDistZ;

  return {
    target: [targetX, targetY, targetZ],
    position: [posX, posY, posZ],
    fov: 38,
    minDistance: 6.0,
    maxDistance: 15.0,
    minPolarAngle: 0.40,
    maxPolarAngle: 1.42,
    enableRotate: true,
    enableZoom: true,
    enablePan: true,
    panelSide,
    panelOffsetX: panelOffsetX > 0 ? panelOffsetX : undefined,
    transitionDuration,
  };
}

export interface VehicleFramingProfile {
  modelLength: number;
  modelHeight: number;
  modelWidth: number;
  targetY: number;
  camElevation: number;
  baseDistZ: number;
}

/**
 * Resolves vehicle physical framing profile based on catalog specifications,
 * normalization parameters, and 3D bounding geometry.
 * Adapts camera distance and eye-level elevation for sports cars, sedans, SUVs, and trucks.
 */
export function resolveVehicleFramingProfile(
  vehicleIdentifier?: any,
  role?: string,
  responsiveFactor: number = 1.0
): VehicleFramingProfile {
  const code = resolveVehicleCode(vehicleIdentifier);

  // Extract model name or candidate keywords
  let modelName = '';
  if (vehicleIdentifier && typeof vehicleIdentifier === 'object') {
    modelName = (vehicleIdentifier.model || vehicleIdentifier.name || '').trim();
  }

  // Lookup in central multi-vehicle catalog
  const catalogEntry =
    (modelName ? findCatalogEntryByModel(modelName) : undefined) ||
    getCatalogEntryById(code);

  const modelDef = VEHICLE_MODEL_CONFIGS[code as 'EV01' | 'EV02'];

  // 1. Length in meters
  let length = 4.25; // standard vehicle default
  if (catalogEntry?.normalization?.targetLength) {
    length = catalogEntry.normalization.targetLength;
  } else if (modelDef?.dimensions?.length) {
    length = modelDef.dimensions.length;
  }

  // 2. Height in meters
  let height = 1.50; // standard vehicle default
  const nameLower = (catalogEntry?.displayName || modelName || code).toLowerCase();
  if (nameLower.includes('roadster')) {
    // Low-slung compact sports car (e.g. Tesla Roadster 2008 EV39)
    height = 1.20;
    length = 3.90;
  } else if (nameLower.includes('cybertruck')) {
    // High-clearance pickup truck (e.g. Tesla Cybertruck)
    height = 1.85;
    length = 5.60;
  } else if (nameLower.includes('vf3') || nameLower.includes('vf 3')) {
    // Compact mini-SUV (VinFast VF3)
    height = 1.58;
    length = 3.20;
  } else if (nameLower.includes('mistra') || nameLower.includes('model 3') || nameLower.includes('taycan')) {
    // Aerodynamic sedan
    height = 1.45;
    length = 4.60;
  } else if (modelDef?.dimensions?.height) {
    height = modelDef.dimensions.height;
  }

  // 3. Width in meters
  const width = modelDef?.dimensions?.width || 1.90;

  // Calibrate optical target Y (center of visible vehicle mass)
  const targetY = THREE.MathUtils.clamp(height * 0.52, 0.70, 1.05);

  // Calibrate camera eye-level elevation
  const camElevation = THREE.MathUtils.clamp(height * 1.25, 1.70, 2.25);

  // Calibrate framing distance proportional to vehicle length
  // Front-three-quarter showroom composition: vehicle occupies ~65-75% of available horizontal viewport
  // Tesla Roadster EV39 (3.9m) -> ~6.16m
  // VF3 (3.2m) -> ~5.60m
  // VF8 / Model 3 (4.25m - 4.4m) -> ~6.72m - 6.95m
  // Cybertruck (5.6m) -> ~8.80m
  const baseDistZ = THREE.MathUtils.clamp(length * 1.58 * responsiveFactor, 5.6, 8.8);

  return {
    modelLength: length,
    modelHeight: height,
    modelWidth: width,
    targetY,
    camElevation,
    baseDistZ,
  };
}

/**
 * Evaluates active interaction modes and determines the appropriate camera preset key.
 */
export function resolveActiveCameraPresetKey(
  state: {
    selectedZone?: string | null;
    selectedVehicleId?: string | null;
    selectedVehiclePartId?: string | null;
    selectedVehiclePartCode?: string | null;
    selectedDamageId?: string | null;
    isDamageDetailModalOpen?: boolean;
    isVehicleDetailOpen?: boolean;
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
    isExplorationMode?: boolean;
    role?: string;
  },
  roleParam?: string
): VehiclePresetKey {
  const currentRole = roleParam || state.role;
  const isOperations = currentRole === 'STAFF' || currentRole === 'ADMIN';

  // In STAFF/ADMIN operations mode, preserve the canonical showroom overview preset
  // across all standard vehicle selection, panel toggling, maintenance, charging, and history views.
  // Only explicitly designated inspection modes activate specialized camera positions.
  if (currentRole === 'ADMIN') {
    const adminActiveModule = (state as any).adminActiveModule;
    if (adminActiveModule && adminActiveModule !== 'NONE') {
      return 'VEHICLE_WITH_RIGHT_PANEL';
    }
    // In ADMIN command center, all standard views (overview, gallery, vehicle navigation)
    // strictly use the canonical centered OVERVIEW preset.
    return 'OVERVIEW';
  }

  if (isOperations) {
    if (state.vehicleInspectionMode && (state.selectedVehiclePartCode || state.selectedVehiclePartId)) {
      return 'VEHICLE_PART_INSPECTION';
    }
    if (state.isDamageDetailModalOpen || state.selectedDamageId) {
      return 'VEHICLE_PART_INSPECTION';
    }
    if (state.vehicleBatteryXrayMode) {
      if (state.selectedVehiclePartId === 'BATTERY' || state.selectedVehiclePartCode === 'BATTERY') {
        return 'BATTERY_DETAIL';
      }
      return 'BATTERY_XRAY';
    }
    // In staff mode, selecting/interacting with vehicle or opening right-side panel keeps overview camera stable
    return 'OVERVIEW';
  }

  // Non-operations (CO_OWNER) mode behavior:
  // "Khám phá" (Exploration) is the ONLY operational function allowed to use automatic camera zoom
  if (state.isExplorationMode) {
    if (state.selectedVehiclePartCode || state.selectedVehiclePartId) {
      return 'VEHICLE_PART_INSPECTION';
    }
    // Enter exploration without unnecessary zoom: keep OVERVIEW
    return 'OVERVIEW';
  }

  // Preserve specialized damage inspection focus if damage detail modal is open
  if (state.isDamageDetailModalOpen || state.selectedDamageId) {
    return 'VEHICLE_PART_INSPECTION';
  }

  // Preserve handover inspection checkpoints if in handover/receipt review
  if (state.vehicleHandoverMode || state.vehicleReceiptReviewMode) {
    return 'HANDOVER_INSPECTION';
  }

  // Preserve trip visualization if in trip mode
  if (state.vehicleTripVisualizationMode) {
    return 'VEHICLE_TRIP_VISUALIZATION';
  }
  if (state.vehicleTripStartMode) {
    return 'TRIP_VIEW';
  }

  // All ordinary CO_OWNER operational functions:
  // - Đặt lịch (vehicleBookingMode)
  // - Bảo dưỡng (vehicleMaintenanceMode)
  // - X-Ray pin (vehicleBatteryXrayMode)
  // - Biểu quyết (vehicleVotingMode)
  // - Tranh chấp (activePrimaryPanel === 'DISPUTE')
  // - Nhóm sở hữu (vehicleCoOwnershipMode)
  // - Hợp đồng (activePrimaryPanel === 'CONTRACT')
  // as well as central vehicle selection and operational carousel: all stay on canonical OVERVIEW camera.
  // No automatic camera zoom, movement, rotation or focus transitions.
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
  vehicleCode?: any
): VehicleCameraPreset {
  const isCoOwner = !role || role === 'CO_OWNER';
  const isOperationsRole = role === 'STAFF' || role === 'ADMIN';
  const [vx, vy, vz] = getVehicleAnchor(role, vehicleCode);

  // Responsive distance scale for narrower viewports (< 1280px)
  const responsiveFactor =
    viewportWidth && viewportWidth < 1440
      ? Math.min(1.25, Math.max(1.0, 1440 / viewportWidth))
      : 1.0;

  // Polar constraints: Min ~31° (0.55 rad), Max ~82° (1.43 rad, floor-safe)
  const defaultMinPolar = 0.55;
  const defaultMaxPolar = 1.43;

  // =========================================================================
  // 1. ORIGINAL CO_OWNER CAMERA POLICY (COMPLETELY RESTORED & ISOLATED)
  // Preserves original three-quarter viewing angle, generous room margins,
  // 8.8m distance, target [0.0, 0.85, 1.8], and panel-safe 0.75m lateral offset.
  // =========================================================================
  if (isCoOwner) {
    switch (presetKey) {
      case 'OVERVIEW':
        return {
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

      case 'VEHICLE_FOCUS':
        return {
          target: [vx, vy + 0.85, vz],
          position: [vx - 0.25, vy + 2.05, vz + 7.0],
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

      case 'VEHICLE_WITH_RIGHT_PANEL':
        return {
          target: [vx + 0.75, vy + 0.85, vz],
          position: [vx + 0.45, vy + 2.05, vz + 7.0],
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

      case 'VEHICLE_EXPLORE':
        return {
          target: [vx, vy + 0.95, vz],
          position: [vx, vy + 3.2, vz + 12.0],
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

      case 'VEHICLE_BOOKING': {
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

      case 'TRIP_VIEW':
      case 'VEHICLE_TRIP_VISUALIZATION': {
        const panelOffsetX = 0.85;
        const baseDistZ = 8.6 * responsiveFactor;
        return {
          target: [vx + panelOffsetX, vy + 0.90, vz],
          position: [vx + 0.35, vy + 2.15, vz + baseDistZ],
          fov: 40,
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

      case 'BATTERY_XRAY': {
        const panelOffsetX = 1.35;
        const baseDistZ = 10.6 * responsiveFactor;
        return {
          target: [vx + panelOffsetX, vy + 0.65, vz],
          position: [vx + panelOffsetX, vy + 2.85, vz + baseDistZ],
          minDistance: 4.8,
          maxDistance: 19.0,
          minPolarAngle: 0.62,
          maxPolarAngle: 1.38,
          enableRotate: true,
          enableZoom: true,
          enablePan: true,
          panelSide: 'right',
          panelOffsetX,
          transitionDuration: 0.65,
        };
      }

      case 'BATTERY_DETAIL': {
        const panelOffsetX = 1.15;
        const baseDistZ = 7.2 * responsiveFactor;
        return {
          target: [vx + panelOffsetX, vy + 0.38, vz],
          position: [vx + panelOffsetX, vy + 1.85, vz + baseDistZ],
          minDistance: 3.5,
          maxDistance: 14.0,
          minPolarAngle: 0.70,
          maxPolarAngle: 1.35,
          enableRotate: true,
          enableZoom: true,
          enablePan: true,
          panelSide: 'right',
          panelOffsetX,
          transitionDuration: 0.65,
        };
      }

      case 'CHARGING_OVERVIEW': {
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

      case 'DAMAGE_HISTORY':
      case 'DAMAGE_MAPPING':
      case 'MAINTENANCE':
      case 'VEHICLE_PART_INSPECTION':
      default: {
        return {
          target: [vx + 0.75, vy + 0.85, vz],
          position: [vx + 0.45, vy + 2.05, vz + 7.0],
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
      }
    }
  }

  // =========================================================================
  // 1.5 DEDICATED ADMIN COMMAND CENTER CAMERA POLICY (EXPLICITLY AUTHORIZED)
  // Frontal elevated perspective (elevation 3.85m, downward pitch ~15.2°),
  // balanced wide framing for 3 horizontal rear stations behind hero vehicle,
  // foreground hologram clearance, and smooth right panel transition.
  // =========================================================================
  if (role === 'ADMIN') {
    const isPanelOpen = presetKey === 'VEHICLE_WITH_RIGHT_PANEL';
    const panelOffsetX = isPanelOpen ? 1.15 : 0.0;
    const targetX = panelOffsetX;
    const targetY = 1.05;
    const targetZ = 0.2;
    const posX = panelOffsetX;
    const posY = 3.85;
    const posZ = 10.5 * responsiveFactor;

    return {
      target: [targetX, targetY, targetZ],
      position: [posX, posY, posZ],
      fov: 38,
      minDistance: 6.0,
      maxDistance: 16.0,
      minPolarAngle: 0.35,
      maxPolarAngle: 1.42,
      enableRotate: true,
      enableZoom: true,
      enablePan: true,
      panelSide: isPanelOpen ? 'right' : 'none',
      panelOffsetX: isPanelOpen ? panelOffsetX : undefined,
      transitionDuration: 0.65,
    };
  }

  // =========================================================================
  // 2. STAFF & OPERATIONS CAMERA POLICY (PRESERVED & ISOLATED)
  // Reuses the identical canonical three-quarter showroom overview camera geometry
  // and zoom distance from CO_OWNER mode, with panel-safe lateral clearance.
  // =========================================================================
  const profile = resolveVehicleFramingProfile(vehicleCode, role, responsiveFactor);

  switch (presetKey) {
    case 'OVERVIEW':
    case 'VEHICLE_FOCUS':
    case 'VEHICLE_WITH_RIGHT_PANEL':
      return buildSharedVehicleOverviewPreset({
        anchor: STAFF_GARAGE_LAYOUT.heroAnchor,
        panelSide: 'none',
        responsiveFactor,
        transitionDuration: 0.7,
      });

    case 'VEHICLE_EXPLORE':
    case 'VEHICLE_PART_INSPECTION':
    case 'MAINTENANCE': {
      const panelOffsetX = 0.95;
      const targetX = vx + panelOffsetX;
      const targetY = vy + profile.targetY;
      const targetZ = vz;
      return {
        target: [targetX, targetY, targetZ],
        position: [
          targetX - 0.25,
          targetY + profile.camElevation + 0.35,
          targetZ + profile.baseDistZ + 1.2,
        ],
        minDistance: Math.max(4.0, profile.baseDistZ - 2.0),
        maxDistance: Math.min(22.0, profile.baseDistZ + 10.0),
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
      const panelOffsetX = 0.95;
      const baseDistZ = (profile.baseDistZ + 1.2) * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + profile.targetY + 0.15, vz],
        position: [vx + panelOffsetX * 0.8, vy + profile.camElevation + 1.0, vz + baseDistZ],
        minDistance: 4.5,
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
      const panelOffsetX = 1.35;
      const baseDistZ = 10.6 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 0.65, vz],
        position: [vx + panelOffsetX, vy + 2.85, vz + baseDistZ],
        minDistance: 4.8,
        maxDistance: 19.0,
        minPolarAngle: 0.62,
        maxPolarAngle: 1.38,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'BATTERY_DETAIL': {
      const panelOffsetX = 1.15;
      const baseDistZ = 7.2 * responsiveFactor;
      return {
        target: [vx + panelOffsetX, vy + 0.38, vz],
        position: [vx + panelOffsetX, vy + 1.85, vz + baseDistZ],
        minDistance: 3.5,
        maxDistance: 14.0,
        minPolarAngle: 0.70,
        maxPolarAngle: 1.35,
        enableRotate: true,
        enableZoom: true,
        enablePan: true,
        panelSide: 'right',
        panelOffsetX,
        transitionDuration: 0.65,
      };
    }

    case 'CHARGING_OVERVIEW': {
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

    default:
      return buildSharedVehicleOverviewPreset({
        anchor: STAFF_GARAGE_LAYOUT.heroAnchor,
        panelSide: 'none',
        responsiveFactor,
        transitionDuration: 0.7,
      });
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
  TAILLIGHT: {
    targetOffset: [0.0, 0.95, -1.82],
    cameraOffset: [-2.6, 1.8, -4.6],
  },
  REAR_LIGHTS: {
    targetOffset: [0.0, 0.95, -1.82],
    cameraOffset: [-2.6, 1.8, -4.6],
  },
  TRUNK: {
    targetOffset: [0.0, 0.90, -1.65],
    cameraOffset: [-2.4, 1.8, -4.4],
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
  HEADLIGHT: {
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
  // Side Mirror: left-front side mirror gentle focus
  SIDE_MIRROR: {
    targetOffset: [-0.94, 1.02, 0.66],
    cameraOffset: [-3.9, 1.75, 2.5],
  },
  // Door Handle: left door handle gentle side focus
  DOOR_HANDLE: {
    targetOffset: [-0.90, 0.82, 0.14],
    cameraOffset: [-4.1, 1.55, 1.9],
  },
  // Interior Cabin: upper-front three-quarter view looking into cockpit
  INTERIOR_CABIN: {
    targetOffset: [0.0, 1.16, 0.12],
    cameraOffset: [-3.1, 2.55, 2.9],
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
  TAILLIGHT: {
    targetOffset: [0.0, 0.78, -2.42],
    cameraOffset: [-2.6, 1.8, -5.2],
  },
  REAR_LIGHTS: {
    targetOffset: [0.0, 0.78, -2.42],
    cameraOffset: [-2.6, 1.8, -5.2],
  },
  TRUNK: {
    targetOffset: [0.0, 0.85, -2.15],
    cameraOffset: [-2.4, 1.8, -4.8],
  },
  // Headlights
  HEADLIGHTS: {
    targetOffset: [0.0, 0.68, 2.38],
    cameraOffset: [-2.6, 1.6, 5.2],
  },
  HEADLIGHT: {
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
  // Side Mirror (EV02 +X left side)
  SIDE_MIRROR: {
    targetOffset: [0.92, 0.98, 0.62],
    cameraOffset: [3.9, 1.7, 2.4],
  },
  // Door Handle (EV02 +X left side)
  DOOR_HANDLE: {
    targetOffset: [0.88, 0.78, 0.12],
    cameraOffset: [4.0, 1.5, 1.8],
  },
  // Interior Cabin
  INTERIOR_CABIN: {
    targetOffset: [0.0, 1.12, 0.10],
    cameraOffset: [3.1, 2.5, 2.8],
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
  // For OPERATIONS with right inspection/handover panel (~420px) and CO_OWNER 3D Hotspot Explore mode:
  // Pull camera farther back (1.28x) so vehicle has generous breathing room without aggressive close-up zooming or clipping.
  const distanceScale = isOperations ? 1.28 : 1.18;
  const relCamX = (cfg.cameraOffset[0] - cfg.targetOffset[0]) * distanceScale;
  const relCamY = (cfg.cameraOffset[1] - cfg.targetOffset[1]) * distanceScale;
  const relCamZ = (cfg.cameraOffset[2] - cfg.targetOffset[2]) * distanceScale;

  const camLocal: [number, number, number] = [
    focusLocal[0] + relCamX,
    focusLocal[1] + relCamY,
    focusLocal[2] + relCamZ,
  ];

  // Transform camera position to world space
  const [cRotX, cRotZ] = rotY(camLocal[0], camLocal[2]);
  const camWorldPos: [number, number, number] = [
    vx + cRotX,
    Math.max(vy + 0.75, vy + camLocal[1]), // Floor-safe: camera never dips into or below ground
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
  // OPERATIONS uses a fixed right-side detail panel (~400-440px wide -> 0.24 offset).
  // CO_OWNER 3D Hotspot Explore uses an in-scene 3D floating callout right next to the part (-> gentle 0.08 offset).
  const lateralFactor = isOperations ? 0.24 : 0.08;
  const lateralOffset = dist * lateralFactor;

  const target: [number, number, number] = [
    focusWorldPos[0] + rx * lateralOffset,
    Math.max(vy + 0.45, focusWorldPos[1]),
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
    minDistance: 2.8,
    maxDistance: 18.0,
    minPolarAngle: 0.35,
    maxPolarAngle: 1.40, // Floor-safe: never look upwards from below floor
    enableRotate: true,
    enableZoom: true,
    enablePan: true,
    panelSide: 'right',
    panelOffsetX: lateralOffset,
    transitionDuration: 0.65,
  };
}
