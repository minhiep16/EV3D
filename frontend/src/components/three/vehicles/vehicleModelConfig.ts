/**
 * EV01 3D Visual Model Configuration
 *
 * Centralizes model asset paths, fallback hierarchy, and transform configurations.
 * Allows switching between realistic visual GLB and legacy lightweight fallback GLB
 * without modifying business components.
 */

export const EV01_REALISTIC_MODEL_URL = '/models/ev01-realistic.glb';
export const EV01_FALLBACK_MODEL_URL = '/models/ev-car.glb';

export interface VehicleModelTransformConfig {
  scale: [number, number, number];
  rotation: [number, number, number];
  offset: [number, number, number];
}

/**
 * Calibrated transforms for realistic EV01 model:
 * 1:1 real-life automotive dimensions (approx 4.0m length x 1.91m width x 1.54m height)
 * Grounded at Y = 0 (wheel bottom sits on floor at y = 0.14 in world space)
 * Facing forward along +Z axis
 */
export const EV01_REALISTIC_TRANSFORMS: VehicleModelTransformConfig = {
  scale: [1, 1, 1],
  rotation: [0, -Math.PI / 2, 0],
  offset: [0, 0.013, 0.17],
};

/**
 * Transforms for legacy low-poly fallback model
 */
export const EV01_FALLBACK_TRANSFORMS: VehicleModelTransformConfig = {
  scale: [1, 1, 1],
  rotation: [0, 0, 0],
  offset: [0, 0, 0],
};

// Default export for backward compatibility
export const EV01_MODEL_CONFIG = EV01_REALISTIC_TRANSFORMS;

/**
 * Returns the appropriate transform configuration for a given model URL
 */
export function getModelTransformConfig(modelUrl: string): VehicleModelTransformConfig {
  if (modelUrl.includes('ev-car.glb')) {
    return EV01_FALLBACK_TRANSFORMS;
  }
  return EV01_REALISTIC_TRANSFORMS;
}

/**
 * Resolves the active model URL based on available assets and backend configuration.
 * Always prefers the realistic model as the primary EV01 asset.
 */
export function getVehicleModelUrl(backendModelUrl?: string | null): string {
  if (backendModelUrl && backendModelUrl === EV01_REALISTIC_MODEL_URL) {
    return EV01_REALISTIC_MODEL_URL;
  }
  if (backendModelUrl && backendModelUrl !== EV01_FALLBACK_MODEL_URL) {
    return backendModelUrl;
  }
  // Primary default is the realistic EV01 model
  return EV01_REALISTIC_MODEL_URL;
}
