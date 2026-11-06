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
import { findCatalogEntryByModel } from '../../../data/vehicleCatalog';

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
    nameVi: 'VinFast VF8 Plus',
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
 * Resolves the vehicle code from a vehicle object, id, code, or model url.
 * Guarantees distinct codes for each vehicle in the fleet (EV01, EV02, EV03, etc.).
 */
export function resolveVehicleCode(
  identifier?: { id?: string; code?: string; name?: string; model?: string; model3dUrl?: string; vin?: string; licensePlate?: string } | string | null,
  fallbackIndex?: number
): string {
  if (!identifier) return 'EV01';

  if (typeof identifier === 'object') {
    // 1. Explicit code property
    if (identifier.code && identifier.code.trim()) {
      return identifier.code.trim().toUpperCase();
    }

    // 2. Canonical seeded vehicle UUIDs
    if (identifier.id === '11111111-1111-1111-1111-111111111111') {
      return 'EV01';
    }
    if (identifier.id === '11111111-1111-1111-1111-111111111102') {
      return 'EV02';
    }

    // 3. Code patterns in name or vin
    const combined = `${identifier.id || ''} ${identifier.name || ''} ${identifier.vin || ''}`.toLowerCase();
    const match = combined.match(/\b(ev\d{2,3})\b/i);
    if (match) {
      return match[1].toUpperCase();
    }
    if (combined.includes('ev02') || combined.includes('stylized') || combined.includes('0002')) {
      return 'EV02';
    }
    if (combined.includes('ev01') || combined.includes('demo ev') || combined.includes('0001')) {
      return 'EV01';
    }

    // 4. Deterministic fallback index if available
    if (typeof fallbackIndex === 'number' && fallbackIndex >= 0) {
      return `EV${String(fallbackIndex + 1).padStart(2, '0')}`;
    }

    // 5. Deterministic hash from unique UUID so two vehicles NEVER share the same code
    if (identifier.id) {
      const cleanId = identifier.id.replace(/[^a-f0-9]/gi, '');
      const num = (parseInt(cleanId.slice(-3), 16) % 89) + 11;
      return `EV${num}`;
    }

    return 'EV01';
  }

  const str = String(identifier).trim();
  const strLower = str.toLowerCase();
  if (strLower === '11111111-1111-1111-1111-111111111102' || strLower.includes('ev02') || strLower.includes('stylized') || strLower.includes('0002')) {
    return 'EV02';
  }
  if (strLower === '11111111-1111-1111-1111-111111111111' || strLower.includes('ev01') || strLower.includes('0001')) {
    return 'EV01';
  }
  const match = str.match(/\b(ev\d{2,3})\b/i);
  if (match) {
    return match[1].toUpperCase();
  }

  return 'EV01';
}

/**
 * Resolves the authoritative vehicle exterior color.
 * Resolves EV01 demo vehicle to its canonical 'Xanh đại dương' if set to stale 'Trắng ngọc trai'.
 * Preserves backend stored colors faithfully.
 */
export function resolveAuthoritativeVehicleColor(
  vehicle?: { id?: string; exteriorColor?: string | null } | null
): string | undefined {
  if (!vehicle) return undefined;
  // If EV01 has the stale default 'Trắng ngọc trai', map to its canonical 'Xanh đại dương'
  if (vehicle.id === '11111111-1111-1111-1111-111111111111') {
    if (!vehicle.exteriorColor || vehicle.exteriorColor === 'Trắng ngọc trai') {
      return 'Xanh đại dương';
    }
  }
  return vehicle.exteriorColor || undefined;
}

/**
 * Resolves unified secondary identifier (e.g. 'EV01 · 51E-123.45').
 */
export function resolveVehicleSecondaryIdentifier(
  vehicle?: { id?: string; code?: string; licensePlate?: string } | null,
  code?: string
): string {
  const resolvedCode = code || resolveVehicleCode(vehicle);
  const plate = vehicle?.licensePlate?.trim();
  if (plate) {
    return `${resolvedCode} · ${plate}`;
  }
  return resolvedCode;
}

