/**
 * Centralized Multi-Vehicle 3D Model Configuration (Phase 13/14)
 *
 * Dedicated configurations for:
 * - EV01: Realistic automotive digital twin with articulated/fallback assets
 * - EV02: Stylized cartoon EV with verified physical door node articulation
 *
 * Prevents scattering `if (vehicleCode === 'EV02')` across components.
 */

import {
  SEMANTIC_HITBOX_DEFINITIONS,
  EV02_SEMANTIC_HITBOXES,
  SemanticHitboxDef,
} from '../../../data/vehicleParts';

export const EV01_ARTICULATED_MODEL_URL = '/models/ev01-articulated.glb';
export const EV01_REALISTIC_MODEL_URL = '/models/ev01-realistic.glb';
export const EV01_FALLBACK_MODEL_URL = '/models/ev-car.glb';
export const EV02_STYLIZED_MODEL_URL = '/models/ev02-stylized.glb';

export interface VehicleModelTransformConfig {
  scale: [number, number, number];
  rotation: [number, number, number];
  offset: [number, number, number];
}

export interface VehicleModelDefinition {
  vehicleCode: 'EV01' | 'EV02';
  nameVi: string;
  modelPath: string;
  articulatedModelPath?: string;
  fallbackModelPath?: string;
  scale: [number, number, number];
  rotation: [number, number, number];
  offset: [number, number, number];
  dimensions: {
    width: number;
    height: number;
    length: number;
    groundOffset: number;
  };
  hitboxes: SemanticHitboxDef[];
  anchors: {
    CO_OWNER: [number, number, number];
    OPERATIONS: [number, number, number];
  };
  visualBindings: {
    doorNodes: Record<string, string>;
    openAngleRad: Record<string, number>;
  };
}

export const VEHICLE_MODEL_CONFIGS: Record<'EV01' | 'EV02', VehicleModelDefinition> = {
  EV01: {
    vehicleCode: 'EV01',
    nameVi: 'Xe điện thực tế',
    modelPath: EV01_REALISTIC_MODEL_URL,
    articulatedModelPath: EV01_ARTICULATED_MODEL_URL,
    fallbackModelPath: EV01_FALLBACK_MODEL_URL,
    scale: [1, 1, 1],
    rotation: [0, -Math.PI / 2, 0],
    offset: [0, 0.013, 0.17],
    dimensions: {
      width: 1.91,
      height: 1.54,
      length: 4.0,
      groundOffset: 0.14,
    },
    hitboxes: SEMANTIC_HITBOX_DEFINITIONS,
    anchors: {
      CO_OWNER: [0.0, 0.14, 1.8],
      OPERATIONS: [0.0, 0.14, 0.5],
    },
    visualBindings: {
      doorNodes: {
        DOOR_FL: 'Door_FL',
        DOOR_FR: 'Door_FR',
        DOOR_RL: 'Door_RL',
        DOOR_RR: 'Door_RR',
      },
      openAngleRad: {
        DOOR_FL: -0.96,
        DOOR_FR: 0.96,
        DOOR_RL: -0.96,
        DOOR_RR: 0.96,
      },
    },
  },

  EV02: {
    vehicleCode: 'EV02',
    nameVi: 'Xe thử nghiệm tương tác',
    modelPath: EV02_STYLIZED_MODEL_URL,
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
    offset: [0.1775, 0.0, -1.1485],
    dimensions: {
      width: 2.10,
      height: 1.42,
      length: 5.01,
      groundOffset: 0.0,
    },
    hitboxes: EV02_SEMANTIC_HITBOXES,
    anchors: {
      CO_OWNER: [-3.8, 0.14, 3.2],
      OPERATIONS: [-3.8, 0.14, 3.8],
    },
    visualBindings: {
      doorNodes: {
        DOOR_FL: 'wagon_A_DoorL.001',
        DOOR_FR: 'wagon_A_DoorR.001',
        DOOR_RL: 'wagon_A_DoorL2.001',
        DOOR_RR: 'wagon_A_DoorR2.001',
      },
      openAngleRad: {
        DOOR_FL: -0.96,
        DOOR_FR: 0.96,
        DOOR_RL: -0.96,
        DOOR_RR: 0.96,
      },
    },
  },
};

