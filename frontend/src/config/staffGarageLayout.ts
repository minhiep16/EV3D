/**
 * Centralized Layout Configuration for STAFF / ADMIN Garage (Phase 13C/14 Redesign)
 *
 * Implements the horizontal fleet presentation from reference design:
 * - Large selected vehicle as visual hero in center-foreground turntable
 * - Horizontal row of secondary vehicle previews elevated behind hero
 * - Safe viewport framing accounting for left fleet sidebar and right detail panel
 */

export interface StaffGarageLayoutConfig {
  /** Anchor position of the hero turntable in world space */
  heroAnchor: [number, number, number];
  /** Y elevation of preview vehicle platforms */
  previewRowY: number;
  /** Z depth of preview vehicle lineup (behind hero turntable) */
  previewRowZ: number;
  /** Horizontal X spacing between preview vehicles */
  previewSpacingX: number;
  /** Uniform scale factor for preview vehicles */
  previewScale: number;
  /** Maximum number of preview vehicles visible in horizontal row */
  maxPreviewVehicles: number;
  /** Default camera preset parameters for STAFF / ADMIN */
  camera: {
    target: [number, number, number];
    position: [number, number, number];
    fov: number;
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
  };
}

export const STAFF_GARAGE_LAYOUT: StaffGarageLayoutConfig = {
  heroAnchor: [0.2, 0.14, 0.5],
  previewRowY: 0.52,
  previewRowZ: -3.5,
  previewSpacingX: 2.85,
  previewScale: 0.54,
  maxPreviewVehicles: 6,
  camera: {
    // Optical center of usable 3D area between 240px left sidebar and 360px right panel
    target: [0.2, 0.92, 0.5],
    position: [0.2, 3.2, 9.6],
    fov: 40,
    minDistance: 5.5,
    maxDistance: 18.0,
    minPolarAngle: 0.45,
    maxPolarAngle: 1.42,
  },
};