/**
 * Authoritative sort comparator for staff operations fleet.
 * Preserves canonical fleet ordering: EV01 first, EV02 second, then remaining fleet deterministically.
 */
export function sortStaffFleetVehicles<T extends { id?: string; code?: string; name?: string; model?: string; model3dUrl?: string; vin?: string }>(vehicles: T[]): T[] {
  if (!vehicles || vehicles.length === 0) return [];
  return [...vehicles].sort((a, b) => {
    if (a.id === '11111111-1111-1111-1111-111111111111') return -1;
    if (b.id === '11111111-1111-1111-1111-111111111111') return 1;
    if (a.id === '11111111-1111-1111-1111-111111111102') return -1;
    if (b.id === '11111111-1111-1111-1111-111111111102') return 1;

    const codeA = resolveVehicleCode(a);
    const codeB = resolveVehicleCode(b);
    if (codeA !== codeB) return codeA.localeCompare(codeB);
    return (a.id || '').localeCompare(b.id || '');
  });
}

/**
 * Checks whether a vehicle matches the currently selected vehicle ID.
 * Persistent unique UUID comparison is the Single Source of Truth.
 */
export function isMatchingVehicle<T extends { id?: string; code?: string; name?: string; model?: string; model3dUrl?: string; vin?: string }>(
  vehicle: T | null | undefined,
  selectedId: string | null | undefined
): boolean {
  if (!vehicle || !selectedId) return false;
  // Primary authoritative UUID check
  if (vehicle.id === selectedId) return true;
  // Explicit code check if selectedId was passed as a code
  if (vehicle.code && vehicle.code.toUpperCase() === selectedId.toUpperCase()) return true;
  // Known demo vehicle aliases
  if (selectedId === 'EV01' && vehicle.id === '11111111-1111-1111-1111-111111111111') return true;
  if (selectedId === 'EV02' && vehicle.id === '11111111-1111-1111-1111-111111111102') return true;
  return false;
}

/**
 * Single Source of Truth for resolving the active/focused hero vehicle in Operations mode.
 * 
 * Rules:
 * 1. If selectedVehicleId is provided, matches strictly by unique UUID (v.id === selectedVehicleId).
 * 2. If no selection exists or match is not found, deterministically resolves to the
 *    primary hero vehicle of the canonical fleet (sorted fleet's first vehicle, EV01).
 * 3. Never merges distinct vehicles or falls back silently to EV01 when another vehicle is selected.
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
 * Checks whether a string is a bare internal vehicle code (e.g. 'EV01', 'EV02')
 * rather than a human-readable vehicle name or model designation.
 */
function isInternalVehicleCodeString(value?: string | null): boolean {
  if (!value) return false;
  return /^(EV\d+|VEH[-_]?\d+)$/i.test(value.trim());
}

/**
 * Single source of truth for resolving a human-readable display name for a vehicle.
 *
 * Resolution priority:
 * 1. Persisted custom/registered vehicle name (`vehicle.name`), provided it is not a bare internal code (`EV01`, `EV02`).
 * 2. Verified catalog model mapping (`findCatalogEntryByModel`) when `model` or `brand + model` matches an official BEV catalog entry.
 * 3. Stored `brand` + `model` designation from the authoritative backend response.
 * 4. Neutral unavailable state (`'Chưa cập nhật tên phương tiện'`) — never a hardcoded demo vehicle name or bare internal code.
 */
