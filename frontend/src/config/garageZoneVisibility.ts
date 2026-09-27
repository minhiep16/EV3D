/**
 * Centralized Garage Zone Visibility & Focus State Architecture
 *
 * Rules:
 * 1. Default overview mode:
 *    - All zone labels are visible.
 *    - All compact summaries are visible.
 *    - Vehicle status label (EV01) is visible.
 *    - All platforms remain visible.
 * 2. Focused mode (one zone or EV01 or business mode active):
 *    - Keep selected zone visible with its label and detail panel.
 *    - Hide floating labels of ALL unrelated zones.
 *    - Hide compact summaries of ALL unrelated zones.
 *    - Hide EV01 status label if unrelated or when vehicle panel is open.
 *    - Keep 3D world geometry intact (do NOT unmount the 3D world).
 * 3. Returning to overview mode:
 *    - Restore all zone labels and compact summaries.
 *    - Ensure hidden labels are not rendered or interactive (pointerEvents: none).
 */

import { GarageZone } from '../store/worldStore';

export interface GarageFocusState {
  selectedZone?: GarageZone | null;
  selectedVehicleId?: string | null;
  isVehicleSelected?: boolean;
  vehicleBookingMode?: boolean;
  vehicleCoOwnershipMode?: boolean;
  vehicleHandoverMode?: boolean;
  vehicleReceiptReviewMode?: boolean;
  vehicleTripStartMode?: boolean;
  vehicleTripVisualizationMode?: boolean;
  vehicleDamageMappingMode?: boolean;
  vehicleInspectionMode?: boolean;
  selectedVehiclePartId?: string | null;
}

/**
 * Resolves the currently active focused zone ID, or null if in default overview mode.
 * If EV01 or any vehicle business mode is active, the focused zone resolves to 'VEHICLE'.
 */
export function getActiveFocusedZoneId(state: GarageFocusState): GarageZone | null {
  const isVehicleFocused =
    Boolean(state.selectedVehicleId) ||
    Boolean(state.isVehicleSelected) ||
    state.selectedZone === 'VEHICLE' ||
    Boolean(state.vehicleBookingMode) ||
    Boolean(state.vehicleCoOwnershipMode) ||
    Boolean(state.vehicleHandoverMode) ||
    Boolean(state.vehicleReceiptReviewMode) ||
    Boolean(state.vehicleTripStartMode) ||
    Boolean(state.vehicleTripVisualizationMode) ||
    Boolean(state.vehicleDamageMappingMode) ||
    Boolean(state.vehicleInspectionMode) ||
    Boolean(state.selectedVehiclePartId);

  if (isVehicleFocused) {
    return 'VEHICLE';
  }

  return state.selectedZone || null;
}

/**
 * Checks whether the virtual garage is currently in any focused mode.
 */
export function isGarageZoneFocused(state: GarageFocusState): boolean {
  return getActiveFocusedZoneId(state) !== null;
}

/**
 * Centralized rule: Should floating zone label be displayed for the given zoneId?
 * - In overview mode (!isZoneFocused): true for all accessible zones.
 * - In focused mode: true ONLY if activeFocusedZoneId === zoneId.
 * - When vehicle panel is open on 'VEHICLE' zone, EV01 uses its dedicated panel.
 */
export function shouldShowZoneLabel(
  zoneId: GarageZone,
  state: GarageFocusState
): boolean {
  const activeZoneId = getActiveFocusedZoneId(state);
  // Default overview mode: show all zone labels
  if (!activeZoneId) {
    return true;
  }
  // In focused mode: hide labels of all unrelated zones
  return activeZoneId === zoneId;
}

/**
 * Centralized rule: Should compact summary be displayed for the given zoneId?
 * Follows the same focus isolation rule: visible only in overview or on the selected zone.
 */
export function shouldShowZoneSummary(
  zoneId: GarageZone,
  state: GarageFocusState
): boolean {
  const activeZoneId = getActiveFocusedZoneId(state);
  if (!activeZoneId) {
    return true;
  }
  return activeZoneId === zoneId;
}

/**
 * Centralized rule: Should vehicle floating status pill (VehicleStatusLabel) be displayed?
 * Visible ONLY in overview mode when NO zone, vehicle, or business mode is focused.
 */
export function shouldShowVehicleStatusLabel(state: GarageFocusState): boolean {
  const activeZoneId = getActiveFocusedZoneId(state);
  return activeZoneId === null;
}