/**
 * Calibrated transforms for realistic EV01 model
 */
export const EV01_REALISTIC_TRANSFORMS: VehicleModelTransformConfig = {
  scale: VEHICLE_MODEL_CONFIGS.EV01.scale,
  rotation: VEHICLE_MODEL_CONFIGS.EV01.rotation,
  offset: VEHICLE_MODEL_CONFIGS.EV01.offset,
};

/**
 * Transforms for legacy low-poly fallback model
 */
export const EV01_FALLBACK_TRANSFORMS: VehicleModelTransformConfig = {
  scale: [1, 1, 1],
  rotation: [0, 0, 0],
  offset: [0, 0, 0],
};

export const EV02_STYLIZED_TRANSFORMS: VehicleModelTransformConfig = {
  scale: VEHICLE_MODEL_CONFIGS.EV02.scale,
  rotation: VEHICLE_MODEL_CONFIGS.EV02.rotation,
  offset: VEHICLE_MODEL_CONFIGS.EV02.offset,
};

// Default export for backward compatibility
export const EV01_MODEL_CONFIG = EV01_REALISTIC_TRANSFORMS;

/**
 * Resolves the vehicle code ('EV01' | 'EV02') from a vehicle object, id, code, or model url.
 */
export function resolveVehicleCode(
  identifier?: { id?: string; code?: string; name?: string; model?: string; model3dUrl?: string; vin?: string } | string | null
): 'EV01' | 'EV02' {
  if (!identifier) return 'EV01';

  if (typeof identifier === 'object') {
    const s = `${identifier.id || ''} ${identifier.code || ''} ${identifier.name || ''} ${identifier.model || ''} ${identifier.model3dUrl || ''} ${identifier.vin || ''}`.toLowerCase();
    if (s.includes('ev02') || s.includes('stylized') || s.includes('0002') || identifier.id === '11111111-1111-1111-1111-111111111102') {
      return 'EV02';
    }
    return 'EV01';
  }

  const str = String(identifier).toLowerCase();
  if (
    str.includes('ev02') ||
    str.includes('stylized') ||
    str === '11111111-1111-1111-1111-111111111102' ||
    str.includes('0002')
  ) {
    return 'EV02';
  }
  return 'EV01';
}

/**
 * Authoritative sort comparator for staff operations fleet.
 * Preserves canonical fleet ordering: EV01 first, EV02 second, then remaining fleet deterministically.
 */
export function sortStaffFleetVehicles<T extends { id?: string; code?: string; name?: string; model?: string; model3dUrl?: string; vin?: string }>(vehicles: T[]): T[] {
  if (!vehicles || vehicles.length === 0) return [];
  return [...vehicles].sort((a, b) => {
    const codeA = resolveVehicleCode(a);
    const codeB = resolveVehicleCode(b);
    if (codeA === 'EV01' && codeB !== 'EV01') return -1;
    if (codeA !== 'EV01' && codeB === 'EV01') return 1;
    if (codeA < codeB) return -1;
    if (codeA > codeB) return 1;
    return (a.id || '').localeCompare(b.id || '');
  });
}

/**
 * Checks whether a vehicle matches the currently selected vehicle ID.
 * Supports primary unique UUID comparison with safe code fallback if selectedId was set to code.
 */
export function isMatchingVehicle<T extends { id?: string; code?: string; name?: string; model?: string; model3dUrl?: string; vin?: string }>(
  vehicle: T | null | undefined,
  selectedId: string | null | undefined
): boolean {
  if (!vehicle || !selectedId) return false;
  if (vehicle.id === selectedId) return true;
  const code = resolveVehicleCode(vehicle);
  return code === selectedId;
}

