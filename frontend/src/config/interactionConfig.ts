/**
 * Reusable Vehicle Interaction Configuration
 * Defines threshold, rotation sensitivity, and damping for 360-degree vehicle rotation
 */
export const VEHICLE_INTERACTION_CONFIG = {
  /** Distance in screen pixels to distinguish an intentional stationary click from a drag/rotation */
  clickDragThresholdPx: 6,

  /** Cooldown window in ms after drag/rotation ends preventing mouseup from triggering clicks */
  dragCooldownMs: 200,

  /** Horizontal drag sensitivity in radians per pixel for 360-degree vehicle turntable rotation */
  rotationSensitivity: 0.0075,

  /** Smoothing damping factor for fluid 60fps inertia during rotation */
  rotationDamping: 15,

  /** Enables full 360-degree vehicle turntable rotation by dragging directly on EV01 */
  enableVehicleRotation: true,

  /** Default initial vehicle yaw for CO_OWNER presentation angle */
  defaultCoOwnerYaw: -0.32,

  /** Default initial vehicle yaw for OPERATIONS presentation angle */
  defaultOperationsYaw: 0.0,
} as const;

export type VehicleInteractionConfig = typeof VEHICLE_INTERACTION_CONFIG;

/**
 * Global Interaction Configuration for EVShare 3D Virtual Garage
 *
 * Centralizes pointer, threshold, drag, and camera interaction policies
 * across all vehicle and garage features.
 */
export const INTERACTION_CONFIG = {
  ...VEHICLE_INTERACTION_CONFIG,

  /**
   * Enables full 360-degree orbit interaction around EV01 in vehicle-focused modes.
   */
  enableVehicleOrbit: true,

  /**
   * Enables mouse wheel zoom with calibrated limits.
   */
  enableWheelZoom: true,

  /**
   * Prevents deselection on secondary right-mouse button actions.
   */
  preventDeselectOnRightDrag: true,

  /**
   * Prevents deselection on middle-mouse button actions.
   */
  preventDeselectOnMiddleDrag: true,

  /**
   * Allows stationary neutral left-clicks to contextually clear active spatial selection.
   */
  neutralLeftClickCanDeselect: true,
} as const;

export type InteractionConfig = typeof INTERACTION_CONFIG;