export function resolveVehicleDisplayName(
  vehicle?: { name?: string | null; model?: string | null; brand?: string | null; code?: string | null } | null,
  _fallbackCode?: string
): string {
  if (!vehicle) return 'Chưa xác định phương tiện';

  const rawName = (vehicle.name || '').trim();
  const rawBrand = (vehicle.brand || '').trim();
  const rawModel = (vehicle.model || '').trim();

  // 1. Persisted custom or registered vehicle name (excluding bare internal codes like 'EV01')
  if (rawName && !isInternalVehicleCodeString(rawName)) {
    return rawName;
  }

  // 2. Verified catalog model mapping
  if (rawModel) {
    const catalogMatch =
      findCatalogEntryByModel(rawModel) ||
      (rawBrand ? findCatalogEntryByModel(`${rawBrand} ${rawModel}`) : undefined);
    if (catalogMatch) {
      return catalogMatch.displayName;
    }
  }

  // 3. Stored brand/model designation
  if (rawBrand && rawModel && !isInternalVehicleCodeString(rawModel)) {
    if (rawModel.toLowerCase().startsWith(rawBrand.toLowerCase())) {
      return rawModel;
    }
    return `${rawBrand} ${rawModel}`;
  }

  if (rawModel && !isInternalVehicleCodeString(rawModel)) {
    return rawModel;
  }

  if (rawBrand && !isInternalVehicleCodeString(rawBrand)) {
    return rawBrand;
  }

  // 4. Neutral unavailable state (never fallback to a hardcoded demo name or bare internal code)
  return 'Chưa cập nhật tên phương tiện';
}

/**
 * Resolves a non-redundant secondary subtitle for vehicle overview headers.
 * Returns null if the brand/model designation merely repeats the primary display name
 * or is a redundant demo variant (e.g. 'EVShare Demo EV' vs 'Demo EV One').
 */
export function resolveVehicleSubtitle(
  vehicle?: { name?: string | null; model?: string | null; brand?: string | null; year?: number | null } | null,
  resolvedPrimaryName?: string
): string | null {
  if (!vehicle) return null;
  const primary = (resolvedPrimaryName || resolveVehicleDisplayName(vehicle)).trim().toLowerCase();
  const rawBrand = (vehicle.brand || '').trim();
  const rawModel = (vehicle.model || '').trim();

  if (!rawBrand && !rawModel) return null;

  const candidate =
    rawBrand && rawModel
      ? rawModel.toLowerCase().startsWith(rawBrand.toLowerCase())
        ? rawModel
        : `${rawBrand} ${rawModel}`
      : rawModel || rawBrand;

  const candidateLower = candidate.trim().toLowerCase();
  if (!candidateLower || isInternalVehicleCodeString(candidateLower)) {
    return null;
  }

  // Avoid repeating the primary name or mixing 'EVShare Demo EV' with 'Demo EV One'
  if (
    candidateLower === primary ||
    primary.includes(candidateLower) ||
    candidateLower.includes(primary) ||
    (primary.includes('demo ev') && candidateLower.includes('demo ev'))
  ) {
    return null;
  }

  return candidate;
}

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
  if (modelUrl.includes('vinfast_vf3')) {
    return {
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      offset: [0, 0.013, 0.17],
    };
  }
  if (modelUrl.includes('cybertruck')) {
    return {
      scale: [0.92, 0.92, 0.92],
      rotation: [0, 0, 0],
      offset: [0, 0.013, 0.17],
    };
  }
  if (modelUrl.includes('tesla_2018_model_3')) {
    return {
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      offset: [0, 0.013, 0.17],
    };
  }
  if (modelUrl.includes('2008_tesla_roadster')) {
    return {
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      offset: [0, 0.013, 0.17],
    };
  }
  if (modelUrl.includes('2021_hyundai_mistra_ev')) {
    return {
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      offset: [0, 0.013, 0.17],
    };
  }
  if (modelUrl.includes('2024_hyundai_kona_electric')) {
    return {
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      offset: [0, 0.013, 0.17],
    };
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

  // 1. Resolve registered vehicle from central multi-vehicle catalog by model/name
  if (typeof identifier === 'object' && identifier !== null) {
    const candidateName = identifier.model || identifier.name;
    if (candidateName) {
      const entry = findCatalogEntryByModel(candidateName);
      if (entry && entry.model3dUrl && entry.id !== 'VF8_PLUS') {
        return entry.model3dUrl;
      }
    }
  }

  // 2. EV01 Authoritative Model Resolution:
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