/**
 * Single Source of Truth for resolving the active/focused hero vehicle in Operations mode.
 * 
 * Rules:
 * 1. If selectedVehicleId is provided, matches by unique UUID (v.id === selectedVehicleId)
 *    or fallback by resolved vehicle code (resolveVehicleCode(v) === selectedVehicleId).
 * 2. If no selection exists or match is not found, deterministically resolves to the
 *    primary hero vehicle of the canonical fleet (sorted fleet's first vehicle, EV01).
 * 3. Never relies on arbitrary backend database array[0] ordering.
 */
export function resolveAuthoritativeHeroVehicle<T extends { id?: string; code?: string; name?: string; model?: string; model3dUrl?: string; vin?: string }>(
  vehicles: T[],
  selectedVehicleId: string | null | undefined
): T | null {
  if (!vehicles || vehicles.length === 0) return null;
  const canonicalFleet = sortStaffFleetVehicles(vehicles);

  if (selectedVehicleId) {
    const match = canonicalFleet.find((v) => isMatchingVehicle(v, selectedVehicleId));
    if (match) return match;
  }

  return canonicalFleet[0] || null;
}

/**
 * Resolves the full vehicle configuration for a vehicle code, id, or vehicle response.
 */
export function getVehicleConfig(
  identifier?: { id?: string; code?: string; name?: string; model?: string; model3dUrl?: string; vin?: string } | string | null
): VehicleModelDefinition {
  const code = resolveVehicleCode(identifier);
  return VEHICLE_MODEL_CONFIGS[code] || VEHICLE_MODEL_CONFIGS.EV01;
}

/**
 * Authoritative alias for resolving model configuration based on vehicle identity/code.
 */
export const resolveVehicleModelConfig = getVehicleConfig;

/**
 * Returns the appropriate transform configuration for a given model URL
 */
export function getModelTransformConfig(modelUrl: string): VehicleModelTransformConfig {
  if (modelUrl.includes('ev02') || modelUrl.includes('stylized')) {
    return EV02_STYLIZED_TRANSFORMS;
  }
  if (modelUrl.includes('ev-car.glb')) {
    return EV01_FALLBACK_TRANSFORMS;
  }
  return EV01_REALISTIC_TRANSFORMS;
}

/**
 * Resolves the active model URL based on available assets and backend configuration.
 * Authoritative Rule:
 * EV01 MUST use primary /models/ev01-realistic.glb with fallback /models/ev-car.glb.
 * EV02 MUST use /models/ev02-stylized.glb.
 * Model choice must be based on vehicle identity/code, never by user, role, or group.
 */
export function getVehicleModelUrl(
  backendModelUrl?: string | null,
  identifier?: { id?: string; code?: string; name?: string; model?: string; model3dUrl?: string; vin?: string } | string | null
): string {
  const code = resolveVehicleCode(identifier || backendModelUrl);
  if (code === 'EV02') {
    return EV02_STYLIZED_MODEL_URL;
  }

  // EV01 Authoritative Model Resolution:
  if (backendModelUrl) {
    if (backendModelUrl.includes('ev02') || backendModelUrl.includes('stylized')) {
      return EV02_STYLIZED_MODEL_URL;
    }
    if (backendModelUrl === EV01_ARTICULATED_MODEL_URL) {
      return EV01_ARTICULATED_MODEL_URL;
    }
    if (backendModelUrl === EV01_REALISTIC_MODEL_URL) {
      return EV01_REALISTIC_MODEL_URL;
    }
    // Prevent stale /models/ev-car.glb from overriding EV01 authoritative primary realistic model
    if (backendModelUrl === EV01_FALLBACK_MODEL_URL || backendModelUrl.includes('ev-car.glb')) {
      return EV01_REALISTIC_MODEL_URL;
    }
    return backendModelUrl;
  }
  return EV01_REALISTIC_MODEL_URL;
}

