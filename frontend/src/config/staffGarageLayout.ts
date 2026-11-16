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
  heroAnchor: [0.0, 0.14, 0.5],
  previewRowY: 0.52,
  previewRowZ: -3.5,
  previewSpacingX: 2.85,
  previewScale: 0.54,
  maxPreviewVehicles: 4,
  camera: {
    // Authoritative front-facing showroom overview relative to heroAnchor [0.0, 0.14, 0.5]
    // Scaled +5% along identical viewing vector: target + (prev - target) * 1.05
    // target:   [0.0, 1.19, 0.5]
    // position: [0.0, 2.810, 9.974]
    // fov: 38
    target: [0.0, 1.19, 0.5],
    position: [0.0, 2.810, 9.974],
    fov: 38,
    minDistance: 6.0,
    maxDistance: 15.0,
    minPolarAngle: 0.40,
    maxPolarAngle: 1.42,
  },
};
